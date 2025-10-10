import { generatePrintableReport } from '../utils/printReport';
import { exportToPDF } from '../utils/exportToPdf';

export const useCajaUtils = () => {
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularPorcentajeMetodo = (resultados, metodo, tipo) => {
    if (!resultados || !resultados[tipo]?.total) return 0;
    const totalMetodo = resultados[tipo]?.desglose?.[metodo]?.total || 0;
    const totalGeneral = resultados[tipo]?.total || 0;
    return ((totalMetodo / totalGeneral) * 100).toFixed(1);
  };

  const getMetodoIcon = (metodo) => {
    const icons = {
      'efectivo': '💵',
      'transferencia': '🏦',
      'tarjeta': '💳'
    };
    return icons[metodo] || '💰';
  };

  const getTiendaNombre = (tiendaSeleccionada, tiendas) => {
    if (!tiendaSeleccionada) return "Todas las tiendas";
    const tienda = tiendas.find(t => t._id === tiendaSeleccionada);
    return tienda ? tienda.nombre : "Tienda no encontrada";
  };

  const getMetodoColor = (metodo) => {
    const colors = {
      'efectivo': '#10b981',
      'transferencia': '#3b82f6', 
      'tarjeta': '#8b5cf6'
    };
    return colors[metodo] || '#6b7280';
  };

  const calcularTotalPorMetodo = (resultados, metodo) => {
    if (!resultados) return 0;
    const ventas = resultados.ventas?.desglose?.[metodo]?.total || 0;
    const gastos = resultados.gastos?.desglose?.[metodo]?.total || 0;
    return ventas - gastos;
  };

  const calcularPorcentajeParticipacion = (resultados, metodo, tipo) => {
    if (!resultados || !resultados[tipo]?.total) return 0;
    const totalMetodo = resultados[tipo]?.desglose?.[metodo]?.total || 0;
    const totalGeneral = resultados[tipo]?.total || 0;
    if (totalGeneral === 0) return 0;
    return Number(((totalMetodo / totalGeneral) * 100).toFixed(1));
  };

  const printReport = (resultados, tiendas) => {
    return generatePrintableReport(
      resultados, 
      tiendas, 
      formatCurrency, 
      formatDateTime, 
      getTiendaNombre
    );
  };

  const exportPDF = (resultados, tiendas) => {
    return exportToPDF(
      resultados, 
      tiendas, 
      formatCurrency, 
      formatDateTime, 
      getTiendaNombre
    );
  };

  return {
    formatCurrency,
    formatDateTime,
    calcularPorcentajeMetodo,
    getMetodoIcon,
    getTiendaNombre,
    getMetodoColor,
    calcularTotalPorMetodo,
    calcularPorcentajeParticipacion,
    printReport,
    exportPDF
  };
};