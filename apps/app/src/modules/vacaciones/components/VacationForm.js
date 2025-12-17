import React from 'react';

const Icons = {
  calendar: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  warning: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  )
};

export default function VacationForm({
  currentUser,
  users,
  selectedEmployeeId,
  onEmployeeChange,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  tienda,
  replacement,
  setReplacement,
  replacementOptions,
  calculateDays,
  daysAvailable,
  loading,
  onSubmit
}) {
  // Handler para cambio de fecha de inicio
  const handleStartDateChange = (newStartDate) => {
    setStartDate(newStartDate);

    // Si no hay fecha de fin o la fecha de fin es menor que la nueva fecha de inicio,
    // actualizar la fecha de fin a la nueva fecha de inicio
    if (!endDate || newStartDate > endDate) {
      setEndDate(newStartDate);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Solo admin puede seleccionar al empleado */}
        {currentUser?.role === 'admin' && (
          <div>
            <label className="block text-sm font-medium mb-1">Empleado *</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => onEmployeeChange(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">-- Selecciona Empleado --</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.username} ({u.role}) - {u.tienda?.nombre || 'Sin tienda'}
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
            onChange={(e) => handleStartDateChange(e.target.value)}
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

        {/* Select de reemplazo */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Reemplazo (opcional)
            {!tienda &&
              <span className="text-xs text-gray-500 ml-1">(Selecciona empleado primero)</span>
            }
            {tienda && replacementOptions.length === 0 &&
              <span className="text-xs text-red-500 ml-1">(No hay empleados del mismo rol disponibles)</span>
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
            Solo empleados de la misma tienda y mismo rol pueden ser reemplazos
          </p>
        </div>
      </div>

      {/* Información de días calculados */}
      {startDate && endDate && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-700 flex items-center gap-2">
            <Icons.calendar />
            <strong>Días solicitados:</strong> {calculateDays()} días
            <span className="ml-2 text-xs text-gray-500">
              (desde {startDate.split('-').reverse().join('/')}
              {' '}hasta {endDate.split('-').reverse().join('/')})
            </span>
          </p>
          {daysAvailable && calculateDays() > daysAvailable.availableDays && (
            <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
              <Icons.warning />
              Excedes tus días disponibles ({daysAvailable.availableDays} días)
            </p>
          )}
        </div>
      )}

      <button
        onClick={onSubmit}
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
          'Enviar Solicitud'
        )}
      </button>
    </>
  );
}
