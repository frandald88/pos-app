const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      name: { type: String },
      note: { type: String }
    },
  ],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  
  // ✅ NUEVO: Sistema de pagos mixtos
  paymentType: {
    type: String,
    enum: ['single', 'mixed'], // 'single' para un solo método, 'mixed' para múltiples
    default: 'single'
  },
  
  // ✅ Para pagos únicos (mantener compatibilidad)
  method: {
  type: String,
  enum: ['efectivo', 'transferencia', 'tarjeta'],
  required: function() {
    return this.paymentType === 'single' || !this.paymentType;
  },
  validate: {
    validator: function(value) {
      // Si es pago mixto, method puede ser undefined
      if (this.paymentType === 'mixed') {
        return true;
      }
      // Si es pago único, method debe existir
      return value && ['efectivo', 'transferencia', 'tarjeta'].includes(value);
    },
    message: 'Method es requerido para pagos únicos'
  }
},
  
  // ✅ NUEVO: Para pagos mixtos
  mixedPayments: [
    {
      method: {
        type: String,
        enum: ['efectivo', 'transferencia', 'tarjeta'],
        required: true
      },
      amount: {
        type: Number,
        required: true,
        min: 0
      },
      reference: { // Para transferencias o tarjetas
        type: String,
        required: false
      },
      receivedAmount: { // Solo para efectivo - cantidad recibida
        type: Number,
        required: false
      }
    }
  ],
  
  // ✅ NUEVO: Cambio total (para efectivo en pagos mixtos)
  totalChange: {
    type: Number,
    default: 0
  },
  
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
  },
  type: {
    type: String,
    enum: ['mostrador', 'recoger', 'domicilio'],
    default: 'mostrador',
    required: true
  },
  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true,
  },
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.type === 'domicilio';
    }
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'],
    default: 'en_preparacion'
  },
  totalReturned: { type: Number, default: 0 },
}, { timestamps: true });

// ✅ NUEVO: Validación para asegurar que los pagos mixtos sumen el total
saleSchema.pre('save', function(next) {
  if (this.paymentType === 'mixed' && this.mixedPayments && this.mixedPayments.length > 0) {
    const totalPaid = this.mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Permitir una pequeña diferencia por redondeo (1 centavo)
    const difference = Math.abs(totalPaid - this.total);
    if (difference > 0.01) {
      return next(new Error(`Los pagos mixtos (${totalPaid}) no coinciden con el total (${this.total})`));
    }
    
    // Calcular cambio total
    const effectivePayments = this.mixedPayments.filter(p => p.method === 'efectivo');
    this.totalChange = effectivePayments.reduce((sum, payment) => {
      const change = (payment.receivedAmount || payment.amount) - payment.amount;
      return sum + Math.max(0, change);
    }, 0);
  }
  
  next();
});

// ✅ NUEVO: Método virtual para obtener resumen de pagos
saleSchema.virtual('paymentSummary').get(function() {
  if (this.paymentType === 'single') {
    return {
      type: 'single',
      method: this.method,
      amount: this.total
    };
  } else {
    return {
      type: 'mixed',
      payments: this.mixedPayments,
      totalChange: this.totalChange
    };
  }
});

module.exports = mongoose.models.Sale || mongoose.model("Sale", saleSchema);