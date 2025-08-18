const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  saleId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Sale', 
    required: true 
  },
  returnedItems: [{
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    originalPrice: { type: Number, required: true },
    refundPrice: { type: Number, required: true },
    reason: {
          type: String,
          default: ''
        },
    condition: {
      type: String,
      enum: ['Nuevo', 'Usado - Bueno', 'Usado - Regular', 'Dañado'],
      default: 'Nuevo'
    }
  }],
  refundAmount: { 
    type: Number, 
    required: true,
    min: 0
  },
  refundMethod: {
      type: String,
      enum: ['efectivo', 'transferencia', 'tarjeta', 'credito_tienda', 'mixto'],
      required: true
    },
  // ✅ NUEVO: Campos para rastrear método original y devoluciones mixtas
mixedRefunds: [{
  method: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  }
}],
originalPaymentType: {
  type: String,
  enum: ['single', 'mixed'],
  default: 'single'
},
originalPaymentMethod: {
  type: String,
  enum: ['efectivo', 'transferencia', 'tarjeta']
},
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tienda: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tienda', 
    required: true 
  },
  status: {
    type: String,
    enum: ['procesada', 'aprobada', 'rechazada', 'pendiente'],
    default: 'procesada'
  },
  adminNotes: { type: String },
  customerNotes: { type: String },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

// Validación: el monto de devolución no puede ser mayor al total de la venta
returnSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const Sale = require('../../core/sales/model');
      const sale = await Sale.findById(this.saleId);
      if (!sale) {
        return next(new Error('Venta no encontrada'));
      }
      
      // Verificar que no se exceda el monto máximo retornable
      const maxRefundable = sale.total - (sale.totalReturned || 0);
      if (this.refundAmount > maxRefundable) {
        return next(new Error(`El monto de devolución (${this.refundAmount}) excede el máximo retornable (${maxRefundable})`));
      }
      
      // Asignar tienda de la venta si no se especificó
      if (!this.tienda && sale.tienda) {
        this.tienda = sale.tienda;
      }
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Índices para búsquedas eficientes
returnSchema.index({ saleId: 1 });
returnSchema.index({ tienda: 1, date: 1 });
returnSchema.index({ processedBy: 1 });

module.exports = mongoose.models.Return || mongoose.model('Return', returnSchema);