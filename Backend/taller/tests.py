from django.test import TestCase
from rest_framework.test import APIClient

from taller.models import ControlCalidad


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

        # Entrega y Reingreso por Garantía atómico ($0 diagnóstico, $0 MO)
        res_ent = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'ENT'}, format='json')
        self.assertEqual(res_ent.status_code, 200)
        self.assertEqual(res_ent.data['estado'], 'ENT')

        # PATCH directo sobre orden ENT no debe poder rebajar el cobro sin reabrir
        res_patch_ent = self.client.patch(
            f'/api/ordenes/{ot_num}/',
            {'reingresado_por_garantia': True, 'costo_diagnostico': 0},
            format='json',
        )
        self.assertEqual(res_patch_ent.status_code, 400)
        self.assertEqual(float(self.client.get(f'/api/ordenes/{ot_num}/').data['total_a_pagar']), 113050.0)

        res_gar = self.client.post(f'/api/ordenes/{ot_num}/reingreso-garantia/', {'observacion': 'Garantía'}, format='json')
        self.assertEqual(res_gar.status_code, 200)
        self.assertEqual(res_gar.data['estado'], 'DIA')
        self.assertEqual(float(res_gar.data['costo_diagnostico']), 0.0)
        self.assertEqual(float(res_gar.data['total_mano_obra_neto']), 0.0)
        self.assertEqual(float(res_gar.data['total_repuestos_neto']), 0.0)
        self.assertIsNone(res_gar.data['presupuesto_aprobado'])
        self.assertIsNone(res_gar.data['control_calidad'])
        self.assertEqual(len(res_gar.data['registro_horas']), 0)
        self.assertEqual(len(res_gar.data['repuestos_detalle']), 0)
        # El control de calidad del ciclo 1 se preserva en la BD
        self.assertTrue(ControlCalidad.objects.filter(orden_id=ot_num, ciclo=1, aprobado=True).exists())

    def _crear_escenario_base(self):
        res_u = self.client.post('/api/usuarios/', {
            'username': 'mec.qa',
            'first_name': 'Luis',
            'last_name': 'QA',
            'rut': '17.333.444-5',
            'rol': 'MECANICO',
            'tarifa_hora': 17500,
        }, format='json')
        self.assertEqual(res_u.status_code, 201)
        res_c = self.client.post('/api/clientes/', {
            'rut': '16.555.666-7',
            'nombre': 'Carlos',
            'apellido': 'Perez',
            'telefono': '+56911223344',
        }, format='json')
        self.assertEqual(res_c.status_code, 201)
        res_v = self.client.post('/api/vehiculos/', {
            'patente': 'QA2026',
            'marca': 'Toyota',
            'modelo': 'Yaris',
            'anio': 2022,
            'cliente': res_c.data['id'],
        }, format='json')
        self.assertEqual(res_v.status_code, 201)
        res_ot = self.client.post('/api/ordenes/', {
            'cliente': res_c.data['id'],
            'vehiculo': res_v.data['id'],
            'mecanico_asignado': res_u.data['id'],
            'diagnostico': 'Falla en frenos',
        }, format='json')
        self.assertEqual(res_ot.status_code, 201)
        return res_u.data['id'], res_ot.data['numero']

    def test_inmutabilidad_cobro_y_horas_tras_aprobar_calidad(self):
        """Fallo 1: No se pueden eliminar ni alterar horas/repuestos/calidad una vez aprobada calidad (LST/ENT)."""
        u_id, ot_num = self._crear_escenario_base()
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'DIA'}, format='json')
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': True}, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json')

        # 2h * $17.500 = $35.000 + $15.000 diag = $50.000 neto -> $59.500 con IVA
        res_h = self.client.post('/api/horas/', {
            'orden': ot_num,
            'mecanico': u_id,
            'horas': 2,
            'tarifa': 17500,
            'descripcion': 'Ajuste de frenos',
        }, format='json')
        self.assertEqual(res_h.status_code, 201)
        hora_id = res_h.data['id']

        res_rep = self.client.post('/api/repuestos/', {
            'orden': ot_num,
            'nombre_pieza': 'Liquido de frenos',
            'cantidad': 1,
            'precio_unitario': 10000,
        }, format='json')
        self.assertEqual(res_rep.status_code, 201)
        rep_id = res_rep.data['id']

        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAL'}, format='json')
        res_cc = self.client.post('/api/controles-calidad/', {
            'orden': ot_num,
            'jefe_taller': u_id,
            'aprobado': True,
            'observaciones': 'OK',
        }, format='json')
        self.assertEqual(res_cc.status_code, 201)
        cc_id = res_cc.data['id']

        res_lst = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'LST'}, format='json')
        self.assertEqual(res_lst.status_code, 200)
        total_esperado = float(res_lst.data['total_a_pagar'])

        # Intentar eliminar o agregar horas/repuestos o alterar calidad en LST debe fallar con 400
        self.assertEqual(self.client.delete(f'/api/horas/{hora_id}/').status_code, 400)
        self.assertEqual(self.client.patch(f'/api/horas/{hora_id}/', {'horas': 1}, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/horas/', {
            'orden': ot_num, 'mecanico': u_id, 'horas': 1, 'tarifa': 17500,
        }, format='json').status_code, 400)
        self.assertEqual(self.client.delete(f'/api/repuestos/{rep_id}/').status_code, 400)
        self.assertEqual(self.client.post('/api/repuestos/', {
            'orden': ot_num, 'nombre_pieza': 'Extra', 'cantidad': 1, 'precio_unitario': 5000,
        }, format='json').status_code, 400)
        self.assertEqual(self.client.patch(f'/api/controles-calidad/{cc_id}/', {'aprobado': False}, format='json').status_code, 400)
        self.assertEqual(self.client.delete(f'/api/controles-calidad/{cc_id}/').status_code, 400)

        # El total a pagar permanece intacto
        res_check = self.client.get(f'/api/ordenes/{ot_num}/')
        self.assertEqual(float(res_check.data['total_a_pagar']), total_esperado)
        self.assertEqual(len(res_check.data['registro_horas']), 1)

    def test_reingreso_garantia_reinicia_ciclo_y_mano_obra_cero(self):
        """Fallo 2: Reingreso por garantía limpia presupuesto, calidad, cobro previo y fija MO en $0."""
        u_id, ot_num = self._crear_escenario_base()
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'DIA'}, format='json')
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': True}, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json')
        self.client.post('/api/horas/', {
            'orden': ot_num, 'mecanico': u_id, 'horas': 2, 'tarifa': 17500, 'descripcion': 'Trabajo inicial',
        }, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAL'}, format='json')
        self.client.post('/api/controles-calidad/', {
            'orden': ot_num, 'jefe_taller': u_id, 'aprobado': True, 'observaciones': 'OK inicial',
        }, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'LST'}, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/notificar-cliente/', {}, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'ENT'}, format='json')

        # Reingreso por garantía atómico: PATCH directo en ENT está bloqueado y no altera el cobro
        res_ent_before = self.client.get(f'/api/ordenes/{ot_num}/')
        total_entregada = float(res_ent_before.data['total_a_pagar'])
        self.assertEqual(total_entregada, 59500.0)
        self.assertEqual(
            self.client.patch(
                f'/api/ordenes/{ot_num}/',
                {'reingresado_por_garantia': True, 'costo_diagnostico': 0},
                format='json',
            ).status_code,
            400,
        )
        self.assertEqual(float(self.client.get(f'/api/ordenes/{ot_num}/').data['total_a_pagar']), 59500.0)

        res_gar = self.client.post(f'/api/ordenes/{ot_num}/reingreso-garantia/', {}, format='json')
        self.assertEqual(res_gar.status_code, 200)
        self.assertEqual(float(res_gar.data['costo_diagnostico']), 0.0)
        self.assertEqual(float(res_gar.data['total_mano_obra_neto']), 0.0)
        self.assertEqual(float(res_gar.data['total_a_pagar']), 0.0)
        self.assertIsNone(res_gar.data['presupuesto_aprobado'])
        self.assertIsNone(res_gar.data['control_calidad'])
        # El cierre de cobro del ciclo 1 queda persistido y consultable para VistaCobros
        self.assertEqual(len(res_gar.data['cierres_cobro']), 1)
        cierre_1 = res_gar.data['cierres_cobro'][0]
        self.assertEqual(cierre_1['ciclo'], 1)
        self.assertEqual(cierre_1['tipo'], 'ENT')
        self.assertEqual(float(cierre_1['costo_diagnostico']), 15000.0)
        self.assertEqual(float(cierre_1['total_mano_obra_neto']), 35000.0)
        self.assertEqual(float(cierre_1['subtotal_neto']), 50000.0)
        self.assertEqual(float(cierre_1['iva_19']), 9500.0)
        self.assertEqual(float(cierre_1['total_a_pagar']), 59500.0)
        # El control de calidad del ciclo 1 permanece intacto como respaldo de la entrega original
        cc_ciclo_1 = ControlCalidad.objects.get(orden_id=ot_num, ciclo=1)
        self.assertTrue(cc_ciclo_1.aprobado)
        self.assertEqual(self.client.patch(f'/api/controles-calidad/{cc_ciclo_1.id}/', {'aprobado': False}, format='json').status_code, 400)
        self.assertEqual(self.client.delete(f'/api/controles-calidad/{cc_ciclo_1.id}/').status_code, 400)

        # No puede saltar a REP sin nueva aprobación del cliente
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json').status_code,
            400
        )
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': True}, format='json')
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json').status_code,
            200
        )

        # No puede pasar a CAL sin nuevas horas en el ciclo de garantía
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAL'}, format='json').status_code,
            400
        )

        # Registrar horas en garantía: aunque se envíe tarifa 17500, queda en $0
        res_h_gar = self.client.post('/api/horas/', {
            'orden': ot_num, 'mecanico': u_id, 'horas': 1.5, 'tarifa': 17500, 'descripcion': 'Corrección garantía',
        }, format='json')
        self.assertEqual(res_h_gar.status_code, 201)
        self.assertEqual(float(res_h_gar.data['tarifa']), 0.0)
        self.assertEqual(float(res_h_gar.data['costo']), 0.0)

        # Repuesto adicional en garantía sí se cobra normalmente ($20.000 neto -> $23.800 con IVA)
        res_rep_gar = self.client.post('/api/repuestos/', {
            'orden': ot_num, 'nombre_pieza': 'Sello adicional', 'cantidad': 1, 'precio_unitario': 20000,
        }, format='json')
        self.assertEqual(res_rep_gar.status_code, 201)

        res_ot_gar = self.client.get(f'/api/ordenes/{ot_num}/')
        self.assertEqual(float(res_ot_gar.data['costo_diagnostico']), 0.0)
        self.assertEqual(float(res_ot_gar.data['total_mano_obra_neto']), 0.0)
        self.assertEqual(float(res_ot_gar.data['total_repuestos_neto']), 20000.0)
        self.assertEqual(float(res_ot_gar.data['total_a_pagar']), 23800.0)

    def test_cancelacion_en_reparacion_requiere_cobro_parcial(self):
        """Fallo 3: Cancelar desde EN_REPARACION exige registrar cobro parcial previo por lo consumido."""
        u_id, ot_num = self._crear_escenario_base()
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'DIA'}, format='json')
        self.client.patch(f'/api/ordenes/{ot_num}/', {'presupuesto_aprobado': True}, format='json')
        self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'REP'}, format='json')
        self.client.post('/api/horas/', {
            'orden': ot_num, 'mecanico': u_id, 'horas': 1, 'tarifa': 17500, 'descripcion': 'Avance parcial',
        }, format='json')

        # Intentar cancelar sin cobro parcial -> 400
        res_can_bad = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAN'}, format='json')
        self.assertEqual(res_can_bad.status_code, 400)

        # Intentar forzar cobro_parcial_pagado vía PATCH no surte efecto (read-only)
        self.client.patch(f'/api/ordenes/{ot_num}/', {'cobro_parcial_pagado': True}, format='json')
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAN'}, format='json').status_code,
            400
        )

        # Registrar cobro parcial por endpoint dedicado -> 200
        res_pago = self.client.post(f'/api/ordenes/{ot_num}/registrar-cobro-parcial/', {
            'observacion': 'Pagado en caja con transferencia',
        }, format='json')
        self.assertEqual(res_pago.status_code, 200)
        self.assertTrue(res_pago.data['cobro_parcial_pagado'])
        self.assertTrue(res_pago.data['cobro_parcial_vigente'])
        self.assertEqual(float(res_pago.data['monto_cobro_parcial']), float(res_pago.data['total_a_pagar']))

        # Si se agrega un repuesto adicional después del pago, el cobro parcial deja de cubrir el total
        self.client.post('/api/repuestos/', {
            'orden': ot_num, 'nombre_pieza': 'Empaquetadura', 'cantidad': 1, 'precio_unitario': 10000,
        }, format='json')
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAN'}, format='json').status_code,
            400
        )

        # Actualizar cobro parcial con el nuevo total y ahora sí cancelar -> 200
        self.assertEqual(
            self.client.post(f'/api/ordenes/{ot_num}/registrar-cobro-parcial/', {}, format='json').status_code,
            200
        )
        res_can_ok = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAN'}, format='json')
        self.assertEqual(res_can_ok.status_code, 200)
        self.assertEqual(res_can_ok.data['estado'], 'CAN')

    def test_cancelacion_al_ingreso_cobra_cero(self):
        """Cancelar una OT en INGRESADA (incluso con repuesto cargado) deja el cobro total en $0."""
        _, ot_num = self._crear_escenario_base()
        res_rep = self.client.post('/api/repuestos/', {
            'orden': ot_num,
            'nombre_pieza': 'Filtro previo',
            'cantidad': 1,
            'precio_unitario': 10000,
        }, format='json')
        self.assertEqual(res_rep.status_code, 201)

        res_can = self.client.post(f'/api/ordenes/{ot_num}/cambiar-estado/', {'nuevo_estado': 'CAN'}, format='json')
        self.assertEqual(res_can.status_code, 200)
        self.assertEqual(res_can.data['estado'], 'CAN')
        self.assertEqual(float(res_can.data['costo_diagnostico']), 0.0)
        self.assertEqual(float(res_can.data['total_repuestos_neto']), 0.0)
        self.assertEqual(float(res_can.data['subtotal_neto']), 0.0)
        self.assertEqual(float(res_can.data['iva_19']), 0.0)
        self.assertEqual(float(res_can.data['total_a_pagar']), 0.0)
        self.assertEqual(len(res_can.data['cierres_cobro']), 1)
        self.assertEqual(float(res_can.data['cierres_cobro'][0]['total_a_pagar']), 0.0)
