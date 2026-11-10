import React, { useState, useEffect } from 'react';
import { Plus, Info, AlertCircle, ArrowLeft } from 'lucide-react';
import { getClientes, createCliente, getVehiculos, createVehiculo, createOrden, getMecanicos } from '../services/api';

export default function NuevaOT({ onCancel, onSuccess }) {
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    rut: '',
    telefono: '',
    email: '',
    patente: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    kilometraje: '',
    motivoIngreso: '',
    mecanicoId: '',
  });

  const [mecanicos, setMecanicos] = useState([]);
  const [clientesList, setClientesList] = useState([]);
  const [vehiculosList, setVehiculosList] = useState([]);
  const [clienteExistenteId, setClienteExistenteId] = useState('');
  const [vehiculoExistenteId, setVehiculoExistenteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    Promise.all([getMecanicos(), getClientes(), getVehiculos()])
      .then(([mecanicosData, clientesData, vehiculosData]) => {
        setMecanicos(mecanicosData);
        setClientesList(clientesData);
        setVehiculosList(vehiculosData);
      })
      .catch(err => console.error('Error cargando catálogos en Nueva OT:', err));
  }, []);

  const handleSelectClienteExistente = (e) => {
    const id = e.target.value;
    setClienteExistenteId(id);
    setVehiculoExistenteId('');
    if (!id) {
      setFormData(prev => ({
        ...prev,
        nombreCompleto: '',
        rut: '',
        telefono: '',
        email: '',
      }));
      return;
    }
    const cli = clientesList.find(c => String(c.id) === String(id));
    if (cli) {
      const autosCli = vehiculosList.filter(v => v.cliente === cli.id);
      const primerAuto = autosCli[0] || null;
      setFormData(prev => ({
        ...prev,
        nombreCompleto: cli.nombre_completo || `${cli.nombre} ${cli.apellido}`.trim(),
        rut: cli.rut || '',
        telefono: cli.telefono || '',
        email: cli.email || '',
        ...(primerAuto ? {
          patente: primerAuto.patente,
          marca: primerAuto.marca,
          modelo: primerAuto.modelo,
          anio: primerAuto.anio,
          kilometraje: primerAuto.kilometraje || 0,
        } : {}),
      }));
      if (primerAuto) {
        setVehiculoExistenteId(String(primerAuto.id));
      }
    }
  };

  const handleSelectVehiculoExistente = (e) => {
    const id = e.target.value;
    setVehiculoExistenteId(id);
    if (!id) {
      setFormData(prev => ({
        ...prev,
        patente: '',
        marca: '',
        modelo: '',
        anio: new Date().getFullYear(),
        kilometraje: '',
      }));
      return;
    }
    const veh = vehiculosList.find(v => String(v.id) === String(id));
    if (veh) {
      const dueno = clientesList.find(c => c.id === veh.cliente);
      if (dueno && !clienteExistenteId) {
        setClienteExistenteId(String(dueno.id));
      }
      setFormData(prev => ({
        ...prev,
        patente: veh.patente || '',
        marca: veh.marca || '',
        modelo: veh.modelo || '',
        anio: veh.anio || new Date().getFullYear(),
        kilometraje: veh.kilometraje ?? 0,
        ...(dueno ? {
          nombreCompleto: dueno.nombre_completo || `${dueno.nombre} ${dueno.apellido}`.trim(),
          rut: dueno.rut || '',
          telefono: dueno.telefono || '',
          email: dueno.email || '',
        } : {}),
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Validaciones básicas requeridas
    if (!formData.nombreCompleto || !formData.rut || !formData.telefono) {
      setErrorMsg('Por favor completa todos los datos obligatorios del cliente.');
      return;
    }
    if (!formData.patente || !formData.marca || !formData.modelo || !formData.motivoIngreso) {
      setErrorMsg('Por favor completa los datos del vehículo y el motivo de ingreso.');
      return;
    }

    setLoading(true);

    try {
      // 1. Separar nombre y apellido para el modelo de Django
      const parts = formData.nombreCompleto.trim().split(' ');
      const nombre = parts[0] || 'Cliente';
      const apellido = parts.slice(1).join(' ') || 'General';

      // 2. Buscar o crear Cliente por RUT
      const clientesExistentes = await getClientes(formData.rut.trim());
      let cliente = clientesExistentes.find(c => c.rut.toUpperCase() === formData.rut.trim().toUpperCase());

      if (!cliente) {
        cliente = await createCliente({
          rut: formData.rut.trim(),
          nombre,
          apellido,
          telefono: formData.telefono.trim(),
          email: formData.email.trim(),
        });
      }

      // 3. Buscar o crear Vehículo por Patente
      const vehiculosExistentes = await getVehiculos(null, formData.patente.trim());
      let vehiculo = vehiculosExistentes.find(v => v.patente.toUpperCase() === formData.patente.trim().toUpperCase());

      if (!vehiculo) {
        vehiculo = await createVehiculo({
          patente: formData.patente.trim().toUpperCase(),
          marca: formData.marca.trim(),
          modelo: formData.modelo.trim(),
          anio: parseInt(formData.anio, 10) || new Date().getFullYear(),
          kilometraje: parseInt(formData.kilometraje, 10) || 0,
          cliente: cliente.id,
        });
      }

      // 4. Crear la Orden de Trabajo
      const nuevaOrden = await createOrden({
        cliente: cliente.id,
        vehiculo: vehiculo.id,
        mecanico_asignado: formData.mecanicoId ? parseInt(formData.mecanicoId, 10) : null,
        diagnostico: formData.motivoIngreso.trim(),
        estado: 'ING',
      });

      onSuccess(nuevaOrden);
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar la orden de trabajo.');
    } finally {
      setLoading(false);
    }
  };

  const fechaHoy = new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const horaActual = new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Encabezado */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' }}>
          <button
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <ArrowLeft size={14} /> Órdenes de trabajo
          </button>
          <span>/</span>
          <span>Nueva OT</span>
        </div>
        <h2 style={{ fontSize: '24px', fontWeight: 700, marginTop: '8px' }}>Nueva OT</h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '2px' }}>
          Registra al cliente y su vehículo para iniciar una orden de trabajo.
        </p>
      </div>

      {errorMsg && (
        <div style={{
          background: '#FEE2E2',
          border: '1px solid #FCA5A5',
          color: '#991B1B',
          padding: '12px 16px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px'
        }}>
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Columna Izquierda: Formularios */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 01 Datos del Cliente */}
            <div className="form-card">
              <div className="form-section-title">
                <span className="form-section-number">01</span>
                <span>Datos del cliente</span>
              </div>

              <div className="form-group" style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A' }}>
                  Cliente registrado o nuevo ingreso
                </label>
                <select
                  className="input-control"
                  value={clienteExistenteId}
                  onChange={handleSelectClienteExistente}
                  style={{ marginTop: '6px' }}
                >
                  <option value="">+ Registrar un cliente nuevo en los campos de abajo</option>
                  {clientesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre_completo} · RUT {c.rut} · Tel: {c.telefono}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Nombre completo *</label>
                  <input
                    type="text"
                    name="nombreCompleto"
                    className="input-control"
                    placeholder="Ej. María González"
                    value={formData.nombreCompleto}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>RUT *</label>
                  <input
                    type="text"
                    name="rut"
                    className="input-control"
                    placeholder="Ej. 12.345.678-5"
                    value={formData.rut}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Teléfono *</label>
                  <input
                    type="text"
                    name="telefono"
                    className="input-control"
                    placeholder="Ej. +56 9 1234 5678"
                    value={formData.telefono}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Correo electrónico (opcional)</label>
                  <input
                    type="email"
                    name="email"
                    className="input-control"
                    placeholder="Ej. nombre@correo.cl"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* 02 Datos del Vehículo */}
            <div className="form-card">
              <div className="form-section-title">
                <span className="form-section-number">02</span>
                <span>Datos del vehículo</span>
              </div>

              <div className="form-group" style={{ marginBottom: '16px', background: '#F8FAFC', padding: '12px 14px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A' }}>
                  Vehículo registrado o nuevo vehículo
                </label>
                <select
                  className="input-control"
                  value={vehiculoExistenteId}
                  onChange={handleSelectVehiculoExistente}
                  style={{ marginTop: '6px' }}
                >
                  <option value="">+ Registrar un vehículo nuevo en los campos de abajo</option>
                  {(clienteExistenteId
                    ? vehiculosList.filter((v) => String(v.cliente) === String(clienteExistenteId))
                    : vehiculosList
                  ).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} — {v.marca} {v.modelo} ({v.anio}) · {v.cliente_detalle?.nombre_completo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Patente *</label>
                  <input
                    type="text"
                    name="patente"
                    className="input-control"
                    placeholder="Ej. GHKL-45"
                    value={formData.patente}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Marca *</label>
                  <input
                    type="text"
                    name="marca"
                    className="input-control"
                    placeholder="Ej. Toyota"
                    value={formData.marca}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Modelo *</label>
                  <input
                    type="text"
                    name="modelo"
                    className="input-control"
                    placeholder="Ej. Yaris"
                    value={formData.modelo}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Año *</label>
                  <input
                    type="number"
                    name="anio"
                    className="input-control"
                    placeholder="Ej. 2020"
                    value={formData.anio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Kilometraje actual (km) *</label>
                  <input
                    type="number"
                    name="kilometraje"
                    className="input-control"
                    placeholder="Ej. 85000"
                    value={formData.kilometraje}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mecánico asignado (opcional)</label>
                  <select
                    name="mecanicoId"
                    className="input-control"
                    value={formData.mecanicoId}
                    onChange={handleChange}
                  >
                    <option value="">Sin asignar aún</option>
                    {mecanicos.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nombre_completo || m.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Motivo de ingreso *</label>
                <textarea
                  name="motivoIngreso"
                  placeholder="Describe la falla o el servicio que solicita el cliente..."
                  value={formData.motivoIngreso}
                  onChange={handleChange}
                  required
                />
                <span className="helper-text">
                  Incluye síntomas, desde cuándo ocurren y observaciones de recepción.
                </span>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Informativa de Ingreso */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="form-card" style={{ background: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}>
                <span>📋 Registro de ingreso</span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                Estos datos se asignan automáticamente al crear la OT.
              </p>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Fecha de ingreso</div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{fechaHoy}</div>
              </div>

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Hora de ingreso · Hora de Chile
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{horaActual} hrs</div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid var(--border-subtle)' }} />

              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>Estado inicial</div>
                <span className="badge badge-ing" style={{ width: 'auto', display: 'inline-block', padding: '6px 14px' }}>
                  Ingresada
                </span>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>
                La orden quedará disponible en el tablero de órdenes de trabajo.
              </p>
            </div>

            <div style={{
              background: '#F8FAFC',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '14px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              fontSize: '12px',
              color: 'var(--text-muted)'
            }}>
              <Info size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>Revisa los datos de contacto y la patente antes de crear la OT para asegurar la trazabilidad.</span>
            </div>
          </div>
        </div>

        {/* Acciones al pie */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            * Campos obligatorios
          </span>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <Plus size={18} />
              <span>{loading ? 'Creando...' : 'Crear OT'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

