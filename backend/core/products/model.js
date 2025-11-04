const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  barcode: { type: String, unique: true, sparse: true }, // Código de barras único (sparse permite null/undefined)
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

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);