const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: { type: String, required: true },
  sku: { type: String, required: true },
  barcode: { type: String, sparse: true }, // Código de barras (sparse permite null/undefined)
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },

  // Campos para productos vendidos por peso
  soldByWeight: { type: Boolean, default: false }, // Si el producto se vende por peso
  weightUnit: { type: String, enum: ['kg', 'g', 'lb'], default: 'kg' }, // Unidad de medida

  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true
  }
}, { timestamps: true });

// Índices compuestos para multi-tenancy
productSchema.index({ tenantId: 1, sku: 1 }, { unique: true });
// Índice parcial: solo aplicar unicidad cuando barcode existe y no es null
productSchema.index(
  { tenantId: 1, barcode: 1 },
  {
    unique: true,
    partialFilterExpression: { barcode: { $exists: true, $ne: null, $ne: '' } }
  }
);
// ⚡ Índice para optimizar actualizaciones de stock durante ventas
productSchema.index({ _id: 1, tenantId: 1 });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);