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
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Cargar mecánicos disponibles
    getMecanicos()
      .then(data => setMecanicos(data))
      .catch(err => console.error('Error cargando mecánicos:', err));
  }, []);

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

  const horaActual = new Date().toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });

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
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Hora de ingreso</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Hora de Chile</span>
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '2px' }}>{horaActual} h</div>
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

