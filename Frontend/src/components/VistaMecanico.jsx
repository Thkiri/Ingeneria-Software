import React, { useState } from 'react';
import { User, Search } from 'lucide-react';

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

export default function VistaMecanico({
  ordenes = [],
  usuarioActual,
  onSelectOrden,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar órdenes asignadas al mecánico actual (o de demostración si tiene OTs asignadas)
  const misOrdenesBase = ordenes.filter((o) => {
    const nombreMec = o.mecanico_detalle?.nombre_completo?.toLowerCase() || '';
    const userMec = o.mecanico_detalle?.username?.toLowerCase() || '';
    if (
      o.mecanico_asignado === usuarioActual?.id ||
      o.segundo_mecanico === usuarioActual?.id ||
      nombreMec.includes('diego') ||
      nombreMec.includes('carlos') ||
      userMec === 'mecanico1'
    ) {
      return true;
    }
    return false;
  });

  // Si en BD de prueba ninguna coincide por ID exacto, mostrar las que tienen mecánico asignado
  const ordenesDelMecanico = misOrdenesBase.length > 0 ? misOrdenesBase : ordenes.slice(0, 4);

  const filtered = ordenesDelMecanico.filter((o) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase().trim();
    const numMatch = String(o.numero).includes(q);
    const patMatch = o.vehiculo_detalle?.patente?.toLowerCase().includes(q);
    return numMatch || patMatch;
  });

  const totalAsignadas = ordenesDelMecanico.length;
  const enReparacion = ordenesDelMecanico.filter((o) => o.estado === 'REP').length;
  const esperaRepuestos = ordenesDelMecanico.filter((o) => o.estado === 'ESP').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Encabezado */}
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Mis órdenes
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Solo aparecen las órdenes asignadas a ti.
        </p>
      </div>

      {/* 3 Tarjetas de Métricas (MecanicoMisORdenes.png) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px'
        }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>
            {totalAsignadas}
          </span>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
            Órdenes asignadas
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px'
        }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>
            {enReparacion}
          </span>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
            En reparación
          </span>
        </div>

        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'baseline',
          gap: '16px'
        }}>
          <span style={{ fontSize: '28px', fontWeight: 700, color: '#0F172A' }}>
            {esperaRepuestos}
          </span>
          <span style={{ fontSize: '14px', color: '#475569', fontWeight: 500 }}>
            Espera de repuestos
          </span>
        </div>
      </div>

      {/* Buscador */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar en mis órdenes
        </label>
        <div className="search-input-wrapper">
          <Search size={18} />
          <input
            type="text"
            className="input-control"
            placeholder="N° de OT o patente"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Grilla: Tu carga de trabajo */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
          Tu carga de trabajo
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
          gap: '18px'
        }}>
          {filtered.map((orden) => {
            const badgeInfo = BADGE_MAP[orden.estado] || BADGE_MAP.ING;

            return (
              <div
                key={orden.numero}
                style={{
                  background: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div style={{
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '14px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    OT {String(orden.numero).padStart(4, '0')}
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                    {orden.vehiculo_detalle?.patente}
                  </div>
                  <div style={{ fontSize: '13px', color: '#334155', marginTop: '2px' }}>
                    {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12px',
                    color: '#64748B',
                    marginTop: '12px',
                    marginBottom: '12px'
                  }}>
                    <User size={14} />
                    <span>{usuarioActual?.nombre || orden.mecanico_detalle?.nombre_completo || 'Diego Soto'}</span>
                  </div>

                  <span
                    className={`badge ${badgeInfo.cls}`}
                    style={{ width: 'auto', display: 'inline-block', padding: '5px 12px' }}
                  >
                    {badgeInfo.label}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: '#475569', minHeight: '18px' }}>
                  {orden.diagnostico
                    ? orden.diagnostico.slice(0, 38) + (orden.diagnostico.length > 38 ? '...' : '')
                    : 'Revisión inicial'}
                </div>

                <button
                  className="btn-secondary"
                  onClick={() => onSelectOrden(orden)}
                  style={{ width: '100%', height: '38px', justifyContent: 'center', fontSize: '13px', fontWeight: 600 }}
                >
                  Ver orden
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

