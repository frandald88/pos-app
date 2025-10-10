import { useEffect } from "react";
import { useDevolucionesData } from '../hooks/useDevolucionesData';
import { useDevolucionesUtils } from '../hooks/useDevolucionesUtils';
import { useDevolucionesForm } from '../hooks/useDevolucionesForm';

export default function ReturnsPage() {
  // Hooks para manejo de datos
  const {
    loading,
    buscando,
    msg,
    processingMsg,
    sale,
    existingReturns,
    returnedItems,
    availableStores,
    currentUser,
    fetchSale,
    submitReturn,
    updateItemQuantity,
    clearData,
    setMsg,
    setProcessingMsg,
    setExistingReturns
  } = useDevolucionesData();

  // Hooks para utilidades
  const {
    formatCurrency,
    formatDate,
    cleanLeadingZeros,
    handleNumberInput,
    calcularTotalDevolucion,
    getPaymentMethodIcon,
    validateReturnData
  } = useDevolucionesUtils();

  // Hooks para manejo de formularios
  const {
    saleId,
    refundAmount,
    refundMethod,
    mixedRefunds,
    setSaleId,
    setRefundAmount,
    setRefundMethod,
    setMixedRefunds,
    clearForm,
    setupRefundMethod,
    handleMixedPaymentChange,
    getFormData,
    validateForm
  } = useDevolucionesForm();

  // Configurar método de reembolso cuando se carga una venta
  useEffect(() => {
    if (sale) {
      setupRefundMethod(sale);
      // Calcular automáticamente el monto total de la venta como sugerencia
      setRefundAmount(sale.total);
    }
  }, [sale]);

  // Manejar búsqueda de venta
  const handleFetchSale = () => {
    fetchSale(saleId);
  };

  // Manejar envío de devolución
  const handleSubmit = async () => {
    // Limpiar mensajes previos
    setProcessingMsg("");
    
    // Validar formulario
    const validation = validateForm(returnedItems, sale);
    if (!validation.isValid) {
      setProcessingMsg(validation.errors[0] + " ❌");
      return;
    }

    try {
      const returnData = getFormData(returnedItems, sale);
      await submitReturn(returnData);
      
      // Limpiar formulario después del éxito
      clearForm();
      clearData();
    } catch (error) {
      // Error manejado en el hook
    }
  };

  // Calcular totales automáticamente
  const totalSugerido = calcularTotalDevolucion(returnedItems);

  // Si existen devoluciones, mostrar el reporte
  if (existingReturns) {
    return (
      <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: '#23334e' }}
            >
              Reporte de Devolución
            </h1>
            <p style={{ color: '#697487' }} className="text-lg">
              Esta venta ya tiene devoluciones registradas
            </p>
          </div>

          {/* Información de la venta original */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4" style={{ color: '#23334e' }}>
              Información de la Venta Original
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                  ID de Venta
                </div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {existingReturns.sale._id}
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                  Total Original
                </div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(existingReturns.sale?.total || 0)}
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                  Total Devuelto
                </div>
                <div className="text-lg font-bold text-red-600">
                  {formatCurrency(existingReturns.totalReturned || 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Devoluciones registradas */}
          <div className="space-y-6">
            {existingReturns.returns.map((returnRecord, index) => (
              <div key={returnRecord._id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                      Devolución #{index + 1}
                    </h3>
                    <p className="text-sm" style={{ color: '#697487' }}>
                      {formatDate(returnRecord.date)}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(returnRecord.refundAmount || 0)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      Método: {getPaymentMethodIcon(returnRecord.refundMethod)} {returnRecord.refundMethod}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Procesado por: <span className="font-medium">{returnRecord.processedBy?.username || 'Usuario desconocido'}</span>
                  </div>
                </div>

                {/* Productos devueltos */}
                <div>
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                    Productos Devueltos
                  </h4>
                  <div className="space-y-3">
                    {returnRecord.returnedItems.map((item, idx) => (
                      <div 
                        key={idx} 
                        className="flex justify-between items-start p-4 rounded-lg border"
                        style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              {item.name}
                            </span>
                            <span 
                              className="px-2 py-1 text-xs rounded-full"
                              style={{ backgroundColor: '#e5e7eb', color: '#46546b' }}
                            >
                              x{item.quantity}
                            </span>
                          </div>
                          {item.reason && (
                            <div className="text-sm italic p-2 rounded mt-2" style={{ color: '#697487', backgroundColor: '#f4f6fa' }}>
                              💬 {item.reason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-bold" style={{ color: '#23334e' }}>
                            {formatCurrency((item.refundPrice || 0) * (item.quantity || 0))}
                          </div>
                          <div className="text-sm" style={{ color: '#697487' }}>
                            {formatCurrency(item.refundPrice || 0)} c/u
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón para nueva búsqueda */}
          <div className="mt-8 text-center">
            <button
              onClick={() => {
                setSaleId("");
                setExistingReturns(null);
                setMsg("");
              }}
              className="px-8 py-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
            >
              🔍 Buscar Otra Venta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-3xl font-bold mb-2"
            style={{ color: '#23334e' }}
          >
            Gestión de Devoluciones
          </h1>
          <p style={{ color: '#697487' }} className="text-lg">
            Procesa devoluciones y reembolsos de manera eficiente
          </p>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Buscar venta */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
            Buscar Venta
          </h2>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                ID de la Venta
              </label>
              <input
                type="text"
                value={saleId}
                onChange={(e) => setSaleId(e.target.value)}
                placeholder="Ej: 507f1f77bcf86cd799439011"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  borderColor: '#e5e7eb',
                  focusRingColor: '#23334e'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleFetchSale()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleFetchSale}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={buscando}
              >
                {buscando ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Buscando...
                  </div>
                ) : (
                  "Buscar Venta"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Detalles de la venta encontrada */}
        {sale && (
          <div className="space-y-8">
            {/* Información de la venta */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-4" style={{ color: '#23334e' }}>
                Información de la Venta
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    ID de Venta
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                    {sale._id}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Total Original
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                    {formatCurrency(sale?.total || 0)}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Fecha de Venta
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                    {new Date(sale.createdAt || sale.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Información de pago original */}
              <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#46546b', backgroundColor: '#f9fafb' }}>
                <h4 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                  💳 Método de Pago Original
                </h4>
                {sale.paymentType === 'mixed' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: '#697487' }}>Pago Mixto:</p>
                    {sale.mixedPayments.map((payment, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{getPaymentMethodIcon(payment.method)} {payment.method}:</span>
                        <span className="font-medium">{formatCurrency(payment.amount || 0)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">
                    <span style={{ color: '#697487' }}>Método: </span>
                    <span className="font-medium" style={{ color: '#23334e' }}>
                      {getPaymentMethodIcon(sale.method)} {sale.method} - {formatCurrency(sale?.total || 0)}
                    </span>
                  </p>
                )}
              </div>
            </div>

            {/* Productos de la venta */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
                Seleccionar Productos a Devolver
              </h3>
              
              <div className="space-y-6">
                {returnedItems.map((item, index) => (
                  <div 
                    key={index} 
                    className="border rounded-lg p-6 transition-all duration-200 hover:shadow-md"
                    style={{ borderColor: '#e5e7eb' }}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      {/* Información del producto */}
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold mb-2" style={{ color: '#23334e' }}>
                          {item.name}
                        </h4>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span style={{ color: '#697487' }}>Vendidos: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              {item.maxQuantity}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#697487' }}>Precio pagado: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              {formatCurrency(item.discountedPrice || item.unitPrice)}
                              {item.discountedPrice && (
                                <span className="text-xs ml-1" style={{ color: '#ef4444' }}>
                                  (con descuento)
                                </span>
                              )}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#697487' }}>Total pagado: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              {formatCurrency(item.maxQuantity * (item.discountedPrice || item.unitPrice))}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Controles de devolución */}
                      <div className="lg:w-80 space-y-4">
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                            Cantidad a devolver
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.maxQuantity}
                            value={item.quantity}
                            onChange={(e) => handleNumberInput(e, (value) => 
                              updateItemQuantity(index, "quantity", value)
                            )}
                            onInput={(e) => handleNumberInput(e, (value) => 
                              updateItemQuantity(index, "quantity", value)
                            )}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                            Motivo de devolución
                          </label>
                          <input
                            type="text"
                            value={item.reason}
                            onChange={(e) =>
                              updateItemQuantity(index, "reason", e.target.value)
                            }
                            placeholder="Ej: Producto defectuoso, cliente insatisfecho..."
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                            style={{ 
                              borderColor: '#e5e7eb',
                              focusRingColor: '#23334e'
                            }}
                          />
                        </div>

                        {item.quantity > 0 && (
                          <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                            <div className="text-sm" style={{ color: '#697487' }}>
                              Subtotal a reembolsar:
                            </div>
                            <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                              {formatCurrency(item.quantity * (item.discountedPrice || item.unitPrice))}
                            </div>
                            <div className="text-xs" style={{ color: '#697487' }}>
                              {item.discountedPrice ? (
                                <span>
                                  {formatCurrency(item.discountedPrice)} c/u 
                                  <span style={{ color: '#ef4444' }}> (precio con descuento aplicado)</span>
                                </span>
                              ) : (
                                <span>{formatCurrency(item.unitPrice)} c/u</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configuración del reembolso */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
                Configuración del Reembolso
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Monto a reembolsar ($)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={refundAmount}
                      onChange={(e) => handleNumberInput(e, (value) => 
                        setRefundAmount(value === '' ? 0 : Number(value))
                      )}
                      onInput={(e) => handleNumberInput(e, (value) => 
                        setRefundAmount(value === '' ? 0 : Number(value))
                      )}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{ 
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      placeholder="0.00"
                    />
                    {totalSugerido > 0 && (
                      <button
                        onClick={() => setRefundAmount(totalSugerido)}
                        className="absolute right-2 top-2 px-3 py-1 text-xs font-medium text-white rounded transition-colors"
                        style={{ backgroundColor: '#46546b' }}
                      >
                        Usar calculado: {formatCurrency(totalSugerido)}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Método de reembolso
                  </label>
                  {/* Selector inteligente de método de devolución */}
                  {sale.paymentType === 'mixed' ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium" style={{ color: '#46546b' }}>
                        Selecciona método(s) para devolución:
                      </p>
                      <div className="text-xs p-2 rounded" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                        ⚠️ El total de los métodos seleccionados debe coincidir exactamente con el monto a reembolsar
                      </div>
                      {mixedRefunds.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`payment-${index}`}
                              className="h-4 w-4"
                              style={{ accentColor: '#23334e' }}
                              checked={payment.selected}
                              onChange={(e) => handleMixedPaymentChange(index, 'selected', e.target.checked)}
                            />
                            <label htmlFor={`payment-${index}`} className="text-sm">
                              {getPaymentMethodIcon(payment.method)} {payment.method}
                            </label>
                          </div>
                          <div className="flex items-center space-x-2">
                            {payment.selected && (
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={payment.maxAmount}
                                value={payment.selectedAmount}
                                onChange={(e) => handleNumberInput(e, (value) => 
                                  handleMixedPaymentChange(index, 'selectedAmount', value)
                                )}
                                onInput={(e) => handleNumberInput(e, (value) => 
                                  handleMixedPaymentChange(index, 'selectedAmount', value)
                                )}
                                className="w-20 p-1 text-sm border rounded"
                                placeholder="0.00"
                              />
                            )}
                            <div className="text-sm font-medium">
                              Máximo: {formatCurrency(payment.maxAmount || 0)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#f4f6fa' }}>
                        <p className="text-sm" style={{ color: '#697487' }}>
                          Método original de pago:
                        </p>
                        <p className="font-medium" style={{ color: '#23334e' }}>
                          {getPaymentMethodIcon(sale.method)} {sale.method}
                        </p>
                      </div>

                      {/* Opciones de devolución según método original */}
                      <div className="space-y-3">
                        <p className="text-sm font-medium" style={{ color: '#46546b' }}>
                          Selecciona método de devolución:
                        </p>
                        
                        {sale.method === 'efectivo' ? (
                          // Solo efectivo para ventas en efectivo
                          <div className="p-3 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                            <div className="flex items-center space-x-3">
                              <input
                                type="radio"
                                id="refund-efectivo"
                                name="refundMethod"
                                value="efectivo"
                                checked={refundMethod === 'efectivo'}
                                onChange={(e) => setRefundMethod(e.target.value)}
                                className="h-4 w-4"
                                style={{ accentColor: '#23334e' }}
                              />
                              <label htmlFor="refund-efectivo" className="text-sm font-medium">
                                💵 Efectivo
                              </label>
                            </div>
                          </div>
                        ) : (
                          // Opción original + efectivo para tarjeta/transferencia
                          <div className="space-y-2">
                            <div className="p-3 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  id={`refund-${sale.method}`}
                                  name="refundMethod"
                                  value={sale.method}
                                  checked={refundMethod === sale.method}
                                  onChange={(e) => setRefundMethod(e.target.value)}
                                  className="h-4 w-4"
                                  style={{ accentColor: '#23334e' }}
                                />
                                <label htmlFor={`refund-${sale.method}`} className="text-sm font-medium">
                                  {getPaymentMethodIcon(sale.method)} {sale.method} (método original)
                                </label>
                              </div>
                            </div>
                            <div className="p-3 border rounded-lg" style={{ borderColor: '#e5e7eb' }}>
                              <div className="flex items-center space-x-3">
                                <input
                                  type="radio"
                                  id="refund-efectivo-alt"
                                  name="refundMethod"
                                  value="efectivo"
                                  checked={refundMethod === 'efectivo'}
                                  onChange={(e) => setRefundMethod(e.target.value)}
                                  className="h-4 w-4"
                                  style={{ accentColor: '#23334e' }}
                                />
                                <label htmlFor="refund-efectivo-alt" className="text-sm font-medium">
                                  💵 Efectivo
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Resumen del reembolso */}
              {totalSugerido > 0 && (
                <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#23334e', backgroundColor: '#f4f6fa' }}>
                  <h4 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                    Resumen de la Devolución
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span style={{ color: '#697487' }}>Total calculado automáticamente: </span>
                      <span className="font-bold" style={{ color: '#23334e' }}>
                        {formatCurrency(totalSugerido)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#697487' }}>Monto manual: </span>
                      <span className="font-bold" style={{ color: '#23334e' }}>
                        {formatCurrency(refundAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Mensaje de error del procesamiento */}
              {processingMsg && (
                <div className="mt-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400">
                  <p className="text-red-800 font-medium">{processingMsg}</p>
                </div>
              )}

              {/* Botón de procesar devolución */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={loading || returnedItems.filter(item => item.quantity > 0).length === 0}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando Devolución...
                    </div>
                  ) : (
                    "Procesar Devolución"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Estado cuando no hay venta cargada */}
        {!sale && !buscando && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              Busca una venta para comenzar
            </h3>
            <p style={{ color: '#697487' }}>
              Ingresa el ID de la venta que deseas procesar para devolución
            </p>
          </div>
        )}
      </div>
    </div>
  );
}