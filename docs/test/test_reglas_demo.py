from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient

from taller.models import Cliente, OrdenTrabajo, Vehiculo


class ReglasDemoTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.mecanico = User.objects.create_user(username="mecanico_qa")
        cls.cliente = Cliente.objects.create(
            nombre="Cliente", apellido="QA", rut="19.222.333-4", telefono="+56988776655"
        )
        cls.vehiculo = Vehiculo.objects.create(
            patente="TEST99", marca="QA", modelo="Demo", anio=2023, cliente=cls.cliente
        )

    def setUp(self):
        self.api = APIClient()

    def crear_orden(self, estado, presupuesto=None):
        return OrdenTrabajo.objects.create(
            estado=estado, presupuesto_aprobado=presupuesto, cliente=self.cliente,
            vehiculo=self.vehiculo, mecanico_asignado=self.mecanico,
        )

    def cambiar_estado(self, orden, estado):
        return self.api.post(
            f"/api/ordenes/{orden.pk}/cambiar-estado/", {"nuevo_estado": estado}, format="json"
        )

    def test_presupuesto_en_diagnostico_y_espera(self):
        for estado in ("DIA", "ESP"):
            for presupuesto, esperado in ((None, 400), (False, 400), (True, 200)):
                with self.subTest(estado=estado, presupuesto=presupuesto):
                    orden = self.crear_orden(estado, presupuesto)
                    self.assertEqual(self.cambiar_estado(orden, "REP").status_code, esperado)
                    orden.refresh_from_db()
                    self.assertEqual(orden.estado, "REP" if esperado == 200 else estado)

    def test_retorno_desde_calidad(self):
        orden = self.crear_orden("CAL")
        self.assertEqual(self.cambiar_estado(orden, "REP").status_code, 200)

    def test_limites_de_horas_y_repuestos(self):
        orden = self.crear_orden("REP", True)
        casos = (
            ("horas", {"mecanico": self.mecanico.pk, "horas": "0.01", "tarifa": 0},
             [("horas", -1), ("horas", 0), ("tarifa", -1)]),
            ("repuestos", {"nombre_pieza": "Pieza QA", "cantidad": 1, "precio_unitario": 0},
             [("cantidad", -1), ("cantidad", 0), ("precio_unitario", -1)]),
        )
        for recurso, valores, invalidos in casos:
            url = f"/api/{recurso}/"
            campos = {"orden": orden.pk, **valores}
            creado = self.api.post(url, campos, format="json")
            self.assertEqual(creado.status_code, 201)
            for campo, valor in invalidos:
                with self.subTest(recurso=recurso, campo=campo, valor=valor):
                    respuesta = self.api.post(url, {**campos, campo: valor}, format="json")
                    self.assertEqual(respuesta.status_code, 400)
                    self.assertIn(campo, respuesta.data)
                    edicion = self.api.patch(f"{url}{creado.data['id']}/", {campo: valor}, format="json")
                    self.assertEqual(edicion.status_code, 400)
                    self.assertIn(campo, edicion.data)

    def test_aviso_requerido_para_entregar(self):
        diagnostico = self.crear_orden("DIA")
        aviso_temprano = self.api.post(f"/api/ordenes/{diagnostico.pk}/notificar-cliente/", {}, format="json")
        self.assertEqual(aviso_temprano.status_code, 400)

        orden = self.crear_orden("LST")
        url = f"/api/ordenes/{orden.pk}/"
        self.assertEqual(self.cambiar_estado(orden, "ENT").status_code, 400)
        self.assertEqual(self.api.patch(url, {"estado": "ENT"}, format="json").status_code, 400)

        self.api.force_authenticate(user=self.mecanico)
        aviso = self.api.post(f"{url}notificar-cliente/", {"observacion": "Llamada QA"}, format="json")
        self.assertEqual(aviso.status_code, 200)
        self.assertTrue(aviso.data["cliente_notificado_para_entrega"])
        self.assertEqual(aviso.data["historial_estados"][0]["usuario"], self.mecanico.pk)
        self.assertEqual(self.cambiar_estado(orden, "ENT").status_code, 200)

        orden.refresh_from_db()
        orden.estado = "CAL"
        orden.save()
        orden.estado = "LST"
        orden.save()
        self.assertEqual(self.cambiar_estado(orden, "ENT").status_code, 400)
