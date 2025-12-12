import React from 'react';

// SVG Icons
const Icons = {
  trophy: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  target: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

export default function RankingFilters({
  tiendas,
  rankStartDate,
  setRankStartDate,
  rankEndDate,
  setRankEndDate,
  selectedTienda,
  setSelectedTienda,
  loading,
  onGenerateRanking,
  onClearRanking,
  hasResults
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#23334e' }}>
          <Icons.trophy /> Ranking de Menos Faltas
        </h2>
        {hasResults && (
          <button
            onClick={onClearRanking}
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
            onClick={onGenerateRanking}
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
              <span className="flex items-center gap-2 justify-center">
                <Icons.target /> Generar Ranking
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
