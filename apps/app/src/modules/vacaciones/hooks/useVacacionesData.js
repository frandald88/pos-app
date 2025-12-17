import { useState, useCallback, useRef } from 'react';
import vacacionesService from '../services/vacacionesService';

export default function useVacacionesData() {
  const [users, setUsers] = useState([]);
  const [replacementOptions, setReplacementOptions] = useState([]);
  const [daysAvailable, setDaysAvailable] = useState(null);
  const [daysSummary, setDaysSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingDays, setUpdatingDays] = useState(false);
  const [msg, setMsg] = useState('');

  // ✅ OPTIMIZACIÓN: Refs para prevenir llamadas duplicadas
  const loadingDaysRef = useRef(false);
  const loadingSummaryRef = useRef(false);
  const loadingReplacementsRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const lastTiendaIdRef = useRef(null);

  // Cargar todos los usuarios (para admin)
  const loadUsers = useCallback(async () => {
    try {
      const data = await vacacionesService.getAllUsers();
      setUsers(data);
      console.log('Users loaded:', data.length);
    } catch (error) {
      console.error('Error loading users:', error);
      handleAuthError(error);
    }
  }, []);

  // Cargar días disponibles
  const loadDaysAvailable = useCallback(async (userId) => {
    if (!userId) return;

    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingDaysRef.current && lastUserIdRef.current === userId) {
      console.log('Skipping duplicate loadDaysAvailable call for:', userId);
      return;
    }

    loadingDaysRef.current = true;
    lastUserIdRef.current = userId;

    try {
      const data = await vacacionesService.getDaysAvailable(userId);
      setDaysAvailable(data);
      console.log('Days available loaded:', data);
    } catch (error) {
      console.error('Error loading available days:', error);
      setDaysAvailable(null);
    } finally {
      loadingDaysRef.current = false;
    }
  }, []);

  // Cargar resumen de días
  const loadDaysSummary = useCallback(async (userId) => {
    if (!userId) return;

    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingSummaryRef.current && lastUserIdRef.current === userId) {
      console.log('Skipping duplicate loadDaysSummary call for:', userId);
      return;
    }

    loadingSummaryRef.current = true;

    try {
      const data = await vacacionesService.getDaysSummary(userId);
      setDaysSummary(data);
      console.log('Days summary loaded:', data);
    } catch (error) {
      console.error('Error loading days summary:', error);
      setDaysSummary(null);
    } finally {
      loadingSummaryRef.current = false;
    }
  }, []);

  // Cargar opciones de reemplazo
  const loadReplacementOptions = useCallback(async (tiendaId, currentEmployeeId, currentEmployeeRole) => {
    if (!tiendaId) {
      setReplacementOptions([]);
      return;
    }

    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingReplacementsRef.current && lastTiendaIdRef.current === tiendaId) {
      console.log('Skipping duplicate loadReplacementOptions call for:', tiendaId);
      return;
    }

    loadingReplacementsRef.current = true;
    lastTiendaIdRef.current = tiendaId;

    console.log('Fetching replacement options for store:', tiendaId, 'role:', currentEmployeeRole);

    try {
      // Intentar endpoint específico primero
      const data = await vacacionesService.getReplacementOptions(tiendaId);

      // Filtrar: mismo rol, diferente empleado
      const filtered = data.filter(user =>
        user._id !== currentEmployeeId &&
        user.role === currentEmployeeRole
      );

      setReplacementOptions(filtered);
      console.log('Replacement options loaded:', filtered.length, 'with role:', currentEmployeeRole);
    } catch (error) {
      console.error('Error loading replacement options, using fallback:', error);

      // Fallback: cargar todos y filtrar manualmente
      try {
        const allUsers = await vacacionesService.getAllUsers();
        const filtered = allUsers.filter((user) => {
          let userStoreId = null;

          if (user.tienda) {
            if (typeof user.tienda === 'object' && user.tienda._id) {
              userStoreId = user.tienda._id;
            } else if (typeof user.tienda === 'string') {
              userStoreId = user.tienda;
            }
          }

          const userStoreStr = userStoreId?.toString();
          const targetStoreStr = tiendaId?.toString();

          return userStoreStr === targetStoreStr &&
                 user._id !== currentEmployeeId &&
                 user.role === currentEmployeeRole &&
                 !!userStoreId;
        });

        setReplacementOptions(filtered);
        console.log('Manual filtering complete:', filtered.length, 'with role:', currentEmployeeRole);
      } catch (fallbackError) {
        console.error('Error in fallback method:', fallbackError);
        setReplacementOptions([]);
      }
    } finally {
      loadingReplacementsRef.current = false;
    }
  }, []);

  // Actualizar días tomados (solo admin)
  const updateTakenDays = useCallback(async (userId) => {
    setUpdatingDays(true);
    setMsg('');

    try {
      const response = await vacacionesService.updateTakenDays();
      setMsg(response.message);

      // Recargar datos
      if (userId) {
        await loadDaysAvailable(userId);
        await loadDaysSummary(userId);
      }

      return response;
    } catch (error) {
      console.error('Error updating taken days:', error);
      setMsg(error.response?.data?.message || 'Error actualizando días tomados');
      throw error;
    } finally {
      setUpdatingDays(false);
    }
  }, [loadDaysAvailable, loadDaysSummary]);

  // Crear solicitud de vacaciones
  const createRequest = useCallback(async (requestData) => {
    setLoading(true);
    setMsg('');

    try {
      const response = await vacacionesService.createRequest(requestData);
      setMsg(response.message);
      console.log('Vacation request submitted:', response);
      return response;
    } catch (error) {
      console.error('Error submitting vacation request:', error);
      const errorMsg = error.response?.data?.message || error.message;
      setMsg(errorMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Manejar errores de autenticación
  const handleAuthError = useCallback((error) => {
    console.error('Auth Error:', error);

    if (error.response?.status === 401 || error.response?.status === 403) {
      setMsg('Sesión expirada o token inválido. Inicia sesión nuevamente.');
      localStorage.removeItem('token');
      setTimeout(() => window.location.href = '/login', 2000);
    } else {
      setMsg(`Error: ${error.response?.data?.message || error.message}`);
    }
  }, []);

  return {
    users,
    replacementOptions,
    daysAvailable,
    daysSummary,
    loading,
    updatingDays,
    msg,
    setMsg,
    loadUsers,
    loadDaysAvailable,
    loadDaysSummary,
    loadReplacementOptions,
    updateTakenDays,
    createRequest,
    handleAuthError
  };
}
