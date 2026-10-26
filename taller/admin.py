from django.contrib import admin
from .models import Cliente, Vehiculo, OrdenTrabajo


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
    autocomplete_fields = ("cliente",)
    ordering = ("patente",)


@admin.register(OrdenTrabajo)
class OrdenTrabajoAdmin(admin.ModelAdmin):
    list_display = (
        "numero", "fecha_ingreso", "cliente",
        "vehiculo", "estado", "mecanico_asignado", "fecha_estimada_entrega",
    )
    list_filter = ("estado", "fecha_ingreso", "mecanico_asignado")
    search_fields = ("numero", "cliente__nombre", "cliente__rut", "vehiculo__patente")
    list_editable = ("estado",)
    ordering = ("-numero",)

    autocomplete_fields = ("cliente", "vehiculo")
    readonly_fields = ("creado_por",)

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
        super().save_model(request, obj, form, change)