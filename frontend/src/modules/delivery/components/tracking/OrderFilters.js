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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Selector de tienda para admin */}
          {userRole === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
                Filtrar por tienda
              </label>
              <select
                value={selectedTienda}
                onChange={(e) => setSelectedTienda(e.target.value)}
                className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
                style={{ 
                  borderColor: '#e5e7eb',
                  focusRingColor: '#23334e'
                }}
                disabled={loading}
              >
                <option value="">🏪 Todas las tiendas</option>
                {tiendas.map((tienda) => (
                  <option key={tienda._id} value={tienda._id}>
                    🏪 {tienda.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
              Filtrar por estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors min-w-48"
              style={{ 
                borderColor: '#e5e7eb',
                focusRingColor: '#23334e'
              }}
              disabled={loading}
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.icon} {s.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold" style={{ color: '#23334e' }}>
                {filteredSales.length}
              </div>
              <div className="text-sm" style={{ color: '#697487' }}>
                {loading ? "Cargando..." : "Pedidos"}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-md">
          <label className="block text-sm font-medium mb-2" style={{ color: '#46546b' }}>
            Buscar pedidos
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
      </div>
    </div>
  );
}