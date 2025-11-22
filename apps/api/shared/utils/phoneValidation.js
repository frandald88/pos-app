// Lista de códigos de área de países
const COUNTRY_CODES = [
  { code: '+1', country: 'Estados Unidos', flag: '🇺🇸', maxLength: 10 },
  { code: '+1', country: 'Canadá', flag: '🇨🇦', maxLength: 10 },
  { code: '+52', country: 'México', flag: '🇲🇽', maxLength: 10 },
  { code: '+34', country: 'España', flag: '🇪🇸', maxLength: 9 },
  { code: '+44', country: 'Reino Unido', flag: '🇬🇧', maxLength: 10 },
  { code: '+33', country: 'Francia', flag: '🇫🇷', maxLength: 9 },
  { code: '+49', country: 'Alemania', flag: '🇩🇪', maxLength: 11 },
  { code: '+39', country: 'Italia', flag: '🇮🇹', maxLength: 10 },
  { code: '+351', country: 'Portugal', flag: '🇵🇹', maxLength: 9 },
  { code: '+54', country: 'Argentina', flag: '🇦🇷', maxLength: 10 },
  { code: '+55', country: 'Brasil', flag: '🇧🇷', maxLength: 11 },
  { code: '+56', country: 'Chile', flag: '🇨🇱', maxLength: 9 },
  { code: '+57', country: 'Colombia', flag: '🇨🇴', maxLength: 10 },
  { code: '+51', country: 'Perú', flag: '🇵🇪', maxLength: 9 },
  { code: '+58', country: 'Venezuela', flag: '🇻🇪', maxLength: 10 },
  { code: '+593', country: 'Ecuador', flag: '🇪🇨', maxLength: 9 },
  { code: '+591', country: 'Bolivia', flag: '🇧🇴', maxLength: 8 },
  { code: '+598', country: 'Uruguay', flag: '🇺🇾', maxLength: 8 },
  { code: '+595', country: 'Paraguay', flag: '🇵🇾', maxLength: 9 },
  { code: '+506', country: 'Costa Rica', flag: '🇨🇷', maxLength: 8 },
  { code: '+507', country: 'Panamá', flag: '🇵🇦', maxLength: 8 },
  { code: '+503', country: 'El Salvador', flag: '🇸🇻', maxLength: 8 },
  { code: '+502', country: 'Guatemala', flag: '🇬🇹', maxLength: 8 },
  { code: '+504', country: 'Honduras', flag: '🇭🇳', maxLength: 8 },
  { code: '+505', country: 'Nicaragua', flag: '🇳🇮', maxLength: 8 },
  { code: '+53', country: 'Cuba', flag: '🇨🇺', maxLength: 8 },
  { code: '+509', country: 'Haití', flag: '🇭🇹', maxLength: 8 },
  { code: '+1-809', country: 'República Dominicana', flag: '🇩🇴', maxLength: 10 }
];

/**
 * Validar formato de teléfono internacional
 * Formato esperado: "+XX XXXXXXXXXX" (código de área + espacio + solo números)
 *
 * @param {string} phone - Número de teléfono a validar
 * @returns {object} - { valid: boolean, message?: string, phone?: string }
 */
function validateInternationalPhone(phone) {
  if (!phone || phone.trim() === '') {
    return { valid: true, message: 'Teléfono opcional' }; // Opcional
  }

  const phoneStr = phone.trim();

  // Regex: código de área (+XX o +XXX o +X-XXX) + espacio + solo números
  const phoneRegex = /^\+\d{1,4}(-\d{3})?\s\d+$/;

  if (!phoneRegex.test(phoneStr)) {
    return {
      valid: false,
      message: 'Formato inválido. Use: +52 5551234567 (código de área + espacio + números)'
    };
  }

  // Extraer la parte numérica (después del espacio)
  const parts = phoneStr.split(' ');
  if (parts.length < 2) {
    return {
      valid: false,
      message: 'Debe incluir un espacio entre el código de área y el número'
    };
  }

  const numberPart = parts.slice(1).join('');

  // Validar que solo contenga dígitos
  if (!/^\d+$/.test(numberPart)) {
    return {
      valid: false,
      message: 'El número de teléfono solo debe contener dígitos'
    };
  }

  // Validar longitud mínima y máxima
  if (numberPart.length < 7 || numberPart.length > 15) {
    return {
      valid: false,
      message: 'El número debe tener entre 7 y 15 dígitos'
    };
  }

  return { valid: true, phone: phoneStr };
}

module.exports = {
  COUNTRY_CODES,
  validateInternationalPhone
};
