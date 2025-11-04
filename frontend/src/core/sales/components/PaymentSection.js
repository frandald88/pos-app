import React from 'react';

const PaymentSection = ({
  paymentType,
  setPaymentType,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  totalWithTax,
  mixedPayments,
  onAddMixedPayment,
  onUpdateMixedPayment,
  onRemoveMixedPayment,
  getRemainingAmount,
  getTotalChange
}) => {
  return (
    <div className="space-y-4">
      {/* Selector de tipo de pago */}
      <div>
        <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Tipo de pago
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentType('single')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
              paymentType === 'single' 
                ? 'text-white shadow-md' 
                : 'border-gray-300'
            }`}
            style={paymentType === 'single'
              ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
              : { color: '#697487', backgroundColor: 'white' }
            }
          >
            💳 Un solo método
          </button>
          <button
            onClick={() => setPaymentType('mixed')}
            className={`p-3 rounded-lg border text-sm font-medium transition-all duration-200 ${
              paymentType === 'mixed' 
                ? 'text-white shadow-md' 
                : 'border-gray-300'
            }`}
            style={paymentType === 'mixed'
              ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }
              : { color: '#697487', backgroundColor: 'white' }
            }
          >
            🔀 Pago mixto
          </button>
        </div>
      </div>

      {/* Configuración de pago según el tipo */}
      {paymentType === 'single' ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Método de pago</label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setPaymentMethod('efectivo')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                  paymentMethod === 'efectivo' ? 'text-white' : ''
                }`}
                style={
                  paymentMethod === 'efectivo'
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                    : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                }
              >
                💵 Efectivo
              </button>
              <button
                onClick={() => setPaymentMethod('transferencia')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                  paymentMethod === 'transferencia' ? 'text-white' : ''
                }`}
                style={
                  paymentMethod === 'transferencia'
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                    : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                }
              >
                🏦 Transferencia
              </button>
              <button
                onClick={() => setPaymentMethod('tarjeta')}
                className={`px-4 py-3 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 ${
                  paymentMethod === 'tarjeta' ? 'text-white' : ''
                }`}
                style={
                  paymentMethod === 'tarjeta'
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                    : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                }
              >
                💳 Tarjeta
              </button>
            </div>
          </div>

          {paymentMethod === 'efectivo' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>Monto recibido</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ 
                  '--tw-ring-color': '#46546b',
                  color: '#23334e'
                }}
              />
              {amountPaid && (
                <div className="mt-2 p-2 rounded border" style={{ backgroundColor: 'white', borderColor: '#8c95a4' }}>
                  <div className="text-sm">
                    <span style={{ color: '#697487' }}>Cambio: </span>
                    <span className="font-bold" style={{ color: '#46546b' }}>
                      ${Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Panel de pagos mixtos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium" style={{ color: '#23334e' }}>
                Métodos de pago ({mixedPayments.length})
              </label>
              <button
                onClick={() => onAddMixedPayment(getRemainingAmount())}
                disabled={getRemainingAmount() <= 0}
                className="text-xs px-3 py-1 rounded-full text-white transition-all duration-200 disabled:opacity-50"
                style={{ 
                  background: getRemainingAmount() > 0 
                    ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                    : '#8c95a4'
                }}
              >
                + Agregar método
              </button>
            </div>

            {/* Mostrar restante por pagar */}
            {getRemainingAmount() > 0 && (
              <div className="mb-3 p-2 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
                <p className="text-sm font-medium" style={{ color: '#92400e' }}>
                  Restante por pagar: ${getRemainingAmount().toFixed(2)}
                </p>
              </div>
            )}

            {/* Lista de pagos mixtos */}
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {mixedPayments.map((payment, index) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-3" style={{ backgroundColor: 'white' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium" style={{ color: '#697487' }}>
                      Pago #{index + 1}
                    </span>
                    <button
                      onClick={() => onRemoveMixedPayment(payment.id)}
                      className="text-xs px-2 py-1 rounded transition-colors duration-200"
                      style={{ color: '#dc2626', backgroundColor: '#fef2f2' }}
                    >
                      Eliminar
                    </button>
                  </div>

                  <div className="space-y-2 mb-2">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Método</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onUpdateMixedPayment(payment.id, 'method', 'efectivo')}
                          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all active:scale-95 ${
                            payment.method === 'efectivo' ? 'text-white' : ''
                          }`}
                          style={
                            payment.method === 'efectivo'
                              ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                              : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                          }
                        >
                          💵
                        </button>
                        <button
                          onClick={() => onUpdateMixedPayment(payment.id, 'method', 'transferencia')}
                          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all active:scale-95 ${
                            payment.method === 'transferencia' ? 'text-white' : ''
                          }`}
                          style={
                            payment.method === 'transferencia'
                              ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                              : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                          }
                        >
                          🏦
                        </button>
                        <button
                          onClick={() => onUpdateMixedPayment(payment.id, 'method', 'tarjeta')}
                          className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded border transition-all active:scale-95 ${
                            payment.method === 'tarjeta' ? 'text-white' : ''
                          }`}
                          style={
                            payment.method === 'tarjeta'
                              ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                              : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                          }
                        >
                          💳
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>Monto</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={getRemainingAmount() + (payment.amount || 0)}
                        value={payment.amount || ''}
                        onChange={(e) => onUpdateMixedPayment(payment.id, 'amount', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                        style={{ 
                          '--tw-ring-color': '#46546b',
                          color: '#23334e'
                        }}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {payment.method === 'efectivo' && (
                    <div className="mb-2">
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                        Monto recibido (opcional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min={payment.amount || 0}
                        value={payment.receivedAmount || ''}
                        onChange={(e) => onUpdateMixedPayment(payment.id, 'receivedAmount', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                        style={{ 
                          '--tw-ring-color': '#46546b',
                          color: '#23334e'
                        }}
                        placeholder={payment.amount ? payment.amount.toString() : "0.00"}
                      />
                      {payment.receivedAmount && parseFloat(payment.receivedAmount) > (payment.amount || 0) && (
                        <p className="text-xs mt-1" style={{ color: '#10b981' }}>
                          Cambio: ${((parseFloat(payment.receivedAmount) || 0) - (payment.amount || 0)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  {(payment.method === 'transferencia' || payment.method === 'tarjeta') && (
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#374151' }}>
                        Referencia (opcional)
                      </label>
                      <input
                        type="text"
                        value={payment.reference || ''}
                        onChange={(e) => onUpdateMixedPayment(payment.id, 'reference', e.target.value)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1"
                        style={{ 
                          '--tw-ring-color': '#46546b',
                          color: '#23334e'
                        }}
                        placeholder="Número de referencia..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {mixedPayments.length === 0 && (
              <div className="text-center py-8" style={{ color: '#8c95a4' }}>
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm">No hay métodos de pago configurados</p>
                <p className="text-xs">Haz clic en "Agregar método" para comenzar</p>
              </div>
            )}

            {/* Resumen de cambio total */}
            {getTotalChange() > 0 && (
              <div className="mt-3 p-2 rounded border" style={{ backgroundColor: '#f0f9f4', borderColor: '#10b981' }}>
                <div className="text-sm">
                  <span style={{ color: '#047857' }}>Cambio total: </span>
                  <span className="font-bold" style={{ color: '#047857' }}>
                    ${getTotalChange().toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentSection;