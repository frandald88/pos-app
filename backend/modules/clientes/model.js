const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  direccion: { type: String },
  telefono: { type: String },
  email: { type: String }
}, { timestamps: true }); // timestamps para auditoría

module.exports = mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);

