import React from 'react';

export default function VacationCleanupModal({
  show,
  cleanupOptions,
  onUpdateOptions,
  onConfirm,
  onCancel
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
        <h3 className="text-lg font-bold mb-4">Limpieza Masiva de Solicitudes</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Eliminar solicitudes mayores a:</label>
            <select
              value={cleanupOptions.months}
              onChange={(e) => onUpdateOptions({ months: parseInt(e.target.value) })}
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
              onChange={(e) => onUpdateOptions({ status: e.target.value })}
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
              onChange={(e) => onUpdateOptions({ action: e.target.value })}
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
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 rounded text-white font-medium ${
              cleanupOptions.action === 'hard' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {cleanupOptions.action === 'hard' ? 'Eliminar Permanentemente' : 'Eliminar (Reversible)'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
