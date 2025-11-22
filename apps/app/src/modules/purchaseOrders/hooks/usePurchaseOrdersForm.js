import { useState, useCallback } from 'react';

export const usePurchaseOrdersForm = () => {
  const initialFormState = {
    proveedor: '',
    producto: '',
    cantidad: '',
    unidad: 'pza',
    fechaEmision: new Date().toISOString().split('T')[0],
    tienda: '',
    assignedTo: ''
  };

  const [form, setForm] = useState(initialFormState);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    fechaEntrega: '',
    nota: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Actualizar campo del formulario de creación
  const updateField = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setForm(initialFormState);
  }, []);

  // Actualizar campo del formulario de edición
  const updateEditField = useCallback((name, value) => {
    setEditForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Iniciar edición de una orden
  const startEditing = useCallback((order) => {
    setEditingOrder(order);
    setEditForm({
      status: order.status || 'pendiente',
      fechaEntrega: order.fechaEntrega ? order.fechaEntrega.split('T')[0] : '',
      nota: order.nota || ''
    });
  }, []);

  // Cancelar edición
  const cancelEditing = useCallback(() => {
    setEditingOrder(null);
    setEditForm({
      status: '',
      fechaEntrega: '',
      nota: ''
    });
  }, []);

  // Obtener datos del formulario de creación
  const getFormData = useCallback(() => {
    return { ...form };
  }, [form]);

  // Obtener datos del formulario de edición
  const getEditData = useCallback(() => {
    return { ...editForm };
  }, [editForm]);

  // Configurar datos del usuario (para auto-seleccionar tienda)
  const setUserData = useCallback(({ role, tienda }) => {
    if (role !== 'admin' && tienda) {
      const tiendaId = typeof tienda === 'object' ? tienda._id : tienda;
      setForm(prev => ({ ...prev, tienda: tiendaId }));
    }
  }, []);

  return {
    form,
    editingOrder,
    editForm,
    mostrarFormulario,
    updateField,
    resetForm,
    updateEditField,
    startEditing,
    cancelEditing,
    setMostrarFormulario,
    getFormData,
    getEditData,
    setUserData
  };
};
