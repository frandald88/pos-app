import { useState, useCallback } from 'react';

export const useEmpleadosFilters = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [absenceReason, setAbsenceReason] = useState('');
  const [entryType] = useState('work'); // Siempre es 'work' para check-in
  const [exitType, setExitType] = useState('break');
  const [reportUser, setReportUser] = useState('');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [tiendaFiltro, setTiendaFiltro] = useState('');

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    setSelectedUser('');
    setAbsenceReason('');
    // entryType siempre es 'work', no se limpia
    setExitType('break');
    setReportUser('');
    setReportStartDate('');
    setReportEndDate('');
    setTiendaFiltro('');
  }, []);

  // Limpiar solo filtros de reporte
  const clearReportFilters = useCallback(() => {
    setReportUser('');
    setReportStartDate('');
    setReportEndDate('');
    setTiendaFiltro('');
  }, []);

  return {
    // Estados de filtros
    selectedUser,
    absenceReason,
    entryType,
    exitType,
    reportUser,
    reportStartDate,
    reportEndDate,
    tiendaFiltro,

    // Setters
    setSelectedUser,
    setAbsenceReason,
    // No hay setter para entryType porque siempre es 'work'
    setExitType,
    setReportUser,
    setReportStartDate,
    setReportEndDate,
    setTiendaFiltro,

    // Utilidades
    clearFilters,
    clearReportFilters
  };
};
