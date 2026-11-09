from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
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


class PerfilUsuarioInline(admin.StackedInline):
    model = PerfilUsuario
    can_delete = False
    verbose_name_plural = "Perfil Laboral y Rol del Taller"
    fk_name = "usuario"


class UserAdmin(BaseUserAdmin):
    inlines = (PerfilUsuarioInline,)
    list_display = ("username", "email", "first_name", "last_name", "get_rol", "is_staff")

    @admin.display(description="Rol en el Taller")
    def get_rol(self, obj):
        return obj.perfil.get_rol_display() if hasattr(obj, 'perfil') else "Sin rol"


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ("rut", "nombre", "apellido", "telefono", "email")
    search_fields = ("rut", "nombre", "apellido")
    ordering = ("nombre", "apellido")


@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ("patente", "marca", "modelo", "anio", "kilometraje", "cliente")
    search_fields = ("patente", "marca", "modelo", "cliente__nombre", "cliente__rut")
    list_filter = ("marca", "anio")
    list_select_related = ("cliente",)
    autocomplete_fields = ("cliente",)
    ordering = ("patente",)


class HistorialEstadoInline(admin.TabularInline):
    model = HistorialEstadoOT
    extra = 0
    can_delete = False
    readonly_fields = ("fecha", "estado_anterior", "estado_nuevo", "usuario", "observacion")
    fields = ("fecha", "estado_anterior", "estado_nuevo", "usuario", "observacion")

    def has_add_permission(self, request, obj=None):
        return False


class DetalleRepuestoInline(admin.TabularInline):
    model = DetalleRepuesto
    extra = 1
    fields = ("nombre_pieza", "cantidad", "precio_unitario")


class RegistroHorasInline(admin.TabularInline):
    model = RegistroHoras
    extra = 1
    fields = ("mecanico", "horas", "tarifa", "descripcion")


class ControlCalidadInline(admin.StackedInline):
    model = ControlCalidad
    extra = 0
    can_delete = False
    fields = ("jefe_taller", "aprobado", "observaciones")


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    @admin.display(description="N° Orden", ordering="numero")
    def codigo_ot(self, obj):
        return f"OT-{obj.numero:04d}"

    list_display = (
        "codigo_ot", "fecha_ingreso", "cliente",
        "vehiculo", "estado", "mecanico_asignado", "fecha_estimada_entrega",
    )
    list_filter = ("estado", "fecha_ingreso", "mecanico_asignado")
    list_select_related = ("cliente", "vehiculo", "mecanico_asignado", "creado_por")
    search_fields = ("numero", "cliente__nombre", "cliente__rut", "vehiculo__patente")
    list_editable = ("estado",)
    ordering = ("-numero",)

    autocomplete_fields = ("cliente", "vehiculo")
    readonly_fields = ("creado_por",)
    inlines = [DetalleRepuestoInline, RegistroHorasInline, ControlCalidadInline, HistorialEstadoInline]

    fieldsets = (
        (" Datos de la OT", {
            "fields": (
                "cliente", "vehiculo", "estado", "fecha_estimada_entrega",
                "costo_diagnostico", "reingresado_por_garantia", "presupuesto_aprobado"
            )
        }),
        (" Asignación", {
            "fields": ("creado_por", "mecanico_asignado", "segundo_mecanico"),
        }),
        (" Información Técnica", {
            "fields": ("diagnostico", "trabajos_realizados", "repuestos_requeridos", "observaciones"),
            "classes": ("collapse",),
        }),
    )

    def save_model(self, request, obj, form, change):
        if not obj.pk and not obj.creado_por:
            obj.creado_por = request.user
        obj._usuario_modifica = request.user
        super().save_model(request, obj, form, change)


@admin.register(HistorialEstadoOT)
class HistorialEstadoOTAdmin(admin.ModelAdmin):
    list_display = ("orden", "estado_anterior", "estado_nuevo", "fecha", "usuario")
    list_filter = ("estado_nuevo", "fecha")
    list_select_related = ("orden", "usuario")
    search_fields = ("orden__numero", "orden__vehiculo__patente")
    readonly_fields = ("orden", "estado_anterior", "estado_nuevo", "fecha", "usuario", "observacion")

    def has_add_permission(self, request):
        return False


@admin.register(PerfilUsuario)
class PerfilUsuarioAdmin(admin.ModelAdmin):
    list_display = ("usuario", "rut", "rol", "especialidad", "tarifa_hora")
    list_filter = ("rol",)
    search_fields = ("usuario__username", "usuario__first_name", "usuario__last_name", "rut")


@admin.register(DetalleRepuesto)
class DetalleRepuestoAdmin(admin.ModelAdmin):
    list_display = ("orden", "nombre_pieza", "cantidad", "precio_unitario", "subtotal")
    search_fields = ("orden__numero", "nombre_pieza")


@admin.register(RegistroHoras)
class RegistroHorasAdmin(admin.ModelAdmin):
    list_display = ("orden", "mecanico", "horas", "tarifa", "fecha", "costo")
    list_filter = ("fecha", "mecanico")
    search_fields = ("orden__numero", "mecanico__username")


@admin.register(ControlCalidad)
class ControlCalidadAdmin(admin.ModelAdmin):
    list_display = ("orden", "jefe_taller", "aprobado", "fecha")
    list_filter = ("aprobado", "fecha")
    search_fields = ("orden__numero", "jefe_taller__username")
