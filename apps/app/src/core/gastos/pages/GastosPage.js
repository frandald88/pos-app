import { useState } from 'react';
import { useGastosData } from '../hooks/useGastosData';
import { useGastosFilters } from '../hooks/useGastosFilters';
import { useGastosUtils } from '../hooks/useGastosUtils';
import { useGastosForm } from '../hooks/useGastosForm';
import GastoModal from '../components/GastoModal';

// SVG Icons
const Icons = {
  currencyDollar: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  clock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  cash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bank: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  creditCard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  store: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  location: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  user: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  office: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  chat: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  paperclip: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
    </svg>
  ),
  edit: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  xmark: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  search: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

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

    try {
      if (editingGasto) {
        // Modo edición - actualizar estado (solo validar estado)
        if (!newStatus) {
          setModalError("Debes seleccionar un estado");
          return;
        }
        await updateExpenseStatus(editingGasto._id, newStatus, adminNote);
        clearEditingForm();
        setIsModalOpen(false);
        setEditingGasto(null);
      } else {
        // Modo creación - validar todos los campos
        const validation = validateExpenseForm(getFormData());
        if (!validation.isValid) {
          setModalError(validation.errors.join(', '));
          return;
        }
        await createExpense(getFormData());
        clearForm();
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error al procesar gasto:', error);
      const errorMessage = error.response?.data?.message || error.message || "Error al procesar el gasto";
      setModalError(errorMessage);
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
                    <Icons.location /> Tienda asignada: <strong>{availableStores[0]?.nombre}</strong>
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
            msg.includes('[SUCCESS]')
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
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#23334e', color: 'white' }}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-yellow-100 text-yellow-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
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
                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 text-green-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
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
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#10b981', color: 'white' }}>
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
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

        {/* Filtros y reporte para admin y vendedor */}
        {currentUser?.role && (
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

                {/* Solo admin puede filtrar por tienda */}
                {currentUser?.role === "admin" && (
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
                        <option key={t._id} value={t._id}>{t.nombre}</option>
                      ))}
                    </select>
                  </div>
                )}

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
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
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
                    <option value="pendiente">Pendiente</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="denegado">Denegado</option>
                    <option value="en revision">En revisión</option>
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
                  <div className="mb-4 flex justify-center" style={{ color: '#23334e' }}>
                    <svg className="w-24 h-24" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
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
                              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#23334e', color: 'white' }}>
                                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-xl font-bold" style={{ color: '#23334e' }}>
                                  {gasto.concepto}
                                </h3>
                                <p className="text-sm" style={{ color: '#697487' }}>
                                  {formatDate(gasto.createdAt)} • ID: #{gasto._id.slice(-8)} • <Icons.user /> {gasto.createdBy?.username || 'Usuario desconocido'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              <div className="p-3 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                                <div className="text-sm font-medium" style={{ color: '#697487' }}>
                                  Proveedor
                                </div>
                                <div className="font-bold" style={{ color: '#23334e' }}>
                                  <Icons.office /> {gasto.proveedor}
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
                                  <Icons.store /> {gasto.tienda?.nombre || "Sin asignar"}
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
                                    <Icons.chat /> <strong>Nota del admin:</strong> {gasto.nota}
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
                                  <Icons.paperclip /> Ver Evidencia
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Acciones - Solo admin puede actualizar estado y eliminar */}
                          {currentUser?.role === "admin" && (
                            <div className="lg:w-80">
                              <div className="flex flex-col gap-3">
                                <button
                                  onClick={() => handleOpenEditModal(gasto)}
                                  className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                                  style={{ backgroundColor: '#46546b' }}
                                  disabled={loading}
                                >
                                  <Icons.edit /> Actualizar Estado
                                </button>

                                {(gasto.status === "aprobado" || gasto.status === "denegado") && (
                                  <button
                                    onClick={() => handleDelete(gasto._id)}
                                    className="px-6 py-3 rounded-lg font-medium text-white bg-red-500 transition-all duration-200 hover:shadow-md hover:bg-red-600"
                                    disabled={loading}
                                  >
                                    <Icons.trash /> Eliminar
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
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