const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      name: { type: String },
    },
  ],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },  // 👈 Nuevo campo
  method: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta'],
    required: true
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
  deliveryPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function () {
      return this.type === 'domicilio';
    }
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
