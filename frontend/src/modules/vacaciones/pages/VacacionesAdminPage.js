import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function VacationsAdminPage() {
  const token = localStorage.getItem("token");
  const [requests, setRequests] = useState([]);
  const [deletedRequests, setDeletedRequests] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    limit: 50
  });

  // Estados para limpieza masiva
  const [cleanupOptions, setCleanupOptions] = useState({
    months: 12,
    status: 'all',
    action: 'soft'
  });

  // Verificar usuario actual al cargar
  useEffect(() => {
    if (!token) {
      setMsg("⚠️ No hay token de autenticación. Inicia sesión.");
      setLoading(false);
      return;
    }

    // Verificar que el usuario actual sea admin
    axios.get(`${apiBaseUrl}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setCurrentUser(res.data);
      if (res.data.role !== 'admin') {
        setMsg("⚠️ Solo los administradores pueden acceder a esta página.");
        setLoading(false);
        return;
      }
      loadRequests();
    })
    .catch(error => {
      console.error('Error al verificar usuario:', error);
      if (error.response?.status === 403) {
        setMsg("🔐 Token inválido o expirado. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setMsg("❌ Error al verificar autenticación.");
      }
      setLoading(false);
    });
  }, [token]);

  const loadRequests = () => {
    setLoading(true);
    
    // Construir query params para filtros
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.limit) params.append('limit', filters.limit);
    
    const queryString = params.toString();
    const url = `${apiBaseUrl}/api/vacations/all${queryString ? `?${queryString}` : ''}`;
    
    axios.get(url, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setRequests(res.data);
      setMsg("");
      console.log('✅ Vacation requests loaded:', res.data.length);
    })
    .catch(error => {
      console.error('Error al cargar solicitudes:', error);
      if (error.response?.status === 403) {
        setMsg("⚠️ No tienes permisos para ver las solicitudes de vacaciones.");
      } else if (error.response?.status === 401) {
        setMsg("🔐 Sesión expirada. Inicia sesión nuevamente.");
        localStorage.removeItem("token");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setMsg("❌ Error al cargar solicitudes de vacaciones.");
      }
    })
    .finally(() => setLoading(false));
  };

  const loadDeletedRequests = () => {
    setLoading(true);
    
    axios.get(`${apiBaseUrl}/api/vacations/deleted`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      setDeletedRequests(res.data);
      console.log('✅ Deleted vacation requests loaded:', res.data.length);
    })
    .catch(error => {
      console.error('Error al cargar solicitudes eliminadas:', error);
      setMsg("❌ Error al cargar solicitudes eliminadas.");
    })
    .finally(() => setLoading(false));
  };

  const updateStatus = (id, status, reason = "") => {
    if (updating === id) return; // Prevenir dobles clicks
    
    setUpdating(id);
    setMsg("");

    axios.patch(`${apiBaseUrl}/api/vacations/${id}/status`, { status, reason }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then((response) => {
      const statusText = status === 'aprobada' ? 'aprobada ✅' : 'rechazada ❌';
      setMsg(`${response.data.message || `Solicitud ${statusText}`}`);
      loadRequests(); // Recargar solicitudes
    })
    .catch(error => {
      console.error('Error al actualizar estado:', error);
      const errorMsg = error.response?.data?.message || "Error al actualizar el estado de la solicitud";
      if (error.response?.status === 403) {
        setMsg("⚠️ No tienes permisos para modificar solicitudes.");
      } else if (error.response?.status === 404) {
        setMsg("⚠️ Solicitud no encontrada.");
      } else {
        setMsg(`❌ ${errorMsg}`);
      }
    })
    .finally(() => setUpdating(null));
  };

  const handleReject = (id) => {
    const motivo = prompt("Ingresa el motivo del rechazo:");
    if (motivo && motivo.trim()) {
      updateStatus(id, "rechazada", motivo.trim());
    }
  };

  const handleDelete = (id, action = 'soft') => {
    const confirmText = action === 'hard' 
      ? "¿Estás seguro de eliminar PERMANENTEMENTE esta solicitud? Esta acción no se puede deshacer."
      : "¿Estás seguro de eliminar esta solicitud? Podrás restaurarla después.";
      
    if (!window.confirm(confirmText)) return;

    setUpdating(id);

    axios.delete(`${apiBaseUrl}/api/vacations/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { action }
    })
    .then(response => {
      setMsg(response.data.message + " ✅");
      loadRequests();
      if (showDeleted) loadDeletedRequests();
    })
    .catch(error => {
      console.error('Error al eliminar solicitud:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error al eliminar solicitud'}`);
    })
    .finally(() => setUpdating(null));
  };

  const handleRestore = (id) => {
    if (!window.confirm("¿Estás seguro de restaurar esta solicitud?")) return;

    setUpdating(id);

    axios.patch(`${apiBaseUrl}/api/vacations/${id}/restore`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(response => {
      setMsg(response.data.message + " ✅");
      loadDeletedRequests();
      loadRequests();
    })
    .catch(error => {
      console.error('Error al restaurar solicitud:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error al restaurar solicitud'}`);
    })
    .finally(() => setUpdating(null));
  };

  const handleCleanup = () => {
    if (!window.confirm(`¿Estás seguro de realizar limpieza ${cleanupOptions.action === 'hard' ? 'PERMANENTE' : 'temporal'} de solicitudes mayores a ${cleanupOptions.months} meses?`)) {
      return;
    }

    setLoading(true);
    setMsg("");

    axios.delete(`${apiBaseUrl}/api/vacations/cleanup`, {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        ...cleanupOptions,
        confirm: true
      }
    })
    .then(response => {
      setMsg(response.data.message + " ✅");
      setShowCleanupModal(false);
      loadRequests();
      if (showDeleted) loadDeletedRequests();
    })
    .catch(error => {
      console.error('Error en limpieza:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error en limpieza masiva'}`);
    })
    .finally(() => setLoading(false));
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    loadRequests();
  };

  const toggleDeletedView = () => {
    setShowDeleted(!showDeleted);
    if (!showDeleted) {
      loadDeletedRequests();
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pendiente: "bg-yellow-100 text-yellow-800 border-yellow-300",
      aprobada: "bg-green-100 text-green-800 border-green-300",
      rechazada: "bg-red-100 text-red-800 border-red-300"
    };
    
    return (
      <span className={`px-2 py-1 rounded text-xs border ${styles[status] || styles.pendiente}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Mostrar loading
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
  if (!loading && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Gestión de Vacaciones</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>⚠️ Solo los administradores pueden acceder a esta funcionalidad.</p>
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
          <p>🔐 No hay token de autenticación. Por favor, inicia sesión.</p>
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
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Gestión de Vacaciones</h1>
        <div className="flex gap-2">
          <button 
            onClick={toggleDeletedView}
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
            onClick={showDeleted ? loadDeletedRequests : loadRequests}
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
          <p className="text-sm text-blue-800">
            👤 Administrador: <strong>{currentUser.username}</strong>
            {showDeleted && <span className="ml-4 text-red-600">📂 Viendo solicitudes eliminadas</span>}
          </p>
        </div>
      )}

      {/* Filtros (solo para solicitudes activas) */}
      {!showDeleted && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h3 className="font-medium mb-2">Filtros</h3>
          <div className="flex gap-4 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange({ status: e.target.value })}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendientes</option>
                <option value="aprobada">Aprobadas</option>
                <option value="rechazada">Rechazadas</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Límite</label>
              <select
                value={filters.limit}
                onChange={(e) => handleFilterChange({ limit: e.target.value })}
                className="px-3 py-1 border rounded text-sm"
              >
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>
            <button
              onClick={applyFilters}
              className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700"
            >
              Aplicar
            </button>
          </div>
        </div>
      )}

      {/* Modal de limpieza masiva */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Limpieza Masiva de Solicitudes</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Eliminar solicitudes mayores a:</label>
                <select
                  value={cleanupOptions.months}
                  onChange={(e) => setCleanupOptions({...cleanupOptions, months: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="3">3 meses</option>
                  <option value="6">6 meses</option>
                  <option value="12">12 meses</option>
                  <option value="24">2 años</option>
                  <option value="36">3 años</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Estado de solicitudes:</label>
                <select
                  value={cleanupOptions.status}
                  onChange={(e) => setCleanupOptions({...cleanupOptions, status: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="all">Todas</option>
                  <option value="rechazada">Solo rechazadas</option>
                  <option value="aprobada">Solo aprobadas</option>
                  <option value="pendiente">Solo pendientes</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo de eliminación:</label>
                <select
                  value={cleanupOptions.action}
                  onChange={(e) => setCleanupOptions({...cleanupOptions, action: e.target.value})}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="soft">Soft Delete (Reversible)</option>
                  <option value="hard">Hard Delete (Permanente)</option>
                </select>
              </div>
              
              {cleanupOptions.action === 'hard' && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-red-800 text-sm">
                    ⚠️ <strong>Advertencia:</strong> La eliminación permanente no se puede deshacer.
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCleanup}
                className={`flex-1 px-4 py-2 rounded text-white font-medium ${
                  cleanupOptions.action === 'hard' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {cleanupOptions.action === 'hard' ? 'Eliminar Permanentemente' : 'Eliminar (Reversible)'}
              </button>
              <button
                onClick={() => setShowCleanupModal(false)}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`mb-4 p-3 rounded ${
          msg.includes('✅') ? 'bg-green-100 text-green-700 border border-green-400' : 
          msg.includes('⚠️') || msg.includes('❌') || msg.includes('🔐') ? 'bg-red-100 text-red-700 border border-red-400' : 
          'bg-blue-100 text-blue-700 border border-blue-400'
        }`}>
          {msg}
        </div>
      )}

      {/* Estadísticas rápidas */}
      {!showDeleted && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-xl font-bold">{requests.length}</p>
          </div>
          <div className="bg-yellow-50 p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Pendientes</p>
            <p className="text-xl font-bold text-yellow-800">
              {requests.filter(r => r.status === 'pendiente').length}
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Aprobadas</p>
            <p className="text-xl font-bold text-green-800">
              {requests.filter(r => r.status === 'aprobada').length}
            </p>
          </div>
          <div className="bg-red-50 p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Rechazadas</p>
            <p className="text-xl font-bold text-red-800">
              {requests.filter(r => r.status === 'rechazada').length}
            </p>
          </div>
        </div>
      )}

      {/* Estadísticas para eliminadas */}
      {showDeleted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="bg-red-50 p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Total Eliminadas</p>
            <p className="text-xl font-bold text-red-800">{deletedRequests.length}</p>
          </div>
          <div className="bg-orange-50 p-3 rounded shadow border">
            <p className="text-sm text-gray-600">Pueden Restaurarse</p>
            <p className="text-xl font-bold text-orange-800">{deletedRequests.length}</p>
          </div>
        </div>
      )}

      {/* Tabla de solicitudes */}
      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="table-auto w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left p-3">Empleado</th>
              <th className="text-left p-3">Tienda</th>
              <th className="text-left p-3">Fecha Inicio</th>
              <th className="text-left p-3">Fecha Fin</th>
              <th className="text-left p-3">Días</th>
              <th className="text-left p-3">Reemplazo</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Razón</th>
              <th className="text-left p-3">Fecha {showDeleted ? 'Eliminación' : 'Solicitud'}</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center p-8 text-gray-500">
                  {loading ? "Cargando solicitudes..." : 
                   showDeleted ? "No hay solicitudes eliminadas" : "No hay solicitudes de vacaciones"}
                </td>
              </tr>
            ) : (
              currentData.map((req) => (
                <tr key={req._id} className={`border-b hover:bg-gray-50 ${req.isDeleted ? 'bg-red-25' : ''}`}>
                  <td className="p-3">
                    <div>
                      <p className="font-medium">
                        {req.employee?.username || req.employeeInfo?.username || 'N/A'}
                        {req.isDeleted && ' (Eliminado)'}
                      </p>
                      <p className="text-xs text-gray-500">{req.employee?.email || ''}</p>
                    </div>
                  </td>
                  <td className="p-3">{req.tienda?.nombre || 'N/A'}</td>
                  <td className="p-3">{formatDate(req.startDate)}</td>
                  <td className="p-3">{formatDate(req.endDate)}</td>
                  <td className="p-3 font-medium">
                    {req.daysRequested || Math.ceil((new Date(req.endDate) - new Date(req.startDate)) / (1000 * 60 * 60 * 24)) + 1} días
                  </td>
                  <td className="p-3">{req.replacement?.username || "-"}</td>
                  <td className="p-3">{getStatusBadge(req.status)}</td>
                  <td className="p-3">
                    <div className="max-w-32 truncate" title={req.reason}>
                      {req.reason || "-"}
                    </div>
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {formatDate(showDeleted ? req.deletedAt : req.createdAt)}
                    {showDeleted && req.deletedBy && (
                      <div className="text-xs text-gray-400">
                        Por: {req.deletedBy.username}
                      </div>
                    )}
                  </td>
                  <td className="p-3">
                    {showDeleted ? (
                      // Acciones para solicitudes eliminadas
                      <div className="space-y-1">
                        <button 
                          onClick={() => handleRestore(req._id)}
                          disabled={updating === req._id}
                          className="block w-full text-blue-600 text-xs underline hover:text-blue-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Restaurar"}
                        </button>
                        <button 
                          onClick={() => handleDelete(req._id, 'hard')}
                          disabled={updating === req._id}
                          className="block w-full text-red-600 text-xs underline hover:text-red-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Eliminar Permanente"}
                        </button>
                      </div>
                    ) : req.status === 'pendiente' ? (
                      // Acciones para solicitudes pendientes
                      <div className="space-y-1">
                        <button 
                          onClick={() => updateStatus(req._id, "aprobada")}
                          disabled={updating === req._id}
                          className="block w-full text-green-600 text-xs underline hover:text-green-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Aprobar"}
                        </button>
                        <button 
                          onClick={() => handleReject(req._id)}
                          disabled={updating === req._id}
                          className="block w-full text-red-600 text-xs underline hover:text-red-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Rechazar"}
                        </button>
                        <button 
                          onClick={() => handleDelete(req._id, 'soft')}
                          disabled={updating === req._id}
                          className="block w-full text-orange-600 text-xs underline hover:text-orange-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    ) : (
                      // Acciones para solicitudes procesadas
                      <div className="space-y-1">
                        <span className="text-xs text-gray-500 block">
                          {req.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                        </span>
                        <button 
                          onClick={() => handleDelete(req._id, 'soft')}
                          disabled={updating === req._id}
                          className="block w-full text-orange-600 text-xs underline hover:text-orange-800 disabled:text-gray-400"
                        >
                          {updating === req._id ? "..." : "Eliminar"}
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Información adicional */}
      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-medium text-blue-900 mb-2">ℹ️ Información para administradores:</h3>
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