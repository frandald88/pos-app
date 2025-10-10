import { useState, useEffect } from 'react';

export const useCajaFilters = () => {
  const [periodo, setPeriodo] = useState("dia");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [tiendaSeleccionada, setTiendaSeleccionada] = useState("");


  const generarRangoFechas = () => {
    const ahora = new Date();
    let inicio, fin;

    if (periodo === "dia") {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
    } else if (periodo === "mes") {
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (periodo === "año") {
      inicio = new Date(ahora.getFullYear(), 0, 1, 0, 0, 0, 0);
      fin = new Date(ahora.getFullYear(), 11, 31, 23, 59, 59, 999);
    }


    if (inicio && fin) {
      // Convertir a formato datetime-local compatible
      const formatearFecha = (fecha) => {
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        const horas = String(fecha.getHours()).padStart(2, '0');
        const minutos = String(fecha.getMinutes()).padStart(2, '0');
        return `${año}-${mes}-${dia}T${horas}:${minutos}`;
      };

      setFechaInicio(formatearFecha(inicio));
      setFechaFin(formatearFecha(fin));
    }
  };

  // Generar fechas automáticamente cuando cambia el período
  useEffect(() => {
    if (periodo !== "rango") {
      generarRangoFechas();
    }
  }, [periodo]);

  // Inicializar fechas al cargar el componente
  useEffect(() => {
    if (fechaInicio === "" && fechaFin === "") {
      generarRangoFechas();
    }
  }, []);

  const getPeriodoLabel = () => {
    const labels = {
      'dia': 'Hoy',
      'mes': 'Este Mes',
      'año': 'Este Año',
      'rango': 'Rango Personalizado'
    };
    return labels[periodo] || periodo;
  };

  return {
    // Filter states
    periodo,
    fechaInicio,
    fechaFin,
    tiendaSeleccionada,
    
    // Filter setters
    setPeriodo,
    setFechaInicio,
    setFechaFin,
    setTiendaSeleccionada,
    
    // Utilities
    generarRangoFechas,
    getPeriodoLabel
  };
};