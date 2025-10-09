import { useState } from 'react';
import { useGastosData } from '../hooks/useGastosData';
import { useGastosFilters } from '../hooks/useGastosFilters';
import { useGastosUtils } from '../hooks/useGastosUtils';
import { useGastosForm } from '../hooks/useGastosForm';
import GastoModal from '../components/GastoModal';

export default function ExpensesPage() {
  // Estado del modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGasto, setEditingGasto] = useState(null);
  const [modalError, setModalError] = useState("");
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
  const handleGuardarGasto = async (e) => {
    e.preventDefault();
    setModalError("");

    const validation = validateExpenseForm(getFormData());
    if (!validation.isValid) {
      setModalError(validation.errors.join(', '));
      return;
    }

    try {
      if (editingGasto) {
        // Modo edición - actualizar estado
        await updateExpenseStatus(editingGasto._id, newStatus, adminNote);
        clearEditingForm();
        setIsModalOpen(false);
        setEditingGasto(null);
      } else {
        // Modo creación
        await createExpense(getFormData());
        clearForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      setModalError(error.message || "Error al procesar el gasto");
    }
  };

  // Abrir modal para crear gasto
  const handleOpenCreateModal = () => {
    clearForm();
    setEditingGasto(null);
    setModalError("");
    setIsModalOpen(true);
  };

  // Abrir modal para editar estado de gasto
  const handleOpenEditModal = (gasto) => {
    setEditingGasto(gasto);
    setNewStatus(gasto.status);
    setAdminNote(gasto.nota || "");
    setModalError("");
    setIsModalOpen(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGasto(null);
    setModalError("");
    if (editingGasto) {
      clearEditingForm();
    } else {
      clearForm();
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
              onClick={handleOpenCreateModal}
              className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={loading}
            >
              Nuevo Gasto
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
                            <div className="flex flex-col gap-3">
                              <button
                                onClick={() => handleOpenEditModal(gasto)}
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

        {/* Modal de Gasto */}
        <GastoModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleGuardarGasto}
          isEditing={!!editingGasto}
          cargando={loading}
          modalError={modalError}
          setModalError={setModalError}
          // Props para modo creación
          concepto={concepto}
          setConcepto={setConcepto}
          proveedor={proveedor}
          setProveedor={setProveedor}
          monto={monto}
          setMonto={setMonto}
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
          evidencia={evidencia}
          setEvidencia={setEvidencia}
          tiendaSeleccionada={tiendaSeleccionada}
          setTiendaSeleccionada={setTiendaSeleccionada}
          usarProveedorManual={usarProveedorManual}
          setUsarProveedorManual={setUsarProveedorManual}
          busquedaProveedor={busquedaProveedor}
          setBusquedaProveedor={setBusquedaProveedor}
          proveedoresEncontrados={proveedoresEncontrados}
          setProveedoresEncontrados={setProveedoresEncontrados}
          proveedores={proveedores}
          availableStores={availableStores}
          canSelectMultipleStores={canSelectMultipleStores}
          buscarProveedores={buscarProveedores}
          selectProvider={selectProvider}
          // Props para modo edición
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          adminNote={adminNote}
          setAdminNote={setAdminNote}
        />
      </div>
    </div>
  );
}