import React from 'react';
import { X } from 'lucide-react';

export default function DetalleRecepcion({
  orden,
  currentEstadoObj,
  loading,
  errorMsg,
  successMsg,
  presupuestoAprobado,
  onRegistrarPresupuesto,
  onEntregarVehiculo,
  onClose,
}) {
  const repuestosList = orden.repuestos_detalle || [];
  const horasList = orden.registro_horas || [];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: '940px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
              Detalle de OT {String(orden.numero).padStart(4, '0')}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Recepción · Consulta de la atención y registro de entrega.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '20px' }}>
          {errorMsg && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', fontSize: '13px' }}>
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', color: '#065F46', padding: '12px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}

          <div style={{
            background: '#FFFFFF',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '22px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A' }}>
                {orden.vehiculo_detalle?.patente} · {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
              </h3>
              <div style={{ fontSize: '14px', color: '#334155', marginTop: '6px' }}>
                Cliente: {orden.cliente_detalle?.nombre_completo} · RUT {orden.cliente_detalle?.rut}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '6px' }}>
                Mecánico: {orden.mecanico_detalle?.nombre_completo || 'Por asignar'} · Ingreso: {orden.fecha_ingreso}
              </div>
            </div>

            <span className={`badge ${currentEstadoObj.badgeClass}`} style={{ width: 'auto', padding: '6px 14px' }}>
              {orden.estado_display}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '20px', alignItems: 'start' }}>
            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                Resumen del trabajo
              </h4>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Diagnóstico</div>
                <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                  {orden.diagnostico || 'En evaluación por el equipo técnico.'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Repuestos</div>
                <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                  {repuestosList.length > 0
                    ? repuestosList.map((r) => `${r.nombre_pieza} (${r.cantidad} unid.)`).join(' · ')
                    : 'Sin repuestos adicionales registrados.'}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>Horas hombre</div>
                <div style={{ fontSize: '14px', color: '#334155', marginTop: '4px' }}>
                  {horasList.length > 0
                    ? horasList.map((h) => `${h.mecanico_detalle?.nombre_completo || 'Técnico'} · ${h.descripcion || 'Servicio'} · ${h.horas} h`).join(' | ')
                    : 'Sin horas imputadas aún.'}
                </div>
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid #F1F5F9' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  Respuesta del cliente al presupuesto (Correo / Teléfono)
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onRegistrarPresupuesto(true)}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      fontSize: '12px',
                      borderColor: presupuestoAprobado === true ? '#16A34A' : undefined,
                      background: presupuestoAprobado === true ? '#DCFCE7' : undefined,
                      color: presupuestoAprobado === true ? '#15803D' : undefined,
                      fontWeight: 600
                    }}
                  >
                    ✓ Cliente Aprobó
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => onRegistrarPresupuesto(false)}
                    style={{
                      height: '36px',
                      padding: '0 12px',
                      fontSize: '12px',
                      borderColor: presupuestoAprobado === false ? '#DC2626' : undefined,
                      background: presupuestoAprobado === false ? '#FEF2F2' : undefined,
                      color: presupuestoAprobado === false ? '#991B1B' : undefined,
                      fontWeight: 600
                    }}
                  >
                    ✕ Cliente Rechazó
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                Diagnóstico, repuestos y horas no se editan desde Recepción.
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A' }}>
                Entrega del vehículo
              </h4>

              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Único cambio de estado permitido:
              </div>

              <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                Lista para Entregar → Entregada
              </div>

              <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5' }}>
                Confirma el retiro antes de registrar la entrega.
              </div>

              <button
                className="btn-primary"
                disabled={loading || orden.estado !== 'LST'}
                onClick={onEntregarVehiculo}
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  opacity: orden.estado === 'LST' ? 1 : 0.5,
                  cursor: orden.estado === 'LST' ? 'pointer' : 'not-allowed'
                }}
              >
                {orden.estado === 'ENT' ? 'Vehículo ya Entregado' : 'Marcar como Entregada'}
              </button>

              <div style={{ fontSize: '12px', color: '#64748B' }}>
                Se registra fecha, hora y responsable de la entrega.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

