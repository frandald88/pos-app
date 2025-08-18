const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
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
  // ✅ CAMPOS para soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

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
  if (!this.isModified('password')) return next();
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