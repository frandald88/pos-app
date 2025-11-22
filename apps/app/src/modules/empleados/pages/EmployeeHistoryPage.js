import { useEffect } from "react";
import {
  useEmployeeHistoryData,
  useEmployeeHistoryFilters
} from '../hooks';
import {
  RankingFilters,
  RankingTable
} from '../components';

export default function EmployeeHistoryPage() {
  const token = localStorage.getItem("token");

  // Hooks personalizados
  const {
    tiendas,
    ranking,
    loading,
    msg,
    loadTiendas,
    loadRanking,
    clearRanking,
    setMsg
  } = useEmployeeHistoryData();

  const {
    rankStartDate,
    rankEndDate,
    selectedTienda,
    setRankStartDate,
    setRankEndDate,
    setSelectedTienda,
    clearFilters
  } = useEmployeeHistoryFilters();

  // Cargar datos iniciales
  useEffect(() => {
    if (!token) {
      setMsg("❌ No hay token de autenticación");
      return;
    }

    loadTiendas();
  }, [token, loadTiendas, setMsg]);

  // Handlers
  const handleGenerateRanking = () => {
    loadRanking({
      rankStartDate,
      rankEndDate,
      selectedTienda
    });
  };

  const handleClearRanking = () => {
    clearRanking();
    clearFilters();
  };

  // Si no hay token, mostrar pantalla de login
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

        {/* Filtros y generación de ranking */}
        <RankingFilters
          tiendas={tiendas}
          rankStartDate={rankStartDate}
          setRankStartDate={setRankStartDate}
          rankEndDate={rankEndDate}
          setRankEndDate={setRankEndDate}
          selectedTienda={selectedTienda}
          setSelectedTienda={setSelectedTienda}
          loading={loading}
          onGenerateRanking={handleGenerateRanking}
          onClearRanking={handleClearRanking}
          hasResults={ranking.length > 0}
        />

        {/* Tabla de ranking */}
        <RankingTable
          ranking={ranking}
          rankStartDate={rankStartDate}
          rankEndDate={rankEndDate}
          selectedTienda={selectedTienda}
          tiendas={tiendas}
        />
      </div>
    </div>
  );
}
