import { useState, useCallback } from 'react';

export const useDeliveryForm = (initialValues = {}) => {
  const [form, setForm] = useState({
    proveedor: '',
    producto: '',
    cantidad: '',
    unidad: 'pza',
    fechaEmision: '',
    tienda: '',
    assignedTo: '',
    ...initialValues
  });

  const [editingOrder, setEditingOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    fechaEntrega: '',
    nota: ''
  });

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Actualizar campo del formulario principal
  const updateField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Actualizar múltiples campos del formulario principal
  const updateForm = (newData) => {
    setForm(prev => ({
      ...prev,
      ...newData
    }));
  };

  // Limpiar formulario principal
  const resetForm = () => {
    setForm({
      proveedor: '',
      producto: '',
      cantidad: '',
      unidad: 'pza',
      fechaEmision: '',
      tienda: '',
      assignedTo: ''
    });
  };

  // Actualizar campo del formulario de edición
  const updateEditField = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Iniciar edición de una orden
  const startEditing = (order) => {
    setEditingOrder(order);

    // Formatear fecha de entrega sin conversión de zona horaria
    let fechaEntrega = '';
    if (order.fechaEntrega) {
      const dateString = order.fechaEntrega;
      // Si es una fecha ISO, extraer solo la parte de la fecha (YYYY-MM-DD)
      if (typeof dateString === 'string' && dateString.includes('T')) {
        fechaEntrega = dateString.split('T')[0];
      } else {
        fechaEntrega = dateString;
      }
    }

    setEditForm({
      status: order.status || '',
      fechaEntrega,
      nota: order.nota || ''
    });
  };

  // Cancelar edición
  const cancelEditing = () => {
    setEditingOrder(null);
    setEditForm({
      status: '',
      fechaEntrega: '',
      nota: ''
    });
  };

  // Preparar datos para envío
  const getFormData = () => {
    return {
      ...form,
      cantidad: parseFloat(form.cantidad) || 0
    };
  };

  // Preparar datos de edición para envío
  const getEditData = () => {
    const editData = {};

    if (editForm.status) editData.status = editForm.status;
    if (editForm.fechaEntrega) editData.fechaEntrega = editForm.fechaEntrega;
    if (editForm.nota !== undefined) editData.nota = editForm.nota;

    return editData;
  };

  // Configurar formulario con datos del usuario
  const setUserData = useCallback((userInfo) => {
    if (userInfo.role !== 'admin' && userInfo.tienda) {
      setForm(prev => ({
        ...prev,
        tienda: userInfo.tienda._id
      }));
    }
  }, []);

  return {
    // Form state
    form,
    editingOrder,
    editForm,
    mostrarFormulario,

    // Form actions
    updateField,
    updateForm,
    resetForm,
    updateEditField,
    startEditing,
    cancelEditing,
    setMostrarFormulario,

    // Utilities
    getFormData,
    getEditData,
    setUserData
  };
};