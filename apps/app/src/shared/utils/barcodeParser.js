/**
 * Utilidad para parsear códigos de barras con peso/precio integrado
 * Formatos soportados:
 *
 * Formato EAN-13 con peso (más común en México):
 * - 2 + 5 dígitos (PLU) + 5 dígitos (peso en gramos) + 1 verificador
 * - Ejemplo: 2 00123 01500 0
 *   - 2: Prefijo para productos pesados
 *   - 00123: Código del producto
 *   - 01500: Peso = 1.500 kg
 *   - 0: Dígito verificador
 *
 * Formato alternativo con precio:
 * - 2 + 5 dígitos (PLU) + 5 dígitos (precio en centavos) + 1 verificador
 */

export const parseWeightBarcode = (barcode) => {
  // Verificar que sea un código válido
  if (!barcode || typeof barcode !== 'string') {
    return { isWeightBarcode: false };
  }

  // Remover espacios y caracteres no numéricos
  const cleanBarcode = barcode.replace(/\D/g, '');

  // Verificar longitud (debe ser 13 dígitos para EAN-13)
  if (cleanBarcode.length !== 13) {
    return { isWeightBarcode: false };
  }

  // Verificar que empiece con 2 (prefijo para productos pesados)
  if (!cleanBarcode.startsWith('2')) {
    return { isWeightBarcode: false };
  }

  // Parsear el código
  const prefix = cleanBarcode.substring(0, 1);        // "2"
  const productCode = cleanBarcode.substring(1, 6);   // "00123"
  const weightOrPrice = cleanBarcode.substring(6, 11); // "01500"
  const checkDigit = cleanBarcode.substring(11, 13);  // "00"

  // Convertir peso de gramos a kilogramos
  const weightInGrams = parseInt(weightOrPrice, 10);
  const weightInKg = weightInGrams / 1000;

  return {
    isWeightBarcode: true,
    originalBarcode: barcode,
    productCode: productCode,
    weight: weightInKg,
    weightInGrams: weightInGrams,
    checkDigit: checkDigit,
    // Formato para búsqueda: usar el código del producto
    searchCode: productCode
  };
};

/**
 * Generar código de barras con peso integrado
 * @param {string} productCode - Código del producto (5 dígitos)
 * @param {number} weightInKg - Peso en kilogramos
 * @returns {string} - Código de barras completo
 */
export const generateWeightBarcode = (productCode, weightInKg) => {
  // Asegurar que el código del producto tenga 5 dígitos
  const paddedProductCode = productCode.toString().padStart(5, '0').substring(0, 5);

  // Convertir peso a gramos y asegurar 5 dígitos
  const weightInGrams = Math.round(weightInKg * 1000);
  const paddedWeight = weightInGrams.toString().padStart(5, '0').substring(0, 5);

  // Generar código base (sin dígito verificador)
  const baseCode = `2${paddedProductCode}${paddedWeight}`;

  // Calcular dígito verificador (EAN-13)
  const checkDigit = calculateEAN13CheckDigit(baseCode);

  return `${baseCode}${checkDigit}`;
};

/**
 * Calcular dígito verificador EAN-13
 */
const calculateEAN13CheckDigit = (code) => {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i], 10);
    sum += (i % 2 === 0) ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString().padStart(2, '0');
};

/**
 * Validar si un código de barras es válido según el formato EAN-13
 */
export const isValidEAN13 = (barcode) => {
  const cleanBarcode = barcode.replace(/\D/g, '');
  if (cleanBarcode.length !== 13) return false;

  const code = cleanBarcode.substring(0, 11);
  const providedCheckDigit = cleanBarcode.substring(11, 13);
  const calculatedCheckDigit = calculateEAN13CheckDigit(code);

  return providedCheckDigit === calculatedCheckDigit;
};

/**
 * Ejemplo de uso:
 *
 * const result = parseWeightBarcode('2001230150000');
 * if (result.isWeightBarcode) {
 *   console.log(`Producto: ${result.productCode}, Peso: ${result.weight} kg`);
 *   // Buscar producto por result.searchCode
 *   // Agregar al carrito con cantidad = result.weight
 * }
 */
