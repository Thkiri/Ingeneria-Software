import React from 'react';
import { LayoutDashboard, FileText, DollarSign, Wrench, Users, ExternalLink, ClipboardList, ShieldCheck } from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, usuarioActual }) {
  const rol = usuarioActual?.rol || 'JEFE_TALLER';

  return (
    <aside className="sidebar">
      <div>
        <div className="sidebar-header">
          <div className="brand-container">
            <div className="brand-icon">
              <Wrench size={20} strokeWidth={2.5} />
            </div>
            <div className="brand-text">
              <h1>TecniMotor</h1>
              <span>Taller · Osorno, Chile</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {/* MENÚ EXCLUSIVO JEFE DE TALLER */}
          {rol === 'JEFE_TALLER' && (
            <>
              <button
                className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
                onClick={() => onNavigate('dashboard')}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </button>

              <button
                className={`nav-item ${currentView === 'nueva-ot' ? 'active' : ''}`}
                onClick={() => onNavigate('nueva-ot')}
              >
                <FileText size={18} />
                <span>Órdenes de trabajo</span>
              </button>

              <button
                className={`nav-item ${currentView === 'clientes-vehiculos' ? 'active' : ''}`}
                onClick={() => onNavigate('clientes-vehiculos')}
              >
                <Users size={18} />
                <span>Clientes y Vehículos</span>
              </button>

              <button
                className={`nav-item ${currentView === 'cobros' ? 'active' : ''}`}
                onClick={() => onNavigate('cobros')}
              >
                <DollarSign size={18} />
                <span>Cobros</span>
              </button>

              <button
                className={`nav-item ${currentView === 'usuarios' ? 'active' : ''}`}
                onClick={() => onNavigate('usuarios')}
              >
                <ShieldCheck size={18} />
                <span>Personal / Usuarios</span>
              </button>
            </>
          )}

          {/* MENÚ EXCLUSIVO RECEPCIÓN (RecepcionInicio.png) */}
          {rol === 'RECEPCIONISTA' && (
            <>
              <button
                className={`nav-item ${currentView === 'recepcion-inicio' ? 'active' : ''}`}
                onClick={() => onNavigate('recepcion-inicio')}
              >
                <LayoutDashboard size={18} />
                <span>Inicio</span>
              </button>

              <button
                className={`nav-item ${currentView === 'nueva-ot' ? 'active' : ''}`}
                onClick={() => onNavigate('nueva-ot')}
              >
                <FileText size={18} />
                <span>Órdenes</span>
              </button>

              <button
                className={`nav-item ${currentView === 'clientes-vehiculos' ? 'active' : ''}`}
                onClick={() => onNavigate('clientes-vehiculos')}
              >
                <Users size={18} />
                <span>Clientes y Vehículos</span>
              </button>
            </>
          )}

          {/* MENÚ EXCLUSIVO MECÁNICO (MecanicoMisORdenes.png) */}
          {rol === 'MECANICO' && (
            <button
              className={`nav-item ${currentView === 'mecanico-ordenes' ? 'active' : ''}`}
              onClick={() => onNavigate('mecanico-ordenes')}
            >
              <ClipboardList size={18} />
              <span>Mis órdenes</span>
            </button>
          )}

          <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          <button
            className="nav-item"
            onClick={() => onNavigate('consulta-cliente')}
            title="Abrir vista pública de consulta para clientes (RUT + Patente)"
          >
            <ExternalLink size={18} />
            <span>Portal Cliente (Público)</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">
          {usuarioActual?.iniciales || 'CM'}
        </div>
        <div className="user-info">
          <div className="user-name">{usuarioActual?.nombre || 'Claudio Muñoz'}</div>
          <div className="user-role">{usuarioActual?.rolLabel || 'Jefe de taller'}</div>
        </div>
      </div>
    </aside>
  );
}
