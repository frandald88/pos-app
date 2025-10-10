
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  proveedor: { type: String, required: true },
  producto: { type: String, required: true },
  cantidad: { type: Number, required: true },
  unidad: {
    type: String,
    enum: ['pza', 'kg', 'g', 'lt', 'lts', 'caja', 'paquete', 'mxn'],
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
    required: true
  }
}, { timestamps: true });

// Validación: fecha de entrega no puede ser anterior a fecha de emisión (puede ser el mismo día)
orderSchema.pre('save', function(next) {
  if (this.fechaEntrega && this.fechaEmision) {
    // Normalizar ambas fechas a medianoche para comparar solo días
    const entregaNormalized = new Date(this.fechaEntrega);
    entregaNormalized.setHours(0, 0, 0, 0);

    const emisionNormalized = new Date(this.fechaEmision);
    emisionNormalized.setHours(0, 0, 0, 0);

    if (entregaNormalized < emisionNormalized) {
      next(new Error('La fecha de entrega no puede ser anterior a la fecha de emisión'));
    }
  }
  next();
});

module.exports = mongoose.models.Order || mongoose.model('Order', orderSchema);