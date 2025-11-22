import { useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import {
  useReportesData,
  useReportesFilters,
  useReportesActions,
  useReportesCalculations,
  useReportesMetadata
} from '../hooks';

export default function ReportsPage() {
  const token = localStorage.getItem("token");

  // Hooks personalizados
  const {
    ventas,
    loading,
    msg,
    selectedSales,
    generateVentasReport,
    generateDevolucionesReport,
    deleteMultipleSales,
    handleCheckboxChange,
    selectAllSales,
    deselectAllSales,
    setMsg,
    setVentas
  } = useReportesData();

  const {
    tipoReporte,
    tipoVenta,
    tipo,
    periodo,
    fechaInicio,
    fechaFin,
    tiendaFiltro,
    categoriaFiltro,
    productoFiltro,
    showMixedDetails,
    setTipoReporte,
    setTipoVenta,
    setTipo,
    setPeriodo,
    setFechaInicio,
    setFechaFin,
    setTiendaFiltro,
    setCategoriaFiltro,
    setProductoFiltro,
    setShowMixedDetails,
    getReportParams,
    filterByProduct
  } = useReportesFilters();

  const {
    showGraph,
    visibleRows,
    copiedTooltip,
    deleteTooltip,
    exportToCSV,
    copyToClipboard,
    showDeleteTooltip,
    loadMoreRows,
    toggleGraph,
    setVisibleRows,
    resetView
  } = useReportesActions();

  const {
    totalGeneral,
    ivaTotal,
    totalRegistros,
    promedioVenta,
    generarDatosGrafica
  } = useReportesCalculations(ventas, tipoReporte);

  const { tiendas, categorias } = useReportesMetadata();

  // Limpiar datos cuando cambia el tipo de reporte
  useEffect(() => {
    setVentas([]);
    setMsg('');
    resetView();
  }, [tipoReporte, setVentas, setMsg, resetView]);

  // Generar reporte
  const handleGenerar = async () => {
    resetView();
    setMsg("");

    const params = getReportParams();

    try {
      if (tipoReporte === "ventas") {
        await generateVentasReport(params);
      } else {
        await generateDevolucionesReport(params);
      }
    } catch (error) {
      console.error('Error generando reporte:', error);
    }
  };

  // Exportar CSV
  const handleExportCSV = () => {
    const filename = tipoReporte === "ventas" ? "reporte_ventas.csv" : "reporte_devoluciones.csv";
    const dataToExport = tipoReporte === "ventas" ? ventasFiltradas : devolucionesFiltradas;
    const result = exportToCSV(dataToExport, filename);
    setMsg(result.message);
    if (!result.success) {
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // Eliminar ventas seleccionadas
  const handleDeleteSelectedSales = async (event) => {
    if (selectedSales.length === 0) {
      setMsg("Selecciona al menos una venta para eliminar");
      return;
    }

    if (!window.confirm(`¿Eliminar ${selectedSales.length} ventas seleccionadas? Esta acción es irreversible.`)) return;

    try {
      await deleteMultipleSales(selectedSales);
      showDeleteTooltip(`${selectedSales.length} venta(s) eliminada(s)`, event);
      await handleGenerar();
    } catch (error) {
      setMsg("Error al eliminar ventas seleccionadas");
      setTimeout(() => setMsg(""), 3000);
    }
  };

  // Ventas filtradas por producto
  const safeArray = (arr) => Array.isArray(arr) ? arr : [];
  const ventasFiltradas = tipoReporte === "ventas" ? filterByProduct(ventas) : ventas;
  const devolucionesFiltradas = tipoReporte === "devoluciones" ? ventas : [];

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#23334e' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#23334e' }}>Acceso Requerido</h2>
            <p className="mb-6" style={{ color: '#697487' }}>
              Tu sesión ha expirado. Por favor, inicia sesión nuevamente para acceder a los reportes.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: '#23334e' }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
            Reportes de Ventas
          </h1>
          <p style={{ color: '#697487' }}>
            Genera y analiza reportes detallados de ventas y devoluciones
          </p>
        </div>

        {/* Mensajes */}
        {msg && (
          <div className={`p-4 rounded-lg mb-6 ${
            msg.includes('exitosamente') || msg.includes('generado')
              ? 'bg-green-50 border border-green-200'
              : msg.includes('Error') || msg.includes('error')
              ? 'bg-red-50 border border-red-200'
              : 'bg-blue-50 border border-blue-200'
          }`}>
            <p className={
              msg.includes('exitosamente') || msg.includes('generado')
                ? 'text-green-800'
                : msg.includes('Error') || msg.includes('error')
                ? 'text-red-800'
                : 'text-blue-800'
            }>
              {msg}
            </p>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
            Configuración de Reporte
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Tipo de Reporte */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Tipo de Reporte
              </label>
              <select
                value={tipoReporte}
                onChange={(e) => setTipoReporte(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
              >
                <option value="ventas">Reportes de Ventas</option>
                <option value="devoluciones">Reportes de Devoluciones</option>
              </select>
            </div>

            {/* Periodo */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Periodo
              </label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
              >
                <option value="dia">Hoy</option>
                <option value="mes">Este mes</option>
                <option value="año">Este año</option>
                <option value="rango">Rango personalizado</option>
              </select>
            </div>

            {/* Tienda */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Tienda
              </label>
              <select
                value={tiendaFiltro}
                onChange={(e) => setTiendaFiltro(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map((t) => (
                  <option key={t._id} value={t._id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {tipoReporte === "ventas" && (
              <>
                {/* Tipo de Venta */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tipo de Venta
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#23334e' }}
                  >
                    <option value="">Todos los tipos</option>
                    <option value="mostrador">Mostrador</option>
                    <option value="recoger">A Recoger</option>
                    <option value="domicilio">A Domicilio</option>
                  </select>
                </div>

                {/* Método de Pago */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Método de Pago
                  </label>
                  <select
                    value={tipoVenta}
                    onChange={(e) => setTipoVenta(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#23334e' }}
                  >
                    <option value="">Todos los métodos</option>
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="tarjeta">Tarjeta</option>
                  </select>
                </div>

                {/* Filtro de Categoría */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Categoría de Producto
                  </label>
                  <select
                    value={categoriaFiltro}
                    onChange={(e) => setCategoriaFiltro(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#23334e' }}
                  >
                    <option value="">Todas las categorías</option>
                    {categorias.map((cat) => (
                      <option key={cat} value={cat}>
                        📂 {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Opciones Avanzadas */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Opciones Avanzadas
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMixedDetails}
                        onChange={(e) => setShowMixedDetails(e.target.checked)}
                        className="rounded"
                        style={{ accentColor: '#23334e' }}
                      />
                      <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                        Mostrar detalles de pagos mixtos
                      </span>
                    </label>
                  </div>
                </div>

                {/* Buscar Producto */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Buscar Producto o SKU
                  </label>
                  <input
                    type="text"
                    value={productoFiltro}
                    onChange={(e) => setProductoFiltro(e.target.value)}
                    placeholder="Ej: Carnivora o 5544"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#23334e' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Rango de fechas personalizado */}
          {periodo === "rango" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Fecha y Hora de Inicio
                </label>
                <input
                  type="datetime-local"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: '#23334e' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Fecha y Hora de Fin
                </label>
                <input
                  type="datetime-local"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ focusRingColor: '#23334e' }}
                />
              </div>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerar}
              disabled={loading}
              className="px-6 py-3 text-white font-medium rounded-md transition-colors duration-200 hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#23334e' }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Generando...
                </div>
              ) : (
                'Generar Reporte'
              )}
            </button>

            {safeArray(ventasFiltradas).length > 0 && tipoReporte === "ventas" && (
              <>
                <button
                  onClick={toggleGraph}
                  className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                  style={{ color: '#46546b', borderColor: '#46546b' }}
                >
                  {showGraph ? 'Ocultar Gráfico' : 'Mostrar Gráfico'}
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                  style={{ color: '#697487', borderColor: '#697487' }}
                >
                  Descargar CSV
                </button>
              </>
            )}
          </div>
        </div>

        {/* Botones adicionales */}
        {tipoReporte === "ventas" && (
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => {
                const mixedOnly = ventas.filter(v =>
                  v.paymentType === 'mixed' ||
                  (v.method && v.method.includes('+')) ||
                  v.paymentDetails === 'Pago Mixto'
                );

                if (mixedOnly.length > 0) {
                  setVentas(mixedOnly);
                  setMsg(`Mostrando solo pagos mixtos - ${mixedOnly.length} registros encontrados ✅`);
                } else {
                  setMsg("No se encontraron ventas con pagos mixtos en el período seleccionado ⚠️");
                }
              }}
              className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
              style={{ color: '#8c95a4', borderColor: '#8c95a4' }}
            >
              🔀 Filtrar Solo Pagos Mixtos
            </button>

            <button
              onClick={handleGenerar}
              className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
              style={{ color: '#697487', borderColor: '#697487' }}
            >
              📊 Mostrar Todas las Ventas
            </button>
          </div>
        )}

        {/* Gráfica */}
        {showGraph && tipoReporte === "ventas" && ventasFiltradas.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Análisis Visual de Ventas
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generarDatosGrafica(periodo)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e4e7" />
                  <XAxis dataKey="label" tick={{ fill: '#697487' }} />
                  <YAxis tick={{ fill: '#697487' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e0e4e7',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar dataKey="total" fill="#23334e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tabla de Ventas */}
        {!loading && tipoReporte === "ventas" && safeArray(ventasFiltradas).length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                  Reporte de Ventas
                </h2>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Mostrando {Math.min(visibleRows, ventasFiltradas.length)} de {ventasFiltradas.length} registros
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#f4f6fa' }}>
                  <tr>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '50px' }}>
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            selectAllSales(ventasFiltradas.slice(0, visibleRows));
                          } else {
                            deselectAllSales();
                          }
                        }}
                        style={{ accentColor: '#23334e' }}
                      />
                    </th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>ID Venta</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '130px' }}>Fecha/Hora</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Usuario</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Tipo Venta</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '150px' }}>Método Pago</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '150px' }}>Producto</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '50px' }}>SKU</th>
                    <th className="text-center p-3 font-medium" style={{ color: '#23334e', minWidth: '70px' }}>Cant.</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '90px' }}>P. Unit.</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '90px' }}>Subtotal</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '80px' }}>IVA</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Total Prod.</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Total Venta</th>
                    <th className="text-right p-3 font-medium" style={{ color: '#23334e', minWidth: '90px' }}>Descuento</th>
                    <th className="text-center p-3 font-medium" style={{ color: '#23334e', minWidth: '70px' }}>% Desc.</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Repartidor</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Tienda</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '120px' }}>Cliente</th>
                    <th className="text-center p-3 font-medium" style={{ color: '#23334e', minWidth: '120px' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventasFiltradas
                    .slice(0, visibleRows)
                    .map((venta, index) => (
                      <tr key={`${venta._id}-${index}`} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors duration-150`}>

                        {/* Checkbox */}
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedSales.includes(venta._id)}
                            onChange={() => handleCheckboxChange(venta._id)}
                            style={{ accentColor: '#23334e' }}
                          />
                        </td>

                        {/* ID de Venta */}
                        <td className="p-3">
                          <div
                            className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors duration-200"
                            onClick={(e) => copyToClipboard(venta.ventaId || venta._id, e)}
                            title="Clic para copiar ID completo"
                          >
                            <div className="font-mono text-xs font-medium" style={{ color: '#23334e' }}>
                              {(venta.ventaId || venta._id).slice(-8)}
                            </div>
                            <div className="text-xs" style={{ color: '#8c95a4' }}>
                              📋 Copiar
                            </div>
                          </div>
                        </td>

                        {/* Fecha y Hora */}
                        <td className="p-3">
                          <div className="text-xs">
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {new Date(venta.date).toLocaleDateString('es-MX')}
                            </div>
                            <div style={{ color: '#697487' }}>
                              {new Date(venta.date).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Usuario */}
                        <td className="p-3">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            {venta.user?.username || venta.user || '-'}
                          </span>
                        </td>

                        {/* Tipo de Venta */}
                        <td className="p-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100" style={{ color: '#23334e' }}>
                            {venta.type}
                          </span>
                        </td>

                        {/* Método de Pago */}
                        <td className="p-3">
                          <div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              venta.paymentType === 'mixed_breakdown'
                                ? 'bg-purple-100'
                                : 'bg-green-100'
                            }`} style={{ color: '#23334e' }}>
                              {venta.paymentType === 'mixed_breakdown'
                                ? `${venta.method} (Mixto)`
                                : venta.method}
                            </span>

                            {venta.paymentDetails && (
                              <div className="text-xs mt-1" style={{ color: '#8c95a4' }}>
                                {venta.paymentDetails}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Producto */}
                        <td className="p-3 pr-2">
                          <div className="text-xs">
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {venta.producto}
                            </div>
                            {venta.nota && (
                              <div className="text-xs mt-1 italic" style={{ color: '#8c95a4' }}>
                                📝 {venta.nota}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="p-3 pl-2">
                          <span className="font-mono text-xs" style={{ color: '#697487' }}>
                            {venta.sku || '-'}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td className="p-3 text-center">
                          <span className="font-medium" style={{ color: '#23334e' }}>
                            {venta.cantidad}
                          </span>
                        </td>

                        {/* Precio Unitario */}
                        <td className="p-3 text-right">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            ${(venta.precioUnitario ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Subtotal */}
                        <td className="p-3 text-right">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            ${(venta.subtotal ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* IVA */}
                        <td className="p-3 text-right">
                          <span className="text-xs" style={{ color: '#697487' }}>
                            ${(venta.ivaProducto ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Total Producto */}
                        <td className="p-3 text-right">
                          <span className="font-semibold text-xs" style={{ color: '#23334e' }}>
                            ${(venta.totalProducto ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Total Venta */}
                        <td className="p-3 text-right">
                          <span className="font-bold text-sm" style={{ color: '#46546b' }}>
                            ${Number(venta.totalVenta ?? 0).toFixed(2)}
                          </span>
                        </td>

                        {/* Descuento */}
                        <td className="p-3 text-right">
                          <span className="text-xs" style={{ color: '#697487' }}>
                            {Number(venta.descuento ?? 0).toFixed(2) !== "0.00"
                              ? `$${Number(venta.descuento ?? 0).toFixed(2)}`
                              : "-"}
                          </span>
                        </td>

                        {/* Porcentaje Descuento */}
                        <td className="p-3 text-center">
                          <span className="text-xs" style={{ color: '#697487' }}>
                            {Number(venta.porcentajeDescuento ?? 0).toFixed(2) !== "0.00"
                              ? `${Number(venta.porcentajeDescuento ?? 0).toFixed(2)}%`
                              : "-"}
                          </span>
                        </td>

                        {/* Repartidor */}
                        <td className="p-3">
                          <span className="text-xs" style={{ color: '#697487' }}>
                            {venta.repartidor?.nombre || venta.repartidor || "-"}
                          </span>
                        </td>

                        {/* Tienda */}
                        <td className="p-3">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            {venta.tienda?.nombre || venta.tienda || "-"}
                          </span>
                        </td>

                        {/* Cliente */}
                        <td className="p-3">
                          <span className="text-xs" style={{ color: '#697487' }}>
                            {venta.cliente?.nombre || venta.cliente || "-"}
                          </span>
                        </td>

                        {/* Estado de Venta y Devolución */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col gap-1">
                            {(() => {
                              if (venta.status === 'entregado_y_cobrado') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    📦 Entregado
                                  </span>
                                );
                              } else if (venta.status === 'parcialmente_devuelta') {
                                const productoDevuelto = (() => {
                                  const totalReturned = venta.totalReturned || 0;
                                  const precioProducto = venta.totalProducto || 0;
                                  const totalVenta = venta.totalVenta || 0;

                                  if (Math.abs(totalReturned * 2 - totalVenta) < 1) {
                                    const productosDeEstaVenta = ventasFiltradas.filter(v => v.ventaId === venta.ventaId);
                                    const posicionEnVenta = productosDeEstaVenta.findIndex(v => v.producto === venta.producto);
                                    return posicionEnVenta === 0;
                                  }

                                  const diferencia = Math.abs(totalReturned - precioProducto);
                                  if (diferencia <= 0.5) {
                                    return true;
                                  }

                                  const montoRestante = totalVenta - totalReturned;
                                  const diferenciaRestante = Math.abs(montoRestante - precioProducto);
                                  if (diferenciaRestante <= 0.5) {
                                    return false;
                                  }

                                  return "indeterminado";
                                })();

                                if (productoDevuelto === true) {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      ↩️ Producto Devuelto
                                    </span>
                                  );
                                } else if (productoDevuelto === false) {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      📦 Entregado
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      ↩️ Venta Parcial
                                    </span>
                                  );
                                }
                              } else if (venta.status === 'cancelada') {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    ❌ Cancelado
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    ⏳ {venta.status || 'En proceso'}
                                  </span>
                                );
                              }
                            })()}

                            {(() => {
                              const totalReturned = venta.totalReturned || 0;
                              const totalVenta = venta.totalVenta || venta.totalProducto || 0;

                              if (totalReturned > 0) {
                                if (totalReturned >= totalVenta) {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      🔄 Devolución Completa
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      ↩️ Devolución Parcial
                                    </span>
                                  );
                                }
                              }
                              return null;
                            })()}
                          </div>
                        </td>

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Acciones de tabla */}
            <div className="p-6 border-t" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="flex flex-wrap gap-3 items-center">
                {safeArray(selectedSales).length > 0 && (
                  <button
                    onClick={(e) => handleDeleteSelectedSales(e)}
                    className="px-4 py-2 bg-red-600 text-white rounded-md font-medium transition-colors duration-200 hover:bg-red-700"
                  >
                    Eliminar Seleccionadas ({selectedSales.length})
                  </button>
                )}

                {safeArray(ventasFiltradas).length > visibleRows && (
                  <button
                    onClick={loadMoreRows}
                    className="px-4 py-2 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                    style={{ color: '#46546b', borderColor: '#46546b' }}
                  >
                    Cargar Más ({ventasFiltradas.length - visibleRows} restantes)
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tabla de Devoluciones */}
        {!loading && tipoReporte === "devoluciones" && safeArray(devolucionesFiltradas).length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
            <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
                  Reporte de Devoluciones
                </h2>
                <div className="text-sm" style={{ color: '#697487' }}>
                  Mostrando {Math.min(visibleRows, devolucionesFiltradas.length)} de {devolucionesFiltradas.length} registros
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ backgroundColor: '#f4f6fa' }}>
                  <tr>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>ID Devolución</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>ID Venta</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '130px' }}>Fecha/Hora</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Tienda</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Usuario</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '200px' }}>Productos Devueltos</th>
                    <th className="text-center p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Monto Reembolsado</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Método Reembolso</th>
                    <th className="text-center p-3 font-medium" style={{ color: '#23334e', minWidth: '100px' }}>Estado</th>
                    <th className="text-left p-3 font-medium" style={{ color: '#23334e', minWidth: '150px' }}>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {devolucionesFiltradas
                    .slice(0, visibleRows)
                    .map((devolucion, index) => (
                      <tr key={devolucion._id} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-red-50 transition-colors duration-150`}>

                        {/* ID Devolución */}
                        <td className="p-3">
                          <div
                            className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors duration-200"
                            onClick={(e) => copyToClipboard(devolucion._id, e)}
                            title="Clic para copiar ID completo"
                          >
                            <div className="font-mono text-xs font-medium" style={{ color: '#23334e' }}>
                              {devolucion._id.slice(-8)}
                            </div>
                            <div className="text-xs" style={{ color: '#8c95a4' }}>
                              📋 Copiar
                            </div>
                          </div>
                        </td>

                        {/* ID Venta */}
                        <td className="p-3">
                          <div
                            className="cursor-pointer hover:bg-gray-200 p-2 rounded transition-colors duration-200"
                            onClick={(e) => copyToClipboard(devolucion.saleId?._id || devolucion.saleId, e)}
                            title="Clic para copiar ID de venta"
                          >
                            <div className="font-mono text-xs font-medium" style={{ color: '#697487' }}>
                              {(devolucion.saleId?._id || devolucion.saleId)?.slice(-8)}
                            </div>
                            <div className="text-xs" style={{ color: '#8c95a4' }}>
                              📋 Copiar
                            </div>
                          </div>
                        </td>

                        {/* Fecha y Hora */}
                        <td className="p-3">
                          <div className="text-xs">
                            <div className="font-medium" style={{ color: '#23334e' }}>
                              {new Date(devolucion.date).toLocaleDateString('es-MX')}
                            </div>
                            <div style={{ color: '#697487' }}>
                              {new Date(devolucion.date).toLocaleTimeString('es-MX', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </td>

                        {/* Tienda */}
                        <td className="p-3">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            {devolucion.tienda?.nombre || devolucion.tienda || "-"}
                          </span>
                        </td>

                        {/* Usuario */}
                        <td className="p-3">
                          <span className="text-xs font-medium" style={{ color: '#697487' }}>
                            {devolucion.processedBy?.username || devolucion.processedBy || "-"}
                          </span>
                        </td>

                        {/* Productos Devueltos */}
                        <td className="p-3">
                          <div className="space-y-1">
                            {devolucion.returnedItems?.map((item, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium" style={{ color: '#23334e' }}>
                                  {item.name}
                                </span>
                                <span style={{ color: '#697487' }}>
                                  {' '}x{item.quantity} - ${(item.refundPrice * item.quantity).toFixed(2)}
                                </span>
                                {item.reason && (
                                  <div className="italic text-xs mt-1" style={{ color: '#8c95a4' }}>
                                    Razón: {item.reason}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Monto Reembolsado */}
                        <td className="p-3 text-center">
                          <span className="font-bold text-sm text-red-600">
                            ${Number(devolucion.refundAmount).toFixed(2)}
                          </span>
                        </td>

                        {/* Método Reembolso */}
                        <td className="p-3">
                          <div>
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100" style={{ color: '#23334e' }}>
                              {devolucion.refundMethod || 'N/A'}
                            </span>
                            {devolucion.mixedRefunds && devolucion.mixedRefunds.length > 0 && (
                              <div className="text-xs mt-1 space-y-1" style={{ color: '#8c95a4' }}>
                                {devolucion.mixedRefunds.map((mr, idx) => (
                                  <div key={idx}>
                                    {mr.method}: ${mr.amount.toFixed(2)}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Estado */}
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            devolucion.status === 'procesada' ? 'bg-green-100 text-green-800' :
                            devolucion.status === 'aprobada' ? 'bg-blue-100 text-blue-800' :
                            devolucion.status === 'rechazada' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {devolucion.status || 'Pendiente'}
                          </span>
                        </td>

                        {/* Notas */}
                        <td className="p-3">
                          <div className="text-xs" style={{ color: '#697487' }}>
                            {devolucion.customerNotes || devolucion.adminNotes || "-"}
                          </div>
                        </td>

                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Acciones de tabla */}
            <div className="p-6 border-t" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="flex flex-wrap gap-3 items-center">
                {safeArray(devolucionesFiltradas).length > visibleRows && (
                  <button
                    onClick={loadMoreRows}
                    className="px-4 py-2 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                    style={{ color: '#46546b', borderColor: '#46546b' }}
                  >
                    Cargar Más ({devolucionesFiltradas.length - visibleRows} restantes)
                  </button>
                )}

                <button
                  onClick={handleExportCSV}
                  className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                  style={{ color: '#697487', borderColor: '#697487' }}
                >
                  Descargar CSV
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mensaje cuando no hay datos */}
        {!loading && (
          (tipoReporte === "ventas" && safeArray(ventasFiltradas).length === 0 && ventas.length === 0) ||
          (tipoReporte === "devoluciones" && safeArray(devolucionesFiltradas).length === 0)
        ) && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
              <svg className="w-12 h-12" style={{ color: '#8c95a4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              No hay datos disponibles
            </h3>
            <p className="mb-6" style={{ color: '#697487' }}>
              No se encontraron registros para los filtros seleccionados. Ajusta los criterios de búsqueda e intenta nuevamente.
            </p>
            <button
              onClick={handleGenerar}
              className="px-6 py-3 text-white font-medium rounded-md transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: '#23334e' }}
            >
              Generar Reporte
            </button>
          </div>
        )}

        {/* Resumen/Totales */}
        {!loading && (safeArray(ventasFiltradas).length > 0 || safeArray(devolucionesFiltradas).length > 0) && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              Resumen Ejecutivo
            </h3>
            <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Se incluyen en el resumen las ventas con estado <strong>"Entregado"</strong> y <strong>"Parcialmente devuelta"</strong>.
                Para devoluciones parciales se contabiliza solo el monto neto (total - devuelto). Las ventas canceladas se muestran en la tabla pero no se contabilizan.
              </p>
            </div>

            {tipoReporte === "ventas" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                    ${totalGeneral.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Total General
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#697487' }}>
                    ${ivaTotal.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    IVA Total
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                    {totalRegistros}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Total Registros
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#697487' }}>
                    ${promedioVenta.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Promedio por Venta
                  </div>
                </div>
              </div>
            )}

            {tipoReporte === "devoluciones" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2 text-red-600">
                    ${totalGeneral.toFixed(2)}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Total Reembolsado
                  </div>
                </div>

                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                    {devolucionesFiltradas.length}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Total Devoluciones
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tooltip para ID copiado */}
      {copiedTooltip.show && (
        <div
          className="fixed z-50 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${copiedTooltip.position.x}px`,
            top: `${copiedTooltip.position.y}px`,
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          ✅ ID copiado: {copiedTooltip.id}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #16a34a'
            }}
          ></div>
        </div>
      )}

      {/* Tooltip para venta eliminada */}
      {deleteTooltip.show && (
        <div
          className="fixed z-50 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-lg shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${deleteTooltip.position.x}px`,
            top: `${deleteTooltip.position.y}px`,
            opacity: 1,
            transition: 'opacity 0.2s ease-in-out'
          }}
        >
          🗑️ {deleteTooltip.message} exitosamente
          <div
            className="absolute left-1/2 transform -translate-x-1/2 top-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid #dc2626'
            }}
          ></div>
        </div>
      )}
    </div>
  );
}
