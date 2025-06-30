const mongoose = require('mongoose');

const EmployeeHistorySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tienda: { type: mongoose.Schema.Types.ObjectId, ref: 'Tienda', required: true },
  sueldoDiario: { type: Number, required: true },
  seguroSocial: { type: Boolean, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  motivoBaja: { type: String, enum: ['renuncia', 'despido', ''], default: '' },
  razonBaja: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeHistory', EmployeeHistorySchema);
