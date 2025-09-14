import { useState, useMemo } from 'react';

export const useSalesFilters = (allSales = [], globalStats = {}) => {
  const [selectedStatus, setSelectedStatus] = useState('en_preparacion');
  const [selectedTienda, setSelectedTienda] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    { value: "en_preparacion", label: "En preparación", icon: "⏳", color: "#f59e0b" },
    { value: "listo_para_envio", label: "Listo para entrega", icon: "📦", color: "#3b82f6" },
    { value: "enviado", label: "Enviado", icon: "🚚", color: "#8b5cf6" },
    { value: "entregado_y_cobrado", label: "Entregado", icon: "✅", color: "#10b981" },
    { value: "parcialmente_devuelta", label: "Parcialmente devuelta", icon: "↩️", color: "#f97316" },
    { value: "cancelada", label: "Cancelada", icon: "❌", color: "#ef4444" },
  ];

  const getStatusConfig = (status) => {
    const config = statusOptions.find(s => s.value === status);
    return config || { label: status, icon: "📋", color: "#6b7280" };
  };

  // Ya no necesitamos filtrar por estado localmente - se hace en backend
  // Las ventas que llegan ya están filtradas por el estado seleccionado
  const filteredSales = useMemo(() => {
    // Todas las ventas que llegan del backend ya están filtradas correctamente
    // por estado, tienda y búsqueda
    return allSales;
  }, [allSales]);

  // Estadísticas por estado - usar filteredStats del backend o calcular localmente como fallback
  const statusStats = useMemo(() => {
    // Si tenemos estadísticas filtradas del backend, usarlas
    if (globalStats && Object.keys(globalStats).length > 0) {
      console.log('📊 Using filtered stats from backend:', globalStats);
      return globalStats;
    }
    
    // Fallback: calcular localmente (solo debería ocurrir en caso de error)
    console.log('📊 Fallback: calculating stats locally from', allSales.length, 'sales');
    const stats = {};
    statusOptions.forEach(status => {
      stats[status.value] = allSales.filter(sale => sale.status === status.value).length;
    });
    return stats;
  }, [allSales, globalStats, statusOptions]);

  return {
    // Filter states
    selectedStatus,
    selectedTienda,
    searchTerm,
    
    // Filter setters
    setSelectedStatus,
    setSelectedTienda,
    setSearchTerm,
    
    // Data
    statusOptions,
    filteredSales,
    statusStats,
    
    // Utilities
    getStatusConfig
  };
};