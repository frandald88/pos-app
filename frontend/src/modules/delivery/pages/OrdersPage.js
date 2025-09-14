import { useEffect } from "react";
import { 
  useDeliveryData, 
  useDeliveryActions, 
  useDeliveryForm, 
  useDeliveryFilters 
} from '../hooks';

export default function OrdersPage() {
  // Hooks personalizados
  const {
    orders,
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
  } = useDeliveryData();

  const {
    msg,
    loading: actionLoading,
    createOrder,
    updateOrder,
    deleteOrder,
    clearMessage,
    validateOrderData,
    formatOrderData
  } = useDeliveryActions();

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
  } = useDeliveryForm();

  const {
    filtroStatus,
    searchTerm,
    filteredOrders,
    orderStats,
    setFiltroStatus,
    setSearchTerm
  } = useDeliveryFilters(orders);

  // Estados derivados
  const cargando = dataLoading || actionLoading;

  // Configurar datos del usuario al cargar
  useEffect(() => {
    if (userRole && userTienda) {
      setUserData({ role: userRole, tienda: userTienda });
    }
  }, [userRole, userTienda, setUserData]);

  // Cargar órdenes cuando cambia el filtro
  useEffect(() => {
    if (!dataLoading) {
      const filters = {};
      if (filtroStatus !== 'todos') filters.status = filtroStatus;
      loadOrders(filters);
    }
  }, [filtroStatus]);

  // Recargar usuarios cuando cambia la tienda seleccionada
  useEffect(() => {
    if (form.tienda) {
      loadUsers({ tiendaId: form.tienda });
    }
  }, [form.tienda, loadUsers]);

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessage();

    const formData = getFormData();
    const validation = validateOrderData(formData);

    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    try {
      const orderData = formatOrderData(formData, { tienda: userTienda });
      await createOrder(orderData);
      
      resetForm();
      setMostrarFormulario(false);
      loadOrders();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  // Manejar actualización de orden
  const handleUpdate = async (orderId) => {
    clearMessage();

    try {
      const updateData = getEditData();
      await updateOrder(orderId, updateData);
      
      cancelEditing();
      loadOrders();
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  // Manejar eliminación de orden
  const handleDelete = async (orderId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta orden?')) {
      try {
        await deleteOrder(orderId);
        loadOrders();
      } catch (error) {
        // Error ya manejado por el hook
      }
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                Gestión de Órdenes
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Administra las órdenes de compra y abastecimiento
              </p>
            </div>
            
            {/* Estadísticas */}
            <div className="flex gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl">📦</div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {orderStats.total}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Total
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl">⏳</div>
                <div className="text-lg font-bold" style={{ color: '#f59e0b' }}>
                  {orderStats.pendientes}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Pendientes
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg shadow-sm border" style={{ borderColor: '#e5e7eb' }}>
                <div className="text-xl">✅</div>
                <div className="text-lg font-bold" style={{ color: '#10b981' }}>
                  {orderStats.completadas}
                </div>
                <div className="text-xs" style={{ color: '#697487' }}>
                  Completadas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {(msg || error) && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            error ? 'bg-red-50 border-red-400 text-red-800' :
            msg.includes('❌') ? 'bg-red-50 border-red-400 text-red-800' :
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
                {mostrarFormulario ? '✖️ Cancelar' : '➕ Nueva Orden'}
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
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  disabled={cargando}
                >
                  <option value="todos">📋 Todas</option>
                  <option value="pendiente">⏳ Pendientes</option>
                  <option value="completada">✅ Completadas</option>
                  <option value="cancelada">❌ Canceladas</option>
                </select>
              </div>
              
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
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
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

        {/* Formulario de nueva orden */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#23334e' }}>
              Nueva Orden de Compra
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    value={form.proveedor}
                    onChange={(e) => updateField('proveedor', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Producto *
                  </label>
                  <input
                    type="text"
                    value={form.producto}
                    onChange={(e) => updateField('producto', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    value={form.cantidad}
                    onChange={(e) => updateField('cantidad', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                    min="1"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Unidad
                  </label>
                  <select
                    value={form.unidad}
                    onChange={(e) => updateField('unidad', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                  >
                    <option value="pza">Pieza</option>
                    <option value="kg">Kilogramo</option>
                    <option value="lt">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    value={form.fechaEmision}
                    onChange={(e) => updateField('fechaEmision', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                    required
                  />
                </div>

                {userRole === 'admin' && (
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                      Tienda
                    </label>
                    <select
                      value={form.tienda}
                      onChange={(e) => updateField('tienda', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                      style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
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
                  <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                    Asignar a
                  </label>
                  <select
                    value={form.assignedTo}
                    onChange={(e) => updateField('assignedTo', e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                    style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                  >
                    <option value="">Sin asignar</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.username} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={cargando}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                >
                  {cargando ? 'Creando...' : '✅ Crear Orden'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setMostrarFormulario(false);
                  }}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
                  style={{ backgroundColor: '#8c95a4', color: 'white' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de órdenes */}
        {cargando ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
            <p style={{ color: '#697487' }}>Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
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
                        <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(order.status)}`}>
                          {order.status === 'pendiente' ? '⏳ Pendiente' : 
                           order.status === 'completada' ? '✅ Completada' : 
                           order.status === 'cancelada' ? '❌ Cancelada' : order.status}
                        </span>
                      </div>
                      <p className="text-sm" style={{ color: '#697487' }}>
                        {formatDate(order.fechaEmision)}
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {canUpdateOrder(order) && (
                        <button
                          onClick={() => startEditing(order)}
                          className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200"
                          style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}
                        >
                          ✏️ Editar
                        </button>
                      )}
                      {userRole === 'admin' && (order.status === 'completada' || order.status === 'cancelada') && (
                        <button
                          onClick={() => handleDelete(order._id)}
                          className="px-4 py-2 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:bg-red-600"
                        >
                          🗑️ Eliminar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contenido de la orden */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Proveedor
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        🏢 {order.proveedor}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Producto
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        📦 {order.producto}
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Cantidad
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        📊 {order.cantidad} {order.unidad}
                      </div>
                    </div>
                    
                    {order.tienda?.nombre && (
                      <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          Tienda
                        </div>
                        <div className="font-bold" style={{ color: '#23334e' }}>
                          🏪 {order.tienda.nombre}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Información adicional */}
                  {(order.assignedTo || order.fechaEntrega || order.nota) && (
                    <div className="border-t pt-4" style={{ borderColor: '#e5e7eb' }}>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {order.assignedTo && (
                          <div>
                            <div className="text-sm font-medium mb-1" style={{ color: '#697487' }}>
                              Asignado a
                            </div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              👤 {order.assignedTo.username} ({order.assignedTo.role})
                            </div>
                          </div>
                        )}
                        
                        {order.fechaEntrega && (
                          <div>
                            <div className="text-sm font-medium mb-1" style={{ color: '#697487' }}>
                              Fecha de Entrega
                            </div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              📅 {formatDate(order.fechaEntrega)}
                            </div>
                          </div>
                        )}
                        
                        {order.nota && (
                          <div>
                            <div className="text-sm font-medium mb-1" style={{ color: '#697487' }}>
                              Nota
                            </div>
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              💬 {order.nota}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Formulario de edición */}
                  {editingOrder && editingOrder._id === order._id && (
                    <div className="border-t pt-6 mt-6" style={{ borderColor: '#e5e7eb' }}>
                      <h4 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                        Editar Orden
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                            Estado
                          </label>
                          <select
                            value={editForm.status}
                            onChange={(e) => updateEditField('status', e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          >
                            <option value="">Sin cambios</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="completada">Completada</option>
                            <option value="cancelada">Cancelada</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                            Fecha de Entrega
                          </label>
                          <input
                            type="date"
                            value={editForm.fechaEntrega}
                            onChange={(e) => updateEditField('fechaEntrega', e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                            Asignar a
                          </label>
                          <select
                            value={editForm.assignedTo}
                            onChange={(e) => updateEditField('assignedTo', e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                          >
                            <option value="">Sin asignar</option>
                            {users.map((user) => (
                              <option key={user._id} value={user._id}>
                                {user.username} ({user.role})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1" style={{ color: '#46546b' }}>
                            Nota
                          </label>
                          <textarea
                            value={editForm.nota}
                            onChange={(e) => updateEditField('nota', e.target.value)}
                            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2"
                            style={{ borderColor: '#e5e7eb', focusRingColor: '#23334e' }}
                            rows="3"
                            placeholder="Agregar nota opcional..."
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button
                          onClick={() => handleUpdate(order._id)}
                          disabled={cargando}
                          className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200"
                          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                        >
                          {cargando ? 'Actualizando...' : '✅ Actualizar'}
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-6 py-3 rounded-lg font-medium transition-all duration-200"
                          style={{ backgroundColor: '#8c95a4', color: 'white' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}