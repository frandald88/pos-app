export const useTiendasUtils = () => {

  // Validar nombre de tienda
  const isValidName = (nombre) => {
    return nombre && nombre.trim().length >= 2;
  };

  // Validar dirección
  const isValidAddress = (direccion) => {
    return direccion && direccion.trim().length >= 5;
  };

  // Validar teléfono
  const isValidPhone = (telefono) => {
    if (!telefono) return true; // Teléfono es opcional
    const phoneRegex = /^[\d\s\-\(\)\+]+$/;
    return phoneRegex.test(telefono) && telefono.replace(/\D/g, '').length >= 10;
  };

  // Limpiar texto (eliminar espacios extra)
  const cleanText = (text) => {
    return text ? text.trim().replace(/\s+/g, ' ') : '';
  };

  // Formatear teléfono para display
  const formatPhone = (telefono) => {
    if (!telefono) return '';
    
    // Remover todo lo que no sea número
    const cleaned = telefono.replace(/\D/g, '');
    
    // Formatear según la longitud
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    
    return telefono;
  };

  // Validar tienda completa
  const validateTienda = (tiendaData) => {
    const errors = [];

    // Validar nombre
    if (!isValidName(tiendaData.nombre)) {
      errors.push('El nombre es requerido y debe tener al menos 2 caracteres');
    }

    // Validar dirección
    if (!isValidAddress(tiendaData.direccion)) {
      errors.push('La dirección es requerida y debe tener al menos 5 caracteres');
    }

    // Validar teléfono si se proporciona
    if (tiendaData.telefono && !isValidPhone(tiendaData.telefono)) {
      errors.push('El formato del teléfono no es válido');
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
  const formatTiendaName = (nombre) => {
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
        success: '[SUCCESS] Tienda creada exitosamente',
        error: '[ERROR] Error al crear tienda'
      },
      update: {
        success: '[SUCCESS] Tienda actualizada exitosamente',
        error: '[ERROR] Error al actualizar tienda'
      },
      delete: {
        success: '[SUCCESS] Tienda eliminada exitosamente',
        error: '[ERROR] Error al eliminar tienda'
      },
      archive: {
        success: '[SUCCESS] Tienda archivada exitosamente',
        error: '[ERROR] Error al archivar tienda'
      },
      restore: {
        success: '[SUCCESS] Tienda restaurada exitosamente',
        error: '[ERROR] Error al restaurar tienda'
      },
      fetch: {
        success: '[SUCCESS] Tiendas cargadas exitosamente',
        error: '[ERROR] Error al cargar tiendas'
      }
    };

    if (success) {
      return messages[operation]?.success || '[SUCCESS] Operación exitosa';
    } else {
      return error || messages[operation]?.error || '[ERROR] Error en la operación';
    }
  };

  // Preparar datos de la tienda para envío
  const prepareTiendaData = (rawData) => {
    return {
      nombre: cleanText(rawData.nombre),
      direccion: cleanText(rawData.direccion),
      telefono: cleanText(rawData.telefono)
    };
  };

  // Verificar si los datos han cambiado
  const hasTiendaChanged = (original, modified) => {
    if (!original || !modified) return true;
    
    const originalClean = prepareTiendaData(original);
    const modifiedClean = prepareTiendaData(modified);
    
    return JSON.stringify(originalClean) !== JSON.stringify(modifiedClean);
  };

  // Obtener estadísticas de tiendas
  const getTiendasStats = (tiendas) => {
    if (!Array.isArray(tiendas)) return { total: 0 };
    
    const stats = {
      total: tiendas.length,
      activas: tiendas.filter(t => t.activa !== false).length,
      inactivas: tiendas.filter(t => t.activa === false).length,
      conTelefono: tiendas.filter(t => t.telefono && t.telefono.trim()).length,
      sinTelefono: tiendas.filter(t => !t.telefono || !t.telefono.trim()).length
    };
    
    return stats;
  };

  // Formatear información de relaciones
  const formatRelationshipsInfo = (relationships) => {
    if (!relationships) return '';
    
    const parts = [];
    
    if (relationships.usuarios > 0) {
      parts.push(`${relationships.usuarios} usuario(s)`);
    }
    if (relationships.empleadosHistorial > 0) {
      parts.push(`${relationships.empleadosHistorial} historial(es) laboral(es)`);
    }
    if (relationships.asistencias > 0) {
      parts.push(`${relationships.asistencias} registro(s) de asistencia`);
    }
    if (relationships.horarios > 0) {
      parts.push(`${relationships.horarios} horario(s)`);
    }
    
    return parts.join(', ');
  };

  // Determinar si una tienda puede eliminarse
  const canDeleteTienda = (relationships) => {
    if (!relationships) return true;
    return !relationships.hasRelationships;
  };

  // Obtener recomendación de acción
  const getActionRecommendation = (relationships) => {
    if (!relationships) return 'delete';
    
    if (relationships.hasRelationships) {
      return 'archive'; // Recomendar archivar si tiene relaciones
    }
    
    return 'delete'; // Puede eliminar si no tiene relaciones
  };

  return {
    // Validaciones
    isValidName,
    isValidAddress,
    isValidPhone,
    validateTienda,

    // Formateo
    cleanText,
    formatPhone,
    formatTiendaName,
    prepareTiendaData,

    // UI Helpers
    getInitials,
    getAvatarColor,

    // Utilidades de búsqueda
    searchInText,

    // Mensajes y estado
    getStatusMessage,

    // Comparación
    hasTiendaChanged,

    // Estadísticas
    getTiendasStats,

    // Relaciones
    formatRelationshipsInfo,
    canDeleteTienda,
    getActionRecommendation
  };
};