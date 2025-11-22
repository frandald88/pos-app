import { useState, useEffect, useCallback } from 'react';
import deliveryService from '../services/deliveryService';

export const useDeliveryData = () => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]); // Todas las órdenes sin filtrar para estadísticas
  const [tiendas, setTiendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userTienda, setUserTienda] = useState(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar órdenes
  const loadOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const response = await deliveryService.getAllOrders(filters);
      setOrders(response.orders || []);

      // Actualizar allOrders si solo hay filtros de sistema (tiendaId), no filtros de usuario
      // Esto permite que las estadísticas se actualicen correctamente para todos los usuarios
      if (!filters.status && !filters.proveedor) {
        setAllOrders(response.orders || []);
      }

      return response;
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Error al cargar órdenes');
      setOrders([]);
      return { orders: [], pagination: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar tiendas
  const loadTiendas = useCallback(async () => {
    try {
      const tiendasData = await deliveryService.getTiendas();
      setTiendas(tiendasData);
    } catch (err) {
      console.error('Error loading tiendas:', err);
      setTiendas([]);
    }
  }, []);

  // Cargar usuarios
  const loadUsers = useCallback(async (filters = {}) => {
    try {
      const usersData = await deliveryService.getUsers(filters);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  }, []);

  // Cargar mis órdenes
  const loadMyOrders = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      const ordersData = await deliveryService.getMyOrders(filters);
      setOrders(ordersData);
      return ordersData;
    } catch (err) {
      console.error('Error loading my orders:', err);
      setError('Error al cargar mis órdenes');
      setOrders([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        // Cargar información del usuario
        const userInfo = await deliveryService.getUserInfo();
        setUserRole(userInfo.role || '');
        setUserTienda(userInfo.tienda || null);
        setUserId(userInfo._id || '');

        // Cargar tiendas y usuarios
        await Promise.all([
          loadTiendas(),
          loadUsers()
        ]);

      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [loadTiendas, loadUsers]);

  return {
    // Data
    orders,
    allOrders,
    tiendas,
    users,
    userRole,
    userTienda,
    userId,

    // State
    loading,
    error,

    // Actions
    setOrders,
    setError,
    loadOrders,
    loadTiendas,
    loadUsers,
    loadMyOrders
  };
};