import { useState, useEffect } from 'react';
import salesService from '../services/salesService';

export const useSalesData = () => {
  const [products, setProducts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [deliveryUsers, setDeliveryUsers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        // Cargar datos en paralelo
        const [clientesData, userProfile, tiendasData] = await Promise.all([
          salesService.getClientes(),
          salesService.getUserProfile(),
          salesService.getTiendas()
        ]);

        setClientes(clientesData);
        setTiendas(tiendasData);
        
        // Configurar usuario
        setUserRole(userProfile.role);
        if (userProfile.role !== 'admin') {
          setTiendaSeleccionada(userProfile.tienda);
        }

      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar productos cuando cambia la tienda
  const loadProducts = async (tiendaId) => {
    try {
      const productsData = await salesService.getProducts(tiendaId);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
    }
  };

  // Cargar repartidores cuando cambia la tienda
  const loadDeliveryUsers = async (tiendaId = null) => {
    try {
      const users = await salesService.getDeliveryUsers();
      let filteredDelivery = users;

      // Filtrar por tienda si es admin y se especifica tienda
      if (tiendaId && userRole === 'admin') {
        filteredDelivery = users.filter(u => u.tienda && u.tienda._id === tiendaId);
      }

      setDeliveryUsers(filteredDelivery);
    } catch (err) {
      console.error('Error loading delivery users:', err);
      setDeliveryUsers([]);
    }
  };

  // ⭐ NUEVO: Recargar lista de clientes
  const reloadClientes = async () => {
    try {
      const clientesData = await salesService.getClientes();
      setClientes(clientesData);
    } catch (err) {
      console.error('Error reloading clientes:', err);
    }
  };

  // Efecto para cargar productos y repartidores cuando cambia la tienda
  useEffect(() => {
    if (tiendaSeleccionada) {
      loadProducts(tiendaSeleccionada);
      
      if (userRole === 'admin') {
        loadDeliveryUsers(tiendaSeleccionada);
      } else {
        loadDeliveryUsers();
      }
    }
  }, [tiendaSeleccionada, userRole]);

  return {
    // Data
    products,
    clientes,
    tiendas,
    deliveryUsers,
    userRole,
    tiendaSeleccionada,

    // State
    loading,
    error,

    // Actions
    setTiendaSeleccionada,
    loadProducts,
    loadDeliveryUsers,
    reloadClientes // ⭐ NUEVO
  };
};