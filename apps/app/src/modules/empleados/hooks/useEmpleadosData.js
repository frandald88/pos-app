import { useState, useCallback } from 'react';
import empleadosService from '../services/empleadosService';

export const useEmpleadosData = () => {
  const [users, setUsers] = useState([]);
  const [tiendas, setTiendas] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [attendanceStatus, setAttendanceStatus] = useState(null);
  const [timeEntries, setTimeEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  // Cargar usuario actual
  const loadCurrentUser = useCallback(async () => {
    try {
      const userData = await empleadosService.getCurrentUser();
      setCurrentUser(userData);
      return userData;
    } catch (error) {
      setMsg('Error al cargar el usuario actual ❌');
      throw error;
    }
  }, []);

  // Cargar lista de usuarios (empleados)
  const loadUsers = useCallback(async (currentUserData) => {
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
      setMsg('Error al cargar empleados ❌');
      throw error;
    }
  }, []);

  // Cargar tiendas
  const loadTiendas = useCallback(async () => {
    try {
      const response = await empleadosService.getAllTiendas();
      // Después de la restructuración, el controller devuelve { success, data: { tiendas, pagination }, message }
      setTiendas(response.data.tiendas);
    } catch (error) {
      console.error('Error al cargar tiendas:', error);
    }
  }, []);

  // Cargar estado de asistencia
  const loadAttendanceStatus = useCallback(async () => {
    try {
      const status = await empleadosService.getAttendanceStatus();
      setAttendanceStatus(status);
      setTimeEntries(status.timeEntries || []);
    } catch (error) {
      console.error('Error cargando estado de asistencia:', error);
    }
  }, []);

  // Check-in
  const handleCheckIn = useCallback(async (userId, tiendaId, entryType = 'work') => {
    if (!userId || userId.trim() === '') {
      setMsg('Selecciona un empleado primero ❌');
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
      setMsg('Check-in exitoso ✅');
      await loadAttendanceStatus();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      let backendMsg = 'Error al hacer check-in ❌';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = error.response.data.message + ' 📅';
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
      setMsg('Selecciona un empleado primero ❌');
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
      setMsg('Check-out exitoso ✅');
      await loadAttendanceStatus();
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      let backendMsg = 'Error al hacer check-out ❌';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = error.response.data.message + ' 📅';
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
      setMsg('Selecciona un empleado primero ❌');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    if (!absenceReason.trim()) {
      setMsg('Proporciona una razón de ausencia ❌');
      setTimeout(() => setMsg(''), 3000);
      return;
    }

    setLoading(true);
    try {
      await empleadosService.registerAbsence({
        userId,
        reason: absenceReason
      });
      setMsg('Falta registrada exitosamente ✅');
      setTimeout(() => setMsg(''), 3000);
      return true;
    } catch (error) {
      let backendMsg = 'Error al registrar falta ❌';

      if (error.response?.data?.error === 'NO_SCHEDULE_ASSIGNED') {
        backendMsg = error.response.data.message + ' 📅';
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
