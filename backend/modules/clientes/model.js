const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  // ⭐ NUEVO: Separar nombre completo en componentes
  nombre: { type: String, required: true },
  primerApellido: { type: String, default: '' },
  segundoApellido: { type: String, default: '' },

  // ⭐ Campo virtual para compatibilidad con código existente
  nombreCompleto: { type: String },

  direccion: { type: String },
  telefono: { type: String },
  email: { type: String }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ⭐ Virtual para obtener nombre completo
clienteSchema.virtual('nombreCompletoVirtual').get(function() {
  return `${this.nombre} ${this.primerApellido} ${this.segundoApellido}`.trim();
});

// ⭐ Índice compuesto único para evitar duplicados exactos
clienteSchema.index({
  nombre: 1,
  primerApellido: 1,
  segundoApellido: 1
}, {
  unique: true,
  collation: { locale: 'es', strength: 2 } // Case-insensitive
});

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);

