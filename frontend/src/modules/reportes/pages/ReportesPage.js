import { useEffect, useState } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { saveAs } from "file-saver";
import Papa from "papaparse";
import apiBaseUrl from "../../../config/api";

export default function ReportsPage() {
  const token = localStorage.getItem("token");
  const [ventas, setVentas] = useState([]);
  const [tipoVenta, setTipoVenta] = useState("");
  const [tipo, setTipo] = useState("");
  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [msg, setMsg] = useState("");
  const [productoFiltro, setProductoFiltro] = useState("");
  const [visibleRows, setVisibleRows] = useState(10);
  const [showGraph, setShowGraph] = useState(false);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaFiltro, setTiendaFiltro] = useState("");
  const [tipoReporte, setTipoReporte] = useState("ventas");
  const [selectedSales, setSelectedSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMixedDetails, setShowMixedDetails] = useState(false);
  const [mixedPaymentData, setMixedPaymentData] = useState(null);

  const generarRangoFechas = () => {
  const ahora = new Date();
  let inicio, fin;

  if (periodo === "dia") {
    // Para el día actual, desde las 00:00:00 hasta las 23:59:59
    inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
    fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
  } else if (periodo === "mes") {
    // Para el mes actual, desde el día 1 a las 00:00:00 hasta ahora
    inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    fin = new Date(); // Hasta la hora actual
  } else if (periodo === "año") {
    // Para el año actual, desde el 1 de enero a las 00:00:00 hasta ahora
    inicio = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0);
    fin = new Date(); // Hasta la hora actual
  } else if (periodo === "rango") {
    return; // No cambiar nada si es rango personalizado
  }

  // Formatear para datetime-local (YYYY-MM-DDTHH:mm)
  const formatearFecha = (fecha) => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  setFechaInicio(formatearFecha(inicio));
  setFechaFin(formatearFecha(fin));
};

  useEffect(() => {
    generarRangoFechas();
  }, [periodo]);

  useEffect(() => {
    axios
      .get(`${apiBaseUrl}/api/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setTiendas(res.data))
      .catch(() => console.error("Error al cargar tiendas"));
  }, [token]);

  const handleGenerar = () => {
  setLoading(true);
  setVisibleRows(10);
  setShowGraph(false);
  setMsg("");

  const endpoint = tipoReporte === "ventas" ? "/api/report/ventas" : "/api/returns";
  
  // Preparar parámetros
  let params = {};
  
  if (tipoReporte === "ventas") {
    params = {
      tipoVenta,
      tipo,
      inicio: fechaInicio,
      fin: fechaFin,
      tiendaId: tiendaFiltro,
      desglosarMixtos: showMixedDetails 
    };
    
    // Limpiar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === "" || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });
  }

  console.log("Enviando parámetros:", params);

  axios
    .get(`${apiBaseUrl}${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    })
    .then((res) => {
      console.log("Respuesta del servidor:", res.data);
      
      const data = tipoReporte === "ventas"
        ? res.data?.resultados
        : res.data?.returns;
        
      if (Array.isArray(data) && data.length > 0) {
        setVentas(data);
        setMsg(`Reporte generado exitosamente - ${data.length} registros encontrados`);
      } else {
        setVentas([]);
        setMsg("No se encontraron datos para los filtros seleccionados");
      }
    })
    .catch((error) => {
      console.error('Error generating report:', error);
      setVentas([]);
      setMsg("Error al generar reporte: " + (error.response?.data?.message || error.message));
    })
    .finally(() => {
      setLoading(false);
    });
};

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      setMsg(`ID copiado: ${text.slice(-8)}`);
      setTimeout(() => setMsg(""), 3000);
    }).catch(() => {
      setMsg("Error al copiar ID");
    });
  };

  const ventasFiltradas = tipoReporte === "ventas" && Array.isArray(ventas)
    ? ventas.filter((v) => {
        const nombre = v.producto?.toLowerCase() || "";
        const sku = v.sku?.toString() || "";
        const filtro = productoFiltro.toLowerCase();
        return nombre.includes(filtro) || sku.includes(filtro);
      })
    : [];

  const safeArray = (arr) => Array.isArray(arr) ? arr : [];

  const devolucionesFiltradas = tipoReporte === "devoluciones" && Array.isArray(ventas)
    ? ventas
    : [];

  const totalGeneral = tipoReporte === "ventas"
    ? safeArray(ventasFiltradas).reduce((sum, v) => sum + (v.totalProducto || 0), 0)
    : safeArray(devolucionesFiltradas).reduce((sum, v) => sum + (v.refundAmount || 0), 0);

  const ivaTotal = tipoReporte === "ventas"
    ? safeArray(ventasFiltradas).reduce((sum, v) => sum + (v.ivaProducto || 0), 0)
    : 0;

  const generarDatosGrafica = () => {
    const agrupados = {};

    safeArray(ventasFiltradas).forEach((venta) => {
      let key = "";
      const fecha = new Date(venta.date);

      if (periodo === "dia") {
        key = fecha.getHours() + ":00";
      } else if (periodo === "mes") {
        key = fecha.getDate().toString();
      } else if (periodo === "año") {
        key = (fecha.getMonth() + 1) + "/" + fecha.getDate();
      }

      if (!agrupados[key]) agrupados[key] = 0;
      agrupados[key] += tipoReporte === "ventas" ? venta.totalProducto : venta.refundAmount;
    });

    return Object.keys(agrupados).map((key) => ({
      label: key,
      total: agrupados[key],
    }));
  };

  const handleExportCSV = () => {
    if (ventasFiltradas.length === 0) {
      setMsg("No hay datos para exportar");
      return;
    }
    
    const csv = Papa.unparse(ventasFiltradas);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, tipoReporte === "ventas" ? "reporte_ventas.csv" : "reporte_devoluciones.csv");
    setMsg("CSV exportado exitosamente");
  };

  const handleDeleteNoStoreSales = () => {
    if (!window.confirm("¿Estás seguro de eliminar TODAS las ventas sin tienda? Esta acción no se puede deshacer.")) return;

    axios.delete(`${apiBaseUrl}/api/sales/no-store`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setMsg(res.data.message);
    })
    .catch(err => {
      console.error(err);
      setMsg("Error al eliminar ventas sin tienda");
    });
  };

  const handleCheckboxChange = (ventaId) => {
    setSelectedSales((prevSelected) =>
      prevSelected.includes(ventaId)
        ? prevSelected.filter((id) => id !== ventaId)
        : [...prevSelected, ventaId]
    );
  };

  const handleDeleteSelectedSales = () => {
    if (selectedSales.length === 0) {
      setMsg("Selecciona al menos una venta para eliminar");
      return;
    }

    if (!window.confirm(`¿Eliminar ${selectedSales.length} ventas seleccionadas? Esta acción es irreversible.`)) return;

    axios
      .post(`${apiBaseUrl}/api/sales/delete-multiple`, { ids: selectedSales }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setMsg(res.data.message);
        setSelectedSales([]);
        handleGenerar();
      })
      .catch((err) => {
        console.error(err);
        setMsg("Error al eliminar ventas seleccionadas");
      });
  };

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

                {/* ✅ NUEVO: Opción para desglosar pagos mixtos */}
                {tipoReporte === "ventas" && (
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                      Opciones Avanzadas
                    </label>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showMixedDetails}
                          onChange={(e) => setShowMixedDetails(e.target.checked)}
                          className="rounded"
                          style={{ accentColor: '#23334e' }}
                        />
                        <span className="text-sm" style={{ color: '#46546b' }}>
                          Desglosar pagos mixtos
                        </span>
                      </label>
                    </div>
                  </div>
                )}

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
                  onClick={() => setShowGraph(!showGraph)} 
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

        
        {/* ✅ MODIFICADO: Botón para filtrar solo pagos mixtos */}
              {tipoReporte === "ventas" && (
                <button
                  onClick={() => {
                    // ✅ OPCIÓN B: Filtrar solo pagos mixtos en la tabla principal
                    const mixedOnly = ventas.filter(v => 
                      v.paymentType === 'mixed' || 
                      (v.method && v.method.includes('+')) || // Para detectar métodos combinados
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
              )}

              {/* ✅ NUEVO: Botón para mostrar todas las ventas nuevamente */}
              {tipoReporte === "ventas" && (
                <button
                  onClick={() => {
                    // Restaurar datos completos
                    handleGenerar();
                  }}
                  className="px-6 py-3 font-medium rounded-md border transition-colors duration-200 hover:bg-gray-50"
                  style={{ color: '#697487', borderColor: '#697487' }}
                >
                  📊 Mostrar Todas las Ventas
                </button>
              )}

        {/* Gráfica */}
        {showGraph && tipoReporte === "ventas" && ventasFiltradas.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Análisis Visual de Ventas
            </h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={generarDatosGrafica()}>
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
                                    setSelectedSales(ventasFiltradas.slice(0, visibleRows).map(v => v._id));
                                  } else {
                                    setSelectedSales([]);
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
                                    onClick={() => copyToClipboard(venta.ventaId || venta._id)}
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
                                    {venta.user || '-'}
                                  </span>
                                </td>
                                
                                {/* Tipo de Venta */}
                                <td className="p-3">
                                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100" style={{ color: '#23334e' }}>
                                    {venta.type}
                                  </span>
                                </td>
                                
                                {/* Método de Pago - CORREGIDO */}
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
                                    
                                    {venta.mixedPaymentInfo && (
                                      <div className="text-xs mt-1" style={{ color: '#697487' }}>
                                        {venta.mixedPaymentInfo.totalMixedPayments} métodos
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
                                    {venta.repartidor || "-"}
                                  </span>
                                </td>
                                
                                {/* Tienda */}
                                <td className="p-3">
                                  <span className="text-xs font-medium" style={{ color: '#697487' }}>
                                    {venta.tienda || "-"}
                                  </span>
                                </td>
                                
                                {/* Cliente */}
                                <td className="p-3">
                                  <span className="text-xs" style={{ color: '#697487' }}>
                                    {venta.cliente || "-"}
                                  </span>
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
                            onClick={handleDeleteSelectedSales}
                            className="px-4 py-2 bg-red-600 text-white rounded-md font-medium transition-colors duration-200 hover:bg-red-700"
                          >
                            Eliminar Seleccionadas ({selectedSales.length})
                          </button>
                        )}

                        {safeArray(ventasFiltradas).length > visibleRows && (
                          <button
                            onClick={() => setVisibleRows(visibleRows + 10)}
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
            <h3 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
              Resumen Ejecutivo
            </h3>
            
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
                    {ventasFiltradas.length}
                  </div>
                  <div className="text-sm font-medium" style={{ color: '#46546b' }}>
                    Total Registros
                  </div>
                </div>
                
                <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                  <div className="text-2xl font-bold mb-2" style={{ color: '#697487' }}>
                    ${ventasFiltradas.length > 0 ? (totalGeneral / ventasFiltradas.length).toFixed(2) : '0.00'}
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
    </div>
  );
}