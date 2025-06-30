const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  concepto: { type: String, required: true },
  proveedor: { type: String, required: true },
  monto: { type: Number, required: true },
  metodoPago: { type: String, enum: ['efectivo', 'transferencia', 'tarjeta'], required: true },
  tienda: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda', required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pendiente', 'aprobado', 'en revision', 'denegado'], default: 'pendiente' },
  evidencia: { type: String }, // Ruta al archivo guardado
  nota: { type: String, default: "" }  // ✅ Cambiado de "adminNote" a "nota"
});

module.exports = mongoose.model('Expense', ExpenseSchema);
