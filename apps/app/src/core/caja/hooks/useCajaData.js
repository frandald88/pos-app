import { useState, useEffect } from 'react';
import axios from 'axios';
import apiBaseUrl from '../../../config/api';

export const useCajaData = () => {
  const [resultados, setResultados] = useState(null);
  const [mixedPaymentStats, setMixedPaymentStats] = useState(null);
  const [tiendas, setTiendas] = useState([]);
  const [loading, setCargando] = useState(false);
  const [mixedStatsLoading, setCargandoMixedStats] = useState(false);
  const [tiendasLoading, setCargandoTiendas] = useState(false);
  const [error, setError] = useState('');
  
  const token = localStorage.getItem('token');

  // Cargar tiendas al inicializar
  useEffect(() => {
    const cargarTiendas = async () => {
      setCargandoTiendas(true);
      try {
        const response = await axios.get(`${apiBaseUrl}/api/tiendas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
        setTiendas(response.data.data.tiendas);
      } catch (error) {
        console.error("[ERROR] Error al cargar tiendas:", error);
        setError("[ERROR] Error al cargar tiendas");
        setTimeout(() => setError(""), 3000);
      } finally {
        setCargandoTiendas(false);
      }
    };

    if (token) {
      cargarTiendas();
    }
  }, [token]);

  // Generar reporte de corte - soporta modo período o modo turno
  const generarCorte = async (fechaInicio, fechaFin, tiendaSeleccionada, turnoId = null) => {
    const params = {};

    // ⭐ Modo turno: solo necesitamos el turnoId
    if (turnoId) {
      params.turnoId = turnoId;
    } else {
      // ⭐ Modo período: necesitamos fechas
      if (!fechaInicio || !fechaFin) {
        setError("[ERROR] Debes seleccionar fechas válidas");
        return false;
      }

      const startDateObj = new Date(fechaInicio);
      const endDateObj = new Date(fechaFin);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        setError("[ERROR] Las fechas proporcionadas no son válidas");
        return false;
      }

      params.startDate = startDateObj.toISOString().slice(0, 10);
      params.endDate = endDateObj.toISOString().slice(0, 10);
      params.startTime = startDateObj.toTimeString().slice(0, 8);
      params.endTime = endDateObj.toTimeString().slice(0, 8);

      if (tiendaSeleccionada) {
        params.tiendaId = tiendaSeleccionada;
      }
    }


    setCargando(true);
    setError('');
    
    try {
      const response = await axios.get(`${apiBaseUrl}/api/caja/reporte`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      // Extraer los datos del objeto 'data' si existe
      const reportData = response.data.data || response.data;

      setResultados(reportData);
      setError("[SUCCESS] Corte generado exitosamente");
      setTimeout(() => setError(""), 3000);
      return true;
    } catch (error) {
      console.error('[ERROR] Error al generar corte:', error.response?.data || error.message);
      setError(`[ERROR] Error al generar corte: ${error.response?.data?.message || error.message}`);
      return false;
    } finally {
      setCargando(false);
    }
  };

  // Obtener estadísticas de pagos mixtos
  const fetchMixedPaymentStats = async (fechaInicio, fechaFin, tiendaSeleccionada) => {
    if (!fechaInicio || !fechaFin) return;
    
    setCargandoMixedStats(true);
    try {
      const startDateObj = new Date(fechaInicio);
      const endDateObj = new Date(fechaFin);

      const params = {
        startDate: startDateObj.toISOString().slice(0, 10),
        endDate: endDateObj.toISOString().slice(0, 10),
      };

      if (tiendaSeleccionada) {
        params.tiendaId = tiendaSeleccionada;
      }

      const response = await axios.get(`${apiBaseUrl}/api/sales/mixed-payment-stats`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      
      // Extraer los datos del objeto 'data' si existe
      const mixedStatsData = response.data.data || response.data;
      
      setMixedPaymentStats(mixedStatsData);
    } catch (error) {
      console.error("[ERROR] Error al obtener estadísticas de pagos mixtos:", error);
    } finally {
      setCargandoMixedStats(false);
    }
  };

  // ⭐ NUEVO: Obtener turnos por fecha y tienda
  const obtenerTurnos = async (fechaInicio, fechaFin, tiendaId = null) => {
    try {
      const params = {};

      if (fechaInicio) {
        params.fechaInicio = new Date(fechaInicio).toISOString().slice(0, 10);
      }
      if (fechaFin) {
        params.fechaFin = new Date(fechaFin).toISOString().slice(0, 10);
      }
      if (tiendaId) {
        params.tienda = tiendaId;
      }

      params.limit = 50; // Traer hasta 50 turnos

      const response = await axios.get(`${apiBaseUrl}/api/turnos/historial`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      return response.data.data.turnos || [];
    } catch (error) {
      console.error('[ERROR] Error al obtener turnos:', error);
      setError('[ERROR] Error al cargar turnos');
      return [];
    }
  };

  // Limpiar resultados
  const limpiarResultados = () => {
    setResultados(null);
    setMixedPaymentStats(null);
    setError('');
  };

  return {
    // Data
    resultados,
    mixedPaymentStats,
    tiendas,
    
    // Loading states
    loading,
    mixedStatsLoading,
    tiendasLoading,
    
    // Error
    error,
    setError,
    
    // Actions
    generarCorte,
    fetchMixedPaymentStats,
    obtenerTurnos, // ⭐ NUEVO
    limpiarResultados
  };
};