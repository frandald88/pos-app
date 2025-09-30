export const useClientesUtils = () => {

  // Validar email
  const isValidEmail = (email) => {
    if (!email) return true; // Email es opcional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validar teléfono
  const isValidPhone = (telefono) => {
    if (!telefono) return false; // Teléfono es requerido
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(telefono);
  };

  // Limpiar teléfono (solo números, máximo 10 dígitos)
  const cleanPhoneNumber = (value) => {
    return value.replace(/\D/g, '').slice(0, 10);
  };

  // Formatear teléfono para display
  const formatPhoneNumber = (telefono) => {
    if (!telefono) return '';
    const cleaned = telefono.replace(/\D/g, '');
    
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    
    return telefono;
  };

  // Validar nombre
  const isValidName = (nombre) => {
    return nombre && nombre.trim().length >= 2;
  };

  // Limpiar texto (eliminar espacios extra)
  const cleanText = (text) => {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
  };

  // Validar cliente completo
  const validateCliente = (clienteData) => {
    const errors = [];

    // Validar nombre
    if (!isValidName(clienteData.nombre)) {
      errors.push('El nombre es requerido y debe tener al menos 2 caracteres');
    }

    // Validar teléfono
    if (!isValidPhone(clienteData.telefono)) {
      errors.push('El teléfono es requerido y debe tener 10 dígitos');
    }

    // Validar email si se proporciona
    if (clienteData.email && !isValidEmail(clienteData.email)) {
      errors.push('El formato del email no es válido');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // Generar iniciales del nombre
  const getInitials = (nombre) => {
    if (!nombre) return '';
    
    const words = nombre.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].charAt(0).toUpperCase();
    }
    
    return words
      .slice(0, 2)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
  };

  // Formatear nombre para display
  const formatClienteName = (nombre) => {
    if (!nombre) return '';
    
    return nombre
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Generar color para avatar basado en nombre
  const getAvatarColor = (nombre) => {
    if (!nombre) return '#6b7280';
    
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308',
      '#84cc16', '#22c55e', '#10b981', '#14b8a6',
      '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
      '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ];
    
    const hash = nombre
      .split('')
      .reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    
    return colors[hash % colors.length];
  };

  // Buscar en texto (insensible a acentos y case)
  const searchInText = (text, searchTerm) => {
    if (!text || !searchTerm) return false;
    
    const normalizeText = (str) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };
    
    return normalizeText(text).includes(normalizeText(searchTerm));
  };

  // Obtener mensaje de estado para operaciones
  const getStatusMessage = (operation, success, error = null) => {
    const messages = {
      create: {
        success: 'Cliente creado exitosamente ✅',
        error: 'Error al crear cliente ❌'
      },
      update: {
        success: 'Cliente actualizado exitosamente ✅',
        error: 'Error al actualizar cliente ❌'
      },
      delete: {
        success: 'Cliente eliminado exitosamente ✅',
        error: 'Error al eliminar cliente ❌'
      },
      fetch: {
        success: 'Clientes cargados exitosamente ✅',
        error: 'Error al cargar clientes ❌'
      }
    };

    if (success) {
      return messages[operation]?.success || 'Operación exitosa ✅';
    } else {
      return error || messages[operation]?.error || 'Error en la operación ❌';
    }
  };

  // Preparar datos del cliente para envío
  const prepareClienteData = (rawData) => {
    return {
      nombre: cleanText(rawData.nombre),
      direccion: cleanText(rawData.direccion),
      telefono: cleanPhoneNumber(rawData.telefono),
      email: cleanText(rawData.email)
    };
  };

  // Verificar si los datos han cambiado
  const hasClienteChanged = (original, modified) => {
    if (!original || !modified) return true;
    
    const originalClean = prepareClienteData(original);
    const modifiedClean = prepareClienteData(modified);
    
    return JSON.stringify(originalClean) !== JSON.stringify(modifiedClean);
  };

  // Obtener estadísticas de clientes
  const getClientesStats = (clientes) => {
    if (!Array.isArray(clientes)) return { total: 0 };
    
    const stats = {
      total: clientes.length,
      conEmail: clientes.filter(c => c.email && c.email.trim()).length,
      conDireccion: clientes.filter(c => c.direccion && c.direccion.trim()).length,
      sinEmail: clientes.filter(c => !c.email || !c.email.trim()).length,
      sinDireccion: clientes.filter(c => !c.direccion || !c.direccion.trim()).length
    };
    
    return stats;
  };

  return {
    // Validaciones
    isValidEmail,
    isValidPhone,
    isValidName,
    validateCliente,

    // Formateo
    cleanPhoneNumber,
    formatPhoneNumber,
    cleanText,
    formatClienteName,
    prepareClienteData,

    // UI Helpers
    getInitials,
    getAvatarColor,

    // Utilidades de búsqueda
    searchInText,

    // Mensajes y estado
    getStatusMessage,

    // Comparación
    hasClienteChanged,

    // Estadísticas
    getClientesStats
  };
};