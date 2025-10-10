const mongoose = require('mongoose');

const tiendaSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String },
  telefono: { type: String },
  activa: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.models.Tienda || mongoose.model('Tienda', tiendaSchema);