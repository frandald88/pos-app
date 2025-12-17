import { useState, useCallback } from 'react';
import reportesService from '../services/reportesService';

export const useReportesData = () => {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [selectedSales, setSelectedSales] = useState([]);

  // Generar reporte de ventas
  const generateVentasReport = useCallback(async (params) => {
    try {
      setLoading(true);
      setMsg('');

      const response = await reportesService.getVentasReport(params);

      const data = response?.resultados || [];
      if (Array.isArray(data) && data.length > 0) {
        setVentas(data);
        setMsg(`Reporte generado exitosamente - ${data.length} registros encontrados`);
      } else {
        setVentas([]);
        setMsg('No se encontraron datos para los filtros seleccionados');
      }

      return response;
    } catch (error) {
      console.error('Error generating ventas report:', error);
      setVentas([]);
      setMsg('Error al generar reporte: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generar reporte de devoluciones
  const generateDevolucionesReport = useCallback(async (params) => {
    try {
      setLoading(true);
      setMsg('');

      const response = await reportesService.getDevolucionesReport(params);

      // Backend devuelve { success, message, data: { returns: [...] } }
      const data = response?.data?.returns || response?.returns || [];
      if (Array.isArray(data) && data.length > 0) {
        setVentas(data);
        setMsg(`Reporte generado exitosamente - ${data.length} registros encontrados`);
      } else {
        setVentas([]);
        setMsg('No se encontraron datos para los filtros seleccionados');
      }

      return response;
    } catch (error) {
      console.error('Error generating devoluciones report:', error);
      setVentas([]);
      setMsg('Error al generar reporte: ' + (error.response?.data?.message || error.message));
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Eliminar ventas sin tienda
  const deleteNoStoreSales = useCallback(async () => {
    try {
      const response = await reportesService.deleteNoStoreSales();
      setMsg(response.message);
      return response;
    } catch (error) {
      console.error('Error deleting no-store sales:', error);
      setMsg('Error al eliminar ventas sin tienda');
      throw error;
    }
  }, []);

  // Eliminar múltiples ventas
  const deleteMultipleSales = useCallback(async (ids) => {
    try {
      const response = await reportesService.deleteMultipleSales(ids);
      setSelectedSales([]);
      return response;
    } catch (error) {
      console.error('Error deleting multiple sales:', error);
      setMsg('Error al eliminar ventas seleccionadas');
      throw error;
    }
  }, []);

  // Manejar cambios en checkboxes de selección
  const handleCheckboxChange = useCallback((ventaId) => {
    setSelectedSales((prevSelected) =>
      prevSelected.includes(ventaId)
        ? prevSelected.filter((id) => id !== ventaId)
        : [...prevSelected, ventaId]
    );
  }, []);

  // Seleccionar todas las ventas visibles
  const selectAllSales = useCallback((ventasVisible) => {
    setSelectedSales(ventasVisible.map(v => v._id));
  }, []);

  // Deseleccionar todas las ventas
  const deselectAllSales = useCallback(() => {
    setSelectedSales([]);
  }, []);

  // Limpiar mensaje
  const clearMessage = useCallback(() => {
    setMsg('');
  }, []);

  return {
    // Estados
    ventas,
    loading,
    msg,
    selectedSales,

    // Acciones
    generateVentasReport,
    generateDevolucionesReport,
    deleteNoStoreSales,
    deleteMultipleSales,
    handleCheckboxChange,
    selectAllSales,
    deselectAllSales,
    clearMessage,

    // Setters
    setVentas,
    setMsg,
    setSelectedSales
  };
};
