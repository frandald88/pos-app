import { useState, useMemo } from 'react';

// SVG Icons
const Icons = {
  clock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  package: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  truck: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  arrowReturn: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  xmark: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  clipboard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
};

export const useSalesFilters = (allSales = [], globalStats = {}) => {
  const [selectedStatus, setSelectedStatus] = useState('en_preparacion');
  const [selectedTienda, setSelectedTienda] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const statusOptions = [
    { value: "en_preparacion", label: "En preparación", icon: <Icons.clock />, color: "#f59e0b" },
    { value: "listo_para_envio", label: "Listo para entrega", icon: <Icons.package />, color: "#3b82f6" },
    { value: "enviado", label: "Enviado", icon: <Icons.truck />, color: "#8b5cf6" },
    { value: "entregado_y_cobrado", label: "Entregado", icon: <Icons.check />, color: "#10b981" },
    { value: "parcialmente_devuelta", label: "Parcialmente devuelta", icon: <Icons.arrowReturn />, color: "#f97316" },
    { value: "cancelada", label: "Cancelada", icon: <Icons.xmark />, color: "#ef4444" },
  ];

  const getStatusConfig = (status) => {
    const config = statusOptions.find(s => s.value === status);
    return config || { label: status, icon: <Icons.clipboard />, color: "#6b7280" };
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
      return globalStats;
    }
    
    // Fallback: calcular localmente (solo debería ocurrir en caso de error)
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