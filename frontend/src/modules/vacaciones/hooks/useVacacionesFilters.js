import { useState } from 'react';

export default function useVacacionesFilters() {
  const [filters, setFilters] = useState({
    status: '',
    limit: 50
  });

  const updateFilters = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const resetFilters = () => {
    setFilters({
      status: '',
      limit: 50
    });
  };

  return {
    filters,
    updateFilters,
    resetFilters
  };
}
