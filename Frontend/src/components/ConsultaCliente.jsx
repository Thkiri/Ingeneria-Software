import React, { useState } from 'react';
import { Check, User, Wrench, ShieldCheck, ArrowRight } from 'lucide-react';
import { consultarOrdenPublica } from '../services/api';

const PASOS_SEGUIMIENTO = [
  { code: 'ING', label: 'Ingresada' },
  { code: 'DIA', label: 'En Diagnóstico' },
  { code: 'ESP', label: 'Espera de Repuestos' },
  { code: 'REP', label: 'En Reparación' },
  { code: 'CAL', label: 'Control de Calidad' },
  { code: 'LST', label: 'Lista para Entrega' },
  { code: 'ENT', label: 'Entregada' },
];

const BADGE_MAP = {
  ING: 'badge-ing',
  DIA: 'badge-dia',
  ESP: 'badge-esp',
  REP: 'badge-rep',
  CAL: 'badge-cal',
  LST: 'badge-lst',
  ENT: 'badge-ent',
  CAN: 'badge-ing',
};

export default function ConsultaCliente({ onIrATaller }) {
  const [rut, setRut] = useState('');
  const [patente, setPatente] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultado, setResultado] = useState(null);

  const handleConsultar = async (e) => {
    e.preventDefault();
    if (!rut.trim() || !patente.trim()) {
      setError(true);
      setErrorMsg('Ingresa tanto tu RUT como la patente del vehículo.');
      return;
    }

    setLoading(true);
    setError(false);
    setErrorMsg('');

    try {
      const data = await consultarOrdenPublica(rut, patente);
      setResultado(data);
    } catch (err) {
      setError(true);
      setErrorMsg(err.message || 'Revisa el RUT y la patente e inténtalo otra vez.');
      setResultado(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNuevaConsulta = () => {
    setResultado(null);
    setError(false);
    setErrorMsg('');
  };

  const cargarEjemploDemo = (ejRut, ejPatente) => {
    setRut(ejRut);
    setPatente(ejPatente);
    setError(false);
  };

  // Obtener fecha formateada de un estado en el historial
  const obtenerFechaEstado = (code) => {
    if (!resultado?.historial_estados) return null;
    const item = resultado.historial_estados.find((h) => h.estado_nuevo === code);
    if (!item || !item.fecha) return null;
    try {
      const d = new Date(item.fecha);
      return d.toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
      }) + ' · ' + d.toLocaleTimeString('es-CL', {
        hour: '2-digit',
        minute: '2-digit',
      }) + ' h';
    } catch {
      return null;
    }
  };

  const currentIdx = resultado
    ? PASOS_SEGUIMIENTO.findIndex((p) => p.code === resultado.estado)
    : -1;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F4F6F9' }}>
      {/* Barra Superior Pública (#0B192C) */}
      <header style={{
        background: '#0B192C',
        color: '#FFFFFF',
        padding: '18px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Wrench size={20} color="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px' }}>TecniMotor</div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>Taller · Osorno, Chile</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span style={{ fontSize: '13px', color: '#CBD5E1' }}>
            Seguimiento de tu vehículo · Sin cuenta
          </span>
          {onIrATaller && (
            <button
              onClick={onIrATaller}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Acceso Personal</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Contenido Principal */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px' }}>
        {!resultado ? (
          /* VISTA 1: FORMULARIO DE CONSULTA (ClienteConsultra.png / ClienteError.png) */
          <div style={{
            maxWidth: '480px',
            width: '100%',
            margin: '0 auto',
            background: '#FFFFFF',
            borderRadius: '14px',
            padding: '40px 36px',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.05)',
            border: '1px solid var(--border-color)'
          }}>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginBottom: '10px' }}>
              Consulta el estado de tu vehículo
            </h1>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '28px' }}>
              Ingresa tus datos para revisar el avance de tu atención.
            </p>

            <form onSubmit={handleConsultar} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  RUT
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ej.: 12.155.555-9"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                  Patente
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="Ej.: SDSD32"
                  value={patente}
                  onChange={(e) => setPatente(e.target.value.toUpperCase())}
                />
              </div>

              {/* Banner de Error (ClienteError.png) */}
              {error && (
                <div style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: '8px',
                  padding: '14px 16px',
                  color: '#991B1B'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                    No encontramos una orden con esos datos
                  </div>
                  <div style={{ fontSize: '12px', color: '#B91C1C' }}>
                    {errorMsg || 'Revisa el RUT y la patente e inténtalo otra vez.'}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              >
                {loading ? 'Consultando...' : 'Consultar'}
              </button>
            </form>

            <div style={{
              marginTop: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: '#64748B'
            }}>
              <ShieldCheck size={15} color="#64748B" />
              <span>se consulta solo con tu RUT y la patente</span>
            </div>

            {/* Acceso rápido de prueba para demostración académica */}
            <div style={{
              marginTop: '24px',
              paddingTop: '16px',
              borderTop: '1px dashed var(--border-color)',
              fontSize: '12px',
              color: '#64748B'
            }}>
              <span style={{ fontWeight: 600 }}>Datos de prueba rápida (Demo): </span>
              <button
                type="button"
                onClick={() => cargarEjemploDemo('12.155.555-9', 'SDSD32')}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginLeft: '6px',
                  color: '#0F172A',
                  fontWeight: 500
                }}
              >
                12.155.555-9 / SDSD32
              </button>
              <button
                type="button"
                onClick={() => cargarEjemploDemo('18.305.890-K', 'PJTG12')}
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  marginLeft: '6px',
                  color: '#0F172A',
                  fontWeight: 500
                }}
              >
                18.305.890-K / PJTG12
              </button>
            </div>
          </div>
        ) : (
          /* VISTA 2: RESULTADO DEL SEGUIMIENTO (ClienteResultado.png) */
          <div style={{ maxWidth: '980px', width: '100%', margin: '0 auto' }}>
            {/* Encabezado Resultado */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#0F172A' }}>
                  Así va tu vehículo
                </h1>
                <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                  {resultado.codigo_ot} · Información actualizada en tiempo real
                </p>
              </div>

              <button
                className="btn-secondary"
                onClick={handleNuevaConsulta}
                style={{ height: '42px', padding: '0 18px', fontSize: '13px', fontWeight: 600 }}
              >
                Nueva consulta
              </button>
            </div>

            {/* Grilla 2 Columnas */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '24px',
              alignItems: 'start'
            }}>
              {/* Columna Izquierda: Seguimiento de la orden */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px',
                border: '1px solid var(--border-color)'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px', color: '#0F172A' }}>
                  Seguimiento de la orden
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {PASOS_SEGUIMIENTO.map((paso, index) => {
                    const isPassed = currentIdx > index;
                    const isCurrent = currentIdx === index;
                    const fechaPaso = obtenerFechaEstado(paso.code);

                    return (
                      <div
                        key={paso.code}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: '8px',
                          background: isCurrent ? '#FFF7ED' : '#F8FAFC',
                          border: isCurrent ? '1px solid #FDBA74' : '1px solid #F1F5F9',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 700,
                            color: isCurrent ? '#C2410C' : isPassed ? '#0F172A' : '#64748B'
                          }}>
                            {isPassed ? <Check size={16} strokeWidth={2.5} /> : index + 1}
                          </div>

                          <div>
                            <div style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: isCurrent ? '#C2410C' : '#0F172A'
                            }}>
                              {paso.label}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                              {fechaPaso || (isPassed ? 'Completado' : isCurrent ? 'En curso' : 'Pendiente')}
                            </div>
                          </div>
                        </div>

                        {isCurrent && (
                          <span style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: '#C2410C'
                          }}>
                            Estado actual
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Columna Derecha: Tu orden de trabajo */}
              <div style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                padding: '28px',
                border: '1px solid var(--border-color)',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0F172A' }}>
                  Tu orden de trabajo
                </h3>

                {/* Ficha del Vehículo */}
                <div style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '10px',
                  padding: '20px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                    {resultado.codigo_ot}
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                    {resultado.patente}
                  </div>
                  <div style={{ fontSize: '14px', color: '#334155', marginTop: '2px' }}>
                    {resultado.marca} {resultado.modelo} ({resultado.anio})
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px',
                    color: '#64748B',
                    marginTop: '14px',
                    marginBottom: '14px'
                  }}>
                    <User size={15} />
                    <span>{resultado.mecanico_nombre}</span>
                  </div>

                  <span
                    className={`badge ${BADGE_MAP[resultado.estado] || 'badge-ing'}`}
                    style={{ width: 'auto', display: 'inline-block', padding: '6px 14px' }}
                  >
                    {resultado.estado_display}
                  </span>
                </div>

                {/* Caja de Fecha Estimada */}
                <div style={{
                  background: '#F1F5F9',
                  borderRadius: '10px',
                  padding: '18px 20px'
                }}>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 500 }}>
                    Fecha estimada de entrega
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A', marginTop: '6px' }}>
                    {resultado.fecha_estimada_entrega || 'En evaluación técnica'}
                  </div>
                </div>

                <div style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                  <p>Te avisaremos cuando tu vehículo esté listo para retiro.</p>
                  <p style={{ marginTop: '8px' }}>La fecha estimada puede variar según la reparación.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Pie de Página */}
      <footer style={{
        padding: '20px 40px',
        fontSize: '12px',
        color: '#64748B',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <span>¿Necesitas ayuda? Comunícate directamente con el taller.</span>
        {onIrATaller && (
          <button
            onClick={onIrATaller}
            style={{
              background: 'none',
              border: 'none',
              color: '#475569',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Ingreso personal del taller →
          </button>
        )}
      </footer>
    </div>
  );
}

