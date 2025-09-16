import { useState } from 'react';

export const useGastosForm = (defaultStore = null, canSelectMultipleStores = true) => {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [concepto, setConcepto] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [evidencia, setEvidencia] = useState(null);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(defaultStore || '');
  const [usarProveedorManual, setUsarProveedorManual] = useState(false);
  const [busquedaProveedor, setBusquedaProveedor] = useState('');
  const [proveedoresEncontrados, setProveedoresEncontrados] = useState([]);

  // Estados para edición
  const [editingGastoId, setEditingGastoId] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');

  // Obtener datos del formulario
  const getFormData = () => ({
    concepto: concepto.trim(),
    proveedor: proveedor.trim(),
    monto: monto === '' ? 0 : parseFloat(monto),
    metodoPago,
    tienda: tiendaSeleccionada,
    evidencia
  });

  // Limpiar formulario
  const clearForm = () => {
    setConcepto('');
    setProveedor('');
    setMonto('');
    setMetodoPago('efectivo');
    setEvidencia(null);
    
    // Solo limpiar tienda si es admin
    if (canSelectMultipleStores) {
      setTiendaSeleccionada('');
    }
    
    setUsarProveedorManual(false);
    setBusquedaProveedor('');
    setProveedoresEncontrados([]);
    
    // Limpiar input de archivo
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  // Manejar cancelación
  const handleCancelar = () => {
    clearForm();
    setMostrarFormulario(false);
  };

  // Limpiar formulario de edición
  const clearEditingForm = () => {
    setEditingGastoId(null);
    setNewStatus('');
    setAdminNote('');
  };

  // Validar formulario
  const validateForm = () => {
    const errors = [];
    
    if (!concepto.trim()) errors.push('El concepto es requerido');
    if (!proveedor.trim()) errors.push('El proveedor es requerido');
    if (!monto || isNaN(parseFloat(monto)) || parseFloat(monto) <= 0) {
      errors.push('El monto debe ser un número mayor a 0');
    }
    if (!metodoPago) errors.push('El método de pago es requerido');
    if (!tiendaSeleccionada) errors.push('La tienda es requerida');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Validar formulario de edición
  const validateEditingForm = () => {
    return newStatus !== '';
  };

  // Establecer proveedor desde búsqueda
  const selectProvider = (providerName) => {
    setProveedor(providerName);
    setBusquedaProveedor(providerName);
    setProveedoresEncontrados([]);
    setUsarProveedorManual(false);
  };

  // Obtener datos de edición
  const getEditingData = () => ({
    gastoId: editingGastoId,
    status: newStatus,
    nota: adminNote.trim()
  });

  return {
    // Estados del formulario principal
    mostrarFormulario,
    concepto,
    proveedor,
    monto,
    metodoPago,
    evidencia,
    tiendaSeleccionada,
    usarProveedorManual,
    busquedaProveedor,
    proveedoresEncontrados,

    // Estados de edición
    editingGastoId,
    newStatus,
    adminNote,

    // Setters
    setMostrarFormulario,
    setConcepto,
    setProveedor,
    setMonto,
    setMetodoPago,
    setEvidencia,
    setTiendaSeleccionada,
    setUsarProveedorManual,
    setBusquedaProveedor,
    setProveedoresEncontrados,
    setEditingGastoId,
    setNewStatus,
    setAdminNote,

    // Acciones
    getFormData,
    clearForm,
    handleCancelar,
    clearEditingForm,
    validateForm,
    validateEditingForm,
    selectProvider,
    getEditingData
  };
};