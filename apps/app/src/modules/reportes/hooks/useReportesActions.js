import { useState, useCallback } from 'react';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

export const useReportesActions = () => {
  const [showGraph, setShowGraph] = useState(false);
  const [visibleRows, setVisibleRows] = useState(10);
  const [copiedTooltip, setCopiedTooltip] = useState({ show: false, id: '', position: { x: 0, y: 0 } });
  const [deleteTooltip, setDeleteTooltip] = useState({ show: false, message: '', position: { x: 0, y: 0 } });

  // Exportar a CSV
  const exportToCSV = useCallback((data, filename) => {
    if (!data || data.length === 0) {
      return { success: false, message: 'No hay datos para exportar' };
    }

    try {
      const csv = Papa.unparse(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      saveAs(blob, filename);
      return { success: true, message: 'CSV exportado exitosamente' };
    } catch (error) {
      console.error('Error exporting CSV:', error);
      return { success: false, message: 'Error al exportar CSV' };
    }
  }, []);

  // Copiar al portapapeles con tooltip
  const copyToClipboard = useCallback((text, event) => {
    navigator.clipboard.writeText(text).then(() => {
      const rect = event.target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

      setCopiedTooltip({
        show: true,
        id: text.slice(-8),
        position: {
          x: rect.left + scrollLeft + rect.width / 2,
          y: rect.top + scrollTop - 10
        }
      });

      setTimeout(() => {
        setCopiedTooltip({ show: false, id: '', position: { x: 0, y: 0 } });
      }, 2000);
    }).catch((error) => {
      console.error('Error copying to clipboard:', error);
    });
  }, []);

  // Mostrar tooltip de eliminación
  const showDeleteTooltip = useCallback((message, event) => {
    const rect = event.target.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    setDeleteTooltip({
      show: true,
      message,
      position: {
        x: rect.left + scrollLeft + rect.width / 2,
        y: rect.top + scrollTop - 10
      }
    });

    setTimeout(() => {
      setDeleteTooltip({ show: false, message: '', position: { x: 0, y: 0 } });
    }, 3000);
  }, []);

  // Cargar más filas
  const loadMoreRows = useCallback(() => {
    setVisibleRows(prev => prev + 10);
  }, []);

  // Toggle gráfico
  const toggleGraph = useCallback(() => {
    setShowGraph(prev => !prev);
  }, []);

  // Resetear vista
  const resetView = useCallback(() => {
    setVisibleRows(10);
    setShowGraph(false);
  }, []);

  return {
    // Estados
    showGraph,
    visibleRows,
    copiedTooltip,
    deleteTooltip,

    // Acciones
    exportToCSV,
    copyToClipboard,
    showDeleteTooltip,
    loadMoreRows,
    toggleGraph,
    resetView,

    // Setters
    setShowGraph,
    setVisibleRows
  };
};
