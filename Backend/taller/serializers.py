from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Cliente,
    Vehiculo,
    OrdenTrabajo,
    HistorialEstadoOT,
    PerfilUsuario,
    DetalleRepuesto,
    RegistroHoras,
    ControlCalidad,
)


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    """Serializador para el perfil laboral y rol del personal del taller."""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)

    class Meta:
        model = PerfilUsuario
        fields = ['id', 'rut', 'rol', 'rol_display', 'especialidad', 'tarifa_hora']


class UserSimpleSerializer(serializers.ModelSerializer):
    """Representación resumida de usuarios para asignaciones, roles y auditoría."""
    nombre_completo = serializers.SerializerMethodField()
    rol = serializers.SerializerMethodField()
    rol_display = serializers.SerializerMethodField()
    especialidad = serializers.SerializerMethodField()
    tarifa_hora = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name',
            'nombre_completo', 'rol', 'rol_display', 'especialidad', 'tarifa_hora'
        ]

    def get_nombre_completo(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username

    def get_rol(self, obj):
        return obj.perfil.rol if hasattr(obj, 'perfil') else 'MECANICO'

    def get_rol_display(self, obj):
        return obj.perfil.get_rol_display() if hasattr(obj, 'perfil') else 'Mecánico'

    def get_especialidad(self, obj):
        return obj.perfil.especialidad if hasattr(obj, 'perfil') else ''

    def get_tarifa_hora(self, obj):
        return float(obj.perfil.tarifa_hora) if hasattr(obj, 'perfil') else 0.0


class UsuarioTallerSerializer(serializers.ModelSerializer):
    """
    Serializador integral para crear, editar y habilitar/deshabilitar personal del taller
    (User + PerfilUsuario) con baja lógica (is_active).
    """
    nombre_completo = serializers.SerializerMethodField()
    rut = serializers.CharField( required=False, allow_blank=True, allow_null=True, write_only=True)
    rol = serializers.ChoiceField(choices=PerfilUsuario.Rol.choices, default=PerfilUsuario.Rol.MECANICO, write_only=True)
    especialidad = serializers.CharField(required=False, allow_blank=True, default='', write_only=True)
    tarifa_hora = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00, write_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'is_active',
            'nombre_completo', 'password', 'rut', 'rol', 'especialidad', 'tarifa_hora'
        ]

    def get_nombre_completo(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username

    def to_representation(self, instance):
        data = super().to_representation(instance)
        perfil = getattr(instance, 'perfil', None)
        data['rut'] = perfil.rut if perfil and perfil.rut else ''
        data['rol'] = perfil.rol if perfil else PerfilUsuario.Rol.MECANICO
        data['rol_display'] = perfil.get_rol_display() if perfil else 'Mecánico'
        data['especialidad'] = perfil.especialidad if perfil else ''
        data['tarifa_hora'] = float(perfil.tarifa_hora) if perfil else 0.0
        return data

    def create(self, validated_data):
        rut = validated_data.pop('rut', None) or None
        rol = validated_data.pop('rol', PerfilUsuario.Rol.MECANICO)
        especialidad = validated_data.pop('especialidad', '')
        tarifa_hora = validated_data.pop('tarifa_hora', 0.00)
        password = validated_data.pop('password', None) or 'taller2026'

        user = User(**validated_data)
        user.set_password(password)
        user.save()

        PerfilUsuario.objects.update_or_create(
            usuario=user,
            defaults={
                'rut': rut.upper().strip() if rut else None,
                'rol': rol,
                'especialidad': especialidad.strip(),
                'tarifa_hora': tarifa_hora,
            }
        )
        return user

    def update(self, instance, validated_data):
        rut = validated_data.pop('rut', None)
        rol = validated_data.pop('rol', None)
        especialidad = validated_data.pop('especialidad', None)
        tarifa_hora = validated_data.pop('tarifa_hora', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password and password.strip():
            instance.set_password(password.strip())
        instance.save()

        perfil, _ = PerfilUsuario.objects.get_or_create(usuario=instance)
        if rut is not None:
            perfil.rut = rut.upper().strip() if rut.strip() else None
        if rol is not None:
            perfil.rol = rol
        if especialidad is not None:
            perfil.especialidad = especialidad.strip()
        if tarifa_hora is not None:
            perfil.tarifa_hora = tarifa_hora
        perfil.save()
        instance.perfil = perfil
        return instance


class ClienteSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Cliente."""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'rut', 'nombre', 'apellido', 'telefono', 'email', 'nombre_completo']

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.apellido}".strip()

    def validate_telefono(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError("El teléfono de contacto del cliente es obligatorio.")
        return value.strip()


class VehiculoSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Vehiculo."""
    cliente_detalle = ClienteSerializer(source='cliente', read_only=True)
    descripcion = serializers.SerializerMethodField()

    class Meta:
        model = Vehiculo
        fields = [
            'id', 'patente', 'marca', 'modelo', 'anio',
            'kilometraje', 'cliente', 'cliente_detalle', 'descripcion'
        ]

    def get_descripcion(self, obj):
        return f"{obj.patente} — {obj.marca} {obj.modelo} ({obj.anio})"


class HistorialEstadoOTSerializer(serializers.ModelSerializer):
    """Serializador de auditoría para la línea de tiempo de cambios de estado."""
    estado_anterior_display = serializers.CharField(source='get_estado_anterior_display', read_only=True)
    estado_nuevo_display = serializers.CharField(source='get_estado_nuevo_display', read_only=True)
    usuario_detalle = UserSimpleSerializer(source='usuario', read_only=True)

    class Meta:
        model = HistorialEstadoOT
        fields = [
            'id', 'orden', 'estado_anterior', 'estado_anterior_display',
            'estado_nuevo', 'estado_nuevo_display', 'fecha', 'usuario',
            'usuario_detalle', 'observacion'
        ]
        read_only_fields = ['fecha']


class DetalleRepuestoSerializer(serializers.ModelSerializer):
    """Serializador para el costeo de repuestos de la OT (HU-10)."""
    subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = DetalleRepuesto
        fields = ['id', 'orden', 'nombre_pieza', 'cantidad', 'precio_unitario', 'subtotal']


class RegistroHorasSerializer(serializers.ModelSerializer):
    """Serializador para el registro de horas hombre (HU-05)."""
    costo = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    mecanico_detalle = UserSimpleSerializer(source='mecanico', read_only=True)

    class Meta:
        model = RegistroHoras
        fields = [
            'id', 'orden', 'mecanico', 'mecanico_detalle',
            'horas', 'tarifa', 'fecha', 'descripcion', 'costo'
        ]
        read_only_fields = ['fecha']

    def validate(self, attrs):
        orden = attrs.get('orden') or (self.instance.orden if self.instance else None)
        if orden and orden.estado in [OrdenTrabajo.Estado.INGRESADA, OrdenTrabajo.Estado.EN_DIAGNOSTICO]:
            raise serializers.ValidationError(
                "No se pueden registrar las horas en diagnóstico. Las horas se imputan a partir de 'En Reparación'."
            )
        return attrs


class ControlCalidadSerializer(serializers.ModelSerializer):
    """Serializador para la inspección y certificación técnica de calidad (HU-07)."""
    jefe_taller_detalle = UserSimpleSerializer(source='jefe_taller', read_only=True)

    class Meta:
        model = ControlCalidad
        fields = [
            'id', 'orden', 'jefe_taller', 'jefe_taller_detalle',
            'aprobado', 'observaciones', 'fecha'
        ]
        read_only_fields = ['fecha']

    def validate(self, attrs):
        orden = attrs.get('orden') or (self.instance.orden if self.instance else None)
        aprobado = attrs.get('aprobado')
        if aprobado and orden and not orden.registro_horas.exists():
            raise serializers.ValidationError(
                "No se puede aprobar el Control de Calidad sin que existan Horas Hombre registradas en la orden."
            )
        return attrs


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    """
    Serializador principal para Órdenes de Trabajo.
    Soporta escritura directa con IDs y lectura enriquecida para el Dashboard y Detalle.
    """
    codigo_ot = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cliente_detalle = ClienteSerializer(source='cliente', read_only=True)
    vehiculo_detalle = VehiculoSerializer(source='vehiculo', read_only=True)
    mecanico_detalle = UserSimpleSerializer(source='mecanico_asignado', read_only=True)
    segundo_mecanico_detalle = UserSimpleSerializer(source='segundo_mecanico', read_only=True)
    creado_por_detalle = UserSimpleSerializer(source='creado_por', read_only=True)
    historial_estados = HistorialEstadoOTSerializer(many=True, read_only=True)
    repuestos_detalle = DetalleRepuestoSerializer(many=True, read_only=True)
    registro_horas = RegistroHorasSerializer(many=True, read_only=True)
    control_calidad = ControlCalidadSerializer(read_only=True)
    total_repuestos_neto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_mano_obra_neto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    subtotal_neto = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    iva_19 = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_a_pagar = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrdenTrabajo
        fields = [
            'numero',
            'codigo_ot',
            'fecha_ingreso',
            'fecha_estimada_entrega',
            'estado',
            'estado_display',
            'cliente',
            'cliente_detalle',
            'vehiculo',
            'vehiculo_detalle',
            'creado_por',
            'creado_por_detalle',
            'mecanico_asignado',
            'mecanico_detalle',
            'segundo_mecanico',
            'segundo_mecanico_detalle',
            'costo_diagnostico',
            'reingresado_por_garantia',
            'presupuesto_aprobado',
            'diagnostico',
            'trabajos_realizados',
            'repuestos_requeridos',
            'observaciones',
            'historial_estados',
            'repuestos_detalle',
            'registro_horas',
            'control_calidad',
            'total_repuestos_neto',
            'total_mano_obra_neto',
            'subtotal_neto',
            'iva_19',
            'total_a_pagar',
        ]
        read_only_fields = ['numero', 'fecha_ingreso', 'creado_por']

    def get_codigo_ot(self, obj):
        return f"OT-{obj.numero:04d}"

    def validate(self, attrs):
        """
        Validación de coherencia de negocio (datos.md):
        Garantiza que el vehículo seleccionado pertenezca al cliente de la orden.
        """
        cliente = attrs.get('cliente') or (self.instance.cliente if self.instance else None)
        vehiculo = attrs.get('vehiculo') or (self.instance.vehiculo if self.instance else None)

        if cliente and vehiculo:
            if vehiculo.cliente_id != cliente.id:
                raise serializers.ValidationError({
                    'vehiculo': f"El vehículo patente {vehiculo.patente} pertenece a {vehiculo.cliente}, no al cliente seleccionado ({cliente})."
                })
        return attrs


class ConsultaPublicaOTSerializer(serializers.ModelSerializer):
    """
    Serializador seguro para la consulta pública de clientes (HU-08).
    Entrega exclusivamente datos de avance sin costos internos ni teléfonos ajenos.
    """
    codigo_ot = serializers.SerializerMethodField()
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    patente = serializers.CharField(source='vehiculo.patente', read_only=True)
    marca = serializers.CharField(source='vehiculo.marca', read_only=True)
    modelo = serializers.CharField(source='vehiculo.modelo', read_only=True)
    anio = serializers.IntegerField(source='vehiculo.anio', read_only=True)
    cliente_nombre = serializers.CharField(source='cliente.nombre', read_only=True)
    mecanico_nombre = serializers.SerializerMethodField()
    historial_estados = HistorialEstadoOTSerializer(many=True, read_only=True)

    class Meta:
        model = OrdenTrabajo
        fields = [
            'numero',
            'codigo_ot',
            'estado',
            'estado_display',
            'patente',
            'marca',
            'modelo',
            'anio',
            'cliente_nombre',
            'mecanico_nombre',
            'fecha_ingreso',
            'fecha_estimada_entrega',
            'diagnostico',
            'historial_estados',
        ]

    def get_codigo_ot(self, obj):
        return f"OT-{obj.numero:04d}"

    def get_mecanico_nombre(self, obj):
        if obj.mecanico_asignado:
            return f"{obj.mecanico_asignado.first_name} {obj.mecanico_asignado.last_name}".strip() or obj.mecanico_asignado.username
        return "Por asignar"
