from django.contrib import admin
from .models import Cliente, Vehiculo, OrdenTrabajo, HistorialEstadoOT


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
    inlines = [HistorialEstadoInline]

    fieldsets = (
        (" Datos de la OT", {
            "fields": ("cliente", "vehiculo", "estado", "fecha_estimada_entrega")
        }),
        (" Asignación", {
            "fields": ("creado_por", "mecanico_asignado"),
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