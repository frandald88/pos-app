import { useState } from 'react';
import purchaseOrdersService from '../services/purchaseOrdersService';

export const usePurchaseOrdersActions = () => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Crear orden
  const createOrder = async (orderData) => {
    try {
      setLoading(true);
      setMsg('');
      const result = await purchaseOrdersService.create(orderData);
      setMsg('Orden creada exitosamente');
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al crear orden';
      setMsg(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar orden
  const updateOrder = async (id, orderData) => {
    try {
      setLoading(true);
      setMsg('');
      const result = await purchaseOrdersService.update(id, orderData);
      setMsg('Orden actualizada exitosamente');
      return result;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al actualizar orden';
      setMsg(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Eliminar orden
  const deleteOrder = async (id) => {
    try {
      setLoading(true);
      setMsg('');
      await purchaseOrdersService.delete(id);
      setMsg('Orden eliminada exitosamente');
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Error al eliminar orden';
      setMsg(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validar datos de orden
  const validateOrderData = (data) => {
    const errors = [];

    if (!data.proveedor?.trim()) errors.push('El proveedor es requerido');
    if (!data.producto?.trim()) errors.push('El producto es requerido');
    if (!data.cantidad || data.cantidad <= 0) errors.push('La cantidad debe ser mayor a 0');
    if (!data.fechaEmision) errors.push('La fecha de emisión es requerida');
    if (!data.tienda) errors.push('La tienda es requerida');
    if (!data.assignedTo) errors.push('Debes asignar la orden a un usuario');

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Formatear datos de orden para enviar al backend
  const formatOrderData = (formData, options = {}) => {
    return {
      proveedor: formData.proveedor?.trim(),
      producto: formData.producto?.trim(),
      cantidad: parseFloat(formData.cantidad),
      unidad: formData.unidad || 'pza',
      fechaEmision: formData.fechaEmision,
      tienda: formData.tienda,
      assignedTo: formData.assignedTo
    };
  };

  const clearMessage = () => setMsg('');

  return {
    loading,
    msg,
    createOrder,
    updateOrder,
    deleteOrder,
    validateOrderData,
    formatOrderData,
    clearMessage,
    setMsg
  };
};
