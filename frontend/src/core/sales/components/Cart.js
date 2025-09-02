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
    <div className="p-4 space-y-3">
      {cartItems.map((item) => (
        <div key={item._id} className="rounded-lg p-3 border border-gray-200" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm flex-1 mr-2" style={{ color: '#23334e' }}>{item.name}</h4>
            <button
              onClick={() => onRemoveFromCart(item._id)}
              className="transition-colors duration-200"
              style={{ color: '#697487' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item._id, item.qty - 1)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-200"
                style={{ 
                  backgroundColor: '#8c95a4',
                  color: 'white'
                }}
              >
                -
              </button>
              <span className="w-8 text-center font-medium" style={{ color: '#23334e' }}>{item.qty}</span>
              <button
                onClick={() => onUpdateQuantity(item._id, item.qty + 1)}
                className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-colors duration-200"
                style={{ 
                  background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)'
                }}
              >
                +
              </button>
            </div>
            <div className="text-right">
              <p className="text-sm" style={{ color: '#697487' }}>${item.price} c/u</p>
              <p className="font-bold" style={{ color: '#46546b' }}>${(item.qty * item.price).toFixed(2)}</p>
            </div>
          </div>

          <textarea
            placeholder="Nota opcional (ej: sin cebolla, extra queso...)"
            value={item.note || ''}
            onChange={(e) => onUpdateNote(item._id, e.target.value)}
            className="w-full p-2 text-xs border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ 
              '--tw-ring-color': '#46546b',
              color: '#23334e'
            }}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
};

export default Cart;