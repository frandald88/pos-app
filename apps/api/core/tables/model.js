const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true,
    index: true
  },

  // Identificación
  number: {
    type: String,
    required: true,
    trim: true
  },

  section: {
    type: String,
    default: 'General',
    trim: true
  },

  capacity: {
    type: Number,
    default: 4,
    min: 1
  },

  // Estado
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available',
    index: true
  },

  // Cuenta actual (si está ocupada)
  currentAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },

  // Campos adicionales útiles
  position: {
    x: Number, // Coordenadas para layout visual futuro
    y: Number
  },

  qrCode: String, // Para menú digital futuro

  notes: String, // "Vista a la ventana", "Acceso discapacitados", etc.

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

// Índices compuestos para multi-tenancy
tableSchema.index({ tenantId: 1, tiendaId: 1, number: 1 }, { unique: true });
tableSchema.index({ tenantId: 1, tiendaId: 1, status: 1 });

// Métodos de instancia
tableSchema.methods.occupy = function(accountId) {
  this.status = 'occupied';
  this.currentAccount = accountId;
  return this.save();
};

tableSchema.methods.release = function() {
  this.status = 'available';
  this.currentAccount = null;
  return this.save();
};

tableSchema.methods.reserve = function() {
  this.status = 'reserved';
  return this.save();
};

tableSchema.methods.setForCleaning = function() {
  this.status = 'cleaning';
  this.currentAccount = null;
  return this.save();
};

// Validación: No eliminar mesa ocupada
tableSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  if (this.status === 'occupied') {
    return next(new Error('No se puede eliminar una mesa ocupada'));
  }
  next();
});

// Validación: No eliminar mesa con cuenta activa
tableSchema.pre('remove', async function(next) {
  if (this.currentAccount) {
    return next(new Error('No se puede eliminar una mesa con cuenta activa'));
  }
  next();
});

module.exports = mongoose.model('Table', tableSchema);
