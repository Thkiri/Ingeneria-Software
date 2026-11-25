from decimal import Decimal

from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.db.models import F, Q
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError as DRFValidationError
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
        queryset = DetalleRepuesto.objects.select_related('orden').filter(
            ciclo=F('orden__ciclo')
        ).order_by('id')
        orden_id = self.request.query_params.get('orden')
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        return queryset

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ValidationError as e:
            mensaje = e.messages[0] if hasattr(e, 'messages') else str(e)
            raise DRFValidationError({"error": mensaje})


class RegistroHorasViewSet(viewsets.ModelViewSet):
    """
    CRUD para registro de horas hombre (HU-05).
    Filtros soportados: ?orden=<id> y ?mecanico=<id>
    """
    serializer_class = RegistroHorasSerializer

    def get_queryset(self):
        queryset = RegistroHoras.objects.select_related(
            'orden', 'mecanico', 'mecanico__perfil'
        ).filter(ciclo=F('orden__ciclo')).order_by('-fecha', '-id')
        orden_id = self.request.query_params.get('orden')
        if orden_id:
            queryset = queryset.filter(orden_id=orden_id)
        mecanico_id = self.request.query_params.get('mecanico')
        if mecanico_id:
            queryset = queryset.filter(mecanico_id=mecanico_id)
        return queryset

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ValidationError as e:
            mensaje = e.messages[0] if hasattr(e, 'messages') else str(e)
            raise DRFValidationError({"error": mensaje})


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

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ValidationError as e:
            mensaje = e.messages[0] if hasattr(e, 'messages') else str(e)
            raise DRFValidationError({"error": mensaje})


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
        ).prefetch_related(
            'historial_estados', 'repuestos_detalle', 'registro_horas', 'controles_calidad', 'cierres_cobro'
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
        reingreso_garantia = bool(request.data.get('reingreso_garantia', False))
        try:
            orden.registrar_cambio_estado(
                nuevo_estado,
                usuario=usuario,
                observacion=observacion,
                reingreso_garantia=reingreso_garantia,
            )
        except ValidationError as e:
            mensaje = e.messages[0] if hasattr(e, 'messages') else str(e)
            return Response({"error": mensaje}, status=status.HTTP_400_BAD_REQUEST)

        if hasattr(orden, '_prefetched_objects_cache'):
            orden._prefetched_objects_cache = {}
        serializer = self.get_serializer(orden)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='reingreso-garantia')
    def reingreso_garantia(self, request, pk=None):
        """
        Reabre de forma atómica una orden Entregada a 'En Diagnóstico' por garantía
        (diagnóstico $0, mano de obra $0, nuevo ciclo limpio preservando controles previos).
        """
        orden = self.get_object()
        observacion = request.data.get(
            'observacion',
            'Reingreso por garantía autorizado por Jefe de Taller (Diagnóstico $0, MO $0)',
        )
        if not isinstance(observacion, str):
            return Response({"error": "La observación debe ser texto."}, status=status.HTTP_400_BAD_REQUEST)

        usuario = request.user if request.user.is_authenticated else None
        try:
            orden.registrar_cambio_estado(
                OrdenTrabajo.Estado.EN_DIAGNOSTICO,
                usuario=usuario,
                observacion=observacion.strip() or 'Reingreso por garantía autorizado',
                reingreso_garantia=True,
            )
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
        if orden.estado != OrdenTrabajo.Estado.LISTA:
            return Response(
                {"error": "Solo puedes registrar el aviso cuando la orden está lista para entrega."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        observacion_extra = request.data.get('observacion', '')
        if not isinstance(observacion_extra, str):
            return Response({"error": "La observación debe ser texto."}, status=status.HTTP_400_BAD_REQUEST)

        detalle_obs = f"{HistorialEstadoOT.PREFIJO_AVISO_RETIRO}: vehículo listo para retiro."
        if observacion_extra.strip():
            detalle_obs += f" {observacion_extra.strip()}"

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

    @action(detail=True, methods=['post'], url_path='registrar-cobro-parcial')
    def registrar_cobro_parcial(self, request, pk=None):
        """
        Registra el cobro parcial pagado por lo consumido hasta el momento
        para habilitar la cancelación de una orden que ya se encuentra en reparación.
        """
        orden = self.get_object()
        if orden.estado != OrdenTrabajo.Estado.EN_REPARACION:
            return Response(
                {"error": "El cobro parcial por cancelación solo aplica cuando la orden está 'En Reparación'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        observacion_extra = request.data.get('observacion', '')
        if not isinstance(observacion_extra, str):
            return Response({"error": "La observación debe ser texto."}, status=status.HTTP_400_BAD_REQUEST)

        monto = Decimal(f"{orden.total_a_pagar:.2f}")
        orden.cobro_parcial_pagado = True
        orden.monto_cobro_parcial = monto
        orden.save(update_fields=['cobro_parcial_pagado', 'monto_cobro_parcial'])

        detalle_obs = f"Cobro parcial registrado y pagado (${monto:,.0f} CLP)."
        if observacion_extra.strip():
            detalle_obs += f" {observacion_extra.strip()}"

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


@api_view(['POST'])
@permission_classes([AllowAny])
def login_taller(request):
    """
    Autenticación real contra la tabla auth_user + PerfilUsuario de Django.
    Permite ingresar a cualquier usuario activo creado en el sistema (incluyendo Personal / Usuarios).
    """
    username = (request.data.get('username') or '').strip()
    password = request.data.get('password') or ''

    if not username or not password:
        return Response(
            {"error": "Debes ingresar usuario y contraseña."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = User.objects.select_related('perfil').filter(username__iexact=username).first()
    if not user or not user.check_password(password):
        return Response(
            {"error": "Usuario o contraseña incorrectos."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    if not user.is_active:
        return Response(
            {"error": "Esta cuenta se encuentra deshabilitada. Contacta al Jefe de Taller."},
            status=status.HTTP_403_FORBIDDEN,
        )

    perfil = getattr(user, 'perfil', None)
    rol_bd = perfil.rol if perfil else (PerfilUsuario.Rol.ADMINISTRADOR if user.is_superuser else PerfilUsuario.Rol.MECANICO)

    if rol_bd in (PerfilUsuario.Rol.ADMINISTRADOR, PerfilUsuario.Rol.JEFE_TALLER):
        rol_ui = 'JEFE_TALLER'
        rol_label = 'Administrador' if rol_bd == PerfilUsuario.Rol.ADMINISTRADOR else 'Jefe de taller'
        vista_inicial = 'dashboard'
    elif rol_bd == PerfilUsuario.Rol.RECEPCIONISTA:
        rol_ui = 'RECEPCIONISTA'
        rol_label = 'Recepción'
        vista_inicial = 'recepcion-inicio'
    else:
        rol_ui = 'MECANICO'
        rol_label = 'Mecánico'
        vista_inicial = 'mecanico-ordenes'

    nombre = f"{user.first_name} {user.last_name}".strip() or user.username
    partes = nombre.split()
    iniciales = (partes[0][0] + (partes[1][0] if len(partes) > 1 else partes[0][1:2])).upper()

    return Response({
        'id': user.id,
        'username': user.username,
        'nombre': nombre,
        'iniciales': iniciales,
        'rol': rol_ui,
        'rol_bd': rol_bd,
        'rolLabel': rol_label,
        'especialidad': perfil.especialidad if perfil else '',
        'tarifa_hora': float(perfil.tarifa_hora) if perfil else 0.0,
        'vistaInicial': vista_inicial,
    }, status=status.HTTP_200_OK)
