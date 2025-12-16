import React, { useState, useEffect } from 'react';
import {
  getAllTables,
  createTable,
  updateTable,
  deleteTable,
  changeTableStatus,
  getSections
} from '../services/tablesService';

// SVG Icons
const Icons = {
  checkCircle: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  ),
  solidCircle: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" />
    </svg>
  ),
  diamond: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l8 8-8 8-8-8 8-8z" />
    </svg>
  ),
  halfCircle: () => (
    <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2a8 8 0 100 16V2z" />
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
    </svg>
  ),
  circle: () => (
    <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="8" />
    </svg>
  ),
  edit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  restaurant: () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  )
};

const TablesPage = () => {
  const [tables, setTables] = useState([]);
  const [stats, setStats] = useState({});
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filtros
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [formData, setFormData] = useState({
    number: '',
    section: 'General',
    capacity: 4,
    notes: ''
  });

  const tiendaId = localStorage.getItem('tiendaId');

  useEffect(() => {
    loadTables();
    loadSections();
  }, [selectedSection, selectedStatus]);

  const loadTables = async () => {
    try {
      setLoading(true);
      const filters = { tiendaId };
      if (selectedSection) filters.section = selectedSection;
      if (selectedStatus) filters.status = selectedStatus;

      const data = await getAllTables(filters);
      setTables(data.data.tables || []);
      setStats(data.data.stats || {});
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar mesas');
    } finally {
      setLoading(false);
    }
  };

  const loadSections = async () => {
    try {
      const data = await getSections(tiendaId);
      setSections(data.data.sections || []);
    } catch (err) {
      console.error('Error cargando secciones:', err);
    }
  };

  const handleOpenModal = (table = null) => {
    if (table) {
      setEditingTable(table);
      setFormData({
        number: table.number,
        section: table.section,
        capacity: table.capacity,
        notes: table.notes || ''
      });
    } else {
      setEditingTable(null);
      setFormData({
        number: '',
        section: 'General',
        capacity: 4,
        notes: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTable(null);
    setFormData({
      number: '',
      section: 'General',
      capacity: 4,
      notes: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        tiendaId
      };

      if (editingTable) {
        await updateTable(editingTable._id, dataToSend);
        setSuccess('Mesa actualizada exitosamente');
      } else {
        await createTable(dataToSend);
        setSuccess('Mesa creada exitosamente');
      }

      handleCloseModal();
      loadTables();
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar mesa');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleChangeStatus = async (tableId, newStatus) => {
    try {
      await changeTableStatus(tableId, newStatus);
      setSuccess(`Estado cambiado a: ${getStatusText(newStatus)}`);
      loadTables();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar estado');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDelete = async (tableId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta mesa?')) return;

    try {
      await deleteTable(tableId);
      setSuccess('Mesa eliminada exitosamente');
      loadTables();
      loadSections();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar mesa');
      setTimeout(() => setError(''), 5000);
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
        return <Icons.checkCircle />;
      case 'occupied':
        return <Icons.solidCircle />;
      case 'reserved':
        return <Icons.diamond />;
      case 'cleaning':
        return <Icons.halfCircle />;
      default:
        return <Icons.circle />;
    }
  };

  if (loading && tables.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Cargando mesas...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Mesas</h1>
          <p className="text-gray-600 mt-1">Administra las mesas del restaurant</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          + Nueva Mesa
        </button>
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

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-gray-500">
          <div className="text-2xl font-bold text-gray-800">{stats.total || 0}</div>
          <div className="text-sm text-gray-600">Total Mesas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
          <div className="text-2xl font-bold text-green-600">{stats.available || 0}</div>
          <div className="text-sm text-gray-600">Disponibles</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
          <div className="text-2xl font-bold text-red-600">{stats.occupied || 0}</div>
          <div className="text-sm text-gray-600">Ocupadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
          <div className="text-2xl font-bold text-blue-600">{stats.reserved || 0}</div>
          <div className="text-sm text-gray-600">Reservadas</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
          <div className="text-2xl font-bold text-yellow-600">{stats.cleaning || 0}</div>
          <div className="text-sm text-gray-600">Limpieza</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sección
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Grid de Mesas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {tables.map((table) => (
          <div
            key={table._id}
            className={`p-4 rounded-lg shadow-md border-2 transition-all hover:shadow-lg ${getStatusColor(
              table.status
            )}`}
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-2xl font-bold">
                {getStatusIcon(table.status)} {table.number}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleOpenModal(table)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Editar"
                >
                  <Icons.edit />
                </button>
                <button
                  onClick={() => handleDelete(table._id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Eliminar"
                  disabled={table.status === 'occupied'}
                >
                  <Icons.trash />
                </button>
              </div>
            </div>

            <div className="text-xs space-y-1 mb-3">
              <div className="font-medium">{table.section}</div>
              <div className="text-gray-600">Capacidad: {table.capacity}</div>
              <div className="font-medium">{getStatusText(table.status)}</div>
            </div>

            {table.status !== 'occupied' && (
              <div className="space-y-1">
                <select
                  value={table.status}
                  onChange={(e) => handleChangeStatus(table._id, e.target.value)}
                  className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                  disabled={table.status === 'occupied'}
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Reservada</option>
                  <option value="cleaning">Limpieza</option>
                </select>
              </div>
            )}

            {table.currentAccount && (
              <div className="mt-2 text-xs bg-white bg-opacity-50 p-2 rounded">
                <div className="font-medium">Cuenta Activa</div>
                <div>Folio: {table.currentAccount.folio}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {tables.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4 flex justify-center">
            <Icons.restaurant />
          </div>
          <p className="text-gray-600 text-lg">No hay mesas disponibles</p>
          <p className="text-gray-500 text-sm">Crea tu primera mesa para comenzar</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingTable ? 'Editar Mesa' : 'Nueva Mesa'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Mesa *
                  </label>
                  <input
                    type="text"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sección
                  </label>
                  <input
                    type="text"
                    value={formData.section}
                    onChange={(e) =>
                      setFormData({ ...formData, section: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="General, Terraza, VIP, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Notas adicionales..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    {editingTable ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TablesPage;
