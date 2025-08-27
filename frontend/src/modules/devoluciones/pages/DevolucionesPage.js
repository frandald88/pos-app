import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function ReturnsPage() {
  const [saleId, setSaleId] = useState("");
  const [sale, setSale] = useState(null);
  const [returnedItems, setReturnedItems] = useState([]);
  const [refundAmount, setRefundAmount] = useState(0);
  const [msg, setMsg] = useState("");
  const [processingMsg, setProcessingMsg] = useState(""); // Mensaje local del procesamiento
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [existingReturns, setExistingReturns] = useState(null); // Para devoluciones existentes
  const token = localStorage.getItem("token");
  const [refundMethod, setRefundMethod] = useState("efectivo");
  const [mixedRefunds, setMixedRefunds] = useState([]); // Para pagos mixtos
  const [refundBreakdown, setRefundBreakdown] = useState({}); // Desglose de devolución

  // Función para limpiar ceros a la izquierda (excepto decimales válidos)
  const cleanLeadingZeros = (value) => {
    // Si está vacío o es solo un punto, devolver como está
    if (!value || value === '.' || value === '0.') return value;
    
    // Convertir a string y eliminar espacios
    const str = value.toString().trim();
    
    // Si es solo "0", mantenerlo
    if (str === '0') return '0';
    
    // Si empieza con "0." (decimal válido), mantenerlo
    if (str.startsWith('0.')) return str;
    
    // Eliminar ceros a la izquierda de números enteros
    const cleaned = str.replace(/^0+/, '');
    
    // Si queda vacío después de eliminar ceros, devolver "0"
    return cleaned === '' ? '0' : cleaned;
  };

  // Función para manejar input en tiempo real y prevenir ceros a la izquierda
  const handleNumberInput = (e, callback) => {
    const value = e.target.value;
    const cleaned = cleanLeadingZeros(value);
    
    // Si el valor cambió, actualizar el input inmediatamente
    if (cleaned !== value) {
      e.target.value = cleaned;
    }
    
    // Ejecutar el callback con el valor limpio
    callback(cleaned);
  };

  const calculateDiscountedPrice = (item, originalTotal, originalDiscount) => {
    const itemSubtotal = item.price * item.quantity;
    const discountPercentage = originalDiscount / originalTotal;
    const itemDiscount = itemSubtotal * discountPercentage;
    return (item.price - (itemDiscount / item.quantity));
  };

  const fetchSale = () => {
    if (!saleId.trim()) {
      setMsg("Se requiere ingresar el ID de la venta para procesar la devolución ❌");
      return;
    }

    setBuscando(true);
    setExistingReturns(null);
    setSale(null);
    setReturnedItems([]);
    setMsg("");
    
    // Primero verificar si ya existen devoluciones para esta venta
    axios
      .get(`${apiBaseUrl}/api/returns/by-sale/${saleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        // Si existen devoluciones, mostrar el reporte
        setExistingReturns(res.data);
        setBuscando(false);
      })
      .catch(() => {
        // Si no existen devoluciones, continuar con el flujo normal
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
      });
  };

  const handleSubmit = () => {
    // Limpiar mensajes previos
    setProcessingMsg("");
    
    const itemsToReturn = returnedItems
      .filter((item) => item.quantity > 0)
      .map(({ productId, name, quantity, unitPrice, discountedPrice, reason }) => ({
        productId,
        name,
        quantity,
        originalPrice: unitPrice, // Precio original sin descuento
        refundPrice: discountedPrice || unitPrice, // ✅ USAR: Precio con descuento aplicado
        reason: reason?.trim() || "No especificado",
        condition: "Nuevo"
      }));

    if (itemsToReturn.length === 0) {
      setProcessingMsg("Debes seleccionar al menos un producto y cantidad a devolver ❌");
      return;
    }

    if (refundAmount <= 0) {
      setProcessingMsg("El monto debe ser mayor a 0 ❌");
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
        setProcessingMsg("Debes seleccionar al menos un método de pago para la devolución ❌");
        return;
      }
      
      const totalSelectedAmount = selectedRefunds.reduce((sum, r) => sum + r.selectedAmount, 0);
      console.log('Total amount seleccionado:', totalSelectedAmount);
      console.log('Refund amount del input:', refundAmount);

      const difference = Math.abs(totalSelectedAmount - refundAmount);
      if (difference > 0.01) {
        setProcessingMsg(`❌ Error: Los métodos seleccionados suman $${totalSelectedAmount.toFixed(2)} pero el monto a reembolsar es $${refundAmount.toFixed(2)}. Deben coincidir exactamente.`);
        return;
      }

      for (const refund of selectedRefunds) {
        const maxForMethod = mixedRefunds.find(m => m.method === refund.method)?.maxAmount || 0;
        if (refund.selectedAmount > maxForMethod) {
          setProcessingMsg(`❌ Error: Para ${refund.method} seleccionaste $${refund.selectedAmount} pero el máximo disponible es $${maxForMethod.toFixed(2)}`);
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
      .then((res) => {
        // ✅ NUEVO: Determinar tipo de devolución y mostrar mensaje específico
        const saleUpdated = res.data.saleUpdated;
        const isPartialReturn = saleUpdated && saleUpdated.remaining > 0;
        
        const message = isPartialReturn 
          ? `✅ Devolución parcial registrada exitosamente. Restante: $${saleUpdated.remaining.toFixed(2)}`
          : "✅ Devolución total registrada exitosamente";
        
        setMsg(message);
        setProcessingMsg(""); // Limpiar mensaje de procesamiento
        setSale(null);
        setSaleId("");
        setRefundAmount(0);
        setReturnedItems([]);
        setMixedRefunds([]); // ✅ Limpiar también mixedRefunds
        setCargando(false);
        setTimeout(() => setMsg(""), 5000); // Mostrar por más tiempo
      })
      .catch((error) => {
        setCargando(false);
        console.log('❌ Error completo:', error.response?.data);
        if (error.response && error.response.data.message) {
          setProcessingMsg(error.response.data.message + " ❌");
        } else {
          setProcessingMsg("Error inesperado al crear devolución ❌");
        }
      });
  };

  const updateItemQuantity = (index, field, value) => {
    setReturnedItems((prev) => {
      const updated = [...prev];
      if (field === "quantity") {
        updated[index][field] = value === '' ? 0 : Number(value);
      } else {
        updated[index][field] = value;
      }
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
      
      if (field === 'selectedAmount') {
        updated[index] = { ...updated[index], [field]: value === '' ? 0 : Number(value) };
      } else {
        updated[index] = { ...updated[index], [field]: value };
      }
      
      if (field === 'selected' && !value) {
        updated[index].selectedAmount = 0;
      }
      
      console.log('🔍 mixedRefunds actualizado:', updated);
      return updated;
    });
  };

  // Función para formatear fechas
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
                  ${existingReturns.sale.total.toFixed(2)}
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                  Total Devuelto
                </div>
                <div className="text-lg font-bold text-red-600">
                  ${existingReturns.totalReturned.toFixed(2)}
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
                      ${returnRecord.refundAmount.toFixed(2)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      Método: {returnRecord.refundMethod === 'efectivo' ? '💵 Efectivo' : 
                               returnRecord.refundMethod === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Procesado por: <span className="font-medium">{returnRecord.processedBy.username}</span>
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
                          {(() => {
                            // ✅ CORRECCIÓN: Para transacciones existentes, calcular precio con descuento
                            const venta = existingReturns.sale;
                            let precioConDescuento = item.refundPrice;
                            
                            if (venta && venta.discount > 0) {
                              // Buscar el item original en la venta
                              const itemOriginal = venta.items?.find(saleItem => 
                                saleItem.name === item.name || 
                                (item.productId && saleItem.productId && saleItem.productId.toString() === item.productId.toString())
                              );
                              
                              if (itemOriginal) {
                                // Calcular precio con descuento usando la misma lógica
                                const totalSinDescuento = venta.items.reduce((sum, saleItem) => sum + (saleItem.price * saleItem.quantity), 0);
                                const itemSubtotal = itemOriginal.price * itemOriginal.quantity;
                                const discountPercentage = venta.discount / totalSinDescuento;
                                const itemDiscount = itemSubtotal * discountPercentage;
                                precioConDescuento = itemOriginal.price - (itemDiscount / itemOriginal.quantity);
                              }
                            }
                            
                            return (
                              <>
                                <div className="font-bold" style={{ color: '#23334e' }}>
                                  ${(precioConDescuento * item.quantity).toFixed(2)}
                                </div>
                                <div className="text-sm" style={{ color: '#697487' }}>
                                  ${precioConDescuento.toFixed(2)} c/u
                                </div>
                              </>
                            );
                          })()}
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
                onKeyPress={(e) => e.key === 'Enter' && fetchSale()}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchSale}
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
                            <span style={{ color: '#697487' }}>Precio pagado: </span>
                            <span className="font-medium" style={{ color: '#23334e' }}>
                              ${(item.discountedPrice || item.unitPrice).toFixed(2)}
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
                              ${(item.maxQuantity * (item.discountedPrice || item.unitPrice)).toFixed(2)}
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
                              ${(item.quantity * (item.discountedPrice || item.unitPrice)).toFixed(2)}
                            </div>
                            <div className="text-xs" style={{ color: '#697487' }}>
                              {item.discountedPrice ? (
                                <span>
                                  ${(item.discountedPrice).toFixed(2)} c/u 
                                  <span style={{ color: '#ef4444' }}> (precio con descuento aplicado)</span>
                                </span>
                              ) : (
                                <span>${item.unitPrice.toFixed(2)} c/u</span>
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
                              Máximo: ${payment.maxAmount.toFixed(2)}
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
                          {sale.method === 'efectivo' ? '💵 Efectivo' : 
                          sale.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'}
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
                                  {sale.method === 'transferencia' ? '🏦 Transferencia' : '💳 Tarjeta'} (método original)
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
                  disabled={cargando || returnedItems.filter(item => item.quantity > 0).length === 0}
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