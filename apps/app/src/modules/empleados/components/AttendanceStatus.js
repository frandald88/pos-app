import React from 'react';
import { useEmpleadosUtils } from '../hooks';

// SVG Icons
const Icons = {
  chart: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  clipboard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
};

export default function AttendanceStatus({ attendanceStatus, timeEntries }) {
  const { formatDuration, getEntryTypeIcon } = useEmpleadosUtils();

  if (!attendanceStatus) return null;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#23334e' }}>
        <Icons.chart /> Estado Actual de Asistencia
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-sm font-medium" style={{ color: '#697487' }}>Estado</div>
          <div className="text-lg font-bold" style={{ color: '#23334e' }}>
            {attendanceStatus.currentStatus?.message || 'No iniciado'}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-sm font-medium" style={{ color: '#697487' }}>Horas Trabajadas</div>
          <div className="text-lg font-bold text-green-600">
            {attendanceStatus.hoursWorked || 0}h
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-sm font-medium" style={{ color: '#697487' }}>Tiempo en Descansos</div>
          <div className="text-lg font-bold text-blue-600">
            {formatDuration(attendanceStatus.totalBreakTime || 0)}
          </div>
        </div>

        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
          <div className="text-sm font-medium" style={{ color: '#697487' }}>Entradas del Día</div>
          <div className="text-lg font-bold" style={{ color: '#23334e' }}>
            {timeEntries.length}
          </div>
        </div>
      </div>

      {/* Lista de entradas del día */}
      {timeEntries.length > 0 && (
        <div>
          <h4 className="text-md font-semibold mb-3 flex items-center gap-2" style={{ color: '#46546b' }}>
            <Icons.clipboard /> Registro del Día
          </h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {timeEntries.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-blue-600">#{index + 1}</span>
                  <div>
                    <div className="text-sm font-medium">
                      {getEntryTypeIcon(entry.type)}
                    </div>
                    <div className="text-xs text-gray-600">{entry.notes}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    {new Date(entry.checkInTime).toLocaleTimeString('es-MX')}
                    {entry.checkOutTime && ` - ${new Date(entry.checkOutTime).toLocaleTimeString('es-MX')}`}
                  </div>
                  <div className="text-xs text-gray-600">
                    {entry.duration ? formatDuration(entry.duration) : 'En curso'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
