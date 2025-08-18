const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tienda: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tienda', 
    required: true 
  },
  date: { 
    type: Date, 
    required: true, 
    default: Date.now 
  },
  checkInTime: { type: Date },
  checkOutTime: { type: Date },
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late'], 
    default: 'Present' 
  },
  absenceReason: { type: String },
  notes: { type: String },
  hoursWorked: { type: Number, default: 0 } // Calculado automáticamente
}, { timestamps: true });

// Calcular horas trabajadas antes de guardar
attendanceSchema.pre('save', function(next) {
  if (this.checkInTime && this.checkOutTime) {
    const diffMs = this.checkOutTime - this.checkInTime;
    this.hoursWorked = Number((diffMs / (1000 * 60 * 60)).toFixed(2)); // Horas con 2 decimales
  }
  next();
});

// Índice para búsquedas eficientes
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ tienda: 1, date: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
