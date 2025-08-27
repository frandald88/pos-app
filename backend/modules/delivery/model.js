
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  proveedor: { type: String, required: true },
  producto: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: { 
    type: String, 
    enum: ['pza', 'kg', 'lts', 'mxn'], 
    default: 'pza' 
  },
  fechaEmision: { type: Date, required: true },
  fechaEntrega: { type: Date },
  status: { 
    type: String, 
    enum: ['pendiente', 'completada', 'cancelada'], 
    default: 'pendiente' 
  },
  nota: { type: String, default: '' },
  createdBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  tienda: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tienda' 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: false
  }
}, { timestamps: true });

// Validación: fecha de entrega debe ser posterior a fecha de emisión
orderSchema.pre('save', function(next) {
  if (this.fechaEntrega && this.fechaEntrega < this.fechaEmision) {
    next(new Error('La fecha de entrega debe ser posterior a la fecha de emisión'));
  }
  next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);