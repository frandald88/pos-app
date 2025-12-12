import React from 'react';
import { useEmpleadosUtils } from '../hooks';

// SVG Icons
const Icons = {
  chart: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
};

export default function AttendanceReport({
  users,
  tiendas,
  reportUser,
  setReportUser,
  reportStartDate,
  setReportStartDate,
  reportEndDate,
  setReportEndDate,
  tiendaFiltro,
  setTiendaFiltro,
  reportData,
  reportStats,
  reportMsg,
  onGenerateReport,
  loading
}) {
  const { getStatusConfig, formatTime, formatDate } = useEmpleadosUtils();

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-6 flex items-center gap-2" style={{ color: '#23334e' }}>
        <Icons.chart /> Reporte de Asistencia
      </h2>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
            Empleado
          </label>
          <select
            value={reportUser}
            onChange={(e) => setReportUser(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: '#e5e7eb',
              focusRingColor: '#23334e'
            }}
          >
            <option value="">Todos los empleados</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
            Desde
          </label>
          <input
            type="date"
            value={reportStartDate}
            onChange={(e) => setReportStartDate(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: '#e5e7eb',
              focusRingColor: '#23334e'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
            Hasta
          </label>
          <input
            type="date"
            value={reportEndDate}
            onChange={(e) => setReportEndDate(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: '#e5e7eb',
              focusRingColor: '#23334e'
            }}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
            Tienda
          </label>
          <select
            value={tiendaFiltro}
            onChange={(e) => setTiendaFiltro(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
            style={{
              borderColor: '#e5e7eb',
              focusRingColor: '#23334e'
            }}
          >
            <option value="">Todas las tiendas</option>
            {tiendas.map((t) => (
              <option key={t._id} value={t._id}>
                {t.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={onGenerateReport}
        disabled={loading}
        className="w-full px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-md disabled:opacity-50"
        style={{ backgroundColor: '#23334e' }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            Generando Reporte...
          </div>
        ) : (
          'Generar Reporte'
        )}
      </button>

      {/* Mensaje del reporte */}
      {reportMsg && (
        <div className={`mt-6 p-4 rounded-lg border-l-4 ${
          reportMsg.includes('[SUCCESS]')
            ? 'bg-green-50 border-green-400 text-green-800'
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <p className="font-medium">{reportMsg}</p>
        </div>
      )}

      {/* Estadísticas */}
      {reportStats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ backgroundColor: '#f4f6fa' }}>
            <div className="text-sm font-medium" style={{ color: '#697487' }}>Total Registros</div>
            <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
              {reportStats.totalRegistros || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-green-50">
            <div className="text-sm font-medium text-green-600">Presentes</div>
            <div className="text-2xl font-bold text-green-700">
              {reportStats.presentes || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-yellow-50">
            <div className="text-sm font-medium text-yellow-600">Tardes</div>
            <div className="text-2xl font-bold text-yellow-700">
              {reportStats.tardes || 0}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-red-50">
            <div className="text-sm font-medium text-red-600">Ausentes</div>
            <div className="text-2xl font-bold text-red-700">
              {reportStats.ausentes || 0}
            </div>
          </div>
        </div>
      )}

      {/* Tabla de reporte */}
      {reportData.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#f4f6fa' }}>
              <tr>
                <th className="text-left p-3 font-medium" style={{ color: '#23334e' }}>Fecha</th>
                <th className="text-left p-3 font-medium" style={{ color: '#23334e' }}>Empleado</th>
                <th className="text-left p-3 font-medium" style={{ color: '#23334e' }}>Tienda</th>
                <th className="text-center p-3 font-medium" style={{ color: '#23334e' }}>Estado</th>
                <th className="text-center p-3 font-medium" style={{ color: '#23334e' }}>Entrada</th>
                <th className="text-center p-3 font-medium" style={{ color: '#23334e' }}>Salida</th>
                <th className="text-center p-3 font-medium" style={{ color: '#23334e' }}>Horas</th>
                <th className="text-left p-3 font-medium" style={{ color: '#23334e' }}>Notas</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((record, index) => {
                const statusConfig = getStatusConfig(record.status);
                return (
                  <tr key={index} className={`border-b ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="p-3">{formatDate(record.date)}</td>
                    <td className="p-3 font-medium">{record.userId?.username || 'N/A'}</td>
                    <td className="p-3">{record.tienda?.nombre || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                        {statusConfig.icon} {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-3 text-center">{formatTime(record.checkInTime)}</td>
                    <td className="p-3 text-center">{formatTime(record.checkOutTime)}</td>
                    <td className="p-3 text-center font-medium">
                      {record.hoursWorked ? `${record.hoursWorked.toFixed(2)}h` : '-'}
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {record.notes || record.absenceReason || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
