const mongoose = require('mongoose');

const purchaseOrderSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
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

// Validación: fecha de entrega no puede ser anterior a fecha de emisión
purchaseOrderSchema.pre('save', function(next) {
  if (this.fechaEntrega && this.fechaEmision) {
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

// Índices compuestos para multi-tenancy
purchaseOrderSchema.index({ tenantId: 1, fechaEmision: -1 });
purchaseOrderSchema.index({ tenantId: 1, status: 1 });
purchaseOrderSchema.index({ tenantId: 1, tienda: 1 });

module.exports = mongoose.models.PurchaseOrder || mongoose.model('PurchaseOrder', purchaseOrderSchema);
