import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit3 } from 'lucide-react';
import {
  getClientes,
  getVehiculos,
  createCliente,
  updateCliente,
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

export default function VistaClientes({ ordenes = [], onNuevaOT }) {
  const [searchCliente, setSearchCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clienteActivoId, setClienteActivoId] = useState(null);
  const [crudMsg, setCrudMsg] = useState(null);

  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(false);

  const [formCliente, setFormCliente] = useState({
    rut: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });

  const recargarDatos = useCallback(async () => {
    try {
      const [clientesData, vehiculosData] = await Promise.all([getClientes(), getVehiculos()]);
      setClientes(clientesData);
      setVehiculos(vehiculosData);
      if (clientesData.length > 0 && !clienteActivoId) {
        setClienteActivoId(clientesData[0].id);
      }
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
  }, [clienteActivoId]);

  useEffect(() => {
    recargarDatos();
  }, [recargarDatos]);

  const filteredClientes = clientes.filter((c) => {
    if (!searchCliente.trim()) return true;
    const q = searchCliente.toLowerCase().trim();
    const nomMatch = c.nombre_completo?.toLowerCase().includes(q);
    const rutMatch = c.rut?.toLowerCase().includes(q);
    const telMatch = c.telefono?.toLowerCase().includes(q);
    return nomMatch || rutMatch || telMatch;
  });

  const clienteSeleccionado =
    filteredClientes.find((c) => c.id === clienteActivoId) || filteredClientes[0] || null;

  const autosDelCliente = clienteSeleccionado
    ? vehiculos.filter((v) => v.cliente === clienteSeleccionado.id)
    : [];

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    setCrudMsg(null);
    try {
      const creado = await createCliente({
        rut: formCliente.rut.trim(),
        nombre: formCliente.nombre.trim(),
        apellido: formCliente.apellido.trim(),
        telefono: formCliente.telefono.trim(),
        email: formCliente.email.trim(),
      });
      await recargarDatos();
      setClienteActivoId(creado.id);
      setShowNuevoCliente(false);
      setFormCliente({ rut: '', nombre: '', apellido: '', telefono: '', email: '' });
      setCrudMsg({ type: 'ok', text: `Cliente ${creado.nombre_completo} registrado exitosamente.` });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al crear el cliente.' });
    }
  };

  const handleIniciarEdicionCliente = () => {
    if (!clienteSeleccionado) return;
    setFormCliente({
      rut: clienteSeleccionado.rut || '',
      nombre: clienteSeleccionado.nombre || '',
      apellido: clienteSeleccionado.apellido || '',
      telefono: clienteSeleccionado.telefono || '',
      email: clienteSeleccionado.email || '',
    });
    setEditandoCliente(true);
    setShowNuevoCliente(false);
    setCrudMsg(null);
  };

  const handleGuardarEdicionCliente = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado) return;
    setCrudMsg(null);
    try {
      await updateCliente(clienteSeleccionado.id, {
        rut: formCliente.rut.trim(),
        nombre: formCliente.nombre.trim(),
        apellido: formCliente.apellido.trim(),
        telefono: formCliente.telefono.trim(),
        email: formCliente.email.trim(),
      });
      await recargarDatos();
      setEditandoCliente(false);
      setCrudMsg({ type: 'ok', text: 'Datos del cliente actualizados correctamente.' });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al actualizar el cliente.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Clientes
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Registro y actualización de propietarios del taller (teléfono obligatorio, correo opcional).
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

      {/* Barra de Búsqueda + Crear Cliente + Nueva OT */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar cliente
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', alignItems: 'center' }}>
          <div className="search-input-wrapper">
            <Search size={18} />
            <input
              type="text"
              className="input-control"
              placeholder="Nombre, RUT o teléfono"
              value={searchCliente}
              onChange={(e) => setSearchCliente(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowNuevoCliente(!showNuevoCliente);
              setEditandoCliente(false);
              setFormCliente({ rut: '', nombre: '', apellido: '', telefono: '', email: '' });
            }}
            style={{ height: '48px', padding: '0 16px', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>{showNuevoCliente ? 'Cancelar' : 'Crear Cliente'}</span>
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

      {/* Formulario Superior: Crear Cliente */}
      {showNuevoCliente && (
        <form
          onSubmit={handleCrearCliente}
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #BFDBFE',
            padding: '20px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr) auto',
            gap: '12px',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>RUT *</label>
            <input className="input-control" placeholder="12.345.678-9" required value={formCliente.rut} onChange={(e) => setFormCliente({ ...formCliente, rut: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Nombre *</label>
            <input className="input-control" placeholder="Juan" required value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Apellido *</label>
            <input className="input-control" placeholder="Pérez" required value={formCliente.apellido} onChange={(e) => setFormCliente({ ...formCliente, apellido: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Teléfono (Obligatorio) *</label>
            <input className="input-control" placeholder="+56912345678" required value={formCliente.telefono} onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Correo (Opcional)</label>
            <input type="email" className="input-control" placeholder="correo@ejemplo.cl" value={formCliente.email} onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })} />
          </div>
          <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 18px' }}>
            Guardar Cliente
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
        {/* Lista Izquierda: Clientes */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: '12px',
          border: '1px solid var(--border-color)',
          padding: '24px'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A', marginBottom: '16px' }}>
            Clientes registrados ({filteredClientes.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredClientes.map((cli) => {
              const isSelected = clienteSeleccionado?.id === cli.id;
              const autosCli = vehiculos.filter((v) => v.cliente === cli.id);
              return (
                <div
                  key={cli.id}
                  onClick={() => {
                    setClienteActivoId(cli.id);
                    setEditandoCliente(false);
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
                    {cli.nombre_completo}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                    {cli.rut} · {cli.telefono} · {autosCli.length} {autosCli.length === 1 ? 'vehículo' : 'vehículos'}
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
                    {clienteSeleccionado.nombre_completo}
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                    RUT {clienteSeleccionado.rut}
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleIniciarEdicionCliente}
                  style={{ height: '36px', padding: '0 12px', fontSize: '12px', fontWeight: 600 }}
                >
                  <Edit3 size={14} />
                  <span>Editar Cliente</span>
                </button>
              </div>

              {editandoCliente ? (
                <form
                  onSubmit={handleGuardarEdicionCliente}
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
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Nombre *</label>
                    <input className="input-control" required value={formCliente.nombre} onChange={(e) => setFormCliente({ ...formCliente, nombre: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Apellido *</label>
                    <input className="input-control" required value={formCliente.apellido} onChange={(e) => setFormCliente({ ...formCliente, apellido: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Teléfono (Obligatorio) *</label>
                    <input className="input-control" required value={formCliente.telefono} onChange={(e) => setFormCliente({ ...formCliente, telefono: e.target.value })} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Correo (Opcional)</label>
                    <input type="email" className="input-control" value={formCliente.email} onChange={(e) => setFormCliente({ ...formCliente, email: e.target.value })} />
                  </div>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary" onClick={() => setEditandoCliente(false)} style={{ height: '36px', padding: '0 12px', fontSize: '12px' }}>
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
                    Datos de contacto
                  </h4>
                  <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.8' }}>
                    <div><span style={{ color: '#64748B' }}>Teléfono (Obligatorio):</span> <strong>{clienteSeleccionado.telefono || 'No registrado'}</strong></div>
                    <div><span style={{ color: '#64748B' }}>Correo (Opcional):</span> {clienteSeleccionado.email || 'No registrado'}</div>
                  </div>
                </div>
              )}

              {/* Resumen de solo lectura de vehículos asociados */}
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
                  Vehículos registrados del cliente ({autosDelCliente.length})
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                          padding: '14px 18px',
                        }}
                      >
                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>
                          {auto.patente} · {auto.marca} {auto.modelo} ({auto.anio})
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                          {(auto.kilometraje || 0).toLocaleString('es-CL')} km ·{' '}
                          {ultimaOT
                            ? `Última orden: OT ${String(ultimaOT.numero).padStart(4, '0')} (${estadoInfo.label})`
                            : 'Sin órdenes registradas'}
                        </div>
                      </div>
                    );
                  })}

                  {autosDelCliente.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Este cliente aún no tiene vehículos asociados. Puedes registrarlos desde la sección <strong>Vehículos</strong>.
                    </div>
                  )}
                </div>
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
