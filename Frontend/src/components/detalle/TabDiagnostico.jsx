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
  presupuestoAprobado,
  onRegistrarPresupuesto,
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

          <div style={{ gridColumn: '1 / -1', paddingTop: '8px', borderTop: '1px solid #E2E8F0' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
              Estado del Presupuesto con el Cliente:{" "}
              <span style={{ color: presupuestoAprobado === true ? '#15803D' : presupuestoAprobado === false ? '#991B1B' : '#B45309' }}>
                {presupuestoAprobado === true ? 'Aprobado' : presupuestoAprobado === false ? 'Rechazado (No pasa a reparación)' : 'Pendiente de confirmación'}
              </span>
            </label>
            {onRegistrarPresupuesto && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onRegistrarPresupuesto(true)}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    fontSize: '12px',
                    borderColor: presupuestoAprobado === true ? '#16A34A' : undefined,
                    background: presupuestoAprobado === true ? '#DCFCE7' : undefined,
                    color: presupuestoAprobado === true ? '#15803D' : undefined,
                    fontWeight: 600
                  }}
                >
                  ✓ Cliente Aprobó
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => onRegistrarPresupuesto(false)}
                  style={{
                    height: '34px',
                    padding: '0 12px',
                    fontSize: '12px',
                    borderColor: presupuestoAprobado === false ? '#DC2626' : undefined,
                    background: presupuestoAprobado === false ? '#FEF2F2' : undefined,
                    color: presupuestoAprobado === false ? '#991B1B' : undefined,
                    fontWeight: 600
                  }}
                >
                  ✕ Cliente Rechazó
                </button>
              </div>
            )}
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

