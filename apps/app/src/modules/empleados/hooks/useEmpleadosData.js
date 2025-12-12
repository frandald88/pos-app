import { useState, useCallback, useRef } from 'react';
import empleadosService from '../services/empleadosService';

export const useEmpleadosData = () => {
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // OPTIMIZACIÓN: Refs para prevenir llamadas duplicadas
  const loadingUsersRef = useRef(false);
  const loadingTiendasRef = useRef(false);
  const loadingStatusRef = useRef(false);

  // Cargar usuario actual
  const loadCurrentUser = useCallback(async () => {
    try {
      const userData = await empleadosService.getCurrentUser();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      setMsg('[ERROR] Error al cargar el usuario actual');
      throw error;
    }
  }, []);

  // Cargar lista de usuarios (empleados)
  const loadUsers = useCallback(async (currentUserData) => {
    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingUsersRef.current) {
      console.log('[INFO] Skipping duplicate loadUsers call');
      return;
    }

    loadingUsersRef.current = true;

    try {
      if (currentUserData.role === 'admin') {
        const allUsers = await empleadosService.getAllUsers();
        const filtered = allUsers.filter(
          (u) => u.role === 'vendedor' || u.role === 'repartidor'
        );
        setUsers(filtered);
      } else {
        // Si no es admin, solo incluir el usuario actual
        setUsers([currentUserData]);
      }
    } catch (error) {
      setMsg('[ERROR] Error al cargar empleados');
      throw error;
    } finally {
      loadingUsersRef.current = false;
    }
  }, []);

  // Cargar tiendas
  const loadTiendas = useCallback(async () => {
    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingTiendasRef.current) {
      console.log('[INFO] Skipping duplicate loadTiendas call');
      return;
    }

    loadingTiendasRef.current = true;

    try {
      const response = await empleadosService.getAllTiendas();
      // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
      setTiendas(response.data.tiendas);
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    } finally {
      loadingTiendasRef.current = false;
    }
  }, []);

  // Cargar estado de asistencia
  const loadAttendanceStatus = useCallback(async () => {
    // OPTIMIZACIÓN: Prevenir llamadas duplicadas
    if (loadingStatusRef.current) {
      console.log('[INFO] Skipping duplicate loadAttendanceStatus call');
      return;
    }

    loadingStatusRef.current = true;

    try {
      const status = await empleadosService.getAttendanceStatus();
      setAttendanceStatus(status);
      setTimeEntries(status.timeEntries || []);
    } catch (error) {
      console.error('Error cargando estado de asistencia:', error);
    } finally {
      loadingStatusRef.current = false;
    }
  }, []);

  // Check-in
  const handleCheckIn = useCallback(async (userId, tiendaId, entryType = 'work') => {
    if (!userId || userId.trim() === '') {
      setMsg('[ERROR] Selecciona un empleado primero');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await empleadosService.checkIn({
        userId,
        tiendaId,
        entryType,
        notes: ''
      });
      setMsg('[SUCCESS] Check-in exitoso');
      await loadAttendanceStatus();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      let backendMsg = '[ERROR] Error al hacer check-in';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = '[INFO] ' + error.response.data.message;
      } else if (error.response?.data?.error === 'ROUTE_NOT_FOUND') {
        backendMsg = error.response.data.message;
      } else {
        backendMsg = error.response?.data?.msg ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    backendMsg;
      }

      setMsg(backendMsg);
    } finally {
      setLoading(false);
    }
  }, [loadAttendanceStatus]);

  // Check-out
  const handleCheckOut = useCallback(async (userId, exitType = 'break') => {
    if (!userId || userId.trim() === '') {
      setMsg('[ERROR] Selecciona un empleado primero');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await empleadosService.checkOut({
        userId,
        exitType,
        notes: ''
      });
      setMsg('[SUCCESS] Check-out exitoso');
      await loadAttendanceStatus();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      let backendMsg = '[ERROR] Error al hacer check-out';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = '[INFO] ' + error.response.data.message;
      } else if (error.response?.data?.error === 'ROUTE_NOT_FOUND') {
        backendMsg = error.response.data.message;
      } else {
        backendMsg = error.response?.data?.msg ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    backendMsg;
      }

      setMsg(backendMsg);
    } finally {
      setLoading(false);
    }
  }, [loadAttendanceStatus]);

  // Registrar ausencia
  const handleAbsence = useCallback(async (userId, absenceReason) => {
    if (!userId || userId.trim() === '') {
      setMsg('[ERROR] Selecciona un empleado primero');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    if (!absenceReason.trim()) {
      setMsg('[ERROR] Proporciona una razón de ausencia');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await empleadosService.registerAbsence({
        userId,
        reason: absenceReason
      });
      setMsg('[SUCCESS] Falta registrada exitosamente');
      setTimeout(() => setMsg(''), 3000);
      return true;
    } catch (error) {
      let backendMsg = '[ERROR] Error al registrar falta';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = '[INFO] ' + error.response.data.message;
      } else if (error.response?.data?.error === 'ROUTE_NOT_FOUND') {
        backendMsg = error.response.data.message;
      } else {
        backendMsg = error.response?.data?.msg ||
                    error.response?.data?.message ||
                    error.response?.data?.error ||
                    backendMsg;
      }

      setMsg(backendMsg);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Estados
    users,
    tiendas,
    currentUser,
    attendanceStatus,
    timeEntries,
    loading,
    msg,

    // Acciones
    loadCurrentUser,
    loadUsers,
    loadTiendas,
    loadAttendanceStatus,
    handleCheckIn,
    handleCheckOut,
    handleAbsence,

    // Setters
    setMsg,
    setCurrentUser,
    setUsers
  };
};
