const mongoose = require('mongoose');

const vacationRequestSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  employee: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  tienda: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tienda', 
    required: true 
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  replacement: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  status: {
    type: String,
    enum: ['pendiente', 'aprobada', 'rechazada'],
    default: 'pendiente',
  },
  reason: { type: String }, // Razón de rechazo o comentario del admin

  // ✅ NUEVOS CAMPOS PARA SOFT DELETE
  isDeleted: { 
    type: Boolean, 
    default: false 
  },
  deletedAt: { 
    type: Date 
  },
  deletedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  
  // ✅ NUEVO: Información del empleado para preservar datos
  employeeInfo: {
    username: String,
    role: String
  },
  
  // ✅ NUEVO: Control de días tomados automáticamente
  daysTakenUpdated: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: true });

// ✅ NUEVO: Middleware para excluir solicitudes eliminadas automáticamente
vacationRequestSchema.pre(/^find/, function(next) {
  // Solo aplicar el filtro si no se especifica explícitamente incluir eliminados
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// Validación: fecha de fin no puede ser anterior a fecha de inicio
vacationRequestSchema.pre('save', function(next) {
  if (this.endDate < this.startDate) {
    next(new Error('La fecha de inicio no puede ser posterior a la fecha de fin'));
  }
  next();
});

// ✅ NUEVOS MÉTODOS PARA SOFT DELETE
vacationRequestSchema.methods.softDelete = function(deletedBy, employeeInfo = null) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  
  // Preservar información del empleado si se proporciona
  if (employeeInfo) {
    this.employeeInfo = {
      username: employeeInfo.username,
      role: employeeInfo.role
    };
  }
  
  return this.save();
};

vacationRequestSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// ✅ NUEVO: Virtual para obtener información del empleado
vacationRequestSchema.virtual('employeeDisplay').get(function() {
  if (this.isDeleted && this.employeeInfo) {
    return {
      username: this.employeeInfo.username + ' (Eliminado)',
      role: this.employeeInfo.role,
      isDeleted: true
    };
  }
  return this.populated('employee') ? this.employee : null;
});

// Índices para búsquedas eficientes
vacationRequestSchema.index({ employee: 1, status: 1 });
vacationRequestSchema.index({ tienda: 1, status: 1 });
vacationRequestSchema.index({ startDate: 1, endDate: 1 });
vacationRequestSchema.index({ isDeleted: 1 }); // ✅ NUEVO: Índice para soft delete
vacationRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.models.VacationRequest || mongoose.model('VacationRequest', vacationRequestSchema);