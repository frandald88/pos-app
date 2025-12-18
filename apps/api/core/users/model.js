const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  username: { type: String, required: true },
  email: { type: String, required: false }, // Email del usuario (usado principalmente para admins)
  password: { type: String, required: false }, // Puede ser null si la cuenta no está activada
  role: { type: String, enum: ['admin', 'vendedor', 'repartidor'], default: 'vendedor' },
  telefono: { type: String },
  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: function () {
      return this.role !== 'admin';
    },
    validate: {
      validator: function(value) {
        // Si es admin, tienda puede ser null/undefined
        if (this.role === 'admin') return true;
        // Si no es admin, debe tener tienda
        return value != null;
      },
      message: 'Los usuarios que no son admin deben tener una tienda asignada'
    }
  },
  // ✅ NUEVO CAMPO para días de vacaciones tomados
  daysTaken: { type: Number, default: 0 },
  // Campo para indicar si el usuario está activo
  isActive: { type: Boolean, default: true },
  // Campo para forzar cambio de contraseña en primer login
  mustChangePassword: { type: Boolean, default: false },
  // Campos para activación de cuenta
  activationToken: { type: String },
  activationTokenExpires: { type: Date },
  // CAMPOS para soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Índices compuestos para multi-tenancy
userSchema.index({ tenantId: 1, username: 1 }, { unique: true });
// Índice para email (único por tenant cuando se proporciona)
userSchema.index({ tenantId: 1, email: 1 }, {
  unique: true,
  sparse: true // Permite múltiples documentos sin email
});

// ✅ OPTIMIZACIÓN: Índices adicionales para queries comunes
userSchema.index({ tenantId: 1, role: 1 }); // getAll users filtrado por role
userSchema.index({ tenantId: 1, tienda: 1 }); // getAll users filtrado por tienda
userSchema.index({ isDeleted: 1 }); // Queries de soft delete

// ✅ Middleware para excluir usuarios eliminados automáticamente
userSchema.pre(/^find/, function(next) {
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// ✅ Middleware especial para actualizaciones que manejan el campo tienda
userSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  
  // Si se está actualizando el rol a admin, limpiar tienda
  if (update.role === 'admin' && update.tienda !== undefined) {
    // Usar $unset si no se proporciona explícitamente
    if (!update.$unset) {
      update.$unset = {};
    }
    update.$unset.tienda = 1;
    delete update.tienda;
  }
  
  next();
});

// ✅ Método para soft delete
userSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// ✅ Método para restaurar
userSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// Encriptar contraseña antes de guardar
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

// ✅ Middleware adicional para validar tienda en save
userSchema.pre('save', function(next) {
  // Si es admin, limpiar tienda
  if (this.role === 'admin') {
    this.tienda = undefined;
  }
  next();
});

// Método para validar contraseña
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);