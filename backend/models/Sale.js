const mongoose = require('mongoose');

const saleSchema = new mongoose.Schema({
  items: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
      quantity: { type: Number, required: true },
      price: { type: Number, required: true },
      name: { type: String },
      note: { type: String }  // ✅ Ya lo habías agregado antes
    },
  ],
  total: { type: Number, required: true },
  discount: { type: Number, default: 0 },
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
  // ✅ Nuevo campo status
  status: {
      type: String,
      enum: ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'],
      default: 'en_preparacion'
  },
  totalReturned: { type: Number, default: 0 },

  
}, { timestamps: true });

module.exports = mongoose.models.Sale || mongoose.model("Sale", saleSchema);
