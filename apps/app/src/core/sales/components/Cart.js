import React from 'react';

const Cart = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemoveFromCart, 
  onUpdateNote 
}) => {
  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-6" style={{ color: '#8c95a4' }}>
        <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 8M7 13l2.5 8m0 0L17 17M9.5 21h8" />
        </svg>
        <p className="text-lg font-medium mb-2">Carrito vacío</p>
        <p className="text-sm text-center">Selecciona productos del catálogo para comenzar una venta</p>
      </div>
    );
  }

  return (
    <div className="p-2">
      {/* Estilo ticket/recibo */}
      {cartItems.map((item, index) => (
        <div key={item._id} className="border-b border-gray-200 pb-2 mb-2">
          {/* Línea 1: Nombre y botón eliminar */}
          <div className="flex justify-between items-start mb-1">
            <h4 className="font-semibold text-sm flex-1" style={{ color: '#23334e' }}>{item.name}</h4>
            <button
              onClick={() => onRemoveFromCart(item._id)}
              className="ml-2 transition-colors duration-200"
              style={{ color: '#8c95a4' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Línea 2: Cantidad, precio unitario y total */}
          <div className="flex justify-between items-center text-sm mb-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item._id, item.qty - 1)}
                className="w-7 h-7 rounded flex items-center justify-center transition-all active:scale-95 font-bold text-base"
                style={{ backgroundColor: '#e5e7eb', color: '#374151' }}
              >
                −
              </button>
              <span className="font-mono font-bold w-8 text-center text-base" style={{ color: '#23334e' }}>{item.qty}</span>
              <button
                onClick={() => onUpdateQuantity(item._id, item.qty + 1)}
                className="w-7 h-7 rounded flex items-center justify-center transition-all active:scale-95 text-white font-bold text-base"
                style={{ background: 'linear-gradient(135deg, #697487 0%, #46546b 100%)' }}
              >
                +
              </button>
              <span className="font-medium" style={{ color: '#697487' }}>× ${item.price}</span>
            </div>
            <span className="font-bold text-base" style={{ color: '#10b981' }}>${(item.qty * item.price).toFixed(2)}</span>
          </div>

          {/* Línea 3: Nota (si existe o en hover) */}
          {item.note ? (
            <div className="text-sm italic px-2 py-1.5 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
              📝 {item.note}
            </div>
          ) : (
            <button
              onClick={(e) => {
                const textarea = e.currentTarget.nextSibling;
                e.currentTarget.style.display = 'none';
                textarea.style.display = 'block';
                textarea.focus();
              }}
              className="text-sm w-full px-2 py-2 border-0 focus:outline-none cursor-pointer text-left rounded transition-colors hover:bg-gray-50"
              style={{ color: '#9ca3af', backgroundColor: 'transparent' }}
            >
              + nota...
            </button>
          )}
          <textarea
            placeholder="Nota (ej: sin cebolla)..."
            value={item.note || ''}
            onChange={(e) => onUpdateNote(item._id, e.target.value)}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.style.display = 'none';
                e.target.previousSibling.style.display = 'block';
              }
            }}
            className="text-sm w-full px-2 py-2 border border-gray-300 rounded resize-none focus:outline-none focus:ring-1"
            style={{
              '--tw-ring-color': '#46546b',
              color: '#23334e',
              display: item.note ? 'block' : 'none'
            }}
            rows={1}
          />
        </div>
      ))}
    </div>
  );
};

export default Cart;