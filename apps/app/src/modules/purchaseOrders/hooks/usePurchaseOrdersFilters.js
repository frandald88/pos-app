import { useState, useMemo } from 'react';

export const usePurchaseOrdersFilters = (orders) => {
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTienda, setFiltroTienda] = useState('');

  // Filtrar órdenes basado en búsqueda
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;

    const term = searchTerm.toLowerCase();
    return orders.filter(order => {
      // Manejar proveedor como string u objeto (datos viejos)
      const proveedorNombre = typeof order.proveedor === 'object'
        ? order.proveedor?.nombre
        : order.proveedor;

      return (
        proveedorNombre?.toLowerCase().includes(term) ||
        order.producto?.toLowerCase().includes(term) ||
        order._id?.toLowerCase().includes(term)
      );
    });
  }, [orders, searchTerm]);

  return {
    filtroStatus,
    searchTerm,
    filtroTienda,
    filteredOrders,
    setFiltroStatus,
    setSearchTerm,
    setFiltroTienda
  };
};
