import React from 'react';
import { Check, Phone } from 'lucide-react';

const TRANSICIONES_VALIDAS = {
  ING: ['DIA'],
  DIA: ['ESP', 'REP'],
  ESP: ['REP'],
  REP: ['CAL'],
  CAL: ['LST', 'REP'],
  LST: ['ENT'],
  ENT: [],
  CAN: [],
};

export default function PanelCambioEstadoOT({
  rol,
  orden,
  estadosSelector,
  loading,
  presupuestoAprobado,
  formatCLP = (v) => '$' + Math.round(Number(v) || 0).toLocaleString('es-CL'),
  onTransicionEstado,
  onReingresoGarantia,
  onRegistrarCobroParcial,
  onNotificarCliente,
}) {
  const puedeCancelarPorEstado = ['ING', 'DIA', 'ESP', 'REP'].includes(orden.estado);
  const requiereCobroParcial = orden.estado === 'REP';
  const cobroParcialVigente = Boolean(orden.cobro_parcial_vigente);
  const cancelarBloqueado = requiereCobroParcial && !cobroParcialVigente;
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
          const permitidos = TRANSICIONES_VALIDAS[orden.estado] || [];
          const blockedBySequence = !isCurrent && !permitidos.includes(est.code);
          const tieneHoras = (orden.registro_horas || []).length > 0;
          const calidadAprobada = Boolean(orden.control_calidad?.aprobado);
          const tieneMecanico = Boolean(orden.mecanico_asignado);

          const blockedByMechanic = !blockedBySequence && est.code === 'DIA' && !tieneMecanico;
          const blockedByBudget = !blockedBySequence && est.code === 'REP' && ['DIA', 'ESP'].includes(orden.estado)
            && presupuestoAprobado !== true;
          const blockedByNotice = !blockedBySequence && est.code === 'ENT' && !orden.cliente_notificado_para_entrega;
          const blockedCalSinHoras = !blockedBySequence && est.code === 'CAL' && !tieneHoras;
          const blockedLst = !blockedBySequence && est.code === 'LST' && (!tieneHoras || !calidadAprobada);
          const isBlocked = blockedBySequence || blockedByMechanic || blockedByBudget || blockedByNotice || blockedCalSinHoras || blockedLst;

          let blockReason = '';
          if (blockedBySequence) {
            blockReason = orden.estado === 'ING'
              ? ' (Requiere diagnóstico previo)'
              : ' (Etapa no disponible desde este estado)';
          } else if (blockedByMechanic) {
            blockReason = ' (Falta asignar mecánico)';
          } else if (blockedByBudget) {
            blockReason = presupuestoAprobado === false
              ? ' (Presupuesto rechazado)'
              : ' (Falta aprobación del cliente)';
          } else if (blockedByNotice) blockReason = ' (Falta registrar la llamada)';
          else if (blockedCalSinHoras) blockReason = ' (Faltan horas hombre)';
          else if (blockedLst) {
            blockReason = !tieneHoras
              ? ' (Faltan horas hombre)'
              : ' (Requiere aprobar Control Calidad)';
          }

          return (
            <button
              key={est.code}
              type="button"
              disabled={loading || isCurrent || isBlocked}
              onClick={() => onTransicionEstado(est.code)}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '8px',
                border: isCurrent ? '1px solid #FDBA74' : '1px solid #F1F5F9',
                background: isCurrent ? '#FFF7ED' : '#F8FAFC',
                color: isCurrent ? '#C2410C' : isBlocked ? '#94A3B8' : '#0F172A',
                fontWeight: isCurrent ? 700 : 500,
                fontSize: '13px',
                textAlign: 'left',
                cursor: isCurrent || isBlocked ? 'not-allowed' : 'pointer',
                opacity: isBlocked ? 0.6 : 1,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{est.label}{blockReason}</span>
              {isCurrent && <Check size={15} color="#C2410C" />}
            </button>
          );
        })}
      </div>

      {rol === 'JEFE_TALLER' && orden.estado === 'LST' && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: '#EFF6FF',
          border: '1px solid #BFDBFE',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Phone size={14} />
            <span>Aviso telefónico de retiro</span>
          </div>
          <div style={{ fontSize: '12px', color: '#334155', lineHeight: 1.4 }}>
            Tel: <strong>{orden.cliente_detalle?.telefono || 'Sin teléfono'}</strong>
            <br />
            Total a informar: <strong>{formatCLP(orden.total_a_pagar)}</strong>
          </div>
          {orden.cliente_notificado_para_entrega ? (
            <div style={{
              padding: '6px 10px',
              borderRadius: '6px',
              background: '#DCFCE7',
              color: '#15803D',
              fontSize: '12px',
              fontWeight: 700,
            }}>
              ✓ Llamada al cliente registrada
            </div>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={onNotificarCliente}
              className="btn-primary"
              style={{ width: '100%', height: '36px', fontSize: '12px', justifyContent: 'center' }}
            >
              Registrar llamada: Cliente notificado
            </button>
          )}
        </div>
      )}

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

      {rol === 'JEFE_TALLER' && puedeCancelarPorEstado && (
        <div style={{ paddingTop: '10px', borderTop: '1px solid #F1F5F9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {requiereCobroParcial && (
            cobroParcialVigente ? (
              <div style={{
                padding: '8px 10px',
                borderRadius: '8px',
                background: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#065F46',
                fontSize: '12px',
                fontWeight: 600,
              }}>
                ✓ Cobro parcial pagado ({formatCLP(orden.monto_cobro_parcial)})
              </div>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={onRegistrarCobroParcial}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #FDE68A',
                  background: '#FFFBEB',
                  color: '#92400E',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Registrar Cobro Parcial ({formatCLP(orden.total_a_pagar)})
              </button>
            )
          )}

          <button
            type="button"
            disabled={loading || cancelarBloqueado}
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
              opacity: cancelarBloqueado ? 0.5 : 1,
              cursor: cancelarBloqueado ? 'not-allowed' : 'pointer'
            }}
          >
            {cancelarBloqueado ? 'Cancelar OT (Requiere cobro parcial)' : 'Cancelar Orden de Trabajo'}
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

