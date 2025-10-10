import { useState, useCallback } from 'react';

export const useTiendasFilters = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [includeStats, setIncludeStats] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);

  // Aplicar filtros a la lista de tiendas
  const filterTiendas = (tiendas) => {
    if (!searchTerm.trim()) {
      return tiendas;
    }

    const filtro = searchTerm.toLowerCase();
    return tiendas.filter((tienda) => {
      const nombre = (tienda.nombre || '').toLowerCase();
      const direccion = (tienda.direccion || '').toLowerCase();
      const telefono = (tienda.telefono || '').toLowerCase();

      return (
        nombre.includes(filtro) ||
        direccion.includes(filtro) ||
        telefono.includes(filtro)
      );
    });
  };

  // Obtener estadísticas de filtros
  const getFilterStats = (tiendas) => {
    const filteredTiendas = filterTiendas(tiendas);
    
    return {
      total: tiendas.length,
      filtered: filteredTiendas.length,
      hasActiveFilter: !!searchTerm.trim()
    };
  };

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setIncludeStats(false);
    setIncludeArchived(false);
    setPage(1);
  };

  // Establecer filtros desde parámetros
  const setFiltersFromParams = (params) => {
    if (params.search) {
      setSearchTerm(params.search);
    }
    if (params.includeStats !== undefined) {
      setIncludeStats(params.includeStats);
    }
    if (params.includeArchived !== undefined) {
      setIncludeArchived(params.includeArchived);
    }
    if (params.limit) {
      setLimit(parseInt(params.limit) || 50);
    }
    if (params.page) {
      setPage(parseInt(params.page) || 1);
    }
  };

  // Obtener filtros como objeto para API
  const getApiFilters = useCallback(() => ({
    search: searchTerm.trim() || undefined,
    includeStats: includeStats || undefined,
    includeArchived: includeArchived,
    limit,
    page
  }), [searchTerm, includeStats, includeArchived, limit, page]);

  // Verificar si hay filtros activos
  const hasActiveFilters = () => {
    return !!searchTerm.trim() || includeStats || includeArchived || page > 1;
  };

  // Obtener descripción de filtros activos
  const getActiveFiltersDescription = () => {
    const descriptions = [];
    
    if (searchTerm.trim()) {
      descriptions.push(`Búsqueda: "${searchTerm}"`);
    }
    if (includeStats) {
      descriptions.push('Con estadísticas');
    }
    if (includeArchived) {
      descriptions.push('Incluyendo archivadas');
    }
    if (page > 1) {
      descriptions.push(`Página: ${page}`);
    }
    
    return descriptions.length > 0 
      ? descriptions.join(', ')
      : 'Sin filtros activos';
  };

  // Contar filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm.trim()) count++;
    if (includeStats) count++;
    if (includeArchived) count++;
    if (page > 1) count++;
    return count;
  };

  // Resetear paginación (útil para nuevas búsquedas)
  const resetPagination = () => {
    setPage(1);
  };

  // Ir a página siguiente
  const nextPage = () => {
    setPage(prev => prev + 1);
  };

  // Ir a página anterior
  const prevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  // Ir a página específica
  const goToPage = (pageNumber) => {
    setPage(Math.max(1, pageNumber));
  };

  return {
    // Estados de filtros
    searchTerm,
    includeStats,
    includeArchived,
    limit,
    page,

    // Setters
    setSearchTerm,
    setIncludeStats,
    setIncludeArchived,
    setLimit,
    setPage,

    // Utilidades de filtrado
    filterTiendas,
    getFilterStats,
    clearFilters,
    setFiltersFromParams,
    getApiFilters,
    hasActiveFilters,
    getActiveFiltersDescription,
    getActiveFiltersCount,

    // Paginación
    resetPagination,
    nextPage,
    prevPage,
    goToPage
  };
};