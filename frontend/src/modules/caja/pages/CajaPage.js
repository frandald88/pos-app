import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function CajaPage() {
  const token = localStorage.getItem("token");

  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [resultados, setResultados] = useState(null);
  const [msg, setMsg] = useState("");
  const [cargando, setCargando] = useState(false);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState(""); // Nueva state para tienda
  const [tiendas, setTiendas] = useState([]); // Nueva state para lista de tiendas
  const [cargandoTiendas, setCargandoTiendas] = useState(false);
  const [mixedPaymentStats, setMixedPaymentStats] = useState(null);
  const [cargandoMixedStats, setCargandoMixedStats] = useState(false);

  console.log("🔍 Fechas:", { fechaInicio, fechaFin });

  const generarRangoFechas = () => {
  const ahora = new Date();
  let inicio, fin;

  if (periodo === "dia") {
    inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
  } else if (periodo === "mes") {
    inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
  } else if (periodo === "año") {
    inicio = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0);
    fin = new Date(ahora.getFullYear(), 11, 31, 23, 59, 59, 999);
  }

  console.log("🔍 Fechas generadas:", {
    inicio: inicio.toISOString(),
    fin: fin.toISOString(),
    periodo
  });

  setFechaInicio(inicio.toISOString().slice(0, 16));
  setFechaFin(fin.toISOString().slice(0, 16));
};

useEffect(() => {
  const cargarTiendas = async () => {
    setCargandoTiendas(true);
    try {
      const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTiendas(response.data);
      console.log("✅ Tiendas cargadas:", response.data);
    } catch (error) {
      console.error("❌ Error al cargar tiendas:", error);
      setMsg("Error al cargar tiendas ❌");
      setTimeout(() => setMsg(""), 3000);
    } finally {
      setCargandoTiendas(false);
    }
  };

  cargarTiendas();
}, [token]);

// ✅ NUEVO: Función para obtener estadísticas de pagos mixtos
const fetchMixedPaymentStats = async () => {
  if (!fechaInicio || !fechaFin) return;
  
  setCargandoMixedStats(true);
  try {
    const startDateObj = new Date(fechaInicio);
    const endDateObj = new Date(fechaFin);

    const params = {
      startDate: startDateObj.toISOString().slice(0, 10),
      endDate: endDateObj.toISOString().slice(0, 10),
    };

    if (tiendaSeleccionada) {
      params.tiendaId = tiendaSeleccionada;
    }

    const response = await axios.get(`${apiBaseUrl}/api/sales/mixed-payment-stats`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    
    setMixedPaymentStats(response.data);
  } catch (error) {
    console.error("❌ Error al obtener estadísticas de pagos mixtos:", error);
  } finally {
    setCargandoMixedStats(false);
  }
};

useEffect(() => {
  if (periodo !== "rango") generarRangoFechas();
}, [periodo]);

const handleGenerarCorte = () => {
  if (!fechaInicio || !fechaFin) {
    setMsg("Debes seleccionar fechas válidas ❌");
    return;
  }

  // ✅ Enviar tanto fechas como horas al backend modificado
  const startDateObj = new Date(fechaInicio);
  const endDateObj = new Date(fechaFin);

    const params = {
      startDate: startDateObj.toISOString().slice(0, 10),
      endDate: endDateObj.toISOString().slice(0, 10),
      startTime: startDateObj.toTimeString().slice(0, 8),
      endTime: endDateObj.toTimeString().slice(0, 8)
    };

    if (tiendaSeleccionada) {
      params.tiendaId = tiendaSeleccionada;
    }

  console.log("🔍 Enviando al backend:", params);

  setCargando(true);
  axios
    .get(`${apiBaseUrl}/api/caja/reporte`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    .then((res) => {
      console.log("✅ Respuesta del servidor:", res.data);
      setResultados(res.data);
      fetchMixedPaymentStats();
      setMsg("Corte generado exitosamente ✅");
      setCargando(false);
      setTimeout(() => setMsg(""), 3000);
    })
    .catch((error) => {
      console.error('❌ Error al generar corte:', error.response?.data || error.message);
      setMsg(`Error al generar corte: ${error.response?.data?.message || error.message} ❌`);
      setCargando(false);
    });
};

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPeriodoLabel = () => {
    const labels = {
      'dia': 'Hoy',
      'mes': 'Este Mes',
      'año': 'Este Año',
      'rango': 'Rango Personalizado'
    };
    return labels[periodo] || periodo;
  };

  const calcularPorcentajeMetodo = (metodo, tipo) => {
    if (!resultados || !resultados[tipo]?.total) return 0;
    const totalMetodo = resultados[tipo]?.desglose?.[metodo]?.total || 0;
    const totalGeneral = resultados[tipo]?.total || 0;
    return ((totalMetodo / totalGeneral) * 100).toFixed(1);
  };

  const getMetodoIcon = (metodo) => {
    const icons = {
      'efectivo': '💵',
      'transferencia': '🏦',
      'tarjeta': '💳'
    };
    return icons[metodo] || '💰';
  };

  const getTiendaNombre = () => {
  if (!tiendaSeleccionada) return "Todas las tiendas";
  const tienda = tiendas.find(t => t._id === tiendaSeleccionada);
  return tienda ? tienda.nombre : "Tienda no encontrada";
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
        {msg && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            msg.includes('✅') 
              ? 'bg-green-50 border-green-400 text-green-800' 
              : 'bg-red-50 border-red-400 text-red-800'
          }`}>
            <p className="font-medium">{msg}</p>
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
                    disabled={cargando || cargandoTiendas}
                  >
                    <option value="">🏢 Todas las tiendas</option>
                    {tiendas.map((tienda) => (
                      <option key={tienda._id} value={tienda._id}>
                        🏪 {tienda.nombre}
                      </option>
                    ))}
                  </select>
                  {cargandoTiendas && (
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
                    disabled={cargando}
                  >
                    <option value="dia">📅 Hoy</option>
                    <option value="mes">📊 Este mes</option>
                    <option value="año">📈 Este año</option>
                    <option value="rango">🗓️ Rango personalizado</option>
                  </select>
                </div>

            {periodo === "rango" && (
              <>
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
                    disabled={cargando}
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
                    disabled={cargando}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={handleGenerarCorte}
              className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
              style={{ backgroundColor: '#23334e' }}
              disabled={cargando}
            >
              {cargando ? (
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
                        🏪 {getTiendaNombre()}
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
                            {calcularPorcentajeMetodo(metodo, 'ventas')}% del total
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
                          style={{ width: `${calcularPorcentajeMetodo(metodo, 'ventas')}%` }}
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
                            {calcularPorcentajeMetodo(metodo, 'gastos')}% del total
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
                          style={{ width: `${calcularPorcentajeMetodo(metodo, 'gastos')}%` }}
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
                      
                      {cargandoMixedStats ? (
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
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                  style={{ backgroundColor: '#46546b' }}
                >
                  🖨️ Imprimir Reporte
                </button>
                
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(resultados, null, 2);
                    const dataBlob = new Blob([dataStr], {type: 'application/json'});
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `corte-caja-${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                  }}
                  className="px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  💾 Exportar Datos
                </button>
                
                <button
                  onClick={() => setResultados(null)}
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
        {cargando && (
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