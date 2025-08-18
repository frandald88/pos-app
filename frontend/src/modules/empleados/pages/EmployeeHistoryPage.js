import { useEffect, useState } from "react";
import axios from "axios";
import apiBaseUrl from "../../../config/api";

export default function EmployeeHistoryPage() {
  const token = localStorage.getItem("token");
  const [tiendas, setTiendas] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Estados para ranking
  const [ranking, setRanking] = useState([]);
  const [rankStartDate, setRankStartDate] = useState("");
  const [rankEndDate, setRankEndDate] = useState("");
  const [selectedTienda, setSelectedTienda] = useState("");

  useEffect(() => {
    if (!token) {
      setMsg("❌ No hay token de autenticación");
      return;
    }

    // Solo cargar tiendas
    axios.get(`${apiBaseUrl}/api/tiendas`, { 
      headers: { Authorization: `Bearer ${token}` } 
    })
    .then(res => {
      setTiendas(res.data);
    })
    .catch(err => {
      setMsg(`Error cargando tiendas: ${err.response?.data?.message || err.message}`);
    });
  }, [token]);

  const loadRanking = async () => {
    if (!rankStartDate || !rankEndDate) {
      setMsg("Selecciona rango de fechas para el ranking ❌");
      return;
    }

    setLoading(true);
    try {
      const params = { 
        startDate: rankStartDate, 
        endDate: rankEndDate 
      };
      
      if (selectedTienda) {
        params.tiendaId = selectedTienda;
      }

      const res = await axios.get(`${apiBaseUrl}/api/employees/history/ranking/faltas`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      setRanking(res.data);
      setMsg("Ranking generado exitosamente ✅");
      setTimeout(() => setMsg(""), 3000);
    } catch (err) {
      setMsg(`Error al cargar ranking: ${err.response?.data?.message || err.message} ❌`);
    } finally {
      setLoading(false);
    }
  };

  const clearRanking = () => {
    setRanking([]);
    setRankStartDate("");
    setRankEndDate("");
    setSelectedTienda("");
    setMsg("");
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#23334e' }}>
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m12-7a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2" style={{ color: '#23334e' }}>Acceso Requerido</h2>
            <p className="mb-6" style={{ color: '#697487' }}>
              Tu sesión ha expirado. Por favor, inicia sesión nuevamente para continuar.
            </p>
            <button 
              onClick={() => window.location.href = '/login'} 
              className="w-full py-2 px-4 rounded-md text-white font-medium transition-colors duration-200 hover:opacity-90"
              style={{ backgroundColor: '#23334e' }}
            >
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
            Ranking de Asistencia
          </h1>
          <p style={{ color: '#697487' }}>
            Genera rankings de empleados basados en su asistencia y puntualidad
          </p>
        </div>

        {/* Mensajes */}
        {msg && (
          <div className={`p-4 rounded-lg mb-6 ${
            msg.includes('exitosamente') || msg.includes('✅') 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <p className={msg.includes('exitosamente') || msg.includes('✅') ? 'text-green-800' : 'text-red-800'}>
              {msg}
            </p>
          </div>
        )}

        {/* Formulario para generar ranking */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold" style={{ color: '#23334e' }}>
              🏆 Ranking de Menos Faltas
            </h2>
            {ranking.length > 0 && (
              <button
                onClick={clearRanking}
                className="px-4 py-2 text-sm font-medium rounded transition-colors duration-200 hover:bg-gray-50"
                style={{ color: '#697487', border: '1px solid #e5e7eb' }}
              >
                Limpiar Ranking
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Fecha Inicio *
              </label>
              <input 
                type="date" 
                value={rankStartDate} 
                onChange={(e) => setRankStartDate(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
                disabled={loading}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Fecha Fin *
              </label>
              <input 
                type="date" 
                value={rankEndDate} 
                onChange={(e) => setRankEndDate(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Filtrar por Tienda
              </label>
              <select 
                value={selectedTienda} 
                onChange={(e) => setSelectedTienda(e.target.value)} 
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ focusRingColor: '#23334e' }}
                disabled={loading}
              >
                <option value="">Todas las tiendas</option>
                {tiendas.map(t => (
                  <option key={t._id} value={t._id}>{t.nombre}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <button 
                onClick={loadRanking}
                disabled={loading || !rankStartDate || !rankEndDate}
                className="w-full px-6 py-3 text-white font-medium rounded-md transition-colors duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#23334e' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generando...
                  </div>
                ) : (
                  '🎯 Generar Ranking'
                )}
              </button>
            </div>
          </div>

          {/* Información del ranking */}
          {ranking.length > 0 && (
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
          )}
        </div>

        {/* Tabla de Ranking */}
        {ranking.length > 0 && (
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
              <table className="w-full">
                <thead style={{ backgroundColor: '#f4f6fa' }}>
                  <tr>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Posición</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Empleado</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Rol</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Total Días</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Presentes</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Tardes</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Faltas</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>% Asistencia</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Horas Trabajadas</th>
                    <th className="text-left p-4 font-medium" style={{ color: '#23334e' }}>Puntuación</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((r, idx) => {
                    const isTopThree = idx < 3;
                    const positionColor = idx === 0 ? '#ffd700' : idx === 1 ? '#c0c0c0' : idx === 2 ? '#cd7f32' : '#697487';
                    const positionIcon = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}`;
                    
                    return (
                      <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} ${isTopThree ? 'border-l-4' : ''}`} 
                          style={isTopThree ? { borderLeftColor: positionColor } : {}}>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isTopThree ? 'text-lg' : 'text-sm'}`} 
                                 style={{ backgroundColor: positionColor }}>
                              {typeof positionIcon === 'string' && positionIcon.includes('🥇') ? positionIcon : 
                               typeof positionIcon === 'string' && positionIcon.includes('🥈') ? positionIcon :
                               typeof positionIcon === 'string' && positionIcon.includes('🥉') ? positionIcon : positionIcon}
                            </div>
                            {isTopThree && (
                              <div className="text-xs" style={{ color: positionColor }}>
                                {idx === 0 ? 'Oro' : idx === 1 ? 'Plata' : 'Bronce'}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white" 
                                 style={{ backgroundColor: '#23334e' }}>
                              {r.empleado?.charAt(0)?.toUpperCase() || 'N'}
                            </div>
                            <div>
                              <div className="font-medium" style={{ color: '#23334e' }}>
                                {r.empleado || 'Usuario eliminado'}
                              </div>
                              {isTopThree && (
                                <div className="text-xs text-green-600 font-medium">
                                  ⭐ Top Performer
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            r.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                            r.role === 'vendedor' ? 'bg-green-100 text-green-800' :
                            r.role === 'repartidor' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {r.role === 'admin' ? '👑 Admin' :
                             r.role === 'vendedor' ? '🛒 Vendedor' :
                             r.role === 'repartidor' ? '🚚 Repartidor' : r.role || 'N/A'}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-medium" style={{ color: '#23334e' }}>
                            {r.totalDias}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                            ✅ {r.presentes}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                            ⏰ {r.tardes}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                            ❌ {r.faltas}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center gap-2">
                            <div className={`w-12 h-2 rounded-full ${r.porcentajeAsistencia >= 90 ? 'bg-green-400' : r.porcentajeAsistencia >= 70 ? 'bg-yellow-400' : 'bg-red-400'}`}>
                              <div 
                                className={`h-full rounded-full ${r.porcentajeAsistencia >= 90 ? 'bg-green-600' : r.porcentajeAsistencia >= 70 ? 'bg-yellow-600' : 'bg-red-600'}`}
                                style={{ width: `${r.porcentajeAsistencia}%` }}
                              ></div>
                            </div>
                            <span className={`text-sm font-medium ${r.porcentajeAsistencia >= 90 ? 'text-green-600' : r.porcentajeAsistencia >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {r.porcentajeAsistencia}%
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-medium" style={{ color: '#46546b' }}>
                            {r.horasTrabajadas || 0}h
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            r.puntuacion >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {r.puntuacion >= 0 ? '+' : ''}{r.puntuacion}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Estadísticas del ranking */}
            <div className="p-6 border-t" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                    {ranking.length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Empleados Evaluados
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {ranking.filter(r => r.porcentajeAsistencia >= 90).length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Excelente Asistencia (≥90%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {ranking.filter(r => r.porcentajeAsistencia >= 70 && r.porcentajeAsistencia < 90).length}
                  </div>
                  <div className="text-sm" style={{ color: '#697487' }}>
                    Buena Asistencia (70-89%)
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {ranking.filter(r => r.porcentajeAsistencia < 70).length}
                  </div>
                 <div className="text-sm" style={{ color: '#697487' }}>
                    Necesita Mejorar ({'<'}70%)
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Estado vacío cuando no hay ranking */}
        {ranking.length === 0 && !loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              Genera un Ranking de Asistencia
            </h3>
            <p className="max-w-md mx-auto" style={{ color: '#697487' }}>
              Selecciona un rango de fechas y opcionalmente una tienda específica para generar 
              un ranking detallado de asistencia de tus empleados.
            </p>
            <div className="mt-6 flex justify-center gap-4 text-sm" style={{ color: '#697487' }}>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-400 rounded-full"></span>
                Presente: +3 puntos
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-400 rounded-full"></span>
                Tarde: -1 punto
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-400 rounded-full"></span>
                Falta: -5 puntos
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}