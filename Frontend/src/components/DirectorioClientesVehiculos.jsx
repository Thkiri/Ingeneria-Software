import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Edit3, Car, Link2 } from 'lucide-react';
import {
  getClientes,
  getVehiculos,
  createCliente,
  updateCliente,
  createVehiculo,
  updateVehiculo,
} from '../services/api';

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

export default function DirectorioClientesVehiculos({ ordenes = [], onNuevaOT }) {
  const [searchCliente, setSearchCliente] = useState('');
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [clienteActivoId, setClienteActivoId] = useState(null);
  const [crudMsg, setCrudMsg] = useState(null);

  const [showNuevoCliente, setShowNuevoCliente] = useState(false);
  const [showNuevoVehiculoGlobal, setShowNuevoVehiculoGlobal] = useState(false);
  const [editandoCliente, setEditandoCliente] = useState(false);
  const [showAsociarRegistrado, setShowAsociarRegistrado] = useState(false);
  const [vehiculoIdParaAsociar, setVehiculoIdParaAsociar] = useState('');
  const [editVehiculoId, setEditVehiculoId] = useState(null);

  const [formCliente, setFormCliente] = useState({
    rut: '',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
  });

  const [formVehiculo, setFormVehiculo] = useState({
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    kilometraje: 0,
    cliente: '',
  });

  const recargarDirectorio = useCallback(async () => {
    try {
      const [clientesData, vehiculosData] = await Promise.all([getClientes(), getVehiculos()]);
      setClientes(clientesData);
      setVehiculos(vehiculosData);
      if (clientesData.length > 0 && !clienteActivoId) {
        setClienteActivoId(clientesData[0].id);
      }
    } catch (err) {
      console.error('Error cargando directorio:', err);
    }
  }, [clienteActivoId]);

  useEffect(() => {
    recargarDirectorio();
  }, [recargarDirectorio]);

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

  const vehiculosDisponiblesAsociar = clienteSeleccionado
    ? vehiculos.filter((v) => v.cliente !== clienteSeleccionado.id)
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
      await recargarDirectorio();
      setClienteActivoId(creado.id);
      setShowNuevoCliente(false);
      setFormCliente({ rut: '', nombre: '', apellido: '', telefono: '', email: '' });
      setCrudMsg({ type: 'ok', text: `Cliente ${creado.nombre_completo} registrado exitosamente.` });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al crear el cliente.' });
    }
  };

  const handleCrearVehiculoGlobal = async (e) => {
    e.preventDefault();
    setCrudMsg(null);
    const targetClienteId = Number(formVehiculo.cliente) || clienteSeleccionado?.id;
    if (!targetClienteId) {
      setCrudMsg({ type: 'error', text: 'Selecciona el cliente propietario para el vehículo.' });
      return;
    }
    try {
      const creado = await createVehiculo({
        patente: formVehiculo.patente.trim().toUpperCase(),
        marca: formVehiculo.marca.trim(),
        modelo: formVehiculo.modelo.trim(),
        anio: Number(formVehiculo.anio) || new Date().getFullYear(),
        kilometraje: Number(formVehiculo.kilometraje) || 0,
        cliente: targetClienteId,
      });
      await recargarDirectorio();
      setClienteActivoId(targetClienteId);
      setShowNuevoVehiculoGlobal(false);
      setFormVehiculo({ patente: '', marca: '', modelo: '', anio: new Date().getFullYear(), kilometraje: 0, cliente: '' });
      setCrudMsg({ type: 'ok', text: `Vehículo ${creado.patente} registrado exitosamente.` });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al registrar el vehículo.' });
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
    setShowNuevoVehiculoGlobal(false);
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
      await recargarDirectorio();
      setEditandoCliente(false);
      setCrudMsg({ type: 'ok', text: 'Datos del cliente actualizados correctamente.' });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al actualizar el cliente.' });
    }
  };

  const handleAsociarVehiculoRegistrado = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado || !vehiculoIdParaAsociar) return;
    setCrudMsg(null);
    try {
      const updated = await updateVehiculo(Number(vehiculoIdParaAsociar), {
        cliente: clienteSeleccionado.id,
      });
      await recargarDirectorio();
      setShowAsociarRegistrado(false);
      setVehiculoIdParaAsociar('');
      setCrudMsg({
        type: 'ok',
        text: `Vehículo registrado ${updated.patente} asociado exitosamente a ${clienteSeleccionado.nombre_completo}.`,
      });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al asociar el vehículo.' });
    }
  };

  const handleIniciarEdicionVehiculo = (auto) => {
    setEditVehiculoId(auto.id);
    setFormVehiculo({
      patente: auto.patente,
      marca: auto.marca,
      modelo: auto.modelo,
      anio: auto.anio,
      kilometraje: auto.kilometraje || 0,
      cliente: auto.cliente,
    });
    setCrudMsg(null);
  };

  const handleGuardarEdicionVehiculo = async (e) => {
    e.preventDefault();
    if (!editVehiculoId) return;
    setCrudMsg(null);
    try {
      await updateVehiculo(editVehiculoId, {
        patente: formVehiculo.patente.trim().toUpperCase(),
        marca: formVehiculo.marca.trim(),
        modelo: formVehiculo.modelo.trim(),
        anio: Number(formVehiculo.anio) || new Date().getFullYear(),
        kilometraje: Number(formVehiculo.kilometraje) || 0,
      });
      await recargarDirectorio();
      setEditVehiculoId(null);
      setCrudMsg({ type: 'ok', text: 'Ficha del vehículo actualizada correctamente.' });
    } catch (err) {
      setCrudMsg({ type: 'error', text: err.message || 'Error al actualizar el vehículo.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
          Clientes y Vehículos
        </h2>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
          Directorio maestro simétrico: registra o edita clientes y vehículos, y asocia vehículos registrados.
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

      {/* Barra de Búsqueda + Acciones Simétricas (Crear Cliente / Crear Vehículo / Nueva OT) */}
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px', display: 'block' }}>
          Buscar cliente o vehículo
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '12px', alignItems: 'center' }}>
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
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowNuevoCliente(!showNuevoCliente);
              setShowNuevoVehiculoGlobal(false);
              setEditandoCliente(false);
              setFormCliente({ rut: '', nombre: '', apellido: '', telefono: '', email: '' });
            }}
            style={{ height: '48px', padding: '0 16px', fontWeight: 600 }}
          >
            <Plus size={16} />
            <span>{showNuevoCliente ? 'Cancelar' : 'Crear Cliente'}</span>
          </button>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setShowNuevoVehiculoGlobal(!showNuevoVehiculoGlobal);
              setShowNuevoCliente(false);
              setFormVehiculo({
                patente: '',
                marca: '',
                modelo: '',
                anio: new Date().getFullYear(),
                kilometraje: 0,
                cliente: clienteSeleccionado?.id || (clientes[0]?.id ?? ''),
              });
            }}
            style={{ height: '48px', padding: '0 16px', fontWeight: 600 }}
          >
            <Car size={16} />
            <span>{showNuevoVehiculoGlobal ? 'Cancelar' : 'Crear Vehículo'}</span>
          </button>

          <button
            className="btn-primary"
            onClick={onNuevaOT}
            style={{ minWidth: '160px', justifyContent: 'center' }}
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

      {/* Formulario Superior: Crear Vehículo */}
      {showNuevoVehiculoGlobal && (
        <form
          onSubmit={handleCrearVehiculoGlobal}
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
        {/* Lista Izquierda: Clientes Registrados */}
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
                    setShowAsociarRegistrado(false);
                    setEditVehiculoId(null);
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
                    {cli.rut} · {autosCli.length} {autosCli.length === 1 ? 'vehículo' : 'vehículos'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel Derecho: Ficha del Cliente y sus Vehículos */}
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

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                    Vehículos asociados ({autosDelCliente.length})
                  </h4>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowAsociarRegistrado(!showAsociarRegistrado)}
                    style={{ height: '34px', padding: '0 12px', fontSize: '12px', fontWeight: 600 }}
                  >
                    <Link2 size={14} />
                    <span>{showAsociarRegistrado ? 'Cancelar' : 'Asociar Vehículo Registrado'}</span>
                  </button>
                </div>

                {showAsociarRegistrado && (
                  <form
                    onSubmit={handleAsociarVehiculoRegistrado}
                    style={{
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      borderRadius: '10px',
                      padding: '14px',
                      marginBottom: '12px',
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      gap: '10px',
                      alignItems: 'end',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700, color: '#1E3A8A', display: 'block', marginBottom: '4px' }}>
                        Seleccionar vehículo existente en el sistema para asociarlo a {clienteSeleccionado.nombre_completo}
                      </label>
                      <select
                        className="input-control"
                        required
                        value={vehiculoIdParaAsociar}
                        onChange={(e) => setVehiculoIdParaAsociar(e.target.value)}
                      >
                        <option value="">Elegir vehículo registrado por patente...</option>
                        {vehiculosDisponiblesAsociar.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.patente} — {v.marca} {v.modelo} ({v.anio}) · Dueño actual: {v.cliente_detalle?.nombre_completo}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 16px', fontSize: '12px' }}>
                      Vincular a este cliente
                    </button>
                  </form>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {autosDelCliente.map((auto) => {
                    const ultimaOT = ordenes.find((o) => o.vehiculo === auto.id);
                    const estadoInfo = ultimaOT ? (BADGE_MAP[ultimaOT.estado] || BADGE_MAP.ING) : null;
                    const isEditingThis = editVehiculoId === auto.id;

                    return (
                      <div
                        key={auto.id}
                        style={{
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          borderRadius: '10px',
                          padding: '16px 20px'
                        }}
                      >
                        {isEditingThis ? (
                          <form onSubmit={handleGuardarEdicionVehiculo} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr) auto', gap: '8px', alignItems: 'end' }}>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600 }}>Patente</label>
                              <input className="input-control" required value={formVehiculo.patente} onChange={(e) => setFormVehiculo({ ...formVehiculo, patente: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600 }}>Marca</label>
                              <input className="input-control" required value={formVehiculo.marca} onChange={(e) => setFormVehiculo({ ...formVehiculo, marca: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600 }}>Modelo</label>
                              <input className="input-control" required value={formVehiculo.modelo} onChange={(e) => setFormVehiculo({ ...formVehiculo, modelo: e.target.value })} />
                            </div>
                            <div>
                              <label style={{ fontSize: '11px', fontWeight: 600 }}>Kilometraje</label>
                              <input type="number" className="input-control" required value={formVehiculo.kilometraje} onChange={(e) => setFormVehiculo({ ...formVehiculo, kilometraje: e.target.value })} />
                            </div>
                            <button type="submit" className="btn-primary" style={{ height: '48px', padding: '0 12px', fontSize: '12px' }}>
                              Guardar
                            </button>
                          </form>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                                {auto.patente} · {auto.marca} {auto.modelo}
                              </div>
                              <div style={{ fontSize: '13px', color: '#334155', marginTop: '4px' }}>
                                Año {auto.anio} · {(auto.kilometraje || 0).toLocaleString('es-CL')} km
                              </div>
                              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                                {ultimaOT
                                  ? `Última orden: OT ${String(ultimaOT.numero).padStart(4, '0')} · ${estadoInfo.label}`
                                  : 'Sin órdenes registradas'}
                              </div>
                            </div>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleIniciarEdicionVehiculo(auto)}
                              style={{ height: '32px', padding: '0 10px', fontSize: '12px' }}
                            >
                              <Edit3 size={13} />
                              <span>Editar Vehículo</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {autosDelCliente.length === 0 && (
                    <div style={{ fontSize: '13px', color: '#64748B' }}>
                      Este cliente aún no tiene vehículos asociados. Usa "Crear Vehículo" arriba o "Asociar Vehículo Registrado".
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

