import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function ExpensesPage() {
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [concepto, setConcepto] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [monto, setMonto] = useState(""); // ✅ CAMBIADO: string vacío en lugar de número
  const [metodoPago, setMetodoPago] = useState("efectivo");
  const [evidencia, setEvidencia] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");
  const [filtroProveedor, setFiltroProveedor] = useState("");
  const [filtroTienda, setFiltroTienda] = useState("");
  const [filtroMetodoPago, setFiltroMetodoPago] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroInicio, setFiltroInicio] = useState("");
  const [filtroFin, setFiltroFin] = useState("");
  const [reportData, setReportData] = useState([]);
  const [editingGastoId, setEditingGastoId] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [availableStores, setAvailableStores] = useState([]);
  const [defaultStore, setDefaultStore] = useState(null);
  const [canSelectMultipleStores, setCanSelectMultipleStores] = useState(true);
  const [editingMsg, setEditingMsg] = useState("");
  // ✅ NUEVOS ESTADOS para sistema de proveedores
  const [proveedores, setProveedores] = useState([]);
  const [proveedoresEncontrados, setProveedoresEncontrados] = useState([]);
  const [busquedaProveedor, setBusquedaProveedor] = useState("");
  const [usarProveedorManual, setUsarProveedorManual] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`${apiBaseUrl}/api/users/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setCurrentUser(res.data);
        console.log('Current user loaded:', res.data);
      })
      .catch((error) => {
        console.error('Error loading user:', error);
        setMsg("Error al cargar usuario ❌");
      })
      .finally(() => {
        setUserLoaded(true);
        setLoading(false);
      });

    // Cargar tiendas y proveedores
    // ✅ CORREGIDO: Cargar tiendas disponibles según rol y proveedores
      Promise.all([
        axios.get(`${apiBaseUrl}/api/expenses/available-stores`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${apiBaseUrl}/api/expenses/providers`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      .then(([storesRes, proveedoresRes]) => {
        // ✅ AGREGAR VALIDACIONES para prevenir errores
        const storesData = storesRes.data || {};
        const { stores = [], userRole = 'vendedor', defaultStore: userDefaultStore = null } = storesData;
        
        setAvailableStores(stores);
        setTiendas(stores); // Mantener compatibilidad
        setProveedores(proveedoresRes.data || []);
        setCanSelectMultipleStores(userRole === 'admin');
        setDefaultStore(userDefaultStore);
        
        // ✅ NUEVO: Si no es admin, preseleccionar su tienda
        if (userRole !== 'admin' && userDefaultStore) {
          setTiendaSeleccionada(userDefaultStore);
        }
        
        console.log('Available stores loaded:', stores);
        console.log('User role:', userRole);
        console.log('Default store:', userDefaultStore);
        console.log('Can select multiple stores:', userRole === 'admin');
        console.log('Proveedores loaded:', proveedoresRes.data);
      })
      .catch((error) => {
        console.error('Error loading data:', error);
        setMsg("Error al cargar datos iniciales ❌");
        // ✅ ASEGURAR que los arrays estén inicializados aunque falle
        setAvailableStores([]);
        setTiendas([]);
        setProveedores([]);
        setCanSelectMultipleStores(false);
      });
  }, [token]);

  useEffect(() => {
    if (userLoaded && currentUser?.role === "admin") {
      loadExpenses();
    }
  }, [userLoaded, currentUser]);

  // ✅ NUEVA FUNCIÓN para buscar proveedores
  const buscarProveedores = (termino) => {
    if (termino.length < 2) {
      setProveedoresEncontrados([]);
      return;
    }
    
    axios
      .get(`${apiBaseUrl}/api/expenses/providers/search`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { q: termino }
      })
      .then((res) => setProveedoresEncontrados(res.data))
      .catch(() => console.error("Error al buscar proveedores"));
  };

  // ✅ NUEVA FUNCIÓN para actualizar lista de proveedores
  const fetchProveedores = () => {
    axios
      .get(`${apiBaseUrl}/api/expenses/providers`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setProveedores(res.data))
      .catch(() => console.error("Error al cargar proveedores"));
  };

  const loadExpenses = () => {
    setLoading(true);
    setMsg("");
    
    console.log('Loading expenses with filters:', {
      proveedor: filtroProveedor,
      metodoPago: filtroMetodoPago,
      tiendaId: filtroTienda,
      status: filtroEstado,
      startDate: filtroInicio,
      endDate: filtroFin,
    });

    axios
      .get(`${apiBaseUrl}/api/expenses/report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          proveedor: filtroProveedor || undefined,
          metodoPago: filtroMetodoPago || undefined,
          tiendaId: filtroTienda || undefined,
          status: filtroEstado || undefined,
          startDate: filtroInicio || undefined,
          endDate: filtroFin || undefined,
        },
      })
      .then((res) => {
        console.log('Expenses response:', res.data);
        
        if (res.data) {
          if (Array.isArray(res.data)) {
            setReportData(res.data);
            setMsg(`Reporte cargado exitosamente ✅ - ${res.data.length} gastos encontrados`);
          } else if (res.data.expenses && Array.isArray(res.data.expenses)) {
            setReportData(res.data.expenses);
            setMsg(`Reporte cargado exitosamente ✅ - ${res.data.expenses.length} gastos encontrados`);
          } else if (res.data.data && Array.isArray(res.data.data)) {
            setReportData(res.data.data);
            setMsg(`Reporte cargado exitosamente ✅ - ${res.data.data.length} gastos encontrados`);
          } else {
            console.error('Unexpected response structure:', res.data);
            setReportData([]);
            setMsg("Estructura de respuesta inesperada");
          }
        } else {
          setReportData([]);
          setMsg("No se encontraron gastos");
        }
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Error loading expenses:', error);
        setReportData([]);
        setMsg("Error al cargar reporte ❌");
      })
      .finally(() => {
        setLoading(false);
      });
  };

 const handleGuardarGasto = () => {
  if (!concepto || !proveedor || !monto || !metodoPago || !tiendaSeleccionada) {
    setMsg("Por favor completa todos los campos incluyendo tienda ❌");
    return;
  }

  setLoading(true);
  const formData = new FormData();
  formData.append("concepto", concepto);
  formData.append("proveedor", proveedor);
  formData.append("monto", monto === "" ? 0 : parseFloat(monto));
  formData.append("metodoPago", metodoPago);
  formData.append("tienda", tiendaSeleccionada);
  if (evidencia) formData.append("evidencia", evidencia);

  axios
    .post(`${apiBaseUrl}/api/expenses`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    })
    .then((response) => {
      console.log('Expense saved:', response.data);
      setMsg("Gasto guardado exitosamente ✅");
      setConcepto("");
      setProveedor("");
      setMonto("");
      setMetodoPago("efectivo");
      setEvidencia(null);
      
      // ✅ MODIFICADO: Solo limpiar tienda si es admin
      if (canSelectMultipleStores) {
        setTiendaSeleccionada("");
      }
      
      setMostrarFormulario(false);
      setUsarProveedorManual(false);
      setBusquedaProveedor("");
      setProveedoresEncontrados([]);
      
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
      
      // Actualizar lista de proveedores y reporte
      fetchProveedores();
      if (currentUser?.role === "admin") loadExpenses();
      setTimeout(() => setMsg(""), 3000);
    })
    .catch((error) => {
      console.error('Error saving expense:', error);
      // ✅ MODIFICADO: Mostrar mensaje de error más específico
      if (error.response?.data?.message) {
        setMsg(`Error: ${error.response.data.message} ❌`);
      } else {
        setMsg("Error al guardar gasto ❌");
      }
    })
    .finally(() => {
      setLoading(false);
    });
};
  const saveStatus = (gastoId) => {
  if (!newStatus) {
    setEditingMsg("Selecciona un estado válido ❌"); // Usar mensaje local
    setTimeout(() => setEditingMsg(""), 3000);
    return;
  }

  setLoading(true);
  setEditingMsg(""); // Limpiar mensaje anterior
  
  axios
    .patch(
      `${apiBaseUrl}/api/expenses/status/${gastoId}`,
      { status: newStatus, nota: adminNote },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    .then((response) => {
      console.log('Status updated:', response.data);
      setEditingMsg("Estado actualizado exitosamente ✅");
      setEditingGastoId(null);
      setNewStatus("");
      setAdminNote("");
      loadExpenses();
      setTimeout(() => setEditingMsg(""), 3000);
    })
    .catch((error) => {
      console.error('Error updating status:', error);
      setEditingMsg("Error al actualizar estado ❌");
      setTimeout(() => setEditingMsg(""), 3000);
    })
    .finally(() => {
      setLoading(false);
    });
};

  const handleDelete = (gastoId) => {
    if (!window.confirm("¿Estás seguro de eliminar este gasto?")) {
      return;
    }

    setLoading(true);
    axios
      .delete(`${apiBaseUrl}/api/expenses/${gastoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((response) => {
        console.log('Expense deleted:', response.data);
        setMsg("Gasto eliminado exitosamente ✅");
        loadExpenses();
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Error deleting expense:', error);
        setMsg("Error al eliminar gasto ❌");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const viewEvidencia = async (filename) => {
    try {
      setLoading(true);
      setMsg("Cargando evidencia...");
      
      const response = await axios.get(
        `${apiBaseUrl}/api/expenses/evidencia/${filename}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const getContentType = (filename) => {
        const extension = filename.toLowerCase().split('.').pop();
        const mimeTypes = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'gif': 'image/gif',
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'txt': 'text/plain'
        };
        return mimeTypes[extension] || 'application/octet-stream';
      };

      const contentType = getContentType(filename);
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      
      if (contentType.startsWith('image/')) {
        const newWindow = window.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${filename}</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                background: #f0f0f0; 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                min-height: 100vh; 
              }
              img { 
                max-width: 100%; 
                max-height: 100vh; 
                box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
                background: white; 
                border-radius: 8px;
              }
            </style>
          </head>
          <body>
            <img src="${url}" alt="${filename}" />
          </body>
          </html>
        `);
      } else if (contentType === 'application/pdf') {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMsg("Archivo descargado ✅");
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 10000);
      
      if (contentType.startsWith('image/') || contentType === 'application/pdf') {
        setMsg("Evidencia abierta exitosamente ✅");
      }
    } catch (error) {
      console.error('Error viewing evidencia:', error);
      if (error.response?.status === 401) {
        setMsg("Error de autenticación ❌");
      } else if (error.response?.status === 404) {
        setMsg("Archivo no encontrado ❌");
      } else {
        setMsg("Error al cargar evidencia ❌");
      }
    } finally {
      setLoading(false);
    }
  };

const handleCancelar = () => {
  setConcepto("");
  setProveedor("");
  setMonto("");
  setMetodoPago("efectivo");
  setEvidencia(null);
  
  // ✅ MODIFICADO: Solo limpiar tienda si es admin
  if (canSelectMultipleStores) {
    setTiendaSeleccionada("");
  }
  
  setMostrarFormulario(false);
  setUsarProveedorManual(false);
  setBusquedaProveedor("");
  setProveedoresEncontrados([]);
  const fileInput = document.querySelector('input[type="file"]');
  if (fileInput) fileInput.value = '';
};

  const safeReportData = Array.isArray(reportData) ? reportData : [];

  const getExpenseStats = () => {
    return {
      total: safeReportData.length,
      pendientes: safeReportData.filter(g => g.status === 'pendiente').length,
      aprobados: safeReportData.filter(g => g.status === 'aprobado').length,
      denegados: safeReportData.filter(g => g.status === 'denegado').length,
      montoTotal: safeReportData.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0),
      montoAprobado: safeReportData
        .filter(g => g.status === 'aprobado')
        .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
    };
  };

  const stats = getExpenseStats();

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

 const getStatusConfig = (status) => {
    const configs = {
      'pendiente': { color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏳' },
      'aprobado': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '✅' },
      'denegado': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '❌' },
      'en revision': { color: '#8b5cf6', bgColor: 'bg-purple-100', textColor: 'text-purple-800', icon: '🔍' }
    };
    return configs[status] || { color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📋' };
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'efectivo': '💵',
      'transferencia': '🏦',
      'tarjeta': '💳'
    };
    return icons[method] || '💰';
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

              {/* ✅ NUEVO: Campo de proveedor con dropdown */}
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
                            onClick={() => {
                              setProveedor(prov);
                              setBusquedaProveedor(prov);
                              setProveedoresEncontrados([]);
                              setUsarProveedorManual(false);
                            }}
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
                onClick={loadExpenses}
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
                                  onClick={() => viewEvidencia(gasto.evidencia)}
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
                                {/* ✅ NUEVO: Mensaje local del formulario de edición */}
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
                                    onClick={() => {
                                      setEditingGastoId(null);
                                      setNewStatus("");
                                      setAdminNote("");
                                    }}
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
