import React from 'react';

// SVG Icons
const Icons = {
  clock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  briefcase: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  coffee: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  utensils: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
  ),
  flag: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  x: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

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
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
        <Icons.clock /> Registro de Asistencia
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
              <label className="block text-sm font-medium flex items-center gap-2" style={{ color: '#46546b' }}>
                <Icons.briefcase /> Iniciar Jornada Laboral
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
                <option value="break">Descanso</option>
                <option value="lunch">Almuerzo</option>
                <option value="end_of_day">Fin de día</option>
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
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#23334e' }}>
          <Icons.x /> Registrar Ausencia
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
