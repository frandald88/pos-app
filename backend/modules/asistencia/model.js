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
  // ✅ NUEVO: Múltiples check-ins y check-outs durante el día
  timeEntries: [{
    checkInTime: { type: Date, required: true },
    checkOutTime: { type: Date },
    duration: { type: Number, default: 0 }, // Duración en minutos
    type: { 
      type: String, 
      enum: ['work', 'break', 'lunch'], 
      default: 'work' 
    },
    notes: { type: String }
  }],
  // ✅ MANTENER: Compatibilidad con sistema anterior
  checkInTime: { type: Date }, // Primera entrada del día
  checkOutTime: { type: Date }, // Última salida del día
  status: { 
    type: String, 
    enum: ['Present', 'Absent', 'Late'], 
    default: 'Present' 
  },
  absenceReason: { type: String },
  notes: { type: String },
  hoursWorked: { type: Number, default: 0 }, // Total de horas trabajadas en el día
  totalBreakTime: { type: Number, default: 0 }, // Total de tiempo en descansos (minutos)
  isActive: { type: Boolean, default: false } // Si está actualmente en el trabajo
}, { timestamps: true });

// ✅ NUEVO: Calcular duración de entradas individuales y totales
attendanceSchema.pre('save', function(next) {
  let totalWorkMinutes = 0;
  let totalBreakMinutes = 0;
  
  // Calcular duración de cada entrada
  this.timeEntries.forEach(entry => {
    if (entry.checkInTime && entry.checkOutTime) {
      const diffMs = entry.checkOutTime - entry.checkInTime;
      entry.duration = Math.round(diffMs / (1000 * 60)); // Duración en minutos
      
      if (entry.type === 'work') {
        totalWorkMinutes += entry.duration;
      } else {
        totalBreakMinutes += entry.duration;
      }
    }
  });
  
  // Actualizar totales
  this.hoursWorked = Number((totalWorkMinutes / 60).toFixed(2));
  this.totalBreakTime = totalBreakMinutes;
  
  // Actualizar compatibilidad con sistema anterior
  if (this.timeEntries.length > 0) {
    this.checkInTime = this.timeEntries[0].checkInTime;
    const lastEntry = this.timeEntries[this.timeEntries.length - 1];
    if (lastEntry.checkOutTime) {
      this.checkOutTime = lastEntry.checkOutTime;
      this.isActive = false;
    } else {
      this.isActive = true;
    }
  }
  
  next();
});

// ✅ NUEVO: Método para obtener el estado actual del empleado
attendanceSchema.methods.getCurrentStatus = function() {
  if (!this.timeEntries || this.timeEntries.length === 0) {
    return { status: 'not_started', message: 'No ha iniciado jornada' };
  }
  
  const lastEntry = this.timeEntries[this.timeEntries.length - 1];
  
  if (!lastEntry.checkOutTime) {
    return { 
      status: 'checked_in', 
      message: 'En el trabajo',
      since: lastEntry.checkInTime,
      entryType: lastEntry.type
    };
  } else {
    return { 
      status: 'checked_out', 
      message: 'Fuera del trabajo',
      since: lastEntry.checkOutTime,
      entryType: lastEntry.type
    };
  }
};

// ✅ NUEVO: Método para verificar si puede hacer check-in
attendanceSchema.methods.canCheckIn = function() {
  if (!this.timeEntries || this.timeEntries.length === 0) {
    return { canCheckIn: true, reason: 'first_entry' };
  }
  
  const lastEntry = this.timeEntries[this.timeEntries.length - 1];
  
  if (lastEntry.checkOutTime) {
    return { canCheckIn: true, reason: 'returning_from_break' };
  } else {
    return { canCheckIn: false, reason: 'already_checked_in' };
  }
};

// ✅ NUEVO: Método para verificar si puede hacer check-out
attendanceSchema.methods.canCheckOut = function() {
  if (!this.timeEntries || this.timeEntries.length === 0) {
    return { canCheckOut: false, reason: 'no_checkin_today' };
  }
  
  const lastEntry = this.timeEntries[this.timeEntries.length - 1];
  
  if (!lastEntry.checkOutTime) {
    return { canCheckOut: true, reason: 'currently_checked_in' };
  } else {
    return { canCheckOut: false, reason: 'already_checked_out' };
  }
};

// Índice para búsquedas eficientes
attendanceSchema.index({ userId: 1, date: 1 });
attendanceSchema.index({ tienda: 1, date: 1 });

module.exports = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema);
