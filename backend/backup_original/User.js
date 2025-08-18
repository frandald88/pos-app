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
      return this.role !== 'admin';  // Solo requerido si NO es admin
    }
  }
});

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

// Método para validar contraseña
userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
