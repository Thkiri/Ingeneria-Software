import React, { useState, useEffect, useCallback } from 'react';
import { Search, Car, Edit3 } from 'lucide-react';
import {
  getClientes,
  getVehiculos,
  createVehiculo,
  updateVehiculo,
} from '../services/api';

const BADGE_MAP = {
  ING: { label: 'Ingresada' },
  DIA: { label: 'En Diagnóstico' },
  ESP: { label: 'Espera de Repuestos' },
  REP: { label: 'En Reparación' },
  CAL: { label: 'Control de Calidad' },
  LST: { label: 'Lista para Entrega' },
  ENT: { label: 'Entregada' },
  CAN: { label: 'Cancelada' },
};

export default function VistaVehiculos({ ordenes = [], onNuevaOT }) {
  const [searchVehiculo, setSearchVehiculo] = useState('');
  const [vehiculos, setVehiculos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [vehiculoActivoId, setVehiculoActivoId] = useState(null);
  const [crudMsg, setCrudMsg] = useState(null);

  const [showNuevoVehiculo, setShowNuevoVehiculo] = useState(false);
  const [editandoVehiculo, setEditandoVehiculo] = useState(false);

  const [formVehiculo, setFormVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    kilometraje: 0,
    cliente: '',
  });

  const recargarDatos = useCallback(async () => {
    try {
      const [vehiculosData, clientesData] = await Promise.all([getVehiculos(), getClientes()]);
      setVehiculos(vehiculosData);
      setClientes(clientesData);
      if (vehiculosData.length > 0 && !vehiculoActivoId) {
        setVehiculoActivoId(vehiculosData[0].id);
      }
    } catch (err) {
      console.error('Error cargando vehículos:', err);
    }
  }, [vehiculoActivoId]);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  const filteredVehiculos = vehiculos.filter((v) => {
    if (!searchVehiculo.trim()) return true;
    const q = searchVehiculo.toLowerCase().trim();
    const patMatch = v.patente?.toLowerCase().includes(q);
    const marcaMatch = v.marca?.toLowerCase().includes(q);
    const modeloMatch = v.modelo?.toLowerCase().includes(q);
    const duenoMatch = v.cliente_detalle?.nombre_completo?.toLowerCase().includes(q);
    const rutMatch = v.cliente_detalle?.rut?.toLowerCase().includes(q);
    return patMatch || marcaMatch || modeloMatch || duenoMatch || rutMatch;
  });

  const vehiculoSeleccionado =
    filteredVehiculos.find((v) => v.id === vehiculoActivoId) || filteredVehiculos[0] || null;

  const ordenesDelVehiculo = vehiculoSeleccionado
    ? ordenes.filter((o) => o.vehiculo === vehiculoSeleccionado.id)
    : [];

  const handleCrearVehiculo = async (e) => {
    e.preventDefault();
    setCrudMsg(null);
    if (!formVehiculo.cliente) {
      setCrudMsg({ type: 'error', text: 'Selecciona el cliente propietario del vehículo.' });
      return;
    }
    try {
      const creado = await createVehiculo({
        patente: formVehiculo.patente.trim().toUpperCase(),
        marca: formVehiculo.marca.trim(),
        modelo: formVehiculo.modelo.trim(),
        anio: Number(formVehiculo.anio) || new Date().getFullYear(),
        kilometraje: Number(formVehiculo.kilometraje) || 0,
        cliente: Number(formVehiculo.cliente),
      });
      await recargarDatos();
      setVehiculoActivoId(creado.id);
      setShowNuevoVehiculo(false);
      setFormVehiculo({
        patente: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        kilometraje: 0,
        cliente: '',
      });
      setCrudMsg({ type: 'ok', text: `Vehículo ${creado.patente} registrado exitosamente.` });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al registrar el vehículo.' });
    }
  };

  const handleIniciarEdicionVehiculo = () => {
    if (!vehiculoSeleccionado) return;
    setFormVehiculo({
      patente: vehiculoSeleccionado.patente || '',
      marca: vehiculoSeleccionado.marca || '',
      modelo: vehiculoSeleccionado.modelo || '',
      anio: vehiculoSeleccionado.anio || new Date().getFullYear(),
      kilometraje: vehiculoSeleccionado.kilometraje || 0,
      cliente: vehiculoSeleccionado.cliente || '',
    });
    setEditandoVehiculo(true);
    setShowNuevoVehiculo(false);
    setCrudMsg(null);
  };

  const handleGuardarEdicionVehiculo = async (e) => {
    e.preventDefault();
    if (!vehiculoSeleccionado) return;
    setCrudMsg(null);
    try {
      await updateVehiculo(vehiculoSeleccionado.id, {
        patente: formVehiculo.patente.trim().toUpperCase(),
        marca: formVehiculo.marca.trim(),
        modelo: formVehiculo.modelo.trim(),
        anio: Number(formVehiculo.anio) || new Date().getFullYear(),
        kilometraje: Number(formVehiculo.kilometraje) || 0,
        cliente: Number(formVehiculo.cliente),
      });
      await recargarDatos();
      setEditandoVehiculo(false);
      setCrudMsg({ type: 'ok', text: 'Ficha del vehículo actualizada correctamente.' });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al actualizar el vehículo.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Vehículos
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Catálogo de vehículos registrados en el taller, kilometraje y cliente propietario.
        </p>
      </div>

      {crudMsg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          background: crudMsg.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: crudMsg.type === 'error' ? '1px solid #FECACA' : '1px solid #A7F3D0',
          color: crudMsg.type === 'error' ? '#991B1B' : '#065F46',
        }}>
          {crudMsg.text}
        </div>
      )}

      {/* Barra de Búsqueda + Crear Vehículo + Nueva OT */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar vehículo
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="Patente, marca, modelo o propietario"
              value={searchVehiculo}
              onChange={(e) => setSearchVehiculo(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowNuevoVehiculo(!showNuevoVehiculo);
              setEditandoVehiculo(false);
              setFormVehiculo({
                patente: '',
                marca: '',
                modelo: '',
                anio: new Date().getFullYear(),
                kilometraje: 0,
                cliente: clientes[0]?.id ?? '',
              });
            }}
            style={{ height: '48px', padding: '0 16px', fontWeight: 600 }}
          >
            <Car size={16} />
            <span>{showNuevoVehiculo ? 'Cancelar' : 'Crear Vehículo'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={onNuevaOT}
            style={{ minWidth: '150px', justifyContent: 'center' }}
          >
            <span>Nueva OT</span>
          </button>
        </div>
      </div>

      {/* Formulario Superior: Crear Vehículo */}
      {showNuevoVehiculo && (
        <form
          onSubmit={handleCrearVehiculo}
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #BFDBFE',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: '1.4fr repeat(4, 1fr) auto',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Cliente Propietario *</label>
            <select
              className="input-control"
              required
              value={formVehiculo.cliente}
              onChange={(e) => setFormVehiculo({ ...formVehiculo, cliente: e.target.value })}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre_completo} ({c.rut})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Patente *</label>
            <input className="input-control" placeholder="BBCC12" required value={formVehiculo.patente} onChange={(e) => setFormVehiculo({ ...formVehiculo, patente: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Marca *</label>
            <input className="input-control" placeholder="Toyota" required value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Modelo *</label>
            <input className="input-control" placeholder="Hilux" required value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Año / Km *</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input type="number" className="input-control" placeholder="2022" required value={formVehiculo.anio} onChange={(e) => setFormVehiculo({ ...formVehiculo, anio: e.target.value })} />
              <input type="number" className="input-control" placeholder="Km" value={formVehiculo.kilometraje} onChange={(e) => setFormVehiculo({ ...formVehiculo, kilometraje: e.target.value })} />
            </div>
          </div>
          <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 18px' }}>
            Guardar Vehículo
          </button>
        </form>
      )}

      {/* Layout Maestro-Detalle */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.4fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* Lista Izquierda: Vehículos */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Vehículos registrados ({filteredVehiculos.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredVehiculos.map((v) => {
              const isSelected = vehiculoSeleccionado?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => {
                    setVehiculoActivoId(v.id);
                    setEditandoVehiculo(false);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? '#EFF6FF' : '#F8FAFC',
                    border: isSelected ? '1px solid #BFDBFE' : '1px solid #F1F5F9',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    {v.patente} · {v.marca} {v.modelo} ({v.anio})
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    Propietario: {v.cliente_detalle?.nombre_completo || 'Sin propietario'} · {(v.kilometraje || 0).toLocaleString('es-CL')} km
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Ficha del Vehículo */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '28px'
        }}>
          {vehiculoSeleccionado ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
                    {vehiculoSeleccionado.patente} · {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    Año {vehiculoSeleccionado.anio} · {(vehiculoSeleccionado.kilometraje || 0).toLocaleString('es-CL')} km
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleIniciarEdicionVehiculo}
                  style={{ height: '36px', padding: '0 12px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Edit3 size={14} />
                  <span>Editar Vehículo</span>
                </button>
              </div>

              {editandoVehiculo ? (
                <form
                  onSubmit={handleGuardarEdicionVehiculo}
                  style={{
                    background: '#F8FAFC',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                  }}
                >
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Patente *</label>
                    <input className="input-control" required value={formVehiculo.patente} onChange={(e) => setFormVehiculo({ ...formVehiculo, patente: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Propietario *</label>
                    <select className="input-control" required value={formVehiculo.cliente} onChange={(e) => setFormVehiculo({ ...formVehiculo, cliente: e.target.value })}>
                      {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre_completo} ({c.rut})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Marca *</label>
                    <input className="input-control" required value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Modelo *</label>
                    <input className="input-control" required value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Año *</label>
                    <input type="number" className="input-control" required value={formVehiculo.anio} onChange={(e) => setFormVehiculo({ ...formVehiculo, anio: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Kilometraje *</label>
                    <input type="number" className="input-control" required value={formVehiculo.kilometraje} onChange={(e) => setFormVehiculo({ ...formVehiculo, kilometraje: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary" onClick={() => setEditandoVehiculo(false)} style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary" style={{ height: '36px', padding: '0 14px', fontSize: '12px' }}>
                      Guardar cambios
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                    Propietario actual
                  </h4>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                    <div><span style={{ color: '#64748B' }}>Cliente:</span> <strong>{vehiculoSeleccionado.cliente_detalle?.nombre_completo || 'Sin propietario'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>RUT:</span> {vehiculoSeleccionado.cliente_detalle?.rut || '—'}</div>
                    <div><span style={{ color: '#64748B' }}>Teléfono:</span> {vehiculoSeleccionado.cliente_detalle?.telefono || '—'}</div>
                  </div>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  Historial de órdenes ({ordenesDelVehiculo.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ordenesDelVehiculo.map((ot) => {
                    const estadoInfo = BADGE_MAP[ot.estado] || BADGE_MAP.ING;
                    return (
                      <div
                        key={ot.numero}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '12px 16px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                            OT-{String(ot.numero).padStart(4, '0')} · {estadoInfo.label}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                            Ingreso: {ot.fecha_ingreso} · {ot.diagnostico || 'Sin diagnóstico'}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {ordenesDelVehiculo.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Este vehículo aún no tiene órdenes de trabajo registradas.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: '#64748B' }}>
              Selecciona un vehículo de la lista para revisar su ficha.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
