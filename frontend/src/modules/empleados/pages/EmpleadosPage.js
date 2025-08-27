import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";
import { Link } from "react-router-dom";

export default function EmployeesPage() {
  const [users, setUsers] = useState([]);
  const [msg, setMsg] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [absenceReason, setAbsenceReason] = useState("");
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [reportUser, setReportUser] = useState("");
  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [tiendaFiltro, setTiendaFiltro] = useState("");
  const [tiendas, setTiendas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarReporte, setMostrarReporte] = useState(false);
  const [reportMsg, setReportMsg] = useState("");
  // ✅ NUEVO: Estados para múltiples check-ins/check-outs
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [entryType, setEntryType] = useState("work");
  const [exitType, setExitType] = useState("break");

  useEffect(() => {
  // Cargar usuario actual
  axios
    .get(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      setCurrentUser(res.data);
      setSelectedUser(res.data._id);
      
      // ✅ MOVER LA LÓGICA AQUÍ - Después de cargar currentUser
      if (res.data.role === "admin") {
        // Admin no debe tener usuario pre-seleccionado
        setSelectedUser("");
        
        // Solo admin puede ver todos los empleados
        axios
          .get(`${apiBaseUrl}/api/users`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          .then((usersRes) => {
            const filtered = usersRes.data.filter(
              (u) => u.role === "vendedor" || u.role === "repartidor"
            );
            setUsers(filtered);
          })
          .catch(() => setMsg("Error al cargar empleados ❌"));
      } else {
        // ✅ Si no es admin, solo incluir el usuario actual
        setUsers([res.data]);
      }
    })
    .catch(() => setMsg("Error al cargar el usuario actual ❌"));

  // Cargar tiendas (mantener separado)
  axios
    .get(`${apiBaseUrl}/api/tiendas`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setTiendas(res.data))
    .catch(() => console.error("Error al cargar tiendas"));
}, [token]);

  // ✅ NUEVO: Función para cargar estado actual de asistencia
  const loadAttendanceStatus = () => {
    if (!selectedUser || selectedUser.trim() === "") return;
    
    axios
      .get(`${apiBaseUrl}/api/attendance/status`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Estado de asistencia:', res.data);
        setAttendanceStatus(res.data);
        setTimeEntries(res.data.timeEntries || []);
      })
      .catch((error) => {
        console.error('Error cargando estado de asistencia:', error);
      });
  };

  // ✅ NUEVO: Cargar estado cuando cambie el usuario seleccionado
  useEffect(() => {
    if (selectedUser && selectedUser.trim() !== "") {
      loadAttendanceStatus();
    }
  }, [selectedUser]);

  const handleCheckIn = () => {
    if (!selectedUser || selectedUser.trim() === "") {
      setMsg("Selecciona un empleado primero ❌");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    setLoading(true);
    axios
      .post(
        `${apiBaseUrl}/api/attendance/checkin`,
        { 
          userId: selectedUser, 
          tiendaId: currentUser?.tienda,
          entryType: entryType,
          notes: ""
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('Check-in response:', response.data);
        setMsg("Check-in exitoso ✅");
        loadAttendanceStatus(); // Recargar estado
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Check-in error:', error);
        let backendMsg = "Error al hacer check-in ❌";
        
        if (error.response?.data?.error === "NO_SCHEDULE_ASSIGNED") {
          backendMsg = error.response.data.message + " 📅";
        } else if (error.response?.data?.error === "ROUTE_NOT_FOUND") {
          backendMsg = error.response.data.message;
        } else {
          backendMsg = error.response?.data?.msg || 
                      error.response?.data?.message || 
                      error.response?.data?.error || 
                      backendMsg;
        }
        
        setMsg(backendMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleCheckOut = () => {
    if (!selectedUser || selectedUser.trim() === "") {
      setMsg("Selecciona un empleado primero ❌");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    setLoading(true);
    axios
      .post(
        `${apiBaseUrl}/api/attendance/checkout`,
        { 
          userId: selectedUser,
          exitType: exitType,
          notes: ""
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('Check-out response:', response.data);
        setMsg("Check-out exitoso ✅");
        loadAttendanceStatus(); // Recargar estado
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Check-out error:', error);
        let backendMsg = "Error al hacer check-out ❌";
        
        if (error.response?.data?.error === "NO_SCHEDULE_ASSIGNED") {
          backendMsg = error.response.data.message + " 📅";
        } else if (error.response?.data?.error === "ROUTE_NOT_FOUND") {
          backendMsg = error.response.data.message;
        } else {
          backendMsg = error.response?.data?.msg || 
                      error.response?.data?.message || 
                      error.response?.data?.error || 
                      backendMsg;
        }
        
        setMsg(backendMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAbsence = () => {
    if (!selectedUser || selectedUser.trim() === "") {
      setMsg("Selecciona un empleado primero ❌");
      setTimeout(() => setMsg(""), 3000);
      return;
    }
    
    if (!absenceReason.trim()) {
      setMsg("Proporciona una razón de ausencia ❌");
      setTimeout(() => setMsg(""), 3000);
      return;
    }

    setLoading(true);
    axios
      .post(
        `${apiBaseUrl}/api/attendance/absence`,
        { userId: selectedUser, reason: absenceReason },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .then((response) => {
        console.log('Absence response:', response.data);
        setMsg("Falta registrada exitosamente ✅");
        setAbsenceReason("");
        setTimeout(() => setMsg(""), 3000);
      })
      .catch((error) => {
        console.error('Absence error:', error);
        let backendMsg = "Error al registrar falta ❌";
        
        if (error.response?.data?.error === "NO_SCHEDULE_ASSIGNED") {
          backendMsg = error.response.data.message + " 📅";
        } else if (error.response?.data?.error === "ROUTE_NOT_FOUND") {
          backendMsg = error.response.data.message;
        } else {
          backendMsg = error.response?.data?.msg || 
                      error.response?.data?.message || 
                      error.response?.data?.error || 
                      backendMsg;
        }
        
        setMsg(backendMsg);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const loadAttendanceReport = () => {
    if (!reportStartDate || !reportEndDate) {
      setReportMsg("Debes seleccionar una fecha de inicio y fin para el reporte ❌");
      setTimeout(() => setReportMsg(""), 3000);
      return;
    }

    // Validar que la fecha de fin no sea anterior a la fecha de inicio
    if (reportStartDate > reportEndDate) {
      setReportMsg("La fecha 'hasta' no puede ser anterior a la fecha 'desde' ❌");
      setTimeout(() => setReportMsg(""), 3000);
      return;
    }

    setLoading(true);
    setReportMsg("");

    console.log('Loading report with params:', {
      userId: reportUser,
      startDate: reportStartDate,
      endDate: reportEndDate,
      tiendaId: tiendaFiltro
    });

    axios
      .get(`${apiBaseUrl}/api/attendance/report`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          userId: reportUser || undefined,
          startDate: reportStartDate,
          endDate: reportEndDate,
          tiendaId: tiendaFiltro || undefined,
        },
      })
      .then((res) => {
        console.log('Report response:', res.data);
        
        if (res.data && res.data.records) {
          setReportData(res.data.records);
          setReportStats(res.data.estadisticas);
          setReportMsg(`Reporte generado exitosamente ✅ - ${res.data.records.length} registros encontrados`);
        } else if (Array.isArray(res.data)) {
          setReportData(res.data);
          setReportStats(null);
          setReportMsg(`Reporte generado exitosamente ✅ - ${res.data.length} registros encontrados`);
        } else {
          setReportData([]);
          setReportStats(null);
          setReportMsg("No se encontraron registros para las fechas seleccionadas 📋");
        }
        setTimeout(() => setReportMsg(""), 5000);
      })
      .catch((error) => {
        console.error('Report error:', error);
        setReportData([]);
        setReportStats(null);
        setReportMsg("Error al cargar el reporte ❌");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const visibleUsers =
    currentUser?.role === "admin"
      ? users
      : users.filter((u) => u._id === currentUser?._id);

  const getStatusConfig = (status) => {
    const configs = {
      'Present': { color: '#10b981', bgColor: 'bg-green-100', textColor: 'text-green-800', icon: '✅', label: 'Presente' },
      'Late': { color: '#f59e0b', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', icon: '⏰', label: 'Tarde' },
      'Absent': { color: '#ef4444', bgColor: 'bg-red-100', textColor: 'text-red-800', icon: '❌', label: 'Ausente' }
    };
    return configs[status] || { color: '#6b7280', bgColor: 'bg-gray-100', textColor: 'text-gray-800', icon: '📋', label: status };
  };

  const formatTime = (timeString) => {
    if (!timeString) return "-";
    return new Date(timeString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
                Control de Asistencia
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona la asistencia y puntualidad de los empleados
              </p>
            </div>
            
            <div className="flex gap-3">
              <Link 
                to="/vacaciones"
                className="px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md"
                style={{ backgroundColor: '#46546b' }}
              >
                🏖️ Solicitar Vacaciones
              </Link>
              
              {currentUser?.role === "admin" && (
                <button
                  onClick={() => setMostrarReporte(!mostrarReporte)}
                  className="px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md"
                  style={{ 
                    backgroundColor: '#8c95a4',
                    color: 'white'
                  }}
                >
                  📊 {mostrarReporte ? "Ocultar" : "Ver"} Reportes
                </button>
              )}
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

        {/* ✅ NUEVO: Estado actual de asistencia */}
        {attendanceStatus && selectedUser && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
              📊 Estado Actual de Asistencia
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>Estado</div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {attendanceStatus.currentStatus?.message || 'No iniciado'}
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>Horas Trabajadas</div>
                <div className="text-lg font-bold text-green-600">
                  {attendanceStatus.hoursWorked || 0}h
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>Tiempo en Descansos</div>
                <div className="text-lg font-bold text-blue-600">
                  {Math.round((attendanceStatus.totalBreakTime || 0) / 60 * 100) / 100}h
                </div>
              </div>
              
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                <div className="text-sm font-medium" style={{ color: '#697487' }}>Entradas del Día</div>
                <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                  {timeEntries.length}
                </div>
              </div>
            </div>

            {/* Lista de entradas del día */}
            {timeEntries.length > 0 && (
              <div>
                <h4 className="text-md font-semibold mb-3" style={{ color: '#46546b' }}>
                  📝 Registro del Día
                </h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {timeEntries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                        <div>
                          <div className="text-sm font-medium">
                            {entry.type === 'work' ? '💼 Trabajo' : 
                             entry.type === 'break' ? '☕ Descanso' : 
                             entry.type === 'lunch' ? '🍽️ Almuerzo' : 'Entrada'}
                          </div>
                          <div className="text-xs text-gray-600">{entry.notes}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {new Date(entry.checkInTime).toLocaleTimeString('es-MX')}
                          {entry.checkOutTime && ` - ${new Date(entry.checkOutTime).toLocaleTimeString('es-MX')}`}
                        </div>
                        <div className="text-xs text-gray-600">
                          {entry.duration ? `${Math.round(entry.duration / 60 * 100) / 100}h` : 'En curso'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Control de asistencia principal */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6" style={{ color: '#23334e' }}>
            🕐 Registro de Asistencia
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Selector de empleado */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Seleccionar Empleado
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{ 
                  borderColor: '#e5e7eb',
                  focusRingColor: '#23334e'
                }}
                disabled={currentUser?.role !== "admin"}
              >
                <option value="">-- Selecciona un empleado --</option>
                {visibleUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.username} • {u.role === 'vendedor' ? 'Vendedor' : 'Repartidor'}
                  </option>
                ))}
              </select>
              
              {currentUser?.role !== "admin" && (
                <p className="text-xs mt-2" style={{ color: '#697487' }}>
                  Solo puedes registrar tu propia asistencia
                </p>
              )}
            </div>

            {/* ✅ NUEVO: Selectores de tipo */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tipo de Entrada
                  </label>
                  <select
                    value={entryType}
                    onChange={(e) => setEntryType(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="work">💼 Trabajo</option>
                    <option value="break">☕ Regreso de descanso</option>
                    <option value="lunch">🍽️ Regreso de almuerzo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tipo de Salida
                  </label>
                  <select
                    value={exitType}
                    onChange={(e) => setExitType(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="break">☕ Salir por descanso</option>
                    <option value="lunch">🍽️ Salir a almorzar</option>
                    <option value="end_day">🏠 Terminar jornada</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleCheckIn}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ 
                    backgroundColor: loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckIn) ? '#9ca3af' : '#10b981',
                    cursor: loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckIn) ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckIn)}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    "🟢"
                  )}
                  {attendanceStatus?.canCheckIn ? 
                    (attendanceStatus.currentStatus?.status === 'not_started' ? 'Iniciar Jornada' : 'Regresar') : 
                    'Check-in'
                  }
                </button>

                <button
                  onClick={handleCheckOut}
                  className="flex items-center justify-center gap-2 px-6 py-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ 
                    backgroundColor: loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckOut) ? '#9ca3af' : '#3b82f6',
                    cursor: loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckOut) ? 'not-allowed' : 'pointer'
                  }}
                  disabled={loading || !selectedUser || selectedUser.trim() === "" || (attendanceStatus && !attendanceStatus.canCheckOut)}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    "🔴"
                  )}
                  {exitType === 'end_day' ? 'Terminar Jornada' : 
                   exitType === 'lunch' ? 'Salir a Almorzar' : 
                   'Salir por Descanso'
                  }
                </button>
              </div>
              
              <div className="text-center text-sm" style={{ color: '#697487' }}>
                Hora actual: {new Date().toLocaleTimeString('es-MX')}
              </div>
            </div>
          </div>
        </div>

        {/* Registro de falta (solo admin) */}
        {currentUser?.role === "admin" && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#23334e' }}>
              ❌ Registrar Ausencia
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                  Motivo de la Ausencia
                </label>
                <textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Ej: Enfermedad, permiso personal, cita médica..."
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors resize-none"
                  style={{ 
                    borderColor: '#e5e7eb',
                    focusRingColor: '#23334e'
                  }}
                  rows="3"
                  disabled={loading}
                />
              </div>
              
              <button
                onClick={handleAbsence}
                className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg"
                style={{ 
                  backgroundColor: loading || !selectedUser || selectedUser.trim() === "" || !absenceReason.trim() ? '#9ca3af' : '#ef4444',
                  cursor: loading || !selectedUser || selectedUser.trim() === "" || !absenceReason.trim() ? 'not-allowed' : 'pointer'
                }}
                disabled={loading || !selectedUser || selectedUser.trim() === "" || !absenceReason.trim()}
              >
                {loading ? "Registrando Falta..." : "Registrar Ausencia"}
              </button>
            </div>
          </div>
        )}

        {/* Sección de reportes (solo admin) */}
        {currentUser?.role === "admin" && mostrarReporte && (
          <div className="space-y-8">
            {/* Filtros del reporte */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-6" style={{ color: '#23334e' }}>
                📊 Configuración del Reporte
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Empleado (Opcional)
                  </label>
                  <select
                    value={reportUser}
                    onChange={(e) => setReportUser(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todos los empleados</option>
                    {users.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.username} • {u.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Tienda (Opcional)
                  </label>
                  <select
                    value={tiendaFiltro}
                    onChange={(e) => setTiendaFiltro(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                    style={{ 
                      borderColor: '#e5e7eb',
                      focusRingColor: '#23334e'
                    }}
                  >
                    <option value="">Todas las tiendas</option>
                    {tiendas.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                    Período
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#697487' }}>
                        Desde
                      </label>
                      <input
                        type="date"
                        value={reportStartDate}
                        onChange={(e) => {
                          const newStartDate = e.target.value;
                          setReportStartDate(newStartDate);
                          
                          // Si la fecha de fin es anterior a la nueva fecha de inicio, ajustarla
                          if (reportEndDate && newStartDate > reportEndDate) {
                            setReportEndDate(newStartDate);
                          }
                        }}
                        className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors w-full"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1" style={{ color: '#697487' }}>
                        Hasta
                      </label>
                      <input
                        type="date"
                        value={reportEndDate}
                        onChange={(e) => setReportEndDate(e.target.value)}
                        min={reportStartDate}
                        className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors w-full"
                        style={{ 
                          borderColor: '#e5e7eb',
                          focusRingColor: '#23334e'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <button
                  onClick={loadAttendanceReport}
                  className="px-8 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg transform hover:scale-105"
                  style={{ backgroundColor: '#23334e' }}
                  disabled={loading || !reportStartDate || !reportEndDate}
                >
                  {loading ? "Generando Reporte..." : "📈 Generar Reporte"}
                </button>
                
                {/* Mensaje específico del reporte */}
                {reportMsg && (
                  <div className={`mt-4 p-4 rounded-lg border-l-4 ${
                    reportMsg.includes('✅') 
                      ? 'bg-green-50 border-green-400 text-green-800' 
                      : reportMsg.includes('📋')
                      ? 'bg-blue-50 border-blue-400 text-blue-800'
                      : 'bg-red-50 border-red-400 text-red-800'
                  }`}>
                    <p className="font-medium">{reportMsg}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Estadísticas del reporte */}
            {reportStats && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h4 className="text-lg font-semibold mb-6" style={{ color: '#23334e' }}>
                  📈 Estadísticas del Período
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">📋</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Total Registros
                    </div>
                    <div className="text-xl font-bold" style={{ color: '#23334e' }}>
                      {reportStats.totalRegistros}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">✅</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Presentes
                    </div>
                    <div className="text-xl font-bold text-green-600">
                      {reportStats.presentes}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">❌</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Ausentes
                    </div>
                    <div className="text-xl font-bold text-red-600">
                      {reportStats.ausentes}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">⏰</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Tardanzas
                    </div>
                    <div className="text-xl font-bold text-yellow-600">
                      {reportStats.tardes}
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">🕐</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Horas Totales
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {reportStats.totalHorasTrabajadas}h
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">📊</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      Promedio/Día
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {reportStats.promedioHorasPorDia}h
                    </div>
                  </div>
                  
                  <div className="text-center p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
                    <div className="text-2xl mb-1">📈</div>
                    <div className="text-sm font-medium" style={{ color: '#697487' }}>
                      % Asistencia
                    </div>
                    <div className="text-lg font-bold" style={{ color: '#23334e' }}>
                      {reportStats.porcentajeAsistencia}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabla de resultados */}
            {reportData.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b" style={{ borderColor: '#e5e7eb' }}>
                  <h4 className="text-lg font-semibold" style={{ color: '#23334e' }}>
                    📋 Registros de Asistencia
                  </h4>
                  <p className="text-sm mt-1" style={{ color: '#697487' }}>
                    Mostrando {reportData.filter(record => record.userId && record.userId.username).length} registro(s) válidos
                    {reportData.length > reportData.filter(record => record.userId && record.userId.username).length && 
                      ` (${reportData.length - reportData.filter(record => record.userId && record.userId.username).length} registros omitidos por usuarios eliminados)`
                    }
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: '#f4f6fa' }}>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                          Empleado
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                          Tienda
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                          Fecha
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                          Estado
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                          Entrada
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                          Salida
                        </th>
                        <th className="px-6 py-4 text-center text-sm font-semibold" style={{ color: '#23334e' }}>
                          Horas
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#23334e' }}>
                          Observaciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData
                        .filter(record => record.userId && record.userId.username) // ✅ Filtrar registros válidos
                        .map((record, index) => {
                        const statusConfig = getStatusConfig(record.status);
                        
                        return (
                          <tr 
                            key={record._id} 
                            className={`border-t hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                            style={{ borderColor: '#e5e7eb' }}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium" style={{ backgroundColor: '#23334e', color: 'white' }}>
                                  👤
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-sm" style={{ color: '#23334e' }}>
                                    {record.userId?.username || "Usuario eliminado"}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm">
                                      {record.userId?.role === 'vendedor' ? '🛒' : 
                                       record.userId?.role === 'repartidor' ? '🚚' : 
                                       '❓'}
                                    </span>
                                    <span className="text-xs font-medium" style={{ color: '#697487' }}>
                                      {record.userId?.role === 'vendedor' ? 'Vendedor' : 
                                       record.userId?.role === 'repartidor' ? 'Repartidor' : 
                                       'Rol desconocido'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">🏪</span>
                                <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                                  {record.tienda?.nombre || "Sin asignar"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium" style={{ color: '#46546b' }}>
                                {formatDate(record.date)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <div className="flex justify-center">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 text-xs rounded-full font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                                  <span className="text-sm">{statusConfig.icon}</span>
                                  <span>{statusConfig.label}</span>
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-sm font-medium" style={{ color: '#46546b' }}>
                                {formatTime(record.checkInTime)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="font-mono text-sm font-medium" style={{ color: '#46546b' }}>
                                {formatTime(record.checkOutTime)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-sm font-bold" style={{ color: '#23334e' }}>
                                {record.hoursWorked ? `${record.hoursWorked}h` : "-"}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm" style={{ color: '#697487' }}>
                                {record.absenceReason || record.notes || "-"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Estado vacío del reporte */}
            {!loading && reportData.length === 0 && reportStartDate && reportEndDate && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
                  No hay registros
                </h3>
                <p style={{ color: '#697487' }}>
                  No se encontraron registros de asistencia para el período seleccionado
                </p>
              </div>
            )}
          </div>
        )}

        {/* Indicador de carga global */}
        {loading && (
          <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border-l-4" style={{ borderColor: '#23334e' }}>
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