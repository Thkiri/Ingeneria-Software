from decimal import Decimal

from django.db import models, transaction
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
    ciclo = models.PositiveIntegerField(
        default=1,
        verbose_name="Ciclo de atención",
        help_text="Se incrementa automáticamente en cada reingreso por garantía"
    )
    cobro_parcial_pagado = models.BooleanField(
        default=False,
        verbose_name="¿Cobro parcial pagado?",
        help_text="Requerido antes de cancelar una orden que ya entró en reparación"
    )
    monto_cobro_parcial = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        verbose_name="Monto Cobro Parcial Pagado"
    )
    cancelada_sin_cobro = models.BooleanField(
        default=False,
        verbose_name="¿Cancelada sin cobro?",
        help_text="Se activa al cancelar directamente en INGRESADA (cobro total $0)"
    )

    diagnostico          = models.TextField(blank=True, verbose_name="Diagnóstico")
    trabajos_realizados  = models.TextField(blank=True)
    repuestos_requeridos = models.TextField(
        blank=True,
        verbose_name="Repuestos requeridos",
        help_text="Ej: Filtro de aceite x1, Pastillas de freno x2"
    )
    observaciones        = models.TextField(blank=True)

    ESTADOS_COBRO_CERRADO = (
        Estado.LISTA,
        Estado.ENTREGADA,
        Estado.CANCELADA,
    )

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
    def cobro_bloqueado(self):
        return self.estado in self.ESTADOS_COBRO_CERRADO

    @property
    def repuestos_actuales(self):
        return [r for r in self.repuestos_detalle.all() if r.ciclo == self.ciclo]

    @property
    def horas_actuales(self):
        return [h for h in self.registro_horas.all() if h.ciclo == self.ciclo]

    @property
    def control_calidad(self):
        for cc in self.controles_calidad.all():
            if cc.ciclo == self.ciclo:
                return cc
        return None

    @property
    def total_repuestos_neto(self):
        if self.cancelada_sin_cobro:
            return Decimal("0.00")
        return sum((r.subtotal for r in self.repuestos_actuales), Decimal("0.00"))

    @property
    def total_mano_obra_neto(self):
        if self.cancelada_sin_cobro or self.reingresado_por_garantia:
            return Decimal("0.00")
        return sum((h.costo for h in self.horas_actuales), Decimal("0.00"))

    @property
    def subtotal_neto(self):
        if self.cancelada_sin_cobro:
            return 0.0
        return float(self.costo_diagnostico) + float(self.total_repuestos_neto) + float(self.total_mano_obra_neto)

    @property
    def iva_19(self):
        return round(self.subtotal_neto * 0.19, 2)

    @property
    def total_a_pagar(self):
        return round(self.subtotal_neto + self.iva_19, 2)

    @property
    def cobro_parcial_vigente(self):
        return (
            self.cobro_parcial_pagado
            and self.monto_cobro_parcial is not None
            and self.monto_cobro_parcial == Decimal(f"{self.total_a_pagar:.2f}")
        )

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

    @property
    def cliente_notificado_para_entrega(self):
        if self.estado not in (self.Estado.LISTA, self.Estado.ENTREGADA):
            return False
        historial = sorted(self.historial_estados.all(), key=lambda evento: (evento.fecha, evento.pk), reverse=True)
        if self.estado == self.Estado.ENTREGADA and historial:
            if (historial[0].estado_anterior, historial[0].estado_nuevo) != (self.Estado.LISTA, self.Estado.ENTREGADA):
                return False
            historial = historial[1:]
        for evento in historial:
            if evento.estado_nuevo != self.Estado.LISTA or evento.estado_anterior != self.Estado.LISTA:
                break
            if evento.observacion.startswith(HistorialEstadoOT.PREFIJO_AVISO_RETIRO):
                return True
        return False

    def registrar_cambio_estado(self, nuevo_estado, usuario=None, observacion="", reingreso_garantia=False):
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
        es_reingreso_garantia = (
            self.estado == self.Estado.ENTREGADA
            and nuevo_estado == self.Estado.EN_DIAGNOSTICO
            and (reingreso_garantia or self.reingresado_por_garantia)
        )
        if self.estado == self.Estado.ENTREGADA and not es_reingreso_garantia:
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
        if (
            nuevo_estado == self.Estado.EN_REPARACION
            and self.estado in (self.Estado.EN_DIAGNOSTICO, self.Estado.ESPERA_REPUESTOS)
            and self.presupuesto_aprobado is not True
        ):
            raise ValidationError("Se requiere la aprobación del cliente antes de pasar a 'En Reparación'.")

        if nuevo_estado == self.Estado.ENTREGADA and not self.cliente_notificado_para_entrega:
            raise ValidationError("Registra la llamada al cliente antes de marcar la entrega.")

        # 6. Cancelación desde EN_REPARACION exige cobro parcial pagado por lo consumido
        if nuevo_estado == self.Estado.CANCELADA and self.estado == self.Estado.EN_REPARACION:
            if not self.cobro_parcial_vigente:
                raise ValidationError(
                    "Debe registrar el cobro parcial por lo consumido antes de cancelar una orden en reparación."
                )

        # 7. Exigir Horas Hombre registradas en el ciclo actual para CONTROL_CALIDAD y LISTA_ENTREGA (HU-05 / HU-07)
        if nuevo_estado in [self.Estado.CONTROL_CALIDAD, self.Estado.LISTA]:
            if not self.registro_horas.filter(ciclo=self.ciclo).exists():
                raise ValidationError(
                    "No se puede avanzar sin antes registrar las Horas Hombre trabajadas en la orden."
                )

        # 8. Certificación de Control de Calidad obligatoria para LISTA_ENTREGA (HU-07)
        if nuevo_estado == self.Estado.LISTA:
            calidad = self.control_calidad
            if not calidad or not calidad.aprobado:
                raise ValidationError(
                    "No se puede avanzar a 'Lista para Entrega' sin un Control de Calidad aprobado por el Jefe de Taller."
                )

        with transaction.atomic():
            # Cancelación directa desde INGRESADA sin diagnóstico realizado -> cobro total $0
            if self.estado == self.Estado.INGRESADA and nuevo_estado == self.Estado.CANCELADA:
                self.costo_diagnostico = Decimal("0.00")
                self.cancelada_sin_cobro = True

            # Reingreso por garantía hacia EN_DIAGNOSTICO: abrir nuevo ciclo limpio conservando controles previos
            if es_reingreso_garantia:
                self.reingresado_por_garantia = True
                self.ciclo += 1
                self.costo_diagnostico = Decimal("0.00")
                self.presupuesto_aprobado = None
                self.cobro_parcial_pagado = False
                self.monto_cobro_parcial = None
                self.cancelada_sin_cobro = False

            self._usuario_modifica = usuario
            self._observacion_cambio = observacion
            self.estado = nuevo_estado
            self.save()

            # Persistir snapshot inmutable del cobro al cerrar el ciclo (Entrega o Cancelación)
            if nuevo_estado in (self.Estado.ENTREGADA, self.Estado.CANCELADA):
                tipo_cierre = (
                    CierreCobroOT.TipoCierre.ENTREGA
                    if nuevo_estado == self.Estado.ENTREGADA
                    else CierreCobroOT.TipoCierre.CANCELACION
                )
                CierreCobroOT.objects.update_or_create(
                    orden=self,
                    ciclo=self.ciclo,
                    defaults={
                        "tipo": tipo_cierre,
                        "es_garantia": self.reingresado_por_garantia,
                        "costo_diagnostico": Decimal("0.00") if self.cancelada_sin_cobro else self.costo_diagnostico,
                        "total_repuestos_neto": Decimal(f"{float(self.total_repuestos_neto):.2f}"),
                        "total_mano_obra_neto": Decimal(f"{float(self.total_mano_obra_neto):.2f}"),
                        "subtotal_neto": Decimal(f"{self.subtotal_neto:.2f}"),
                        "iva_19": Decimal(f"{self.iva_19:.2f}"),
                        "total_a_pagar": Decimal(f"{self.total_a_pagar:.2f}"),
                        "cantidad_repuestos": 0 if self.cancelada_sin_cobro else len(self.repuestos_actuales),
                        "cantidad_horas": 0 if self.cancelada_sin_cobro else len(self.horas_actuales),
                        "registrado_por": usuario,
                    },
                )

    def __str__(self):
        return f"OT-{self.numero:04d} | {self.vehiculo.patente} | {self.get_estado_display()}"

    class Meta:
        verbose_name        = "Orden de Trabajo"
        verbose_name_plural = "Órdenes de Trabajo"
        ordering            = ["-numero"]


class HistorialEstadoOT(models.Model):
    PREFIJO_AVISO_RETIRO = "Notificación telefónica realizada"

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
    ciclo = models.PositiveIntegerField(default=1)
    nombre_pieza = models.CharField(max_length=150, verbose_name="Nombre de la Pieza o Insumo")
    cantidad = models.PositiveIntegerField(default=1)
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Precio Unitario Neto")

    @property
    def subtotal(self):
        return self.cantidad * self.precio_unitario

    def clean(self):
        super().clean()
        if self.cantidad is not None and self.cantidad < 1:
            raise ValidationError({"cantidad": "La cantidad debe ser al menos 1."})
        if self.precio_unitario is not None and self.precio_unitario < 0:
            raise ValidationError({"precio_unitario": "El precio unitario debe ser cero o mayor."})
        if self.orden_id and self.orden.cobro_bloqueado:
            raise ValidationError(
                "No se pueden modificar los repuestos de una orden que ya aprobó control de calidad o está cerrada."
            )

    def save(self, *args, **kwargs):
        if self.pk is None and self.orden_id:
            self.ciclo = self.orden.ciclo
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.orden_id and self.orden.cobro_bloqueado:
            raise ValidationError(
                "No se pueden eliminar repuestos de una orden que ya aprobó control de calidad o está cerrada."
            )
        return super().delete(*args, **kwargs)

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
    ciclo = models.PositiveIntegerField(default=1)
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
        if self.orden_id:
            if self.orden.cobro_bloqueado:
                raise ValidationError(
                    "No se pueden modificar las horas hombre de una orden que ya aprobó control de calidad o está cerrada."
                )
            if self.orden.estado in [
                OrdenTrabajo.Estado.INGRESADA,
                OrdenTrabajo.Estado.EN_DIAGNOSTICO,
                OrdenTrabajo.Estado.ESPERA_REPUESTOS,
            ]:
                raise ValidationError(
                    "No se pueden registrar horas antes de 'En Reparación' (ni en diagnóstico ni en espera de repuestos)."
                )
            if self.orden.reingresado_por_garantia:
                self.tarifa = Decimal("0.00")
        if self.horas is not None and self.horas <= 0:
            raise ValidationError({"horas": "Las horas deben ser mayores que cero."})
        if self.tarifa is not None and self.tarifa < 0:
            raise ValidationError({"tarifa": "La tarifa debe ser cero o mayor."})

    def save(self, *args, **kwargs):
        if self.pk is None and self.orden_id:
            self.ciclo = self.orden.ciclo
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.orden_id and self.orden.cobro_bloqueado:
            raise ValidationError(
                "No se pueden eliminar horas hombre de una orden que ya aprobó control de calidad o está cerrada."
            )
        return super().delete(*args, **kwargs)

    def __str__(self):
        return f"{self.mecanico.get_full_name() or self.mecanico.username} - {self.horas}h (${self.costo:,.0f} CLP) - OT-{self.orden.numero:04d}"

    class Meta:
        verbose_name = "Registro de Horas Hombre"
        verbose_name_plural = "Registros de Horas Hombre"
        ordering = ["-fecha", "-id"]


class ControlCalidad(models.Model):
    """Inspección técnica final obligatoria previa a la entrega (HU-07)."""
    orden = models.ForeignKey(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="controles_calidad"
    )
    ciclo = models.PositiveIntegerField(default=1)
    jefe_taller = models.ForeignKey(
        User, on_delete=models.PROTECT, related_name="controles_calidad"
    )
    aprobado = models.BooleanField(default=False, verbose_name="¿Control Aprobado?")
    observaciones = models.TextField(blank=True, verbose_name="Observaciones de Calidad")
    fecha = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.orden_id:
            if self.orden.cobro_bloqueado:
                raise ValidationError(
                    "No se puede modificar el Control de Calidad de una orden lista para entrega o cerrada."
                )
            if self.pk is not None and self.ciclo != self.orden.ciclo:
                raise ValidationError(
                    "No se puede modificar un Control de Calidad perteneciente a un ciclo histórico cerrado."
                )

    def save(self, *args, **kwargs):
        if self.pk is None and self.orden_id:
            self.ciclo = self.orden.ciclo
        self.full_clean()
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        if self.orden_id and (self.orden.cobro_bloqueado or self.ciclo != self.orden.ciclo):
            raise ValidationError(
                "No se puede eliminar el Control de Calidad de una orden lista para entrega, cerrada o de un ciclo histórico."
            )
        return super().delete(*args, **kwargs)

    def __str__(self):
        estado_txt = "APROBADO" if self.aprobado else "PENDIENTE/RECHAZADO"
        return f"Control de Calidad OT-{self.orden.numero:04d} (Ciclo {self.ciclo}): {estado_txt}"

    class Meta:
        verbose_name = "Control de Calidad"
        verbose_name_plural = "Controles de Calidad"
        constraints = [
            models.UniqueConstraint(
                fields=["orden", "ciclo"],
                name="unique_control_calidad_por_ciclo",
            )
        ]


class CierreCobroOT(models.Model):
    """Snapshot inmutable del cobro al cerrar un ciclo de atención (entrega o cancelación)."""
    class TipoCierre(models.TextChoices):
        ENTREGA = "ENT", "Cierre por Entrega"
        CANCELACION = "CAN", "Cierre por Cancelación"

    orden = models.ForeignKey(
        OrdenTrabajo, on_delete=models.CASCADE, related_name="cierres_cobro"
    )
    ciclo = models.PositiveIntegerField(default=1)
    tipo = models.CharField(max_length=3, choices=TipoCierre.choices, default=TipoCierre.ENTREGA)
    es_garantia = models.BooleanField(default=False)
    costo_diagnostico = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_repuestos_neto = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_mano_obra_neto = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    subtotal_neto = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    iva_19 = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    total_a_pagar = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))
    cantidad_repuestos = models.PositiveIntegerField(default=0)
    cantidad_horas = models.PositiveIntegerField(default=0)
    fecha_cierre = models.DateTimeField(auto_now_add=True)
    registrado_por = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="cierres_cobro_registrados"
    )

    def __str__(self):
        return f"Cierre OT-{self.orden.numero:04d} (Ciclo {self.ciclo} - {self.get_tipo_display()}): ${self.total_a_pagar:,.0f} CLP"

    class Meta:
        verbose_name = "Cierre de Cobro"
        verbose_name_plural = "Cierres de Cobro"
        ordering = ["-ciclo", "-fecha_cierre"]
        constraints = [
            models.UniqueConstraint(
                fields=["orden", "ciclo"],
                name="unique_cierre_cobro_por_ciclo",
            )
        ]
