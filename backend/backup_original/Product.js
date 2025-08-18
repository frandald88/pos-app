const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true },
  category: { type: String },
  tienda: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda', required: true }
});

module.exports = mongoose.model('Product', productSchema);
