from django.db import models
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import RegexValidator

rut_validator = RegexValidator(
    regex=r'^\d{1,2}\.?\d{3}\.?\d{3}-[\dkK]$',
    message='Formato de RUT chileno inválido (ej: 12.345.678-9 o 12345678-9).'
)

patente_validator = RegexValidator(
    regex=r'^[a-zA-Z0-9]{5,8}$',
    message='La patente debe tener entre 5 y 8 caracteres alfanuméricos (ej: BBCC12 o AA1000).'
)


class Cliente(models.Model):
    rut        = models.CharField(max_length=12, unique=True, validators=[rut_validator])
    nombre     = models.CharField(max_length=100)
    apellido   = models.CharField(max_length=100)
    telefono   = models.CharField(max_length=15, blank=True)
    email      = models.EmailField(blank=True)

    def save(self, *args, **kwargs):
        if self.rut:
            self.rut = self.rut.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.rut})"

    class Meta:
        verbose_name        = "Cliente"
        verbose_name_plural = "Clientes"


class Vehiculo(models.Model):
    patente     = models.CharField(max_length=8, unique=True, validators=[patente_validator])
    marca       = models.CharField(max_length=50)
    modelo      = models.CharField(max_length=50)
    anio        = models.PositiveIntegerField(verbose_name="Año")
    kilometraje = models.PositiveIntegerField(default=0)
    cliente     = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="vehiculos"
    )

    def save(self, *args, **kwargs):
        if self.patente:
            self.patente = self.patente.upper().strip()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.patente} — {self.marca} {self.modelo} ({self.anio})"

    class Meta:
        verbose_name        = "Vehículo"
        verbose_name_plural = "Vehículos"


class OrdenTrabajo(models.Model):

    class Estado(models.TextChoices):
        INGRESADA        = "ING", "Ingresada (Pendiente de Revisión)"
        EN_DIAGNOSTICO   = "DIA", "En Diagnóstico"
        ESPERA_REPUESTOS = "ESP", "Espera Repuestos"
        EN_REPARACION    = "REP", "En Reparación"
        CONTROL_CALIDAD  = "CAL", "Control de Calidad"
        LISTA            = "LST", "Lista para Entregar"
        ENTREGADA        = "ENT", "Entregada"
        CANCELADA        = "CAN", "Cancelada"

    numero               = models.AutoField(primary_key=True)
    fecha_ingreso        = models.DateField(auto_now_add=True, db_index=True)
    fecha_estimada_entrega = models.DateField(null=True, blank=True)
    estado               = models.CharField(
        max_length=3,
        choices=Estado.choices,
        default=Estado.INGRESADA,
        db_index=True,
    )

    cliente             = models.ForeignKey(
        Cliente, on_delete=models.PROTECT, related_name="ordenes"
    )
    vehiculo            = models.ForeignKey(
        Vehiculo, on_delete=models.PROTECT, related_name="ordenes"
    )
    creado_por          = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="ordenes_creadas"
    )
    mecanico_asignado   = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="ordenes_asignadas"
    )

    diagnostico          = models.TextField(blank=True, verbose_name="Diagnóstico")
    trabajos_realizados  = models.TextField(blank=True)
    repuestos_requeridos = models.TextField(
        blank=True,
        verbose_name="Repuestos requeridos",
        help_text="Ej: Filtro de aceite x1, Pastillas de freno x2"
    )
    observaciones        = models.TextField(blank=True)

    def clean(self):
        super().clean()
        if self.vehiculo_id and self.cliente_id:
            if self.vehiculo.cliente_id != self.cliente_id:
                raise ValidationError({
                    'vehiculo': f"El vehículo con patente {self.vehiculo.patente} pertenece a {self.vehiculo.cliente}, no al cliente seleccionado ({self.cliente})."
                })

    def save(self, *args, **kwargs):
        es_nuevo = self.pk is None
        estado_anterior = None
        if not es_nuevo:
            orig = OrdenTrabajo.objects.filter(pk=self.pk).values('estado').first()
            if orig:
                estado_anterior = orig['estado']

        super().save(*args, **kwargs)

        # Registro automático de auditoría en HistorialEstadoOT
        usuario_responsable = getattr(self, '_usuario_modifica', self.creado_por)
        if es_nuevo:
            HistorialEstadoOT.objects.create(
                orden=self,
                estado_anterior="",
                estado_nuevo=self.estado,
                usuario=usuario_responsable,
                observacion="Ingreso inicial al taller",
            )
        elif estado_anterior and estado_anterior != self.estado:
            obs = getattr(self, '_observacion_cambio', "Actualización de estado en el sistema")
            HistorialEstadoOT.objects.create(
                orden=self,
                estado_anterior=estado_anterior,
                estado_nuevo=self.estado,
                usuario=usuario_responsable,
                observacion=obs,
            )

    def registrar_cambio_estado(self, nuevo_estado, usuario=None, observacion=""):
        """Método de lógica de negocio para transicionar estado con trazabilidad."""
        self._usuario_modifica = usuario
        self._observacion_cambio = observacion
        self.estado = nuevo_estado
        self.save()

    def __str__(self):
        return f"OT-{self.numero:04d} | {self.vehiculo.patente} | {self.get_estado_display()}"

    class Meta:
        verbose_name        = "Orden de Trabajo"
        verbose_name_plural = "Órdenes de Trabajo"
        ordering            = ["-numero"]


class HistorialEstadoOT(models.Model):
    orden = models.ForeignKey(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="historial_estados"
    )
    estado_anterior = models.CharField(
        max_length=3, choices=OrdenTrabajo.Estado.choices, blank=True
    )
    estado_nuevo = models.CharField(
        max_length=3, choices=OrdenTrabajo.Estado.choices
    )
    fecha = models.DateTimeField(auto_now_add=True)
    usuario = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    observacion = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"OT-{self.orden.numero:04d}: {self.estado_anterior or 'INICIO'} -> {self.get_estado_nuevo_display()} ({self.fecha:%d/%m/%Y %H:%M})"

    class Meta:
        verbose_name        = "Historial de Estado"
        verbose_name_plural = "Historial de Estados"
        ordering            = ["-fecha"]