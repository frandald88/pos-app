const mongoose = require('mongoose');

const turnoSchema = new mongoose.Schema({
  // Usuario que abre el turno (cajero)
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Usuario que cierra el turno (puede ser diferente al que abrió)
  usuarioCierre: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },

  // Tienda donde se abre el turno
  tienda: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tienda',
    required: true
  },

  // Nombre de la estación/equipo/caja
  estacion: {
    type: String,
    required: true,
    default: function() {
      return `Caja-${Date.now()}`;
    }
  },

  // Fechas
  fechaApertura: {
    type: Date,
    required: true,
    default: Date.now
  },

  fechaCierre: {
    type: Date,
    default: null
  },

  // Efectivo
  efectivoInicial: {
    type: Number,
    required: true,
    min: 0
  },

  efectivoFinal: {
    type: Number,
    default: null,
    min: 0
  },

  // Estado del turno
  estado: {
    type: String,
    enum: ['abierto', 'cerrado'],
    default: 'abierto'
  },

  // Información adicional del cierre
  cierreRealizado: {
    type: Boolean,
    default: false
  },

  // Notas opcionales
  notasApertura: {
    type: String,
    default: ''
  },

  notasCierre: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Índices para búsquedas eficientes
turnoSchema.index({ usuario: 1, estado: 1 });
turnoSchema.index({ tienda: 1, estado: 1 });
turnoSchema.index({ fechaApertura: -1 });

// Virtual para calcular duración del turno
turnoSchema.virtual('duracion').get(function() {
  if (this.fechaCierre) {
    return this.fechaCierre - this.fechaApertura;
  }
  return Date.now() - this.fechaApertura;
});

// Método para verificar si el turno está activo
turnoSchema.methods.estaActivo = function() {
  return this.estado === 'abierto' && !this.fechaCierre;
};

module.exports = mongoose.models.Turno || mongoose.model('Turno', turnoSchema);
