import { useState, useEffect } from 'react';
import deliveryService from '../services/deliveryService';

export const useDeliveryData = () => {
  const [orders, setOrders] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [users, setUsers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [userTienda, setUserTienda] = useState(null);
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
  }, []);

  // Cargar órdenes
  const loadOrders = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await deliveryService.getAllOrders(filters);
      setOrders(response.orders || []);
      return response;
    } catch (err) {
      console.error('Error loading orders:', err);
      setError('Error al cargar órdenes');
      setOrders([]);
      return { orders: [], pagination: null };
    } finally {
      setLoading(false);
    }
  };

  // Cargar tiendas
  const loadTiendas = async () => {
    try {
      const tiendasData = await deliveryService.getTiendas();
      setTiendas(tiendasData);
    } catch (err) {
      console.error('Error loading tiendas:', err);
      setTiendas([]);
    }
  };

  // Cargar usuarios
  const loadUsers = async (filters = {}) => {
    try {
      const usersData = await deliveryService.getUsers(filters);
      setUsers(usersData);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    }
  };

  // Cargar mis órdenes
  const loadMyOrders = async (filters = {}) => {
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
  };

  return {
    // Data
    orders,
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