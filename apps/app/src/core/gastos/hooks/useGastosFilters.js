import { useState } from 'react';

export const useGastosFilters = () => {
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [filtroTienda, setFiltroTienda] = useState('');
  const [filtroMetodoPago, setFiltroMetodoPago] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroInicio, setFiltroInicio] = useState('');
  const [filtroFin, setFiltroFin] = useState('');

  // Obtener filtros como objeto para API
  const getFilters = () => ({
    proveedor: filtroProveedor || undefined,
    tiendaId: filtroTienda || undefined,
    metodoPago: filtroMetodoPago || undefined,
    status: filtroEstado || undefined,
    startDate: filtroInicio || undefined,
    endDate: filtroFin || undefined,
  });

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFiltroProveedor('');
    setFiltroTienda('');
    setFiltroMetodoPago('');
    setFiltroEstado('');
    setFiltroInicio('');
    setFiltroFin('');
  };

  // Establecer filtros desde un objeto
  const setFilters = (filters) => {
    setFiltroProveedor(filters.proveedor || '');
    setFiltroTienda(filters.tiendaId || '');
    setFiltroMetodoPago(filters.metodoPago || '');
    setFiltroEstado(filters.status || '');
    setFiltroInicio(filters.startDate || '');
    setFiltroFin(filters.endDate || '');
  };

  // Verificar si hay filtros aplicados
  const hasActiveFilters = () => {
    return !!(filtroProveedor || filtroTienda || filtroMetodoPago || filtroEstado || filtroInicio || filtroFin);
  };

  // Obtener resumen de filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filtroProveedor) count++;
    if (filtroTienda) count++;
    if (filtroMetodoPago) count++;
    if (filtroEstado) count++;
    if (filtroInicio) count++;
    if (filtroFin) count++;
    return count;
  };

  // Obtener descripción de filtros activos
  const getActiveFiltersDescription = () => {
    const descriptions = [];
    if (filtroProveedor) descriptions.push(`Proveedor: ${filtroProveedor}`);
    if (filtroTienda) descriptions.push('Tienda específica');
    if (filtroMetodoPago) descriptions.push(`Método: ${filtroMetodoPago}`);
    if (filtroEstado) descriptions.push(`Estado: ${filtroEstado}`);
    if (filtroInicio) descriptions.push(`Desde: ${filtroInicio}`);
    if (filtroFin) descriptions.push(`Hasta: ${filtroFin}`);
    return descriptions.join(', ');
  };

  return {
    // Estados de filtros
    filtroProveedor,
    filtroTienda,
    filtroMetodoPago,
    filtroEstado,
    filtroInicio,
    filtroFin,

    // Setters
    setFiltroProveedor,
    setFiltroTienda,
    setFiltroMetodoPago,
    setFiltroEstado,
    setFiltroInicio,
    setFiltroFin,

    // Utilidades
    getFilters,
    clearFilters,
    setFilters,
    hasActiveFilters,
    getActiveFiltersCount,
    getActiveFiltersDescription,
  };
};