import React from 'react';

export default function VacationRequestsTable({
  requests,
  showDeleted,
  loading,
  updating,
  getStatusBadge,
  formatDate,
  calculateDaysRequested,
  onApprove,
  onReject,
  onDelete,
  onRestore
}) {
  return (
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
          {requests.length === 0 ? (
            <tr>
              <td colSpan="10" className="text-center p-8 text-gray-500">
                {loading ? 'Cargando solicitudes...' :
                 showDeleted ? 'No hay solicitudes eliminadas' : 'No hay solicitudes de vacaciones'}
              </td>
            </tr>
          ) : (
            requests.map((req) => (
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
                  {req.daysRequested || calculateDaysRequested(req.startDate, req.endDate)} días
                </td>
                <td className="p-3">{req.replacement?.username || '-'}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs border ${getStatusBadge(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="max-w-32 truncate" title={req.reason}>
                    {req.reason || '-'}
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
                        onClick={() => onRestore(req._id)}
                        disabled={updating === req._id}
                        className="block w-full text-blue-600 text-xs underline hover:text-blue-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Restaurar'}
                      </button>
                      <button
                        onClick={() => onDelete(req._id, 'hard')}
                        disabled={updating === req._id}
                        className="block w-full text-red-600 text-xs underline hover:text-red-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Eliminar Permanente'}
                      </button>
                    </div>
                  ) : req.status === 'pendiente' ? (
                    // Acciones para solicitudes pendientes
                    <div className="space-y-1">
                      <button
                        onClick={() => onApprove(req._id)}
                        disabled={updating === req._id}
                        className="block w-full text-green-600 text-xs underline hover:text-green-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => onReject(req._id)}
                        disabled={updating === req._id}
                        className="block w-full text-red-600 text-xs underline hover:text-red-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Rechazar'}
                      </button>
                      <button
                        onClick={() => onDelete(req._id, 'soft')}
                        disabled={updating === req._id}
                        className="block w-full text-orange-600 text-xs underline hover:text-orange-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Eliminar'}
                      </button>
                    </div>
                  ) : (
                    // Acciones para solicitudes procesadas
                    <div className="space-y-1">
                      <span className="text-xs text-gray-500 block">
                        {req.status === 'aprobada' ? 'Aprobada' : 'Rechazada'}
                      </span>
                      <button
                        onClick={() => onDelete(req._id, 'soft')}
                        disabled={updating === req._id}
                        className="block w-full text-orange-600 text-xs underline hover:text-orange-800 disabled:text-gray-400"
                      >
                        {updating === req._id ? '...' : 'Eliminar'}
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
  );
}
