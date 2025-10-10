import { useState } from 'react';

export const useDevolucionesFilters = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tiendaId, setTiendaId] = useState('');
  const [status, setStatus] = useState('');
  const [refundMethod, setRefundMethod] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  // Obtener filtros como objeto para API
  const getFilters = () => ({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    tiendaId: tiendaId || undefined,
    status: status || undefined,
    refundMethod: refundMethod || undefined,
    page,
    limit,
  });

  // Limpiar todos los filtros
  const clearFilters = () => {
    setStartDate('');
    setEndDate('');
    setTiendaId('');
    setStatus('');
    setRefundMethod('');
    setPage(1);
    setLimit(50);
  };

  // Establecer filtros desde un objeto
  const setFilters = (filters) => {
    setStartDate(filters.startDate || '');
    setEndDate(filters.endDate || '');
    setTiendaId(filters.tiendaId || '');
    setStatus(filters.status || '');
    setRefundMethod(filters.refundMethod || '');
    setPage(filters.page || 1);
    setLimit(filters.limit || 50);
  };

  // Verificar si hay filtros aplicados
  const hasActiveFilters = () => {
    return !!(startDate || endDate || tiendaId || status || refundMethod);
  };

  // Obtener resumen de filtros activos
  const getActiveFiltersCount = () => {
    let count = 0;
    if (startDate) count++;
    if (endDate) count++;
    if (tiendaId) count++;
    if (status) count++;
    if (refundMethod) count++;
    return count;
  };

  // Obtener descripción de filtros activos
  const getActiveFiltersDescription = () => {
    const descriptions = [];
    if (startDate) descriptions.push(`Desde: ${startDate}`);
    if (endDate) descriptions.push(`Hasta: ${endDate}`);
    if (tiendaId) descriptions.push('Tienda específica');
    if (status) descriptions.push(`Estado: ${status}`);
    if (refundMethod) descriptions.push(`Método: ${refundMethod}`);
    return descriptions.join(', ');
  };

  return {
    // Estados de filtros
    startDate,
    endDate,
    tiendaId,
    status,
    refundMethod,
    page,
    limit,

    // Setters
    setStartDate,
    setEndDate,
    setTiendaId,
    setStatus,
    setRefundMethod,
    setPage,
    setLimit,

    // Utilidades
    getFilters,
    clearFilters,
    setFilters,
    hasActiveFilters,
    getActiveFiltersCount,
    getActiveFiltersDescription,
  };
};