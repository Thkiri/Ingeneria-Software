import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function TabControlCalidad({
  orden,
  obsCalidad,
  setObsCalidad,
  loading,
  onDictamen,
}) {
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

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
          Observaciones de la inspección final
        </label>
        <textarea
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            fontFamily: 'inherit',
            fontSize: '14px'
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
          disabled={loading}
          onClick={() => onDictamen(true)}
          style={{ background: '#15803D' }}
        >
          <CheckCircle2 size={18} />
          <span>Aprobar Control de Calidad</span>
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={loading}
          onClick={() => onDictamen(false)}
          style={{ color: '#991B1B', borderColor: '#FECACA', background: '#FEF2F2' }}
        >
          <XCircle size={18} />
          <span>Rechazar (Devolver a En Reparación)</span>
        </button>
      </div>
    </div>
  );
}

