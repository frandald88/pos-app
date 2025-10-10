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
        icon: '⏳' 
      },
      'aprobado': { 
        color: '#10b981', 
        bgColor: 'bg-green-100', 
        textColor: 'text-green-800', 
        icon: '✅' 
      },
      'denegado': { 
        color: '#ef4444', 
        bgColor: 'bg-red-100', 
        textColor: 'text-red-800', 
        icon: '❌' 
      },
      'en revision': { 
        color: '#8b5cf6', 
        bgColor: 'bg-purple-100', 
        textColor: 'text-purple-800', 
        icon: '🔍' 
      }
    };
    return configs[status] || { 
      color: '#6b7280', 
      bgColor: 'bg-gray-100', 
      textColor: 'text-gray-800', 
      icon: '📋' 
    };
  };

  // Obtener icono de método de pago
  const getPaymentMethodIcon = (method) => {
    const icons = {
      'efectivo': '💵',
      'transferencia': '🏦',
      'tarjeta': '💳'
    };
    return icons[method] || '💰';
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