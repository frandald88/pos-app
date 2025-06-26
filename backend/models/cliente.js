const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String },
  telefono: { type: String },
  email: { type: String }
});

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);