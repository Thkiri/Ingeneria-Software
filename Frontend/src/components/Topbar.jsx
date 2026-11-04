import React from 'react';
import { Bell } from 'lucide-react';

export default function Topbar({ subtitle = "Gestión de Órdenes de Trabajo y Repuestos" }) {
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
        <span className="topbar-date">{formattedDate}</span>
        <button className="btn-icon" title="Notificaciones">
          <Bell size={18} />
        </button>
      </div>
    </header>
  );
}

