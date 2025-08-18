const Sale = require('../../core/sales/model');
const Product = require('../../core/products/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');
const PDFDocument = require('pdfkit');

class SalesController {

  // Crear nueva venta
  async create(req, res) {
    try {
      const { products, method, saleType, deliveryPerson, discount, clienteId, tienda } = req.body;

      console.log("Body recibido:", req.body);

      // Validaciones básicas
      if (!products || !products.length) {
        return errorResponse(res, 'Productos no válidos', 400);
      }

      if (!['efectivo', 'transferencia', 'tarjeta'].includes(method)) {
        return errorResponse(res, 'Método de pago inválido', 400);
      }

      if (!['mostrador', 'recoger', 'domicilio'].includes(saleType)) {
        return errorResponse(res, 'Tipo de venta inválido', 400);
      }

      if (saleType === 'domicilio' && !deliveryPerson) {
        return errorResponse(res, 'Debe asignar un repartidor para domicilio', 400);
      }

      if (!tienda) {
        return errorResponse(res, 'La tienda es requerida', 400);
      }

      // Procesar items de la venta
      const items = products.map(p => {
        const isValidObjectId = mongoose.Types.ObjectId.isValid(p._id);
        return {
          productId: isValidObjectId ? p._id : null,
          quantity: parseInt(p.qty),
          price: parseFloat(p.price),
          name: p.name,
          sku: p.sku || "",
          note: p.note || ""
        };
      });

      // Calcular totales
      const totalBruto = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      const descuento = parseFloat(discount) || 0;
      const total = totalBruto - descuento;

      if (total < 0) {
        return errorResponse(res, 'El total no puede ser negativo', 400);
      }

      // Verificar stock disponible
      for (const item of items) {
        if (item.productId) {
          const product = await Product.findById(item.productId);
          if (product && product.stock < item.quantity) {
            return errorResponse(res, `Stock insuficiente para ${product.name}. Disponible: ${product.stock}`, 400);
          }
        }
      }

      // Crear la venta
      const sale = new Sale({
        items,
        total,
        method,
        type: saleType,
        user: req.userId,
        cliente: clienteId || null,
        tienda,
        deliveryPerson: saleType === 'domicilio' ? deliveryPerson : null,
        discount: descuento,
        status: 'en_preparacion'
      });

      await sale.save();

      // Actualizar stock
      for (const item of items) {
        if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId, 
            { $inc: { stock: -item.quantity } }
          );
        }
      }

      // Obtener venta creada con datos poblados
      const createdSale = await Sale.findById(sale._id)
        .populate('cliente', 'nombre telefono')
        .populate('tienda', 'nombre')
        .populate('user', 'username')
        .populate('deliveryPerson', 'username');

      return successResponse(res, createdSale, 'Venta registrada exitosamente', 201);

    } catch (error) {
      console.error('Error al registrar venta:', error);
      return errorResponse(res, 'Error al registrar venta', 500);
    }
  }

  // Obtener todas las ventas
  async getAll(req, res) {
    try {
      const { 
        status, 
        tiendaId, 
        startDate, 
        endDate, 
        method,
        type,
        userId,
        limit = 50, 
        page = 1 
      } = req.query;

      // Construir filtros
      const filter = {};

      if (status) {
        filter.status = status;
      }

      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate + 'T00:00:00.000Z');
        if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
      }

      if (method && ['efectivo', 'transferencia', 'tarjeta'].includes(method)) {
        filter.method = method;
      }

      if (type && ['mostrador', 'recoger', 'domicilio'].includes(type)) {
        filter.type = type;
      }

      if (userId && mongoose.Types.ObjectId.isValid(userId)) {
        filter.user = userId;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const sales = await Sale.find(filter)
        .populate('cliente', 'nombre telefono')
        .populate('tienda', 'nombre')
        .populate('user', 'username')
        .populate('deliveryPerson', 'username')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Sale.countDocuments(filter);

      // Estadísticas
      const stats = await Sale.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: '$total' },
            avgAmount: { $avg: '$total' },
            byMethod: {
              $push: { method: '$method', amount: '$total' }
            },
            byStatus: {
              $push: { status: '$status', amount: '$total' }
            }
          }
        }
      ]);

      return successResponse(res, {
        sales,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        stats: stats[0] || {
          totalSales: 0,
          totalAmount: 0,
          avgAmount: 0,
          byMethod: [],
          byStatus: []
        }
      }, 'Ventas obtenidas exitosamente');

    } catch (error) {
      console.error('Error al obtener ventas:', error);
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

  // Generar cotización PDF
  async generateQuote(req, res) {
    try {
      const { products, clienteId, tienda, discount = 0 } = req.body;

      // Validación: No permitir cotización sin productos
      if (!products || !products.length) {
        return errorResponse(res, 'No hay productos en la cotización', 400);
      }

      const Tienda = require('../../core/tiendas/model');
      const Cliente = require('../../models/Cliente'); // Esto debería moverse a modules cuando esté listo

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

      // Lista de productos
      let subtotal = 0;
      doc.fontSize(12).text('Detalle de productos:', { underline: true });
      products.forEach(p => {
        const lineTotal = p.price * p.qty;
        subtotal += lineTotal;
        doc.text(`- ${p.name} x${p.qty} @ $${p.price.toFixed(2)} c/u = $${lineTotal.toFixed(2)}`);
      });

      const discountAmount = subtotal * (discount / 100);
      const subtotalWithDiscount = subtotal - discountAmount;
      const baseSubtotal = subtotalWithDiscount / 1.1;  // IVA asumido 10%
      const tax = subtotalWithDiscount - baseSubtotal;
      const totalWithTax = subtotalWithDiscount;

      doc.moveDown();
      doc.fontSize(12).text('--- Totales ---', { bold: true });
      doc.text(`Subtotal sin descuento: $${subtotal.toFixed(2)}`);
      doc.text(`Descuento: -$${discountAmount.toFixed(2)} (${discount}%)`);
      doc.text(`Subtotal sin IVA: $${baseSubtotal.toFixed(2)}`);
      doc.text(`IVA incluido: $${tax.toFixed(2)}`);
      doc.fontSize(14).text(`Total: $${totalWithTax.toFixed(2)}`, { bold: true });

      doc.end();

    } catch (error) {
      console.error('Error generando cotización:', error);
      return errorResponse(res, 'Error al generar cotización', 500);
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