import React from 'react';

export default function ModalAgregarRepuesto({
  orden,
  nuevoRepuesto,
  setNuevoRepuesto,
  repuestoConfirmado,
  loading,
  formatCLP,
  onSubmit,
  onClose,
}) {
  const subtotal =
    (Number(nuevoRepuesto.cantidad) || 0) * (Number(nuevoRepuesto.precio_unitario) || 0);

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 1100, background: 'rgba(15, 23, 42, 0.55)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '14px',
          maxWidth: '480px',
          width: '100%',
          padding: '32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {!repuestoConfirmado ? (
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
                Agregar repuesto
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                OT {String(orden.numero).padStart(4, '0')} · {orden.vehiculo_detalle?.patente} · {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Nombre
              </label>
              <input
                type="text"
                className="input-control"
                placeholder="Ej.: Aceite sintético 5W-30 (1 L)"
                value={nuevoRepuesto.nombre_pieza}
                onChange={(e) => setNuevoRepuesto({ ...nuevoRepuesto, nombre_pieza: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Cantidad
                </label>
                <input
                  type="number"
                  min="1"
                  className="input-control"
                  value={nuevoRepuesto.cantidad}
                  onChange={(e) => setNuevoRepuesto({ ...nuevoRepuesto, cantidad: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Precio unitario neto
                </label>
                <input
                  type="number"
                  min="0"
                  className="input-control"
                  placeholder="Ej.: 8500"
                  value={nuevoRepuesto.precio_unitario}
                  onChange={(e) => setNuevoRepuesto({ ...nuevoRepuesto, precio_unitario: e.target.value })}
                  required
                />
              </div>
            </div>

            <div style={{
              background: '#F1F5F9',
              borderRadius: '10px',
              padding: '18px 20px'
            }}>
              <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                Subtotal neto
              </div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {formatCLP(subtotal)} CLP
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px' }}>
                {nuevoRepuesto.cantidad || 0} × {formatCLP(nuevoRepuesto.precio_unitario || 0)} · Se recalcula al cambiar cantidad o precio.
              </div>
            </div>

            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Valores netos en CLP. El IVA se aplica en el cobro final.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={onClose}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Agregar repuesto'}
              </button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <h3 style={{ fontSize: '22px', fontWeight: 700, color: '#0F172A' }}>
                Repuesto agregado a la OT {String(orden.numero).padStart(4, '0')}
              </h3>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                OT {String(orden.numero).padStart(4, '0')} · {orden.vehiculo_detalle?.patente} · {orden.vehiculo_detalle?.marca} {orden.vehiculo_detalle?.modelo}
              </p>
            </div>

            <div style={{
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              borderRadius: '10px',
              padding: '16px 18px',
              color: '#065F46'
            }}>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>
                {repuestoConfirmado.nombre_pieza}
              </div>
              <div style={{ fontSize: '13px', marginTop: '4px' }}>
                {repuestoConfirmado.cantidad} unidades × {formatCLP(repuestoConfirmado.precio_unitario)} netos = {formatCLP(repuestoConfirmado.subtotal)}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>
                El repuesto quedó registrado en esta orden.
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
                Sin cambios en el estado de la OT: {orden.estado_display}.
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Subtotal neto del repuesto</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#0F172A', marginTop: '4px' }}>
                {formatCLP(repuestoConfirmado.subtotal)} CLP
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
              <button
                type="button"
                className="btn-primary"
                onClick={onClose}
              >
                Volver a la OT
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

