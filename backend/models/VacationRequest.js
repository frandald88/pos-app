const mongoose = require('mongoose');

const vacationRequestSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tienda: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  replacement: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  },
  reason: { type: String },  // ✅ Razón de rechazo o comentario del admin
}, { timestamps: true });

module.exports = mongoose.models.VacationRequest || mongoose.model('VacationRequest', vacationRequestSchema);
