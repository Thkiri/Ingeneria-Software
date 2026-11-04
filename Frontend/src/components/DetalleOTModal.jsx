import React, { useState } from 'react';
import { X, Check, Clock, User, Calendar, AlertCircle } from 'lucide-react';
import { cambiarEstadoOrden } from '../services/api';

const ESTADOS = [
  { code: 'ING', label: 'Ingresada', badgeClass: 'badge-ing', barColor: 'var(--badge-ing-bar)' },
  { code: 'DIA', label: 'En Diagnóstico', badgeClass: 'badge-dia', barColor: 'var(--badge-dia-bar)' },
  { code: 'ESP', label: 'Espera de Repuestos', badgeClass: 'badge-esp', barColor: 'var(--badge-esp-bar)' },
  { code: 'REP', label: 'En Reparación', badgeClass: 'badge-rep', barColor: 'var(--badge-rep-bar)' },
  { code: 'CAL', label: 'Control de Calidad', badgeClass: 'badge-cal', barColor: 'var(--badge-cal-bar)' },
  { code: 'LST', label: 'Lista para Entrega', badgeClass: 'badge-lst', barColor: 'var(--badge-lst-bar)' },
  { code: 'ENT', label: 'Entregada', badgeClass: 'badge-ent', barColor: 'var(--badge-ent-bar)' },
];

export default function DetalleOTModal({ orden, onClose, onStateChanged }) {
  const [activeTab, setActiveTab] = useState('diagnostico');
  const [selectedEstado, setSelectedEstado] = useState(orden.estado);
  const [observacion, setObservacion] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentEstadoObj = ESTADOS.find(e => e.code === orden.estado) || ESTADOS[0];
  const currentStepIndex = ESTADOS.findIndex(e => e.code === orden.estado);

  const handleCambiarEstado = async () => {
    if (selectedEstado === orden.estado) return;
    setLoading(true);
    setErrorMsg('');
    try {
      const updated = await cambiarEstadoOrden(orden.numero, selectedEstado, observacion);
      onStateChanged(updated);
      setObservacion('');
    } catch (err) {
      setErrorMsg(err.message || 'Error al actualizar el estado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
              Órdenes de trabajo / OT-{String(orden.numero).padStart(4, '0')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: 700 }}>
                Detalle de OT {String(orden.numero).padStart(4, '0')}
              </h2>
              <span className={`badge ${currentEstadoObj.badgeClass}`} style={{ width: 'auto', padding: '4px 12px' }}>
                {orden.estado_display || currentEstadoObj.label}
              </span>
            </div>
            <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginTop: '4px', fontWeight: 600 }}>
              {orden.vehiculo_detalle?.patente || 'S/P'} · {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo} ({orden.vehiculo_detalle?.anio})
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Ficha Resumen */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '16px',
            background: 'var(--bg-main)',
            padding: '18px 20px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Cliente
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px' }}>
                {orden.cliente_detalle?.nombre_completo || 'Cliente'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                RUT: {orden.cliente_detalle?.rut}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {orden.cliente_detalle?.telefono || 'Sin teléfono'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Mecánico asignado
              </div>
              <div style={{ fontWeight: 600, fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={15} color="var(--primary)" />
                {orden.mecanico_detalle?.nombre_completo || 'Por asignar'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Km: {orden.vehiculo_detalle?.kilometraje?.toLocaleString('es-CL') || 0} km
              </div>
            </div>

            <div>
              <div style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                Fechas del servicio
              </div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                <strong>Ingreso:</strong> {orden.fecha_ingreso || 'Hoy'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                <strong>Entrega est.:</strong> {orden.fecha_estimada_entrega || 'Por definir'}
              </div>
            </div>
          </div>

          {/* Stepper / Seguimiento Timeline */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>Seguimiento del Ciclo de Vida</span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hora de Chile</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              {ESTADOS.map((est, idx) => {
                const isPassed = idx < currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={est.code} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                    {/* Connecting line */}
                    {idx < ESTADOS.length - 1 && (
                      <div style={{
                        position: 'absolute',
                        top: '14px',
                        left: '50%',
                        width: '100%',
                        height: '2px',
                        background: isPassed ? 'var(--primary)' : 'var(--border-color)',
                        zIndex: 1,
                      }} />
                    )}

                    {/* Step Icon / Circle */}
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isPassed ? 'var(--primary)' : isCurrent ? '#0B192C' : '#FFFFFF',
                      border: isCurrent ? '2px solid var(--primary)' : '2px solid var(--border-color)',
                      color: isPassed || isCurrent ? '#FFFFFF' : 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: 700,
                      zIndex: 2,
                      transition: 'all 0.2s ease'
                    }}>
                      {isPassed ? <Check size={14} strokeWidth={3} /> : idx + 1}
                    </div>

                    <span style={{
                      fontSize: '11px',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--primary)' : 'var(--text-muted)',
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

          {/* Selector de Transición de Estado Rápido */}
          <div style={{
            background: 'var(--bg-main)',
            borderRadius: '10px',
            padding: '16px',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>
              Actualizar Estado de la Orden
            </div>

            {errorMsg && (
              <div style={{ color: '#DC2626', fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={14} /> {errorMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr auto', gap: '12px', alignItems: 'center' }}>
              <select
                className="input-control"
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
              >
                {ESTADOS.map((est) => (
                  <option key={est.code} value={est.code}>
                    {est.label} {est.code === orden.estado ? '(Actual)' : ''}
                  </option>
                ))}
              </select>

              <input
                type="text"
                className="input-control"
                placeholder="Observación del cambio (opcional)..."
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
              />

              <button
                className="btn-primary"
                onClick={handleCambiarEstado}
                disabled={loading || selectedEstado === orden.estado}
                style={{
                  opacity: (loading || selectedEstado === orden.estado) ? 0.6 : 1,
                  cursor: (loading || selectedEstado === orden.estado) ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? 'Guardando...' : 'Cambiar Estado'}
              </button>
            </div>
          </div>

          {/* Tabs de Información Detallada */}
          <div>
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '20px' }}>
              <button
                onClick={() => setActiveTab('diagnostico')}
                style={{
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'diagnostico' ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: activeTab === 'diagnostico' ? 700 : 500,
                  color: activeTab === 'diagnostico' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Diagnóstico y Motivo
              </button>

              <button
                onClick={() => setActiveTab('repuestos')}
                style={{
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'repuestos' ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: activeTab === 'repuestos' ? 700 : 500,
                  color: activeTab === 'repuestos' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Repuestos Requeridos
              </button>

              <button
                onClick={() => setActiveTab('historial')}
                style={{
                  padding: '10px 0',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === 'historial' ? '2px solid var(--primary)' : '2px solid transparent',
                  fontWeight: activeTab === 'historial' ? 700 : 500,
                  color: activeTab === 'historial' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Historial de Auditoría ({orden.historial_estados?.length || 0})
              </button>
            </div>

            <div style={{ paddingTop: '16px' }}>
              {activeTab === 'diagnostico' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Diagnóstico Inicial:
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '14px' }}>
                      {orden.diagnostico || 'Pendiente de revisión técnica.'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Trabajos Realizados:
                    </div>
                    <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '14px' }}>
                      {orden.trabajos_realizados || 'En proceso de ejecución.'}
                    </div>
                  </div>

                  {orden.observaciones && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        Observaciones:
                      </div>
                      <div style={{ background: 'var(--bg-main)', padding: '12px', borderRadius: '8px', marginTop: '6px', fontSize: '14px' }}>
                        {orden.observaciones}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'repuestos' && (
                <div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Listado de repuestos e insumos requeridos para esta orden:
                  </div>
                  <div style={{
                    background: 'var(--bg-main)',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-line'
                  }}>
                    {orden.repuestos_requeridos || 'No se han especificado repuestos adicionales para este servicio.'}
                  </div>
                </div>
              )}

              {activeTab === 'historial' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {orden.historial_estados && orden.historial_estados.length > 0 ? (
                    orden.historial_estados.map((h, i) => (
                      <div key={i} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: 'var(--bg-main)',
                        borderRadius: '8px',
                        fontSize: '13px'
                      }}>
                        <div>
                          <strong>{h.estado_anterior_display || 'Inicio'} → {h.estado_nuevo_display}</strong>
                          {h.observacion && <span style={{ color: 'var(--text-muted)' }}> — {h.observacion}</span>}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                          {new Date(h.fecha).toLocaleString('es-CL')}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                      Sin historial previo registrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

