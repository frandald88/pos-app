const mongoose = require('mongoose');

const employeeHistorySchema = new mongoose.Schema({
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
  
  // ✅ CAMPOS PERSONALES EXISTENTES
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  apellidoPaterno: {
    type: String,
    required: true,
    trim: true
  },
  apellidoMaterno: {
    type: String,
    required: true,
    trim: true
  },
  rfc: {
    type: String,
    default: null,
    trim: true,
    uppercase: true
  },
  curp: {
    type: String,
    default: null,
    trim: true,
    uppercase: true
  },
  numeroSeguroSocial: {
    type: String,
    default: null,
    trim: true
  },
  
  // ✅ ARCHIVOS ADJUNTOS EXISTENTES
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    path: {
      type: String,
      required: true
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    description: {
      type: String,
      default: null
    }
  }],
  
  // CAMPOS LABORALES EXISTENTES
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  position: {
    type: String,
    default: 'Empleado'
  },
  salary: {
    type: Number,
    required: true
  },
  seguroSocial: {
    type: String,
    enum: ['Sí', 'No'],
    default: 'No'
  },
  motivoBaja: {
    type: String,
    enum: ['renuncia', 'despido', 'fin_contrato', 'otro'],
    required: function() {
      return this.endDate != null && this.endDate !== undefined;
    },
    default: null
  },
  razonBaja: {
    type: String,
    required: function() {
      return this.endDate != null && this.endDate !== undefined;
    },
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notes: {
    type: String,
    default: null
  },

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
  }
}, { timestamps: true });

// ✅ MÉTODO VIRTUAL EXISTENTE
employeeHistorySchema.virtual('nombreCompleto').get(function() {
  return `${this.nombre} ${this.apellidoPaterno} ${this.apellidoMaterno}`;
});

// ✅ NUEVO: Middleware para excluir registros eliminados automáticamente
employeeHistorySchema.pre(/^find/, function(next) {
  // Solo aplicar el filtro si no se especifica explícitamente incluir eliminados
  if (!this.getOptions().includeDeleted) {
    this.find({ isDeleted: { $ne: true } });
  }
  next();
});

// ✅ MIDDLEWARE EXISTENTE ACTUALIZADO
employeeHistorySchema.pre('save', function(next) {
  if (this.endDate && this.isActive) {
    this.isActive = false;
  }
  
  // Limpiar campos vacíos antes de guardar
  const fieldsToClean = ['motivoBaja', 'razonBaja', 'notes', 'rfc', 'curp', 'numeroSeguroSocial'];
  fieldsToClean.forEach(field => {
    if (this[field] === '') {
      this[field] = null;
    }
  });
  
  next();
});

// ✅ NUEVOS MÉTODOS PARA SOFT DELETE
employeeHistorySchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

employeeHistorySchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = undefined;
  this.deletedBy = undefined;
  return this.save();
};

// ✅ ÍNDICES EXISTENTES + NUEVO ÍNDICE PARA SOFT DELETE
employeeHistorySchema.index({ employee: 1, tienda: 1 });
employeeHistorySchema.index({ isActive: 1 });
employeeHistorySchema.index({ nombre: 1, apellidoPaterno: 1, apellidoMaterno: 1 });
employeeHistorySchema.index({ rfc: 1 }, { sparse: true });
employeeHistorySchema.index({ curp: 1 }, { sparse: true });
employeeHistorySchema.index({ isDeleted: 1 }); // ✅ NUEVO: Índice para soft delete

module.exports = mongoose.models.EmployeeHistory || mongoose.model('EmployeeHistory', employeeHistorySchema);