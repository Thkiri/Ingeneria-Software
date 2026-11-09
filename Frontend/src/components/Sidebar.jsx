import React from 'react';
import { LayoutDashboard, FileText, DollarSign, Wrench, ExternalLink } from 'lucide-react';

export default function Sidebar({ currentView, onNavigate, counts = {} }) {
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
            className="nav-item"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
            title="Módulo de Cobros - Disponible en Fase 4"
            onClick={(e) => e.preventDefault()}
          >
            <DollarSign size={18} />
            <span>Cobros</span>
          </button>

          <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.08)' }} />

          <button
            className={`nav-item ${currentView === 'consulta-cliente' ? 'active' : ''}`}
            onClick={() => onNavigate('consulta-cliente')}
            title="Abrir vista pública de consulta para clientes (RUT + Patente)"
          >
            <ExternalLink size={18} />
            <span>Portal Cliente (Público)</span>
          </button>
        </nav>
      </div>

      <div className="sidebar-footer">
        <div className="user-avatar">CM</div>
        <div className="user-info">
          <div className="user-name">Claudio Muñoz</div>
          <div className="user-role">Jefe de taller</div>
        </div>
      </div>
    </aside>
  );
}

