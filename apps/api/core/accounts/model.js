const mongoose = require('mongoose');
const Counter = require('../../shared/models/Counter');

const accountSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },

  tiendaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true
  },

  turnoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Turno',
    required: true
  },

  // Folio auto-incremental por tenant
  folio: {
    type: Number,
    required: true
  },

  // Mesa(s) - soporta mesas combinadas
  tableIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table'
  }],

  waiterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Estado de la cuenta
  status: {
    type: String,
    enum: ['open', 'closed_pending', 'split_pending', 'paid', 'cancelled'],
    default: 'open',
    index: true
  },

  // Historial de estados (auditoría)
  statusHistory: [{
    status: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
    reason: String
  }],

  // Órdenes incrementales (mesero puede agregar múltiples veces)
  orders: [{
    orderNumber: {
      type: Number,
      required: true
    },

    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      },
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      price: {
        type: Number,
        required: true,
        min: 0
      },
      name: {
        type: String,
        required: true
      },
      note: String,

      // Estado del item (para cocina)
      status: {
        type: String,
        enum: ['pending', 'preparing', 'ready', 'served', 'cancelled'],
        default: 'pending'
      },

      // Tracking temporal
      sentToKitchenAt: Date,
      readyAt: Date,
      servedAt: Date,

      // Subcuenta (para división por nombre)
      subcuentaName: {
        type: String,
        default: null
      }
    }],

    orderedAt: {
      type: Date,
      default: Date.now
    },

    orderedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    sentToKitchen: {
      type: Boolean,
      default: false
    },

    // Tracking de modificaciones
    modifiedAt: Date,
    cancelledAt: Date,
    cancellationReason: String
  }],

  // Totales
  subtotal: {
    type: Number,
    default: 0,
    min: 0
  },

  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'fixed'
  },

  total: {
    type: Number,
    default: 0,
    min: 0
  },

  // Propina
  tip: {
    amount: {
      type: Number,
      default: 0,
      min: 0
    },
    percentage: Number,
    type: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    }
  },

  // División de cuenta (split bill)
  isSplit: {
    type: Boolean,
    default: false
  },

  splitConfig: [{
    splitNumber: {
      type: Number,
      required: true
    },

    // Referencias a items: { orderIndex, itemIndex, quantity }
    items: [{
      orderIndex: Number,
      itemIndex: Number,
      quantity: Number,
      price: Number
    }],

    subtotal: {
      type: Number,
      default: 0
    },

    tip: {
      amount: Number,
      percentage: Number,
      type: {
        type: String
      }
    },

    total: {
      type: Number,
      default: 0
    },

    paymentMethod: {
      type: String,
      enum: ['efectivo', 'transferencia', 'tarjeta']
    },

    // Soporte para pagos mixtos en split
    paymentType: {
      type: String,
      enum: ['single', 'mixed'],
      default: 'single'
    },

    mixedPayments: [{
      method: String,
      amount: Number,
      reference: String,
      receivedAmount: Number
    }],

    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },

    paidAt: Date,
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    // Sale generada por este split
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    }
  }],

  // Pago (si no es split)
  paymentType: {
    type: String,
    enum: ['single', 'mixed']
  },

  paymentMethod: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta']
  },

  mixedPayments: [{
    method: String,
    amount: Number,
    reference: String,
    receivedAmount: Number
  }],

  // Metadata temporal
  openedAt: {
    type: Date,
    default: Date.now
  },

  closedAt: Date,

  // Links a ventas generadas
  finalSales: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }],

  // Notas generales
  notes: String,

  // Número de comensales
  guestCount: {
    type: Number,
    min: 1
  },

  // Subcuentas por nombre (para división)
  subcuentas: [{
    name: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isPaid: {
      type: Boolean,
      default: false
    },
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    paymentMethod: {
      type: String,
      enum: ['efectivo', 'transferencia', 'tarjeta']
    },
    paymentType: {
      type: String,
      enum: ['single', 'mixed'],
      default: 'single'
    },
    mixedPayments: [{
      method: String,
      amount: Number,
      reference: String,
      receivedAmount: Number
    }],
    tip: {
      amount: {
        type: Number,
        default: 0
      },
      percentage: Number,
      type: {
        type: String,
        enum: ['percentage', 'fixed', 'none'],
        default: 'none'
      }
    },
    subtotal: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    saleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale'
    }
  }]

}, { timestamps: true });

// Índices compuestos
accountSchema.index({ tenantId: 1, folio: 1 }, { unique: true });
accountSchema.index({ tenantId: 1, tiendaId: 1, status: 1 });
accountSchema.index({ tenantId: 1, waiterId: 1, status: 1 });
accountSchema.index({ tableIds: 1, status: 1 });

// Virtual para compatibilidad - retorna la primera mesa
accountSchema.virtual('tableId').get(function() {
  return this.tableIds && this.tableIds.length > 0 ? this.tableIds[0] : null;
});

// ====== MÉTODOS DE INSTANCIA ======

// Calcular totales automáticamente
accountSchema.methods.calculateTotals = function() {
  let subtotal = 0;

  this.orders.forEach(order => {
    order.items.forEach(item => {
      if (item.status !== 'cancelled') {
        subtotal += item.price * item.quantity;
      }
    });
  });

  this.subtotal = subtotal;

  // Aplicar descuento
  let discountAmount = 0;
  if (this.discountType === 'percentage') {
    discountAmount = (subtotal * this.discount) / 100;
  } else {
    discountAmount = this.discount;
  }

  // Total NO incluye propina - la propina es un ingreso adicional separado
  this.total = subtotal - discountAmount;

  return this;
};

// Agregar nueva orden a la cuenta
accountSchema.methods.addOrder = function(items, userId) {
  const orderNumber = this.orders.length + 1;

  this.orders.push({
    orderNumber,
    items,
    orderedBy: userId,
    orderedAt: new Date(),
    sentToKitchen: false
  });

  this.calculateTotals();
  return this.save();
};

// Validar que la división de cuenta sea correcta
accountSchema.methods.validateSplit = function() {
  if (!this.isSplit || !this.splitConfig || this.splitConfig.length === 0) {
    return { valid: true };
  }

  // Sumar totales de splits
  const totalSplit = this.splitConfig.reduce((sum, split) => sum + split.total, 0);

  // Permitir diferencia de 1 centavo por redondeo
  const difference = Math.abs(totalSplit - this.total);
  if (difference > 0.01) {
    return {
      valid: false,
      message: `Los totales de división ($${totalSplit.toFixed(2)}) no coinciden con el total ($${this.total.toFixed(2)})`
    };
  }

  return { valid: true };
};

// Cambiar estado y agregar al historial
accountSchema.methods.changeStatus = function(newStatus, userId, reason = '') {
  const oldStatus = this.status;
  this.status = newStatus;

  this.statusHistory.push({
    status: newStatus,
    changedBy: userId,
    changedAt: new Date(),
    reason: reason || `Cambio de ${oldStatus} a ${newStatus}`
  });

  return this;
};

// Verificar si todos los splits están pagados
accountSchema.methods.areAllSplitsPaid = function() {
  if (!this.isSplit || !this.splitConfig || this.splitConfig.length === 0) {
    return false;
  }

  return this.splitConfig.every(split => split.paymentStatus === 'paid');
};

// Verificar si todas las subcuentas están pagadas
accountSchema.methods.areAllSubcuentasPaid = function() {
  if (!this.subcuentas || this.subcuentas.length === 0) {
    return true; // No hay subcuentas, se puede pagar completa
  }

  return this.subcuentas.every(sub => {
    // Subcuentas vacías (sin items asignados) se consideran como pagadas
    const subtotal = this.getSubcuentaSubtotal(sub.name);
    return sub.isPaid || subtotal === 0;
  });
};

// Calcular subtotal de una subcuenta específica
accountSchema.methods.getSubcuentaSubtotal = function(subcuentaName) {
  let subtotal = 0;

  this.orders.forEach(order => {
    order.items.forEach(item => {
      if (item.status !== 'cancelled' && item.subcuentaName === subcuentaName) {
        subtotal += item.price * item.quantity;
      }
    });
  });

  return subtotal;
};

// Obtener items sin asignar a subcuenta
accountSchema.methods.getUnassignedItems = function() {
  const items = [];

  this.orders.forEach((order, orderIdx) => {
    order.items.forEach((item, itemIdx) => {
      // Excluir items cancelados y items marcados como pagados sin asignar
      if (item.status !== 'cancelled' && !item.subcuentaName) {
        items.push({
          orderIndex: orderIdx,
          itemIndex: itemIdx,
          ...item.toObject()
        });
      }
    });
  });

  return items;
};

// Calcular totales por subcuenta
accountSchema.methods.calculateSubcuentaTotals = function() {
  this.subcuentas.forEach(subcuenta => {
    if (!subcuenta.isPaid) {
      subcuenta.subtotal = this.getSubcuentaSubtotal(subcuenta.name);
      // Total NO incluye propina - la propina es un ingreso adicional separado
      subcuenta.total = subcuenta.subtotal;
    }
  });

  return this;
};

// ====== MIDDLEWARE PRE-SAVE ======

accountSchema.pre('save', function(next) {
  // Recalcular totales si hay cambios en órdenes, descuento o propina
  if (this.isModified('orders') || this.isModified('discount') || this.isModified('tip')) {
    this.calculateTotals();
  }

  // Validar split si está activo
  if (this.isSplit) {
    const validation = this.validateSplit();
    if (!validation.valid) {
      return next(new Error(validation.message));
    }
  }

  next();
});

// Auto-asignar folio si es nuevo documento
accountSchema.pre('save', async function(next) {
  if (this.isNew && !this.folio) {
    try {
      const counter = await Counter.getNextSequence(this.tenantId, 'account');
      this.folio = counter;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
