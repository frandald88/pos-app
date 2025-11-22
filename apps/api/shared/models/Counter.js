const mongoose = require('mongoose');

/**
 * Modelo para manejar contadores de folios consecutivos
 * Se usa para generar números de folio únicos para ventas, cotizaciones, etc.
 */
const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Nombre del contador (ej: 'sale', 'quote')
  seq: { type: Number, default: 0 }      // Valor actual del contador
});

module.exports = mongoose.models.Counter || mongoose.model('Counter', counterSchema);
