import { useState, useEffect, useRef } from 'react';
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
  const [productStats, setProductStats] = useState({}); // ⭐ NUEVO: Stats con conteos de categorías
  const initialLoadDone = useRef(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        setError('');

        // Cargar perfil y tiendas primero para determinar la tienda
        const [userProfile, tiendasData] = await Promise.all([
          salesService.getUserProfile(),
          salesService.getTiendas()
        ]);

        setTiendas(tiendasData);
        setUserRole(userProfile.role);

        // Determinar tienda a usar
        let tiendaToUse = null;
        if (userProfile.role !== 'admin') {
          tiendaToUse = userProfile.tienda;
        } else {
          if (tiendasData.length === 1) {
            tiendaToUse = tiendasData[0]._id;
          } else {
            const lastSelectedTienda = localStorage.getItem('tiendaId');
            if (lastSelectedTienda && tiendasData.some(t => t._id === lastSelectedTienda)) {
              tiendaToUse = lastSelectedTienda;
            }
          }
        }

        // Cargar clientes y productos en paralelo una vez que sabemos la tienda
        if (tiendaToUse) {
          const [clientesData, productsResponse] = await Promise.all([
            salesService.getClientes(),
            salesService.getProducts(tiendaToUse)
          ]);

          setClientes(clientesData);
          setProducts(productsResponse.products);
          setProductStats(productsResponse.stats); // ⭐ NUEVO
          setTiendaSeleccionada(tiendaToUse);
          localStorage.setItem('tiendaId', tiendaToUse);
          initialLoadDone.current = true;
        } else {
          // Sin tienda seleccionada, solo cargar clientes
          const clientesData = await salesService.getClientes();
          setClientes(clientesData);
          initialLoadDone.current = true; // Marcar como cargado incluso sin tienda
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
  const loadProducts = async (tiendaId, searchQuery = '', category = '') => {
    try {
      const productsResponse = await salesService.getProducts(tiendaId, searchQuery, category);
      setProducts(productsResponse.products);
      setProductStats(productsResponse.stats); // ⭐ NUEVO
    } catch (err) {
      console.error('Error loading products:', err);
      setProducts([]);
      setProductStats({});
    }
  };

  // ⭐ NUEVO: Buscar producto por código de barras en toda la BD
  const searchProductByBarcode = async (barcode) => {
    try {
      const productsResponse = await salesService.getProducts(tiendaSeleccionada, barcode);
      return productsResponse.products.find(p => p.barcode === barcode);
    } catch (err) {
      console.error('Error searching product by barcode:', err);
      return null;
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

  // Efecto para cargar productos y repartidores cuando cambia la tienda (después de carga inicial)
  useEffect(() => {
    if (tiendaSeleccionada && initialLoadDone.current) {
      // Guardar en localStorage para que otros componentes puedan acceder
      localStorage.setItem('tiendaId', tiendaSeleccionada);

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
    productStats, // ⭐ NUEVO: Stats con conteos de categorías

    // State
    loading,
    error,

    // Actions
    setTiendaSeleccionada,
    loadProducts,
    loadDeliveryUsers,
    reloadClientes,
    searchProductByBarcode // ⭐ NUEVO: Búsqueda de productos por barcode en BD
  };
};