from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

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
from .serializers import (
    ClienteSerializer,
    VehiculoSerializer,
    OrdenTrabajoSerializer,
    HistorialEstadoOTSerializer,
    UserSimpleSerializer,
    UsuarioTallerSerializer,
    DetalleRepuestoSerializer,
    RegistroHorasSerializer,
    ControlCalidadSerializer,
    ConsultaPublicaOTSerializer,
)


class ClienteViewSet(viewsets.ModelViewSet):
    """
    CRUD para Clientes.
    Soporta búsqueda con ?search= (filtra por RUT, nombre o apellido).
    """
    serializer_class = ClienteSerializer

    def get_queryset(self):
        queryset = Cliente.objects.all().order_by('nombre', 'apellido')
        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(rut__icontains=search) |
                Q(nombre__icontains=search) |
                Q(apellido__icontains=search)
            )
        return queryset


class VehiculoViewSet(viewsets.ModelViewSet):
    """
    CRUD para Vehículos.
    Soporta filtrado por cliente con ?cliente=<id> y búsqueda con ?search= (patente, marca, modelo).
    """
    serializer_class = VehiculoSerializer

    def get_queryset(self):
        queryset = Vehiculo.objects.select_related('cliente').all().order_by('patente')
        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        search = self.request.query_params.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(patente__icontains=search) |
                Q(marca__icontains=search) |
                Q(modelo__icontains=search)
            )
        return queryset


class MecanicoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Endpoint para listar exclusivamente a los mecánicos activos del taller para asignaciones.
    """
    serializer_class = UserSimpleSerializer

    def get_queryset(self):
        return User.objects.filter(
            is_active=True,
            perfil__rol=PerfilUsuario.Rol.MECANICO
        ).select_related('perfil').order_by('first_name', 'username')


class UsuarioTallerViewSet(viewsets.ModelViewSet):
    """
    Gestión de personal del taller (Jefe de Taller, Recepcionista, Mecánico).
    Implementa baja lógica estricta: nunca borra registros físicos de la BD,
    solo deshabilita la cuenta (is_active = False) para preservar trazabilidad histórica.
    """
    serializer_class = UsuarioTallerSerializer

    def get_queryset(self):
        return User.objects.filter(
            perfil__isnull=False
        ).exclude(is_superuser=True).select_related('perfil').order_by('-is_active', 'first_name', 'username')

    def destroy(self, request, *args, **kwargs):
        usuario = self.get_object()
        usuario.is_active = False
        usuario.save(update_fields=['is_active'])
        serializer = self.get_serializer(usuario)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DetalleRepuestoViewSet(viewsets.ModelViewSet):
    """
    CRUD para repuestos e insumos vinculados a las OTs (HU-10).
    Filtro por orden: ?orden=<id>
    """
    serializer_class = DetalleRepuestoSerializer

    def get_queryset(self):
        queryset = DetalleRepuesto.objects.select_related('orden').all().order_by('id')
        orden_id = self.request.query_params.get('orden')
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset


class RegistroHorasViewSet(viewsets.ModelViewSet):
    """
    CRUD para registro de horas hombre (HU-05).
    Filtros soportados: ?orden=<id> y ?mecanico=<id>
    """
    serializer_class = RegistroHorasSerializer

    def get_queryset(self):
        queryset = RegistroHoras.objects.select_related('orden', 'mecanico', 'mecanico__perfil').all().order_by('-fecha', '-id')
        orden_id = self.request.query_params.get('orden')
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        mecanico_id = self.request.query_params.get('mecanico')
        if mecanico_id:
            queryset = queryset.filter(mecanico_id=mecanico_id)
        return queryset


class ControlCalidadViewSet(viewsets.ModelViewSet):
    """
    Inspección y certificación técnica de calidad previa a entrega (HU-07).
    """
    serializer_class = ControlCalidadSerializer

    def get_queryset(self):
        queryset = ControlCalidad.objects.select_related('orden', 'jefe_taller', 'jefe_taller__perfil').all().order_by('-fecha')
        orden_id = self.request.query_params.get('orden')
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset


class OrdenTrabajoViewSet(viewsets.ModelViewSet):
    """
    CRUD principal para Órdenes de Trabajo.
    Filtros soportados vía query params:
      - ?estado=ING / DIA / ESP / REP / CAL / LST / ENT / CAN
      - ?cliente=<id>
      - ?vehiculo=<id>
      - ?mecanico=<id>
      - ?search=<texto> (busca en número OT, patente, cliente)
    """
    serializer_class = OrdenTrabajoSerializer

    def get_queryset(self):
        queryset = OrdenTrabajo.objects.select_related(
            'cliente', 'vehiculo', 'mecanico_asignado', 'creado_por', 'control_calidad'
        ).prefetch_related(
            'historial_estados', 'repuestos_detalle', 'registro_horas'
        ).all().order_by('-numero')

        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado.upper())

        cliente_id = self.request.query_params.get('cliente')
        if cliente_id:
            queryset = queryset.filter(cliente_id=cliente_id)

        vehiculo_id = self.request.query_params.get('vehiculo')
        if vehiculo_id:
            queryset = queryset.filter(vehiculo_id=vehiculo_id)

        mecanico_id = self.request.query_params.get('mecanico')
        if mecanico_id:
            queryset = queryset.filter(mecanico_asignado_id=mecanico_id)

        search = self.request.query_params.get('search', '').strip()
        if search:
            filtro = (
                Q(vehiculo__patente__icontains=search) |
                Q(cliente__nombre__icontains=search) |
                Q(cliente__apellido__icontains=search) |
                Q(cliente__rut__icontains=search)
            )
            if search.isdigit():
                filtro |= Q(numero=int(search))
            queryset = queryset.filter(filtro)

        return queryset

    def perform_create(self, serializer):
        usuario = self.request.user if self.request.user.is_authenticated else None
        serializer.save(creado_por=usuario)

    @action(detail=True, methods=['post'], url_path='cambiar-estado')
    def cambiar_estado(self, request, pk=None):
        """
        Acción personalizada para transicionar de estado con trazabilidad automática y
        validación estricta de la máquina de estados finitos.
        Payload esperado: { "nuevo_estado": "REP", "observacion": "Opcional" }
        """
        orden = self.get_object()
        nuevo_estado = request.data.get('nuevo_estado')
        observacion = request.data.get('observacion', '')

        valid_estados = [choice[0] for choice in OrdenTrabajo.Estado.choices]
        if not nuevo_estado or nuevo_estado not in valid_estados:
            return Response(
                {"error": f"Estado inválido. Opciones válidas: {valid_estados}"},
                status=status.HTTP_400_BAD_REQUEST
            )

        usuario = request.user if request.user.is_authenticated else None
        try:
            orden.registrar_cambio_estado(nuevo_estado, usuario=usuario, observacion=observacion)
        except ValidationError as e:
            mensaje = e.messages[0] if hasattr(e, 'messages') else str(e)
            return Response({"error": mensaje}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(orden, '_prefetched_objects_cache'):
            orden._prefetched_objects_cache = {}
        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='notificar-cliente')
    def notificar_cliente(self, request, pk=None):
        """
        Registra en la bitácora de auditoría que Recepción o el Jefe de Taller
        notificó telefónicamente al cliente que su vehículo está listo para retiro (HU-09).
        """
        orden = self.get_object()
        telefono = orden.cliente.telefono or 'Sin teléfono'
        observacion_extra = request.data.get('observacion', '').strip()
        detalle_obs = (
            observacion_extra
            if observacion_extra
            else f"Notificación telefónica realizada al {telefono}: Vehículo listo para retiro (Total: ${orden.total_a_pagar:,.0f} CLP)"
        )

        usuario = request.user if request.user.is_authenticated else None
        HistorialEstadoOT.objects.create(
            orden=orden,
            estado_anterior=orden.estado,
            estado_nuevo=orden.estado,
            usuario=usuario,
            observacion=detalle_obs[:255],
        )

        if hasattr(orden, '_prefetched_objects_cache'):
            orden._prefetched_objects_cache = {}
        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([AllowAny])
def consulta_publica_cliente(request):
    """
    Endpoint público para consulta de clientes sin fricción ni credenciales (HU-08).
    Query params requeridos: ?rut=15.234.567-8&patente=GHKL-45
    """
    rut = request.query_params.get('rut', '').strip().upper()
    patente = request.query_params.get('patente', '').strip().upper()

    if not rut or not patente:
        return Response(
            {"error": "Debes ingresar tanto el RUT del cliente como la patente del vehículo."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Normalizar RUT con y sin puntos para que funcione con cualquier formato ingresado
    rut_limpio = rut.replace('.', '')
    rut_con_puntos = rut_limpio
    if '-' in rut_limpio:
        cuerpo, dv = rut_limpio.split('-', 1)
        if cuerpo.isdigit() and len(cuerpo) >= 7:
            rut_con_puntos = f"{int(cuerpo):,}".replace(',', '.') + f"-{dv}"

    patente_limpia = patente.replace('-', '').replace(' ', '')

    # Buscar la OT más reciente que coincida con RUT y Patente
    orden = OrdenTrabajo.objects.select_related(
        'cliente', 'vehiculo', 'mecanico_asignado'
    ).prefetch_related('historial_estados').filter(
        Q(cliente__rut__iexact=rut) | Q(cliente__rut__iexact=rut_limpio) | Q(cliente__rut__iexact=rut_con_puntos),
        Q(vehiculo__patente__iexact=patente) | Q(vehiculo__patente__iexact=patente_limpia)
    ).order_by('-numero').first()

    if not orden:
        return Response(
            {"error": "No encontramos una orden con esos datos. Revisa el RUT y la patente e inténtalo otra vez."},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ConsultaPublicaOTSerializer(orden)
    return Response(serializer.data, status=status.HTTP_200_OK)
