import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";
import {
  useVacacionesAdmin,
  useVacacionesFilters,
  useVacacionesCleanup,
  useVacacionesUtils
} from '../hooks';
import {
  VacationAdminFilters,
  VacationStats,
  VacationCleanupModal,
  VacationRequestsTable
} from '../components';

const Icons = {
  user: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  ),
  folder: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
    </svg>
  ),
  lock: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
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

export default function VacationsAdminPage() {
  const token = localStorage.getItem("token");
  const [currentUser, setCurrentUser] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);

  // Hooks personalizados
  const {
    requests,
    deletedRequests,
    loading,
    updating,
    msg,
    setMsg,
    loadRequests,
    loadDeletedRequests,
    updateStatus,
    deleteRequest,
    restoreRequest,
    cleanupRequests
  } = useVacacionesAdmin();

  const {
    filters,
    updateFilters
  } = useVacacionesFilters();

  const {
    showCleanupModal,
    setShowCleanupModal,
    cleanupOptions,
    updateCleanupOptions
  } = useVacacionesCleanup();

  const {
    getStatusBadge,
    formatDate,
    calculateDaysRequested
  } = useVacacionesUtils();

  // Verificar usuario actual al cargar
  useEffect(() => {
    if (!token) {
      setMsg("No hay token de autenticación. Inicia sesión.");
      return;
    }

    axios.get(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setCurrentUser(res.data);
      if (res.data.role !== 'admin') {
        setMsg("Solo los administradores pueden acceder a esta página.");
        return;
      }
      loadRequests(filters);
    })
    .catch(error => {
      console.error('Error al verificar usuario:', error);
      if (error.response?.status === 403) {
        setMsg("Token inválido o expirado. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setMsg("Error al verificar autenticación.");
      }
    });
  }, [token]);

  // Handlers
  const handleApplyFilters = () => {
    loadRequests(filters);
  };

  const handleToggleDeletedView = () => {
    setShowDeleted(!showDeleted);
    if (!showDeleted) {
      loadDeletedRequests();
    }
  };

  const handleApprove = async (id) => {
    try {
      await updateStatus(id, 'aprobada');
      loadRequests(filters);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleReject = async (id) => {
    const motivo = prompt("Ingresa el motivo del rechazo:");
    if (motivo && motivo.trim()) {
      try {
        await updateStatus(id, 'rechazada', motivo.trim());
        loadRequests(filters);
      } catch (error) {
        // Error ya manejado en el hook
      }
    }
  };

  const handleDelete = async (id, action = 'soft') => {
    const confirmText = action === 'hard'
      ? "¿Estás seguro de eliminar PERMANENTEMENTE esta solicitud? Esta acción no se puede deshacer."
      : "¿Estás seguro de eliminar esta solicitud? Podrás restaurarla después.";

    if (!window.confirm(confirmText)) return;

    try {
      await deleteRequest(id, action);
      loadRequests(filters);
      if (showDeleted) loadDeletedRequests();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("¿Estás seguro de restaurar esta solicitud?")) return;

    try {
      await restoreRequest(id);
      loadDeletedRequests();
      loadRequests(filters);
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  const handleCleanup = async () => {
    if (!window.confirm(
      `¿Estás seguro de realizar limpieza ${cleanupOptions.action === 'hard' ? 'PERMANENTE' : 'temporal'} de solicitudes mayores a ${cleanupOptions.months} meses?`
    )) {
      return;
    }

    try {
      await cleanupRequests(cleanupOptions);
      setShowCleanupModal(false);
      loadRequests(filters);
      if (showDeleted) loadDeletedRequests();
    } catch (error) {
      // Error ya manejado en el hook
    }
  };

  // Mostrar loading inicial
  if (loading && !requests.length && !deletedRequests.length) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Gestión de Vacaciones</h1>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando solicitudes...</span>
        </div>
      </div>
    );
  }

  // Mostrar error si no es admin
  if (currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Gestión de Vacaciones</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="flex items-center gap-2">
            <Icons.warning />
            Solo los administradores pueden acceder a esta funcionalidad.
          </p>
        </div>
      </div>
    );
  }

  // Mostrar error si no hay token
  if (!token) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Gestión de Vacaciones</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="flex items-center gap-2">
            <Icons.lock />
            No hay token de autenticación. Por favor, inicia sesión.
          </p>
          <button
            onClick={() => window.location.href = "/login"}
            className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Ir al Login
          </button>
        </div>
      </div>
    );
  }

  const currentData = showDeleted ? deletedRequests : requests;

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Gestión de Vacaciones</h1>
        <div className="flex gap-2">
          <button
            onClick={handleToggleDeletedView}
            className={`px-3 py-1 rounded text-sm ${showDeleted ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'} hover:opacity-80`}
          >
            {showDeleted ? 'Ver Activas' : 'Ver Eliminadas'}
          </button>
          <button
            onClick={() => setShowCleanupModal(true)}
            className="bg-orange-600 text-white px-3 py-1 rounded text-sm hover:bg-orange-700"
          >
            Limpieza Masiva
          </button>
          <button
            onClick={showDeleted ? loadDeletedRequests : () => loadRequests(filters)}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>
        </div>
      </div>

      {/* Información del usuario */}
      {currentUser && (
        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <Icons.user />
            Administrador: <strong>{currentUser.username}</strong>
            {showDeleted && (
              <span className="ml-4 text-red-600 flex items-center gap-1">
                <Icons.folder />
                Viendo solicitudes eliminadas
              </span>
            )}
          </p>
        </div>
      )}

      {/* Filtros (solo para solicitudes activas) */}
      {!showDeleted && (
        <VacationAdminFilters
          filters={filters}
          onFilterChange={updateFilters}
          onApply={handleApplyFilters}
        />
      )}

      {/* Modal de limpieza masiva */}
      <VacationCleanupModal
        show={showCleanupModal}
        cleanupOptions={cleanupOptions}
        onUpdateOptions={updateCleanupOptions}
        onConfirm={handleCleanup}
        onCancel={() => setShowCleanupModal(false)}
      />

      {/* Mensajes */}
      {msg && (
        <div className={`mb-4 p-3 rounded ${
          msg.includes('aprobada') || msg.includes('rechazada') || msg.includes('eliminada') || msg.includes('restaurada') ? 'bg-green-100 text-green-700 border border-green-400' :
          msg.includes('Solo') || msg.includes('Error') || msg.includes('token') || msg.includes('inválido') ? 'bg-red-100 text-red-700 border border-red-400' :
          'bg-blue-100 text-blue-700 border border-blue-400'
        }`}>
          {msg}
        </div>
      )}

      {/* Estadísticas */}
      <VacationStats
        requests={requests}
        showDeleted={showDeleted}
        deletedRequests={deletedRequests}
      />

      {/* Tabla de solicitudes */}
      <VacationRequestsTable
        requests={currentData}
        showDeleted={showDeleted}
        loading={loading}
        updating={updating}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        calculateDaysRequested={calculateDaysRequested}
        onApprove={handleApprove}
        onReject={handleReject}
        onDelete={handleDelete}
        onRestore={handleRestore}
      />

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
          <Icons.info />
          Información para administradores:
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Las solicitudes pendientes requieren tu aprobación o rechazo</li>
          <li>• Al rechazar una solicitud, debes proporcionar un motivo</li>
          <li>• Puedes eliminar solicitudes viejas individualmente o en lote</li>
          <li>• El "Soft Delete" permite restaurar, el "Hard Delete" es permanente</li>
          <li>• Usa la "Limpieza Masiva" para eliminar solicitudes antiguas en lote</li>
          <li>• Los días se calculan automáticamente según la antigüedad del empleado</li>
        </ul>
      </div>
    </div>
  );
}
