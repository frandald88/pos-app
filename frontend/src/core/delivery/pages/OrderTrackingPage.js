import { useEffect } from "react";
import { useSalesTracking, useSalesFilters, useSalesActions } from '../hooks';
import { OrderStats, OrderFilters, OrderCard } from '../components/tracking';
import { useTurno } from '../../turnos/hooks/useTurno';

export default function OrderTrackingPage() {
  // Hooks personalizados
  const {
    allSales,
    tiendas,
    userRole,
    loading,
    error,
    updatingOrderId,
    globalStats,
    fetchSales,
    updateSaleStatus,
    setError
  } = useSalesTracking();

  // ⭐ Hook para verificar turno de la tienda seleccionada
  const { turnoActivo, refetch: refetchTurno } = useTurno();

  const {
    selectedStatus,
    selectedTienda,
    searchTerm,
    statusOptions,
    filteredSales,
    statusStats,
    setSelectedStatus,
    setSelectedTienda,
    setSearchTerm,
    getStatusConfig
  } = useSalesFilters(allSales, globalStats);

  const { formatCurrency, formatDate } = useSalesActions();

  // ⭐ Recargar turno cuando cambia la tienda seleccionada
  useEffect(() => {
    if (selectedTienda) {
      // Si hay tienda seleccionada, buscar el turno de esa tienda
      refetchTurno(selectedTienda);

      // ⭐ Disparar evento para que AdminLayout actualice el botón de turno
      const event = new CustomEvent('tiendaChanged', {
        detail: { tiendaId: selectedTienda }
      });
      window.dispatchEvent(event);
    } else {
      // Si no hay tienda seleccionada, buscar el turno del usuario
      refetchTurno();

      // ⭐ Disparar evento sin tienda para que AdminLayout use turno del usuario
      const event = new CustomEvent('tiendaChanged', {
        detail: { tiendaId: null }
      });
      window.dispatchEvent(event);
    }
  }, [selectedTienda, refetchTurno]);

  // Recargar ventas cuando cambian los filtros
  useEffect(() => {
    const filters = {};
    // Siempre pasar el estado seleccionado
    filters.status = selectedStatus;
    // Solo pasar tiendaId si hay una tienda seleccionada
    if (selectedTienda) {
      filters.tiendaId = selectedTienda;
    }
    // Solo pasar search si hay término de búsqueda
    if (searchTerm) {
      filters.search = searchTerm;
    }
    fetchSales(filters);
  }, [selectedStatus, selectedTienda, searchTerm]);

  const handleUpdateStatus = async (saleId, newStatus) => {
    try {
      await updateSaleStatus(saleId, newStatus);
      // Recargar datos después de actualizar con los mismos filtros
      const filters = {};
      filters.status = selectedStatus;
      if (selectedTienda) {
        filters.tiendaId = selectedTienda;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }
      fetchSales(filters);
    } catch (error) {
      // Error ya manejado por el hook
    }
  };

  return (
    <div style={{ backgroundColor: '#f4f6fa', minHeight: '100vh' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 
                className="text-3xl font-bold mb-2"
                style={{ color: '#23334e' }}
              >
                Seguimiento de Pedidos
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona y monitorea el estado de todos los pedidos en tiempo real
              </p>
            </div>
            
            {/* Estadísticas rápidas */}
            <OrderStats 
              statusOptions={statusOptions}
              statusStats={statusStats}
            />
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Controles de filtro y búsqueda */}
        <OrderFilters
          userRole={userRole}
          tiendas={tiendas}
          selectedTienda={selectedTienda}
          setSelectedTienda={setSelectedTienda}
          statusOptions={statusOptions}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredSales={filteredSales}
          loading={loading}
        />

        {/* Lista de pedidos */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
            <p style={{ color: '#697487' }}>Cargando pedidos...</p>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              No hay pedidos
            </h3>
            <p style={{ color: '#697487' }}>
              {searchTerm 
                ? `No se encontraron resultados para "${searchTerm}"`
                : `No hay pedidos con estado "${getStatusConfig(selectedStatus).label}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredSales.map((sale) => {
              const statusConfig = getStatusConfig(sale.status);
              
              // Debug: Log ventas con devoluciones
              if (sale.totalReturned > 0) {
                console.log('🔍 Venta con devolución:', {
                  id: sale._id.slice(-8),
                  status: sale.status,
                  totalReturned: sale.totalReturned,
                  remaining: sale.total - sale.totalReturned,
                  isPartialReturn: sale.status === 'parcialmente_devuelta'
                });
              }
              
              return (
                <OrderCard
                  key={sale._id}
                  sale={sale}
                  statusConfig={statusConfig}
                  formatCurrency={formatCurrency}
                  formatDate={formatDate}
                  updatingOrderId={updatingOrderId}
                  updateStatus={handleUpdateStatus}
                  turnoActivo={turnoActivo} // ⭐ Pasar turno de la tienda seleccionada
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}