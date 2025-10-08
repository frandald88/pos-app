import React from 'react';

export default function VacationDaysInfo({
  daysAvailable,
  daysSummary,
  currentUser,
  updatingDays,
  onUpdateTakenDays
}) {
  if (!daysAvailable) {
    return (
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
    );
  }

  return (
    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-green-800">📅 Información de Vacaciones</h3>
        {currentUser?.role === 'admin' && (
          <button
            onClick={onUpdateTakenDays}
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

      {/* Resumen detallado de días tomados */}
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
  );
}
