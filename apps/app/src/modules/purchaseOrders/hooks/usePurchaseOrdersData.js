import { useState, useEffect, useCallback } from 'react';
import purchaseOrdersService from '../services/purchaseOrdersService';

export const usePurchaseOrdersData = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Obtener información del usuario del localStorage
  const getUserInfo = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  const user = getUserInfo();
  const userRole = user?.role || '';
  const userTienda = user?.tienda || '';
  const userId = user?.id || user?._id || '';

  // Cargar órdenes
  const loadOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError('');
      const data = await purchaseOrdersService.getAll(filters);
      const ordersData = data.orders || [];
      setOrders(ordersData);

      // Si no hay filtros de estado, guardar todas las órdenes para estadísticas
      if (!filters.status) {
        setAllOrders(ordersData);
      }
    } catch (err) {
      setError('Error al cargar órdenes de compra');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tiendas
  const loadTiendas = useCallback(async () => {
    try {
      const data = await purchaseOrdersService.getTiendas();
      setTiendas(data || []);
    } catch (err) {
      console.error('Error al cargar tiendas:', err);
    }
  }, []);

  // Cargar usuarios
  const loadUsers = useCallback(async (filters = {}) => {
    try {
      const data = await purchaseOrdersService.getUsers(filters);
      setUsers(data || []);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadTiendas();
  }, [loadTiendas]);

  return {
    orders,
    allOrders,
    tiendas,
    users,
    userRole,
    userTienda,
    userId,
    loading,
    error,
    loadOrders,
    loadTiendas,
    loadUsers,
    setError
  };
};
