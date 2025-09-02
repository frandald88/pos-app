const express = require('express');
const router = express.Router();
const salesController = require('../../controllers/core/salesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ Obtener todas las ventas con filtros
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      tiendaId, 
      startDate, 
      endDate, 
      status,
      method,
      type,
      page = 1,
      limit = 50
    } = req.query;
    
    const filter = {};
    
    // Obtener información del usuario para verificar rol y tienda
    const currentUser = await User.findById(req.userId).populate('tienda');
    
    // Control de acceso por tienda según rol
    if (currentUser.role !== 'admin') {
      // Usuarios no admin solo ven ventas de su tienda
      if (currentUser.tienda) {
        filter.tienda = currentUser.tienda._id;
      } else {
        // Si el usuario no tiene tienda asignada, no ve ninguna venta
        return res.json({
          sales: [],
          pagination: { total: 0, page: 1, limit: 0, pages: 0 },
          filter: filter
        });
      }
    } else if (tiendaId) {
      // Admin puede filtrar por tienda específica
      filter.tienda = tiendaId;
    }
    // Si es admin y no especifica tiendaId, ve todas las ventas
    
    if (status) {
      const validStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // ✅ MEJORADO: Filtro por método incluyendo pagos mixtos
    if (method) {
      const validMethods = ['efectivo', 'transferencia', 'tarjeta'];
      if (validMethods.includes(method)) {
        filter.$or = [
          { method: method }, // Pagos únicos
          { 
            paymentType: 'mixed',
            'mixedPayments.method': method 
          } // Pagos mixtos que contengan este método
        ];
      }
    }
    
    if (type) {
      const validTypes = ['mostrador', 'recoger', 'domicilio'];
      if (validTypes.includes(type)) {
        filter.type = type;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sales = await Sale.find(filter)
      .populate('tienda', 'nombre')
      .populate('user', 'username')
      .populate('cliente', 'nombre')
      .populate('deliveryPerson', 'username')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // Agregar información de devoluciones para ventas canceladas con totalReturned > 0
    const Return = require('../../modules/devoluciones/model');
    for (let sale of sales) {
      if (sale.status === 'cancelada' && sale.totalReturned > 0) {
        const returnInfo = await Return.findOne({ saleId: sale._id })
          .populate('processedBy', 'username')
          .sort({ date: -1 });
        
        if (returnInfo) {
          sale._doc.returnedBy = returnInfo.processedBy;
          sale._doc.returnedDate = returnInfo.date;
        }
      }
    }
    
    const total = await Sale.countDocuments(filter);
    
    res.json({
      sales,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filter: filter,
      userRole: currentUser.role, // Agregar rol del usuario para el frontend
      userTienda: currentUser.tienda
    });
    
  } catch (err) {
    console.error('Error fetching sales:', err);
    res.status(500).json({ message: 'Error al obtener ventas', error: err.message });
  }
});

// ✅ NUEVO: Obtener tiendas para filtro (solo admin)
router.get('/tiendas', verifyToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);
    
    if (currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden acceder a esta información' });
    }
    
    const tiendas = await Tienda.find({}, 'nombre').sort({ nombre: 1 });
    
    res.json(tiendas);
  } catch (err) {
    console.error('Error fetching tiendas:', err);
    res.status(500).json({ message: 'Error al obtener tiendas', error: err.message });
  }
});

// ✅ MEJORADO: Generar cotización PDF con soporte para pagos mixtos
router.post('/quote', verifyToken, async (req, res) => {
  const { products, clienteId, tienda, discount = 0 } = req.body;

  if (!products || !products.length) {
    return res.status(400).json({ error: 'No hay productos en la cotización' });
  }

  try {
    const tiendaData = await Tienda.findById(tienda).lean();
    const tiendaNombre = tiendaData ? tiendaData.nombre : tienda;
    const clienteData = clienteId ? await Cliente.findById(clienteId).lean() : null;

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=cotizacion.pdf');
    doc.pipe(res);

    // Encabezado
    doc.fontSize(20).text('COTIZACIÓN', { align: 'center', underline: true });
    doc.moveDown();
    const today = new Date();
    doc.fontSize(12).text(`Fecha: ${today.toLocaleDateString('es-MX')} ${today.toLocaleTimeString('es-MX')}`);
    doc.text(`Tienda: ${tiendaNombre}`);
    if (clienteData) doc.text(`Cliente: ${clienteData.nombre} - ${clienteData.telefono}`);
    doc.moveDown();

    // Detalle de productos
    let subtotal = 0;
    doc.fontSize(12).text('Detalle de productos:', { underline: true });
    products.forEach(p => {
      const lineTotal = p.price * p.qty;
      subtotal += lineTotal;
      doc.text(`- ${p.name} x${p.qty} @ $${p.price.toFixed(2)} c/u = $${lineTotal.toFixed(2)}`);
    });

    const total = subtotal - discount;

    doc.moveDown();
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`);
    doc.text(`Descuento: -$${discount.toFixed(2)}`);
    doc.text(`Total: $${total.toFixed(2)}`);
    
    // ✅ NUEVO: Información sobre opciones de pago
    doc.moveDown();
    doc.text('Opciones de pago disponibles:', { underline: true });
    doc.text('• Efectivo');
    doc.text('• Transferencia bancaria');
    doc.text('• Tarjeta de crédito/débito');
    doc.text('• Pagos mixtos (combinación de métodos)');

    doc.end();
  } catch (err) {
    console.error("Error al generar cotización:", err);
    res.status(500).json({ message: "Error al generar cotización", error: err.message });
  }
});

// ✅ MEJORADO: Crear nueva venta con soporte para pagos mixtos
router.post('/', verifyToken, async (req, res) => {
  try {
    const { 
      items, 
      total, 
      discount, 
      method, // Para pagos únicos
      mixedPayments, // Para pagos mixtos
      paymentType = 'single',
      cliente, 
      type, 
      tienda, 
      deliveryPerson 
    } = req.body;
    
    // Validaciones básicas
    if (!tienda) {
      return res.status(400).json({ message: 'La tienda es requerida' });
    }
    
    if (type === 'domicilio' && !deliveryPerson) {
      return res.status(400).json({ message: 'Las ventas a domicilio requieren un repartidor' });
    }
    
    // ✅ NUEVO: Validaciones para pagos mixtos
    if (paymentType === 'mixed') {
      if (!mixedPayments || !Array.isArray(mixedPayments) || mixedPayments.length === 0) {
        return res.status(400).json({ message: 'Los pagos mixtos requieren al menos un método de pago' });
      }
      
      // Validar que la suma de pagos coincida con el total
      const totalPaid = mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const difference = Math.abs(totalPaid - total);
      
      if (difference > 0.01) {
        return res.status(400).json({ 
          message: `Los pagos mixtos (${totalPaid}) no coinciden con el total (${total})`,
          totalPaid,
          total,
          difference
        });
      }
      
      // Validar cada pago
      for (const payment of mixedPayments) {
        if (!['efectivo', 'transferencia', 'tarjeta'].includes(payment.method)) {
          return res.status(400).json({ message: `Método de pago inválido: ${payment.method}` });
        }
        
        if (payment.amount <= 0) {
          return res.status(400).json({ message: 'Los montos de pago deben ser mayores a 0' });
        }
        
        // Para efectivo, validar que el monto recibido sea mayor o igual al monto a pagar
        if (payment.method === 'efectivo' && payment.receivedAmount && payment.receivedAmount < payment.amount) {
          return res.status(400).json({ 
            message: `El monto recibido en efectivo (${payment.receivedAmount}) no puede ser menor al monto a pagar (${payment.amount})`
          });
        }
      }
    } else if (paymentType === 'single') {
      if (!method) {
        return res.status(400).json({ message: 'El método de pago es requerido para pagos únicos' });
      }
    }
    
    // Preparar datos de la venta
    const saleData = {
      items,
      total,
      discount: discount || 0,
      paymentType,
      cliente,
      type,
      tienda,
      deliveryPerson,
      user: req.userId
    };
    
    // Agregar datos específicos según el tipo de pago
    if (paymentType === 'single') {
      saleData.method = method;
    } else {
      saleData.mixedPayments = mixedPayments;
    }
    
    const newSale = new Sale(saleData);
    await newSale.save();
    
    // Actualizar stock de productos
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(
          item.productId, 
          { $inc: { stock: -item.quantity } }
        );
      }
    }
    
    const populatedSale = await Sale.findById(newSale._id)
      .populate('tienda', 'nombre')
      .populate('user', 'username')
      .populate('cliente', 'nombre')
      .populate('deliveryPerson', 'username');
    
    res.status(201).json({ 
      message: 'Venta creada exitosamente', 
      sale: populatedSale,
      id: newSale._id // Para el modal de éxito
    });
    
  } catch (error) {
    console.error('Error al crear venta:', error);
    res.status(400).json({ message: 'Error al crear venta', error: error.message });
  }
});

// ✅ NUEVO: Endpoint para validar pagos mixtos antes de crear la venta
router.post('/validate-mixed-payment', verifyToken, (req, res) => {
  try {
    const { total, mixedPayments } = req.body;
    
    if (!mixedPayments || !Array.isArray(mixedPayments)) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Se requiere un array de pagos mixtos' 
      });
    }
    
    const totalPaid = mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
    const difference = Math.abs(totalPaid - total);
    
    if (difference > 0.01) {
      return res.json({
        valid: false,
        message: `Los pagos no coinciden con el total. Diferencia: $${difference.toFixed(2)}`,
        totalPaid,
        total,
        difference
      });
    }
    
    // Calcular cambio para efectivo
    let totalChange = 0;
    const effectivePayments = mixedPayments.filter(p => p.method === 'efectivo');
    
    for (const payment of effectivePayments) {
      if (payment.receivedAmount && payment.receivedAmount > payment.amount) {
        totalChange += payment.receivedAmount - payment.amount;
      }
    }
    
    res.json({
      valid: true,
      message: 'Pagos válidos',
      totalPaid,
      total,
      totalChange,
      breakdown: mixedPayments.map(p => ({
        method: p.method,
        amount: p.amount,
        change: p.method === 'efectivo' && p.receivedAmount 
          ? Math.max(0, p.receivedAmount - p.amount) 
          : 0
      }))
    });
    
  } catch (error) {
    console.error('Error validating mixed payment:', error);
    res.status(500).json({ 
      valid: false, 
      message: 'Error al validar pagos', 
      error: error.message 
    });
  }
});

// Resto de las rutas existentes...
router.post('/delete-multiple', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ 
        message: 'Debe enviar un array de IDs de ventas a eliminar' 
      });
    }

    const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({ 
        message: 'Algunos IDs no son válidos',
        invalidIds 
      });
    }

    const sales = await Sale.find({ _id: { $in: ids } });

    for (const sale of sales) {
      if (sale.status !== 'cancelada') {
        for (const item of sale.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: item.quantity } }
            );
          }
        }
      }
    }

    const result = await Sale.deleteMany({ _id: { $in: ids } });

    res.json({ 
      message: `${result.deletedCount} ventas eliminadas exitosamente`,
      deletedCount: result.deletedCount,
      requestedCount: ids.length
    });

  } catch (error) {
    console.error('Error al eliminar múltiples ventas:', error);
    res.status(500).json({ 
      message: 'Error al eliminar ventas', 
      error: error.message 
    });
  }
});

router.delete('/no-store', verifyToken, requireAdmin, async (req, res) => {
  try {
    const salesWithoutStore = await Sale.find({ 
      $or: [
        { tienda: { $exists: false } },
        { tienda: null }
      ]
    });

    for (const sale of salesWithoutStore) {
      if (sale.status !== 'cancelada') {
        for (const item of sale.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: item.quantity } }
            );
          }
        }
      }
    }

    const result = await Sale.deleteMany({ 
      $or: [
        { tienda: { $exists: false } },
        { tienda: null }
      ]
    });

    res.json({ 
      message: `${result.deletedCount} ventas sin tienda eliminadas exitosamente`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    console.error('Error al eliminar ventas sin tienda:', error);
    res.status(500).json({ 
      message: 'Error al eliminar ventas sin tienda', 
      error: error.message 
    });
  }
});

router.put('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    const validStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }
    
    const currentSale = await Sale.findById(req.params.id);
    if (!currentSale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    // Prevenir cambios de estado en ventas canceladas por devolución
    if (currentSale.totalReturned > 0 && currentSale.status === 'cancelada') {
      return res.status(400).json({ 
        message: 'No se puede cambiar el estado de una venta cancelada por devolución' 
      });
    }
    
    if (status === 'cancelada' && currentSale.status !== 'cancelada') {
      for (const item of currentSale.items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId, 
            { $inc: { stock: item.quantity } }
          );
        }
      }
    }
    
    const updatedSale = await Sale.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('tienda', 'nombre')
     .populate('user', 'username')
     .populate('cliente', 'nombre')
     .populate('deliveryPerson', 'username');
    
    res.json({ message: 'Estado actualizado', sale: updatedSale });
  } catch (err) {
    console.error('Error updating sale status:', err);
    res.status(400).json({ message: 'Error al actualizar estado', error: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate('tienda', 'nombre')
      .populate('user', 'username')
      .populate('cliente', 'nombre')
      .populate('deliveryPerson', 'username');
    
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }
    
    res.json(sale);
  } catch (error) {
    console.error('Error fetching sale by ID:', error);
    res.status(500).json({ message: 'Error al obtener venta', error: error.message });
  }
});

// ✅ NUEVO: Endpoint para obtener ventas con desglose de pagos mixtos
router.get('/detailed', verifyToken, async (req, res) => {
  try {
    const { 
      tiendaId, 
      startDate, 
      endDate, 
      status,
      method,
      type,
      page = 1,
      limit = 50
    } = req.query;
    
    const filter = {};
    
    if (status) {
      const validStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }
    }
    
    if (tiendaId) {
      filter.tienda = tiendaId;
    }
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (method) {
      const validMethods = ['efectivo', 'transferencia', 'tarjeta'];
      if (validMethods.includes(method)) {
        filter.$or = [
          { method: method },
          { 
            paymentType: 'mixed',
            'mixedPayments.method': method 
          }
        ];
      }
    }
    
    if (type) {
      const validTypes = ['mostrador', 'recoger', 'domicilio'];
      if (validTypes.includes(type)) {
        filter.type = type;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const sales = await Sale.find(filter)
      .populate('tienda', 'nombre')
      .populate('user', 'username')
      .populate('cliente', 'nombre')
      .populate('deliveryPerson', 'username')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // ✅ NUEVO: Procesar ventas para desglosar pagos mixtos
    const processedSales = [];
    
    sales.forEach(sale => {
      if (sale.paymentType === 'mixed' && sale.mixedPayments && sale.mixedPayments.length > 0) {
        // Para pagos mixtos, crear una entrada por cada método de pago
        sale.mixedPayments.forEach(payment => {
          processedSales.push({
            ...sale.toObject(),
            _id: `${sale._id}_${payment.method}`,
            originalSaleId: sale._id,
            method: payment.method,
            total: payment.amount,
            paymentType: 'mixed_breakdown',
            mixedPaymentInfo: {
              totalMixedPayments: sale.mixedPayments.length,
              originalTotal: sale.total,
              paymentReference: payment.reference || null,
              receivedAmount: payment.receivedAmount || null
            }
          });
        });
      } else {
        // Para pagos únicos, mantener como está
        processedSales.push({
          ...sale.toObject(),
          paymentType: 'single'
        });
      }
    });
    
    const total = await Sale.countDocuments(filter);
    
    res.json({
      sales: processedSales,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      filter: filter
    });
    
  } catch (err) {
    console.error('Error fetching detailed sales:', err);
    res.status(500).json({ message: 'Error al obtener ventas detalladas', error: err.message });
  }
});

// ✅ NUEVO: Endpoint para estadísticas de pagos mixtos
router.get('/mixed-payment-stats', verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, tiendaId } = req.query;
    
    const filter = {};
    
    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (tiendaId) {
      filter.tienda = new mongoose.Types.ObjectId(tiendaId);
    }
    
    // Obtener todas las ventas con pagos mixtos
    const mixedPaymentSales = await Sale.find({
      ...filter,
      paymentType: 'mixed'
    }).populate('tienda', 'nombre');
    
    // Procesar estadísticas
    const stats = {
      totalMixedSales: mixedPaymentSales.length,
      totalMixedAmount: 0,
      methodBreakdown: {
        efectivo: { amount: 0, count: 0 },
        transferencia: { amount: 0, count: 0 },
        tarjeta: { amount: 0, count: 0 }
      },
      averageMethodsPerSale: 0,
      topCombinations: {}
    };
    
    let totalMethods = 0;
    
    mixedPaymentSales.forEach(sale => {
      stats.totalMixedAmount += sale.total;
      
      // Crear clave de combinación ordenada
      const combination = sale.mixedPayments
        .map(p => p.method)
        .sort()
        .join('+');
      
      stats.topCombinations[combination] = (stats.topCombinations[combination] || 0) + 1;
      totalMethods += sale.mixedPayments.length;
      
      // Desglosar por método
      sale.mixedPayments.forEach(payment => {
        if (stats.methodBreakdown[payment.method]) {
          stats.methodBreakdown[payment.method].amount += payment.amount;
          stats.methodBreakdown[payment.method].count += 1;
        }
      });
    });
    
    stats.averageMethodsPerSale = mixedPaymentSales.length > 0 
      ? (totalMethods / mixedPaymentSales.length).toFixed(2)
      : 0;
    
    // Convertir topCombinations a array ordenado
    stats.topCombinations = Object.entries(stats.topCombinations)
      .map(([combination, count]) => ({ combination, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    res.json(stats);
    
  } catch (err) {
    console.error('Error fetching mixed payment stats:', err);
    res.status(500).json({ message: 'Error al obtener estadísticas de pagos mixtos', error: err.message });
  }
});

module.exports = router;