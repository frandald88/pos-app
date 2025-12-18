const mongoose = require('mongoose');

const tiendaSchema = new mongoose.Schema({
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  nombre: { type: String, required: true },
  direccion: { type: String },
  telefono: { type: String },
  activa: { type: Boolean, default: true },

  // Configuración del ticket (específica para cada tienda)
  ticketConfig: {
    // Logo de la tienda (URL o base64)
    logo: { type: String },

    // Información del encabezado
    mostrarLogo: { type: Boolean, default: false },
    nombreNegocio: { type: String },
    rfc: { type: String },

    // Campos a mostrar en el ticket
    camposMostrar: {
      folio: { type: Boolean, default: true },
      fecha: { type: Boolean, default: true },
      hora: { type: Boolean, default: true },
      cajero: { type: Boolean, default: true },
      cliente: { type: Boolean, default: true },
      metodoPago: { type: Boolean, default: true },
      subtotal: { type: Boolean, default: true },
      descuento: { type: Boolean, default: true },
      iva: { type: Boolean, default: false },
      propina: { type: Boolean, default: false },
      cambio: { type: Boolean, default: true }
    },

    // Campos personalizados
    camposPersonalizados: [{
      nombre: { type: String },
      valor: { type: String },
      posicion: { type: String, enum: ['header', 'footer'], default: 'footer' }
    }],

    // Mensajes personalizados
    mensajeSuperior: { type: String },
    mensajeInferior: { type: String, default: '¡GRACIAS POR SU COMPRA!\nVuelva pronto' },

    // Configuración visual
    anchoTicket: { type: String, default: '80mm' }, // 58mm, 80mm
    tamanoFuente: { type: String, default: 'normal' }, // small, normal, large

    // Configuración fiscal
    mostrarRFC: { type: Boolean, default: false },
    leyendaFiscal: { type: String, default: 'Este ticket no es válido como factura' }
  },

  // Configuración de impresión directa
  printConfig: {
    // Activar/desactivar impresión directa
    directPrint: {
      type: Boolean,
      default: false
    },

    // URL del servidor de impresión local
    printServerUrl: {
      type: String,
      default: 'http://localhost:9100'
    },

    // Nombre de la impresora en el sistema
    printerName: {
      type: String,
      default: ''
    },

    // Tipo de impresora (para compatibilidad)
    printerType: {
      type: String,
      enum: ['EPSON', 'STAR', 'TANCA', 'DARUMA', 'BEMATECH'],
      default: 'EPSON'
    },

    // Interfaz de conexión
    connectionType: {
      type: String,
      enum: ['USB', 'NETWORK', 'SERIAL'],
      default: 'USB'
    },

    // IP de la impresora (si es de red)
    printerIP: {
      type: String,
      default: ''
    },

    // Puerto de la impresora (si es de red)
    printerPort: {
      type: Number,
      default: 9100
    },

    // Abrir cajón automáticamente
    autoOpenCashDrawer: {
      type: Boolean,
      default: false
    },

    // Número de copias por defecto
    defaultCopies: {
      type: Number,
      default: 1,
      min: 1,
      max: 5
    },

    // Configuración para comanda (cocina)
    comandaConfig: {
      enabled: { type: Boolean, default: false },
      printerName: { type: String, default: '' },
      autoPrint: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

// Índices compuestos para multi-tenancy
tiendaSchema.index({ tenantId: 1, nombre: 1 });
// ✅ OPTIMIZACIÓN: Índice para queries de tiendas activas (usado en count)
tiendaSchema.index({ tenantId: 1, activa: 1 });

module.exports = mongoose.models.Tienda || mongoose.model('Tienda', tiendaSchema);