import { generatePrintableReport } from '../utils/printReport';
import { exportToPDF } from '../utils/exportToPdf';

// SVG Icons for payment methods
const Icons = {
  cash: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  bank: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
    </svg>
  ),
  creditCard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  currencyDollar: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
};

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
      'efectivo': <Icons.cash />,
      'transferencia': <Icons.bank />,
      'tarjeta': <Icons.creditCard />
    };
    return icons[metodo] || <Icons.currencyDollar />;
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