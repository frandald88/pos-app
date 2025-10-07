import { useState, useCallback } from 'react';

export const useEmployeeHistoryFilters = () => {
  const [rankStartDate, setRankStartDate] = useState('');
  const [rankEndDate, setRankEndDate] = useState('');
  const [selectedTienda, setSelectedTienda] = useState('');

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setRankStartDate('');
    setRankEndDate('');
    setSelectedTienda('');
  }, []);

  return {
    // Estados de filtros
    rankStartDate,
    rankEndDate,
    selectedTienda,

    // Setters
    setRankStartDate,
    setRankEndDate,
    setSelectedTienda,

    // Utilidades
    clearFilters
  };
};
