const express = require('express');
const cors = require('cors');
const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

const app = express();
const PORT = process.env.PORT || 9100;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Mapeo de tipos de impresora
const PRINTER_TYPE_MAP = {
  'EPSON': PrinterTypes.EPSON,
  'STAR': PrinterTypes.STAR,
  'TANCA': PrinterTypes.TANCA,
  'DARUMA': PrinterTypes.DARUMA,
  'BEMATECH': PrinterTypes.BEMATECH
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Print Server is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Endpoint para imprimir ticket
app.post('/print/ticket', async (req, res) => {
  try {
    const { sale, config, ticketConfig } = req.body;

    console.log('📄 Solicitud de impresión de ticket recibida');
    console.log('🔧 Config:', config);

    // Validar que se recibió la venta
    if (!sale) {
      return res.status(400).json({ error: 'Sale data is required' });
    }

    // Crear instancia de la impresora
    const printer = await createPrinter(config);

    // Generar contenido del ticket
    await generateTicketContent(printer, sale, ticketConfig || {});

    // Ejecutar impresión
    await executePrint(printer);

    console.log('✅ Ticket impreso exitosamente');

    res.json({
      success: true,
      message: 'Ticket printed successfully'
    });
  } catch (error) {
    console.error('❌ Error imprimiendo ticket:', error);
    res.status(500).json({
      error: 'Failed to print ticket',
      details: error.message
    });
  }
});

// Endpoint para imprimir comanda
app.post('/print/comanda', async (req, res) => {
  try {
    const { sale, config } = req.body;

    console.log('🍽️ Solicitud de impresión de comanda recibida');

    if (!sale) {
      return res.status(400).json({ error: 'Sale data is required' });
    }

    // Determinar qué impresora usar
    const printerConfig = {
      ...config,
      printerName: config.comandaConfig?.printerName || config.printerName
    };

    const printer = await createPrinter(printerConfig);

    // Generar contenido de la comanda
    await generateComandaContent(printer, sale);

    // Ejecutar impresión
    await executePrint(printer);

    console.log('✅ Comanda impresa exitosamente');

    res.json({
      success: true,
      message: 'Comanda printed successfully'
    });
  } catch (error) {
    console.error('❌ Error imprimiendo comanda:', error);
    res.status(500).json({
      error: 'Failed to print comanda',
      details: error.message
    });
  }
});

// Función auxiliar para crear instancia de impresora
async function createPrinter(config) {
  const printerType = PRINTER_TYPE_MAP[config.printerType] || PrinterTypes.EPSON;

  let printerConfig = {
    type: printerType,
    characterSet: 'SLOVENIA',
    removeSpecialCharacters: false,
    lineCharacter: '-',
    options: {
      timeout: 10000
    }
  };

  // Configurar según tipo de conexión
  if (config.connectionType === 'NETWORK' && config.printerIP) {
    printerConfig.interface = `tcp://${config.printerIP}:${config.printerPort || 9100}`;
  } else if (config.printerName) {
    printerConfig.interface = `printer:${config.printerName}`;
  } else {
    // Intentar usar impresora por defecto del sistema
    printerConfig.interface = 'printer';
  }

  const printer = new ThermalPrinter(printerConfig);

  return printer;
}

// Función para generar contenido del ticket
async function generateTicketContent(printer, sale, ticketConfig) {
  const camposMostrar = ticketConfig.camposMostrar || {
    folio: true,
    fecha: true,
    hora: true,
    cajero: true,
    cliente: true,
    metodoPago: true,
    subtotal: true,
    descuento: true,
    iva: false,
    propina: false,
    cambio: true
  };

  // Encabezado
  printer.alignCenter();

  // Logo (si está configurado y es base64)
  if (ticketConfig.mostrarLogo && ticketConfig.logo && ticketConfig.logo.startsWith('data:image')) {
    try {
      await printer.printImage(ticketConfig.logo);
    } catch (error) {
      console.warn('No se pudo imprimir el logo:', error.message);
    }
  }

  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(ticketConfig.nombreNegocio || sale.tienda?.nombre || 'RESTAURANTE');
  printer.bold(false);
  printer.setTextNormal();

  printer.println(sale.tienda?.direccion || 'Dirección del negocio');
  printer.println(`Tel: ${sale.tienda?.telefono || '(XXX) XXX-XXXX'}`);

  if (ticketConfig.mostrarRFC && ticketConfig.rfc) {
    printer.println(`RFC: ${ticketConfig.rfc}`);
  }

  if (ticketConfig.mensajeSuperior) {
    printer.newLine();
    printer.println(ticketConfig.mensajeSuperior);
  }

  printer.drawLine();

  // Información de venta
  printer.alignLeft();

  if (camposMostrar.folio) {
    printer.println(`Folio: ${sale.folio || sale._id?.substring(0, 8).toUpperCase()}`);
  }

  if (camposMostrar.fecha) {
    const fecha = new Date(sale.fecha || new Date()).toLocaleDateString('es-MX');
    printer.println(`Fecha: ${fecha}`);
  }

  if (camposMostrar.hora) {
    const hora = new Date(sale.fecha || new Date()).toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit'
    });
    printer.println(`Hora: ${hora}`);
  }

  if (camposMostrar.cajero) {
    printer.println(`Cajero: ${sale.usuario?.username || sale.usuario?.nombre || 'N/A'}`);
  }

  if (camposMostrar.cliente && sale.cliente) {
    printer.println(`Cliente: ${sale.cliente.nombre || ''}`);

    // Mostrar dirección solo para ventas a domicilio
    if ((sale.type === 'domicilio' || sale.tipo === 'domicilio') && sale.cliente.direccion) {
      printer.println(`Direccion: ${sale.cliente.direccion}`);
    }
  }

  printer.drawLine();

  // Productos
  printer.tableCustom([
    { text: 'CANT', align: 'LEFT', width: 0.15 },
    { text: 'DESCRIPCION', align: 'LEFT', width: 0.50 },
    { text: 'PRECIO', align: 'RIGHT', width: 0.15 },
    { text: 'TOTAL', align: 'RIGHT', width: 0.20 }
  ]);

  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      const nombre = item.producto?.nombre || item.nombre;
      const precio = formatMoney(item.precio);
      const total = formatMoney(item.cantidad * item.precio);

      printer.tableCustom([
        { text: item.cantidad.toString(), align: 'LEFT', width: 0.15 },
        { text: nombre, align: 'LEFT', width: 0.50 },
        { text: precio, align: 'RIGHT', width: 0.15 },
        { text: total, align: 'RIGHT', width: 0.20 }
      ]);

      // Notas del producto
      if (item.notas) {
        printer.println(`  Nota: ${item.notas}`);
      }
    }
  }

  printer.drawLine();

  // Totales
  if (camposMostrar.subtotal) {
    printer.leftRight('Subtotal:', formatMoney(sale.subtotal || sale.total));
  }

  if (camposMostrar.descuento && sale.descuento > 0) {
    printer.leftRight('Descuento:', `-${formatMoney(sale.descuento)}`);
  }

  if (camposMostrar.iva && sale.iva > 0) {
    printer.leftRight('IVA:', formatMoney(sale.iva));
  }

  if (camposMostrar.propina && sale.propina > 0) {
    printer.leftRight('Propina:', formatMoney(sale.propina));
  }

  printer.newLine();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.leftRight('TOTAL:', formatMoney(sale.total));
  printer.bold(false);
  printer.setTextNormal();

  // Método de pago
  if (camposMostrar.metodoPago) {
    printer.newLine();
    printer.println(`Metodo de pago: ${sale.metodoPago || 'Efectivo'}`);

    if (camposMostrar.cambio && sale.pagoCon && sale.metodoPago === 'Efectivo') {
      printer.println(`Pago con: ${formatMoney(sale.pagoCon)}`);
      printer.println(`Cambio: ${formatMoney(sale.pagoCon - sale.total)}`);
    }
  }

  printer.drawLine();

  // Footer
  printer.alignCenter();

  if (ticketConfig.mensajeInferior) {
    printer.println(ticketConfig.mensajeInferior);
  } else {
    printer.println('GRACIAS POR SU COMPRA!');
    printer.println('Vuelva pronto');
  }

  printer.newLine();
  printer.setTextSize(0, 0);
  printer.println(ticketConfig.leyendaFiscal || 'Este ticket no es valido como factura');

  printer.newLine();
  printer.newLine();
  printer.newLine();

  // Abrir cajón si está configurado
  if (ticketConfig.autoOpenCashDrawer) {
    printer.openCashDrawer();
  }

  // Cortar papel
  printer.cut();
}

// Función para generar contenido de la comanda
async function generateComandaContent(printer, sale) {
  // Encabezado
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(2, 2);
  printer.println('COMANDA');
  printer.bold(false);
  printer.setTextSize(1, 1);
  printer.println(sale.tienda?.nombre || 'COCINA');
  printer.setTextNormal();

  printer.drawLine();

  // Información principal
  printer.alignCenter();
  printer.println('ORDEN #');
  printer.bold(true);
  printer.setTextSize(2, 2);
  printer.println(sale.folio || sale._id?.substring(0, 8).toUpperCase());
  printer.bold(false);
  printer.setTextNormal();

  printer.newLine();

  // Tipo de venta
  const tipoVenta = getTipoVentaNombre(sale.tipo);
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println(`*** ${tipoVenta} ***`);
  printer.bold(false);
  printer.setTextNormal();

  printer.newLine();

  // Fecha y hora
  const fecha = new Date(sale.fecha || new Date()).toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  printer.println(fecha);

  // Cliente
  if (sale.cliente) {
    printer.println(`Cliente: ${sale.cliente.nombre || sale.cliente}`);
  }

  // Usuario
  printer.setTextSize(0, 0);
  printer.println(`Por: ${sale.usuario?.nombre || sale.usuario?.username || 'N/A'}`);
  printer.setTextNormal();

  printer.drawLine();

  // Productos
  printer.alignCenter();
  printer.bold(true);
  printer.setTextSize(1, 1);
  printer.println('PRODUCTOS A PREPARAR');
  printer.bold(false);
  printer.setTextNormal();

  printer.newLine();

  if (sale.items && sale.items.length > 0) {
    for (const item of sale.items) {
      printer.alignLeft();

      // Cantidad y nombre
      printer.bold(true);
      printer.setTextSize(1, 1);
      printer.println(`${item.cantidad}x ${item.producto?.nombre || item.nombre}`);
      printer.bold(false);
      printer.setTextNormal();

      // Notas especiales
      if (item.notas) {
        printer.println(`  *** NOTA: ${item.notas}`);
      }

      printer.newLine();
    }
  }

  printer.drawLine();

  // Resumen
  printer.alignCenter();
  const totalProductos = sale.items?.reduce((sum, item) => sum + item.cantidad, 0) || 0;
  const totalArticulos = sale.items?.length || 0;

  printer.println(`Total productos: ${totalProductos}`);
  printer.println(`Articulos diferentes: ${totalArticulos}`);

  printer.newLine();
  printer.bold(true);
  printer.println('PREPARAR CON CUIDADO!');
  printer.bold(false);

  printer.newLine();
  printer.setTextSize(0, 0);
  printer.println(`Impreso: ${new Date().toLocaleTimeString('es-MX')}`);

  printer.newLine();
  printer.newLine();
  printer.newLine();

  // Cortar papel
  printer.cut();
}

// Función para ejecutar la impresión
async function executePrint(printer) {
  try {
    const isConnected = await printer.isPrinterConnected();

    if (!isConnected) {
      throw new Error('Printer is not connected or not available');
    }

    await printer.execute();

    return true;
  } catch (error) {
    console.error('Error executing print:', error);
    throw error;
  }
}

// Función auxiliar para formatear dinero
function formatMoney(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

// Función auxiliar para obtener nombre del tipo de venta
function getTipoVentaNombre(tipo) {
  const tipos = {
    'mostrador': 'MOSTRADOR',
    'domicilio': 'DOMICILIO',
    'recoger': 'A RECOGER'
  };
  return tipos[tipo] || tipo?.toUpperCase() || 'MOSTRADOR';
}

// Endpoint de información
app.get('/', (req, res) => {
  res.json({
    name: 'Astrodish Print Server',
    version: '1.0.0',
    description: 'Servidor local para impresión directa en impresoras térmicas',
    endpoints: {
      '/health': 'GET - Health check',
      '/print/ticket': 'POST - Imprimir ticket de venta',
      '/print/comanda': 'POST - Imprimir comanda de cocina'
    }
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('==============================================');
  console.log('   ASTRODISH PRINT SERVER');
  console.log('==============================================');
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Tiempo: ${new Date().toLocaleString('es-MX')}`);
  console.log('==============================================');
  console.log('');
  console.log('El servidor de impresión está listo.');
  console.log('Esperando solicitudes de impresión...');
  console.log('');
});
