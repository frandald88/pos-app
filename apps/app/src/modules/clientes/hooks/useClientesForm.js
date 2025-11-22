import { useState } from 'react';
import { useClientesUtils } from './useClientesUtils';

export const useClientesForm = () => {
  const { cleanPhoneNumber, prepareClienteData, validateCliente } = useClientesUtils();

  // Estados del formulario nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  // Estados del formulario edición
  const [editandoId, setEditandoId] = useState(null);
  const [editCliente, setEditCliente] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  // Estado del formulario
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Manejar cambios en formulario nuevo cliente
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'telefono') {
      const telefonoLimpio = cleanPhoneNumber(value);
      setNuevoCliente({
        ...nuevoCliente,
        [name]: telefonoLimpio
      });
    } else {
      setNuevoCliente({
        ...nuevoCliente,
        [name]: value
      });
    }
  };

  // Manejar cambios en formulario edición
  const handleEditChange = (e, field) => {
    const { value } = e.target;
    
    if (field === 'telefono') {
      const telefonoLimpio = cleanPhoneNumber(value);
      setEditCliente({ ...editCliente, [field]: telefonoLimpio });
    } else {
      setEditCliente({ ...editCliente, [field]: value });
    }
  };

  // Validar formulario nuevo cliente
  const validateNewClienteForm = () => {
    return validateCliente(nuevoCliente);
  };

  // Validar formulario edición
  const validateEditForm = () => {
    return validateCliente(editCliente);
  };

  // Preparar datos para envío - nuevo cliente
  const getNewClienteData = () => {
    return prepareClienteData(nuevoCliente);
  };

  // Preparar datos para envío - edición
  const getEditClienteData = () => {
    return prepareClienteData(editCliente);
  };

  // Limpiar formulario nuevo cliente
  const clearNewClienteForm = () => {
    setNuevoCliente({
      nombre: '',
      direccion: '',
      telefono: '',
      email: ''
    });
    setMostrarFormulario(false);
  };

  // Iniciar edición
  const startEdit = (cliente) => {
    setEditandoId(cliente._id);
    setEditCliente({
      nombre: cliente.nombre || '',
      direccion: cliente.direccion || '',
      telefono: cliente.telefono || '',
      email: cliente.email || ''
    });
  };

  // Cancelar edición
  const cancelEdit = () => {
    setEditandoId(null);
    setEditCliente({
      nombre: '',
      direccion: '',
      telefono: '',
      email: ''
    });
  };

  // Alternar formulario
  const toggleForm = () => {
    setMostrarFormulario(!mostrarFormulario);
    if (mostrarFormulario) {
      clearNewClienteForm();
    }
  };

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = () => {
    const hasNewClienteData = Object.values(nuevoCliente).some(value => value.trim() !== '');
    const hasEditChanges = editandoId !== null;
    return hasNewClienteData || hasEditChanges;
  };

  // Resetear todos los formularios
  const resetAllForms = () => {
    clearNewClienteForm();
    cancelEdit();
  };

  // Obtener estado del formulario
  const getFormState = () => {
    return {
      isCreating: mostrarFormulario,
      isEditing: editandoId !== null,
      hasChanges: hasUnsavedChanges(),
      editingId: editandoId
    };
  };

  return {
    // Estados del formulario nuevo
    nuevoCliente,
    mostrarFormulario,

    // Estados del formulario edición
    editandoId,
    editCliente,

    // Handlers de cambios
    handleChange,
    handleEditChange,

    // Validaciones
    validateNewClienteForm,
    validateEditForm,

    // Preparación de datos
    getNewClienteData,
    getEditClienteData,

    // Gestión de formularios
    clearNewClienteForm,
    startEdit,
    cancelEdit,
    toggleForm,
    resetAllForms,

    // Utilidades
    hasUnsavedChanges,
    getFormState,

    // Setters
    setNuevoCliente,
    setEditCliente,
    setMostrarFormulario,
    setEditandoId
  };
};