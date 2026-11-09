import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function TabRepuestos({
  repuestosList,
  totalRepuestosNeto,
  formatCLP,
  onOpenAgregarModal,
  onEliminarRepuesto,
}) {
  const totalUnidades = repuestosList.reduce(
    (acc, r) => acc + (Number(r.cantidad) || 0),
    0
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
            Repuestos de la OT
          </h3>
          <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
            {repuestosList.length} repuestos · {totalUnidades} unidades
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={onOpenAgregarModal}
          style={{ height: '40px', padding: '0 16px', fontSize: '13px' }}
        >
          <Plus size={16} />
          <span>Agregar repuesto</span>
        </button>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#F1F5F9', color: '#475569' }}>
            <th style={{ padding: '10px 12px', borderRadius: '6px 0 0 6px' }}>Nombre</th>
            <th style={{ padding: '10px 12px' }}>Cantidad</th>
            <th style={{ padding: '10px 12px' }}>P. unit. neto</th>
            <th style={{ padding: '10px 12px' }}>Subtotal</th>
            <th style={{ padding: '10px 12px', borderRadius: '0 6px 6px 0', textAlign: 'right' }}></th>
          </tr>
        </thead>
        <tbody>
          {repuestosList.map((rep) => (
            <tr key={rep.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
              <td style={{ padding: '14px 12px', fontWeight: 500, color: '#0F172A' }}>
                {rep.nombre_pieza}
              </td>
              <td style={{ padding: '14px 12px' }}>{rep.cantidad}</td>
              <td style={{ padding: '14px 12px' }}>{formatCLP(rep.precio_unitario)}</td>
              <td style={{ padding: '14px 12px', fontWeight: 600 }}>{formatCLP(rep.subtotal)}</td>
              <td style={{ padding: '14px 12px', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => onEliminarRepuesto(rep.id)}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}
                  title="Eliminar repuesto"
                >
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
          {repuestosList.length === 0 && (
            <tr>
              <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
                No se han registrado repuestos en esta orden. Pulsa "+ Agregar repuesto".
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
          Subtotal repuestos (neto)
        </span>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#0F172A' }}>
          {formatCLP(totalRepuestosNeto)}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: '#64748B' }}>
        Valores netos en CLP. El IVA (19%) se agrega una sola vez en el cobro final.
      </div>
    </div>
  );
}

