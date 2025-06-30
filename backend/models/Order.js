const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  proveedor: { type: String, required: true },
  producto: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: { type: String, enum: ['pza', 'kg', 'lts', 'mxn'], default: 'pza' },
  fechaEmision: { type: Date, required: true },
  fechaEntrega: { type: Date },
  status: { type: String, enum: ['pendiente', 'completada', 'cancelada'], default: 'pendiente' },
  nota: { type: String, default: '' }
});

module.exports = mongoose.model('Order', orderSchema);
