import React from 'react';

const OrderModal = ({
  isOpen,
  onClose,
  onSubmit,
  orderData,
  onChange,
  isEditing,
  cargando,
  modalError,
  setModalError,
  tiendas,
  users,
  userRole,
  userTienda
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              {isEditing ? '✏️ Editar Orden' : '➕ Crear Nueva Orden'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Mensaje de error dentro del modal */}
          {modalError && (
            <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    {modalError}
                  </p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    type="button"
                    onClick={() => setModalError("")}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={onSubmit}>
            {isEditing ? (
              // Formulario de edición (solo status, fecha entrega, nota)
              <div className="space-y-6">
                {/* Estado */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Estado *
                  </label>
                  <select
                    name="status"
                    value={orderData.status}
                    onChange={onChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  >
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="completada">✅ Completada</option>
                    <option value="cancelada">❌ Cancelada</option>
                  </select>
                </div>

                {/* Fecha de entrega */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha de Entrega
                  </label>
                  <input
                    type="date"
                    name="fechaEntrega"
                    value={orderData.fechaEntrega}
                    onChange={onChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                {/* Nota */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nota
                  </label>
                  <textarea
                    name="nota"
                    value={orderData.nota}
                    onChange={onChange}
                    placeholder="Agrega una nota o comentario (opcional)"
                    rows="3"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>
              </div>
            ) : (
              // Formulario de creación
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Proveedor */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Proveedor *
                  </label>
                  <input
                    type="text"
                    name="proveedor"
                    value={orderData.proveedor}
                    onChange={onChange}
                    placeholder="Nombre del proveedor"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Producto */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Producto *
                  </label>
                  <input
                    type="text"
                    name="producto"
                    value={orderData.producto}
                    onChange={onChange}
                    placeholder="Descripción del producto"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Cantidad */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Cantidad *
                  </label>
                  <input
                    type="number"
                    name="cantidad"
                    value={orderData.cantidad}
                    onChange={onChange}
                    placeholder="0"
                    step="0.01"
                    min="0.01"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Unidad */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Unidad *
                  </label>
                  <select
                    name="unidad"
                    value={orderData.unidad}
                    onChange={onChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  >
                    <option value="pza">Pieza</option>
                    <option value="kg">Kilogramo</option>
                    <option value="g">Gramos</option>
                    <option value="lt">Litro</option>
                    <option value="caja">Caja</option>
                    <option value="paquete">Paquete</option>
                  </select>
                </div>

                {/* Fecha de emisión */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha de Emisión *
                  </label>
                  <input
                    type="date"
                    name="fechaEmision"
                    value={orderData.fechaEmision}
                    onChange={onChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  />
                </div>

                {/* Tienda */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tienda {userRole === 'admin' && '*'}
                  </label>
                  <select
                    name="tienda"
                    value={orderData.tienda}
                    onChange={onChange}
                    disabled={userRole !== 'admin'}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required={userRole === 'admin'}
                  >
                    <option value="">Selecciona una tienda</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda._id} value={tienda._id}>
                        {tienda.nombre}
                      </option>
                    ))}
                  </select>
                  {userRole !== 'admin' && (
                    <p className="text-xs mt-1" style={{ color: '#697487' }}>
                      Asignada automáticamente a tu tienda
                    </p>
                  )}
                </div>

                {/* Asignar a */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Asignar a *
                  </label>
                  <select
                    name="assignedTo"
                    value={orderData.assignedTo}
                    onChange={onChange}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  >
                    <option value="">Seleccionar usuario</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.username} - {user.role === 'vendedor' ? 'Vendedor' : 'Repartidor'}
                        {user.tienda && ` (${user.tienda.nombre})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Info de campos requeridos */}
            {!isEditing && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm" style={{ color: '#46546b' }}>
                  <span className="font-semibold">* Campos requeridos</span>
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                disabled={cargando}
                className="flex-1 py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: cargando ? '#8c95a4' : '#23334e'
                }}
              >
                {cargando ? 'Guardando...' : (isEditing ? 'Actualizar Orden' : 'Crear Orden')}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={cargando}
                className="px-6 py-3 rounded-lg font-semibold transition-all duration-200 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  color: '#46546b',
                  backgroundColor: '#f4f6fa'
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OrderModal;
