import { useEffect } from "react";
import { useCajaData, useCajaFilters, useCajaUtils } from '../hooks';

export default function CajaPage() {
  // Hooks personalizados
  const {
    resultados,
    mixedPaymentStats,
    tiendas,
    loading,
    mixedStatsLoading,
    tiendasLoading,
    error,
    generarCorte,
    fetchMixedPaymentStats,
    limpiarResultados
  } = useCajaData();

  const {
    periodo,
    fechaInicio,
    fechaFin,
    tiendaSeleccionada,
    setPeriodo,
    setFechaInicio,
    setFechaFin,
    setTiendaSeleccionada,
    getPeriodoLabel
  } = useCajaFilters();

  const {
    formatCurrency,
    formatDateTime,
    calcularPorcentajeMetodo,
    getMetodoIcon,
    getTiendaNombre,
    getMetodoColor,
    calcularTotalPorMetodo,
    calcularPorcentajeParticipacion,
    printReport,
    exportPDF
  } = useCajaUtils();

  const handleGenerarCorte = async () => {
    const success = await generarCorte(fechaInicio, fechaFin, tiendaSeleccionada);
    if (success) {
      fetchMixedPaymentStats(fechaInicio, fechaFin, tiendaSeleccionada);
    }
  };


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
                Corte de Caja
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Genera reportes financieros detallados de ventas, gastos y balance
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm" style={{ color: '#697487' }}>
                  Último corte
                </div>
                <div className="font-medium" style={{ color: '#23334e' }}>
                  {resultados ? formatDateTime(resultados.periodo?.fin) : "No generado"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {error && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            error.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Configuración del corte */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
            Configuración del Reporte
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">

            {/* Selector de Tienda - MOVER AQUÍ */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tienda
                  </label>
                  <select
                    value={tiendaSeleccionada}
                    onChange={(e) => setTiendaSeleccionada(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={loading || tiendasLoading}
                  >
                    <option value="">🏢 Todas las tiendas</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda._id} value={tienda._id}>
                        🏪 {tienda.nombre}
                      </option>
                    ))}
                  </select>
                  {tiendasLoading && (
                    <div className="text-xs mt-1" style={{ color: '#697487' }}>
                      Cargando tiendas...
                    </div>
                  )}
                </div>

                {/* Período de Análisis */}
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Período de Análisis
                  </label>
                  <select
                    value={periodo}
                    onChange={(e) => setPeriodo(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={loading}
                  >
                    <option value="dia">📅 Hoy</option>
                    <option value="mes">📊 Este mes</option>
                    <option value="año">📈 Este año</option>
                    <option value="rango">🗓️ Rango personalizado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha y Hora Inicio
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={loading || periodo !== "rango"}
                    readOnly={periodo !== "rango"}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Fecha y Hora Fin
                  </label>
                  <input
                    type="datetime-local"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                    disabled={loading || periodo !== "rango"}
                    readOnly={periodo !== "rango"}
                  />
                </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerarCorte}
              className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generando Corte...
                </div>
              ) : (
                "🔄 Generar Corte de Caja"
              )}
            </button>
          </div>
        </div>

        {/* Resultados del corte */}
        {resultados && (
          <div className="space-y-8">
            {/* Información del período */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                📋 Información del Reporte
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">

                  {/* Tienda - NUEVO */}
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Tienda
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        🏪 {getTiendaNombre(tiendaSeleccionada, tiendas)}
                      </div>
                    </div>
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Período Analizado
                  </div>
                  <div className="font-bold" style={{ color: '#23334e' }}>
                    {getPeriodoLabel()}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Desde
                  </div>
                  <div className="font-bold" style={{ color: '#23334e' }}>
                    {formatDateTime(resultados.periodo?.inicio)}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Hasta
                  </div>
                  <div className="font-bold" style={{ color: '#23334e' }}>
                    {formatDateTime(resultados.periodo?.fin)}
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-green-100">
                    💰
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Total Ventas
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(resultados.ventas?.total)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      {(resultados.ventas?.desglose?.efectivo?.cantidad || 0) + 
                       (resultados.ventas?.desglose?.transferencia?.cantidad || 0) + 
                       (resultados.ventas?.desglose?.tarjeta?.cantidad || 0)} transacciones
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-red-100">
                    📉
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Total Gastos
                    </div>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(resultados.gastos?.total)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      {(resultados.gastos?.desglose?.efectivo?.cantidad || 0) + 
                       (resultados.gastos?.desglose?.transferencia?.cantidad || 0) + 
                       (resultados.gastos?.desglose?.tarjeta?.cantidad || 0)} gastos
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-400">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl bg-yellow-100">
                    🔄
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Devoluciones
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatCurrency(resultados.devoluciones?.total)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      {resultados.devoluciones?.cantidad || 0} devoluciones
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4" style={{ borderColor: '#23334e' }}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl" style={{ backgroundColor: '#23334e', color: 'white' }}>
                    💎
                  </div>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Balance Final
                    </div>
                    <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                      {formatCurrency(resultados.corte?.final)}
                    </div>
                    <div className="text-sm" style={{ color: '#697487' }}>
                      Sin devoluciones: {formatCurrency(resultados.corte?.sinDevoluciones)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Desglose por método de pago */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Ventas por método */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                  📈 Ventas por Método de Pago
                </h3>
                
                <div className="space-y-4">
                  {['efectivo', 'transferencia', 'tarjeta'].map((metodo) => (
                    <div key={metodo} className="p-4 rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getMetodoIcon(metodo)}</span>
                          <span className="font-medium capitalize" style={{ color: '#23334e' }}>
                            {metodo}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(resultados.ventas?.desglose?.[metodo]?.total)}
                          </div>
                          <div className="text-sm" style={{ color: '#697487' }}>
                            {calcularPorcentajeMetodo(resultados, metodo, 'ventas')}% del total
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm" style={{ color: '#697487' }}>
                        <span>Transacciones:</span>
                        <span className="font-medium">
                          {resultados.ventas?.desglose?.[metodo]?.cantidad || 0}
                        </span>
                      </div>
                      
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${calcularPorcentajeMetodo(resultados, metodo, 'ventas')}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gastos por método */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                  📉 Gastos por Método de Pago
                </h3>
                
                <div className="space-y-4">
                  {['efectivo', 'transferencia', 'tarjeta'].map((metodo) => (
                    <div key={metodo} className="p-4 rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getMetodoIcon(metodo)}</span>
                          <span className="font-medium capitalize" style={{ color: '#23334e' }}>
                            {metodo}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            {formatCurrency(resultados.gastos?.desglose?.[metodo]?.total)}
                          </div>
                          <div className="text-sm" style={{ color: '#697487' }}>
                            {calcularPorcentajeMetodo(resultados, metodo, 'gastos')}% del total
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm" style={{ color: '#697487' }}>
                        <span>Gastos:</span>
                        <span className="font-medium">
                          {resultados.gastos?.desglose?.[metodo]?.cantidad || 0}
                        </span>
                      </div>
                      
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${calcularPorcentajeMetodo(resultados, metodo, 'gastos')}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Balance por método */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                ⚖️ Balance Neto por Método de Pago
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['efectivo', 'transferencia', 'tarjeta'].map((metodo) => (
                  <div key={metodo} className="text-center p-6 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-3xl mb-2">{getMetodoIcon(metodo)}</div>
                    <div className="text-sm font-medium mb-2 capitalize" style={{ color: '#697487' }}>
                      {metodo}
                    </div>
                    <div className="text-2xl font-bold" style={{ 
                      color: (resultados.corte?.porMetodo?.[metodo] || 0) >= 0 ? '#10b981' : '#ef4444' 
                    }}>
                      {formatCurrency(resultados.corte?.porMetodo?.[metodo])}
                    </div>
                    <div className="text-xs mt-1" style={{ color: '#697487' }}>
                      {(resultados.corte?.porMetodo?.[metodo] || 0) >= 0 ? 'Ganancia' : 'Pérdida'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ✅ NUEVO: Panel de Pagos Mixtos */}
              {resultados && resultados.pagosMixtos && resultados.pagosMixtos.totalVentas > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                    🔀 Análisis de Pagos Mixtos
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
                        {resultados.pagosMixtos.totalVentas}
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Ventas Mixtas
                      </div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-2xl font-bold mb-2" style={{ color: '#46546b' }}>
                        {formatCurrency(resultados.pagosMixtos.montoTotal)}
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Monto Total Mixto
                      </div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-2xl font-bold mb-2" style={{ color: '#697487' }}>
                        {resultados.pagosMixtos.promedioMetodos}
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Métodos por Venta
                      </div>
                    </div>
                    
                    <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-2xl font-bold mb-2" style={{ color: '#8c95a4' }}>
                        {resultados.pagosMixtos.porcentajeDelTotal}%
                      </div>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        % del Total de Ventas
                      </div>
                    </div>
                  </div>

                  {/* Detalles adicionales de combinaciones si están disponibles */}
                  {mixedPaymentStats && (
                    <div className="border-t pt-6">
                      <h4 className="text-md font-semibold mb-4" style={{ color: '#23334e' }}>
                        📊 Combinaciones Más Populares
                      </h4>
                      
                      {mixedStatsLoading ? (
                        <div className="text-center py-4" style={{ color: '#8c95a4' }}>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mx-auto mb-2"></div>
                          Cargando estadísticas...
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {mixedPaymentStats.topCombinations && mixedPaymentStats.topCombinations.slice(0, 3).map((combo, index) => (
                            <div key={index} className="p-3 rounded-lg border" style={{ borderColor: '#e5e7eb' }}>
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-sm" style={{ color: '#23334e' }}>
                                  {combo.combination.split('+').map(method => 
                                    method.charAt(0).toUpperCase() + method.slice(1)
                                  ).join(' + ')}
                                </span>
                                <span className="text-sm font-bold" style={{ color: '#46546b' }}>
                                  {combo.count} veces
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            {/* Estadísticas adicionales */}
            {resultados.resumen && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                  📊 Estadísticas del Período
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">🛒</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Total Transacciones
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#23334e' }}>
                      {resultados.resumen.totalTransacciones || 0}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">📈</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Promedio por Venta
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {formatCurrency(resultados.resumen.promedioVenta)}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">✅</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Gastos Aprobados
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#23334e' }}>
                      {resultados.resumen.totalGastosAprobados || 0}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">💸</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Promedio por Gasto
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {formatCurrency(resultados.resumen.promedioGasto)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Acciones del reporte */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                🔧 Acciones del Reporte
              </h3>
              
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => printReport(resultados, tiendas)}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#46546b' }}
                >
                  🖨️ Imprimir Reporte
                </button>
                
                <button
                  onClick={() => exportPDF(resultados, tiendas)}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  📄 Exportar PDF
                </button>
                
                <button
                  onClick={limpiarResultados}
                  className="px-6 py-3 rounded-lg font-medium border transition-all duration-200 hover:shadow-md"
                  style={{ 
                    borderColor: '#e5e7eb',
                    color: '#697487'
                  }}
                >
                  🗑️ Limpiar Reporte
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Indicador de carga global */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border-l-4" style={{ borderColor: '#23334e' }}>
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: '#23334e' }}></div>
              <span style={{ color: '#23334e' }}>Generando corte de caja...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}