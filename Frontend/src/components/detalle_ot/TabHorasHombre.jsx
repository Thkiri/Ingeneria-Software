import React from 'react';
import { Trash2 } from 'lucide-react';

export default function TabHorasHombre({
  orden,
  horasList,
  mecanicos,
  nuevaHora,
  setNuevaHora,
  loading,
  formatCLP,
  onAgregarHora,
  onEliminarHora,
}) {
  const bloqueadoPorEstado = ['ING', 'DIA'].includes(orden.estado);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
          Registro de Horas Hombre
        </h3>
        <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
          Imputación de tiempo técnico trabajado en la orden.
        </p>
      </div>

      {bloqueadoPorEstado ? (
        <div style={{
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          color: '#92400E',
          padding: '14px 16px',
          borderRadius: '8px',
          fontSize: '13px'
        }}>
          No se pueden registrar las horas en diagnóstico. Avanza la orden a <strong>En Reparación</strong> para imputar horas.
        </div>
      ) : (
        <form
          onSubmit={onAgregarHora}
          style={{
            background: '#F8FAFC',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            display: 'grid',
            gridTemplateColumns: '1.2fr 0.7fr 1fr auto',
            gap: '10px',
            alignItems: 'end'
          }}
        >
          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Mecánico
            </label>
            <select
              className="input-control"
              style={{ height: '40px', fontSize: '13px' }}
              value={nuevaHora.mecanico}
              onChange={(e) => {
                const selectedId = e.target.value;
                const mecObj = mecanicos.find((m) => String(m.id) === String(selectedId));
                setNuevaHora({
                  ...nuevaHora,
                  mecanico: selectedId,
                  tarifa: mecObj?.tarifa_hora || 15000,
                });
              }}
            >
              {mecanicos.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre_completo || m.username} ({formatCLP(m.tarifa_hora || 15000)}/h)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Horas
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              className="input-control"
              style={{ height: '40px', fontSize: '13px' }}
              value={nuevaHora.horas}
              onChange={(e) => setNuevaHora({ ...nuevaHora, horas: e.target.value })}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
              Trabajo realizado
            </label>
            <input
              type="text"
              className="input-control"
              style={{ height: '40px', fontSize: '13px' }}
              placeholder="Ej.: Cambio de pastillas"
              value={nuevaHora.descripcion}
              onChange={(e) => setNuevaHora({ ...nuevaHora, descripcion: e.target.value })}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ height: '40px', padding: '0 14px', fontSize: '13px' }}
          >
            Registrar
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#F1F5F9', color: '#475569' }}>
            <th style={{ padding: '10px 12px' }}>Técnico</th>
            <th style={{ padding: '10px 12px' }}>Detalle</th>
            <th style={{ padding: '10px 12px' }}>Horas</th>
            <th style={{ padding: '10px 12px' }}>Tarifa/h</th>
            <th style={{ padding: '10px 12px' }}>Costo neto</th>
            <th style={{ padding: '10px 12px', textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {horasList.map((h) => (
            <tr key={h.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '12px', fontWeight: 600 }}>{h.mecanico_detalle?.nombre_completo}</td>
              <td style={{ padding: '12px', color: '#475569' }}>{h.descripcion || 'Mano de obra'}</td>
              <td style={{ padding: '12px' }}>{h.horas} h</td>
              <td style={{ padding: '12px' }}>{formatCLP(h.tarifa)}</td>
              <td style={{ padding: '12px', fontWeight: 600 }}>{formatCLP(h.costo)}</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => onEliminarHora(h.id)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          {horasList.length === 0 && (
            <tr>
              <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
                Sin horas hombre registradas en esta orden.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-color)'
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#334155' }}>
          Subtotal mano de obra (neto)
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
          {formatCLP(orden.total_mano_obra_neto)}
        </span>
      </div>
    </div>
  );
}

