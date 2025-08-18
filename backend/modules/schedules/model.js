const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  // ✅ NUEVO: Para plantillas reutilizables
  name: { type: String }, // Nombre de la plantilla (ej: "Horario Matutino", "Fin de Semana")
  description: { type: String }, // Descripción de la plantilla
  isTemplate: { type: Boolean, default: false }, // Marca si es una plantilla
  
  // Para asignaciones específicas
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() { return !this.isTemplate; } // Solo requerido si no es plantilla
  },
  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: function() { return !this.isTemplate; } // Solo requerido si no es plantilla
  },
  
  // ✅ NUEVO: Referencia a plantilla usada
  templateUsed: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Schedule'
  },
  templateName: { type: String }, // Nombre de la plantilla para referencia rápida
  
  // Horarios por día de la semana (0 = Domingo, 1 = Lunes, ... 6 = Sábado)
  schedule: {
    0: { // Domingo
      isWorkday: { type: Boolean, default: false },
      startTime: { type: String, default: null }, // "09:00"
      endTime: { type: String, default: null },   // "18:00"
      tolerance: { type: Number, default: 0 }     // minutos de tolerancia
    },
    1: { // Lunes
      isWorkday: { type: Boolean, default: true },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      tolerance: { type: Number, default: 15 }
    },
    2: { // Martes
      isWorkday: { type: Boolean, default: true },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      tolerance: { type: Number, default: 15 }
    },
    3: { // Miércoles
      isWorkday: { type: Boolean, default: true },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      tolerance: { type: Number, default: 15 }
    },
    4: { // Jueves
      isWorkday: { type: Boolean, default: true },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      tolerance: { type: Number, default: 15 }
    },
    5: { // Viernes
      isWorkday: { type: Boolean, default: true },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      tolerance: { type: Number, default: 15 }
    },
    6: { // Sábado
      isWorkday: { type: Boolean, default: false },
      startTime: { type: String, default: null },
      endTime: { type: String, default: null },
      tolerance: { type: Number, default: 0 }
    }
  },
  
  // Configuración general
  defaultTolerance: { type: Number, default: 15 }, // tolerancia por defecto en minutos
  isActive: { type: Boolean, default: true },
  notes: { type: String },
  
  // Fechas especiales (opcional para futuras mejoras)
  exceptions: [{
    date: Date,
    isWorkday: Boolean,
    startTime: String,
    endTime: String,
    reason: String
  }]
}, {
  timestamps: true
});

// ✅ CORREGIDO: Índices mejorados para evitar conflictos
// Índice para asignaciones de empleados (solo cuando no es plantilla)
scheduleSchema.index(
  { employee: 1, isActive: 1 }, 
  { 
    unique: true,
    partialFilterExpression: { 
      isTemplate: false, 
      employee: { $ne: null },
      isActive: true 
    }
  }
);

// Índice para plantillas (solo cuando es plantilla)
scheduleSchema.index(
  { name: 1 }, 
  { 
    unique: true, 
    sparse: true,
    partialFilterExpression: { isTemplate: true }
  }
);

// Índice general para búsquedas
scheduleSchema.index({ isTemplate: 1, isActive: 1 });

// Método para obtener el horario del día actual
scheduleSchema.methods.getTodaySchedule = function() {
  const today = new Date().getDay(); // 0 = Domingo, 1 = Lunes, etc.
  return this.schedule[today];
};

// Método para verificar si hoy es día laboral
scheduleSchema.methods.isWorkdayToday = function() {
  const todaySchedule = this.getTodaySchedule();
  return todaySchedule.isWorkday;
};

// Método para obtener la hora límite con tolerancia
scheduleSchema.methods.getLateLimitToday = function() {
  const todaySchedule = this.getTodaySchedule();
  
  if (!todaySchedule.isWorkday || !todaySchedule.startTime) {
    return null;
  }
  
  const [hours, minutes] = todaySchedule.startTime.split(':').map(Number);
  const tolerance = todaySchedule.tolerance || this.defaultTolerance;
  
  const lateLimit = new Date();
  lateLimit.setHours(hours, minutes + tolerance, 0, 0);
  
  return lateLimit;
};

// ✅ NUEVO: Método para clonar como plantilla
scheduleSchema.methods.cloneAsTemplate = function(name, description) {
  const templateData = {
    name,
    description,
    isTemplate: true,
    schedule: this.schedule,
    defaultTolerance: this.defaultTolerance,
    notes: this.notes,
    employee: null,
    tienda: null
  };
  
  return new this.constructor(templateData);
};

// ✅ NUEVO: Método estático para crear plantillas predefinidas
scheduleSchema.statics.createPredefinedTemplates = async function() {
  const templates = [
    {
      name: "Horario Estándar",
      description: "Lunes a Viernes 9:00-18:00",
      isTemplate: true,
      schedule: {
        0: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 },
        6: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 }
      }
    },
    {
      name: "Horario Matutino",
      description: "Lunes a Viernes 6:00-14:00",
      isTemplate: true,
      schedule: {
        0: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        1: { isWorkday: true, startTime: "06:00", endTime: "14:00", tolerance: 10 },
        2: { isWorkday: true, startTime: "06:00", endTime: "14:00", tolerance: 10 },
        3: { isWorkday: true, startTime: "06:00", endTime: "14:00", tolerance: 10 },
        4: { isWorkday: true, startTime: "06:00", endTime: "14:00", tolerance: 10 },
        5: { isWorkday: true, startTime: "06:00", endTime: "14:00", tolerance: 10 },
        6: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 }
      }
    },
    {
      name: "Fin de Semana",
      description: "Sábado y Domingo 10:00-19:00",
      isTemplate: true,
      schedule: {
        0: { isWorkday: true, startTime: "10:00", endTime: "19:00", tolerance: 15 },
        1: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        2: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        3: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        4: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        5: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        6: { isWorkday: true, startTime: "10:00", endTime: "19:00", tolerance: 15 }
      }
    },
    {
      name: "Tiempo Completo",
      description: "Lunes a Sábado con horarios variables",
      isTemplate: true,
      schedule: {
        0: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 },
        1: { isWorkday: true, startTime: "08:00", endTime: "17:00", tolerance: 15 },
        2: { isWorkday: true, startTime: "08:00", endTime: "17:00", tolerance: 15 },
        3: { isWorkday: true, startTime: "08:00", endTime: "17:00", tolerance: 15 },
        4: { isWorkday: true, startTime: "08:00", endTime: "17:00", tolerance: 15 },
        5: { isWorkday: true, startTime: "08:00", endTime: "17:00", tolerance: 15 },
        6: { isWorkday: true, startTime: "09:00", endTime: "15:00", tolerance: 20 }
      }
    }
  ];
  
  for (const templateData of templates) {
    const existing = await this.findOne({ 
      name: templateData.name, 
      isTemplate: true 
    });
    
    if (!existing) {
      await this.create(templateData);
      console.log(`✅ Plantilla "${templateData.name}" creada`);
    }
  }
};

// Método estático para crear horario por defecto
scheduleSchema.statics.createDefaultSchedule = function(employeeId, tiendaId, customSchedule = {}) {
  const defaultScheduleData = {
    employee: employeeId,
    tienda: tiendaId,
    isTemplate: false,
    schedule: {
      0: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 }, // Domingo
      1: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 }, // Lunes
      2: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 }, // Martes
      3: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 }, // Miércoles
      4: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 }, // Jueves
      5: { isWorkday: true, startTime: "09:00", endTime: "18:00", tolerance: 15 }, // Viernes
      6: { isWorkday: false, startTime: null, endTime: null, tolerance: 0 }  // Sábado
    },
    ...customSchedule
  };
  
  return new this(defaultScheduleData);
};

module.exports = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);