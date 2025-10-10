import { useMemo } from 'react';

export const useSalesActions = () => {
  
  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  // Formatear fecha
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener configuración de estado de stock
  const getStockStatus = (stock) => {
    if (stock === 0) return { color: '#ef4444', label: 'Sin stock', icon: '❌' };
    if (stock <= 10) return { color: '#f59e0b', label: 'Bajo stock', icon: '⚠️' };
    return { color: '#10b981', label: 'En stock', icon: '✅' };
  };

  return {
    formatCurrency,
    formatDate,
    getStockStatus
  };
};