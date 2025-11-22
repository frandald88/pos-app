import { useState, useCallback } from 'react';
import vacacionesService from '../services/vacacionesService';

export default function useVacacionesAdmin() {
  const [requests, setRequests] = useState([]);
  const [deletedRequests, setDeletedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [msg, setMsg] = useState('');

  // Cargar solicitudes activas
  const loadRequests = useCallback(async (filters = {}) => {
    setLoading(true);

    try {
      const data = await vacacionesService.getAll(filters);
      setRequests(data);
      setMsg('');
      console.log('✅ Vacation requests loaded:', data.length);
    } catch (error) {
      console.error('Error al cargar solicitudes:', error);

      if (error.response?.status === 403) {
        setMsg('⚠️ No tienes permisos para ver las solicitudes de vacaciones.');
      } else if (error.response?.status === 401) {
        setMsg('🔐 Sesión expirada. Inicia sesión nuevamente.');
        localStorage.removeItem('token');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setMsg('❌ Error al cargar solicitudes de vacaciones.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar solicitudes eliminadas
  const loadDeletedRequests = useCallback(async () => {
    setLoading(true);

    try {
      const data = await vacacionesService.getDeleted();
      setDeletedRequests(data);
      console.log('✅ Deleted vacation requests loaded:', data.length);
    } catch (error) {
      console.error('Error al cargar solicitudes eliminadas:', error);
      setMsg('❌ Error al cargar solicitudes eliminadas.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Actualizar estado de solicitud
  const updateStatus = useCallback(async (id, status, reason = '') => {
    if (updating === id) return;

    setUpdating(id);
    setMsg('');

    try {
      const response = await vacacionesService.updateStatus(id, status, reason);
      const statusText = status === 'aprobada' ? 'aprobada ✅' : 'rechazada ❌';
      setMsg(`${response.message || `Solicitud ${statusText}`}`);
      return response;
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      const errorMsg = error.response?.data?.message || 'Error al actualizar el estado de la solicitud';

      if (error.response?.status === 403) {
        setMsg('⚠️ No tienes permisos para modificar solicitudes.');
      } else if (error.response?.status === 404) {
        setMsg('⚠️ Solicitud no encontrada.');
      } else {
        setMsg(`❌ ${errorMsg}`);
      }
      throw error;
    } finally {
      setUpdating(null);
    }
  }, [updating]);

  // Eliminar solicitud
  const deleteRequest = useCallback(async (id, action = 'soft') => {
    setUpdating(id);

    try {
      const response = await vacacionesService.deleteRequest(id, action);
      setMsg(response.message + ' ✅');
      return response;
    } catch (error) {
      console.error('Error al eliminar solicitud:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error al eliminar solicitud'}`);
      throw error;
    } finally {
      setUpdating(null);
    }
  }, []);

  // Restaurar solicitud eliminada
  const restoreRequest = useCallback(async (id) => {
    setUpdating(id);

    try {
      const response = await vacacionesService.restoreRequest(id);
      setMsg(response.message + ' ✅');
      return response;
    } catch (error) {
      console.error('Error al restaurar solicitud:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error al restaurar solicitud'}`);
      throw error;
    } finally {
      setUpdating(null);
    }
  }, []);

  // Limpieza masiva
  const cleanupRequests = useCallback(async (options) => {
    setLoading(true);
    setMsg('');

    try {
      const response = await vacacionesService.cleanupRequests(options);
      setMsg(response.message + ' ✅');
      return response;
    } catch (error) {
      console.error('Error en limpieza:', error);
      setMsg(`❌ ${error.response?.data?.message || 'Error en limpieza masiva'}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    requests,
    deletedRequests,
    loading,
    updating,
    msg,
    setMsg,
    loadRequests,
    loadDeletedRequests,
    updateStatus,
    deleteRequest,
    restoreRequest,
    cleanupRequests
  };
}
