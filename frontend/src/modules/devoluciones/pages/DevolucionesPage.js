import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function ReturnsPage() {
  const [saleId, setSaleId] = useState("");
  const [sale, setSale] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const token = localStorage.getItem("token");
  const [refundMethod, setRefundMethod] = useState("efectivo");
  const [mixedRefunds, setMixedRefunds] = useState([]); // Para pagos mixtos
  const [refundBreakdown, setRefundBreakdown] = useState({}); // Desglose de devolución

  const calculateDiscountedPrice = (item, originalTotal, originalDiscount) => {
    const itemSubtotal = item.price * item.quantity;
    const discountPercentage = originalDiscount / (originalTotal + originalDiscount);
    const itemDiscount = itemSubtotal * discountPercentage;
    return (item.price - (itemDiscount / item.quantity));
  };

  const fetchSale = () => {
    if (!saleId.trim()) {
      setMsg("Por favor ingresa un ID de venta válido ❌");
      return;
    }

    setBuscando(true);
    axios
      .get(`${apiBaseUrl}/api/sales/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setSale(res.data);

        // ✅ CALCULAR PRECIOS CON DESCUENTO
        const discountedItems = res.data.items.map((item) => {
          const discountedPrice = res.data.discount > 0 
            ? calculateDiscountedPrice(item, res.data.total + res.data.discount, res.data.discount)
            : item.price; 

          return {
            productId: item.productId,
            name: item.name,
            quantity: 0,
            maxQuantity: item.quantity,
            unitPrice: item.price, // Precio original
            discountedPrice: discountedPrice, // ✅ NUEVO: Precio con descuento
            reason: "",
          };
        }); 
        
        setReturnedItems(discountedItems);
        setMsg("");
        setBuscando(false);
        // Calcular automáticamente el monto total de la venta como sugerencia
        setRefundAmount(res.data.total);
      })
      .catch(() => {
        setMsg("Venta no encontrada. Verifica el ID ❌");
        setBuscando(false);
      });
  };

  const handleSubmit = () => {
    const itemsToReturn = returnedItems
      .filter((item) => item.quantity > 0)
      .map(({ productId, name, quantity, unitPrice, reason }) => ({
        productId,
        name,
        quantity,
        originalPrice: unitPrice,
        refundPrice: unitPrice,
        reason: reason?.trim() || "No especificado",
        condition: "Nuevo"
      }));

    if (itemsToReturn.length === 0) {
      setMsg("Debes seleccionar al menos un producto y cantidad a devolver ❌");
      return;
    }

    if (refundAmount <= 0) {
      setMsg("El monto de reembolso debe ser mayor a 0 ❌");
      return;
    }

    // ✅ DEBUG ESPECÍFICO
    console.log('🔍 DEBUGGING VENTA MIXTA:');
    console.log('Sale paymentType:', sale.paymentType);
    console.log('Sale mixedPayments:', sale.mixedPayments);
    console.log('Estado mixedRefunds:', mixedRefunds);

    const submitData = {
      saleId,
      returnedItems: itemsToReturn,
      refundAmount,
      refundMethod: sale.paymentType === 'mixed' ? 'mixto' : refundMethod,
    };

    // ✅ NUEVO: Agregar datos de pagos mixtos si aplica
    if (sale.paymentType === 'mixed') {
      const selectedRefunds = mixedRefunds.filter(r => r.selected && r.selectedAmount > 0);
      console.log('Selected refunds filtrados:', selectedRefunds);
      
      if (selectedRefunds.length === 0) {
        console.log('❌ ERROR: No hay refunds seleccionados');
        setMsg("Debes seleccionar al menos un método de pago para la devolución ❌");
        return;
      }
      
      const totalSelectedAmount = selectedRefunds.reduce((sum, r) => sum + r.selectedAmount, 0);
      console.log('Total amount seleccionado:', totalSelectedAmount);
      console.log('Refund amount del input:', refundAmount);

      const difference = Math.abs(totalSelectedAmount - refundAmount);
      if (difference > 0.01) {
        setMsg(`❌ Error: Los métodos seleccionados suman $${totalSelectedAmount.toFixed(2)} pero el monto a reembolsar es $${refundAmount.toFixed(2)}. Deben coincidir exactamente.`);
        return;
      }

      for (const refund of selectedRefunds) {
        const maxForMethod = mixedRefunds.find(m => m.method === refund.method)?.maxAmount || 0;
        if (refund.selectedAmount > maxForMethod) {
          setMsg(`❌ Error: Para ${refund.method} seleccionaste $${refund.selectedAmount} pero el máximo disponible es $${maxForMethod.toFixed(2)}`);
          return;
        }
      }
      
      submitData.mixedRefunds = selectedRefunds.map(r => ({
        method: r.method,
        amount: r.selectedAmount
      }));
    }

    console.log('🔍 submitData que se enviará:', submitData);

    setCargando(true);
    axios
      .post(`${apiBaseUrl}/api/returns`, submitData, { 
        headers: { Authorization: `Bearer ${token}` } 
      })
      .then(() => {
        setMsg("Devolución registrada exitosamente ✅");
        setSale(null);
        setSaleId("");
        setRefundAmount(0);
        setReturnedItems([]);
        setMixedRefunds([]); // ✅ Limpiar también mixedRefunds
        setCargando(false);
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        setCargando(false);
        console.log('❌ Error completo:', error.response?.data);
        if (error.response && error.response.data.message) {
          setMsg(error.response.data.message + " ❌");
        } else {
          setMsg("Error inesperado al crear devolución ❌");
        }
      });
  };

  const updateItemQuantity = (index, field, value) => {
    setReturnedItems((prev) => {
      const updated = [...prev];
      updated[index][field] = field === "quantity" ? Number(value) : value;
      return updated;
    });
  };

  // Calcular totales automáticamente
  const calcularTotalDevolucion = () => {
    return returnedItems.reduce((total, item) => {
      const priceToUse = item.discountedPrice || item.unitPrice;
      return total + (item.quantity * priceToUse);
    }, 0);
  };

  const totalSugerido = calcularTotalDevolucion();

  useEffect(() => {
    if (sale && sale.paymentType === 'mixed') {
      console.log('🔍 VENTA MIXTA DETECTADA:', sale.mixedPayments);
      const initialMixedRefunds = sale.mixedPayments.map(payment => ({
        method: payment.method,
        maxAmount: payment.amount,
        selectedAmount: 0,
        selected: false
      }));
      console.log('🔍 mixedRefunds inicializado:', initialMixedRefunds);
      setMixedRefunds(initialMixedRefunds);
    } else if (sale && sale.method) {
      setRefundMethod(sale.method);
    }
  }, [sale]);

  // ✅ AGREGAR: Función para manejar checkboxes de pagos mixtos
  const handleMixedPaymentChange = (index, field, value) => {
    console.log(`🔍 Cambiando ${field} del índice ${index} a:`, value);
    setMixedRefunds(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      if (field === 'selected' && !value) {
        updated[index].selectedAmount = 0;
      }
      
      console.log('🔍 mixedRefunds actualizado:', updated);
      return updated;
    });
  };

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
                onKeyPress={(e) => e.key === 'Enter' && fetchSale()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchSale}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={buscando || !saleId.trim()}
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
                    ${sale.total.toFixed(2)}
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

              {/* NUEVO: Información de pago original */}
              <div className="mt-6 p-4 rounded-lg border-2 border-dashed" style={{ borderColor: '#46546b', backgroundColor: '#f9fafb' }}>
                <h4 className="font-semibold mb-3" style={{ color: '#23334e' }}>
                  💳 Método de Pago Original
                </h4>
                {sale.paymentType === 'mixed' ? (
                  <div className="space-y-2">
                    <p className="text-sm font-medium" style={{ color: '#697487' }}>Pago Mixto:</p>
                    {sale.mixedPayments.map((payment, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{payment.method === 'efectivo' ? '💵 Efectivo' : 
                              payment.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'}:</span>
                        <span className="font-medium">${payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm">
                    <span style={{ color: '#697487' }}>Método: </span>
                    <span className="font-medium" style={{ color: '#23334e' }}>
                      {sale.method === 'efectivo' ? '💵 Efectivo' : 
                      sale.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'} 
                      - ${sale.total.toFixed(2)}
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
                            <span style={{ color: '#697487' }}>Precio unitario: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              ${item.unitPrice.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span style={{ color: '#697487' }}>Total vendido: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              ${(item.maxQuantity * item.unitPrice).toFixed(2)}
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
                            onChange={(e) =>
                              updateItemQuantity(index, "quantity", e.target.value)
                            }
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
                              ${(item.quantity * (item.discountedPrice || item.unitPrice)).toFixed(2)}
                            </div>
                            <div className="text-xs" style={{ color: '#697487' }}>
                              Precio original: ${item.unitPrice.toFixed(2)} c/u
                              {item.discountedPrice && (
                                <span> | Con descuento: ${item.discountedPrice.toFixed(2)} c/u</span>
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
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
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
                        Usar calculado: ${totalSugerido.toFixed(2)}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Método de reembolso
                  </label>
                  {/* NUEVO: Selector inteligente de método de devolución */}
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
                              {payment.method === 'efectivo' ? '💵 Efectivo' : 
                              payment.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'}
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
                                onChange={(e) => handleMixedPaymentChange(index, 'selectedAmount', Number(e.target.value))}
                                className="w-20 p-1 text-sm border rounded"
                                placeholder="0.00"
                              />
                            )}
                            <div className="text-sm font-medium">
                              Máximo: ${payment.maxAmount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <p className="text-sm" style={{ color: '#697487' }}>
                          Método original de pago:
                        </p>
                        <p className="font-medium" style={{ color: '#23334e' }}>
                          {sale.method === 'efectivo' ? '💵 Efectivo' : 
                          sale.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'}
                        </p>
                      </div>
                      <input type="hidden" value={sale.method} />
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
                        ${totalSugerido.toFixed(2)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#697487' }}>Monto manual: </span>
                      <span className="font-bold" style={{ color: '#23334e' }}>
                        ${refundAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botón de procesar devolución */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="px-8 py-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={cargando || refundAmount <= 0 || returnedItems.filter(item => item.quantity > 0).length === 0}
                >
                  {cargando ? (
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