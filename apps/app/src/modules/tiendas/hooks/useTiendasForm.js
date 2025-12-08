import { useState } from 'react';
import { useTiendasUtils } from './useTiendasUtils';

export const useTiendasForm = () => {
  const { prepareTiendaData, validateTienda } = useTiendasUtils();

  // Estados del formulario nueva tienda
  const [nuevaTienda, setNuevaTienda] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  // Estados del formulario edición
  const [editTienda, setEditTienda] = useState(null);
  const [tiendaEditando, setTiendaEditando] = useState({
    nombre: '',
    direccion: '',
    telefono: ''
  });

  // Estados de modales
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEdicion, setMostrarModalEdicion] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [tiendaEliminar, setTiendaEliminar] = useState(null);
  
  // Estado de mensaje específico para el modal
  const [modalMsg, setModalMsg] = useState('');

  // Manejar cambios en formulario nueva tienda
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevaTienda({
      ...nuevaTienda,
      [name]: value
    });
  };

  // Manejar cambios en formulario edición modal
  const handleChangeModal = (e) => {
    const { name, value } = e.target;
    
    // Limpiar mensaje de error cuando el usuario empiece a escribir
    if (modalMsg) {
      setModalMsg('');
    }
    
    setTiendaEditando({
      ...tiendaEditando,
      [name]: value
    });
  };

  // Validar formulario nueva tienda
  const validateNewTiendaForm = () => {
    return validateTienda(nuevaTienda);
  };

  // Validar formulario edición
  const validateEditForm = () => {
    return validateTienda(tiendaEditando);
  };

  // Preparar datos para envío - nueva tienda
  const getNewTiendaData = () => {
    return prepareTiendaData(nuevaTienda);
  };

  // Preparar datos para envío - edición
  const getEditTiendaData = () => {
    return prepareTiendaData(tiendaEditando);
  };

  // Limpiar formulario nueva tienda
  const clearNewTiendaForm = () => {
    setNuevaTienda({
      nombre: '',
      direccion: '',
      telefono: ''
    });
    setMostrarFormulario(false);
  };

  // Manejar cancelación del formulario principal
  const handleCancelar = () => {
    setEditTienda(null);
    setNuevaTienda({
      nombre: '',
      direccion: '',
      telefono: ''
    });
    setMostrarFormulario(false);
  };

  // Manejar edición en formulario principal
  const handleEdit = (tienda) => {
    setEditTienda(tienda);
    setNuevaTienda({
      nombre: tienda.nombre || '',
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || ''
    });
    setMostrarFormulario(true);
  };

  // Iniciar edición en modal
  const handleEditModal = (tienda) => {
    console.log('🏪 Editando tienda, objeto recibido:', tienda);
    console.log('🏪 Teléfono de la tienda:', tienda.telefono);

    setTiendaEditando({
      nombre: tienda.nombre || '',
      direccion: tienda.direccion || '',
      telefono: tienda.telefono || ''
    });
    setEditTienda(tienda);
    setMostrarModalEdicion(true);
  };

  // Cerrar modal de edición
  const handleCerrarModal = () => {
    setMostrarModalEdicion(false);
    setTiendaEditando({
      nombre: '',
      direccion: '',
      telefono: ''
    });
    setEditTienda(null);
    setModalMsg(''); // Limpiar mensaje del modal
  };

  // Iniciar proceso de eliminación
  const handleDelete = (tienda) => {
    setTiendaEliminar(tienda);
    setMostrarModalEliminar(true);
  };

  // Cerrar modal de eliminación
  const handleCerrarModalEliminar = () => {
    setMostrarModalEliminar(false);
    setTiendaEliminar(null);
  };

  // Alternar formulario principal
  const toggleForm = () => {
    if (mostrarFormulario) {
      handleCancelar();
    } else {
      setMostrarFormulario(true);
    }
  };

  // Verificar si hay cambios pendientes
  const hasUnsavedChanges = () => {
    const hasNewTiendaData = Object.values(nuevaTienda).some(value => value.trim() !== '');
    const hasEditChanges = editTienda !== null;
    const hasModalEditChanges = mostrarModalEdicion;
    return hasNewTiendaData || hasEditChanges || hasModalEditChanges;
  };

  // Limpiar mensaje del modal
  const clearModalMsg = () => {
    setModalMsg('');
  };

  // Resetear todos los formularios
  const resetAllForms = () => {
    clearNewTiendaForm();
    handleCerrarModal();
    handleCerrarModalEliminar();
    setEditTienda(null);
    setModalMsg('');
  };

  // Obtener estado del formulario
  const getFormState = () => {
    return {
      isCreating: mostrarFormulario && !editTienda,
      isEditing: editTienda !== null,
      isEditingInModal: mostrarModalEdicion,
      isDeletingModalOpen: mostrarModalEliminar,
      hasChanges: hasUnsavedChanges(),
      editingId: editTienda?._id,
      deletingTienda: tiendaEliminar
    };
  };

  // Obtener título del formulario
  const getFormTitle = () => {
    if (editTienda) {
      return 'Editar Tienda';
    }
    return 'Agregar Nueva Tienda';
  };

  // Obtener texto del botón principal
  const getSubmitButtonText = (cargando = false) => {
    if (cargando) {
      return editTienda ? 'Actualizando...' : 'Guardando...';
    }
    return editTienda ? 'Actualizar Tienda' : 'Guardar Tienda';
  };

  return {
    // Estados del formulario nueva/editar
    nuevaTienda,
    editTienda,
    mostrarFormulario,

    // Estados del modal de edición
    tiendaEditando,
    mostrarModalEdicion,

    // Estados del modal de eliminación
    mostrarModalEliminar,
    tiendaEliminar,

    // Estado de mensaje del modal
    modalMsg,

    // Handlers de cambios
    handleChange,
    handleChangeModal,

    // Validaciones
    validateNewTiendaForm,
    validateEditForm,

    // Preparación de datos
    getNewTiendaData,
    getEditTiendaData,

    // Gestión de formulario principal
    clearNewTiendaForm,
    handleCancelar,
    handleEdit,
    toggleForm,

    // Gestión de modal de edición
    handleEditModal,
    handleCerrarModal,

    // Gestión de modal de eliminación
    handleDelete,
    handleCerrarModalEliminar,

    // Utilidades
    hasUnsavedChanges,
    resetAllForms,
    getFormState,
    getFormTitle,
    getSubmitButtonText,
    clearModalMsg,

    // Setters
    setNuevaTienda,
    setEditTienda,
    setTiendaEditando,
    setMostrarFormulario,
    setMostrarModalEdicion,
    setMostrarModalEliminar,
    setTiendaEliminar,
    setModalMsg
  };
};