import React from 'react';
import { Check } from 'lucide-react';

export default function ResumenSeguimientoOT({ orden, estados, currentStepIndex }) {
  return (
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
          {estados.map((est, idx) => {
            const isPassed = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;

            return (
              <div key={est.code} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                {idx < estados.length - 1 && (
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
  );
}

