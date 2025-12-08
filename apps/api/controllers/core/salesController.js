const Sale = require('../../core/sales/model');
const Product = require('../../core/products/model');
const Cliente = require('../../modules/clientes/model');
const Tienda = require('../../modules/tiendas/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const { getNextSequence } = require('../../shared/utils/counterHelper');
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

      // REMOVIDO: Ya no es obligatorio asignar repartidor en ventas a domicilio
      // El repartidor se asigna después según disponibilidad
      // if (type === 'domicilio' && !deliveryPerson) {
      //   return res.status(400).json({ message: 'Las ventas a domicilio requieren un repartidor' });
      // }

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
      
      // Generar folio consecutivo
      const folio = await getNextSequence('sale');

      // Obtener información del tenant para determinar el estado inicial
      const Tenant = require('../../core/tenants/model');
      const tenant = await Tenant.findById(req.tenantId).select('businessType');

      // ✨ Determinar estado inicial según el tipo de negocio
      let initialStatus = 'en_preparacion'; // Default para dark_kitchen y restaurant
      if (tenant?.businessType === 'supermarket') {
        // Para supermercados, la venta se completa inmediatamente
        initialStatus = 'entregado_y_cobrado';
      }

      // Preparar datos de la venta
      const saleData = {
        folio,
        items,
        total,
        discount: discount || 0,
        paymentType,
        cliente,
        type,
        tienda,
        user: req.userId,
        turno: req.turnoActivo ? req.turnoActivo._id : null, // Asociar venta con turno activo
        tenantId: req.tenantId, // ✅ Agregar tenantId
        status: initialStatus // ✨ Estado inicial según tipo de negocio
      };

      // Solo agregar deliveryPerson si es venta a domicilio y hay un repartidor válido
      // Validar que deliveryPerson no sea string vacío ni null
      if (type === 'domicilio' && deliveryPerson && deliveryPerson.trim() !== '') {
        saleData.deliveryPerson = deliveryPerson;
      } else {
        saleData.deliveryPerson = null; // Explícitamente null si no hay repartidor
      }

      // Agregar datos específicos según el tipo de pago
      if (paymentType === 'single') {
        saleData.method = method;
      } else {
        saleData.mixedPayments = mixedPayments;
      }

      const newSale = new Sale(saleData);

      // 📦 REDUCCIÓN DE STOCK: Solo para supermercados
      // Restaurants y dark kitchens preparan items al momento (hamburguesas, etc.)
      // Supermercados venden productos pre-hechos que deben restarse del inventario
      const stockUpdates = [];

      if (tenant?.businessType === 'supermarket') {
        items
          .filter(item => item.productId)
          .forEach(item => {
            stockUpdates.push(
              Product.findOneAndUpdate(
                { _id: item.productId, tenantId: req.tenantId },
                { $inc: { stock: -item.quantity } },
                { new: false }
              )
            );
          });
      }

      // Ejecutar guardado de venta y actualizaciones de stock en paralelo
      await Promise.all([
        newSale.save(),
        ...stockUpdates
      ]);

      // ⚡ OPTIMIZACIÓN: Solo popular lo absolutamente necesario
      // El frontend no necesita todos estos datos en la respuesta inmediata
      const populatedSale = await Sale.findById(newSale._id)
        .populate('tienda', 'nombre ticketConfig')
        .populate('user', 'username')
        .lean(); // Usar lean() para mejor rendimiento
      
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
        search,
        page = 1,
        limit = 50
      } = req.query;
      
      const filter = {
        tenantId: req.tenantId // ✅ Siempre filtrar por tenant
      };

      // Obtener información del usuario para verificar rol y tienda
      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId }).populate('tienda');
      
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
      
      // Filtro de búsqueda - buscar en múltiples campos
      if (search && search.trim() !== '') {
        console.log('🔍 Applying search filter:', search);
        const searchTerm = search.trim();
        
        try {
          const searchRegex = new RegExp(searchTerm, 'i'); // Case insensitive
          
          filter.$or = [
            { 'items.name': { $regex: searchRegex } }, // Buscar en nombres de productos
            { 'cliente.nombre': { $regex: searchRegex } } // Buscar en nombre de cliente
          ];
          
          // Si es ObjectId válido (24 caracteres hex), buscar exacto por ID
          if (mongoose.Types.ObjectId.isValid(searchTerm) && searchTerm.length === 24) {
            console.log('🔍 Adding exact ObjectId search for:', searchTerm);
            filter.$or.push({ _id: new mongoose.Types.ObjectId(searchTerm) });
          } else if (searchTerm.length >= 8 && /^[0-9a-fA-F]+$/.test(searchTerm)) {
            // Si es cadena hexadecimal pero no ObjectId completo, buscar por coincidencia parcial
            // Convertir a string el _id para buscar
            console.log('🔍 Adding partial ID search for:', searchTerm);
            filter.$or.push({ 
              $expr: { 
                $regexMatch: { 
                  input: { $toString: "$_id" }, 
                  regex: searchTerm,
                  options: "i"
                } 
              } 
            });
          }
          
          console.log('🔍 Search filter created:', JSON.stringify(filter.$or, null, 2));
        } catch (regexError) {
          console.error('❌ Error creating regex for search:', regexError);
          // Si hay error en regex, solo buscar por ObjectId válidos
          if (mongoose.Types.ObjectId.isValid(searchTerm) && searchTerm.length === 24) {
            filter.$or = [{ _id: new mongoose.Types.ObjectId(searchTerm) }];
          } else {
            // Solo buscar en campos de texto
            const searchRegex = new RegExp(searchTerm, 'i');
            filter.$or = [
              { 'items.name': { $regex: searchRegex } },
              { 'cliente.nombre': { $regex: searchRegex } }
            ];
          }
        }
      }
      
      if (status) {
        const validStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'];
        if (validStatuses.includes(status)) {
          filter.status = status;
        }
      } else {
        // Si no se especifica status, por defecto mostrar 'en_preparacion' para pizzería
        filter.status = 'en_preparacion';
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
          // Si ya hay $or (por búsqueda), usar $and para combinar
          const methodFilter = [
            { method: method }, // Pagos únicos
            { 
              paymentType: 'mixed',
              'mixedPayments.method': method 
            } // Pagos mixtos que contengan este método
          ];
          
          if (filter.$or) {
            // Combinar búsqueda con filtro de método
            filter.$and = [
              { $or: filter.$or }, // Condiciones de búsqueda
              { $or: methodFilter } // Condiciones de método
            ];
            delete filter.$or;
          } else {
            filter.$or = methodFilter;
          }
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
        .populate('tienda', 'nombre direccion telefono rfc ticketConfig')
        .populate('user', 'username')
        .populate('cliente', 'nombre telefono direccion')
        .populate('deliveryPerson', 'username')
        .sort({ date: 1 }) // Más antiguos primero para pizzería
        .skip(skip)
        .limit(parseInt(limit));
      
      
      // Agregar información de devoluciones para ventas canceladas con totalReturned > 0
      const Return = require('../../core/devoluciones/model');
      for (let sale of sales) {
        if (sale.status === 'cancelada' && sale.totalReturned > 0) {
          const returnInfo = await Return.findOne({ saleId: sale._id, tenantId: req.tenantId })
            .populate('processedBy', 'username')
            .sort({ date: -1 });
          
          if (returnInfo) {
            sale._doc.returnedBy = returnInfo.processedBy;
            sale._doc.returnedDate = returnInfo.date;
          }
        }
      }
      
      const total = await Sale.countDocuments(filter);
      
      // Generar estadísticas por estado respetando filtros aplicados PERO solo tienda y fechas
      // No incluir filtros de búsqueda, método o tipo para las estadísticas globales
      const statsFilter = {};
      
      // Conservar solo filtros de tienda y fechas para las estadísticas
      // Aplicar el mismo filtro de tienda que se usó en la consulta principal
      if (currentUser.role !== 'admin') {
        // Usuarios no admin solo ven ventas de su tienda
        if (currentUser.tienda) {
          statsFilter.tienda = currentUser.tienda._id;
        }
      } else if (tiendaId) {
        // Admin puede filtrar por tienda específica - convertir a ObjectId si es necesario
        try {
          statsFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
        } catch (e) {
          // Si no es un ObjectId válido, usar como string
          statsFilter.tienda = tiendaId;
        }
      }
      
      if (filter.date) {
        statsFilter.date = filter.date;
      }
      
      // Agregar tenantId al filtro de stats
      statsFilter.tenantId = new mongoose.Types.ObjectId(req.tenantId);

      const statusStats = await Sale.aggregate([
        { $match: statsFilter },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Convertir resultado de agregación a objeto
      const globalStats = {};
      const validStatuses = ['en_preparacion', 'listo_para_envio', 'enviado', 'entregado_y_cobrado', 'parcialmente_devuelta', 'cancelada'];
      
      // Inicializar todos los estados en 0
      validStatuses.forEach(status => {
        globalStats[status] = 0;
      });
      
      // Llenar con datos reales
      statusStats.forEach(stat => {
        if (validStatuses.includes(stat._id)) {
          globalStats[stat._id] = stat.count;
        }
      });
      
      
      return successResponse(res, {
        sales,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        },
        globalStats, // Estadísticas filtradas por los criterios aplicados
        filter: filter,
        userRole: currentUser.role,
        userTienda: currentUser.tienda
      }, 'Ventas obtenidas exitosamente');
      
    } catch (err) {
      console.error('❌ Error fetching sales:', err);
      console.error('❌ Error stack:', err.stack);
      console.error('❌ Filter that caused error:', JSON.stringify(filter, null, 2));
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

      const sale = await Sale.findOne({ _id: id, tenantId: req.tenantId })
        .populate('cliente', 'nombre telefono direccion')
        .populate('tienda', 'nombre direccion telefono rfc ticketConfig')
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

      const sale = await Sale.findOne({ _id: id, tenantId: req.tenantId });
      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      // Validación: Solo permitir cancelar si está en preparación o listo para envío
      if (status === 'cancelada') {
        if (sale.status !== 'en_preparacion' && sale.status !== 'listo_para_envio') {
          return errorResponse(res, 'Solo puedes cancelar pedidos en preparación o listos para envío', 400);
        }

        // 📦 RESTAURACIÓN DE STOCK: Solo para supermercados
        // Obtener el tipo de negocio del tenant
        const Tenant = require('../../core/tenants/model');
        const tenant = await Tenant.findById(req.tenantId).select('businessType');

        if (tenant?.businessType === 'supermarket') {
          // Devolver stock solo si la venta tiene productos con productId válido
          for (const item of sale.items) {
            if (item.productId) {
              try {
                const product = await Product.findOne({ _id: item.productId, tenantId: req.tenantId });
                if (product) {
                  await Product.findOneAndUpdate(
                    { _id: item.productId, tenantId: req.tenantId },
                    { $inc: { stock: item.quantity } }
                  );
                } else {
                  console.warn(`⚠️ Producto ${item.productId} no encontrado, no se devolvió stock`);
                }
              } catch (productError) {
                console.error(`❌ Error al devolver stock del producto ${item.productId}:`, productError);
                // Continuar con los demás productos en lugar de fallar completamente
              }
            }
          }
        }
      }

      // Actualizar el estado
      sale.status = status;
      await sale.save();

      // Intentar popular los campos relacionados
      let updatedSale;
      try {
        updatedSale = await Sale.findOne({ _id: id, tenantId: req.tenantId })
          .populate('cliente', 'nombre telefono direccion')
          .populate('tienda', 'nombre direccion telefono rfc ticketConfig')
          .populate('user', 'username')
          .populate('deliveryPerson', 'username');
      } catch (populateError) {
        console.warn('⚠️ Error al popular campos relacionados, retornando venta sin popular:', populateError);
        updatedSale = await Sale.findOne({ _id: id, tenantId: req.tenantId });
      }

      return successResponse(res, updatedSale, 'Estado actualizado exitosamente');

    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      console.error('Stack trace:', error.stack);
      return errorResponse(res, 'Error al actualizar estado', 500);
    }
  }

  // Eliminar ventas sin tienda
  async deleteNoStore(req, res) {
    try {
      const result = await Sale.deleteMany({
        tenantId: req.tenantId,
        tienda: { $exists: false }
      });
      
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
      const sales = await Sale.find({ _id: { $in: ids }, tenantId: req.tenantId });

      // 📦 RESTAURACIÓN DE STOCK: Solo para supermercados
      const Tenant = require('../../core/tenants/model');
      const tenant = await Tenant.findById(req.tenantId).select('businessType');

      if (tenant?.businessType === 'supermarket') {
        // Devolver stock de productos
        for (const sale of sales) {
          if (sale.status !== 'cancelada') {
            for (const item of sale.items) {
              if (item.productId) {
                await Product.findOneAndUpdate(
                  { _id: item.productId, tenantId: req.tenantId },
                  { $inc: { stock: item.quantity } }
                );
              }
            }
          }
        }
      }

      const result = await Sale.deleteMany({ _id: { $in: ids }, tenantId: req.tenantId });

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

      const tiendaData = await Tienda.findOne({ _id: tienda, tenantId: req.tenantId }).lean();
      const tiendaNombre = tiendaData ? tiendaData.nombre : tienda;
      const clienteData = clienteId ? await Cliente.findOne({ _id: clienteId, tenantId: req.tenantId }).lean() : null;

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
      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });

      if (currentUser.role !== 'admin') {
        return errorResponse(res, 'Solo administradores pueden acceder a esta información', 403);
      }

      const tiendas = await Tienda.find({ tenantId: req.tenantId }, 'nombre').sort({ nombre: 1 });
      
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
      
      const filter = {
        tenantId: new mongoose.Types.ObjectId(req.tenantId) // ✅ Filtrar por tenant
      };

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
      }).populate('tienda', 'nombre direccion telefono rfc ticketConfig');
      
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
        tenantId: new mongoose.Types.ObjectId(req.tenantId), // ✅ Filtrar por tenant
        date: {
          $gte: new Date(startDate + 'T00:00:00.000Z'),
          $lte: new Date(endDate + 'T23:59:59.999Z')
        }
      };

      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const sales = await Sale.find(filter)
        .populate('cliente', 'nombre telefono direccion')
        .populate('tienda', 'nombre direccion telefono rfc ticketConfig')
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

  // Asignar repartidor a una venta
  async assignDeliveryPerson(req, res) {
    try {
      const { id } = req.params;
      const { deliveryPerson } = req.body;

      if (!deliveryPerson) {
        return errorResponse(res, 'El ID del repartidor es requerido', 400);
      }

      const sale = await Sale.findOne({ _id: id, tenantId: req.tenantId });
      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      // Actualizar el repartidor
      sale.deliveryPerson = deliveryPerson;
      await sale.save();

      const updatedSale = await Sale.findOne({ _id: id, tenantId: req.tenantId })
        .populate('tienda', 'nombre direccion telefono rfc ticketConfig')
        .populate('user', 'username')
        .populate('cliente', 'nombre telefono direccion')
        .populate('deliveryPerson', 'username');

      return successResponse(res, {
        sale: updatedSale
      }, 'Repartidor asignado exitosamente');

    } catch (error) {
      console.error('Error al asignar repartidor:', error);
      return errorResponse(res, 'Error al asignar repartidor', 500);
    }
  }

  // Obtener ventas pendientes (en_preparacion, listo_para_envio, enviado)
  // Para mostrar advertencia al cerrar turno
  async getPendingSales(req, res) {
    try {
      const { tiendaId } = req.query;

      if (!tiendaId) {
        return errorResponse(res, 'El ID de la tienda es requerido', 400);
      }

      // Estados que se consideran "pendientes"
      const pendingStatuses = ['en_preparacion', 'listo_para_envio', 'enviado'];

      // Contar ventas pendientes por estado
      const counts = await Sale.aggregate([
        {
          $match: {
            tenantId: new mongoose.Types.ObjectId(req.tenantId), // ✅ Filtrar por tenant
            tienda: new mongoose.Types.ObjectId(tiendaId),
            status: { $in: pendingStatuses }
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Transformar a objeto más legible
      const pendingSales = {
        en_preparacion: 0,
        listo_para_envio: 0,
        enviado: 0,
        total: 0
      };

      counts.forEach(item => {
        pendingSales[item._id] = item.count;
        pendingSales.total += item.count;
      });

      return successResponse(res, {
        pendingSales,
        hasPending: pendingSales.total > 0
      }, 'Ventas pendientes obtenidas exitosamente');

    } catch (error) {
      console.error('Error al obtener ventas pendientes:', error);
      return errorResponse(res, 'Error al obtener ventas pendientes', 500);
    }
  }
}

module.exports = new SalesController();