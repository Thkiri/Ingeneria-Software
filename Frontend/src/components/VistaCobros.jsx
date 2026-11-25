import React, { useState, useMemo } from 'react';
import { FileText, Search } from 'lucide-react';

const ESTADOS_FILTRO = [
  { code: 'ING', label: 'Ingresada' },
  { code: 'DIA', label: 'En Diagnóstico' },
  { code: 'ESP', label: 'Espera de Repuestos' },
  { code: 'REP', label: 'En Reparación' },
  { code: 'CAL', label: 'Control de Calidad' },
  { code: 'LST', label: 'Lista para Entrega' },
  { code: 'ENT', label: 'Entregada' },
  { code: 'CAN', label: 'Cancelada' },
];

function cumpleFiltroFecha(fechaStr, filtroFecha) {
  if (filtroFecha === 'todas' || !fechaStr) return true;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [y, m, d] = fechaStr.split('-').map(Number);
  if (!y || !m || !d) return true;
  const fechaOrden = new Date(y, m - 1, d);
  const diffDias = Math.floor((hoy - fechaOrden) / (1000 * 60 * 60 * 24));
  if (filtroFecha === 'hoy') return diffDias === 0;
  if (filtroFecha === 'semana') return diffDias >= 0 && diffDias <= 7;
  if (filtroFecha === 'mes') return diffDias >= 0 && diffDias <= 30;
  return true;
}

export default function VistaCobros({ ordenes = [], onSelectOrden }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEstado, setSelectedEstado] = useState('');
  const [selectedCliente, setSelectedCliente] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todas');
  const [ordenActivaNum, setOrdenActivaNum] = useState(
    ordenes.length > 0 ? ordenes[0].numero : null
  );

  const clientesUnicos = useMemo(() => {
    const mapa = new Map();
    ordenes.forEach((o) => {
      if (o.cliente && !mapa.has(o.cliente)) {
        mapa.set(o.cliente, o.cliente_detalle?.nombre_completo || `Cliente #${o.cliente}`);
      }
    });
    return Array.from(mapa.entries()).map(([id, nombre]) => ({ id, nombre }));
  }, [ordenes]);

  const filteredOrdenes = ordenes.filter((o) => {
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const numMatch = String(o.numero).includes(q) || (o.codigo_ot || '').toLowerCase().includes(q);
      const patMatch = o.vehiculo_detalle?.patente?.toLowerCase().includes(q);
      const cliMatch = o.cliente_detalle?.nombre_completo?.toLowerCase().includes(q);
      const rutMatch = o.cliente_detalle?.rut?.toLowerCase().includes(q);
      if (!numMatch && !patMatch && !cliMatch && !rutMatch) return false;
    }
    if (selectedEstado && o.estado !== selectedEstado) return false;
    if (selectedCliente && String(o.cliente) !== String(selectedCliente)) return false;
    if (!cumpleFiltroFecha(o.fecha_ingreso, filtroFecha)) return false;
    return true;
  });

  const ordenSeleccionada =
    filteredOrdenes.find((o) => o.numero === ordenActivaNum) || filteredOrdenes[0] || null;

  const limpiarFiltros = () => {
    setSearchTerm('');
    setSelectedEstado('');
    setSelectedCliente('');
    setFiltroFecha('todas');
  };

  const formatCLP = (val) => {
    const num = Number(val) || 0;
    return '$' + Math.round(num).toLocaleString('es-CL');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Órdenes y Cobros
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Registro histórico completo de órdenes de trabajo, filtros rápidos y desglose oficial de cobro (Diagnóstico, Repuestos, Mano de obra e IVA 19%).
        </p>
      </div>

      {/* Barra de Filtros estilo Dashboard del Jefe */}
      <div className="filter-bar" style={{ gridTemplateColumns: '1.5fr 1fr 1fr 1fr auto' }}>
        <div className="filter-group">
          <label>Buscar orden</label>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="N° OT, patente, RUT o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Estado</label>
          <select
            className="input-control"
            value={selectedEstado}
            onChange={(e) => setSelectedEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            {ESTADOS_FILTRO.map((e) => (
              <option key={e.code} value={e.code}>{e.label}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Cliente</label>
          <select
            className="input-control"
            value={selectedCliente}
            onChange={(e) => setSelectedCliente(e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {clientesUnicos.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Fecha de ingreso</label>
          <select
            className="input-control"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          >
            <option value="todas">Todas las fechas</option>
            <option value="hoy">Hoy</option>
            <option value="semana">Últimos 7 días</option>
            <option value="mes">Últimos 30 días</option>
          </select>
        </div>

        <div>
          <button className="btn-clear-filters" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
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
            Órdenes encontradas ({filteredOrdenes.length} de {ordenes.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredOrdenes.map((o) => {
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
                      {(o.cierres_cobro || []).some((c) => c.ciclo < (o.ciclo || 1)) && (
                        <span> · Ciclo {o.ciclo} (con cierre previo)</span>
                      )}
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                    {formatCLP(o.total_a_pagar)}
                  </div>
                </div>
              );
            })}
            {filteredOrdenes.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
                No se encontraron órdenes con los filtros aplicados.
              </div>
            )}
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
                  DOCUMENTO DE COBRO · OT-{String(ordenSeleccionada.numero).padStart(4, '0')} · CICLO {ordenSeleccionada.ciclo || 1}
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

            {(ordenSeleccionada.cierres_cobro || []).filter((c) => c.ciclo < (ordenSeleccionada.ciclo || 1)).length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Cobros cerrados de ciclos anteriores
                </div>
                {(ordenSeleccionada.cierres_cobro || [])
                  .filter((c) => c.ciclo < (ordenSeleccionada.ciclo || 1))
                  .map((cierre) => (
                    <div
                      key={cierre.id}
                      style={{
                        background: '#FFFFFF',
                        borderRadius: '10px',
                        padding: '16px 20px',
                        border: '1px solid #CBD5E1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        fontSize: '13px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, color: '#0F172A' }}>
                          Ciclo {cierre.ciclo} · {cierre.tipo_display}
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>
                          {cierre.fecha_cierre ? new Date(cierre.fecha_cierre).toLocaleDateString('es-CL') : ''}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Diagnóstico inicial</span>
                        <span>{formatCLP(cierre.costo_diagnostico)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Repuestos ({cierre.cantidad_repuestos} ítems)</span>
                        <span>{formatCLP(cierre.total_repuestos_neto)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
                        <span>Mano de obra ({cierre.cantidad_horas} registros)</span>
                        <span>{formatCLP(cierre.total_mano_obra_neto)}</span>
                      </div>
                      <div style={{ borderTop: '1px dashed #E2E8F0', margin: '4px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#334155', fontWeight: 600 }}>
                        <span>Subtotal neto / IVA 19%</span>
                        <span>{formatCLP(cierre.subtotal_neto)} + {formatCLP(cierre.iva_19)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: '#0F172A', fontSize: '14px', paddingTop: '2px' }}>
                        <span>Total cobrado (Ciclo {cierre.ciclo})</span>
                        <span>{formatCLP(cierre.total_a_pagar)} CLP</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

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

