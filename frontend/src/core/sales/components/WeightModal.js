import React, { useState, useEffect } from 'react';

/**
 * Modal para captura manual de peso
 * Se usa cuando el producto se vende por peso pero no tiene código de barras con peso integrado
 */
const WeightModal = ({ isOpen, product, onConfirm, onClose }) => {
  const [weight, setWeight] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setWeight('');
      setError('');
      // Auto-focus en el input cuando se abre el modal
      setTimeout(() => {
        document.getElementById('weight-input')?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const weightValue = parseFloat(weight);

    // Validaciones
    if (!weight || isNaN(weightValue)) {
      setError('Ingresa un peso válido');
      return;
    }

    if (weightValue <= 0) {
      setError('El peso debe ser mayor a 0');
      return;
    }

    if (weightValue > 9999) {
      setError('El peso es demasiado grande');
      return;
    }

    // Calcular precio total
    const totalPrice = weightValue * product.price;

    // Confirmar y agregar al carrito
    onConfirm({
      ...product,
      qty: weightValue,
      weightUnit: product.weightUnit || 'kg',
      total: totalPrice,
      originalPrice: product.price,
      isWeightProduct: true
    });

    // Cerrar modal
    onClose();
  };

  const handleQuickWeight = (value) => {
    setWeight(value.toString());
    setError('');
  };

  const unit = product.weightUnit || 'kg';
  const totalPrice = weight ? (parseFloat(weight) * product.price).toFixed(2) : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 m-4 max-w-md w-full transform transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
              ⚖️ Peso del Producto
            </h3>
            <p className="text-sm mt-1" style={{ color: '#697487' }}>
              {product.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-100"
            style={{ color: '#8c95a4' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Precio por unidad */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium" style={{ color: '#46546b' }}>
              Precio por {unit}:
            </span>
            <span className="text-lg font-bold" style={{ color: '#10b981' }}>
              ${product.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit}>
          {/* Input de peso */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
              Peso ({unit})
            </label>
            <input
              id="weight-input"
              type="number"
              step="0.001"
              value={weight}
              onChange={(e) => {
                setWeight(e.target.value);
                setError('');
              }}
              placeholder={`Ej: 1.5 ${unit}`}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
              style={{
                borderColor: error ? '#ef4444' : '#d1d5db',
                color: '#23334e'
              }}
              autoComplete="off"
            />
            {error && (
              <p className="text-sm text-red-500 mt-2">
                ⚠️ {error}
              </p>
            )}
          </div>

          {/* Botones de peso rápido */}
          <div className="mb-4">
            <p className="text-xs font-medium mb-2" style={{ color: '#697487' }}>
              Accesos rápidos:
            </p>
            <div className="grid grid-cols-4 gap-2">
              {[0.25, 0.5, 1, 2].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleQuickWeight(value)}
                  className="px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-md"
                  style={{
                    backgroundColor: '#f3f4f6',
                    color: '#46546b',
                  }}
                >
                  {value} {unit}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium" style={{ color: '#059669' }}>
                Total a pagar:
              </span>
              <span className="text-2xl font-bold" style={{ color: '#059669' }}>
                ${totalPrice}
              </span>
            </div>
            {weight && (
              <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                {weight} {unit} × ${product.price.toFixed(2)} = ${totalPrice}
              </p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-200 border-2"
              style={{
                borderColor: '#d1d5db',
                color: '#46546b',
                backgroundColor: 'white'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!weight || parseFloat(weight) <= 0}
              className="flex-1 py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg"
              style={{
                background: (!weight || parseFloat(weight) <= 0)
                  ? '#8c95a4'
                  : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
              }}
            >
              ✓ Agregar
            </button>
          </div>
        </form>

        {/* Tip */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: '#fef3c7' }}>
          <p className="text-xs" style={{ color: '#92400e' }}>
            💡 <strong>Tip:</strong> También puedes escanear un código de barras con peso integrado
            (formato EAN-13 que empieza con "2").
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeightModal;
