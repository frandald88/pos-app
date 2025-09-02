import { useState } from 'react';
import salesService from '../services/salesService';

export const useSaleActions = () => {
  const [msg, setMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saleDetails, setSaleDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  // Manejar venta
  const handleSale = async (saleData, callbacks = {}) => {
    if (loading) return;

    try {
      setLoading(true);
      setMsg('');

      // Validaciones pasadas desde el componente padre
      const { 
        tiendaSeleccionada, 
        saleType, 
        deliveryPerson, 
        paymentType, 
        paymentMethod, 
        amountPaid, 
        totalWithTax,
        mixedPayments,
        validateMixedPayments 
      } = saleData;

      if (!tiendaSeleccionada) {
        setMsg('Debes seleccionar una tienda antes de registrar la venta ❌');
        return;
      }

      if (saleType === 'domicilio' && !deliveryPerson) {
        setMsg('Debe asignar un repartidor para domicilio ❌');
        return;
      }

      // Validar pagos según el tipo
      if (paymentType === 'mixed') {
        const validation = validateMixedPayments(totalWithTax);
        if (!validation.valid) {
          setMsg(validation.message + ' ❌');
          return;
        }
      } else if (paymentType === 'single') {
        if (!paymentMethod) {
          setMsg('Debe seleccionar un método de pago ❌');
          return;
        }
        
        if (paymentMethod === 'efectivo' && (!amountPaid || parseFloat(amountPaid) < totalWithTax)) {
          setMsg('El monto recibido debe ser mayor o igual al total ❌');
          return;
        }
      }

      // Llamar al servicio
      const response = await salesService.createSale(saleData);

      // Preparar detalles para el modal
      const details = {
        id: response.sale.id || response.sale._id || Date.now(),
        total: totalWithTax,
        items: saleData.items.length,
        cliente: saleData.clienteNombre || 'Cliente general',
        paymentType,
        method: paymentType === 'single' ? paymentMethod : 'mixto',
        mixedPayments: paymentType === 'mixed' ? mixedPayments : [],
        type: saleType,
        change: paymentType === 'single' && paymentMethod === 'efectivo' 
          ? Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax)
          : (callbacks.getTotalChange ? callbacks.getTotalChange() : 0)
      };

      setSaleDetails(details);
      setShowSuccessModal(true);

      // Ejecutar callbacks de limpieza si se proporcionan
      if (callbacks.onSuccess) {
        callbacks.onSuccess();
      }

      setMsg('');

    } catch (error) {
      console.error('Error al registrar venta:', error);
      setMsg('Error al registrar venta ❌');
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cotización
  const handleQuote = async (quoteData) => {
    if (loading) return;

    try {
      setLoading(true);
      setMsg('');

      if (!quoteData.tiendaSeleccionada) {
        setMsg('Debes seleccionar una tienda antes de generar la cotización ❌');
        return;
      }

      const blob = await salesService.generateQuote(quoteData);
      
      // Descargar archivo
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'cotizacion.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setMsg('Cotización generada exitosamente ✅');
      setTimeout(() => setMsg(''), 3000);

    } catch (error) {
      console.error('Error al generar cotización:', error);
      setMsg('Error al generar cotización ❌');
      setTimeout(() => setMsg(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  // Cerrar modal de éxito
  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSaleDetails(null);
  };

  // Limpiar mensajes
  const clearMessage = () => {
    setMsg('');
  };

  return {
    // State
    msg,
    showSuccessModal,
    saleDetails,
    loading,
    
    // Actions
    handleSale,
    handleQuote,
    closeSuccessModal,
    setMsg,
    clearMessage
  };
};