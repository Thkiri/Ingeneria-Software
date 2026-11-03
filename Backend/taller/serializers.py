from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Cliente, Vehiculo, OrdenTrabajo, HistorialEstadoOT


class UserSimpleSerializer(serializers.ModelSerializer):
    """Representación resumida de usuarios para asignaciones y auditoría."""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'nombre_completo']

    def get_nombre_completo(self, obj):
        full = f"{obj.first_name} {obj.last_name}".strip()
        return full if full else obj.username


class ClienteSerializer(serializers.ModelSerializer):
    """Serializador para el modelo Cliente."""
    nombre_completo = serializers.SerializerMethodField()

    class Meta:
        model = Cliente
        fields = ['id', 'rut', 'nombre', 'apellido', 'telefono', 'email', 'nombre_completo']

    def get_nombre_completo(self, obj):
        return f"{obj.nombre} {obj.apellido}".strip()


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


class OrdenTrabajoSerializer(serializers.ModelSerializer):
    """
    Serializador principal para Órdenes de Trabajo.
    Soporta escritura directa con IDs y lectura enriquecida para el Dashboard.
    """
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cliente_detalle = ClienteSerializer(source='cliente', read_only=True)
    vehiculo_detalle = VehiculoSerializer(source='vehiculo', read_only=True)
    mecanico_detalle = UserSimpleSerializer(source='mecanico_asignado', read_only=True)
    creado_por_detalle = UserSimpleSerializer(source='creado_por', read_only=True)
    historial_estados = HistorialEstadoOTSerializer(many=True, read_only=True)

    class Meta:
        model = OrdenTrabajo
        fields = [
            'numero',
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
            'diagnostico',
            'trabajos_realizados',
            'repuestos_requeridos',
            'observaciones',
            'historial_estados',
        ]
        read_only_fields = ['numero', 'fecha_ingreso', 'creado_por']

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

