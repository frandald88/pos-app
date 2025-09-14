import { useState } from 'react';
import deliveryService from '../services/deliveryService';

export const useDeliveryActions = () => {
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Crear nueva orden
  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      setMsg('');

      const response = await deliveryService.createOrder(orderData);
      setMsg('Orden creada exitosamente ✅');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la orden';
      setMsg(`${errorMessage} ❌`);
      setTimeout(() => setMsg(''), 5000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar orden
  const updateOrder = async (orderId, updateData) => {
    try {
      setLoading(true);
      setMsg('');

      const response = await deliveryService.updateOrder(orderId, updateData);
      setMsg('Orden actualizada exitosamente ✅');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error updating order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al actualizar la orden';
      setMsg(`${errorMessage} ❌`);
      setTimeout(() => setMsg(''), 5000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar orden
  const deleteOrder = async (orderId) => {
    try {
      setLoading(true);
      setMsg('');

      const response = await deliveryService.deleteOrder(orderId);
      setMsg('Orden eliminada exitosamente ✅');
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMsg(''), 3000);
      
      return response;
    } catch (error) {
      console.error('Error deleting order:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error al eliminar la orden';
      setMsg(`${errorMessage} ❌`);
      setTimeout(() => setMsg(''), 5000);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Limpiar mensajes
  const clearMessage = () => {
    setMsg('');
  };

  // Validar datos de orden
  const validateOrderData = (orderData) => {
    const errors = [];

    if (!orderData.proveedor?.trim()) {
      errors.push('El proveedor es requerido');
    }

    if (!orderData.producto?.trim()) {
      errors.push('El producto es requerido');
    }

    if (!orderData.cantidad || orderData.cantidad <= 0) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (!orderData.fechaEmision) {
      errors.push('La fecha de emisión es requerida');
    }

    // Validar fecha de emisión
    const emisionDate = new Date(orderData.fechaEmision);
    if (isNaN(emisionDate.getTime())) {
      errors.push('Fecha de emisión inválida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Formatear datos de orden para envío
  const formatOrderData = (formData, userInfo = {}) => {
    return {
      proveedor: formData.proveedor.trim(),
      producto: formData.producto.trim(),
      cantidad: parseFloat(formData.cantidad),
      unidad: formData.unidad || 'pza',
      fechaEmision: formData.fechaEmision,
      tienda: formData.tienda || userInfo.tienda?._id || null,
      assignedTo: formData.assignedTo || null
    };
  };

  return {
    // State
    msg,
    loading,

    // Actions
    createOrder,
    updateOrder,
    deleteOrder,
    clearMessage,
    setMsg,

    // Utilities
    validateOrderData,
    formatOrderData
  };
};