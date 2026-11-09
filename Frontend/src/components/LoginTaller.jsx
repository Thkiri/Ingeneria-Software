import React, { useState } from 'react';
import { Wrench, ArrowRight, Users } from 'lucide-react';

export const USUARIOS_DEMO = {
  JEFE_TALLER: {
    id: 2,
    username: 'claudio.munoz',
    password: 'jefe123',
    nombre: 'Claudio Muñoz',
    iniciales: 'CM',
    rol: 'JEFE_TALLER',
    rolLabel: 'Jefe de taller',
    vistaInicial: 'dashboard',
  },
  RECEPCIONISTA: {
    id: 3,
    username: 'carolina.perez',
    password: 'recepcion123',
    nombre: 'Carolina Pérez',
    iniciales: 'CP',
    rol: 'RECEPCIONISTA',
    rolLabel: 'Recepción',
    vistaInicial: 'recepcion-inicio',
  },
  MECANICO: {
    id: 4,
    username: 'diego.soto',
    password: 'mecanico123',
    nombre: 'Diego Soto',
    iniciales: 'DS',
    rol: 'MECANICO',
    rolLabel: 'Mecánico',
    especialidad: 'Mantención y sistema de frenos',
    tarifa_hora: 15000,
    vistaInicial: 'mecanico-ordenes',
  },
};

export default function LoginTaller({ onLoginSuccess, onVolverACliente }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();

    // Validar contra usuarios configurados o alias comunes
    if ((cleanUser === 'claudio.munoz' || cleanUser === 'jefe' || cleanUser === 'admin') && (password === 'jefe123' || password === 'admin123')) {
      setError(false);
      onLoginSuccess(USUARIOS_DEMO.JEFE_TALLER);
      return;
    }
    if ((cleanUser === 'carolina.perez' || cleanUser === 'recepcion') && password === 'recepcion123') {
      setError(false);
      onLoginSuccess(USUARIOS_DEMO.RECEPCIONISTA);
      return;
    }
    if ((cleanUser === 'diego.soto' || cleanUser === 'mecanico1' || cleanUser === 'mecanico') && password === 'mecanico123') {
      setError(false);
      onLoginSuccess(USUARIOS_DEMO.MECANICO);
      return;
    }

    setError(true);
  };

  const accesoRapidoDemo = (perfil) => {
    setError(false);
    onLoginSuccess(perfil);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0B192C',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 48px'
    }}>
      {/* Encabezado Superior */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '8px',
              background: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Wrench size={18} color="#FFFFFF" />
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.3px' }}>
              TecniMotor
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
            Osorno, Chile · Gestión de Órdenes de Trabajo y Repuestos
          </div>
        </div>
      </div>

      {/* Tarjeta Central de Login (Ingresov2.png / IngresoERROR.png) */}
      <div style={{
        maxWidth: '440px',
        width: '100%',
        margin: '32px auto',
        background: '#FFFFFF',
        color: '#0F172A',
        borderRadius: '14px',
        padding: '38px 36px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)'
      }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A' }}>
          Bienvenido al taller
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', marginTop: '6px', marginBottom: '26px' }}>
          Ingresa con el usuario asignado a tu equipo.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Usuario
            </label>
            <input
              type="text"
              className="input-control"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Contraseña
            </label>
            <input
              type="password"
              className="input-control"
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Alerta de Error (IngresoERROR.png) */}
          {error && (
            <div style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#991B1B'
            }}>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>
                Usuario o contraseña incorrectos.
              </div>
              <div style={{ fontSize: '12px', color: '#B91C1C', marginTop: '2px' }}>
                Revisa tus datos e inténtalo nuevamente.
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
          >
            Ingresar
          </button>
        </form>

        <div style={{ marginTop: '22px', fontSize: '12px', color: '#64748B', lineHeight: '1.6' }}>
          <p>¿Necesitas acceso? Contacta al jefe de taller.</p>
          <p>El acceso muestra solo las opciones de tu rol.</p>
        </div>

        {/* Selector Rápido de Demostración (FluijoDeAccesoPorRol.png) */}
        <div style={{
          marginTop: '24px',
          paddingTop: '18px',
          borderTop: '1px dashed #CBD5E1'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '10px' }}>
            <Users size={14} color="var(--primary)" />
            <span>Acceso rápido según rol (Modo Demo Presentación):</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => accesoRapidoDemo(USUARIOS_DEMO.JEFE_TALLER)}
              style={{
                background: '#FFF7ED',
                border: '1px solid #FDBA74',
                borderRadius: '8px',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                Jefe de taller
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                Dashboard
              </div>
            </button>

            <button
              type="button"
              onClick={() => accesoRapidoDemo(USUARIOS_DEMO.RECEPCIONISTA)}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                Recepción
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                Inicio
              </div>
            </button>

            <button
              type="button"
              onClick={() => accesoRapidoDemo(USUARIOS_DEMO.MECANICO)}
              style={{
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '10px 8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 700, color: '#C2410C', textTransform: 'uppercase' }}>
                Mecánico
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                Mis órdenes
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Enlace inferior hacia Consulta de Clientes */}
      <div style={{ textAlign: 'center', paddingBottom: '12px' }}>
        <button
          onClick={onVolverACliente}
          style={{
            background: 'none',
            border: 'none',
            color: '#CBD5E1',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>Consulta de clientes sin cuenta</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

