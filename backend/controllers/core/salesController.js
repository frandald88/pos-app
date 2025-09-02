const Sale = require('../../core/sales/model');
const Product = require('../../core/products/model');
const Cliente = require('../../modules/clientes/model');
const Tienda = require('../../core/tiendas/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

class SalesController {

  // Crear nueva venta con soporte para pagos mixtos
  async create(req, res) {
    try {
      console.log('📦 Received sale data:', JSON.stringify(req.body, null, 2));
      
      const { 
        items, 
        total, 
        discount, 
        method,
        mixedPayments,
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
      
      // Validaciones para pagos mixtos
      if (paymentType === 'mixed') {
        if (!mixedPayments || !Array.isArray(mixedPayments) || mixedPayments.length === 0) {
          return res.status(400).json({ message: 'Los pagos mixtos requieren al menos un método de pago' });
        }
        
        // Validar que la suma de pagos coincida con el total
        const totalPaid = mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
        const difference = Math.abs(totalPaid - total);
        
        if (difference > 0.01) {
          return res.status(400).json({ message: `Los pagos mixtos (${totalPaid}) no coinciden con el total (${total})` });
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
            return res.status(400).json({ message: `El monto recibido en efectivo (${payment.receivedAmount}) no puede ser menor al monto a pagar (${payment.amount})` });
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
        user: req.userId
      };

      // Solo agregar deliveryPerson si es venta a domicilio y hay un repartidor
      if (type === 'domicilio' && deliveryPerson) {
        saleData.deliveryPerson = deliveryPerson;
      }
      
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
        id: newSale._id
      });
      
    } catch (error) {
      console.error('Error al crear venta:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: 'Error al crear venta', 
        error: error.message 
      });
    }
  }

  // Obtener todas las ventas con filtros y soporte para pagos mixtos
  async getAll(req, res) {
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
          return successResponse(res, {
            sales: [],
            pagination: { total: 0, page: 1, limit: 0, pages: 0 },
            filter: filter,
            userRole: currentUser.role,
            userTienda: currentUser.tienda
          }, 'Ventas obtenidas exitosamente');
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
      
      // Filtro por método incluyendo pagos mixtos
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
      
      return successResponse(res, {
        sales,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        filter: filter,
        userRole: currentUser.role,
        userTienda: currentUser.tienda
      }, 'Ventas obtenidas exitosamente');
      
    } catch (err) {
      console.error('Error fetching sales:', err);
      return errorResponse(res, 'Error al obtener ventas', 500);
    }
  }

  // Obtener venta por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de venta inválido', 400);
      }

      const sale = await Sale.findById(id)
        .populate('cliente', 'nombre telefono direccion')
        .populate('tienda', 'nombre direccion telefono')
        .populate('user', 'username')
        .populate('deliveryPerson', 'username telefono');

      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      return successResponse(res, sale, 'Venta obtenida exitosamente');

    } catch (error) {
      console.error('Error buscando venta por ID:', error);
      return errorResponse(res, 'Error al obtener venta', 500);
    }
  }

  // Actualizar estado de la venta
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowedStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'cancelada'];

      if (!allowedStatuses.includes(status)) {
        return errorResponse(res, 'Estado no válido', 400);
      }

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de venta inválido', 400);
      }

      const sale = await Sale.findById(id);
      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      // Validación: Solo permitir cancelar si está en preparación o listo para envío
      if (status === 'cancelada') {
        if (sale.status !== 'en_preparacion' && sale.status !== 'listo_para_envio') {
          return errorResponse(res, 'Solo puedes cancelar pedidos en preparación o listos para envío', 400);
        }

        // Devolver stock solo si la venta tiene productos con productId válido
        for (const item of sale.items) {
          if (item.productId) {
            await Product.findByIdAndUpdate(
              item.productId, 
              { $inc: { stock: item.quantity } }
            );
          }
        }
      }

      // Actualizar el estado
      sale.status = status;
      await sale.save();

      const updatedSale = await Sale.findById(id)
        .populate('cliente', 'nombre telefono')
        .populate('tienda', 'nombre')
        .populate('user', 'username')
        .populate('deliveryPerson', 'username');

      return successResponse(res, updatedSale, 'Estado actualizado exitosamente');

    } catch (error) {
      console.error('Error al actualizar estado:', error);
      return errorResponse(res, 'Error al actualizar estado', 500);
    }
  }

  // Eliminar ventas sin tienda
  async deleteNoStore(req, res) {
    try {
      const result = await Sale.deleteMany({ tienda: { $exists: false } });
      
      return successResponse(res, { 
        deletedCount: result.deletedCount 
      }, `Ventas eliminadas: ${result.deletedCount}`);

    } catch (error) {
      console.error('Error al eliminar ventas sin tienda:', error);
      return errorResponse(res, 'Error al eliminar ventas sin tienda', 500);
    }
  }

  // Eliminar múltiples ventas
  async deleteMultiple(req, res) {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return errorResponse(res, 'Debe enviar un array de IDs de ventas a eliminar', 400);
      }

      // Validar que todos los IDs sean válidos
      const invalidIds = ids.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        return errorResponse(res, 'Algunos IDs no son válidos', 400);
      }

      // Obtener las ventas antes de eliminarlas para devolver stock si es necesario
      const sales = await Sale.find({ _id: { $in: ids } });

      // Devolver stock de productos
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

      return successResponse(res, { 
        deletedCount: result.deletedCount 
      }, `Ventas eliminadas: ${result.deletedCount}`);

    } catch (error) {
      console.error('Error al eliminar múltiples ventas:', error);
      return errorResponse(res, 'Error al eliminar ventas', 500);
    }
  }

  // Generar cotización PDF con soporte para pagos mixtos
  async generateQuote(req, res) {
    try {
      const { products, clienteId, tienda, discount = 0 } = req.body;

      if (!products || !products.length) {
        return errorResponse(res, 'No hay productos en la cotización', 400);
      }

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
      
      // Información sobre opciones de pago
      doc.moveDown();
      doc.text('Opciones de pago disponibles:', { underline: true });
      doc.text('• Efectivo');
      doc.text('• Transferencia bancaria');
      doc.text('• Tarjeta de crédito/débito');
      doc.text('• Pagos mixtos (combinación de métodos)');

      doc.end();
    } catch (err) {
      console.error("Error al generar cotización:", err);
      return errorResponse(res, "Error al generar cotización", 500);
    }
  }

  // Obtener tiendas para filtro (solo admin)
  async getTiendas(req, res) {
    try {
      const currentUser = await User.findById(req.userId);
      
      if (currentUser.role !== 'admin') {
        return errorResponse(res, 'Solo administradores pueden acceder a esta información', 403);
      }
      
      const tiendas = await Tienda.find({}, 'nombre').sort({ nombre: 1 });
      
      return successResponse(res, tiendas, 'Tiendas obtenidas exitosamente');
    } catch (err) {
      console.error('Error fetching tiendas:', err);
      return errorResponse(res, 'Error al obtener tiendas', 500);
    }
  }

  // Validar pagos mixtos antes de crear la venta
  async validateMixedPayment(req, res) {
    try {
      const { total, mixedPayments } = req.body;
      
      if (!mixedPayments || !Array.isArray(mixedPayments)) {
        return errorResponse(res, 'Se requiere un array de pagos mixtos', 400);
      }
      
      const totalPaid = mixedPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const difference = Math.abs(totalPaid - total);
      
      if (difference > 0.01) {
        return successResponse(res, {
          valid: false,
          message: `Los pagos no coinciden con el total. Diferencia: $${difference.toFixed(2)}`,
          totalPaid,
          total,
          difference
        }, 'Validación de pagos mixtos');
      }
      
      // Calcular cambio para efectivo
      let totalChange = 0;
      const effectivePayments = mixedPayments.filter(p => p.method === 'efectivo');
      
      for (const payment of effectivePayments) {
        if (payment.receivedAmount && payment.receivedAmount > payment.amount) {
          totalChange += payment.receivedAmount - payment.amount;
        }
      }
      
      return successResponse(res, {
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
      }, 'Validación de pagos mixtos');
      
    } catch (error) {
      console.error('Error validating mixed payment:', error);
      return errorResponse(res, 'Error al validar pagos', 500);
    }
  }

  // Obtener estadísticas de pagos mixtos
  async getMixedPaymentStats(req, res) {
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
      
      return successResponse(res, stats, 'Estadísticas de pagos mixtos obtenidas exitosamente');
      
    } catch (err) {
      console.error('Error fetching mixed payment stats:', err);
      return errorResponse(res, 'Error al obtener estadísticas de pagos mixtos', 500);
    }
  }

  // Obtener ventas por rango de fechas
  async getByDateRange(req, res) {
    try {
      const { startDate, endDate, tiendaId } = req.query;

      if (!startDate || !endDate) {
        return errorResponse(res, 'Fechas de inicio y fin son requeridas', 400);
      }

      const filter = {
        date: {
          $gte: new Date(startDate + 'T00:00:00.000Z'),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };

      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const sales = await Sale.find(filter)
        .populate('cliente', 'nombre telefono')
        .populate('tienda', 'nombre')
        .populate('user', 'username')
        .sort({ date: -1 });

      const summary = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            avgAmount: { $avg: '$total' },
            totalDiscount: { $sum: '$discount' }
          }
        }
      ]);

      return successResponse(res, {
        sales,
        summary: summary[0] || {
          totalSales: 0,
          totalAmount: 0,
          avgAmount: 0,
          totalDiscount: 0
        }
      }, 'Ventas por rango de fechas obtenidas exitosamente');

    } catch (error) {
      console.error('Error obteniendo ventas por fecha:', error);
      return errorResponse(res, 'Error al obtener ventas por fecha', 500);
    }
  }
}

module.exports = new SalesController();