import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import apiBaseUrl from "../../../config/api";
import { useVacacionesData, useVacacionesForm } from '../hooks';
import { VacationDaysInfo, VacationForm } from '../components';

const Icons = {
  vacation: () => (
    <svg className="w-6 h-6 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  user: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  lock: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  search: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  check: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  warning: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  ),
  info: () => (
    <svg className="w-5 h-5 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
  )
};

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
      setMsg("No hay token de autenticación. Por favor, inicia sesión.");
      setInitialLoading(false);
      return;
    }

    console.log('Fetching current user...');
    axios
      .get(`${apiBaseUrl}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log('Current user loaded:', res.data);
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
        console.error('Error fetching user:', error);
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
    console.log('Employee changed to:', employeeId);
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
        console.log('Store updated for selected employee:', newTienda);
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
      setMsg('Solo los administradores pueden actualizar días tomados');
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
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icons.vacation />
            Solicitar Vacaciones
          </h2>
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
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Icons.vacation />
            Solicitar Vacaciones
          </h2>
        </div>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="flex items-center gap-2">
            <Icons.lock />
            No hay token de autenticación. Por favor, inicia sesión.
          </p>
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
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Icons.vacation />
          Solicitar Vacaciones
        </h2>
      </div>

      {/* Información del usuario actual */}
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Icons.user />
            Usuario: <strong>{currentUser.username}</strong>
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
          msg.includes('actualizado') || msg.includes('éxito') || msg.includes('completado') ? 'bg-green-100 text-green-700 border border-green-400' :
          msg.includes('Solo') || msg.includes('Error') || msg.includes('token') ? 'bg-red-100 text-red-700 border border-red-400' :
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
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Icons.info />
          Información importante:
        </h3>
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
