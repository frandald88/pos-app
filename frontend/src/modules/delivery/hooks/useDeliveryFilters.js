import { useState, useMemo } from 'react';

export const useDeliveryFilters = (orders = []) => {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTienda, setFiltroTienda] = useState('');
  const [filtroProveedor, setFiltroProveedor] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Filtrar órdenes según los criterios activos
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtrar por status
    if (filtroStatus !== 'todos') {
      filtered = filtered.filter(order => order.status === filtroStatus);
    }

    // Filtrar por tienda
    if (filtroTienda) {
      filtered = filtered.filter(order => 
        order.tienda?._id === filtroTienda || order.tienda === filtroTienda
      );
    }

    // Filtrar por proveedor
    if (filtroProveedor) {
      filtered = filtered.filter(order =>
        order.proveedor.toLowerCase().includes(filtroProveedor.toLowerCase())
      );
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.proveedor.toLowerCase().includes(searchLower) ||
        order.producto.toLowerCase().includes(searchLower) ||
        order._id.toLowerCase().includes(searchLower) ||
        order.tienda?.nombre?.toLowerCase().includes(searchLower) ||
        order.assignedTo?.username?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por rango de fechas
    if (fechaInicio || fechaFin) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.fechaEmision);
        
        if (fechaInicio && fechaFin) {
          const inicio = new Date(fechaInicio);
          const fin = new Date(fechaFin);
          return orderDate >= inicio && orderDate <= fin;
        } else if (fechaInicio) {
          const inicio = new Date(fechaInicio);
          return orderDate >= inicio;
        } else if (fechaFin) {
          const fin = new Date(fechaFin);
          return orderDate <= fin;
        }
        
        return true;
      });
    }

    return filtered;
  }, [orders, filtroStatus, searchTerm, filtroTienda, filtroProveedor, fechaInicio, fechaFin]);

  // Obtener estadísticas de órdenes
  const orderStats = useMemo(() => {
    const stats = {
      total: orders.length,
      pendientes: 0,
      completadas: 0,
      canceladas: 0,
      filtradas: filteredOrders.length
    };

    orders.forEach(order => {
      switch (order.status) {
        case 'pendiente':
          stats.pendientes++;
          break;
        case 'completada':
          stats.completadas++;
          break;
        case 'cancelada':
          stats.canceladas++;
          break;
        default:
          break;
      }
    });

    return stats;
  }, [orders, filteredOrders.length]);

  // Obtener lista de proveedores únicos
  const uniqueProveedores = useMemo(() => {
    const proveedores = new Set();
    orders.forEach(order => {
      if (order.proveedor) {
        proveedores.add(order.proveedor);
      }
    });
    return Array.from(proveedores).sort();
  }, [orders]);

  // Limpiar todos los filtros
  const clearFilters = () => {
    setFiltroStatus('todos');
    setSearchTerm('');
    setFiltroTienda('');
    setFiltroProveedor('');
    setFechaInicio('');
    setFechaFin('');
  };

  // Aplicar filtros predefinidos
  const applyQuickFilter = (filterType) => {
    clearFilters();
    switch (filterType) {
      case 'pendientes':
        setFiltroStatus('pendiente');
        break;
      case 'completadas':
        setFiltroStatus('completada');
        break;
      case 'canceladas':
        setFiltroStatus('cancelada');
        break;
      case 'hoy':
        const today = new Date().toISOString().split('T')[0];
        setFechaInicio(today);
        setFechaFin(today);
        break;
      case 'semana':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        setFechaInicio(weekAgo.toISOString().split('T')[0]);
        break;
      default:
        break;
    }
  };

  return {
    // Filter states
    filtroStatus,
    searchTerm,
    filtroTienda,
    filtroProveedor,
    fechaInicio,
    fechaFin,

    // Filter setters
    setFiltroStatus,
    setSearchTerm,
    setFiltroTienda,
    setFiltroProveedor,
    setFechaInicio,
    setFechaFin,

    // Computed data
    filteredOrders,
    orderStats,
    uniqueProveedores,

    // Actions
    clearFilters,
    applyQuickFilter
  };
};