from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClienteViewSet, VehiculoViewSet, OrdenTrabajoViewSet, MecanicoViewSet

router = DefaultRouter()
router.register(r'clientes', ClienteViewSet, basename='cliente')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'ordenes', OrdenTrabajoViewSet, basename='ordentrabajo')
router.register(r'mecanicos', MecanicoViewSet, basename='mecanico')

urlpatterns = [
    path('', include(router.urls)),
]

