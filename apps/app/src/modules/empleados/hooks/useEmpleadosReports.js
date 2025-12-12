import { useState, useCallback } from 'react';
import empleadosService from '../services/empleadosService';

export const useEmpleadosReports = () => {
  const [reportData, setReportData] = useState([]);
  const [reportStats, setReportStats] = useState(null);
  const [reportMsg, setReportMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Cargar reporte de asistencia
  const loadAttendanceReport = useCallback(async (params) => {
    const { reportUser, reportStartDate, reportEndDate, tiendaFiltro } = params;

    if (!reportStartDate || !reportEndDate) {
      setReportMsg('[ERROR] Debes seleccionar una fecha de inicio y fin para el reporte');
      setTimeout(() => setReportMsg(''), 3000);
      return;
    }

    // Validar que la fecha de fin no sea anterior a la fecha de inicio
    if (reportStartDate > reportEndDate) {
      setReportMsg('[ERROR] La fecha \'hasta\' no puede ser anterior a la fecha \'desde\'');
      setTimeout(() => setReportMsg(''), 3000);
      return;
    }

    setLoading(true);
    setReportMsg('');

    try {
      const response = await empleadosService.getAttendanceReport({
        userId: reportUser || undefined,
        startDate: reportStartDate,
        endDate: reportEndDate,
        tiendaId: tiendaFiltro || undefined
      });

      if (response && response.records) {
        setReportData(response.records);
        setReportStats(response.estadisticas);
        setReportMsg(`[SUCCESS] Reporte generado exitosamente - ${response.records.length} registros encontrados`);
      } else if (Array.isArray(response)) {
        setReportData(response);
        setReportStats(null);
        setReportMsg(`[SUCCESS] Reporte generado exitosamente - ${response.length} registros encontrados`);
      } else {
        setReportData([]);
        setReportStats(null);
        setReportMsg('[INFO] No se encontraron registros para las fechas seleccionadas');
      }
      setTimeout(() => setReportMsg(''), 5000);
    } catch (error) {
      console.error('Report error:', error);
      setReportData([]);
      setReportStats(null);
      setReportMsg('[ERROR] Error al cargar el reporte');
    } finally {
      setLoading(false);
    }
  }, []);

  // Limpiar reporte
  const clearReport = useCallback(() => {
    setReportData([]);
    setReportStats(null);
    setReportMsg('');
  }, []);

  return {
    // Estados
    reportData,
    reportStats,
    reportMsg,
    loading,

    // Acciones
    loadAttendanceReport,
    clearReport,

    // Setters
    setReportMsg
  };
};
