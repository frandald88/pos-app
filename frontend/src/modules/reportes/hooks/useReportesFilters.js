import { useState, useEffect, useCallback } from 'react';

export const useReportesFilters = () => {
  const [tipoReporte, setTipoReporte] = useState('ventas');
  const [tipoVenta, setTipoVenta] = useState('');
  const [tipo, setTipo] = useState('');
  const [periodo, setPeriodo] = useState('dia');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [tiendaFiltro, setTiendaFiltro] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [productoFiltro, setProductoFiltro] = useState('');
  const [showMixedDetails, setShowMixedDetails] = useState(false);

  // Generar rango de fechas basado en periodo
  const generarRangoFechas = useCallback(() => {
    const ahora = new Date();
    let inicio, fin;

    if (periodo === 'dia') {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (periodo === 'mes') {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      fin = new Date();
    } else if (periodo === 'año') {
      inicio = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0);
      fin = new Date();
    } else if (periodo === 'rango') {
      return; // No cambiar nada si es rango personalizado
    }

    // Formatear para datetime-local (YYYY-MM-DDTHH:mm)
    const formatearFecha = (fecha) => {
      const year = fecha.getFullYear();
      const month = String(fecha.getMonth() + 1).padStart(2, '0');
      const day = String(fecha.getDate()).padStart(2, '0');
      const hours = String(fecha.getHours()).padStart(2, '0');
      const minutes = String(fecha.getMinutes()).padStart(2, '0');

      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFechaInicio(formatearFecha(inicio));
    setFechaFin(formatearFecha(fin));
  }, [periodo]);

  // Auto-generar fechas cuando cambia el periodo
  useEffect(() => {
    generarRangoFechas();
  }, [generarRangoFechas]);

  // Obtener parámetros para la consulta
  const getReportParams = useCallback(() => {
    const params = {
      inicio: fechaInicio,
      fin: fechaFin,
      tiendaId: tiendaFiltro,
      desglosarMixtos: showMixedDetails
    };

    if (tipoReporte === 'ventas') {
      params.tipoVenta = tipoVenta;
      params.tipo = tipo;
      params.categoria = categoriaFiltro;
    }

    // Limpiar parámetros vacíos
    Object.keys(params).forEach(key => {
      if (params[key] === '' || params[key] === null || params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }, [fechaInicio, fechaFin, tiendaFiltro, showMixedDetails, tipoReporte, tipoVenta, tipo, categoriaFiltro]);

  // Filtrar ventas por producto/SKU
  const filterByProduct = useCallback((ventas) => {
    if (!productoFiltro) return ventas;

    return ventas.filter((v) => {
      const nombre = v.producto?.toLowerCase() || '';
      const sku = v.sku?.toString() || '';
      const filtro = productoFiltro.toLowerCase();
      return nombre.includes(filtro) || sku.includes(filtro);
    });
  }, [productoFiltro]);

  // Resetear filtros
  const resetFilters = useCallback(() => {
    setTipoVenta('');
    setTipo('');
    setTiendaFiltro('');
    setCategoriaFiltro('');
    setProductoFiltro('');
    setShowMixedDetails(false);
    setPeriodo('dia');
  }, []);

  return {
    // Estados de filtros
    tipoReporte,
    tipoVenta,
    tipo,
    periodo,
    fechaInicio,
    fechaFin,
    tiendaFiltro,
    categoriaFiltro,
    productoFiltro,
    showMixedDetails,

    // Setters
    setTipoReporte,
    setTipoVenta,
    setTipo,
    setPeriodo,
    setFechaInicio,
    setFechaFin,
    setTiendaFiltro,
    setCategoriaFiltro,
    setProductoFiltro,
    setShowMixedDetails,

    // Utilidades
    getReportParams,
    filterByProduct,
    resetFilters,
    generarRangoFechas
  };
};
