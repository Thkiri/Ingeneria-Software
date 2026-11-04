import React, { useState } from 'react';
import { Plus, Search, User, Calendar, AlertTriangle, RefreshCw } from 'lucide-react';

const ESTADOS_COLUMNAS = [
  { code: 'ING', title: 'Ingresada', barColor: 'var(--badge-ing-bar)', badgeClass: 'badge-ing' },
  { code: 'DIA', title: 'En Diagnóstico', barColor: 'var(--badge-dia-bar)', badgeClass: 'badge-dia' },
  { code: 'ESP', title: 'Espera de Repuestos', barColor: 'var(--badge-esp-bar)', badgeClass: 'badge-esp' },
  { code: 'REP', title: 'En Reparación', barColor: 'var(--badge-rep-bar)', badgeClass: 'badge-rep' },
  { code: 'CAL', title: 'Control de Calidad', barColor: 'var(--badge-cal-bar)', badgeClass: 'badge-cal' },
  { code: 'LST', title: 'Lista para Entrega', barColor: 'var(--badge-lst-bar)', badgeClass: 'badge-lst' },
  { code: 'ENT', title: 'Entregada', barColor: 'var(--badge-ent-bar)', badgeClass: 'badge-ent' },
];

export default function Dashboard({
  ordenes = [],
  mecanicos = [],
  onNuevaOT,
  onSelectOrden,
  onReload,
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMecanico, setSelectedMecanico] = useState('');
  const [filtroFecha, setFiltroFecha] = useState('todas');

  // Filtrado reactivo en el cliente
  const filteredOrdenes = ordenes.filter((o) => {
    // 1. Filtro texto de búsqueda
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const numMatch = String(o.numero).includes(q);
      const patenteMatch = o.vehiculo_detalle?.patente?.toLowerCase().includes(q);
      const clienteMatch = o.cliente_detalle?.nombre_completo?.toLowerCase().includes(q);
      const marcaMatch = o.vehiculo_detalle?.marca?.toLowerCase().includes(q);
      if (!numMatch && !patenteMatch && !clienteMatch && !marcaMatch) return false;
    }

    // 2. Filtro mecánico asignado
    if (selectedMecanico) {
      if (String(o.mecanico_asignado) !== String(selectedMecanico)) return false;
    }

    return true;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setSelectedMecanico('');
    setFiltroFecha('todas');
  };

  // Contadores para el subtítulo del Dashboard
  const enProceso = ordenes.filter(o => ['ING', 'DIA', 'ESP', 'REP', 'CAL'].includes(o.estado)).length;
  const listas = ordenes.filter(o => o.estado === 'LST').length;
  const entregadas = ordenes.filter(o => o.estado === 'ENT').length;
  const esperaRepuestos = ordenes.filter(o => o.estado === 'ESP');

  const horaActual = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header del Dashboard */}
      <div className="dashboard-header">
        <div className="header-title">
          <h2>Dashboard del jefe de taller</h2>
          <p>
            {enProceso} órdenes en proceso · {listas} listas para entrega · {entregadas} entregadas
          </p>
        </div>

        <button className="btn-primary" onClick={onNuevaOT}>
          <Plus size={18} />
          <span>Nueva OT</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>Buscar orden de trabajo</label>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="N° OT, patente o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Mecánico asignado</label>
          <select
            className="input-control"
            value={selectedMecanico}
            onChange={(e) => setSelectedMecanico(e.target.value)}
          >
            <option value="">Todos los mecánicos</option>
            {mecanicos.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre_completo || m.username}
              </option>
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
            <option value="semana">Esta semana</option>
          </select>
        </div>

        <div>
          <button className="btn-clear-filters" onClick={limpiarFiltros}>
            Limpiar filtros
          </button>
        </div>
      </div>

      {/* Meta del Tablero */}
      <div className="board-meta">
        <span className="count-label">
          Órdenes de trabajo ({filteredOrdenes.length} en el tablero)
        </span>

        <div className="sync-indicator">
          <span className="status-dot" />
          <span>Actualizado a las {horaActual}</span>
          <button
            onClick={onReload}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
            title="Recargar datos"
          >
            <RefreshCw size={13} style={{ marginLeft: '4px' }} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tablero Kanban (7 Columnas de Estado) */}
      <div className="kanban-board">
        {ESTADOS_COLUMNAS.map((col) => {
          const ordenesEnColumna = filteredOrdenes.filter((o) => o.estado === col.code);

          return (
            <div key={col.code} className="kanban-col">
              {/* Encabezado de Columna */}
              <div className="col-header">
                <div className="col-color-bar" style={{ backgroundColor: col.barColor }} />
                <div className="col-title-row">
                  <span className="col-title">{col.title}</span>
                  <span className="col-badge-count">{ordenesEnColumna.length}</span>
                </div>
              </div>

              {/* Lista de Tarjetas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {ordenesEnColumna.map((orden) => (
                  <div
                    key={orden.numero}
                    className="ot-card"
                    onClick={() => onSelectOrden(orden)}
                  >
                    <span className="ot-number">
                      OT {String(orden.numero).padStart(4, '0')}
                    </span>

                    <span className="ot-patente">
                      {orden.vehiculo_detalle?.patente || 'S/P'}
                    </span>

                    <span className="ot-vehicle">
                      {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
                    </span>

                    <div className="ot-mechanic">
                      <User size={13} />
                      <span>{orden.mecanico_detalle?.nombre_completo || 'Sin asignar'}</span>
                    </div>

                    <div style={{ marginTop: '4px' }}>
                      <span className={`badge ${col.badgeClass}`}>
                        {col.title}
                      </span>
                    </div>
                  </div>
                ))}

                {ordenesEnColumna.length === 0 && (
                  <div style={{
                    padding: '24px 8px',
                    textAlign: 'center',
                    color: 'var(--text-light)',
                    fontSize: '12px',
                    border: '1px dashed var(--border-color)',
                    borderRadius: '8px'
                  }}>
                    Sin órdenes
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Banner de Alerta / Atención */}
      {esperaRepuestos.length > 0 && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: '10px',
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '14px',
          color: '#92400E'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertTriangle size={18} color="#D97706" />
            <span>
              <strong>{esperaRepuestos.length} orden(es) en espera de repuestos:</strong>{' '}
              {esperaRepuestos.map(o => `OT ${String(o.numero).padStart(4, '0')} (${o.vehiculo_detalle?.patente})`).join(', ')}
            </span>
          </div>

          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', cursor: 'pointer' }}>
            Revisar en tablero →
          </span>
        </div>
      )}
    </div>
  );
}

