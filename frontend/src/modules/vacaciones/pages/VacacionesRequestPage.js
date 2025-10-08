import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../../../config/api";
import { useVacacionesData, useVacacionesForm } from '../hooks';
import { VacationDaysInfo, VacationForm } from '../components';

export default function EmployeeVacationRequestPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);

  // Hooks personalizados
  const {
    users,
    replacementOptions,
    daysAvailable,
    daysSummary,
    loading,
    updatingDays,
    msg,
    setMsg,
    loadUsers,
    loadDaysAvailable,
    loadDaysSummary,
    loadReplacementOptions,
    updateTakenDays,
    createRequest,
    handleAuthError
  } = useVacacionesData();

  const {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    replacement,
    setReplacement,
    tienda,
    setTienda,
    selectedEmployeeId,
    setSelectedEmployeeId,
    calculateDays,
    validateForm,
    clearForm
  } = useVacacionesForm();

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
        setCurrentUser(res.data);

        // Manejar diferentes formatos de tienda
        let userTienda = null;

        if (res.data.tienda) {
          if (typeof res.data.tienda === 'object' && res.data.tienda._id) {
            userTienda = res.data.tienda._id;
          } else if (typeof res.data.tienda === 'string') {
            userTienda = res.data.tienda;
          }
        }

        setTienda(userTienda || "");
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
      loadUsers();
    }
  }, [currentUser, loadUsers]);

  // Cargar días disponibles cuando se selecciona un empleado
  useEffect(() => {
    const targetId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;

    if (targetId) {
      loadDaysAvailable(targetId);
      loadDaysSummary(targetId);
    }
  }, [selectedEmployeeId, currentUser, loadDaysAvailable, loadDaysSummary]);

  // Cargar opciones de reemplazo
  useEffect(() => {
    if (!currentUser || !tienda) {
      return;
    }

    // Para admins, esperar selección de empleado
    if (currentUser.role === "admin" && !selectedEmployeeId) {
      return;
    }

    // Limpiar selección anterior
    setReplacement("");

    // Obtener ID y rol del empleado actual
    let currentEmployeeId;
    let currentEmployeeRole;

    if (currentUser.role === "admin") {
      // Admin seleccionó un empleado
      const selectedUser = users.find(u => u._id === selectedEmployeeId);
      currentEmployeeId = selectedEmployeeId;
      currentEmployeeRole = selectedUser?.role;
    } else {
      // Usuario normal
      currentEmployeeId = currentUser._id;
      currentEmployeeRole = currentUser.role;
    }

    // Cargar opciones con filtro de rol
    if (currentEmployeeRole) {
      loadReplacementOptions(tienda, currentEmployeeId, currentEmployeeRole);
    }
  }, [currentUser, selectedEmployeeId, tienda, users, loadReplacementOptions]);

  // Handler para cambio de empleado (admin)
  const handleEmployeeChange = (employeeId) => {
    console.log('🔄 Employee changed to:', employeeId);
    setSelectedEmployeeId(employeeId);
    setReplacement("");

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

  // Handler para enviar solicitud
  const handleSubmit = async () => {
    const validation = validateForm(currentUser, daysAvailable);

    if (!validation.valid) {
      setMsg(validation.message);
      return;
    }

    try {
      const requestData = {
        startDate,
        endDate,
        replacement: replacement || undefined,
        tienda,
      };

      // Si es admin, agregar el employeeId
      if (currentUser?.role === 'admin' && selectedEmployeeId) {
        requestData.employeeId = selectedEmployeeId;
      }

      await createRequest(requestData);

      // Limpiar formulario
      clearForm(currentUser);

      // Recargar días disponibles
      const targetId = currentUser?.role === "admin" ? selectedEmployeeId : currentUser?._id;
      if (targetId) {
        loadDaysAvailable(targetId);
        loadDaysSummary(targetId);
      }
    } catch (error) {
      // Error ya manejado en createRequest
    }
  };

  // Handler para actualizar días tomados
  const handleUpdateTakenDays = async () => {
    if (currentUser?.role !== 'admin') {
      setMsg('❌ Solo los administradores pueden actualizar días tomados');
      return;
    }

    const targetId = selectedEmployeeId || currentUser?._id;
    await updateTakenDays(targetId);
  };

  // Mostrar loading inicial
  if (initialLoading) {
    return (
      <div className="p-4">
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
      <VacationDaysInfo
        daysAvailable={daysAvailable}
        daysSummary={daysSummary}
        currentUser={currentUser}
        updatingDays={updatingDays}
        onUpdateTakenDays={handleUpdateTakenDays}
      />

      {/* Mensajes */}
      {msg && (
        <div className={`mb-4 p-3 rounded ${
          msg.includes('✅') ? 'bg-green-100 text-green-700 border border-green-400' :
          msg.includes('⚠️') || msg.includes('❌') || msg.includes('🔐') ? 'bg-red-100 text-red-700 border border-red-400' :
          'bg-blue-100 text-blue-700 border border-blue-400'
        }`}>
          {msg}
        </div>
      )}

      {/* Formulario */}
      <VacationForm
        currentUser={currentUser}
        users={users}
        selectedEmployeeId={selectedEmployeeId}
        onEmployeeChange={handleEmployeeChange}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        tienda={tienda}
        replacement={replacement}
        setReplacement={setReplacement}
        replacementOptions={replacementOptions}
        calculateDays={calculateDays}
        daysAvailable={daysAvailable}
        loading={loading}
        onSubmit={handleSubmit}
      />

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
