from django.test import TestCase
from rest_framework.test import APIClient


class TecniMotorSprint4E2ETests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_flujo_completo_y_cruds_sprint4(self):
        # 1. CRUD Usuarios + Baja Lógica (is_active)
        res_u = self.client.post('/api/usuarios/', {
            'username': 'test.mecanico',
            'first_name': 'Test',
            'last_name': 'Mecanico',
            'rut': '18.111.222-3',
            'rol': 'MECANICO',
            'especialidad': 'Suspension',
            'tarifa_hora': 16000,
        }, format='json')
        self.assertEqual(res_u.status_code, 201)
        u_id = res_u.data['id']

        res_u_off = self.client.patch(f'/api/usuarios/{u_id}/', {'is_active': False}, format='json')
        self.assertEqual(res_u_off.status_code, 200)
        self.assertFalse(res_u_off.data['is_active'])

        res_u_on = self.client.patch(f'/api/usuarios/{u_id}/', {'is_active': True, 'tarifa_hora': 17500}, format='json')
        self.assertEqual(res_u_on.status_code, 200)
        self.assertTrue(res_u_on.data['is_active'])
        self.assertEqual(res_u_on.data['tarifa_hora'], 17500.0)

        # 2. CRUD Clientes + Teléfono Obligatorio / Correo Opcional
        res_c_bad = self.client.post('/api/clientes/', {
            'rut': '19.222.333-4',
            'nombre': 'Ana',
            'apellido': 'Silva',
            'telefono': '',
        }, format='json')
        self.assertEqual(res_c_bad.status_code, 400)

        res_c = self.client.post('/api/clientes/', {
            'rut': '19.222.333-4',
            'nombre': 'Ana',
            'apellido': 'Silva',
            'telefono': '+56988776655',
            'email': '',
        }, format='json')
        self.assertEqual(res_c.status_code, 201)
        c_id = res_c.data['id']

        res_c_edit = self.client.patch(f'/api/clientes/{c_id}/', {'email': 'ana@correo.cl'}, format='json')
        self.assertEqual(res_c_edit.status_code, 200)
        self.assertEqual(res_c_edit.data['email'], 'ana@correo.cl')

        # 3. CRUD Vehículos + Edición
        res_v = self.client.post('/api/vehiculos/', {
            'patente': 'TEST99',
            'marca': 'Mazda',
            'modelo': '3',
            'anio': 2023,
            'kilometraje': 15000,
            'cliente': c_id,
        }, format='json')
        self.assertEqual(res_v.status_code, 201)
        v_id = res_v.data['id']

        res_v_edit = self.client.patch(f'/api/vehiculos/{v_id}/', {'kilometraje': 18500}, format='json')
        self.assertEqual(res_v_edit.status_code, 200)
        self.assertEqual(res_v_edit.data['kilometraje'], 18500)

        # 4. Flujo Completo OT (HU-01 a HU-11)
        res_ot = self.client.post('/api/ordenes/', {
            'cliente': c_id,
            'vehiculo': v_id,
            'mecanico_asignado': u_id,
            'diagnostico': 'Ruido en tren delantero',
        }, format='json')
        self.assertEqual(res_ot.status_code, 201)
        ot_num = res_ot.data['numero']

        # Pasar a DIA
        res_dia = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'DIA'}, format='json')
        self.assertEqual(res_dia.status_code, 200)
        self.assertEqual(res_dia.data['estado'], 'DIA')

        # Bloqueo de horas en DIA (HU-05)
        res_h_bad = self.client.post('/api/horas/', {
            'orden': ot_num,
            'mecanico': u_id,
            'horas': 2,
            'tarifa': 17500,
            'descripcion': 'Intento en diagnóstico',
        }, format='json')
        self.assertEqual(res_h_bad.status_code, 400)

        # Agregar repuesto (HU-10: $45.000)
        res_rep = self.client.post('/api/repuestos/', {
            'orden': ot_num,
            'nombre_pieza': 'Bandeja suspension',
            'cantidad': 1,
            'precio_unitario': 45000,
        }, format='json')
        self.assertEqual(res_rep.status_code, 201)

        # Bloqueo de paso a REP si presupuesto es rechazado
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': False}, format='json')
        res_rep_blocked = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json')
        self.assertEqual(res_rep_blocked.status_code, 400)

        # Aprobar presupuesto y avanzar a REP
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': True}, format='json')
        res_rep_st = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json')
        self.assertEqual(res_rep_st.status_code, 200)
        self.assertEqual(res_rep_st.data['estado'], 'REP')

        # Bloqueo de paso a CAL y de aprobación de Calidad si NO hay Horas Hombre registradas
        res_cal_sin_horas = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAL'}, format='json')
        self.assertEqual(res_cal_sin_horas.status_code, 400)
        res_aprob_sin_horas = self.client.post('/api/controles-calidad/', {
            'orden': ot_num, 'jefe_taller': u_id, 'aprobado': True, 'observaciones': 'Intento sin horas'
        }, format='json')
        self.assertEqual(res_aprob_sin_horas.status_code, 400)

        # Registrar horas en REP (HU-05: 2h * 17500 = $35.000)
        res_h_ok = self.client.post('/api/horas/', {
            'orden': ot_num,
            'mecanico': u_id,
            'horas': 2,
            'tarifa': 17500,
            'descripcion': 'Cambio bandeja',
        }, format='json')
        self.assertEqual(res_h_ok.status_code, 201)

        # Pasar a CAL y verificar que NO deja pasar a LST sin Control de Calidad aprobado
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAL'}, format='json')
        res_lst_sin_cal = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'LST'}, format='json')
        self.assertEqual(res_lst_sin_cal.status_code, 400)

        # Aprobar Control de Calidad (HU-07) -> Avanza a LST
        res_cal = self.client.post('/api/controles-calidad/', {
            'orden': ot_num,
            'jefe_taller': u_id,
            'aprobado': True,
            'observaciones': 'Control aprobado',
        }, format='json')
        self.assertEqual(res_cal.status_code, 201)

        res_lst = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'LST'}, format='json')
        self.assertEqual(res_lst.status_code, 200)
        self.assertEqual(res_lst.data['estado'], 'LST')

        # Verificar liquidación de 4 líneas + IVA 19% ($15.000 + $45.000 + $35.000 = $95.000 neto + $18.050 IVA = $113.050)
        self.assertEqual(float(res_lst.data['subtotal_neto']), 95000.0)
        self.assertEqual(float(res_lst.data['iva_19']), 18050.0)
        self.assertEqual(float(res_lst.data['total_a_pagar']), 113050.0)

        # Notificación telefónica auditada (HU-09)
        res_not = self.client.post(f'/api/ordenes/{ot_num}/notificar-cliente/', {}, format='json')
        self.assertEqual(res_not.status_code, 200)
        self.assertTrue(any('Notificación telefónica' in h['observacion'] for h in res_not.data['historial_estados']))

        # Consulta pública RUT + Patente (HU-08)
        res_pub = self.client.get('/api/consulta-publica/?rut=19222333-4&patente=TEST99')
        self.assertEqual(res_pub.status_code, 200)
        self.assertEqual(res_pub.data['estado'], 'LST')

        # Entrega y Reingreso por Garantía ($0 diagnóstico)
        res_ent = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'ENT'}, format='json')
        self.assertEqual(res_ent.status_code, 200)
        self.assertEqual(res_ent.data['estado'], 'ENT')

        self.client.patch(f'/api/ordenes/{ot_num}/', {'reingresado_por_garantia': True, 'costo_diagnostico': 0}, format='json')
        res_gar = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'DIA', 'observacion': 'Garantía'}, format='json')
        self.assertEqual(res_gar.status_code, 200)
        self.assertEqual(res_gar.data['estado'], 'DIA')
        self.assertEqual(float(res_gar.data['costo_diagnostico']), 0.0)
