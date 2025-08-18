const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String },
  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);