import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import DirectorioClientesVehiculos from './DirectorioClientesVehiculos';

const BADGE_MAP = {
  ING: { label: 'Ingresada', cls: 'badge-ing' },
  DIA: { label: 'En Diagnóstico', cls: 'badge-dia' },
  ESP: { label: 'Espera de Repuestos', cls: 'badge-esp' },
  REP: { label: 'En Reparación', cls: 'badge-rep' },
  CAL: { label: 'Control de Calidad', cls: 'badge-cal' },
  LST: { label: 'Lista para Entrega', cls: 'badge-lst' },
  ENT: { label: 'Entregada', cls: 'badge-ent' },
  CAN: { label: 'Cancelada', cls: 'badge-ing' },
};

export default function VistaRecepcion({
  subView = 'recepcion-inicio',
  ordenes = [],
  onNuevaOT,
  onSelectOrden,
}) {
  const [searchOrden, setSearchOrden] = useState('');

  if (subView === 'clientes-vehiculos') {
    return (
      <DirectorioClientesVehiculos
        ordenes={ordenes}
        onNuevaOT={onNuevaOT}
      />
    );
  }

  const filteredOrdenes = ordenes.filter((o) => {
    if (!searchOrden.trim()) return true;
    const q = searchOrden.toLowerCase().trim();
    const numMatch = String(o.numero).includes(q) || (o.codigo_ot || '').toLowerCase().includes(q);
    const patMatch = o.vehiculo_detalle?.patente?.toLowerCase().includes(q);
    const cliMatch = o.cliente_detalle?.nombre_completo?.toLowerCase().includes(q);
    const rutMatch = o.cliente_detalle?.rut?.toLowerCase().includes(q);
    return numMatch || patMatch || cliMatch || rutMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Inicio de Recepción
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Consulta órdenes y registra ingresos. Los datos técnicos son de solo lectura.
        </p>
      </div>

      {/* Barra de Búsqueda + Nueva OT */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar orden
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="N° de OT, patente o RUT"
              value={searchOrden}
              onChange={(e) => setSearchOrden(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={onNuevaOT}
            style={{ minWidth: '180px', justifyContent: 'center' }}
          >
            <Plus size={18} />
            <span>Nueva OT</span>
          </button>
        </div>
      </div>

      {/* Tabla de Órdenes de Trabajo */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px 28px'
      }}>
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Órdenes de trabajo
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {filteredOrdenes.length} órdenes · Información de consulta
          </p>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: '#64748B', fontSize: '12px' }}>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>N° OT</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Patente / Vehículo</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Cliente / RUT</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Mecánico</th>
                <th style={{ padding: '12px 8px', fontWeight: 600 }}>Estado</th>
                <th style={{ padding: '12px 8px', fontWeight: 600, textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdenes.map((orden) => {
                const badgeInfo = BADGE_MAP[orden.estado] || BADGE_MAP.ING;
                return (
                  <tr
                    key={orden.numero}
                    style={{ borderBottom: '1px solid #F1F5F9', fontSize: '13px' }}
                  >
                    <td style={{ padding: '16px 8px', fontWeight: 700, fontSize: '14px', color: '#0F172A' }}>
                      {String(orden.numero).padStart(4, '0')}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>
                        {orden.vehiculo_detalle?.patente}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>
                        {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ fontWeight: 600, color: '#0F172A' }}>
                        {orden.cliente_detalle?.nombre_completo}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B' }}>
                        {orden.cliente_detalle?.rut}
                      </div>
                    </td>
                    <td style={{ padding: '16px 8px', color: '#334155', fontWeight: 500 }}>
                      {orden.mecanico_detalle?.nombre_completo || 'Por asignar'}
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span
                        className={`badge ${badgeInfo.cls}`}
                        style={{ width: 'auto', display: 'inline-block', padding: '6px 12px' }}
                      >
                        {badgeInfo.label}
                      </span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                      <button
                        className="btn-secondary"
                        onClick={() => onSelectOrden(orden)}
                        style={{ height: '38px', padding: '0 14px', fontSize: '12px', fontWeight: 600 }}
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
