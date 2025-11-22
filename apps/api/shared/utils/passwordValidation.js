/**
 * Validar fortaleza de contraseña
 * Requisitos:
 * - Mínimo 8 caracteres
 * - Al menos una letra mayúscula
 * - Al menos una letra minúscula
 * - Al menos un número
 * - Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
 *
 * @param {string} password - Contraseña a validar
 * @returns {object} - { valid: boolean, message?: string, suggestions?: string[] }
 */
function validatePasswordStrength(password) {
  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      message: 'La contraseña es requerida'
    };
  }

  const suggestions = [];

  // Verificar longitud mínima
  if (password.length < 8) {
    suggestions.push('Debe tener al menos 8 caracteres');
  }

  // Verificar longitud máxima (por seguridad de bcrypt)
  if (password.length > 72) {
    return {
      valid: false,
      message: 'La contraseña no puede exceder 72 caracteres'
    };
  }

  // Verificar letra mayúscula
  if (!/[A-Z]/.test(password)) {
    suggestions.push('Debe incluir al menos una letra mayúscula (A-Z)');
  }

  // Verificar letra minúscula
  if (!/[a-z]/.test(password)) {
    suggestions.push('Debe incluir al menos una letra minúscula (a-z)');
  }

  // Verificar número
  if (!/\d/.test(password)) {
    suggestions.push('Debe incluir al menos un número (0-9)');
  }

  // Verificar carácter especial
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    suggestions.push('Debe incluir al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }

  // Verificar caracteres no permitidos (espacios)
  if (/\s/.test(password)) {
    return {
      valid: false,
      message: 'La contraseña no puede contener espacios en blanco'
    };
  }

  // Si hay sugerencias, la contraseña no es válida
  if (suggestions.length > 0) {
    return {
      valid: false,
      message: 'La contraseña no cumple con los requisitos de seguridad',
      suggestions
    };
  }

  return {
    valid: true,
    message: 'Contraseña válida'
  };
}

/**
 * Verificar si la contraseña contiene patrones comunes débiles
 * @param {string} password - Contraseña a verificar
 * @param {object} userData - Datos del usuario para verificar que no use su nombre, email, etc.
 * @returns {object} - { valid: boolean, message?: string }
 */
function checkCommonPatterns(password, userData = {}) {
  const lowerPassword = password.toLowerCase();

  // Patrones comunes débiles
  const commonPasswords = [
    'password', 'contrasena', 'contraseña', '12345678', 'qwerty', 'abc123',
    'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master',
    '123456789', 'qwertyuiop', 'password123', 'admin123'
  ];

  for (const common of commonPasswords) {
    if (lowerPassword.includes(common)) {
      return {
        valid: false,
        message: `La contraseña contiene un patrón común débil: "${common}". Por favor, elige una contraseña más segura.`
      };
    }
  }

  // Verificar que no use el nombre del usuario
  if (userData.name && userData.name.length >= 3) {
    const nameLower = userData.name.toLowerCase();
    if (lowerPassword.includes(nameLower)) {
      return {
        valid: false,
        message: 'La contraseña no debe contener tu nombre'
      };
    }
  }

  // Verificar que no use el email
  if (userData.email) {
    const emailParts = userData.email.toLowerCase().split('@');
    const username = emailParts[0];
    if (username.length >= 3 && lowerPassword.includes(username)) {
      return {
        valid: false,
        message: 'La contraseña no debe contener tu dirección de email'
      };
    }
  }

  // Verificar secuencias numéricas
  if (/(?:012|123|234|345|456|567|678|789|890){3,}/.test(password)) {
    return {
      valid: false,
      message: 'La contraseña no debe contener secuencias numéricas largas (ej: 123456)'
    };
  }

  // Verificar secuencias de teclado
  const keyboardPatterns = ['qwerty', 'asdfgh', 'zxcvbn', 'qazwsx'];
  for (const pattern of keyboardPatterns) {
    if (lowerPassword.includes(pattern)) {
      return {
        valid: false,
        message: 'La contraseña no debe contener secuencias de teclado (ej: qwerty, asdfgh)'
      };
    }
  }

  // Verificar repetición excesiva de caracteres
  if (/(.)\1{3,}/.test(password)) {
    return {
      valid: false,
      message: 'La contraseña no debe contener el mismo carácter repetido más de 3 veces seguidas'
    };
  }

  return {
    valid: true
  };
}

/**
 * Validación completa de contraseña
 * Combina validación de fortaleza y patrones comunes
 *
 * @param {string} password - Contraseña a validar
 * @param {object} userData - Datos del usuario (opcional)
 * @returns {object} - { valid: boolean, message?: string, suggestions?: string[] }
 */
function validatePassword(password, userData = {}) {
  // Primero validar fortaleza
  const strengthValidation = validatePasswordStrength(password);
  if (!strengthValidation.valid) {
    return strengthValidation;
  }

  // Luego verificar patrones comunes
  const patternValidation = checkCommonPatterns(password, userData);
  if (!patternValidation.valid) {
    return patternValidation;
  }

  return {
    valid: true,
    message: 'Contraseña segura'
  };
}

/**
 * Generar mensaje de ayuda con los requisitos de contraseña
 * @returns {string}
 */
function getPasswordRequirements() {
  return `La contraseña debe cumplir con los siguientes requisitos:
• Mínimo 8 caracteres
• Al menos una letra mayúscula (A-Z)
• Al menos una letra minúscula (a-z)
• Al menos un número (0-9)
• Al menos un carácter especial (!@#$%^&*()_+-=[]{}|;:,.<>?)
• No debe contener espacios en blanco
• No debe contener patrones comunes débiles
• No debe contener tu nombre o email`;
}

module.exports = {
  validatePasswordStrength,
  checkCommonPatterns,
  validatePassword,
  getPasswordRequirements
};
