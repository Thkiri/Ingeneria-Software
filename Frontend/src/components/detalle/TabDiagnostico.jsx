import React from 'react';

export default function TabDiagnostico({
  rol,
  mecanicos,
  diagnosticoText,
  setDiagnosticoText,
  observacionesText,
  setObservacionesText,
  mecanicoId,
  setMecanicoId,
  segundoMecanicoId,
  setSegundoMecanicoId,
  fechaEstimada,
  setFechaEstimada,
  esGarantia,
  setEsGarantia,
  loading,
  onSave,
}) {
  return (
    <form onSubmit={onSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
        Diagnóstico del vehículo
      </h3>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>
          Diagnóstico técnico del vehículo
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
          placeholder="Ej.: Desgaste severo en pastillas de freno delanteras, pérdida leve de líquido hidráulico..."
          value={diagnosticoText}
          onChange={(e) => setDiagnosticoText(e.target.value)}
        />
      </div>

      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748B', display: 'block', marginBottom: '6px' }}>
          Observaciones y trabajos realizados
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
          placeholder="Detalla las reparaciones y recomendaciones para el control de calidad..."
          value={observacionesText}
          onChange={(e) => setObservacionesText(e.target.value)}
        />
      </div>

      {rol === 'JEFE_TALLER' && (
        <div style={{
          background: '#F8FAFC',
          padding: '16px',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '14px'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Mecánico Principal
            </label>
            <select
              className="input-control"
              value={mecanicoId}
              onChange={(e) => setMecanicoId(e.target.value)}
            >
              <option value="">Sin asignar</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_completo || m.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Segundo Mecánico (Apoyo)
            </label>
            <select
              className="input-control"
              value={segundoMecanicoId}
              onChange={(e) => setSegundoMecanicoId(e.target.value)}
            >
              <option value="">Ninguno</option>
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_completo || m.username}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Fecha estimada de entrega
            </label>
            <input
              type="date"
              className="input-control"
              value={fechaEstimada}
              onChange={(e) => setFechaEstimada(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={esGarantia}
                onChange={(e) => setEsGarantia(e.target.checked)}
              />
              <span>Reingreso por Garantía (Diagnóstico $0)</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar diagnóstico'}
        </button>
      </div>
    </form>
  );
}

