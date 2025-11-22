import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllTables } from '../../tables/services/tablesService';
import { getAllAccounts, createAccount } from '../../accounts/services/accountsService';

const WaiterDashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [view, setView] = useState('tables'); // 'tables' or 'accounts'

  // Filtros
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal para abrir mesa
  const [showOpenTableModal, setShowOpenTableModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [guestCount, setGuestCount] = useState(2);

  const tiendaId = localStorage.getItem('tiendaId');
  const turnoId = localStorage.getItem('turnoId');
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    loadData();
    // Refrescar cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedSection, selectedStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadTables(), loadAccounts()]);
      setError('');
    } catch (err) {
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const filters = { tiendaId };
      if (selectedSection) filters.section = selectedSection;
      if (selectedStatus) filters.status = selectedStatus;

      const data = await getAllTables(filters);
      setTables(data.data.tables || []);
    } catch (err) {
      console.error('Error cargando mesas:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const filters = {
        tiendaId,
        turnoId,
        waiterId: userId
      };

      const data = await getAllAccounts(filters);
      setAccounts(data.data.accounts || []);
    } catch (err) {
      console.error('Error cargando cuentas:', err);
    }
  };

  const handleOpenTable = (table) => {
    if (table.status !== 'available') {
      setError('Solo puedes abrir mesas disponibles');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setSelectedTable(table);
    setGuestCount(table.capacity || 2);
    setShowOpenTableModal(true);
  };

  const handleConfirmOpenTable = async () => {
    try {
      const accountData = {
        tiendaId,
        turnoId,
        tableId: selectedTable._id,
        guestCount: parseInt(guestCount)
      };

      const response = await createAccount(accountData);
      const newAccount = response.data.account;

      setSuccess(`Mesa ${selectedTable.number} abierta exitosamente`);
      setShowOpenTableModal(false);
      setSelectedTable(null);

      // Navegar a la cuenta
      setTimeout(() => {
        navigate(`/restaurant/account/${newAccount._id}`);
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al abrir mesa');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleViewAccount = (accountId) => {
    navigate(`/restaurant/account/${accountId}`);
  };

  const handleTableClick = (table) => {
    if (table.status === 'occupied' && table.currentAccount) {
      // Si está ocupada, ir a la cuenta
      navigate(`/restaurant/account/${table.currentAccount._id || table.currentAccount}`);
    } else if (table.status === 'available') {
      // Si está disponible, abrir modal
      handleOpenTable(table);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'occupied':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'reserved':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'available':
        return 'Disponible';
      case 'occupied':
        return 'Ocupada';
      case 'reserved':
        return 'Reservada';
      case 'cleaning':
        return 'Limpieza';
      default:
        return status;
    }
  };

  const getAccountStatusText = (status) => {
    const statusMap = {
      open: 'Abierta',
      closed_pending: 'Pendiente Pago',
      split_pending: 'División Pendiente',
      paid: 'Pagada',
      cancelled: 'Cancelada'
    };
    return statusMap[status] || status;
  };

  const sections = [...new Set(tables.map((t) => t.section).filter(Boolean))];

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Dashboard de Mesero</h1>
        <p className="text-gray-600 mt-1">Gestiona tus mesas y cuentas activas</p>
      </div>

      {/* Mensajes */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Vista Toggle */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setView('tables')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            view === 'tables'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Vista de Mesas ({tables.length})
        </button>
        <button
          onClick={() => setView('accounts')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
            view === 'accounts'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Mis Cuentas Activas ({accounts.filter((a) => a.status !== 'paid' && a.status !== 'cancelled').length})
        </button>
      </div>

      {/* Vista de Mesas */}
      {view === 'tables' && (
        <>
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sección</label>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas las secciones</option>
                  {sections.map((section) => (
                    <option key={section} value={section}>
                      {section}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los estados</option>
                  <option value="available">Disponible</option>
                  <option value="occupied">Ocupada</option>
                  <option value="reserved">Reservada</option>
                  <option value="cleaning">Limpieza</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedSection('');
                    setSelectedStatus('');
                  }}
                  className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg"
                >
                  Limpiar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Mesas */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {tables.map((table) => (
              <div
                key={table._id}
                onClick={() => handleTableClick(table)}
                className={`p-6 rounded-lg shadow-md border-2 cursor-pointer transition-all hover:shadow-lg ${getStatusColor(
                  table.status
                )}`}
              >
                <div className="text-center">
                  <div className="text-3xl font-bold mb-2">Mesa {table.number}</div>
                  <div className="text-sm font-medium mb-1">{table.section}</div>
                  <div className="text-xs text-gray-600 mb-2">Cap: {table.capacity}</div>
                  <div className="text-sm font-bold mb-3">{getStatusText(table.status)}</div>

                  {table.status === 'available' && (
                    <div className="text-xs text-green-700 font-medium">Click para abrir</div>
                  )}

                  {table.status === 'occupied' && table.currentAccount && (
                    <div className="mt-2 text-xs bg-white bg-opacity-60 p-2 rounded">
                      <div className="font-medium">Cuenta Activa</div>
                      {table.currentAccount.folio && <div>Folio: {table.currentAccount.folio}</div>}
                      {table.currentAccount.total !== undefined && (
                        <div className="font-bold mt-1">${table.currentAccount.total.toFixed(2)}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {tables.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">🍽️</div>
              <p className="text-gray-600 text-lg">No hay mesas disponibles</p>
            </div>
          )}
        </>
      )}

      {/* Vista de Cuentas */}
      {view === 'accounts' && (
        <div className="space-y-4">
          {accounts
            .filter((a) => a.status !== 'paid' && a.status !== 'cancelled')
            .map((account) => (
              <div
                key={account._id}
                onClick={() => handleViewAccount(account._id)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">
                        Cuenta #{account.folio}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          account.status === 'open'
                            ? 'bg-green-100 text-green-800'
                            : account.status === 'closed_pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {getAccountStatusText(account.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Mesa:</span>{' '}
                        {account.tableId?.number || 'N/A'}
                      </div>
                      <div>
                        <span className="font-medium">Comensales:</span>{' '}
                        {account.guestCount || 0}
                      </div>
                      <div>
                        <span className="font-medium">Órdenes:</span>{' '}
                        {account.orders?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Abierta:</span>{' '}
                        {new Date(account.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      ${account.total.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      Subtotal: ${account.subtotal.toFixed(2)}
                    </div>
                    {account.tip && account.tip.amount > 0 && (
                      <div className="text-sm text-green-600">
                        Propina: ${account.tip.amount.toFixed(2)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          {accounts.filter((a) => a.status !== 'paid' && a.status !== 'cancelled').length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-4">📋</div>
              <p className="text-gray-600 text-lg">No tienes cuentas activas</p>
              <p className="text-gray-500 text-sm">Abre una mesa para comenzar</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Abrir Mesa */}
      {showOpenTableModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              Abrir Mesa {selectedTable.number}
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Comensales
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={guestCount}
                onChange={(e) => setGuestCount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="bg-gray-100 p-4 rounded-lg mb-6">
              <div className="text-sm text-gray-600">
                <div>
                  <span className="font-medium">Sección:</span> {selectedTable.section}
                </div>
                <div>
                  <span className="font-medium">Capacidad:</span> {selectedTable.capacity}{' '}
                  personas
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOpenTableModal(false);
                  setSelectedTable(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmOpenTable}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
              >
                Abrir Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaiterDashboard;
