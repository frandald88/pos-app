import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useCajaData, useCajaFilters, useCajaUtils } from '../hooks';
import { useTurno } from '../../turnos/hooks/useTurno';
import PrintCorteModal from '../components/PrintCorteModal';

export default function CajaPage() {
  const [searchParams] = useSearchParams();
  const turnoId = searchParams.get('turnoId');

  // Estados para el resumen del turno
  const [turnoData, setTurnoData] = useState(null);
  const [turnoLoading, setTurnoLoading] = useState(false);
  const { getResumenTurno, getTurnoActivo } = useTurno();

  // Estado para el modal de impresión
  const [showPrintModal, setShowPrintModal] = useState(false);

  // ⭐ NUEVO: Estados para modo de reporte (período vs turno vs histórico vs precorte)
  const [modoReporte, setModoReporte] = useState('periodo'); // 'periodo', 'turno', 'historico', 'precorte'
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState('');
  const [turnosLoading, setTurnosLoading] = useState(false);
  const [fechaHistorica, setFechaHistorica] = useState(''); // Para modo histórico
  const [turnoActivo, setTurnoActivo] = useState(null); // Para pre-corte

  // Hooks personalizados
  const {
    resultados,
    mixedPaymentStats,
    tiendas,
    loading,
    mixedStatsLoading,
    tiendasLoading,
    error,
    setError,
    generarCorte,
    fetchMixedPaymentStats,
    obtenerTurnos,
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

  // Cargar resumen del turno si hay turnoId
  useEffect(() => {
    if (turnoId) {
      cargarResumenTurno();
    }
  }, [turnoId]);

  const cargarResumenTurno = async () => {
    setTurnoLoading(true);
    try {
      const result = await getResumenTurno(turnoId);
      if (result.success) {
        setTurnoData(result.data);
      }
    } catch (error) {
      // Silenciosamente ignorar el error - esta información no es crítica
      // ya que el reporte principal tiene toda la información necesaria
      console.log('No se pudo cargar el resumen del turno (no crítico):', error);
    } finally {
      setTurnoLoading(false);
    }
  };

  // ⭐ NUEVO: Cargar turnos cuando cambia el modo a 'turno'
  useEffect(() => {
    if (modoReporte === 'turno') {
      cargarTurnos();
    } else {
      setTurnos([]);
      setTurnoSeleccionado('');
    }
  }, [modoReporte, fechaInicio, fechaFin, tiendaSeleccionada]);

  // ⭐ NUEVO: Cargar turnos del día histórico seleccionado
  useEffect(() => {
    if (modoReporte === 'historico' && fechaHistorica) {
      cargarTurnosHistoricos();
    } else if (modoReporte !== 'historico') {
      setFechaHistorica('');
    }
  }, [modoReporte, fechaHistorica, tiendaSeleccionada]);

  // ⭐ NUEVO: Cargar turno activo cuando se selecciona modo pre-corte
  useEffect(() => {
    if (modoReporte === 'precorte') {
      cargarTurnoActivo();
    } else {
      setTurnoActivo(null);
    }
  }, [modoReporte, tiendaSeleccionada]);

  const cargarTurnos = async () => {
    setTurnosLoading(true);
    const turnosData = await obtenerTurnos(fechaInicio, fechaFin, tiendaSeleccionada);
    setTurnos(turnosData);
    setTurnosLoading(false);
  };

  const cargarTurnosHistoricos = async () => {
    setTurnosLoading(true);
    // Crear inicio y fin del día seleccionado
    const inicioDelDia = new Date(fechaHistorica);
    inicioDelDia.setHours(0, 0, 0, 0);

    const finDelDia = new Date(fechaHistorica);
    finDelDia.setHours(23, 59, 59, 999);

    const turnosData = await obtenerTurnos(
      inicioDelDia.toISOString(),
      finDelDia.toISOString(),
      tiendaSeleccionada
    );
    setTurnos(turnosData);
    setTurnosLoading(false);
  };

  const cargarTurnoActivo = async () => {
    setTurnosLoading(true);
    try {
      // Pasar tiendaSeleccionada si no es 'todas'
      const tiendaId = tiendaSeleccionada !== 'todas' ? tiendaSeleccionada : null;
      const result = await getTurnoActivo(tiendaId);
      if (result.success && result.data.turno) {
        setTurnoActivo(result.data.turno);
        setTurnoSeleccionado(result.data.turno._id);
      } else {
        setTurnoActivo(null);
        const mensajeError = tiendaId
          ? 'No hay un turno activo en la tienda seleccionada. Debes abrir un turno para generar un pre-corte.'
          : 'No tienes un turno activo. Debes abrir un turno para generar un pre-corte.';
        setError(mensajeError);
      }
    } catch (error) {
      console.error('Error al obtener turno activo:', error);
      setError('Error al cargar el turno activo');
    } finally {
      setTurnosLoading(false);
    }
  };

  const handleGenerarCorte = async () => {
    if (modoReporte === 'turno' || modoReporte === 'historico' || modoReporte === 'precorte') {
      // Modo turno, histórico o precorte: usar turnoId
      if (!turnoSeleccionado) {
        return; // No hacer nada si no hay turno seleccionado
      }
      const success = await generarCorte(null, null, null, turnoSeleccionado);
      // No necesitamos mixedPaymentStats en modo turno/histórico/precorte
    } else {
      // Modo período: usar fechas
      const success = await generarCorte(fechaInicio, fechaFin, tiendaSeleccionada);
      if (success) {
        fetchMixedPaymentStats(fechaInicio, fechaFin, tiendaSeleccionada);
      }
    }
  };


  // Si hay turnoData, mostrar vista de corte de turno
  if (turnoData) {
    const { turno, stats } = turnoData;

    return (
      <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header del Corte de Turno */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
              🔒 Corte de Turno
            </h1>
            <p style={{ color: '#697487' }} className="text-lg">
              Resumen del turno cerrado - {turno.tienda?.nombre}
            </p>
          </div>

          {/* Información del Turno */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              📋 Información del Turno
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Cajero</p>
                <p className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  {turno.usuario?.username || 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Estación</p>
                <p className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  {turno.estacion}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Apertura</p>
                <p className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  {formatDateTime(turno.fechaApertura)}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Cierre</p>
                <p className="text-lg font-semibold" style={{ color: '#23334e' }}>
                  {turno.fechaCierre ? formatDateTime(turno.fechaCierre) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Notas de Apertura y Cierre */}
            {(turno.notasApertura || turno.notasCierre) && (
              <div className="mt-6 space-y-3">
                {turno.notasApertura && (
                  <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: '#f0f9ff', borderColor: '#3b82f6' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#1e40af' }}>
                      📝 Notas de Apertura
                    </p>
                    <p className="text-sm" style={{ color: '#1e3a8a' }}>
                      {turno.notasApertura}
                    </p>
                  </div>
                )}
                {turno.notasCierre && (
                  <div className="p-4 rounded-lg border-l-4" style={{ backgroundColor: '#fef3c7', borderColor: '#f59e0b' }}>
                    <p className="text-sm font-semibold mb-1" style={{ color: '#92400e' }}>
                      🔒 Notas de Cierre
                    </p>
                    <p className="text-sm" style={{ color: '#78350f' }}>
                      {turno.notasCierre}
                    </p>
                    {turno.usuarioCierre && (
                      <p className="text-xs mt-1" style={{ color: '#92400e' }}>
                        Cerrado por: {turno.usuarioCierre?.username || 'N/A'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Resumen de Efectivo */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              💰 Resumen de Efectivo
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>Efectivo Inicial</span>
                <span className="font-bold text-lg" style={{ color: '#23334e' }}>
                  {formatCurrency(turno.efectivoInicial)}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>Ventas en Efectivo</span>
                <span className="font-bold text-lg text-green-600">
                  + {formatCurrency(stats.efectivo)}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>Efectivo Esperado</span>
                <span className="font-bold text-lg" style={{ color: '#23334e' }}>
                  {formatCurrency(turno.efectivoInicial + stats.efectivo)}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>Efectivo Final (Contado)</span>
                <span className="font-bold text-lg" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.saldoFinal)}
                </span>
              </div>
              <div className={`flex justify-between p-4 rounded-lg border-2 ${stats.diferencia === 0 ? 'bg-green-50 border-green-500' : stats.diferencia > 0 ? 'bg-blue-50 border-blue-500' : 'bg-red-50 border-red-500'}`}>
                <span className="font-semibold">Diferencia</span>
                <span className={`font-bold text-xl ${stats.diferencia === 0 ? 'text-green-600' : stats.diferencia > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {stats.diferencia >= 0 ? '+' : ''}{formatCurrency(stats.diferencia)}
                </span>
              </div>
            </div>
          </div>

          {/* Resumen de Ventas por Método de Pago */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              💳 Resumen de Ventas
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm mb-2" style={{ color: '#697487' }}>💵 Efectivo</p>
                <p className="text-xl font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.efectivo)}
                </p>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm mb-2" style={{ color: '#697487' }}>💳 Tarjeta</p>
                <p className="text-xl font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.tarjeta)}
                </p>
              </div>
              <div className="p-4 rounded-lg text-center" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm mb-2" style={{ color: '#697487' }}>🏦 Transferencia</p>
                <p className="text-xl font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.transferencia)}
                </p>
              </div>
            </div>
            <div className="p-4 rounded-lg border-2" style={{ borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }}>
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold" style={{ color: '#697487' }}>Total de Ventas</span>
                <span className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.totalMonto)}
                </span>
              </div>
            </div>
          </div>

          {/* Estadísticas Generales */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              📊 Estadísticas del Turno
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Total de Ventas</p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {stats.totalVentas}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Consumo Promedio</p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.consumoPromedio)}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Folio Inicial</p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  #{stats.folioInicial || 'N/A'}
                </p>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <p className="text-sm" style={{ color: '#697487' }}>Folio Final</p>
                <p className="text-2xl font-bold" style={{ color: '#23334e' }}>
                  #{stats.folioFinal || 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Ventas por Tipo de Servicio */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              🏪 Ventas por Tipo de Servicio
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>Mostrador ({stats.porTipo.mostrador.cantidad})</span>
                <span className="font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.porTipo.mostrador.monto)}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>A Recoger ({stats.porTipo.recoger.cantidad})</span>
                <span className="font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.porTipo.recoger.monto)}
                </span>
              </div>
              <div className="flex justify-between p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                <span style={{ color: '#697487' }}>A Domicilio ({stats.porTipo.domicilio.cantidad})</span>
                <span className="font-bold" style={{ color: '#23334e' }}>
                  {formatCurrency(stats.porTipo.domicilio.monto)}
                </span>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
              🔧 Acciones
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#46546b' }}
              >
                🖨️ Imprimir Corte
              </button>
              <button
                onClick={() => window.history.back()}
                className="px-6 py-3 rounded-lg font-medium border transition-all duration-200 hover:shadow-md"
                style={{ borderColor: '#e5e7eb', color: '#697487' }}
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">

            {/* ⭐ NUEVO: Modo de Reporte */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Modo de Reporte
              </label>
              <select
                value={modoReporte}
                onChange={(e) => {
                  setModoReporte(e.target.value);
                  limpiarResultados();
                }}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: '#e5e7eb',
                  focusRingColor: '#23334e'
                }}
                disabled={loading}
              >
                <option value="periodo">📅 Por Período</option>
                <option value="precorte">👁️ Pre-corte (Turno Activo)</option>
                <option value="turno">🕐 Por Turno (Rango)</option>
                <option value="historico">📆 Cortes Históricos</option>
              </select>
            </div>

            {/* Selector de Tienda */}
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

            {/* ⭐ NUEVO: Modo Pre-corte - Información del turno activo */}
            {modoReporte === 'precorte' && (
              <div className="lg:col-span-4">
                {turnosLoading ? (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2" style={{ borderColor: '#23334e' }}></div>
                      <span style={{ color: '#697487' }}>Cargando turno activo...</span>
                    </div>
                  </div>
                ) : turnoActivo ? (
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: '#10b981', backgroundColor: '#f0fdf4' }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🟢</span>
                        <div>
                          <p className="font-bold text-green-700">Turno Activo Detectado</p>
                          <p className="text-xs text-green-600">Pre-corte en tiempo real</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold px-2 py-1 rounded bg-green-600 text-white">
                        ACTIVO
                      </span>
                    </div>
                    <div className="space-y-1 text-sm mt-3">
                      <div className="flex items-center gap-2">
                        <span>👤</span>
                        <span className="text-green-700">Cajero:</span>
                        <span className="font-medium text-green-900">{turnoActivo.usuario?.username || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💻</span>
                        <span className="text-green-700">Estación:</span>
                        <span className="font-medium text-green-900">{turnoActivo.estacion || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🕐</span>
                        <span className="text-green-700">Apertura:</span>
                        <span className="font-medium text-green-900">
                          {new Date(turnoActivo.fechaApertura).toLocaleString('es-MX')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💵</span>
                        <span className="text-green-700">Efectivo Inicial:</span>
                        <span className="font-medium text-green-900">
                          ${turnoActivo.efectivoInicial?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg border-2" style={{ borderColor: '#f59e0b', backgroundColor: '#fffbeb' }}>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">⚠️</span>
                      <div>
                        <p className="font-bold" style={{ color: '#92400e' }}>No hay turno activo</p>
                        <p className="text-sm" style={{ color: '#b45309' }}>
                          Debes abrir un turno para generar un pre-corte
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ⭐ NUEVO: Modo Histórico - Selector de fecha y turnos del día */}
            {modoReporte === 'historico' && (
              <div className="lg:col-span-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Seleccionar Fecha
                </label>
                <input
                  type="date"
                  value={fechaHistorica}
                  onChange={(e) => {
                    setFechaHistorica(e.target.value);
                    setTurnoSeleccionado(''); // Limpiar turno seleccionado al cambiar fecha
                  }}
                  max={new Date().toISOString().split('T')[0]} // No permitir fechas futuras
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  disabled={loading}
                />
                {fechaHistorica && (
                  <div className="text-xs mt-1" style={{ color: '#697487' }}>
                    📅 {new Date(fechaHistorica + 'T00:00:00').toLocaleDateString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ⭐ Selector de Turno - Solo en modo turno (rango) */}
            {modoReporte === 'turno' && (
              <div className="lg:col-span-4">
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Seleccionar Turno
                </label>
                <select
                  value={turnoSeleccionado}
                  onChange={(e) => setTurnoSeleccionado(e.target.value)}
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                  style={{
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  disabled={loading || turnosLoading}
                >
                  <option value="">Selecciona un turno...</option>
                  {turnos.map((turno, idx) => {
                    const inicio = new Date(turno.fechaApertura).toLocaleString('es-MX');
                    const fin = turno.fechaCierre
                      ? new Date(turno.fechaCierre).toLocaleString('es-MX')
                      : 'Abierto';
                    const cajero = turno.usuario?.username || 'N/A';
                    const estado = turno.estado === 'abierto' ? '🟢' : '🔴';

                    return (
                      <option key={turno._id} value={turno._id}>
                        {estado} Turno #{idx + 1} - {cajero} - {inicio} → {fin}
                      </option>
                    );
                  })}
                </select>
                {turnosLoading && (
                  <div className="text-xs mt-1" style={{ color: '#697487' }}>
                    Cargando turnos...
                  </div>
                )}
                {!turnosLoading && turnos.length === 0 && modoReporte === 'turno' && (
                  <div className="text-xs mt-1" style={{ color: '#f59e0b' }}>
                    No se encontraron turnos en este período
                  </div>
                )}
              </div>
            )}

            {/* ⭐ Controles de Período - Solo en modo período */}
            {modoReporte === 'periodo' && (
              <>
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
              </>
            )}
          </div>

          {/* ⭐ NUEVO: Lista visual de turnos del día en modo histórico */}
          {modoReporte === 'historico' && fechaHistorica && (
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
                📋 Turnos del Día Seleccionado
              </h3>

              {turnosLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-3" style={{ borderColor: '#23334e' }}></div>
                  <p style={{ color: '#697487' }}>Cargando turnos...</p>
                </div>
              ) : turnos.length === 0 ? (
                <div className="text-center py-8 rounded-lg" style={{ backgroundColor: '#f9fafb' }}>
                  <p className="text-lg" style={{ color: '#697487' }}>📭 No hay turnos registrados en esta fecha</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {turnos.map((turno, idx) => {
                    const inicio = new Date(turno.fechaApertura);
                    const fin = turno.fechaCierre ? new Date(turno.fechaCierre) : null;
                    const cajero = turno.usuario?.username || 'N/A';
                    const cerrador = turno.usuarioCierre?.username;
                    const estacion = turno.estacion || 'N/A';
                    const isSelected = turno._id === turnoSeleccionado;
                    const isCerrado = turno.estado === 'cerrado';

                    return (
                      <div
                        key={turno._id}
                        onClick={() => setTurnoSeleccionado(turno._id)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          isSelected ? 'ring-2' : ''
                        }`}
                        style={{
                          borderColor: isSelected ? '#23334e' : '#e5e7eb',
                          backgroundColor: isSelected ? '#f0f4f8' : 'white',
                          ringColor: isSelected ? '#23334e' : 'transparent'
                        }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{isCerrado ? '🔴' : '🟢'}</span>
                            <div>
                              <p className="font-bold" style={{ color: '#23334e' }}>Turno #{idx + 1}</p>
                              <p className="text-xs" style={{ color: '#697487' }}>{isCerrado ? 'Cerrado' : 'Abierto'}</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="text-xs font-bold px-2 py-1 rounded" style={{ backgroundColor: '#23334e', color: 'white' }}>
                              SELECCIONADO
                            </span>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span>👤</span>
                            <span style={{ color: '#697487' }}>Cajero:</span>
                            <span className="font-medium" style={{ color: '#23334e' }}>{cajero}</span>
                          </div>

                          {cerrador && (
                            <div className="flex items-center gap-2">
                              <span>🔒</span>
                              <span style={{ color: '#697487' }}>Cerró:</span>
                              <span className="font-medium" style={{ color: '#23334e' }}>{cerrador}</span>
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span>💻</span>
                            <span style={{ color: '#697487' }}>Estación:</span>
                            <span className="font-medium text-xs" style={{ color: '#23334e' }}>{estacion}</span>
                          </div>

                          <div className="pt-2 mt-2 border-t" style={{ borderColor: '#e5e7eb' }}>
                            <div className="flex items-center gap-1 mb-1">
                              <span className="text-xs">🕐</span>
                              <span className="text-xs font-medium" style={{ color: '#697487' }}>
                                {inicio.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {fin && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs">🔚</span>
                                <span className="text-xs font-medium" style={{ color: '#697487' }}>
                                  {fin.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                                </span>
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
          )}

          <div className="mt-6">
            <button
              onClick={handleGenerarCorte}
              className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: modoReporte === 'precorte' ? '#10b981' : '#23334e'
              }}
              disabled={loading || ((modoReporte === 'turno' || modoReporte === 'historico' || modoReporte === 'precorte') && !turnoSeleccionado)}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {modoReporte === 'precorte' ? 'Generando Pre-corte...' : 'Generando Corte...'}
                </div>
              ) : (
                <>
                  {modoReporte === 'precorte' && '👁️ Generar Pre-corte'}
                  {modoReporte === 'turno' && '🕐 Generar Corte de Turno'}
                  {modoReporte === 'historico' && '📆 Generar Corte Histórico'}
                  {modoReporte === 'periodo' && '🔄 Generar Corte de Caja'}
                </>
              )}
            </button>
            {(modoReporte === 'turno' || modoReporte === 'historico') && !turnoSeleccionado && (
              <div className="text-sm mt-2" style={{ color: '#f59e0b' }}>
                Selecciona un turno para generar el corte
              </div>
            )}
            {modoReporte === 'precorte' && !turnoActivo && (
              <div className="text-sm mt-2" style={{ color: '#f59e0b' }}>
                No hay turno activo. Abre un turno para generar un pre-corte.
              </div>
            )}
            {modoReporte === 'precorte' && turnoActivo && (
              <div className="text-sm mt-2" style={{ color: '#10b981' }}>
                ✅ El pre-corte mostrará las ventas actuales sin cerrar el turno
              </div>
            )}
          </div>
        </div>

        {/* Resultados del corte */}
        {resultados && (
          <div className="space-y-8">
            {/* ⭐ BANNER DE PRE-CORTE */}
            {modoReporte === 'precorte' && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center gap-4">
                  <div className="text-6xl">👁️</div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2">PRE-CORTE EN TIEMPO REAL</h2>
                    <p className="text-green-50 text-lg">
                      Este es un reporte preliminar de tu turno activo. El turno sigue abierto y puedes seguir vendiendo.
                    </p>
                    <div className="mt-3 flex items-center gap-2 bg-white bg-opacity-20 rounded-lg p-3 inline-flex">
                      <span className="text-2xl">ℹ️</span>
                      <span className="font-medium">
                        Los datos mostrados son en tiempo real y se actualizarán al generar un nuevo pre-corte
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="bg-white bg-opacity-20 rounded-lg px-4 py-2">
                      <div className="text-sm font-medium text-green-100">Turno Activo</div>
                      <div className="text-3xl font-bold animate-pulse">🟢</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Información del reporte */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4" style={{ color: modoReporte === 'precorte' ? '#10b981' : '#23334e' }}>
                {modoReporte === 'precorte' ? '👁️ PRE-CORTE' : '📋 Información del Reporte'} - {resultados.periodo?.modo === 'turno' ? '🕐 Por Turno' : '📅 Por Período'}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Tienda */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-sm font-medium" style={{ color: '#697487' }}>
                    Tienda
                  </div>
                  <div className="font-bold" style={{ color: '#23334e' }}>
                    🏪 {getTiendaNombre(tiendaSeleccionada || resultados.periodo?.tiendaId, tiendas)}
                  </div>
                </div>

                {/* Modo específico */}
                {resultados.periodo?.modo === 'turno' && resultados.turno ? (
                  <>
                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Cajero
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        👤 {resultados.turno.cajero}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Estación
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        💻 {resultados.turno.estacion}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                      <div className="text-sm font-medium" style={{ color: '#697487' }}>
                        Estado del Turno
                      </div>
                      <div className="font-bold" style={{ color: '#23334e' }}>
                        {resultados.turno.estado === 'abierto' ? '🟢 Abierto' : '🔴 Cerrado'}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Período Analizado
                    </div>
                    <div className="font-bold" style={{ color: '#23334e' }}>
                      {getPeriodoLabel()}
                    </div>
                  </div>
                )}

                {/* Fechas - Siempre mostrar */}
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

            {/* Propinas */}
            {resultados.propinas && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
                  🪙 Propinas Recibidas
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">💵</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Total Propinas
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(resultados.propinas.total)}
                    </div>
                  </div>

                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-2">🧾</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Ventas con Propina
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#23334e' }}>
                      {resultados.propinas.ventasConPropina || 0}
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
                  onClick={() => setShowPrintModal(true)}
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

        {/* Estilos CSS para impresión en formato 80mm */}
        <style>{`
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }

            body {
              margin: 0;
              padding: 0;
              font-size: 10px;
            }

            * {
              box-shadow: none !important;
              border-radius: 0 !important;
            }

            .max-w-7xl {
              max-width: 100% !important;
              margin: 0 !important;
              padding: 5mm !important;
            }

            h1 {
              font-size: 14px !important;
              margin-bottom: 5px !important;
            }

            h2 {
              font-size: 12px !important;
              margin-bottom: 5px !important;
              margin-top: 10px !important;
            }

            h3 {
              font-size: 11px !important;
            }

            p, span, div {
              font-size: 9px !important;
            }

            .text-3xl, .text-2xl, .text-xl, .text-lg {
              font-size: 11px !important;
            }

            .mb-8, .mb-6 {
              margin-bottom: 8px !important;
            }

            .p-6, .p-4 {
              padding: 5px !important;
            }

            .gap-4, .gap-6, .gap-8 {
              gap: 5px !important;
            }

            .grid {
              display: block !important;
            }

            .grid > div {
              margin-bottom: 5px !important;
            }

            button {
              display: none !important;
            }

            .shadow-lg, .shadow-md {
              box-shadow: none !important;
            }

            .rounded-xl, .rounded-lg {
              border-radius: 0 !important;
            }

            /* Ocultar secciones no necesarias en impresión */
            .no-print {
              display: none !important;
            }
          }
        `}</style>
      </div>

      {/* Modal de impresión */}
      <PrintCorteModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        resultados={resultados}
        tiendas={tiendas}
        formatCurrency={formatCurrency}
        formatDateTime={formatDateTime}
        getTiendaNombre={getTiendaNombre}
        esPreCorte={modoReporte === 'precorte'}
      />
    </div>
  );
}