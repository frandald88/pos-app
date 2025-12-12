// SVG Icons
const Icons = {
  store: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  chartBar: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  search: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  )
};

export default function OrderFilters({
  userRole,
  tiendas,
  selectedTienda,
  setSelectedTienda,
  statusOptions,
  selectedStatus,
  setSelectedStatus,
  searchTerm,
  setSearchTerm,
  filteredSales,
  loading
}) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col gap-6">
        {/* Selector de tienda para admin */}
        {userRole === 'admin' && (
          <div>
            <label className="block text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#23334e' }}>
              <Icons.store /> Filtrar por tienda
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTienda('')}
                disabled={loading}
                className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
                  selectedTienda === '' ? 'text-white' : ''
                }`}
                style={
                  selectedTienda === ''
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                    : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                }
              >
                Todas las tiendas
              </button>
              {tiendas.map((tienda) => (
                <button
                  key={tienda._id}
                  onClick={() => setSelectedTienda(tienda._id)}
                  disabled={loading}
                  className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
                    selectedTienda === tienda._id ? 'text-white' : ''
                  }`}
                  style={
                    selectedTienda === tienda._id
                      ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                      : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                  }
                >
                  {tienda.nombre}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: '#23334e' }}>
            <Icons.chartBar /> Filtrar por estado
          </label>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((s) => (
              <button
                key={s.value}
                onClick={() => setSelectedStatus(s.value)}
                disabled={loading}
                className={`px-4 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 ${
                  selectedStatus === s.value ? 'text-white' : ''
                }`}
                style={
                  selectedStatus === s.value
                    ? { background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)', borderColor: '#23334e' }
                    : { color: '#697487', backgroundColor: 'white', borderColor: '#cbd5e1' }
                }
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Búsqueda y contador */}
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold mb-2 flex items-center gap-2" style={{ color: '#23334e' }}>
              <Icons.search /> Buscar pedidos
            </label>
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por ID, cliente, tienda o producto..."
              className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors"
              style={{ 
                borderColor: '#e5e7eb',
                focusRingColor: '#23334e'
              }}
            />
            <div className="absolute left-3 top-3.5">
              <svg className="w-5 h-5" style={{ color: '#697487' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          </div>

          {/* Contador de pedidos */}
          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#cbd5e1', backgroundColor: 'white' }}>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#23334e' }}>
                {filteredSales.length}
              </div>
              <div className="text-sm font-medium" style={{ color: '#697487' }}>
                {loading ? "Cargando..." : "Pedidos"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}