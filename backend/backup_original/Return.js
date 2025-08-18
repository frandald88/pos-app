const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  saleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Sale', required: true },
  returnedItems: [
    {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
      quantity: { type: Number, required: true },
      reason: { type: String },  // ✅ Opcional: razón de la devolución
    }
  ],
  refundAmount: { type: Number, required: true },  // ✅ Opcional: si reembolsas
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Return', returnSchema);
