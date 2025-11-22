const Counter = require('../models/Counter');

/**
 * Genera el siguiente número de folio para un contador específico
 * @param {string} counterName - Nombre del contador (ej: 'sale', 'quote', 'invoice')
 * @returns {Promise<number>} - El siguiente número de folio
 */
async function getNextSequence(counterName) {
  try {
    const counter = await Counter.findByIdAndUpdate(
      counterName,
      { $inc: { seq: 1 } },
      {
        new: true,           // Retornar el documento actualizado
        upsert: true,        // Crear el contador si no existe
        setDefaultsOnInsert: true
      }
    );

    return counter.seq;
  } catch (error) {
    console.error(`Error al generar folio para ${counterName}:`, error);
    throw new Error(`No se pudo generar el folio: ${error.message}`);
  }
}

/**
 * Obtiene el valor actual del contador sin incrementarlo
 * @param {string} counterName - Nombre del contador
 * @returns {Promise<number>} - El valor actual del contador
 */
async function getCurrentSequence(counterName) {
  try {
    const counter = await Counter.findById(counterName);
    return counter ? counter.seq : 0;
  } catch (error) {
    console.error(`Error al obtener contador ${counterName}:`, error);
    return 0;
  }
}

/**
 * Reinicia un contador a un valor específico (usar con precaución)
 * @param {string} counterName - Nombre del contador
 * @param {number} value - Nuevo valor del contador
 * @returns {Promise<void>}
 */
async function resetCounter(counterName, value = 0) {
  try {
    await Counter.findByIdAndUpdate(
      counterName,
      { seq: value },
      { upsert: true }
    );
    console.log(`Contador ${counterName} reiniciado a ${value}`);
  } catch (error) {
    console.error(`Error al reiniciar contador ${counterName}:`, error);
    throw error;
  }
}

module.exports = {
  getNextSequence,
  getCurrentSequence,
  resetCounter
};
