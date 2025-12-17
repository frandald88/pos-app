import { useState } from 'react';

export default function useVacacionesForm() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [replacement, setReplacement] = useState('');
  const [tienda, setTienda] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Calcular días solicitados
  const calculateDays = () => {
    if (startDate && endDate) {
      // Agregar 'T00:00:00' para forzar timezone local y evitar problemas de UTC
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      return diffDays;
    }
    return 0;
  };

  // Validar formulario
  const validateForm = (currentUser, daysAvailable) => {
    const targetEmployee = currentUser?.role === 'admin' ? selectedEmployeeId : currentUser?._id;

    if (!targetEmployee || !startDate || !endDate || !tienda) {
      return { valid: false, message: 'Completa todos los campos obligatorios.' };
    }

    // Comparar fechas como strings para evitar problemas de zona horaria
    if (startDate > endDate) {
      return { valid: false, message: 'La fecha de inicio no puede ser posterior a la fecha de fin.' };
    }

    // Comparar con hoy (como string)
    const today = new Date().toISOString().split('T')[0];
    if (startDate < today) {
      return { valid: false, message: 'La fecha de inicio no puede ser anterior a hoy.' };
    }

    const requestedDays = calculateDays();
    if (daysAvailable && requestedDays > daysAvailable.availableDays) {
      return {
        valid: false,
        message: `Solo tienes ${daysAvailable.availableDays} días disponibles. Solicitas ${requestedDays} días.`
      };
    }

    return { valid: true };
  };

  // Limpiar formulario
  const clearForm = (currentUser) => {
    setStartDate('');
    setEndDate('');
    setReplacement('');

    if (currentUser?.role === 'admin') {
      setSelectedEmployeeId('');
      setTienda('');
    }
  };

  return {
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    replacement,
    setReplacement,
    tienda,
    setTienda,
    selectedEmployeeId,
    setSelectedEmployeeId,
    calculateDays,
    validateForm,
    clearForm
  };
}
