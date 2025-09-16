import { useState, useEffect } from 'react';
import axios from 'axios';
import apiBaseUrl from '../../../config/api';

export const useSalesTracking = () => {
  const [sales, setSales] = useState([]);
  const [allSales, setAllSales] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [globalStats, setGlobalStats] = useState({}); // Nuevas estadísticas globales
  const token = localStorage.getItem('token');

  const fetchSales = async (filters = {}) => {
    setLoading(true);
    setError('');
    
    try {
      // Construir URL con parámetros de filtro
      const params = new URLSearchParams();
      // Agregar estado seleccionado
      if (filters.status && filters.status.trim() !== '') {
        params.append('status', filters.status);
      }
      // Solo agregar tiendaId si tiene valor y no está vacío
      if (filters.tiendaId && filters.tiendaId.trim() !== '') {
        params.append('tiendaId', filters.tiendaId);
      }
      // Agregar término de búsqueda si existe
      if (filters.search && filters.search.trim() !== '') {
        params.append('search', filters.search.trim());
      }
      
      const url = `${apiBaseUrl}/api/sales${params.toString() ? `?${params.toString()}` : ''}`;
      
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allSalesData = [];
      
      // Manejar diferentes estructuras de respuesta
      if (response.data.data?.sales) {
        allSalesData = response.data.data.sales;
        if (response.data.data.userRole) {
          setUserRole(response.data.data.userRole);
        }
        // Nuevas estadísticas globales
        if (response.data.data.globalStats) {
          setGlobalStats(response.data.data.globalStats);
        }
      } else if (response.data.sales) {
        allSalesData = response.data.sales;
        if (response.data.userRole) {
          setUserRole(response.data.userRole);
        }
        // Nuevas estadísticas globales
        if (response.data.globalStats) {
          setGlobalStats(response.data.globalStats);
        }
      } else if (Array.isArray(response.data)) {
        allSalesData = response.data;
      }
      
      setAllSales(allSalesData);
      console.log(`Loaded ${allSalesData.length} total sales`);
      
      return allSalesData;
    } catch (err) {
      console.error('Error cargando ventas:', err);
      setSales([]);
      setAllSales([]);
      setError('Error al cargar las ventas');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchTiendas = async () => {
    try {
      const response = await axios.get(`${apiBaseUrl}/api/sales/tiendas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const tiendasData = response.data.data || response.data || [];
      setTiendas(tiendasData);
      return tiendasData;
    } catch (err) {
      console.error('Error cargando tiendas:', err);
      return [];
    }
  };

  const updateSaleStatus = async (saleId, newStatus) => {
    setUpdatingOrderId(saleId);
    setError('');
    
    try {
      console.log(`Updating sale ${saleId} to status ${newStatus}`);
      
      const response = await axios.put(
        `${apiBaseUrl}/api/sales/${saleId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('Status update response:', response.data);
      return response.data;
    } catch (err) {
      console.error('Error actualizando estado:', err);
      setError('Error al actualizar el estado del pedido');
      throw err;
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Comentando carga inicial - se maneja desde OrderTrackingPage.js
  // useEffect(() => {
  //   fetchSales();
  // }, []);

  // Cargar tiendas cuando se detecta que el usuario es admin
  useEffect(() => {
    if (userRole === 'admin') {
      fetchTiendas();
    }
  }, [userRole]);

  return {
    // Data
    sales,
    allSales,
    tiendas,
    userRole,
    globalStats, // Nuevas estadísticas globales
    
    // State
    loading,
    error,
    updatingOrderId,
    
    // Setters
    setSales,
    setAllSales,
    setError,
    
    // Actions
    fetchSales,
    fetchTiendas,
    updateSaleStatus
  };
};