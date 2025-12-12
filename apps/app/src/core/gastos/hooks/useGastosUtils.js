// SVG Icons
const Icons = {
  clock: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  xmark: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  search: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  clipboard: () => (
    <svg className="w-5 h-5 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  ),
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

export const useGastosUtils = () => {

  // Formatear moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Formatear fecha completa
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener configuración de estado
  const getStatusConfig = (status) => {
    const configs = {
      'pendiente': {
        color: '#f59e0b',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: <Icons.clock />
      },
      'aprobado': {
        color: '#10b981',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        icon: <Icons.check />
      },
      'denegado': {
        color: '#ef4444',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        icon: <Icons.xmark />
      },
      'en revision': {
        color: '#8b5cf6',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        icon: <Icons.search />
      }
    };
    return configs[status] || {
      color: '#6b7280',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      icon: <Icons.clipboard />
    };
  };

  // Obtener icono de método de pago
  const getPaymentMethodIcon = (method) => {
    const icons = {
      'efectivo': <Icons.cash />,
      'transferencia': <Icons.bank />,
      'tarjeta': <Icons.creditCard />
    };
    return icons[method] || <Icons.currencyDollar />;
  };

  // Obtener nombre del método de pago
  const getPaymentMethodName = (method) => {
    const names = {
      'efectivo': 'Efectivo',
      'transferencia': 'Transferencia',
      'tarjeta': 'Tarjeta'
    };
    return names[method] || method;
  };

  // Calcular estadísticas de gastos
  const getExpenseStats = (expenses = []) => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    
    return {
      total: safeExpenses.length,
      pendientes: safeExpenses.filter(g => g.status === 'pendiente').length,
      aprobados: safeExpenses.filter(g => g.status === 'aprobado').length,
      denegados: safeExpenses.filter(g => g.status === 'denegado').length,
      enRevision: safeExpenses.filter(g => g.status === 'en revision').length,
      montoTotal: safeExpenses.reduce((sum, g) => sum + parseFloat(g.monto || 0), 0),
      montoAprobado: safeExpenses
        .filter(g => g.status === 'aprobado')
        .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0),
      montoPendiente: safeExpenses
        .filter(g => g.status === 'pendiente')
        .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0),
      montoDenegado: safeExpenses
        .filter(g => g.status === 'denegado')
        .reduce((sum, g) => sum + parseFloat(g.monto || 0), 0)
    };
  };

  // Calcular estadísticas por método de pago
  const getPaymentMethodStats = (expenses = []) => {
    const safeExpenses = Array.isArray(expenses) ? expenses : [];
    const stats = {
      efectivo: { total: 0, cantidad: 0 },
      transferencia: { total: 0, cantidad: 0 },
      tarjeta: { total: 0, cantidad: 0 }
    };

    safeExpenses.forEach(expense => {
      if (stats[expense.metodoPago]) {
        stats[expense.metodoPago].total += parseFloat(expense.monto || 0);
        stats[expense.metodoPago].cantidad += 1;
      }
    });

    return stats;
  };

  // Validar campos del formulario
  const validateExpenseForm = (formData) => {
    const errors = [];

    if (!formData.concepto?.trim()) {
      errors.push('El concepto es requerido');
    }

    if (!formData.proveedor?.trim()) {
      errors.push('El proveedor es requerido');
    }

    if (!formData.monto || isNaN(parseFloat(formData.monto)) || parseFloat(formData.monto) <= 0) {
      errors.push('El monto debe ser un número mayor a 0');
    }

    if (!formData.metodoPago) {
      errors.push('El método de pago es requerido');
    }

    if (!formData.tienda) {
      errors.push('La tienda es requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Obtener color de prioridad según estado
  const getPriorityColor = (status) => {
    const colors = {
      'pendiente': '#f59e0b',
      'en revision': '#8b5cf6',
      'aprobado': '#10b981',
      'denegado': '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  // Obtener texto descriptivo del estado
  const getStatusDescription = (status) => {
    const descriptions = {
      'pendiente': 'Esperando revisión del administrador',
      'en revision': 'Bajo revisión por el administrador',
      'aprobado': 'Gasto aprobado y registrado',
      'denegado': 'Gasto rechazado por el administrador'
    };
    return descriptions[status] || 'Estado desconocido';
  };

  // Formatear tamaño de archivo
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Validar tipo de archivo
  const validateFileType = (file) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return allowedTypes.includes(file.type);
  };

  // Generar ID único temporal
  const generateTempId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Normalizar texto para búsqueda
  const normalizeText = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  // Filtrar proveedores por búsqueda
  const filterProviders = (providers, searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const normalizedSearch = normalizeText(searchTerm);
    
    return providers.filter(provider => 
      normalizeText(provider).includes(normalizedSearch)
    );
  };

  return {
    // Formateo
    formatCurrency,
    formatDate,
    formatDateTime,
    formatFileSize,
    
    // Configuraciones
    getStatusConfig,
    getPaymentMethodIcon,
    getPaymentMethodName,
    getPriorityColor,
    getStatusDescription,
    
    // Estadísticas
    getExpenseStats,
    getPaymentMethodStats,
    
    // Validaciones
    validateExpenseForm,
    validateFileType,
    
    // Utilidades
    generateTempId,
    normalizeText,
    filterProviders
  };
};