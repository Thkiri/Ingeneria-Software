from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClienteViewSet,
    VehiculoViewSet,
    OrdenTrabajoViewSet,
    MecanicoViewSet,
    DetalleRepuestoViewSet,
    RegistroHorasViewSet,
    ControlCalidadViewSet,
    consulta_publica_cliente,
)

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'ordenes', OrdenTrabajoViewSet, basename='ordentrabajo')
router.register(r'mecanicos', MecanicoViewSet, basename='mecanico')
router.register(r'repuestos', DetalleRepuestoViewSet, basename='repuesto')
router.register(r'horas', RegistroHorasViewSet, basename='horas')
router.register(r'controles-calidad', ControlCalidadViewSet, basename='control-calidad')

urlpatterns = [
    path('consulta-publica/', consulta_publica_cliente, name='consulta-publica'),
    path('', include(router.urls)),
]
