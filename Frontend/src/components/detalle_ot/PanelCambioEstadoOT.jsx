import React from 'react';
import { Check } from 'lucide-react';

export default function PanelCambioEstadoOT({
  rol,
  orden,
  estadosSelector,
  loading,
  presupuestoAprobado,
  onTransicionEstado,
  onReingresoGarantia,
}) {
  return (
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
          const blockedByBudget = est.code === 'REP' && presupuestoAprobado === false;
          return (
            <button
              key={est.code}
              type="button"
              disabled={loading || isCurrent || blockedByBudget}
              onClick={() => onTransicionEstado(est.code)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: isCurrent ? '1px solid #FDBA74' : '1px solid #F1F5F9',
                background: isCurrent ? '#FFF7ED' : '#F8FAFC',
                color: isCurrent ? '#C2410C' : blockedByBudget ? '#94A3B8' : '#0F172A',
                fontWeight: isCurrent ? 700 : 500,
                fontSize: '13px',
                textAlign: 'left',
                cursor: isCurrent || blockedByBudget ? 'not-allowed' : 'pointer',
                opacity: blockedByBudget ? 0.6 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{est.label}{blockedByBudget ? ' (Presupuesto rechazado)' : ''}</span>
              {isCurrent && <Check size={15} color="#C2410C" />}
            </button>
          );
        })}
      </div>

      {rol === 'JEFE_TALLER' && orden.estado === 'ENT' && (
        <div style={{ paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            disabled={loading}
            onClick={onReingresoGarantia}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #BFDBFE',
              background: '#EFF6FF',
              color: '#1E40AF',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            Autorizar Reingreso por Garantía ($0)
          </button>
        </div>
      )}

      {rol === 'JEFE_TALLER' && orden.estado !== 'CAN' && orden.estado !== 'ENT' && (
        <div style={{ paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
          <button
            type="button"
            disabled={loading}
            onClick={() => onTransicionEstado('CAN', 'Orden cancelada por el Jefe de Taller')}
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
  );
}

