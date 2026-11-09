import React, { useState, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { getClientes, getVehiculos } from '../services/api';

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
  const [searchCliente, setSearchCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clienteActivoId, setClienteActivoId] = useState(null);

  useEffect(() => {
    if (subView === 'clientes-vehiculos') {
      Promise.all([getClientes(), getVehiculos()])
        .then(([clientesData, vehiculosData]) => {
          setClientes(clientesData);
          setVehiculos(vehiculosData);
          if (clientesData.length > 0 && !clienteActivoId) {
            setClienteActivoId(clientesData[0].id);
          }
        })
        .catch((err) => console.error('Error cargando directorio:', err));
    }
  }, [subView, clienteActivoId]);

  // =========================================================
  // SUB-VISTA 1: INICIO DE RECEPCIÓN (RecepcionInicio.png)
  // =========================================================
  if (subView === 'recepcion-inicio') {
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
                          style={{ height: '36px', padding: '0 14px', fontSize: '12px', fontWeight: 600 }}
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrdenes.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '28px', textAlign: 'center', color: '#64748B' }}>
                      No se encontraron órdenes con ese criterio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#64748B' }}>
          Solo puedes cerrar la entrega de órdenes listas para retiro.
        </div>
      </div>
    );
  }

  // =========================================================
  // SUB-VISTA 2: CLIENTES Y VEHÍCULOS (RecepcionclientesyVEhiculos.png)
  // =========================================================
  const filteredClientes = clientes.filter((c) => {
    if (!searchCliente.trim()) return true;
    const q = searchCliente.toLowerCase().trim();
    const nomMatch = c.nombre_completo?.toLowerCase().includes(q);
    const rutMatch = c.rut?.toLowerCase().includes(q);
    const autosCliente = vehiculos.filter((v) => v.cliente === c.id);
    const patMatch = autosCliente.some((v) => v.patente?.toLowerCase().includes(q));
    return nomMatch || rutMatch || patMatch;
  });

  const clienteSeleccionado =
    filteredClientes.find((c) => c.id === clienteActivoId) || filteredClientes[0] || null;

  const autosDelCliente = clienteSeleccionado
    ? vehiculos.filter((v) => v.cliente === clienteSeleccionado.id)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Clientes y Vehículos
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Busca una persona y revisa los vehículos asociados a su ficha.
        </p>
      </div>

      {/* Buscador */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar cliente o vehículo
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="Nombre, RUT o patente"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
            />
          </div>

          <button
            className="btn-primary"
            onClick={onNuevaOT}
            style={{ minWidth: '180px', justifyContent: 'center' }}
          >
            <span>Nuevo cliente / OT</span>
          </button>
        </div>
      </div>

      {/* Layout Maestro-Detalle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Lista Izquierda: Clientes Registrados */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Clientes registrados
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredClientes.map((cli) => {
              const isSelected = clienteSeleccionado?.id === cli.id;
              const autoPrincipal = vehiculos.find((v) => v.cliente === cli.id);
              return (
                <div
                  key={cli.id}
                  onClick={() => setClienteActivoId(cli.id)}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    {cli.nombre_completo}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {cli.rut} {autoPrincipal ? `· ${autoPrincipal.marca} ${autoPrincipal.modelo}` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Ficha del Cliente */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '28px'
        }}>
          {clienteSeleccionado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
                  {clienteSeleccionado.nombre_completo}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  RUT {clienteSeleccionado.rut}
                </p>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  Datos de contacto
                </h4>
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                  <div><span style={{ color: '#64748B' }}>Teléfono:</span> {clienteSeleccionado.telefono || 'No registrado'}</div>
                  <div><span style={{ color: '#64748B' }}>Correo:</span> {clienteSeleccionado.email || 'No registrado'}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '12px' }}>
                  Vehículos asociados
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {autosDelCliente.map((auto) => {
                    const ultimaOT = ordenes.find((o) => o.vehiculo === auto.id);
                    const estadoInfo = ultimaOT ? (BADGE_MAP[ultimaOT.estado] || BADGE_MAP.ING) : null;

                    return (
                      <div
                        key={auto.id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '18px 20px'
                        }}
                      >
                        <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                          {auto.patente} · {auto.marca} {auto.modelo}
                        </div>
                        <div style={{ fontSize: '13px', color: '#334155', marginTop: '6px' }}>
                          Año {auto.anio} · {(auto.kilometraje || 0).toLocaleString('es-CL')} km
                        </div>
                        <div style={{ fontSize: '13px', color: '#475569', marginTop: '4px' }}>
                          {ultimaOT
                            ? `Última orden: OT ${String(ultimaOT.numero).padStart(4, '0')} · ${estadoInfo.label}`
                            : 'Sin órdenes registradas'}
                        </div>
                      </div>
                    );
                  })}

                  {autosDelCliente.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Este cliente aún no tiene vehículos asociados.
                    </div>
                  )}
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', paddingTop: '8px' }}>
                Historial de atención vinculado por RUT y patente.
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#64748B' }}>
              Selecciona un cliente de la lista para revisar su ficha.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

