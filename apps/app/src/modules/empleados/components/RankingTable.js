import React from 'react';

export default function RankingTable({
  ranking,
  rankStartDate,
  rankEndDate,
  selectedTienda,
  tiendas
}) {
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
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              🏆 Ranking de Empleados por Asistencia
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
                  ✅ Presentes
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  ⏰ Tardes
                </th>
                <th className="text-center p-4 font-medium" style={{ color: '#23334e' }}>
                  ❌ Faltas
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
                const positionEmojis = ['🥇', '🥈', '🥉'];

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
                          <span className="text-2xl">{positionEmojis[index]}</span>
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
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {emp.role === 'vendedor' ? '👔 Vendedor' : '🏍️ Repartidor'}
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
              <span className="text-green-600 font-bold">✅ Presente</span>
              <span>= +3 puntos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-600 font-bold">⏰ Tarde</span>
              <span>= -1 punto</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-bold">❌ Falta</span>
              <span>= -5 puntos</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
