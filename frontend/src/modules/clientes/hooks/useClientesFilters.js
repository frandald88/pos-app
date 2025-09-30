import { useState } from 'react';

export const useClientesFilters = () => {
  const [clienteFiltro, setClienteFiltro] = useState('');
  const [searchLimit, setSearchLimit] = useState(50);

  // Aplicar filtros a la lista de clientes
  const filterClientes = (clientes) => {
    if (!clienteFiltro.trim()) {
      return clientes;
    }

    const filtro = clienteFiltro.toLowerCase();
    return clientes.filter((cliente) => {
      const nombre = (cliente.nombre || '').toLowerCase();
      const telefono = (cliente.telefono || '').toLowerCase();
      const email = (cliente.email || '').toLowerCase();
      const direccion = (cliente.direccion || '').toLowerCase();

      return (
        nombre.includes(filtro) ||
        telefono.includes(filtro) ||
        email.includes(filtro) ||
        direccion.includes(filtro)
      );
    });
  };

  // Obtener estadísticas de filtros
  const getFilterStats = (clientes) => {
    const filteredClientes = filterClientes(clientes);
    
    return {
      total: clientes.length,
      filtered: filteredClientes.length,
      hasActiveFilter: !!clienteFiltro.trim()
    };
  };

  // Limpiar filtros
  const clearFilters = () => {
    setClienteFiltro('');
  };

  // Establecer filtro desde URL o storage
  const setFilterFromParams = (params) => {
    if (params.search) {
      setClienteFiltro(params.search);
    }
    if (params.limit) {
      setSearchLimit(parseInt(params.limit) || 50);
    }
  };

  // Obtener filtros como objeto para API
  const getApiFilters = () => ({
    search: clienteFiltro.trim() || undefined,
    limit: searchLimit
  });

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return !!clienteFiltro.trim();
  };

  // Obtener descripción de filtros activos
  const getActiveFiltersDescription = () => {
    const descriptions = [];
    
    if (clienteFiltro.trim()) {
      descriptions.push(`Búsqueda: "${clienteFiltro}"`);
    }
    
    return descriptions.length > 0 
      ? descriptions.join(', ')
      : 'Sin filtros activos';
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (clienteFiltro.trim()) count++;
    return count;
  };

  return {
    // Estados de filtros
    clienteFiltro,
    searchLimit,

    // Setters
    setClienteFiltro,
    setSearchLimit,

    // Utilidades de filtrado
    filterClientes,
    getFilterStats,
    clearFilters,
    setFilterFromParams,
    getApiFilters,
    hasActiveFilters,
    getActiveFiltersDescription,
    getActiveFiltersCount
  };
};