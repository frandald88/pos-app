import React, { useState, useEffect } from 'react';
import { getKitchenItems, markItemReady, cancelItem } from '../../accounts/services/accountsService';

// SVG Icons
const Icons = {
  search: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  chef: () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  check: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
};

const KitchenPage = () => {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ total: 0, preparing: 0, ready: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const tiendaId = localStorage.getItem('tiendaId');

  const loadKitchenItems = async () => {
    try {
      setLoading(true);
      const response = await getKitchenItems({ tiendaId });
      setItems(response.data.kitchenItems || []);
      setStats(response.data.stats || { total: 0, preparing: 0, ready: 0 });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar items de cocina');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKitchenItems();
    const interval = setInterval(loadKitchenItems, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkReady = async (item) => {
    try {
      setUpdatingItemId(`${item.accountId}-${item.orderIdx}-${item.itemIdx}`);
      await markItemReady(item.accountId, item.orderIdx, item.itemIdx);
      loadKitchenItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al marcar item como listo');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCancelItem = async (item) => {
    const reason = window.prompt('Razón de cancelación (opcional):');
    if (reason === null) return; // User cancelled prompt

    try {
      setUpdatingItemId(`${item.accountId}-${item.orderIdx}-${item.itemIdx}`);
      await cancelItem(item.accountId, item.orderIdx, item.itemIdx, reason);
      loadKitchenItems();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cancelar item');
      setTimeout(() => setError(''), 5000);
    } finally {
      setUpdatingItemId(null);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesSearch = !searchTerm ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mesa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.mesero.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Agrupar items por cuenta/mesa
  const groupedByAccount = filteredItems.reduce((acc, item) => {
    const key = item.accountId;
    if (!acc[key]) {
      acc[key] = {
        accountId: item.accountId,
        mesa: item.mesa,
        mesero: item.mesero,
        folio: item.folio,
        orderNumber: item.orderNumber,
        sentToKitchenAt: item.sentToKitchenAt,
        items: []
      };
    }
    acc[key].items.push(item);
    // Actualizar tiempo más antiguo
    if (new Date(item.sentToKitchenAt) < new Date(acc[key].sentToKitchenAt)) {
      acc[key].sentToKitchenAt = item.sentToKitchenAt;
    }
    return acc;
  }, {});

  const accountGroups = Object.values(groupedByAccount);

  // Determinar estado general de una cuenta
  const getAccountStatus = (accountItems) => {
    const allReady = accountItems.every(item => item.status === 'ready');
    const allPreparing = accountItems.every(item => item.status === 'preparing');
    if (allReady) return 'ready';
    if (allPreparing) return 'preparing';
    return 'preparing'; // mixto
  };

  const getTimeSince = (date) => {
    if (!date) return '';
    const diff = Math.floor((new Date() - new Date(date)) / 1000 / 60);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
  };

  const statusOptions = [
    { value: 'all', label: 'Todos', color: '#697487', bgColor: '#f4f6fa' },
    { value: 'preparing', label: 'En Preparación', color: '#d97706', bgColor: '#fef3c7' },
    { value: 'ready', label: 'Listos', color: '#059669', bgColor: '#d1fae5' }
  ];

  const getStatusConfig = (status) => {
    return statusOptions.find(opt => opt.value === status) || statusOptions[0];
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
                Pantalla de Cocina
              </h1>
              <p style={{ color: '#697487' }} className="text-lg">
                Gestiona y monitorea los pedidos en preparación en tiempo real
              </p>
            </div>

            {/* Estadísticas rápidas */}
            <div className="flex gap-3">
              {statusOptions.map((option) => (
                <div
                  key={option.value}
                  className="px-4 py-2 rounded-lg text-center min-w-[80px]"
                  style={{
                    backgroundColor: option.bgColor,
                    border: `1px solid ${option.color}20`
                  }}
                >
                  <div
                    className="text-2xl font-bold"
                    style={{ color: option.color }}
                  >
                    {option.value === 'all' ? stats.total :
                     option.value === 'preparing' ? stats.preparing : stats.ready}
                  </div>
                  <div
                    className="text-xs font-medium"
                    style={{ color: option.color }}
                  >
                    {option.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Mensaje de error */}
        {error && (
          <div className="mb-6 p-4 rounded-lg border-l-4 bg-red-50 border-red-400 text-red-800">
            <p className="font-medium">{error}</p>
          </div>
        )}

        {/* Controles de filtro y búsqueda */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            {/* Filtros de estado */}
            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    selectedStatus === option.value
                      ? 'shadow-md transform scale-105'
                      : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: selectedStatus === option.value ? option.color : option.bgColor,
                    color: selectedStatus === option.value ? 'white' : option.color,
                    border: `1px solid ${option.color}40`
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Búsqueda y acciones */}
            <div className="flex gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <input
                  type="text"
                  placeholder="Buscar producto, mesa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <Icons.search />
                </span>
              </div>
              <button
                onClick={loadKitchenItems}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Actualizar
              </button>
            </div>
          </div>

          {/* Contador de resultados */}
          <div className="mt-3 text-sm" style={{ color: '#697487' }}>
            Mostrando {accountGroups.length} mesas con {filteredItems.length} items
          </div>
        </div>

        {/* Lista de cuentas agrupadas */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#23334e' }}></div>
            <p style={{ color: '#697487' }}>Cargando items de cocina...</p>
          </div>
        ) : accountGroups.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="text-gray-400 mb-4 flex justify-center">
              <Icons.chef />
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: '#23334e' }}>
              No hay items en cocina
            </h3>
            <p style={{ color: '#697487' }}>
              {searchTerm
                ? `No se encontraron resultados para "${searchTerm}"`
                : `No hay items con estado "${getStatusConfig(selectedStatus).label}"`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {accountGroups.map((account) => {
              const accountStatus = getAccountStatus(account.items);
              const statusConfig = getStatusConfig(accountStatus);

              return (
                <div
                  key={account.accountId}
                  className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
                  style={{ borderLeft: `4px solid ${statusConfig.color}` }}
                >
                  <div className="p-5">
                    {/* Header de la cuenta */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span
                            className="text-xl font-bold"
                            style={{ color: '#23334e' }}
                          >
                            Mesa {account.mesa}
                          </span>
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: statusConfig.bgColor,
                              color: statusConfig.color
                            }}
                          >
                            {account.items.filter(i => i.status === 'ready').length}/{account.items.length} listos
                          </span>
                        </div>
                        <p style={{ color: '#697487' }} className="text-sm">
                          Orden #{account.orderNumber} • Mesero: {account.mesero}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium" style={{ color: '#697487' }}>
                          {getTimeSince(account.sentToKitchenAt)}
                        </div>
                        <div className="text-xs" style={{ color: '#9ca3af' }}>
                          Folio: {account.folio}
                        </div>
                      </div>
                    </div>

                    {/* Lista de productos */}
                    <div className="space-y-2">
                      {account.items.map((item) => {
                        const itemKey = `${item.accountId}-${item.orderIdx}-${item.itemIdx}`;
                        const isUpdating = updatingItemId === itemKey;
                        const itemStatusConfig = getStatusConfig(item.status);

                        return (
                          <div
                            key={itemKey}
                            className="p-3 rounded-lg flex items-center justify-between"
                            style={{ backgroundColor: '#f4f6fa' }}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="font-semibold"
                                  style={{ color: '#23334e' }}
                                >
                                  {item.quantity}x {item.name}
                                </span>
                                {item.status === 'ready' && (
                                  <span
                                    className="px-2 py-0.5 rounded text-xs"
                                    style={{
                                      backgroundColor: itemStatusConfig.bgColor,
                                      color: itemStatusConfig.color
                                    }}
                                  >
                                    Listo
                                  </span>
                                )}
                              </div>
                              {item.note && (
                                <div
                                  className="text-sm italic mt-1"
                                  style={{ color: '#d97706' }}
                                >
                                  Nota: {item.note}
                                </div>
                              )}
                            </div>

                            {item.status === 'preparing' && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleMarkReady(item)}
                                  disabled={isUpdating}
                                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center justify-center ${
                                    isUpdating
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-green-500 hover:bg-green-600 text-white'
                                  }`}
                                >
                                  {isUpdating ? '...' : <Icons.check />}
                                </button>
                                <button
                                  onClick={() => handleCancelItem(item)}
                                  disabled={isUpdating}
                                  className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center justify-center ${
                                    isUpdating
                                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                >
                                  <Icons.x />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenPage;
