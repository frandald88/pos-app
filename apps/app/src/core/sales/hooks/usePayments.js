import { useState, useMemo } from 'react';

export const usePayments = () => {
  // Estados para pagos únicos
  const [paymentType, setPaymentType] = useState('single');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [amountPaid, setAmountPaid] = useState('');

  // Estados para pagos mixtos
  const [mixedPayments, setMixedPayments] = useState([]);

  // Agregar método de pago mixto
  const addMixedPayment = (remaining) => {
    if (remaining <= 0) return;

    setMixedPayments([...mixedPayments, {
      id: Date.now(),
      method: 'efectivo',
      amount: Math.min(remaining, 100),
      receivedAmount: '',
      reference: ''
    }]);
  };

  // Actualizar pago mixto
  const updateMixedPayment = (id, field, value) => {
    setMixedPayments(mixedPayments.map(payment => 
      payment.id === id ? { ...payment, [field]: value } : payment
    ));
  };

  // Remover pago mixto
  const removeMixedPayment = (id) => {
    setMixedPayments(mixedPayments.filter(payment => payment.id !== id));
  };

  // Calcular monto restante por pagar
  const getRemainingAmount = (totalWithTax) => {
    const totalPaid = mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    return Math.max(0, totalWithTax - totalPaid);
  };

  // Calcular cambio total
  const getTotalChange = () => {
    return mixedPayments
      .filter(p => p.method === 'efectivo')
      .reduce((sum, payment) => {
        const received = parseFloat(payment.receivedAmount) || payment.amount || 0;
        const change = Math.max(0, received - (payment.amount || 0));
        return sum + change;
      }, 0);
  };

  // Validar pagos mixtos
  const validateMixedPayments = (totalWithTax) => {
    if (mixedPayments.length === 0) {
      return { valid: false, message: 'Debe agregar al menos un método de pago' };
    }
    
    const totalPaid = mixedPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const difference = Math.abs(totalPaid - totalWithTax);
    
    if (difference > 0.01) {
      return { 
        valid: false, 
        message: `Los pagos no coinciden con el total. Diferencia: $${difference.toFixed(2)}`
      };
    }

    // Validar efectivo
    for (const payment of mixedPayments) {
      if (payment.method === 'efectivo' && payment.receivedAmount) {
        const received = parseFloat(payment.receivedAmount);
        if (received < payment.amount) {
          return {
            valid: false,
            message: `El monto recibido en efectivo ($${received}) no puede ser menor al monto a pagar ($${payment.amount})`
          };
        }
      }
    }

    return { valid: true, message: 'Pagos válidos' };
  };

  // Limpiar datos de pago
  const clearPayments = () => {
    setPaymentType('single');
    setPaymentMethod('efectivo');
    setAmountPaid('');
    setMixedPayments([]);
  };

  // Calcular cambio para pago único en efectivo
  const singlePaymentChange = useMemo(() => {
    if (paymentMethod === 'efectivo' && amountPaid) {
      return Math.max(0, parseFloat(amountPaid) - 0); // Necesita el total desde el componente padre
    }
    return 0;
  }, [paymentMethod, amountPaid]);

  return {
    // Payment state
    paymentType,
    paymentMethod,
    amountPaid,
    mixedPayments,
    
    // Payment actions
    setPaymentType,
    setPaymentMethod,
    setAmountPaid,
    addMixedPayment,
    updateMixedPayment,
    removeMixedPayment,
    clearPayments,
    
    // Payment calculations
    getRemainingAmount,
    getTotalChange,
    validateMixedPayments,
    singlePaymentChange
  };
};