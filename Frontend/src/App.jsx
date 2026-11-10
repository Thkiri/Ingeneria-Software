import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Dashboard from './components/Dashboard';
import NuevaOT from './components/NuevaOT';
import DetalleOTModal from './components/DetalleOTModal';
import ConsultaCliente from './components/ConsultaCliente';
import LoginTaller, { USUARIOS_DEMO } from './components/LoginTaller';
import VistaRecepcion from './components/VistaRecepcion';
import VistaMecanico from './components/VistaMecanico';
import VistaCobros from './components/VistaCobros';
import VistaUsuarios from './components/VistaUsuarios';
import { getOrdenes, getMecanicos } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('consulta-cliente');
  const [usuarioActual, setUsuarioActual] = useState(USUARIOS_DEMO.JEFE_TALLER);
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

  const handleLoginSuccess = (perfil) => {
    setUsuarioActual(perfil);
    setCurrentView(perfil.vistaInicial);
    showNotification(`Sesión iniciada como ${perfil.nombre} (${perfil.rolLabel})`);
  };

  const handleCambiarRolDemo = (nuevoPerfil) => {
    setUsuarioActual(nuevoPerfil);
    setCurrentView(nuevoPerfil.vistaInicial);
    setSelectedOrden(null);
    showNotification(`Rol cambiado a: ${nuevoPerfil.rolLabel} (${nuevoPerfil.nombre})`);
  };

  const handleOTCreated = (nuevaOT) => {
    showNotification(`¡OT-${String(nuevaOT.numero).padStart(4, '0')} creada exitosamente para la patente ${nuevaOT.vehiculo_detalle?.patente || ''}!`);
    loadData();
    setCurrentView(usuarioActual.vistaInicial);
  };

  const handleStateChanged = (updatedOrden) => {
    showNotification(`OT-${String(updatedOrden.numero).padStart(4, '0')} actualizada.`);
    setSelectedOrden(updatedOrden);
    loadData();
  };

  // 1. Vista Pública para Clientes (Sin Cuenta)
  if (currentView === 'consulta-cliente') {
    return (
      <ConsultaCliente
        onIrATaller={() => setCurrentView('login')}
      />
    );
  }

  // 2. Pantalla de Login del Personal (Ingresov2.png)
  if (currentView === 'login') {
    return (
      <LoginTaller
        onLoginSuccess={handleLoginSuccess}
        onVolverACliente={() => setCurrentView('consulta-cliente')}
      />
    );
  }

  // 3. Layout Interno del Taller según Rol
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

      {/* Barra Lateral Navegación Dinámica por Rol */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        usuarioActual={usuarioActual}
      />

      {/* Área Principal de Contenido */}
      <div className="main-wrapper">
        <Topbar
          subtitle="Gestión de Órdenes de Trabajo y Repuestos"
          usuarioActual={usuarioActual}
          onCambiarRolDemo={handleCambiarRolDemo}
          onLogout={() => setCurrentView('login')}
        />

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

          {(currentView === 'recepcion-inicio' || currentView === 'clientes-vehiculos') && (
            <VistaRecepcion
              subView={currentView}
              ordenes={ordenes}
              onNuevaOT={() => setCurrentView('nueva-ot')}
              onSelectOrden={(orden) => setSelectedOrden(orden)}
            />
          )}

          {currentView === 'mecanico-ordenes' && (
            <VistaMecanico
              ordenes={ordenes}
              usuarioActual={usuarioActual}
              onSelectOrden={(orden) => setSelectedOrden(orden)}
            />
          )}

          {currentView === 'cobros' && (
            <VistaCobros
              ordenes={ordenes}
              onSelectOrden={(orden) => setSelectedOrden(orden)}
            />
          )}

          {currentView === 'usuarios' && (
            <VistaUsuarios
              onUsuariosChanged={loadData}
            />
          )}

          {currentView === 'nueva-ot' && (
            <NuevaOT
              onCancel={() => setCurrentView(usuarioActual.vistaInicial)}
              onSuccess={handleOTCreated}
            />
          )}
        </main>
      </div>

      {/* Modal Detalle de OT */}
      {selectedOrden && (
        <DetalleOTModal
          orden={selectedOrden}
          usuarioActual={usuarioActual}
          mecanicos={mecanicos}
          onClose={() => setSelectedOrden(null)}
          onStateChanged={handleStateChanged}
        />
      )}
    </div>
  );
}
