// SVG Icons
const Icons = {
  cash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bank: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  creditCard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  shuffle: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
  ),
  currencyDollar: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  xmark: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  search: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  clipboard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
};

export const useDevolucionesUtils = () => {

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Formatear fecha simple
  const formatSimpleDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-MX');
  };

  // Limpiar ceros a la izquierda (excepto decimales válidos)
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

  // Manejar input numérico en tiempo real
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

  // Calcular precio con descuento
  const calculateDiscountedPrice = (item, originalTotal, originalDiscount) => {
    const itemSubtotal = item.price * item.quantity;
    const discountPercentage = originalDiscount / originalTotal;
    const itemDiscount = itemSubtotal * discountPercentage;
    return (item.price - (itemDiscount / item.quantity));
  };

  // Calcular total de devolución automáticamente
  const calcularTotalDevolucion = (returnedItems) => {
    return returnedItems.reduce((total, item) => {
      const priceToUse = item.discountedPrice || item.unitPrice;
      return total + (item.quantity * priceToUse);
    }, 0);
  };

  // Obtener icono de método de pago
  const getPaymentMethodIcon = (method) => {
    const icons = {
      'efectivo': <Icons.cash />,
      'transferencia': <Icons.bank />,
      'tarjeta': <Icons.creditCard />,
      'mixto': <Icons.shuffle />
    };
    return icons[method] || <Icons.currencyDollar />;
  };

  // Obtener nombre del método de pago
  const getPaymentMethodName = (method) => {
    const names = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'tarjeta': 'Tarjeta',
      'mixto': 'Pago Mixto'
    };
    return names[method] || method;
  };

  // Obtener configuración de estado
  const getStatusConfig = (status) => {
    const configs = {
      'procesada': {
        color: '#f59e0b',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: <Icons.clock />
      },
      'aprobada': {
        color: '#10b981',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: <Icons.check />
      },
      'rechazada': {
        color: '#ef4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: <Icons.xmark />
      },
      'pendiente': {
        color: '#8b5cf6',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        icon: <Icons.search />
      }
    };
    return configs[status] || {
      color: '#6b7280',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: <Icons.clipboard />
    };
  };

  // Validar datos de devolución
  const validateReturnData = (returnedItems, refundAmount, sale, mixedRefunds = []) => {
    const errors = [];

    // Validar items
    const itemsToReturn = returnedItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      errors.push("Debes seleccionar al menos un producto y cantidad a devolver");
    }

    // Validar monto
    if (refundAmount <= 0) {
      errors.push("El monto debe ser mayor a 0");
    }

    // Validaciones específicas para pagos mixtos
    if (sale && sale.paymentType === 'mixed') {
      const selectedRefunds = mixedRefunds.filter(r => r.selected && r.selectedAmount > 0);
      
      if (selectedRefunds.length === 0) {
        errors.push("Debes seleccionar al menos un método de pago para la devolución");
      }
      
      const totalSelectedAmount = selectedRefunds.reduce((sum, r) => sum + r.selectedAmount, 0);
      const difference = Math.abs(totalSelectedAmount - refundAmount);
      
      if (difference > 0.01) {
        errors.push(`Los métodos seleccionados suman $${totalSelectedAmount.toFixed(2)} pero el monto a reembolsar es $${refundAmount.toFixed(2)}. Deben coincidir exactamente.`);
      }

      for (const refund of selectedRefunds) {
        const maxForMethod = mixedRefunds.find(m => m.method === refund.method)?.maxAmount || 0;
        if (refund.selectedAmount > maxForMethod) {
          errors.push(`Para ${refund.method} seleccionaste $${refund.selectedAmount} pero el máximo disponible es $${maxForMethod.toFixed(2)}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Calcular estadísticas de devoluciones
  const getReturnStats = (returns = []) => {
    const safeReturns = Array.isArray(returns) ? returns : [];
    
    return {
      total: safeReturns.length,
      procesadas: safeReturns.filter(r => r.status === 'procesada').length,
      aprobadas: safeReturns.filter(r => r.status === 'aprobada').length,
      rechazadas: safeReturns.filter(r => r.status === 'rechazada').length,
      pendientes: safeReturns.filter(r => r.status === 'pendiente').length,
      montoTotal: safeReturns.reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0),
      montoAprobado: safeReturns
        .filter(r => r.status === 'aprobada')
        .reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0),
      montoProcesado: safeReturns
        .filter(r => r.status === 'procesada')
        .reduce((sum, r) => sum + parseFloat(r.refundAmount || 0), 0)
    };
  };

  // Calcular estadísticas por método de pago
  const getPaymentMethodStats = (returns = []) => {
    const safeReturns = Array.isArray(returns) ? returns : [];
    const stats = {
      efectivo: { total: 0, cantidad: 0 },
      transferencia: { total: 0, cantidad: 0 },
      tarjeta: { total: 0, cantidad: 0 },
      mixto: { total: 0, cantidad: 0 }
    };

    safeReturns.forEach(returnItem => {
      if (stats[returnItem.refundMethod]) {
        stats[returnItem.refundMethod].total += parseFloat(returnItem.refundAmount || 0);
        stats[returnItem.refundMethod].cantidad += 1;
      }
    });

    return stats;
  };

  // Obtener texto descriptivo del estado
  const getStatusDescription = (status) => {
    const descriptions = {
      'procesada': 'Devolución procesada, esperando aprobación final',
      'aprobada': 'Devolución aprobada y completada',
      'rechazada': 'Devolución rechazada por el administrador',
      'pendiente': 'Devolución en espera de procesamiento'
    };
    return descriptions[status] || 'Estado desconocido';
  };

  // Generar ID único temporal
  const generateTempId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  return {
    // Formateo
    formatCurrency,
    formatDate,
    formatSimpleDate,
    
    // Manejo de inputs
    cleanLeadingZeros,
    handleNumberInput,
    
    // Cálculos
    calculateDiscountedPrice,
    calcularTotalDevolucion,
    
    // Configuraciones
    getPaymentMethodIcon,
    getPaymentMethodName,
    getStatusConfig,
    getStatusDescription,
    
    // Validaciones
    validateReturnData,
    
    // Estadísticas
    getReturnStats,
    getPaymentMethodStats,
    
    // Utilidades
    generateTempId
  };
};