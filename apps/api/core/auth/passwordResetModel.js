const mongoose = require('mongoose');

/**
 * Modelo para tokens de recuperación de contraseña
 * - Almacena tokens hasheados para seguridad
 * - Tokens expiran después de 1 hora
 * - Se marcan como usados después de resetear contraseña
 */
const passwordResetSchema = new mongoose.Schema({
  // Usuario que solicitó el reset
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  // Tenant al que pertenece
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  // Token hasheado (nunca guardar en texto plano)
  token: {
    type: String,
    required: true,
    unique: true
  },

  // Fecha de expiración (1 hora desde creación)
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },

  // Si el token ya fue usado
  used: {
    type: Boolean,
    default: false
  },

  // Fecha de uso
  usedAt: {
    type: Date
  },

  // IP desde donde se solicitó
  requestIp: {
    type: String
  },

  // User agent
  userAgent: {
    type: String
  }
}, {
  timestamps: true
});

// Índice compuesto para búsquedas eficientes
passwordResetSchema.index({ userId: 1, used: 1, expiresAt: 1 });

// Método para verificar si el token expiró
passwordResetSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Método para marcar como usado
passwordResetSchema.methods.markAsUsed = async function() {
  this.used = true;
  this.usedAt = new Date();
  await this.save();
};

// Limpiar tokens expirados automáticamente (TTL index)
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);

module.exports = PasswordReset;
