from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Cliente, Vehiculo, OrdenTrabajo, HistorialEstadoOT
from .serializers import (
    ClienteSerializer,
    VehiculoSerializer,
    OrdenTrabajoSerializer,
    HistorialEstadoOTSerializer,
    UserSimpleSerializer,
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
    Endpoint de solo lectura para listar mecánicos y técnicos disponibles para asignación.
    """
    serializer_class = UserSimpleSerializer
    queryset = User.objects.filter(is_active=True).order_by('username')


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
            'cliente', 'vehiculo', 'mecanico_asignado', 'creado_por'
        ).prefetch_related('historial_estados').all().order_by('-numero')

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
            # Si el texto es numérico, intenta filtrar también por número de OT
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
        Acción personalizada para transicionar de estado con trazabilidad automática.
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
        orden.registrar_cambio_estado(nuevo_estado, usuario=usuario, observacion=observacion)

        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_200_OK)
