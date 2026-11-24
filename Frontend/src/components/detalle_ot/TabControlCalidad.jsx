import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TabControlCalidad({
  orden,
  obsCalidad,
  setObsCalidad,
  cobroBloqueado,
  loading,
  onDictamen,
}) {
  const tieneHoras = (orden.registro_horas || []).length > 0;
  const estaCerrada = cobroBloqueado ?? ['LST', 'ENT', 'CAN'].includes(orden.estado);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Certificación de Control de Calidad
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            Requisito obligatorio para habilitar el paso a "Lista para Entrega".
          </p>
        </div>

        {orden.control_calidad && (
          <span style={{
            padding: '6px 12px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            background: orden.control_calidad.aprobado ? '#DCFCE7' : '#FEF2F2',
            color: orden.control_calidad.aprobado ? '#15803D' : '#991B1B'
          }}>
            {orden.control_calidad.aprobado ? '✓ CALIDAD APROBADA' : '✕ CALIDAD RECHAZADA'}
          </span>
        )}
      </div>

      {!tieneHoras && (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          padding: '12px 16px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
        }}>
          ⚠️ Debes registrar al menos una entrada en la pestaña "Horas hombre" antes de aprobar el Control de Calidad.
        </div>
      )}

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
          Observaciones de la inspección final
        </label>
        <textarea
          rows={3}
          disabled={estaCerrada}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontFamily: 'inherit',
            fontSize: '14px',
            background: estaCerrada ? '#F8FAFC' : '#FFFFFF',
          }}
          placeholder="Ej.: Prueba de ruta realizada, frenos responden correctamente, niveles verificados."
          value={obsCalidad}
          onChange={(e) => setObsCalidad(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn-primary"
          disabled={loading || !tieneHoras || estaCerrada}
          onClick={() => onDictamen(true)}
          style={{
            background: '#15803D',
            opacity: tieneHoras && !estaCerrada ? 1 : 0.5,
            cursor: tieneHoras && !estaCerrada ? 'pointer' : 'not-allowed',
          }}
        >
          <CheckCircle2 size={18} />
          <span>Aprobar Control de Calidad</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={loading || estaCerrada}
          onClick={() => onDictamen(false)}
          style={{
            color: '#991B1B',
            borderColor: '#FECACA',
            background: '#FEF2F2',
            opacity: estaCerrada ? 0.5 : 1,
            cursor: estaCerrada ? 'not-allowed' : 'pointer',
          }}
        >
          <XCircle size={18} />
          <span>Rechazar (Devolver a En Reparación)</span>
        </button>
      </div>
    </div>
  );
}

