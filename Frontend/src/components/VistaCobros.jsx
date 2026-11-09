import React, { useState } from 'react';
import { DollarSign, CheckCircle2, FileText } from 'lucide-react';

export default function VistaCobros({ ordenes = [], onSelectOrden }) {
  const [ordenActivaNum, setOrdenActivaNum] = useState(
    ordenes.length > 0 ? ordenes[0].numero : null
  );

  const ordenSeleccionada =
    ordenes.find((o) => o.numero === ordenActivaNum) || ordenes[0] || null;

  const formatCLP = (val) => {
    const num = Number(val) || 0;
    return '$' + Math.round(num).toLocaleString('es-CL');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Liquidación y Cobros de Órdenes (HU-10)
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Desglose oficial de cobro: Diagnóstico base ($15.000), Repuestos netos, Mano de obra e IVA (19%).
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.3fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Listado de OTs */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '22px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
            Seleccionar Orden de Trabajo
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ordenes.map((o) => {
              const isSelected = ordenSeleccionada?.numero === o.numero;
              return (
                <div
                  key={o.numero}
                  onClick={() => setOrdenActivaNum(o.numero)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#FFF7ED' : '#F8FAFC',
                    border: isSelected ? '1px solid #FDBA74' : '1px solid #F1F5F9',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                      OT-{String(o.numero).padStart(4, '0')} · {o.vehiculo_detalle?.patente}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                      {o.cliente_detalle?.nombre_completo} · {o.estado_display}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                    {formatCLP(o.total_a_pagar)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Liquidación Estructurada (consideraciones_negocio.md) */}
        {ordenSeleccionada && (
          <div style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                  DOCUMENTO DE COBRO · OT-{String(ordenSeleccionada.numero).padStart(4, '0')}
                </div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                  {ordenSeleccionada.vehiculo_detalle?.patente} · {ordenSeleccionada.vehiculo_detalle?.marca} {ordenSeleccionada.vehiculo_detalle?.modelo}
                </h3>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                  Cliente: {ordenSeleccionada.cliente_detalle?.nombre_completo} ({ordenSeleccionada.cliente_detalle?.rut})
                </div>
              </div>

              {ordenSeleccionada.reingresado_por_garantia && (
                <span style={{
                  background: '#DBEAFE',
                  color: '#1E40AF',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  Reingreso por Garantía ($0 Diagnóstico)
                </span>
              )}
            </div>

            {/* Estructura Exacta de 4 Líneas */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '10px',
              padding: '22px 24px',
              border: '1px solid #E2E8F0',
              fontFamily: 'var(--font-family)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                <span style={{ color: '#334155', fontWeight: 500 }}>
                  Revisión y diagnóstico inicial {ordenSeleccionada.reingresado_por_garantia ? '(Garantía)' : ''}
                </span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>
                  {formatCLP(ordenSeleccionada.costo_diagnostico)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                <span style={{ color: '#334155', fontWeight: 500 }}>
                  Repuestos ({ordenSeleccionada.repuestos_detalle?.length || 0} ítems)
                </span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>
                  {formatCLP(ordenSeleccionada.total_repuestos_neto)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '14px' }}>
                <span style={{ color: '#334155', fontWeight: 500 }}>
                  Mano de obra ({ordenSeleccionada.registro_horas?.length || 0} registros)
                </span>
                <span style={{ fontWeight: 600, color: '#0F172A' }}>
                  {formatCLP(ordenSeleccionada.total_mano_obra_neto)}
                </span>
              </div>

              <div style={{ borderTop: '1px dashed #CBD5E1', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>Subtotal neto</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {formatCLP(ordenSeleccionada.subtotal_neto)}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '14px' }}>
                <span style={{ color: '#475569', fontWeight: 600 }}>IVA 19%</span>
                <span style={{ fontWeight: 700, color: '#0F172A' }}>
                  {formatCLP(ordenSeleccionada.iva_19)}
                </span>
              </div>

              <div style={{ borderTop: '2px solid #0F172A', margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Total a pagar
                </span>
                <span style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)' }}>
                  {formatCLP(ordenSeleccionada.total_a_pagar)} CLP
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn-secondary"
                onClick={() => onSelectOrden(ordenSeleccionada)}
              >
                <FileText size={16} />
                <span>Ver / Editar Detalle de la OT</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

