import { useState } from 'react';
import salesService from '../services/salesService';

export const useSaleActions = () => {
  const [msg, setMsg] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
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

      // REMOVIDO: Ya no es obligatorio asignar repartidor para domicilio
      // El repartidor disponible se asigna después, no al momento de la venta

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
        folio: response.sale.folio, // ⭐ Folio consecutivo desde el backend
        fecha: response.sale.date || new Date(),
        total: totalWithTax,
        items: saleData.items.length,
        itemsDetalle: saleData.items, // ⭐ Agregar items completos para impresión
        cliente: saleData.clienteNombre || 'Cliente general',
        clienteDetalle: saleData.clienteDetalle || null, // ⭐ Objeto completo del cliente con dirección
        paymentType,
        method: paymentType === 'single' ? paymentMethod : 'mixto',
        mixedPayments: paymentType === 'mixed' ? mixedPayments : [],
        type: saleType,
        change: paymentType === 'single' && paymentMethod === 'efectivo'
          ? Math.max(0, (parseFloat(amountPaid) || 0) - totalWithTax)
          : (callbacks.getTotalChange ? callbacks.getTotalChange() : 0),
        amountPaid: paymentType === 'single' ? amountPaid : null,
        subtotal: totalWithTax - (saleData.discount || 0), // Subtotal antes del descuento
        descuento: saleData.discount || 0,
        tienda: saleData.tiendaCompleta || saleData.tienda, // Información completa de la tienda con ticketConfig
        usuario: response.sale.user || { username: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')).username : 'Cajero' } // ⭐ Usuario que registró la venta
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

      // Extraer el mensaje de error del backend
      let errorMsg = 'Error al registrar venta';

      if (error.response?.data?.message) {
        // El backend envía el mensaje en response.data.message
        errorMsg = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.message) {
        errorMsg = error.message;
      }

      // Mostrar modal de error en lugar de mensaje pequeño
      setErrorMessage(errorMsg);
      setShowErrorModal(true);
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

  // Cerrar modal de error
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage('');
  };

  // Limpiar mensajes
  const clearMessage = () => {
    setMsg('');
  };

  return {
    // State
    msg,
    showSuccessModal,
    showErrorModal,
    errorMessage,
    saleDetails,
    loading,

    // Actions
    handleSale,
    handleQuote,
    closeSuccessModal,
    closeErrorModal,
    setMsg,
    clearMessage
  };
};