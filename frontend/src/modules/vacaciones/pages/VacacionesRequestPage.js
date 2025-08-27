import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function EmployeeVacationRequestPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [replacementOptions, setReplacementOptions] = useState([]);
  const [daysAvailable, setDaysAvailable] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [replacement, setReplacement] = useState("");
  const [tienda, setTienda] = useState("");
  const [msg, setMsg] = useState("");
  const [daysSummary, setDaysSummary] = useState(null);
  const [updatingDays, setUpdatingDays] = useState(false);

  // Función para manejar errores de autenticación
  const handleAuthError = (error) => {
    console.error('Auth Error:', error);
    
    if (error.response?.status === 401 || error.response?.status === 403) {
      setMsg("🔐 Sesión expirada o token inválido. Inicia sesión nuevamente.");
      localStorage.removeItem("token");
      setTimeout(() => window.location.href = "/login", 2000);
    } else {
      setMsg(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
  };

  // ✅ NUEVA FUNCIÓN: Cargar resumen de días tomados
  const loadDaysSummary = (userId) => {
    axios
      .get(`${apiBaseUrl}/api/vacations/days-summary/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setDaysSummary(res.data);
        console.log('✅ Days summary loaded:', res.data);
      })
      .catch((error) => {
        console.error('❌ Error loading days summary:', error);
        setDaysSummary(null);
      });
  };

  // ✅ NUEVA FUNCIÓN: Actualizar días tomados automáticamente (solo admin)
  const updateTakenDays = async () => {
    if (currentUser?.role !== 'admin') {
      setMsg('❌ Solo los administradores pueden actualizar días tomados');
      return;
    }

    setUpdatingDays(true);
    setMsg('');

    try {
      const response = await axios.post(`${apiBaseUrl}/api/vacations/update-taken-days`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMsg(`✅ ${response.data.message}`);
      
      // Recargar datos después de la actualización
      const targetId = selectedEmployeeId || currentUser?._id;
      if (targetId) {
        axios
          .get(`${apiBaseUrl}/api/vacations/days-available/${targetId}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((res) => {
            setDaysAvailable(res.data);
            loadDaysSummary(targetId);
          })
          .catch(console.error);
      }
    } catch (error) {
      console.error('Error updating taken days:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error actualizando días tomados'}`);
    } finally {
      setUpdatingDays(false);
    }
  };

  // ✅ NUEVO: Función para cargar opciones de reemplazo usando el nuevo endpoint
  const fetchReplacementOptions = (tiendaId) => {
    if (!tiendaId) {
      console.log('⚠️ No tiendaId provided, clearing replacement options');
      setReplacementOptions([]);
      return;
    }
    
    console.log('🔍 Fetching replacement options for store:', tiendaId);
    
    // ✅ Usar el nuevo endpoint específico para reemplazos
    axios
      .get(`${apiBaseUrl}/api/users/replacements/${tiendaId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('✅ Replacement options loaded from new endpoint:', res.data.length);
        
        const currentEmployeeId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;
        
        // Filtrar el empleado actual si no se hizo en backend
        const filtered = res.data.filter(user => user._id !== currentEmployeeId);
        
        setReplacementOptions(filtered);
        console.log('✅ Final replacement options:', filtered.length);
        console.log('📋 Available replacements:', filtered.map(u => ({
          name: u.username,
          role: u.role,
          id: u._id
        })));
      })
      .catch((error) => {
        console.error('❌ Error loading replacement options from new endpoint:', error);
        
        // ✅ Si el nuevo endpoint falla, usar fallback automático
        console.log('🔄 Falling back to manual filtering...');
        fetchReplacementsFallback(tiendaId);
      });
  };

  // ✅ NUEVO: Fallback usando el endpoint existente con filtrado manual
  const fetchReplacementsFallback = (targetStoreId) => {
    console.log('🔄 Using existing /api/users endpoint with manual filtering...');
    
    const currentEmployeeId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;
    
    axios
      .get(`${apiBaseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('✅ All users loaded for manual filtering:', res.data.length);
        
        const filtered = res.data.filter((user) => {
          // ✅ Normalizar ID de tienda
          let userStoreId = null;
          
          if (user.tienda) {
            if (typeof user.tienda === 'object' && user.tienda._id) {
              userStoreId = user.tienda._id;
            } else if (typeof user.tienda === 'string') {
              userStoreId = user.tienda;
            }
          }
          
          // Convertir a string para comparación
          const userStoreStr = userStoreId ? userStoreId.toString() : null;
          const targetStoreStr = targetStoreId ? targetStoreId.toString() : null;
          
          const isSameStore = userStoreStr === targetStoreStr;
          const isDifferentUser = user._id !== currentEmployeeId;
          const hasStore = !!userStoreId;
          
          console.log(`🔍 User ${user.username}: store=${userStoreStr}, target=${targetStoreStr}, same=${isSameStore}, diff=${isDifferentUser}, hasStore=${hasStore}`);
          
          return isSameStore && isDifferentUser && hasStore;
        });
        
        setReplacementOptions(filtered);
        console.log('✅ Manual filtering complete:', filtered.length);
        console.log('📋 Final options:', filtered.map(u => u.username));
      })
      .catch((error) => {
        console.error('❌ Error in fallback method:', error);
        handleAuthError(error);
        setReplacementOptions([]);
      });
  };

  // ✅ NUEVO: Función principal para cargar opciones de reemplazo
  const loadReplacementOptions = (tiendaId) => {
    if (!tiendaId) {
      setReplacementOptions([]);
      return;
    }
    
    // Intentar endpoint específico primero, fallback automático si falla
    fetchReplacementOptions(tiendaId);
  };

  // Obtener usuario actual
  useEffect(() => {
    if (!token) {
      setMsg("🔐 No hay token de autenticación. Por favor, inicia sesión.");
      setInitialLoading(false);
      return;
    }

    console.log('🔍 Fetching current user...');
    axios
      .get(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('✅ Current user loaded:', res.data);
        console.log('🔍 Current user tienda field:', res.data.tienda);
        console.log('🔍 Tienda type:', typeof res.data.tienda);
        
        setCurrentUser(res.data);
        
        // ✅ MEJORADO: Manejar diferentes formatos de tienda
        let userTienda = null;
        
        if (res.data.tienda) {
          if (typeof res.data.tienda === 'object' && res.data.tienda._id) {
            // Caso: tienda poblada {_id: "...", nombre: "..."}
            userTienda = res.data.tienda._id;
            console.log('🏪 Using populated tienda._id:', userTienda);
          } else if (typeof res.data.tienda === 'string') {
            // Caso: tienda como string/ObjectId "..."
            userTienda = res.data.tienda;
            console.log('🏪 Using direct tienda string:', userTienda);
          } else {
            console.log('⚠️ Unknown tienda format:', res.data.tienda);
          }
        } else {
          console.log('❌ No tienda found in user data');
        }
        
        setTienda(userTienda || "");
        console.log('🏪 Final store set to:', userTienda);
        
        setMsg("");
      })
      .catch((error) => {
        console.error('❌ Error fetching user:', error);
        handleAuthError(error);
      })
      .finally(() => setInitialLoading(false));
  }, [token]);

  // Si es admin, cargar todos los usuarios
  useEffect(() => {
    if (currentUser?.role === "admin") {
      console.log('🔍 Loading users for admin...');
      axios
        .get(`${apiBaseUrl}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUsers(res.data);
          console.log('✅ Users loaded:', res.data.length);
        })
        .catch(handleAuthError);
    }
  }, [currentUser, token]);

  // Cargar días disponibles cuando se selecciona un empleado
  useEffect(() => {
    const targetId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;
    
    if (targetId) {
      console.log('🔍 Loading available days for:', targetId);
      axios
        .get(`${apiBaseUrl}/api/vacations/days-available/${targetId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setDaysAvailable(res.data);
          console.log('✅ Days available loaded:', res.data);
          
          // También cargar el resumen de días
          loadDaysSummary(targetId);
        })
        .catch((error) => {
          console.error('❌ Error loading available days:', error);
          setDaysAvailable(null);
        });
    }
  }, [selectedEmployeeId, currentUser, token]);

  // ✅ NUEVO: Efecto para cargar opciones de reemplazo
  useEffect(() => {
    console.log('🔍 Loading replacement options...');
    console.log('Current user:', currentUser?.username);
    console.log('Selected employee:', selectedEmployeeId);
    console.log('Target store:', tienda);
    
    if (!currentUser) {
      console.log('⚠️ No current user');
      setReplacementOptions([]);
      return;
    }
    
    if (!tienda) {
      console.log('⚠️ No tienda selected');
      setReplacementOptions([]);
      return;
    }
    
    // Para admins, esperar selección de empleado
    if (currentUser.role === "admin" && !selectedEmployeeId) {
      console.log('⚠️ Admin mode but no employee selected');
      setReplacementOptions([]);
      return;
    }
    
    // Limpiar selección anterior
    setReplacement("");
    
    // Cargar opciones usando el nuevo sistema
    loadReplacementOptions(tienda);
    
  }, [currentUser?._id, selectedEmployeeId, tienda, token]);

  // ✅ NUEVO: Función mejorada para cambio de empleado
  const handleEmployeeChange = (employeeId) => {
    console.log('🔄 Employee changed to:', employeeId);
    setSelectedEmployeeId(employeeId);
    setReplacement(""); // Limpiar reemplazo
    
    if (currentUser?.role === "admin" && employeeId) {
      const selectedUser = users.find(u => u._id === employeeId);
      if (selectedUser) {
        let newTienda = null;
        
        if (typeof selectedUser.tienda === 'object' && selectedUser.tienda?._id) {
          newTienda = selectedUser.tienda._id;
        } else if (typeof selectedUser.tienda === 'string') {
          newTienda = selectedUser.tienda;
        }
        
        setTienda(newTienda || "");
        console.log('🏪 Store updated for selected employee:', newTienda);
      }
    }
  };

  const handleSubmit = () => {
    const targetEmployee = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;

    if (!targetEmployee || !startDate || !endDate || !tienda) {
      setMsg("⚠️ Completa todos los campos obligatorios.");
      return;
    }

    // Validar fechas
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (start >= end) {
      setMsg("⚠️ La fecha de inicio debe ser anterior a la fecha de fin.");
      return;
    }

    if (start < today) {
      setMsg("⚠️ La fecha de inicio no puede ser anterior a hoy.");
      return;
    }

    // Verificar días disponibles
    const requestedDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    if (daysAvailable && requestedDays > daysAvailable.availableDays) {
      setMsg(`⚠️ Solo tienes ${daysAvailable.availableDays} días disponibles. Solicitas ${requestedDays} días.`);
      return;
    }

    setLoading(true);
    console.log('🔍 Submitting vacation request...');
    console.log('📋 Request data:', {
      startDate,
      endDate,
      replacement: replacement || undefined,
      tienda,
      targetEmployee
    });

    // Usar endpoint existente
    axios
      .post(
        `${apiBaseUrl}/api/vacations/request`,
        {
          startDate,
          endDate,
          replacement: replacement || undefined,
          tienda,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('✅ Vacation request submitted:', response.data);
        setMsg(`✅ ${response.data.message}`);
        // Limpiar formulario
        setStartDate("");
        setEndDate("");
        setReplacement("");
        if (currentUser?.role === "admin") {
          setSelectedEmployeeId("");
          setTienda("");
        }
        // Recargar días disponibles
        const targetId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;
        if (targetId) {
          axios
            .get(`${apiBaseUrl}/api/vacations/days-available/${targetId}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => setDaysAvailable(res.data))
            .catch(() => {});
        }
      })
      .catch((error) => {
        console.error('❌ Error submitting vacation request:', error);
        const errorMsg = error.response?.data?.message || error.message;
        setMsg(`❌ ${errorMsg}`);
      })
      .finally(() => setLoading(false));
  };

  // Calcular días de vacaciones
  const calculateDays = () => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  // Mostrar loading inicial
  if (initialLoading) {
    return (
      <div className="p-4">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/empleados')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Empleados
          </button>
          <h2 className="text-xl font-bold">🏖️ Solicitar Vacaciones</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay token
  if (!token) {
    return (
      <div className="p-4">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/empleados')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Empleados
          </button>
          <h2 className="text-xl font-bold">🏖️ Solicitar Vacaciones</h2>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>🔐 No hay token de autenticación. Por favor, inicia sesión.</p>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => window.location.href = "/login"}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Ir al Login
            </button>
            <button 
              onClick={() => navigate('/admin/empleados')}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Volver a Empleados
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Header con botón de regreso */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/empleados')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 font-medium"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Empleados
        </button>
        <h2 className="text-xl font-bold">🏖️ Solicitar Vacaciones</h2>
      </div>

      {/* Información del usuario actual */}
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            👤 Usuario: <strong>{currentUser.username}</strong> 
            ({currentUser.role === 'admin' ? 'Administrador' : 
              currentUser.role === 'repartidor' ? 'Repartidor' : 'Vendedor'})
            {currentUser.tienda && ` - Tienda: ${currentUser.tienda.nombre || currentUser.tienda}`}
          </p>
        </div>
      )}

     

      {/* Información de días disponibles */}
      {daysAvailable ? (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-green-800">📅 Información de Vacaciones</h3>
            {currentUser?.role === 'admin' && (
              <button
                onClick={updateTakenDays}
                disabled={updatingDays}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {updatingDays ? 'Actualizando...' : 'Actualizar Días Tomados'}
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-green-600">Años de servicio</p>
              <p className="font-bold text-green-800">{daysAvailable.yearsOfService} años</p>
            </div>
            <div>
              <p className="text-green-600">Días totales</p>
              <p className="font-bold text-green-800">{daysAvailable.totalDays} días</p>
            </div>
            <div>
              <p className="text-green-600">Días tomados</p>
              <p className="font-bold text-green-800">{daysAvailable.takenDays} días</p>
            </div>
            <div>
              <p className="text-green-600">Días disponibles</p>
              <p className="font-bold text-green-800">{daysAvailable.availableDays} días</p>
            </div>
          </div>

          {/* ✅ NUEVO: Resumen detallado de días tomados */}
          {daysSummary && (
            <div className="mt-4 pt-3 border-t border-green-200">
              <h4 className="font-medium text-green-800 mb-2">📊 Resumen Detallado {daysSummary.year}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div>
                  <p className="text-green-600">Días tomados (registrados)</p>
                  <p className="font-bold text-green-800">{daysSummary.summary.totalRecordedTaken} días</p>
                </div>
                <div>
                  <p className="text-green-600">Días tomados (calculados)</p>
                  <p className="font-bold text-green-800">{daysSummary.summary.calculatedTaken} días</p>
                </div>
                <div>
                  <p className="text-green-600">Días pendientes</p>
                  <p className="font-bold text-blue-800">{daysSummary.summary.pendingToTake} días</p>
                </div>
                <div>
                  <p className="text-green-600">Total aprobado</p>
                  <p className="font-bold text-green-800">{daysSummary.summary.totalApproved} días</p>
                </div>
              </div>

              {/* Mostrar diferencia si existe */}
              {daysSummary.summary.totalRecordedTaken !== daysSummary.summary.calculatedTaken && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-yellow-800 text-xs">
                    ⚠️ Discrepancia detectada: {Math.abs(daysSummary.summary.totalRecordedTaken - daysSummary.summary.calculatedTaken)} días de diferencia.
                    {currentUser?.role === 'admin' && ' Usa "Actualizar Días Tomados" para sincronizar.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      ) : currentUser && (currentUser.role !== "admin" || selectedEmployeeId) ? (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="font-medium text-yellow-800 mb-2">⚠️ Sin información de vacaciones</h3>
          <p className="text-sm text-yellow-700">
            No se pudieron cargar los días disponibles. Posibles causas:
          </p>
          <ul className="text-xs text-yellow-600 mt-1 ml-4">
            <li>• No tienes una fecha de ingreso válida en el sistema</li>
            <li>• Aún no cumples el tiempo mínimo de antigüedad (1 año)</li>
            <li>• Error temporal del servidor</li>
          </ul>
          <p className="text-xs text-yellow-600 mt-2">
            <strong>Puedes enviar la solicitud de todas formas.</strong> El administrador validará si tienes días suficientes.
          </p>
        </div>
      ) : null}

      {msg && (
        <div className={`mb-4 p-3 rounded ${
          msg.includes('✅') ? 'bg-green-100 text-green-700 border border-green-400' : 
          msg.includes('⚠️') || msg.includes('❌') || msg.includes('🔐') ? 'bg-red-100 text-red-700 border border-red-400' : 
          'bg-blue-100 text-blue-700 border border-blue-400'
        }`}>
          {msg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Solo admin puede seleccionar al empleado */}
        {currentUser?.role === "admin" && (
          <div>
            <label className="block text-sm font-medium mb-1">Empleado *</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Selecciona Empleado --</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.role}) - {u.tienda?.nombre || "Sin tienda"}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Inicio *</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Fecha de Fin *</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || new Date().toISOString().split('T')[0]}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* ✅ NUEVO: Select de reemplazo mejorado */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Reemplazo (opcional)
            {!tienda && 
              <span className="text-xs text-gray-500 ml-1">(Selecciona empleado primero)</span>
            }
            {tienda && replacementOptions.length === 0 && 
              <span className="text-xs text-red-500 ml-1">(No hay opciones en esta tienda)</span>
            }
            {tienda && replacementOptions.length > 0 && 
              <span className="text-xs text-green-500 ml-1">({replacementOptions.length} opciones disponibles)</span>
            }
          </label>
          <select
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
            disabled={!tienda || replacementOptions.length === 0}
          >
            <option value="">-- Selecciona Reemplazo --</option>
            {replacementOptions.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username} ({u.role})
                {u.tienda?.nombre && ` - ${u.tienda.nombre}`}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Solo empleados de la misma tienda pueden ser reemplazos
          </p>
          
        </div>
      </div>

      {/* Información de días calculados */}
      {startDate && endDate && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700">
            📅 <strong>Días solicitados:</strong> {calculateDays()} días
            <span className="ml-2 text-xs text-gray-500">
              (desde {new Date(startDate).toLocaleDateString('es-ES')} 
              hasta {new Date(endDate).toLocaleDateString('es-ES')})
            </span>
          </p>
          {daysAvailable && calculateDays() > daysAvailable.availableDays && (
            <p className="text-red-600 text-sm mt-1">
              ⚠️ Excedes tus días disponibles ({daysAvailable.availableDays} días)
            </p>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading || !startDate || !endDate || !tienda}
        className={`px-6 py-2 rounded text-white font-medium transition-colors ${
          loading || !startDate || !endDate || !tienda
            ? 'bg-gray-400 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500'
        }`}
      >
        {loading ? (
          <span className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Enviando...
          </span>
        ) : (
          "Enviar Solicitud"
        )}
      </button>

      {/* Información sobre el proceso */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información importante:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Tu solicitud será enviada al administrador para aprobación</li>
          <li>• Las fechas no pueden ser anteriores a hoy</li>
          <li>• El reemplazo debe ser un empleado de la misma tienda</li>
          <li>• Los días se calculan automáticamente según tu antigüedad</li>
          <li>• Recibirás una notificación del estado de tu solicitud</li>
        </ul>
      </div>
    </div>
  );
}