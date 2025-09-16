import { useState, useEffect } from 'react';

export const useDevolucionesForm = () => {
  const [saleId, setSaleId] = useState('');
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundMethod, setRefundMethod] = useState('efectivo');
  const [mixedRefunds, setMixedRefunds] = useState([]);
  const [refundBreakdown, setRefundBreakdown] = useState({});

  // Limpiar formulario
  const clearForm = () => {
    setSaleId('');
    setRefundAmount(0);
    setRefundMethod('efectivo');
    setMixedRefunds([]);
    setRefundBreakdown({});
  };

  // Configurar método de reembolso basado en la venta
  const setupRefundMethod = (sale) => {
    if (sale && sale.paymentType === 'mixed') {
      const initialMixedRefunds = sale.mixedPayments.map(payment => ({
        method: payment.method,
        maxAmount: payment.amount,
        selectedAmount: 0,
        selected: false
      }));
      setMixedRefunds(initialMixedRefunds);
    } else if (sale && sale.method) {
      setRefundMethod(sale.method);
    }
  };

  // Manejar cambios en pagos mixtos
  const handleMixedPaymentChange = (index, field, value) => {
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
      
      return updated;
    });
  };

  // Obtener datos del formulario para envío
  const getFormData = (returnedItems, sale) => {
    const itemsToReturn = returnedItems
      .filter((item) => item.quantity > 0)
      .map(({ productId, name, quantity, unitPrice, discountedPrice, reason }) => ({
        productId,
        name,
        quantity,
        originalPrice: unitPrice,
        refundPrice: discountedPrice || unitPrice,
        reason: reason?.trim() || "No especificado",
        condition: "Nuevo"
      }));

    const submitData = {
      saleId,
      returnedItems: itemsToReturn,
      refundAmount,
      refundMethod: sale && sale.paymentType === 'mixed' ? 'mixto' : refundMethod,
    };

    // Agregar datos de pagos mixtos si aplica
    if (sale && sale.paymentType === 'mixed') {
      const selectedRefunds = mixedRefunds.filter(r => r.selected && r.selectedAmount > 0);
      submitData.mixedRefunds = selectedRefunds.map(r => ({
        method: r.method,
        amount: r.selectedAmount
      }));
    }

    return submitData;
  };

  // Validar formulario
  const validateForm = (returnedItems, sale) => {
    const errors = [];
    
    const itemsToReturn = returnedItems.filter(item => item.quantity > 0);
    if (itemsToReturn.length === 0) {
      errors.push("Debes seleccionar al menos un producto y cantidad a devolver");
    }

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

  return {
    // Estados del formulario
    saleId,
    refundAmount,
    refundMethod,
    mixedRefunds,
    refundBreakdown,

    // Setters
    setSaleId,
    setRefundAmount,
    setRefundMethod,
    setMixedRefunds,
    setRefundBreakdown,

    // Acciones
    clearForm,
    setupRefundMethod,
    handleMixedPaymentChange,
    getFormData,
    validateForm
  };
};