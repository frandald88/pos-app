import React from 'react';

// SVG Icons
const Icons = {
  edit: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  plus: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  office: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  search: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  lightbulb: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  lock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  )
};

const GastoModal = ({
  isOpen,
  onClose,
  onSubmit,
  isEditing,
  cargando,
  modalError,
  setModalError,
  // Props para modo creación
  concepto,
  setConcepto,
  proveedor,
  setProveedor,
  monto,
  setMonto,
  metodoPago,
  setMetodoPago,
  evidencia,
  setEvidencia,
  tiendaSeleccionada,
  setTiendaSeleccionada,
  usarProveedorManual,
  setUsarProveedorManual,
  busquedaProveedor,
  setBusquedaProveedor,
  proveedoresEncontrados,
  setProveedoresEncontrados,
  proveedores,
  availableStores,
  canSelectMultipleStores,
  buscarProveedores,
  selectProvider,
  // Props para modo edición
  newStatus,
  setNewStatus,
  adminNote,
  setAdminNote
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              {isEditing ? <><Icons.edit /> Actualizar Estado de Gasto</> : <><Icons.plus /> Registrar Nuevo Gasto</>}
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
              // Formulario de edición (solo status y nota)
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nuevo Estado *
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    required
                  >
                    <option value="">-- Seleccionar estado --</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="denegado">Denegado</option>
                    <option value="en revision">En revisión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Nota del Admin (Opcional)
                  </label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="Agrega una nota explicativa..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    rows="3"
                  />
                </div>
              </div>
            ) : (
              // Formulario de creación
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Concepto */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Concepto del Gasto *
                  </label>
                  <input
                    type="text"
                    value={concepto}
                    onChange={(e) => setConcepto(e.target.value)}
                    placeholder="Ej: Compra de material de oficina"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={cargando}
                    required
                  />
                </div>

                {/* Campo de proveedor con dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Proveedor *
                  </label>

                  {/* Selector de proveedor */}
                  <div className="mb-3">
                    <select
                      value={usarProveedorManual ? "nuevo_proveedor" : proveedor}
                      onChange={(e) => {
                        if (e.target.value === "nuevo_proveedor") {
                          setUsarProveedorManual(true);
                          setProveedor("");
                        } else {
                          setUsarProveedorManual(false);
                          setProveedor(e.target.value);
                          setBusquedaProveedor("");
                          setProveedoresEncontrados([]);
                        }
                      }}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                    >
                      <option value="">-- Selecciona o crea nuevo --</option>
                      {proveedores.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                      <option value="nuevo_proveedor">Buscar o crear proveedor</option>
                    </select>
                  </div>

                  {/* Búsqueda/creación de proveedor */}
                  {usarProveedorManual && (
                    <div>
                      <div className="relative">
                        <input
                          type="text"
                          value={busquedaProveedor}
                          onChange={(e) => {
                            setBusquedaProveedor(e.target.value);
                            setProveedor(e.target.value);
                            buscarProveedores(e.target.value);
                          }}
                          placeholder="Buscar o escribir nuevo proveedor..."
                          className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors bg-yellow-50"
                          style={{
                            borderColor: '#f59e0b',
                            focusRingColor: '#f59e0b'
                          }}
                          disabled={cargando}
                        />
                        <div className="absolute right-3 top-3.5 text-gray-500">
                          <Icons.search />
                        </div>
                      </div>

                      {/* Resultados de búsqueda */}
                      {proveedoresEncontrados.length > 0 && (
                        <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                          {proveedoresEncontrados.map((prov, index) => (
                            <div
                              key={index}
                              onClick={() => selectProvider(prov)}
                              className="p-3 hover:bg-blue-50 cursor-pointer transition-colors border-b last:border-b-0"
                            >
                              <div className="font-medium text-gray-800"><Icons.office /> {prov}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <p className="text-xs text-yellow-700 mt-1">
                        <Icons.lightbulb /> Este proveedor se guardará automáticamente para uso futuro
                      </p>
                    </div>
                  )}

                  {/* Confirmación de proveedor seleccionado */}
                  {proveedor && !usarProveedorManual && proveedores.includes(proveedor) && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800">
                        <Icons.check />
                        <span className="text-sm font-medium">Proveedor: {proveedor}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Monto */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    placeholder="0.00"
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={cargando}
                    required
                  />
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Método de Pago *
                  </label>
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={cargando}
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                {/* Tienda */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tienda *
                  </label>
                  {canSelectMultipleStores ? (
                    // Admin puede seleccionar cualquier tienda
                    <select
                      value={tiendaSeleccionada}
                      onChange={(e) => setTiendaSeleccionada(e.target.value)}
                      className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                      style={{
                        borderColor: '#e5e7eb',
                        focusRingColor: '#23334e'
                      }}
                      disabled={cargando}
                      required
                    >
                      <option value="">-- Selecciona tienda --</option>
                      {availableStores.map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.nombre}
                        </option>
                      ))}
                    </select>
                  ) : (
                    // Vendedor/repartidor: tienda preseleccionada y bloqueada
                    <div className="relative">
                      <input
                        type="text"
                        value={availableStores[0]?.nombre || "Sin tienda asignada"}
                        className="w-full p-3 border rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                        style={{
                          borderColor: '#e5e7eb'
                        }}
                        disabled={true}
                        readOnly
                      />
                      <div className="absolute right-3 top-3.5 text-gray-500">
                        <Icons.lock />
                      </div>
                    </div>
                  )}

                  {!canSelectMultipleStores && (
                    <p className="text-xs text-blue-700 mt-1">
                      <Icons.lock /> Solo puedes crear gastos para tu tienda asignada
                    </p>
                  )}
                </div>

                {/* Evidencia */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Evidencia (Opcional)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setEvidencia(e.target.files[0])}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={cargando}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <p className="text-xs mt-1" style={{ color: '#697487' }}>
                    Formatos: JPG, PNG, PDF, DOC, XLS
                  </p>
                </div>
              </div>
            )}

            {/* Info de campos requeridos */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm" style={{ color: '#46546b' }}>
                <span className="font-semibold">* Campos requeridos</span>
              </p>
            </div>

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
                {cargando ? 'Guardando...' : (isEditing ? 'Actualizar Estado' : 'Guardar Gasto')}
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

export default GastoModal;
