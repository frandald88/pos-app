import { useGastosData } from '../hooks/useGastosData';
import { useGastosFilters } from '../hooks/useGastosFilters';
import { useGastosUtils } from '../hooks/useGastosUtils';
import { useGastosForm } from '../hooks/useGastosForm';

export default function ExpensesPage() {
  // Hooks para manejo de datos
  const {
    loading,
    msg,
    editingMsg,
    currentUser,
    userLoaded,
    reportData,
    availableStores,
    defaultStore,
    canSelectMultipleStores,
    proveedores,
    loadExpenses,
    createExpense,
    updateExpenseStatus,
    deleteExpense,
    searchProviders,
    viewEvidence
  } = useGastosData();

  // Hooks para manejo de filtros
  const {
    filtroProveedor,
    filtroTienda,
    filtroMetodoPago,
    filtroEstado,
    filtroInicio,
    filtroFin,
    setFiltroProveedor,
    setFiltroTienda,
    setFiltroMetodoPago,
    setFiltroEstado,
    setFiltroInicio,
    setFiltroFin,
    getFilters
  } = useGastosFilters();

  // Hooks para utilidades
  const {
    formatCurrency,
    formatDate,
    getStatusConfig,
    getPaymentMethodIcon,
    getExpenseStats,
    validateExpenseForm
  } = useGastosUtils();

  // Hooks para manejo de formularios
  const {
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
    editingGastoId,
    newStatus,
    adminNote,
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
    getFormData,
    clearForm,
    handleCancelar,
    clearEditingForm,
    selectProvider
  } = useGastosForm(defaultStore, canSelectMultipleStores);

  // Buscar proveedores
  const buscarProveedores = async (termino) => {
    if (termino.length < 2) {
      setProveedoresEncontrados([]);
      return;
    }
    
    try {
      const proveedoresRes = await searchProviders(termino);
      setProveedoresEncontrados(proveedoresRes);
    } catch (error) {
      console.error("Error al buscar proveedores:", error);
    }
  };

  // Manejar guardado de gasto
  const handleGuardarGasto = async () => {
    const validation = validateExpenseForm(getFormData());
    if (!validation.isValid) {
      return;
    }

    try {
      await createExpense(getFormData());
      clearForm();
      setMostrarFormulario(false);
    } catch (error) {
      // Error manejado en el hook
    }
  };

  // Guardar estado del gasto
  const saveStatus = async (gastoId) => {
    if (!newStatus) {
      return;
    }

    try {
      await updateExpenseStatus(gastoId, newStatus, adminNote);
      clearEditingForm();
    } catch (error) {
      // Error manejado en el hook
    }
  };

  // Manejar eliminación
  const handleDelete = async (gastoId) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto?")) {
      return;
    }

    try {
      await deleteExpense(gastoId);
    } catch (error) {
      // Error manejado en el hook
    }
  };

  // Datos seguros y estadísticas
  const safeReportData = Array.isArray(reportData) ? reportData : [];
  const stats = getExpenseStats(safeReportData);

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: '#23334e' }}
              >
                Gestión de Gastos
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Registra y controla los gastos operativos de tu negocio
                {!canSelectMultipleStores && availableStores && availableStores.length > 0 && (
                  <span className="block text-sm mt-1">
                    📍 Tienda asignada: <strong>{availableStores[0]?.nombre}</strong>
                  </span>
                )}
              </p>
            </div>
            
            <button
              onClick={() => {
                setMostrarFormulario(!mostrarFormulario);
                if (mostrarFormulario) {
                  handleCancelar();
                }
              }}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={loading}
            >
              {mostrarFormulario ? "Cancelar" : "Nuevo Gasto"}
            </button>
          </div>
        </div>

        {/* Mensaje de estado */}
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
          </div>
        )}

        {/* Estadísticas */}
        {currentUser?.role === "admin" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e' }}>
                  💰
                </div>
                <div>
                  <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                    {stats.total}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Total Gastos
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-yellow-100">
                  ⏳
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {stats.pendientes}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Pendientes
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-100">
                  ✅
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.aprobados}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Aprobados
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#10b981', color: 'white' }}>
                  💵
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                    {formatCurrency(stats.montoAprobado)}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Monto Aprobado
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario para nuevo gasto */}
        {mostrarFormulario && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border" style={{ borderColor: '#e5e7eb' }}>
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Registrar Nuevo Gasto
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  disabled={loading}
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
                    disabled={loading}
                  >
                    <option value="">-- Selecciona o crea nuevo --</option>
                    {proveedores.map((prov) => (
                      <option key={prov} value={prov}>
                        🏢 {prov}
                      </option>
                    ))}
                    <option value="nuevo_proveedor">➕ Buscar o crear proveedor</option>
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
                        disabled={loading}
                      />
                      <div className="absolute right-3 top-3.5">
                        🔍
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
                            <div className="font-medium text-gray-800">🏢 {prov}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-yellow-700 mt-1">
                      💡 Este proveedor se guardará automáticamente para uso futuro
                    </p>
                  </div>
                )}

                {/* Confirmación de proveedor seleccionado */}
                {proveedor && !usarProveedorManual && proveedores.includes(proveedor) && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <span>✅</span>
                      <span className="text-sm font-medium">Proveedor: {proveedor}</span>
                    </div>
                  </div>
                )}
              </div>

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
                  disabled={loading}
                  required
                />
              </div>

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
                  disabled={loading}
                >
                  <option value="efectivo">💵 Efectivo</option>
                  <option value="transferencia">🏦 Transferencia</option>
                  <option value="tarjeta">💳 Tarjeta</option>
                </select>
              </div>

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
                    disabled={loading}
                    required
                  >
                    <option value="">-- Selecciona tienda --</option>
                    {availableStores.map((t) => (
                      <option key={t._id} value={t._id}>
                        🏪 {t.nombre}
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
                      🔒
                    </div>
                  </div>
                )}
                
                {!canSelectMultipleStores && (
                  <p className="text-xs text-blue-700 mt-1">
                    🔒 Solo puedes crear gastos para tu tienda asignada
                  </p>
                )}
              </div>

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
                  disabled={loading}
                  accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx"
                />
                <p className="text-xs mt-1" style={{ color: '#697487' }}>
                  Formatos: JPG, PNG, PDF, DOC, XLS
                </p>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={handleGuardarGasto}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar Gasto"}
              </button>
              <button
                onClick={handleCancelar}
                className="px-8 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                style={{ 
                  backgroundColor: '#8c95a4',
                  color: 'white'
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filtros y reporte para admin */}
        {currentUser?.role === "admin" && (
          <>
            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                Filtros de Reporte
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Proveedor
                  </label>
                  <input
                    type="text"
                    value={filtroProveedor}
                    onChange={(e) => setFiltroProveedor(e.target.value)}
                    placeholder="Buscar por proveedor..."
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tienda
                  </label>
                  <select
                    value={filtroTienda}
                    onChange={(e) => setFiltroTienda(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todas las tiendas</option>
                    {availableStores.map((t) => (
                      <option key={t._id} value={t._id}>🏪 {t.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Método de Pago
                  </label>
                  <select
                    value={filtroMetodoPago}
                    onChange={(e) => setFiltroMetodoPago(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Estado
                  </label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todos los estados</option>
                    <option value="pendiente">⏳ Pendiente</option>
                    <option value="aprobado">✅ Aprobado</option>
                    <option value="denegado">❌ Denegado</option>
                    <option value="en revision">🔍 En revisión</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha Inicio
                  </label>
                  <input
                    type="date"
                    value={filtroInicio}
                    onChange={(e) => setFiltroInicio(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha Fin
                  </label>
                  <input
                    type="date"
                    value={filtroFin}
                    onChange={(e) => setFiltroFin(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  />
                </div>
              </div>

              <button
                onClick={() => loadExpenses(getFilters())}
                className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                style={{ backgroundColor: '#23334e' }}
                disabled={loading}
              >
                {loading ? "Cargando..." : "Filtrar Reporte"}
              </button>
            </div>

            {/* Lista de gastos */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                <h3 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  Reporte de Gastos
                </h3>
                <p className="text-sm mt-1" style={{ color: '#697487' }}>
                  {loading ? "Cargando gastos..." : `Mostrando ${safeReportData.length} gasto(s)`}
                </p>
              </div>

              {loading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
                  <p style={{ color: '#697487' }}>Cargando gastos...</p>
                </div>
              ) : safeReportData.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-6xl mb-4">💰</div>
                  <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                    No hay gastos
                  </h3>
                  <p style={{ color: '#697487' }}>
                    No se encontraron gastos para los filtros aplicados
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {safeReportData.map((gasto, index) => {
                    const statusConfig = getStatusConfig(gasto.status);
                    
                    return (
                      <div 
                        key={gasto._id} 
                        className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                        style={{ borderColor: '#e5e7eb' }}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                          {/* Información del gasto */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e' }}>
                                💰
                              </div>
                              <div>
                                <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                                  {gasto.concepto}
                                </h3>
                                <p className="text-sm" style={{ color: '#697487' }}>
                                  {formatDate(gasto.createdAt)} • ID: #{gasto._id.slice(-8)} • 👤 {gasto.createdBy?.username || 'Usuario desconocido'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                                  Proveedor
                                </div>
                                <div className="font-bold" style={{ color: '#23334e' }}>
                                  🏢 {gasto.proveedor}
                                </div>
                              </div>
                              
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                                  Monto
                                </div>
                                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                                  {formatCurrency(gasto.monto)}
                                </div>
                              </div>
                              
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                                  Método de Pago
                                </div>
                                <div className="font-bold" style={{ color: '#23334e' }}>
                                  {getPaymentMethodIcon(gasto.metodoPago)} {gasto.metodoPago}
                                </div>
                              </div>
                              
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                                  Tienda
                                </div>
                                <div className="font-bold" style={{ color: '#23334e' }}>
                                  🏪 {gasto.tienda?.nombre || "Sin asignar"}
                                </div>
                              </div>
                            </div>

                            {/* Estado y nota */}
                            <div className="flex flex-wrap items-center gap-4 mb-4">
                              <span
                                className={`px-4 py-2 text-sm rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}
                              >
                                {statusConfig.icon} {gasto.status}
                              </span>
                              
                              {gasto.nota && (
                                <div className="flex-1 p-3 rounded-lg border-l-4 border-blue-400 bg-blue-50">
                                  <div className="text-sm text-blue-800">
                                    💬 <strong>Nota del admin:</strong> {gasto.nota}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Evidencia */}
                            {gasto.evidencia && (
                              <div className="mb-4">
                                <button
                                  onClick={() => viewEvidence(gasto.evidencia)}
                                  className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                                  style={{ backgroundColor: '#46546b' }}
                                  disabled={loading}
                                >
                                  📎 Ver Evidencia
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Acciones */}
                          <div className="lg:w-80">
                            {editingGastoId === gasto._id ? (
                              <div className="space-y-4 p-4 rounded-lg border" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
                                {/* Mensaje local del formulario de edición */}
                                  {editingMsg && (
                                    <div className={`p-3 rounded-lg border-l-4 ${
                                      editingMsg.includes('✅') 
                                        ? 'bg-green-50 border-green-400 text-green-800' 
                                        : 'bg-red-50 border-red-400 text-red-800'
                                    }`}>
                                      <p className="text-sm font-medium">{editingMsg}</p>
                                    </div>
                                  )}
                                <div>
                                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                                    Nuevo Estado
                                  </label>
                                  <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value)}
                                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                                    style={{ 
                                      borderColor: '#e5e7eb',
                                      focusRingColor: '#23334e'
                                    }}
                                  >
                                    <option value="">-- Seleccionar estado --</option>
                                    <option value="pendiente">⏳ Pendiente</option>
                                    <option value="aprobado">✅ Aprobado</option>
                                    <option value="denegado">❌ Denegado</option>
                                    <option value="en revision">🔍 En revisión</option>
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
                                
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => saveStatus(gasto._id)}
                                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                                    style={{ backgroundColor: '#23334e' }}
                                    disabled={loading}
                                  >
                                    {loading ? "Guardando..." : "Guardar"}
                                  </button>
                                  <button
                                    onClick={clearEditingForm}
                                    className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                                    style={{ 
                                      backgroundColor: '#8c95a4',
                                      color: 'white'
                                    }}
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={() => setEditingGastoId(gasto._id)}
                                  className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                                  style={{ backgroundColor: '#46546b' }}
                                  disabled={loading}
                                >
                                  ✏️ Actualizar Estado
                                </button>

                                {(gasto.status === "aprobado" || gasto.status === "denegado") && (
                                  <button
                                    onClick={() => handleDelete(gasto._id)}
                                    className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-md hover:bg-red-600"
                                    disabled={loading}
                                  >
                                    🗑️ Eliminar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Indicador de carga global */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-400">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#23334e' }}></div>
              <span style={{ color: '#23334e' }}>Procesando...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}