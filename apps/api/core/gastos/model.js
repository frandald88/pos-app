const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  concepto: { type: String, required: true },
  proveedor: { type: String, required: true },
  monto: { type: Number, required: true },
  metodoPago: { 
    type: String, 
    enum: ['efectivo', 'transferencia', 'tarjeta'], 
    required: true 
  },
  tienda: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tienda', 
    required: true 
  },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pendiente', 'aprobado', 'en revision', 'denegado'], 
    default: 'pendiente' 
  },
  evidencia: { type: String }, // Ruta al archivo guardado
  nota: { type: String, default: "" }
}, { timestamps: true }); // ✅ Mantuve timestamps para compatibilidad

// Índices compuestos para multi-tenancy
ExpenseSchema.index({ tenantId: 1, createdAt: -1 });

module.exports = mongoose.models.Expense || mongoose.model('Expense', ExpenseSchema);