import React, { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import {
  cambiarEstadoOrden,
  updateOrden,
  createRepuesto,
  deleteRepuesto,
  createHora,
  deleteHora,
  createControlCalidad,
  updateControlCalidad,
  getOrden,
} from '../services/api';

import DetalleRecepcion from './detalle/DetalleRecepcion';
import TabDiagnostico from './detalle/TabDiagnostico';
import TabRepuestos from './detalle/TabRepuestos';
import ModalAgregarRepuesto from './detalle/ModalAgregarRepuesto';
import TabHorasHombre from './detalle/TabHorasHombre';
import TabControlCalidad from './detalle/TabControlCalidad';

const ESTADOS = [
  { code: 'ING', label: 'Ingresada', badgeClass: 'badge-ing' },
  { code: 'DIA', label: 'En Diagnóstico', badgeClass: 'badge-dia' },
  { code: 'ESP', label: 'Espera de Repuestos', badgeClass: 'badge-esp' },
  { code: 'REP', label: 'En Reparación', badgeClass: 'badge-rep' },
  { code: 'CAL', label: 'Control de Calidad', badgeClass: 'badge-cal' },
  { code: 'LST', label: 'Lista para Entrega', badgeClass: 'badge-lst' },
  { code: 'ENT', label: 'Entregada', badgeClass: 'badge-ent' },
];

export default function DetalleOTModal({
  orden,
  usuarioActual,
  mecanicos = [],
  onClose,
  onStateChanged,
}) {
  const rol = usuarioActual?.rol || 'JEFE_TALLER';
  const [activeTab, setActiveTab] = useState('diagnostico');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados locales de edición
  const [diagnosticoText, setDiagnosticoText] = useState(orden.diagnostico || '');
  const [observacionesText, setObservacionesText] = useState(orden.observaciones || '');
  const [mecanicoId, setMecanicoId] = useState(orden.mecanico_asignado || '');
  const [segundoMecanicoId, setSegundoMecanicoId] = useState(orden.segundo_mecanico || '');
  const [fechaEstimada, setFechaEstimada] = useState(orden.fecha_estimada_entrega || '');
  const [esGarantia, setEsGarantia] = useState(Boolean(orden.reingresado_por_garantia));
  const [presupuestoAprobado, setPresupuestoAprobado] = useState(orden.presupuesto_aprobado);

  // Estado del Sub-modal Agregar Repuesto
  const [showRepuestoModal, setShowRepuestoModal] = useState(false);
  const [repuestoConfirmado, setRepuestoConfirmado] = useState(null);
  const [nuevoRepuesto, setNuevoRepuesto] = useState({
    nombre_pieza: '',
    cantidad: 1,
    precio_unitario: '',
  });

  // Estado del Formulario de Horas Hombre
  const [nuevaHora, setNuevaHora] = useState({
    mecanico: orden.mecanico_asignado || (mecanicos[0]?.id ?? ''),
    horas: '1.5',
    tarifa: orden.mecanico_detalle?.tarifa_hora || 15000,
    descripcion: '',
  });

  // Estado Control de Calidad
  const [obsCalidad, setObsCalidad] = useState(orden.control_calidad?.observaciones || '');

  const formatCLP = (val) => '$' + Math.round(Number(val) || 0).toLocaleString('es-CL');

  const recargarOrdenActual = async () => {
    const actualizada = await getOrden(orden.numero);
    onStateChanged(actualizada);
  };

  const handleTransicionEstado = async (nuevoEstado, obs = '') => {
    if (nuevoEstado === orden.estado) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (nuevoEstado === 'LST' && rol === 'JEFE_TALLER' && (!orden.control_calidad || !orden.control_calidad.aprobado)) {
        const payload = {
          orden: orden.numero,
          jefe_taller: usuarioActual?.id || 4,
          aprobado: true,
          observaciones: obsCalidad.trim() || 'Control de calidad aprobado por Jefe de Taller.',
        };
        if (orden.control_calidad?.id) {
          await updateControlCalidad(orden.control_calidad.id, payload);
        } else {
          await createControlCalidad(payload);
        }
      }

      const updated = await cambiarEstadoOrden(
        orden.numero,
        nuevoEstado,
        obs || `Cambio de estado por ${usuarioActual?.nombre || 'sistema'}`
      );
      onStateChanged(updated);
      setSuccessMsg(`Estado actualizado a: ${updated.estado_display}`);
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo cambiar el estado.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardarDiagnostico = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        diagnostico: diagnosticoText,
        observaciones: observacionesText,
      };
      if (rol === 'JEFE_TALLER') {
        payload.mecanico_asignado = mecanicoId ? Number(mecanicoId) : null;
        payload.segundo_mecanico = segundoMecanicoId ? Number(segundoMecanicoId) : null;
        payload.fecha_estimada_entrega = fechaEstimada || null;
        payload.reingresado_por_garantia = esGarantia;
        payload.costo_diagnostico = esGarantia ? 0 : 15000;
        payload.presupuesto_aprobado = presupuestoAprobado;
      }
      const updated = await updateOrden(orden.numero, payload);
      onStateChanged(updated);
      setSuccessMsg('Diagnóstico y datos técnicos guardados correctamente.');
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el diagnóstico.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarRespuestaPresupuesto = async (aprobado) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const updated = await updateOrden(orden.numero, { presupuesto_aprobado: aprobado });
      setPresupuestoAprobado(aprobado);
      onStateChanged(updated);
      setSuccessMsg(
        aprobado
          ? 'Presupuesto marcado como APROBADO por el cliente.'
          : 'Presupuesto marcado como RECHAZADO por el cliente.'
      );
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar respuesta del presupuesto.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarRepuesto = async (e) => {
    e.preventDefault();
    if (!nuevoRepuesto.nombre_pieza.trim() || !nuevoRepuesto.precio_unitario) {
      setErrorMsg('Completa el nombre y precio unitario del repuesto.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const creado = await createRepuesto({
        orden: orden.numero,
        nombre_pieza: nuevoRepuesto.nombre_pieza.trim(),
        cantidad: Number(nuevoRepuesto.cantidad) || 1,
        precio_unitario: Number(nuevoRepuesto.precio_unitario) || 0,
      });
      setRepuestoConfirmado(creado);
      await recargarOrdenActual();
    } catch (err) {
      setErrorMsg(err.message || 'Error al agregar repuesto.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarRepuesto = async (id) => {
    setLoading(true);
    try {
      await deleteRepuesto(id);
      await recargarOrdenActual();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar repuesto.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgregarHora = async (e) => {
    e.preventDefault();
    if (!nuevaHora.mecanico || !nuevaHora.horas) {
      setErrorMsg('Selecciona el mecánico y las horas trabajadas.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      await createHora({
        orden: orden.numero,
        mecanico: Number(nuevaHora.mecanico),
        horas: Number(nuevaHora.horas),
        tarifa: Number(nuevaHora.tarifa) || 15000,
        descripcion: nuevaHora.descripcion.trim() || 'Servicio mecánico en taller',
      });
      setNuevaHora((prev) => ({ ...prev, descripcion: '' }));
      await recargarOrdenActual();
      setSuccessMsg('Horas hombre registradas correctamente.');
    } catch (err) {
      setErrorMsg(err.message || 'No se pudieron registrar las horas.');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarHora = async (id) => {
    setLoading(true);
    try {
      await deleteHora(id);
      await recargarOrdenActual();
    } catch (err) {
      setErrorMsg(err.message || 'Error al eliminar registro de horas.');
    } finally {
      setLoading(false);
    }
  };

  const handleDictamenCalidad = async (aprobado) => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        orden: orden.numero,
        jefe_taller: usuarioActual?.id || 4,
        aprobado,
        observaciones:
          obsCalidad.trim() ||
          (aprobado
            ? 'Control de calidad aprobado satisfactoriamente.'
            : 'Rechazado en control de calidad. Requiere corrección.'),
      };

      if (orden.control_calidad?.id) {
        await updateControlCalidad(orden.control_calidad.id, payload);
      } else {
        await createControlCalidad(payload);
      }

      if (aprobado && orden.estado === 'CAL') {
        const updated = await cambiarEstadoOrden(
          orden.numero,
          'LST',
          `Control de Calidad APROBADO: ${payload.observaciones}`
        );
        onStateChanged(updated);
        setSuccessMsg('¡Control de Calidad Aprobado! La orden avanzó a Lista para Entrega.');
      } else if (!aprobado && orden.estado === 'CAL') {
        const updated = await cambiarEstadoOrden(
          orden.numero,
          'REP',
          `Control de Calidad RECHAZADO: ${payload.observaciones}`
        );
        onStateChanged(updated);
        setSuccessMsg('Control rechazado: la orden volvió automáticamente a En Reparación.');
      } else {
        await recargarOrdenActual();
        setSuccessMsg(
          aprobado
            ? '¡Control de Calidad Aprobado!'
            : 'Control de Calidad registrado como rechazado.'
        );
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar el Control de Calidad.');
    } finally {
      setLoading(false);
    }
  };

  const currentEstadoObj = ESTADOS.find((e) => e.code === orden.estado) || ESTADOS[0];
  const currentStepIndex = ESTADOS.findIndex((e) => e.code === orden.estado);

  // 1. Delegar vista simplificada si es Recepción
  if (rol === 'RECEPCIONISTA') {
    return (
      <DetalleRecepcion
        orden={orden}
        currentEstadoObj={currentEstadoObj}
        loading={loading}
        errorMsg={errorMsg}
        successMsg={successMsg}
        presupuestoAprobado={presupuestoAprobado}
        onRegistrarPresupuesto={handleRegistrarRespuestaPresupuesto}
        onEntregarVehiculo={() =>
          handleTransicionEstado('ENT', 'Vehículo entregado al cliente en Recepción')
        }
        onClose={onClose}
      />
    );
  }

  // 2. Vista Técnica Completa (Jefe de Taller y Mecánico)
  const repuestosList = orden.repuestos_detalle || [];
  const horasList = orden.registro_horas || [];
  const estadosSelector =
    rol === 'MECANICO'
      ? ESTADOS.filter((e) => ['DIA', 'ESP', 'REP', 'CAL'].includes(e.code))
      : ESTADOS;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '1060px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Órdenes de trabajo / OT {String(orden.numero).padStart(4, '0')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
                {rol === 'MECANICO'
                  ? `OT ${String(orden.numero).padStart(4, '0')} · ${orden.vehiculo_detalle?.patente}`
                  : `Detalle de OT ${String(orden.numero).padStart(4, '0')}`}
              </h2>
              <span className={`badge ${currentEstadoObj.badgeClass}`} style={{ width: 'auto', padding: '5px 14px' }}>
                {orden.estado_display || currentEstadoObj.label}
              </span>
            </div>
            <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px', fontWeight: 600 }}>
              {orden.vehiculo_detalle?.patente} · {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo} ({orden.vehiculo_detalle?.anio}) · Cliente: {orden.cliente_detalle?.nombre_completo}
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {errorMsg && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              color: '#991B1B',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              color: '#065F46',
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600
            }}>
              {successMsg}
            </div>
          )}

          {rol === 'JEFE_TALLER' && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                background: '#FFFFFF',
                padding: '18px 22px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Cliente</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                    {orden.cliente_detalle?.nombre_completo}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {orden.cliente_detalle?.telefono || 'Sin teléfono'} · {orden.cliente_detalle?.email || 'Sin correo'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Mecánico asignado</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                    {orden.mecanico_detalle?.nombre_completo || 'Por asignar'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {orden.mecanico_detalle?.especialidad || 'Mantención y sistema de frenos'}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Entrega estimada</div>
                  <div style={{ fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                    {orden.fecha_estimada_entrega || 'Por definir'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Ingreso: {orden.fecha_ingreso}
                  </div>
                </div>
              </div>

              <div style={{
                background: '#FFFFFF',
                padding: '18px 22px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700 }}>Seguimiento de la OT</span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hora de Chile</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                  {ESTADOS.map((est, idx) => {
                    const isPassed = idx < currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={est.code} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {idx < ESTADOS.length - 1 && (
                          <div style={{
                            position: 'absolute',
                            top: '13px',
                            left: '50%',
                            width: '100%',
                            height: '2px',
                            background: isPassed ? '#0B192C' : 'var(--border-color)',
                            zIndex: 1,
                          }} />
                        )}

                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: isPassed ? '#0B192C' : isCurrent ? 'var(--primary)' : '#F1F5F9',
                          color: isPassed || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 700,
                          zIndex: 2,
                        }}>
                          {isPassed ? <Check size={13} strokeWidth={3} /> : idx + 1}
                        </div>

                        <span style={{
                          fontSize: '11px',
                          fontWeight: isCurrent ? 700 : 600,
                          color: isCurrent ? 'var(--primary)' : '#0F172A',
                          marginTop: '6px',
                          textAlign: 'center'
                        }}>
                          {est.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Grilla Principal: Pestañas delegadas + Selector de Estado */}
          <div style={{ display: 'grid', gridTemplateColumns: '2.1fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                display: 'flex',
                background: '#FFFFFF',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                padding: '6px',
                gap: '6px'
              }}>
                {[
                  { id: 'diagnostico', label: 'Diagnóstico' },
                  { id: 'repuestos', label: `Repuestos (${repuestosList.length})` },
                  { id: 'horas', label: `Horas hombre (${horasList.length})` },
                  ...(rol === 'JEFE_TALLER' ? [{ id: 'calidad', label: 'Control de calidad' }] : []),
                ].map((tab) => {
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: active ? '#FFF7ED' : 'transparent',
                        color: active ? 'var(--primary)' : '#475569',
                        fontWeight: active ? 700 : 600,
                        fontSize: '13px',
                        cursor: 'pointer',
                        borderBottom: active ? '2px solid var(--primary)' : '2px solid transparent'
                      }}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid var(--border-color)',
                padding: '24px'
              }}>
                {activeTab === 'diagnostico' && (
                  <TabDiagnostico
                    rol={rol}
                    mecanicos={mecanicos}
                    diagnosticoText={diagnosticoText}
                    setDiagnosticoText={setDiagnosticoText}
                    observacionesText={observacionesText}
                    setObservacionesText={setObservacionesText}
                    mecanicoId={mecanicoId}
                    setMecanicoId={setMecanicoId}
                    segundoMecanicoId={segundoMecanicoId}
                    setSegundoMecanicoId={setSegundoMecanicoId}
                    fechaEstimada={fechaEstimada}
                    setFechaEstimada={setFechaEstimada}
                    esGarantia={esGarantia}
                    setEsGarantia={setEsGarantia}
                    loading={loading}
                    onSave={handleGuardarDiagnostico}
                  />
                )}

                {activeTab === 'repuestos' && (
                  <TabRepuestos
                    repuestosList={repuestosList}
                    totalRepuestosNeto={orden.total_repuestos_neto}
                    formatCLP={formatCLP}
                    onOpenAgregarModal={() => {
                      setRepuestoConfirmado(null);
                      setNuevoRepuesto({ nombre_pieza: '', cantidad: 1, precio_unitario: '' });
                      setShowRepuestoModal(true);
                    }}
                    onEliminarRepuesto={handleEliminarRepuesto}
                  />
                )}

                {activeTab === 'horas' && (
                  <TabHorasHombre
                    orden={orden}
                    horasList={horasList}
                    mecanicos={mecanicos}
                    nuevaHora={nuevaHora}
                    setNuevaHora={setNuevaHora}
                    loading={loading}
                    formatCLP={formatCLP}
                    onAgregarHora={handleAgregarHora}
                    onEliminarHora={handleEliminarHora}
                  />
                )}

                {activeTab === 'calidad' && rol === 'JEFE_TALLER' && (
                  <TabControlCalidad
                    orden={orden}
                    obsCalidad={obsCalidad}
                    setObsCalidad={setObsCalidad}
                    loading={loading}
                    onDictamen={handleDictamenCalidad}
                  />
                )}
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              padding: '22px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Cambiar estado
                </h4>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                  {rol === 'MECANICO'
                    ? 'Solo etapas técnicas de la orden.'
                    : 'Selecciona el nuevo estado para la OT.'}
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                {estadosSelector.map((est) => {
                  const isCurrent = orden.estado === est.code;
                  return (
                    <button
                      key={est.code}
                      type="button"
                      disabled={loading || isCurrent}
                      onClick={() => handleTransicionEstado(est.code)}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: isCurrent ? '1px solid #FDBA74' : '1px solid #F1F5F9',
                        background: isCurrent ? '#FFF7ED' : '#F8FAFC',
                        color: isCurrent ? '#C2410C' : '#0F172A',
                        fontWeight: isCurrent ? 700 : 500,
                        fontSize: '13px',
                        textAlign: 'left',
                        cursor: isCurrent ? 'default' : 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{est.label}</span>
                      {isCurrent && <Check size={15} color="#C2410C" />}
                    </button>
                  );
                })}
              </div>

              {rol === 'JEFE_TALLER' && orden.estado !== 'CAN' && orden.estado !== 'ENT' && (
                <div style={{ paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleTransicionEstado('CAN', 'Orden cancelada por el Jefe de Taller')}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: '#991B1B',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Cancelar Orden de Trabajo
                  </button>
                </div>
              )}

              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                {rol === 'MECANICO'
                  ? 'La entrega al cliente se registra en Recepción.'
                  : 'Toda transición queda auditada en el historial.'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showRepuestoModal && (
        <ModalAgregarRepuesto
          orden={orden}
          nuevoRepuesto={nuevoRepuesto}
          setNuevoRepuesto={setNuevoRepuesto}
          repuestoConfirmado={repuestoConfirmado}
          loading={loading}
          formatCLP={formatCLP}
          onSubmit={handleAgregarRepuesto}
          onClose={() => {
            setShowRepuestoModal(false);
            setRepuestoConfirmado(null);
          }}
        />
      )}
    </div>
  );
}
