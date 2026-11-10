import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Edit3, Power } from 'lucide-react';
import {
  getUsuariosTaller,
  createUsuarioTaller,
  updateUsuarioTaller,
} from '../services/api';

const ROLES_OPCIONES = [
  { value: 'MECANICO', label: 'Mecánico' },
  { value: 'RECEPCIONISTA', label: 'Recepcionista' },
  { value: 'JEFE_TALLER', label: 'Jefe de Taller' },
];

export default function VistaUsuarios({ onUsuariosChanged }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    rut: '',
    email: '',
    rol: 'MECANICO',
    especialidad: '',
    tarifa_hora: 15000,
    password: '',
  });

  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getUsuariosTaller();
      setUsuarios(data);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al cargar personal del taller.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const abrirNuevo = () => {
    setEditId(null);
    setFormData({
      username: '',
      first_name: '',
      last_name: '',
      rut: '',
      email: '',
      rol: 'MECANICO',
      especialidad: '',
      tarifa_hora: 15000,
      password: '',
    });
    setShowForm(true);
    setMsg(null);
  };

  const abrirEdicion = (u) => {
    setEditId(u.id);
    setFormData({
      username: u.username || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      rut: u.rut || '',
      email: u.email || '',
      rol: u.rol || 'MECANICO',
      especialidad: u.especialidad || '',
      tarifa_hora: u.tarifa_hora || 0,
      password: '',
    });
    setShowForm(true);
    setMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      const payload = {
        username: formData.username.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        rut: formData.rut.trim(),
        email: formData.email.trim(),
        rol: formData.rol,
        especialidad: formData.rol === 'MECANICO' ? formData.especialidad.trim() : '',
        tarifa_hora: formData.rol === 'MECANICO' ? Number(formData.tarifa_hora) || 0 : 0,
      };
      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editId) {
        await updateUsuarioTaller(editId, payload);
        setMsg({ type: 'ok', text: 'Datos del trabajador actualizados correctamente.' });
      } else {
        await createUsuarioTaller(payload);
        setMsg({ type: 'ok', text: 'Nuevo integrante registrado exitosamente en el taller.' });
      }

      setShowForm(false);
      setEditId(null);
      await cargarUsuarios();
      if (onUsuariosChanged) onUsuariosChanged();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error al guardar el usuario.' });
    }
  };

  const handleToggleActivo = async (u) => {
    setMsg(null);
    try {
      const nuevoEstado = !u.is_active;
      await updateUsuarioTaller(u.id, { is_active: nuevoEstado });
      await cargarUsuarios();
      if (onUsuariosChanged) onUsuariosChanged();
      setMsg({
        type: 'ok',
        text: nuevoEstado
          ? `Usuario ${u.nombre_completo} habilitado nuevamente.`
          : `Usuario ${u.nombre_completo} deshabilitado (se conserva en BD por trazabilidad).`,
      });
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'No se pudo cambiar el estado del usuario.' });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
            Personal del Taller (Usuarios y Roles)
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', marginTop: '4px' }}>
            Gestión de mecánicos, recepción y jefatura. Baja lógica estricta: los usuarios se habilitan o deshabilitan sin borrarse de la base de datos.
          </p>
        </div>

        <button className="btn-primary" onClick={abrirNuevo}>
          <UserPlus size={18} />
          <span>Nuevo Integrante</span>
        </button>
      </div>

      {msg && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          background: msg.type === 'error' ? '#FEF2F2' : '#ECFDF5',
          border: msg.type === 'error' ? '1px solid #FECACA' : '1px solid #A7F3D0',
          color: msg.type === 'error' ? '#991B1B' : '#065F46',
        }}>
          {msg.text}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: '#FFFFFF',
            borderRadius: '12px',
            border: '1px solid #BFDBFE',
            padding: '24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
          }}
        >
          <div style={{ gridColumn: '1 / -1', fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
            {editId ? 'Editar integrante del taller' : 'Registrar nuevo integrante del taller'}
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Usuario (Login) *</label>
            <input className="input-control" required placeholder="ej: pedro.rojas" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Nombre *</label>
            <input className="input-control" required placeholder="Pedro" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Apellido *</label>
            <input className="input-control" required placeholder="Rojas" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>RUT</label>
            <input className="input-control" placeholder="14.555.666-7" value={formData.rut} onChange={(e) => setFormData({ ...formData, rut: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Rol en el Taller *</label>
            <select className="input-control" value={formData.rol} onChange={(e) => setFormData({ ...formData, rol: e.target.value })}>
              {ROLES_OPCIONES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Especialidad (Mecánico)</label>
            <input
              className="input-control"
              disabled={formData.rol !== 'MECANICO'}
              placeholder="Ej: Electricidad e Inyección"
              value={formData.especialidad}
              onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Tarifa / Hora CLP (Mecánico)</label>
            <input
              type="number"
              className="input-control"
              disabled={formData.rol !== 'MECANICO'}
              value={formData.tarifa_hora}
              onChange={(e) => setFormData({ ...formData, tarifa_hora: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
              {editId ? 'Nueva Contraseña (opcional)' : 'Contraseña inicial'}
            </label>
            <input
              type="password"
              className="input-control"
              placeholder={editId ? 'Dejar vacío para mantener' : 'Por defecto: taller2026'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              {editId ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      )}

      <div style={{
        background: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        padding: '24px',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Nombre</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Usuario</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>RUT</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Rol</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Especialidad</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Tarifa / Hora</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569' }}>Estado</th>
              <th style={{ padding: '12px', fontSize: '12px', color: '#475569', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr
                key={u.id}
                style={{
                  borderBottom: '1px solid #F1F5F9',
                  opacity: u.is_active ? 1 : 0.55,
                }}
              >
                <td style={{ padding: '14px 12px', fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>
                  {u.nombre_completo}
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px', color: '#334155' }}>
                  <code>{u.username}</code>
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px', color: '#334155' }}>
                  {u.rut || '—'}
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  {u.rol_display}
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px', color: '#475569' }}>
                  {u.rol === 'MECANICO' ? (u.especialidad || 'General') : '—'}
                </td>
                <td style={{ padding: '14px 12px', fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                  {u.rol === 'MECANICO' ? `$${Number(u.tarifa_hora || 0).toLocaleString('es-CL')} / h` : '—'}
                </td>
                <td style={{ padding: '14px 12px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    background: u.is_active ? '#DCFCE7' : '#FEE2E2',
                    color: u.is_active ? '#166534' : '#991B1B',
                  }}>
                    {u.is_active ? 'Activo' : 'Deshabilitado'}
                  </span>
                </td>
                <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => abrirEdicion(u)}
                      style={{ height: '34px', padding: '0 10px', fontSize: '12px' }}
                    >
                      <Edit3 size={14} />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      disabled={loading}
                      onClick={() => handleToggleActivo(u)}
                      style={{
                        height: '34px',
                        padding: '0 10px',
                        fontSize: '12px',
                        borderColor: u.is_active ? '#FECACA' : '#BBF7D0',
                        color: u.is_active ? '#991B1B' : '#166534',
                      }}
                    >
                      <Power size={14} />
                      <span>{u.is_active ? 'Deshabilitar' : 'Habilitar'}</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

