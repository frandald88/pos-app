import { useEffect, useState, useCallback } from "react";
import {
  usePurchaseOrdersData,
  usePurchaseOrdersActions,
  usePurchaseOrdersForm,
  usePurchaseOrdersFilters
} from '../hooks';

// SVG Icons - AstroDish Design System
const Icons = {
  package: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>,
  clock: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>,
  check: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>,
  xmark: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>,
  plus: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>,
  clipboard: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>,
  store: () => <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
};

export default function PurchaseOrdersPage() {
  // Estado local para modal
  const [modalError, setModalError] = useState("");

  // Hooks personalizados
  const {
    orders,
    allOrders,
    tiendas,
    users,
    userRole,
    userTienda,
    userId,
    loading: dataLoading,
    error,
    loadOrders,
    loadUsers,
    setError
  } = usePurchaseOrdersData();

  const {
    msg,
    loading: actionLoading,
    createOrder,
    updateOrder,
    deleteOrder,
    clearMessage,
    validateOrderData,
    formatOrderData
  } = usePurchaseOrdersActions();

  const {
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
  } = usePurchaseOrdersForm();

  const {
    filtroStatus,
    searchTerm,
    filtroTienda,
    filteredOrders,
    setFiltroStatus,
    setSearchTerm,
    setFiltroTienda
  } = usePurchaseOrdersFilters(orders);

  // Calcular estadísticas desde allOrders (sin filtrar) para que no cambien al filtrar
  const orderStats = {
    total: allOrders.length,
    pendientes: allOrders.filter(o => o.status === 'pendiente').length,
    completadas: allOrders.filter(o => o.status === 'completada').length,
    canceladas: allOrders.filter(o => o.status === 'cancelada').length
  };

  // Estados derivados
  const cargando = dataLoading || actionLoading;

  // Configurar datos del usuario al cargar
  useEffect(() => {
    if (userRole && userTienda) {
      setUserData({ role: userRole, tienda: userTienda });
    }
  }, [userRole, userTienda, setUserData]);

  // Función helper para construir filtros de órdenes
  const buildOrderFilters = useCallback(() => {
    const filters = {};
    if (filtroStatus !== 'todos') filters.status = filtroStatus;

    // Si el usuario NO es admin, solo mostrar órdenes de su tienda
    if (userRole !== 'admin' && userTienda) {
      const tiendaId = typeof userTienda === 'object' ? userTienda._id : userTienda;
      filters.tiendaId = tiendaId;
    } else if (userRole === 'admin' && filtroTienda) {
      // Si es admin y ha seleccionado una tienda en el filtro
      filters.tiendaId = filtroTienda;
    }

    return filters;
  }, [filtroStatus, userRole, userTienda, filtroTienda]);

  // Cargar órdenes inicialmente y cuando cambia el filtro
  useEffect(() => {
    // GUARD: No cargar órdenes hasta que la información del usuario esté disponible
    if (!userRole) return;

    loadOrders(buildOrderFilters());
  }, [loadOrders, userRole, buildOrderFilters]);

  // Recargar usuarios cuando cambia la tienda seleccionada
  useEffect(() => {
    if (form.tienda) {
      loadUsers({ tiendaId: form.tienda });
    }
  }, [form.tienda, loadUsers]);

  // Manejar envío del formulario (crear o editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError("");
    clearMessage();

    if (editingOrder) {
      // Actualizar orden existente
      try {
        const updateData = getEditData();

        if (!updateData.status) {
          setModalError("El estado es requerido");
          return;
        }

        await updateOrder(editingOrder._id, updateData);
        cancelEditing();
        setMostrarFormulario(false);
        setModalError("");
        loadOrders(buildOrderFilters());
      } catch (error) {
        setModalError("Error al actualizar orden");
      }
    } else {
      // Crear nueva orden
      const formData = getFormData();
      const validation = validateOrderData(formData);

      if (!validation.isValid) {
        setModalError(validation.errors.join(', '));
        return;
      }

      try {
        const orderData = formatOrderData(formData, { tienda: userTienda });
        await createOrder(orderData);

        resetForm();
        setMostrarFormulario(false);
        setModalError("");
        loadOrders(buildOrderFilters());
      } catch (error) {
        setModalError("Error al crear orden");
      }
    }
  };

  // Handler para abrir modal de edición
  const handleEditOrder = (order) => {
    startEditing(order);
    setMostrarFormulario(true);
    setModalError("");
  };

  // Handler para cerrar modal
  const handleCloseModal = () => {
    if (editingOrder) {
      cancelEditing();
    } else {
      resetForm();
    }
    setMostrarFormulario(false);
    setModalError("");
  };

  // Handler para cambios en el formulario del modal
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    if (editingOrder) {
      updateEditField(name, value);
    } else {
      updateField(name, value);
    }
  };

  // Manejar eliminación de orden
  const handleDelete = async (orderId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      try {
        await deleteOrder(orderId);
        loadOrders(buildOrderFilters());
      } catch (error) {
        // Error ya manejado por el hook
      }
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "-";

    let dateOnly = dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) {
      dateOnly = dateString.split('T')[0];
    }

    const [year, month, day] = dateOnly.split('-');
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    const monthName = meses[parseInt(month) - 1];

    return `${day} ${monthName} ${year}`;
  };

  // Función para obtener color del status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'completada':
        return 'bg-green-100 text-green-800';
      case 'cancelada':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Función para verificar permisos de actualización
  const canUpdateOrder = (order) => {
    if (!userId || !userRole) return false;

    return userRole === 'admin' ||
           order.createdBy?._id === userId ||
           order.assignedTo?._id === userId;
  };

  // Render del componente
  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
                Órdenes de Compra
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Administra las órdenes de compra y abastecimiento
              </p>
            </div>

            {/* Estadísticas */}
            <div className="flex gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl" style={{ color: '#23334e' }}>
                  <svg className="w-8 h-8 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {orderStats.total}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Total
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl" style={{ color: '#f59e0b' }}>
                  <svg className="w-8 h-8 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>
                  {orderStats.pendientes}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Pendientes
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl" style={{ color: '#10b981' }}>
                  <svg className="w-8 h-8 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="text-lg font-bold" style={{ color: '#10b981' }}>
                  {orderStats.completadas}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Completadas
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl" style={{ color: '#ef4444' }}>
                  <svg className="w-8 h-8 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div className="text-lg font-bold" style={{ color: '#ef4444' }}>
                  {orderStats.canceladas}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Canceladas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {(msg || error) && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            error ? 'bg-red-50 border-red-400 text-red-800' :
            msg.includes('Error') ? 'bg-red-50 border-red-400 text-red-800' :
            'bg-green-50 border-green-400 text-green-800'
          }`}>
            <p className="font-medium">{error || msg}</p>
          </div>
        )}

        {/* Controles */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Botón nueva orden */}
            <div>
              <button
                onClick={() => setMostrarFormulario(!mostrarFormulario)}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 shadow-md hover:shadow-lg"
                style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                disabled={cargando}
              >
                {mostrarFormulario ? (
                  <span className="flex items-center gap-2">
                    <Icons.xmark /> Cancelar
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Icons.plus /> Nueva Orden
                  </span>
                )}
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Filtrar por estado
                </label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                  style={{ borderColor: '#e5e7eb' }}
                  disabled={cargando}
                >
                  <option value="todos">Todas</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="completada">Completadas</option>
                  <option value="cancelada">Canceladas</option>
                </select>
              </div>

              {userRole === 'admin' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Filtrar por tienda
                  </label>
                  <select
                    value={filtroTienda}
                    onChange={(e) => setFiltroTienda(e.target.value)}
                    className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                    style={{ borderColor: '#e5e7eb' }}
                    disabled={cargando}
                  >
                    <option value="">Todas las tiendas</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda._id} value={tienda._id}>
                        {tienda.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Buscar órdenes
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por proveedor, producto o ID..."
                    className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ borderColor: '#e5e7eb' }}
                  />
                  <div className="absolute left-3 top-3.5">
                    <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de órdenes */}
        {cargando ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
            <p style={{ color: '#697487' }}>Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="mb-4 flex justify-center" style={{ color: '#23334e' }}>
              <svg className="w-24 h-24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              No hay órdenes
            </h3>
            <p style={{ color: '#697487' }}>
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}"`
                : `No hay órdenes con el filtro seleccionado`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white rounded-xl shadow-lg border transition-all duration-200 hover:shadow-xl">
                {/* Header de la orden */}
                <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                          Orden #{order._id.slice(-8)}
                        </h3>
                        <span className={`px-3 py-1 text-sm rounded-full font-medium flex items-center gap-1.5 ${getStatusColor(order.status)}`}>
                          {order.status === 'pendiente' ? <><Icons.clock /> Pendiente</> :
                           order.status === 'completada' ? <><Icons.check /> Completada</> :
                           order.status === 'cancelada' ? <><Icons.xmark /> Cancelada</> : order.status}
                        </span>
                      </div>
                      {order.createdBy && (
                        <p className="text-sm" style={{ color: '#697487' }}>
                          Creado por: <span className="font-medium">{order.createdBy.username}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      {canUpdateOrder(order) && (
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200"
                          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                        >
                          Editar
                        </button>
                      )}
                      {userRole === 'admin' && (order.status === 'completada' || order.status === 'cancelada') && (
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:bg-red-600"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido de la orden */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Proveedor
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        {typeof order.proveedor === 'object' ? order.proveedor?.nombre : order.proveedor}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Producto
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        {order.producto}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Cantidad
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        {order.cantidad} {order.unidad}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Fecha de Emisión
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        {formatDate(order.fechaEmision)}
                      </div>
                    </div>

                    {order.tienda?.nombre && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Tienda
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          {order.tienda.nombre}
                        </div>
                      </div>
                    )}

                    {order.assignedTo && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Asignado a
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          {order.assignedTo.username} ({order.assignedTo.role})
                        </div>
                      </div>
                    )}

                    {order.fechaEntrega && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Fecha de Entrega
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          {formatDate(order.fechaEntrega)}
                        </div>
                      </div>
                    )}

                    {order.nota && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Nota
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          {order.nota}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal para crear/editar orden */}
        {mostrarFormulario && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              {/* Header del modal */}
              <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold" style={{ color: '#23334e' }}>
                    {editingOrder ? 'Editar Orden' : 'Nueva Orden de Compra'}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Error del modal */}
                {modalError && (
                  <div className="p-3 bg-red-50 border-l-4 border-red-400 text-red-800 rounded">
                    {modalError}
                  </div>
                )}

                {editingOrder ? (
                  // Formulario de edición
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Estado *
                      </label>
                      <select
                        name="status"
                        value={editForm.status}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        required
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="completada">Completada</option>
                        <option value="cancelada">Cancelada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Fecha de Entrega
                      </label>
                      <input
                        type="date"
                        name="fechaEntrega"
                        value={editForm.fechaEntrega}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Nota
                      </label>
                      <textarea
                        name="nota"
                        value={editForm.nota}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        rows="3"
                        placeholder="Agregar nota..."
                      />
                    </div>
                  </>
                ) : (
                  // Formulario de creación
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Proveedor *
                      </label>
                      <input
                        type="text"
                        name="proveedor"
                        value={form.proveedor}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        placeholder="Nombre del proveedor"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Producto *
                      </label>
                      <input
                        type="text"
                        name="producto"
                        value={form.producto}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        placeholder="Nombre del producto"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Cantidad *
                        </label>
                        <input
                          type="number"
                          name="cantidad"
                          value={form.cantidad}
                          onChange={handleModalChange}
                          className="w-full p-3 border rounded-lg"
                          style={{ borderColor: '#e5e7eb' }}
                          placeholder="0"
                          min="0.01"
                          step="0.01"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Unidad *
                        </label>
                        <select
                          name="unidad"
                          value={form.unidad}
                          onChange={handleModalChange}
                          className="w-full p-3 border rounded-lg"
                          style={{ borderColor: '#e5e7eb' }}
                        >
                          <option value="pza">Pieza</option>
                          <option value="kg">Kilogramo</option>
                          <option value="g">Gramos</option>
                          <option value="lt">Litros</option>
                          <option value="caja">Caja</option>
                          <option value="paquete">Paquete</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Fecha de Emisión *
                      </label>
                      <input
                        type="date"
                        name="fechaEmision"
                        value={form.fechaEmision}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        required
                      />
                    </div>

                    {userRole === 'admin' && (
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                          Tienda *
                        </label>
                        <select
                          name="tienda"
                          value={form.tienda}
                          onChange={handleModalChange}
                          className="w-full p-3 border rounded-lg"
                          style={{ borderColor: '#e5e7eb' }}
                          required
                        >
                          <option value="">Seleccionar tienda</option>
                          {tiendas.map((tienda) => (
                            <option key={tienda._id} value={tienda._id}>
                              {tienda.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                        Asignar a *
                      </label>
                      <select
                        name="assignedTo"
                        value={form.assignedTo}
                        onChange={handleModalChange}
                        className="w-full p-3 border rounded-lg"
                        style={{ borderColor: '#e5e7eb' }}
                        required
                      >
                        <option value="">Seleccionar usuario</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.username} ({user.role})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Botones */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-3 border rounded-lg font-medium"
                    style={{ borderColor: '#e5e7eb', color: '#697487' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={cargando}
                    className="flex-1 px-4 py-3 rounded-lg font-medium text-white"
                    style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
                  >
                    {cargando ? 'Guardando...' : (editingOrder ? 'Actualizar Orden' : 'Crear Orden')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
