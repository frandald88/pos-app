import { useCallback } from 'react';

export const useEmpleadosUtils = () => {
  // Configuración de estados
  const getStatusConfig = useCallback((status) => {
    const configs = {
      'Present': {
        color: '#10b981',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: '✅',
        label: 'Presente'
      },
      'Late': {
        color: '#f59e0b',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: '⏰',
        label: 'Tarde'
      },
      'Absent': {
        color: '#ef4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: '❌',
        label: 'Ausente'
      }
    };
    return configs[status] || {
      color: '#6b7280',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: '📋',
      label: status
    };
  }, []);

  // Formatear tiempo
  const formatTime = useCallback((timeString) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  // Formatear fecha
  const formatDate = useCallback((dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Formatear duración en horas
  const formatDuration = useCallback((minutes) => {
    if (!minutes) return '0h';
    return `${Math.round(minutes / 60 * 100) / 100}h`;
  }, []);

  // Obtener icono de tipo de entrada
  const getEntryTypeIcon = useCallback((type) => {
    const icons = {
      'work': '💼 Trabajo',
      'break': '☕ Descanso',
      'lunch': '🍽️ Almuerzo'
    };
    return icons[type] || 'Entrada';
  }, []);

  return {
    getStatusConfig,
    formatTime,
    formatDate,
    formatDuration,
    getEntryTypeIcon
  };
};
