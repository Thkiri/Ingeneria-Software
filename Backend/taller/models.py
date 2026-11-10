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
    telefono   = models.CharField(max_length=15, verbose_name="Teléfono de contacto (Obligatorio)")
    email      = models.EmailField(blank=True, verbose_name="Correo electrónico (Opcional)")

    def clean(self):
        super().clean()
        if not self.telefono or not self.telefono.strip():
            raise ValidationError({'telefono': 'El teléfono de contacto del cliente es obligatorio.'})

    def save(self, *args, **kwargs):
        if self.rut:
            self.rut = self.rut.upper().strip()
        if self.telefono:
            self.telefono = self.telefono.strip()
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
    segundo_mecanico    = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="ordenes_apoyo",
        verbose_name="Segundo Mecánico (Apoyo)",
        help_text="Asignado por el Jefe de Taller si la OT requiere apoyo"
    )

    costo_diagnostico    = models.DecimalField(
        max_digits=10, decimal_places=2, default=15000.00,
        verbose_name="Costo Diagnóstico (Neto)",
        help_text="Revisión y diagnóstico inicial ($15.000 siempre, $0 si es garantía)"
    )
    reingresado_por_garantia = models.BooleanField(
        default=False,
        verbose_name="¿Reingreso por garantía?",
        help_text="Fija automáticamente el costo de diagnóstico en $0"
    )
    presupuesto_aprobado = models.BooleanField(
        null=True, blank=True,
        verbose_name="¿Presupuesto Aprobado?",
        help_text="True: Aprobado por cliente, False: Rechazado, None: Pendiente"
    )

    diagnostico          = models.TextField(blank=True, verbose_name="Diagnóstico")
    trabajos_realizados  = models.TextField(blank=True)
    repuestos_requeridos = models.TextField(
        blank=True,
        verbose_name="Repuestos requeridos",
        help_text="Ej: Filtro de aceite x1, Pastillas de freno x2"
    )
    observaciones        = models.TextField(blank=True)

    TRANSICIONES_VALIDAS = {
        Estado.INGRESADA: [Estado.EN_DIAGNOSTICO, Estado.CANCELADA],
        Estado.EN_DIAGNOSTICO: [Estado.ESPERA_REPUESTOS, Estado.EN_REPARACION, Estado.CANCELADA],
        Estado.ESPERA_REPUESTOS: [Estado.EN_REPARACION, Estado.CANCELADA],
        Estado.EN_REPARACION: [Estado.CONTROL_CALIDAD, Estado.CANCELADA],
        Estado.CONTROL_CALIDAD: [Estado.LISTA, Estado.EN_REPARACION],
        Estado.LISTA: [Estado.ENTREGADA],
        Estado.ENTREGADA: [Estado.EN_DIAGNOSTICO], # Solo permitido en reingreso por garantía
        Estado.CANCELADA: [], # Terminal absoluto
    }

    @property
    def total_repuestos_neto(self):
        return sum(r.subtotal for r in self.repuestos_detalle.all())

    @property
    def total_mano_obra_neto(self):
        return sum(h.costo for h in self.registro_horas.all())

    @property
    def subtotal_neto(self):
        return float(self.costo_diagnostico) + float(self.total_repuestos_neto) + float(self.total_mano_obra_neto)

    @property
    def iva_19(self):
        return round(self.subtotal_neto * 0.19, 2)

    @property
    def total_a_pagar(self):
        return round(self.subtotal_neto + self.iva_19, 2)

    def clean(self):
        super().clean()
        if self.vehiculo_id and self.cliente_id:
            if self.vehiculo.cliente_id != self.cliente_id:
                raise ValidationError({
                    'vehiculo': f"El vehículo con patente {self.vehiculo.patente} pertenece a {self.vehiculo.cliente}, no al cliente seleccionado ({self.cliente})."
                })

        # Regla de Garantía: Diagnóstico $0
        if self.reingresado_por_garantia:
            self.costo_diagnostico = 0.00

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
        """
        Método de lógica de negocio para transicionar estado con trazabilidad y
        validación estricta de la máquina de estados finitos según consideraciones_negocio.md.
        """
        if self.estado == nuevo_estado:
            return

        # 1. Regla: Cancelación terminal absoluta
        if self.estado == self.Estado.CANCELADA:
            raise ValidationError("La orden se encuentra Cancelada y no admite modificaciones posteriores.")

        # 2. Regla: Desde ENTREGADA solo se permite EN_DIAGNOSTICO si es reingreso por garantía
        if self.estado == self.Estado.ENTREGADA:
            if nuevo_estado != self.Estado.EN_DIAGNOSTICO or not self.reingresado_por_garantia:
                raise ValidationError(
                    "Una orden Entregada solo puede reabrirse a 'En Diagnóstico' mediante autorización de Reingreso por Garantía."
                )

        # 3. Validar transiciones permitidas
        permitidos = self.TRANSICIONES_VALIDAS.get(self.estado, [])
        if nuevo_estado not in permitidos:
            nombres_permitidos = [dict(self.Estado.choices).get(e, e) for e in permitidos]
            permitidos_str = ", ".join(nombres_permitidos) if nombres_permitidos else "ninguno"
            raise ValidationError(
                f"Transición inválida desde '{self.get_estado_display()}'. Solo se permite avanzar a: {permitidos_str}."
            )

        # 4. Asignación de mecánico para EN_DIAGNOSTICO
        if nuevo_estado == self.Estado.EN_DIAGNOSTICO and not self.mecanico_asignado_id:
            raise ValidationError("Debe asignar un mecánico responsable antes de pasar a 'En Diagnóstico'.")

        # 5. Estado del presupuesto para EN_REPARACION
        if nuevo_estado == self.Estado.EN_REPARACION and self.presupuesto_aprobado is False:
            raise ValidationError("No se puede avanzar a 'En Reparación' con presupuesto rechazado por el cliente.")

        # 6. Certificación de Control de Calidad para LISTA_ENTREGA
        if nuevo_estado == self.Estado.LISTA:
            calidad = getattr(self, 'control_calidad', None)
            if not calidad or not calidad.aprobado:
                raise ValidationError(
                    "No se puede avanzar a 'Lista para Entrega' sin un Control de Calidad aprobado por el Jefe de Taller."
                )

        # Si viene de reingreso por garantía hacia EN_DIAGNOSTICO, resetear costo_diagnostico a 0
        if self.estado == self.Estado.ENTREGADA and nuevo_estado == self.Estado.EN_DIAGNOSTICO and self.reingresado_por_garantia:
            self.costo_diagnostico = 0.00

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


class PerfilUsuario(models.Model):
    """Extensión de perfil para mapear los roles y datos laborales del personal del taller."""
    class Rol(models.TextChoices):
        ADMINISTRADOR = "ADMINISTRADOR", "Administrador"
        JEFE_TALLER   = "JEFE_TALLER", "Jefe de Taller"
        RECEPCIONISTA = "RECEPCIONISTA", "Recepcionista"
        MECANICO      = "MECANICO", "Mecánico"

    usuario = models.OneToOneField(User, on_delete=models.CASCADE, related_name="perfil")
    rut = models.CharField(max_length=12, blank=True, null=True, unique=True, validators=[rut_validator])
    rol = models.CharField(max_length=25, choices=Rol.choices, default=Rol.MECANICO)
    especialidad = models.CharField(max_length=100, blank=True, help_text="Ej: Frenos y Suspensión, Motor General")
    tarifa_hora = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.00, help_text="Tarifa por hora de mano de obra en CLP (HU-05)"
    )

    def __str__(self):
        return f"{self.usuario.get_full_name() or self.usuario.username} ({self.get_rol_display()})"

    class Meta:
        verbose_name = "Perfil de Usuario"
        verbose_name_plural = "Perfiles de Usuario"


class DetalleRepuesto(models.Model):
    """Detalle de piezas e insumos asociados a una OT para costeo (HU-10)."""
    orden = models.ForeignKey(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="repuestos_detalle"
    )
    nombre_pieza = models.CharField(max_length=150, verbose_name="Nombre de la Pieza o Insumo")
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario Neto")

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def __str__(self):
        return f"{self.cantidad}x {self.nombre_pieza} (${self.subtotal:,.0f} CLP) - OT-{self.orden.numero:04d}"

    class Meta:
        verbose_name = "Detalle de Repuesto"
        verbose_name_plural = "Detalles de Repuestos"
        ordering = ["id"]


class RegistroHoras(models.Model):
    """Registro de tiempos y mano de obra imputados a una OT (HU-05)."""
    orden = models.ForeignKey(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="registro_horas"
    )
    mecanico = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="horas_registradas"
    )
    horas = models.DecimalField(max_digits=5, decimal_places=2, help_text="Horas trabajadas (ej: 2.50)")
    tarifa = models.DecimalField(max_digits=10, decimal_places=2, help_text="Tarifa horaria aplicada")
    fecha = models.DateField(auto_now_add=True)
    descripcion = models.CharField(max_length=200, blank=True, help_text="Descripción del trabajo ejecutado")

    @property
    def costo(self):
        return self.horas * self.tarifa

    def clean(self):
        super().clean()
        if self.orden_id and self.orden.estado in [OrdenTrabajo.Estado.INGRESADA, OrdenTrabajo.Estado.EN_DIAGNOSTICO]:
            raise ValidationError(
                "No se pueden registrar las horas en diagnóstico. Las horas se imputan a partir de 'En Reparación'."
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.mecanico.get_full_name() or self.mecanico.username} - {self.horas}h (${self.costo:,.0f} CLP) - OT-{self.orden.numero:04d}"

    class Meta:
        verbose_name = "Registro de Horas Hombre"
        verbose_name_plural = "Registros de Horas Hombre"
        ordering = ["-fecha", "-id"]


class ControlCalidad(models.Model):
    """Inspección técnica final obligatoria previa a la entrega (HU-07)."""
    orden = models.OneToOneField(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="control_calidad"
    )
    jefe_taller = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="controles_calidad"
    )
    aprobado = models.BooleanField(default=False, verbose_name="¿Control Aprobado?")
    observaciones = models.TextField(blank=True, verbose_name="Observaciones de Calidad")
    fecha = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        estado_txt = "APROBADO" if self.aprobado else "PENDIENTE/RECHAZADO"
        return f"Control de Calidad OT-{self.orden.numero:04d}: {estado_txt}"

    class Meta:
        verbose_name = "Control de Calidad"
        verbose_name_plural = "Controles de Calidad"
