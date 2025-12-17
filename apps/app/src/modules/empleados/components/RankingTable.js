import React from 'react';

// SVG Icons
const Icons = {
  Trophy: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  X: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Briefcase: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Truck: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  Medal: () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  )
};

export default function RankingTable({
  ranking,
  rankStartDate,
  rankEndDate,
  selectedTienda,
  tiendas
}) {
  // Mostrar mensaje cuando se ha generado el ranking pero no hay datos
  if (ranking.length === 0 && rankStartDate && rankEndDate) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
            No se encontraron registros
          </h3>
          <p className="mb-4" style={{ color: '#697487' }}>
            No hay registros de asistencia en el rango de fechas seleccionado
            {selectedTienda && tiendas.find(t => t._id === selectedTienda) &&
              ` para la tienda ${tiendas.find(t => t._id === selectedTienda)?.nombre}`
            }.
          </p>
          <div className="text-sm" style={{ color: '#697487' }}>
            <p className="mb-2">Posibles causas:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>No se han registrado asistencias en este período</li>
              <li>Los empleados no han hecho check-in en estas fechas</li>
              <li>El rango de fechas seleccionado es muy amplio o muy corto</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // No mostrar nada si aún no se ha intentado generar el ranking
  if (ranking.length === 0) return null;

  return (
    <>
      {/* Información del ranking */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">ℹ</span>
            </div>
            <h3 className="font-medium text-blue-800">Información del Ranking</h3>
          </div>
          <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="font-medium">Período:</span> {new Date(rankStartDate).toLocaleDateString()} - {new Date(rankEndDate).toLocaleDateString()}
            </div>
            <div>
              <span className="font-medium">Tienda:</span> {selectedTienda ? tiendas.find(t => t._id === selectedTienda)?.nombre : 'Todas'}
            </div>
            <div>
              <span className="font-medium">Empleados:</span> {ranking.length} registros
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de Ranking */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#23334e' }}>
              <Icons.Trophy /> Ranking de Empleados por Asistencia
            </h2>
            <div className="text-sm" style={{ color: '#697487' }}>
              Ordenado por puntuación (Presente: +3, Tarde: -1, Falta: -5)
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead style={{ backgroundColor: '#f4f6fa' }}>
              <tr>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e', width: '80px' }}>
                  Posición
                </th>
                <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>
                  Empleado
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Rol
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Total Días
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Presentes
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Tardes
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Faltas
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Horas Trabajadas
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  % Asistencia
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  Puntuación
                </th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((emp, index) => {
                const isTop3 = index < 3;
                const positionColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

                return (
                  <tr
                    key={emp._id}
                    className={`border-b transition-colors duration-150 ${
                      isTop3 ? 'bg-yellow-50' : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50`}
                  >
                    <td className="p-4 text-center">
                      {isTop3 ? (
                        <div className="flex flex-col items-center">
                          <div style={{ color: positionColors[index] }}>
                            <Icons.Medal />
                          </div>
                          <span className="text-xs font-bold" style={{ color: positionColors[index] }}>
                            #{index + 1}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-lg" style={{ color: '#697487' }}>
                          #{index + 1}
                        </span>
                      )}
                    </td>
                    <td className="p-4 font-medium" style={{ color: '#23334e' }}>
                      {emp.empleado}
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 flex items-center gap-1 justify-center">
                        {emp.role === 'vendedor' ? <><Icons.Briefcase /> Vendedor</> : <><Icons.Truck /> Repartidor</>}
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium" style={{ color: '#697487' }}>
                      {emp.totalDias}
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-green-600">{emp.presentes}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-yellow-600">{emp.tardes}</span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-red-600">{emp.faltas}</span>
                    </td>
                    <td className="p-4 text-center font-medium" style={{ color: '#697487' }}>
                      {emp.horasTrabajadas}h
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                          <div
                            className="h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${emp.porcentajeAsistencia}%`,
                              backgroundColor: emp.porcentajeAsistencia >= 90 ? '#10b981' : emp.porcentajeAsistencia >= 75 ? '#f59e0b' : '#ef4444'
                            }}
                          ></div>
                        </div>
                        <span className="font-bold text-sm" style={{ color: '#23334e' }}>
                          {emp.porcentajeAsistencia}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className="px-3 py-1 rounded-full text-sm font-bold"
                        style={{
                          backgroundColor: emp.puntuacion > 0 ? '#d1fae5' : '#fee2e2',
                          color: emp.puntuacion > 0 ? '#065f46' : '#991b1b'
                        }}
                      >
                        {emp.puntuacion > 0 ? '+' : ''}{emp.puntuacion}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer con leyenda */}
        <div className="p-6 border-t" style={{ backgroundColor: '#f8f9fa' }}>
          <div className="flex flex-wrap gap-6 text-sm" style={{ color: '#697487' }}>
            <div className="flex items-center gap-2">
              <span className="font-medium" style={{ color: '#23334e' }}>Sistema de Puntuación:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-600 font-bold flex items-center gap-1">
                <Icons.CheckCircle /> Presente
              </span>
              <span>= +3 puntos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-bold flex items-center gap-1">
                <Icons.Clock /> Tarde
              </span>
              <span>= -1 punto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold flex items-center gap-1">
                <Icons.X /> Falta
              </span>
              <span>= -5 puntos</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
