import React from 'react';

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
          <p className="text-sm text-gray-700">
            📅 <strong>Días solicitados:</strong> {calculateDays()} días
            <span className="ml-2 text-xs text-gray-500">
              (desde {startDate.split('-').reverse().join('/')}
              {' '}hasta {endDate.split('-').reverse().join('/')})
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
