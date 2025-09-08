import { useCallback } from 'react';

export const usePhoneFormatter = () => {
  // Función para formatear números de teléfono
  const formatPhoneNumber = useCallback((value, previousValue = '') => {
    // Remover todo lo que no sea número
    const numbers = value.replace(/\D/g, '');
    
    // No permitir que empiece con 0
    if (numbers.startsWith('0')) {
      return previousValue; // Mantener el valor anterior
    }
    
    // Limitar a máximo 10 dígitos
    const limitedNumbers = numbers.slice(0, 10);
    
    // Formatear como (xxx) xxx-xxxx
    if (limitedNumbers.length >= 6) {
      return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3, 6)}-${limitedNumbers.slice(6)}`;
    } else if (limitedNumbers.length >= 3) {
      return `(${limitedNumbers.slice(0, 3)}) ${limitedNumbers.slice(3)}`;
    } else if (limitedNumbers.length > 0) {
      return `(${limitedNumbers}`;
    }
    
    return limitedNumbers;
  }, []);

  // Obtener números limpios del teléfono formateado
  const getPhoneNumbers = useCallback((formattedPhone) => {
    return formattedPhone.replace(/\D/g, '');
  }, []);

  return {
    formatPhoneNumber,
    getPhoneNumbers
  };
};