import React from 'react';
import { LayoutDashboard, FileText, DollarSign, Wrench } from 'lucide-react';

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
            title="Módulo de Cobros - Disponible en Sprint 3"
            onClick={(e) => e.preventDefault()}
          >
            <DollarSign size={18} />
            <span>Cobros (Sprint 3)</span>
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

