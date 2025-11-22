import React from 'react';

export default function AttendanceControls({
  users,
  currentUser,
  selectedUser,
  setSelectedUser,
  exitType,
  setExitType,
  absenceReason,
  setAbsenceReason,
  onCheckIn,
  onCheckOut,
  onAbsence,
  loading
}) {
  const visibleUsers = currentUser?.role === 'admin'
    ? users
    : users.filter((u) => u._id === currentUser?._id);

  return (
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
            disabled={currentUser?.role !== 'admin'}
          >
            <option value="">-- Selecciona un empleado --</option>
            {visibleUsers.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username} • {u.role === 'vendedor' ? 'Vendedor' : 'Repartidor'}
              </option>
            ))}
          </select>

          {currentUser?.role !== 'admin' && (
            <p className="text-xs mt-2" style={{ color: '#697487' }}>
              Solo puedes registrar tu propia asistencia
            </p>
          )}
        </div>

        {/* Controles de Check-in/Check-out */}
        <div className="space-y-4">
          {/* Check-in */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="block text-sm font-medium" style={{ color: '#46546b' }}>
                💼 Iniciar Jornada Laboral
              </label>
            </div>
            <button
              onClick={onCheckIn}
              disabled={loading || !selectedUser}
              className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md disabled:opacity-50"
              style={{ backgroundColor: '#10b981' }}
            >
              {loading ? 'Procesando...' : 'Check-In de Trabajo'}
            </button>
          </div>

          {/* Check-out */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <label className="block text-sm font-medium" style={{ color: '#46546b' }}>
                Tipo de Salida
              </label>
            </div>
            <div className="flex gap-2">
              <select
                value={exitType}
                onChange={(e) => setExitType(e.target.value)}
                className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
                style={{
                  borderColor: '#e5e7eb',
                  focusRingColor: '#23334e'
                }}
              >
                <option value="break">☕ Descanso</option>
                <option value="lunch">🍽️ Almuerzo</option>
                <option value="end_of_day">🏁 Fin de día</option>
              </select>
              <button
                onClick={onCheckOut}
                disabled={loading || !selectedUser}
                className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md disabled:opacity-50"
                style={{ backgroundColor: '#ef4444' }}
              >
                {loading ? 'Procesando...' : 'Check-Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Registrar ausencia */}
      <div className="mt-6 pt-6 border-t" style={{ borderColor: '#e5e7eb' }}>
        <h3 className="text-lg font-semibold mb-4" style={{ color: '#23334e' }}>
          ❌ Registrar Ausencia
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={absenceReason}
            onChange={(e) => setAbsenceReason(e.target.value)}
            placeholder="Razón de la ausencia (Ej: Enfermedad, Personal...)"
            className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: '#e5e7eb',
              focusRingColor: '#23334e'
            }}
          />
          <button
            onClick={onAbsence}
            disabled={loading || !selectedUser || !absenceReason}
            className="px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md disabled:opacity-50"
            style={{ backgroundColor: '#f59e0b' }}
          >
            {loading ? 'Procesando...' : 'Registrar Ausencia'}
          </button>
        </div>
      </div>
    </div>
  );
}
