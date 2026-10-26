from django.db import models
from django.contrib.auth.models import User

class Cliente(models.Model):
    rut        = models.CharField(max_length=12, unique=True)
    nombre     = models.CharField(max_length=100)
    apellido   = models.CharField(max_length=100)
    telefono   = models.CharField(max_length=15, blank=True)
    email      = models.EmailField(blank=True)

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.rut})"

    class Meta:
        verbose_name        = "Cliente"
        verbose_name_plural = "Clientes"

class Vehiculo(models.Model):
    patente     = models.CharField(max_length=8, unique=True)
    marca       = models.CharField(max_length=50)
    modelo      = models.CharField(max_length=50)
    anio        = models.PositiveIntegerField(verbose_name="Año")
    kilometraje = models.PositiveIntegerField(default=0)
    cliente     = models.ForeignKey(
        Cliente, on_delete=models.CASCADE, related_name="vehiculos"
    )

    def __str__(self):
        return f"{self.patente} — {self.marca} {self.modelo} ({self.anio})"

    class Meta:
        verbose_name        = "Vehículo"
        verbose_name_plural = "Vehículos"

class OrdenTrabajo(models.Model):

    class Estado(models.TextChoices):
        INGRESADA        = "ING", "Ingresada"
        EN_DIAGNOSTICO   = "DIA", "En Diagnóstico"
        ESPERA_REPUESTOS = "ESP", "Espera Repuestos"
        EN_REPARACION    = "REP", "En Reparación"
        CONTROL_CALIDAD  = "CAL", "Control de Calidad"
        LISTA            = "LST", "Lista para Entregar"
        ENTREGADA        = "ENT", "Entregada"
        CANCELADA        = "CAN", "Cancelada"

    numero               = models.AutoField(primary_key=True)
    fecha_ingreso        = models.DateField(auto_now_add=True)
    fecha_estimada_entrega = models.DateField(null=True, blank=True)
    estado               = models.CharField(
        max_length=3,
        choices=Estado.choices,
        default=Estado.INGRESADA,
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

    def __str__(self):
        return f"OT-{self.numero:04d} | {self.vehiculo.patente} | {self.get_estado_display()}"

    class Meta:
        verbose_name        = "Orden de Trabajo"
        verbose_name_plural = "Órdenes de Trabajo"
        ordering            = ["-numero"]