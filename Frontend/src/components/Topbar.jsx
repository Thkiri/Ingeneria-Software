import React from 'react';
import { Bell, LogOut } from 'lucide-react';
import { USUARIOS_DEMO } from './LoginTaller';

export default function Topbar({
  subtitle = "Gestión de Órdenes de Trabajo y Repuestos",
  usuarioActual,
  onCambiarRolDemo,
  onLogout,
}) {
  const today = new Intl.DateTimeFormat('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const formattedDate = today.charAt(0).toUpperCase() + today.slice(1);

  return (
    <header className="topbar">
      <div className="topbar-subtitle">
        {subtitle}
      </div>

      <div className="topbar-right">
        {/* Selector de Demostración (FluijoDeAccesoPorRol.png) */}
        {onCambiarRolDemo && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B' }}>
              Cambiar rol (demo):
            </span>
            <select
              value={usuarioActual?.demoKey || usuarioActual?.rol || 'JEFE_TALLER'}
              onChange={(e) => {
                const nuevoRolKey = e.target.value;
                if (USUARIOS_DEMO[nuevoRolKey]) {
                  onCambiarRolDemo(USUARIOS_DEMO[nuevoRolKey]);
                }
              }}
              style={{
                height: '34px',
                padding: '0 10px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                fontSize: '12px',
                fontWeight: 600,
                color: '#0F172A',
                cursor: 'pointer'
              }}
            >
              <option value="JEFE_TALLER">Jefe de taller · Claudio Muñoz</option>
              <option value="RECEPCIONISTA">Recepción · Carolina Pérez</option>
              <option value="MECANICO">Mecánico · Diego Soto</option>
              <option value="MECANICO_FELIPE">Mecánico · Felipe Vargas</option>
            </select>
          </div>
        )}

        <span className="topbar-date">{formattedDate}</span>

        <button className="btn-icon" title="Notificaciones">
          <Bell size={18} />
        </button>

        {onLogout && (
          <button
            className="btn-icon"
            title="Cerrar sesión / Volver a Login"
            onClick={onLogout}
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </header>
  );
}
