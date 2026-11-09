import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import NuevaOT from './components/NuevaOT';
import DetalleOTModal from './components/DetalleOTModal';
import ConsultaCliente from './components/ConsultaCliente';
import { getOrdenes, getMecanicos } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('consulta-cliente'); // 'consulta-cliente' | 'dashboard' | 'nueva-ot'
  const [ordenes, setOrdenes] = useState([]);
  const [mecanicos, setMecanicos] = useState([]);
  const [selectedOrden, setSelectedOrden] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordenesData, mecanicosData] = await Promise.all([
        getOrdenes(),
        getMecanicos(),
      ]);
      setOrdenes(ordenesData);
      setMecanicos(mecanicosData);
    } catch (err) {
      console.error('Error cargando datos de TecniMotor:', err);
      showNotification('No se pudo conectar con el servidor Django (¿está corriendo en el puerto 8000?)', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOTCreated = (nuevaOT) => {
    showNotification(`¡OT-${String(nuevaOT.numero).padStart(4, '0')} creada exitosamente para la patente ${nuevaOT.vehiculo_detalle?.patente || ''}!`);
    loadData();
    setCurrentView('dashboard');
  };

  const handleStateChanged = (updatedOrden) => {
    showNotification(`OT-${String(updatedOrden.numero).padStart(4, '0')} actualizada a estado: ${updatedOrden.estado_display}`);
    setSelectedOrden(updatedOrden);
    loadData();
  };

  if (currentView === 'consulta-cliente') {
    return (
      <ConsultaCliente
        onIrATaller={() => setCurrentView('dashboard')}
      />
    );
  }

  return (
    <div className="app-layout">
      {/* Toast de Notificación Global */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          padding: '14px 22px',
          borderRadius: '8px',
          background: notification.type === 'error' ? '#991B1B' : '#047857',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 600,
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>{notification.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* Barra Lateral Navegación */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        counts={{ total: ordenes.length }}
      />

      {/* Área Principal de Contenido */}
      <div className="main-wrapper">
        <Topbar subtitle="Gestión de Órdenes de Trabajo y Repuestos · Taller Central" />

        <main className="content-container">
          {currentView === 'dashboard' && (
            <Dashboard
              ordenes={ordenes}
              mecanicos={mecanicos}
              onNuevaOT={() => setCurrentView('nueva-ot')}
              onSelectOrden={(orden) => setSelectedOrden(orden)}
              onReload={loadData}
              loading={loading}
            />
          )}

          {currentView === 'nueva-ot' && (
            <NuevaOT
              onCancel={() => setCurrentView('dashboard')}
              onSuccess={handleOTCreated}
            />
          )}
        </main>
      </div>

      {/* Modal Detalle de OT */}
      {selectedOrden && (
        <DetalleOTModal
          orden={selectedOrden}
          onClose={() => setSelectedOrden(null)}
          onStateChanged={handleStateChanged}
        />
      )}
    </div>
  );
}
