export default function useVacacionesUtils() {
  const getStatusBadge = (status) => {
    const styles = {
      pendiente: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      aprobada: 'bg-green-100 text-green-800 border-green-300',
      rechazada: 'bg-red-100 text-red-800 border-red-300'
    };

    return styles[status] || styles.pendiente;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';

    // Si es una fecha ISO (YYYY-MM-DD o YYYY-MM-DDTHH:mm:ss), extraer solo la parte de la fecha
    let dateOnly = dateString;
    if (typeof dateString === 'string' && dateString.includes('T')) {
      dateOnly = dateString.split('T')[0];
    }

    // Separar año, mes, día (formato YYYY-MM-DD)
    const [year, month, day] = dateOnly.split('-');

    return `${day}/${month}/${year}`;
  };

  const calculateDaysRequested = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;

    // Convertir a Date y normalizar a medianoche en timezone local
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalizar a medianoche local
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    return diffDays;
  };

  return {
    getStatusBadge,
    formatDate,
    calculateDaysRequested
  };
}
