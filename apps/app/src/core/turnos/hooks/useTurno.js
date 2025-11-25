import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const useTurno = () => {
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener turno activo
  // Si se proporciona tiendaId, busca el turno de esa tienda específica (solo para admin)
  const fetchTurnoActivo = useCallback(async (tiendaId = null) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const url = tiendaId
        ? `${API_URL}/api/turnos/activo?tiendaId=${tiendaId}`
        : `${API_URL}/api/turnos/activo`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // El backend devuelve { success, message, data: { turno: ... } }
      const turno = response.data.data.turno;
      setTurnoActivo(turno);

      // Guardar turnoId en localStorage para uso en otros componentes
      if (turno && turno._id) {
        localStorage.setItem('turnoId', turno._id);
      } else {
        localStorage.removeItem('turnoId');
      }
    } catch (err) {
      console.error('Error al obtener turno activo:', err);
      setError(err.response?.data?.message || 'Error al obtener turno activo');
      setTurnoActivo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Iniciar turno
  const iniciarTurno = useCallback(async (efectivoInicial, tienda, notasApertura = '') => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/turnos/iniciar`,
        { efectivoInicial, tienda, notasApertura },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const turno = response.data.data.turno;
      setTurnoActivo(turno);

      // Guardar turnoId en localStorage
      if (turno && turno._id) {
        localStorage.setItem('turnoId', turno._id);
      }

      return { success: true, turno };
    } catch (err) {
      console.error('Error al iniciar turno:', err);
      const errorMsg = err.response?.data?.message || 'Error al iniciar turno';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cerrar turno
  const cerrarTurno = useCallback(async (turnoId, efectivoFinal, notasCierre = '') => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/api/turnos/cerrar`,
        { turnoId, efectivoFinal, notasCierre },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setTurnoActivo(null);

      // Remover turnoId de localStorage
      localStorage.removeItem('turnoId');

      return { success: true, turno: response.data.data.turno };
    } catch (err) {
      console.error('Error al cerrar turno:', err);
      const errorMsg = err.response?.data?.message || 'Error al cerrar turno';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener resumen del turno para el corte
  const getResumenTurno = useCallback(async (turnoId) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/turnos/${turnoId}/resumen`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error al obtener resumen del turno:', err);
      const errorMsg = err.response?.data?.message || 'Error al obtener resumen';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtener historial de turnos
  const getHistorial = useCallback(async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page,
        limit,
        ...filters
      });

      const response = await axios.get(`${API_URL}/api/turnos/historial?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return { success: true, data: response.data };
    } catch (err) {
      console.error('Error al obtener historial:', err);
      const errorMsg = err.response?.data?.message || 'Error al obtener historial';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar turno activo al montar el componente
  useEffect(() => {
    // Verificar si hay una tienda seleccionada en localStorage
    const tiendaId = localStorage.getItem('tiendaId');
    fetchTurnoActivo(tiendaId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar al montar

  // Función para obtener turno activo (retorna promesa con datos)
  const getTurnoActivo = useCallback(async (tiendaId = null) => {
    try {
      const token = localStorage.getItem('token');
      const url = tiendaId
        ? `${API_URL}/api/turnos/activo?tiendaId=${tiendaId}`
        : `${API_URL}/api/turnos/activo`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data; // Retorna { success, data: { turno: ... } }
    } catch (err) {
      console.error('Error al obtener turno activo:', err);
      return {
        success: false,
        error: err.response?.data?.message || 'Error al obtener turno activo',
        data: { turno: null }
      };
    }
  }, []);

  return {
    turnoActivo,
    loading,
    error,
    iniciarTurno,
    cerrarTurno,
    getResumenTurno,
    getHistorial,
    getTurnoActivo, // Nueva función para obtener turno activo
    refetch: fetchTurnoActivo
  };
};
