const Account = require('./model');
const Table = require('../tables/model');
const Tenant = require('../tenants/model');
const Turno = require('../turnos/model');
const Sale = require('../sales/model');
const User = require('../users/model');
const Product = require('../products/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class AccountsController {
  // Crear nueva cuenta (abrir mesa)
  async create(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { tableId, guestCount, notes } = req.body;

      // Validaciones
      if (!tableId) {
        return errorResponse(res, 'Mesa requerida', 400);
      }

      // Verificar que el tenant es tipo restaurant
      const tenant = await Tenant.findById(tenantId);
      if (!tenant || tenant.businessType !== 'restaurant') {
        return errorResponse(res, 'Esta funcionalidad solo está disponible para restaurants', 403);
      }

      // Verificar límite de cuentas abiertas
      const openAccountsCount = await Account.countDocuments({
        tenantId,
        status: { $in: ['open', 'closed_pending', 'split_pending'] }
      });

      const maxOpenAccounts = tenant.limits.maxOpenAccounts;
      if (maxOpenAccounts !== -1 && openAccountsCount >= maxOpenAccounts) {
        return errorResponse(res, `Has alcanzado el límite de ${maxOpenAccounts} cuentas abiertas simultáneas`, 403);
      }

      // Verificar que la mesa existe y está disponible
      const table = await Table.findOne({ _id: tableId, tenantId });
      if (!table) {
        return errorResponse(res, 'Mesa no encontrada', 404);
      }

      if (table.status === 'occupied') {
        return errorResponse(res, 'La mesa ya está ocupada', 400);
      }

      // Obtener usuario (mesero)
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Obtener turno activo
      const turno = await Turno.findOne({
        tenantId,
        tienda: user.tienda || table.tiendaId,
        estado: 'activo'
      });

      if (!turno) {
        return errorResponse(res, 'No hay un turno activo. Abre un turno primero.', 400);
      }

      // Crear cuenta
      const account = new Account({
        tenantId,
        tiendaId: table.tiendaId,
        turnoId: turno._id,
        tableId,
        waiterId: userId,
        guestCount: guestCount || 1,
        notes,
        status: 'open',
        orders: [],
        openedAt: new Date()
      });

      // El folio se asigna automáticamente en el pre-save hook
      await account.save();

      // Marcar mesa como ocupada
      await table.occupy(account._id);

      // Agregar al historial de estados
      account.statusHistory.push({
        status: 'open',
        changedBy: userId,
        changedAt: new Date(),
        reason: 'Cuenta abierta'
      });

      await account.save();

      // Poblar datos para response
      await account.populate('waiterId', 'username');
      await account.populate('tableId', 'number section');

      return successResponse(res, { account }, 'Cuenta abierta exitosamente', 201);
    } catch (error) {
      console.error('Error creando cuenta:', error);
      return errorResponse(res, 'Error al crear cuenta', 500);
    }
  }

  // Listar cuentas
  async getAll(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { status, tiendaId, waiterId, tableId } = req.query;

      // Obtener rol del usuario
      const user = await User.findById(userId);

      // Construir filtro
      const filter = { tenantId };

      if (status) {
        filter.status = status;
      } else {
        // Por defecto, mostrar solo cuentas activas
        filter.status = { $in: ['open', 'closed_pending', 'split_pending'] };
      }

      if (tiendaId) {
        filter.tiendaId = tiendaId;
      }

      if (tableId) {
        filter.tableId = tableId;
      }

      // Si no es admin, solo ver sus propias cuentas
      if (user.role !== 'admin') {
        filter.waiterId = userId;
      } else if (waiterId) {
        filter.waiterId = waiterId;
      }

      const accounts = await Account.find(filter)
        .populate('tableId', 'number section')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre')
        .sort({ openedAt: -1 });

      // Estadísticas
      const stats = {
        total: accounts.length,
        open: accounts.filter(a => a.status === 'open').length,
        closed_pending: accounts.filter(a => a.status === 'closed_pending').length,
        split_pending: accounts.filter(a => a.status === 'split_pending').length
      };

      return successResponse(res, { accounts, stats });
    } catch (error) {
      console.error('Error obteniendo cuentas:', error);
      return errorResponse(res, 'Error al obtener cuentas', 500);
    }
  }

  // Obtener cuenta por ID
  async getById(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableId', 'number section capacity')
        .populate('waiterId', 'username email')
        .populate('tiendaId', 'nombre direccion telefono')
        .populate('turnoId', 'usuario fechaApertura')
        .populate('orders.items.productId', 'name price')
        .populate('orders.orderedBy', 'username');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar permisos: solo admin o el mesero dueño pueden ver la cuenta
      const user = await User.findById(userId);
      if (user.role !== 'admin' && account.waiterId._id.toString() !== userId.toString()) {
        return errorResponse(res, 'No tienes permiso para ver esta cuenta', 403);
      }

      return successResponse(res, { account });
    } catch (error) {
      console.error('Error obteniendo cuenta:', error);
      return errorResponse(res, 'Error al obtener cuenta', 500);
    }
  }

  // Agregar orden a una cuenta existente
  async addOrder(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { items } = req.body;

      // Validaciones
      if (!items || !Array.isArray(items) || items.length === 0) {
        return errorResponse(res, 'Debes agregar al menos un producto', 400);
      }

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar que la cuenta esté abierta
      if (account.status !== 'open') {
        return errorResponse(res, 'No puedes agregar productos a una cuenta cerrada', 400);
      }

      // Verificar permisos
      const user = await User.findById(userId);
      if (user.role !== 'admin' && account.waiterId.toString() !== userId.toString()) {
        return errorResponse(res, 'No tienes permiso para modificar esta cuenta', 403);
      }

      // Validar y construir items
      const validatedItems = [];
      for (const item of items) {
        if (!item.productId || !item.quantity) {
          return errorResponse(res, 'Cada producto debe tener productId y quantity', 400);
        }

        // Obtener producto para validar y obtener precio
        const product = await Product.findOne({
          _id: item.productId,
          tenantId
        });

        if (!product) {
          return errorResponse(res, `Producto ${item.productId} no encontrado`, 404);
        }

        validatedItems.push({
          productId: product._id,
          quantity: item.quantity,
          price: product.price,
          name: product.name,
          note: item.note || '',
          status: 'pending'
        });
      }

      // Agregar orden usando el método del modelo
      await account.addOrder(validatedItems, userId);

      // Poblar para respuesta
      await account.populate('orders.items.productId', 'name price');
      await account.populate('orders.orderedBy', 'username');

      return successResponse(res, { account }, 'Orden agregada exitosamente');
    } catch (error) {
      console.error('Error agregando orden:', error);
      return errorResponse(res, 'Error al agregar orden', 500);
    }
  }

  // Actualizar estado de un item
  async updateItemStatus(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { orderIndex, itemIndex, status } = req.body;

      const validStatuses = ['pending', 'preparing', 'ready', 'served', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return errorResponse(res, 'Estado inválido', 400);
      }

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar que exista la orden y el item
      if (!account.orders[orderIndex] || !account.orders[orderIndex].items[itemIndex]) {
        return errorResponse(res, 'Orden o item no encontrado', 404);
      }

      // Actualizar estado
      account.orders[orderIndex].items[itemIndex].status = status;

      // Actualizar timestamps
      const now = new Date();
      if (status === 'preparing') {
        account.orders[orderIndex].items[itemIndex].sentToKitchenAt = now;
      } else if (status === 'ready') {
        account.orders[orderIndex].items[itemIndex].readyAt = now;
      } else if (status === 'served') {
        account.orders[orderIndex].items[itemIndex].servedAt = now;
      }

      await account.save();

      return successResponse(res, { account }, `Item actualizado a: ${status}`);
    } catch (error) {
      console.error('Error actualizando estado de item:', error);
      return errorResponse(res, 'Error al actualizar item', 500);
    }
  }

  // Aplicar descuento
  async applyDiscount(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { discount, discountType } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar permisos
      const user = await User.findById(userId);
      if (user.role !== 'admin' && account.waiterId.toString() !== userId.toString()) {
        return errorResponse(res, 'No tienes permiso para modificar esta cuenta', 403);
      }

      // Validar descuento
      if (discount < 0) {
        return errorResponse(res, 'El descuento no puede ser negativo', 400);
      }

      if (discountType === 'percentage' && discount > 100) {
        return errorResponse(res, 'El descuento porcentual no puede ser mayor a 100%', 400);
      }

      account.discount = discount;
      account.discountType = discountType || 'fixed';
      account.calculateTotals();

      await account.save();

      return successResponse(res, { account }, 'Descuento aplicado exitosamente');
    } catch (error) {
      console.error('Error aplicando descuento:', error);
      return errorResponse(res, 'Error al aplicar descuento', 500);
    }
  }

  // Cancelar cuenta
  async cancel(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { reason } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Obtener tenant para verificar config
      const tenant = await Tenant.findById(tenantId);
      const user = await User.findById(userId);

      // Si requiere autorización de manager y el usuario no es admin
      if (tenant.restaurantConfig.requireManagerForCancellation && user.role !== 'admin') {
        return errorResponse(res, 'Solo un administrador puede cancelar cuentas', 403);
      }

      // Cambiar estado a cancelada
      account.changeStatus('cancelled', userId, reason || 'Cuenta cancelada');
      account.closedAt = new Date();

      await account.save();

      // Liberar mesa
      const table = await Table.findById(account.tableId);
      if (table) {
        await table.release();
      }

      return successResponse(res, { account }, 'Cuenta cancelada exitosamente');
    } catch (error) {
      console.error('Error cancelando cuenta:', error);
      return errorResponse(res, 'Error al cancelar cuenta', 500);
    }
  }

  // ✨ FEATURE 4: Aplicar propina
  async applyTip(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { tipAmount, tipPercentage, tipType } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar permisos
      const user = await User.findById(userId);
      if (user.role !== 'admin' && account.waiterId.toString() !== userId.toString()) {
        return errorResponse(res, 'No tienes permiso para modificar esta cuenta', 403);
      }

      // Validar tipo de propina
      const validTipTypes = ['percentage', 'fixed', 'none'];
      if (!validTipTypes.includes(tipType)) {
        return errorResponse(res, 'Tipo de propina inválido', 400);
      }

      // Calcular propina
      let finalTipAmount = 0;
      if (tipType === 'percentage') {
        if (!tipPercentage || tipPercentage < 0 || tipPercentage > 100) {
          return errorResponse(res, 'Porcentaje de propina inválido', 400);
        }
        finalTipAmount = (account.subtotal * tipPercentage) / 100;
      } else if (tipType === 'fixed') {
        if (!tipAmount || tipAmount < 0) {
          return errorResponse(res, 'Monto de propina inválido', 400);
        }
        finalTipAmount = tipAmount;
      }

      // Aplicar propina
      account.tip = {
        amount: finalTipAmount,
        percentage: tipType === 'percentage' ? tipPercentage : null,
        type: tipType
      };

      account.calculateTotals();
      await account.save();

      return successResponse(res, { account }, 'Propina aplicada exitosamente');
    } catch (error) {
      console.error('Error aplicando propina:', error);
      return errorResponse(res, 'Error al aplicar propina', 500);
    }
  }

  // ✨ FEATURE 5: Generar ticket preliminar
  async generatePreliminaryTicket(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableId', 'number section')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre direccion telefono ticketConfig')
        .populate('orders.items.productId', 'name price');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Construir datos del ticket preliminar
      const ticketData = {
        tipo: 'PRELIMINAR',
        folio: account.folio,
        fecha: new Date(),
        mesa: `${account.tableId.number} - ${account.tableId.section}`,
        mesero: account.waiterId.username,
        comensales: account.guestCount,
        items: [],
        subtotal: account.subtotal,
        descuento: account.discount,
        propina: account.tip.amount || 0,
        total: account.total,
        tienda: {
          nombre: account.tiendaId.nombre,
          direccion: account.tiendaId.direccion,
          telefono: account.tiendaId.telefono
        }
      };

      // Construir lista de items
      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.status !== 'cancelled') {
            ticketData.items.push({
              nombre: item.name,
              cantidad: item.quantity,
              precio: item.price,
              subtotal: item.price * item.quantity,
              nota: item.note
            });
          }
        });
      });

      return successResponse(res, { ticketData }, 'Ticket preliminar generado');
    } catch (error) {
      console.error('Error generando ticket preliminar:', error);
      return errorResponse(res, 'Error al generar ticket', 500);
    }
  }

  // ✨ FEATURE 6: Configurar división de cuenta (split bill)
  async configureSplit(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { splits } = req.body;

      // Validaciones
      if (!splits || !Array.isArray(splits) || splits.length < 2) {
        return errorResponse(res, 'Debes dividir la cuenta en al menos 2 partes', 400);
      }

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar permisos
      const user = await User.findById(userId);
      if (user.role !== 'admin' && account.waiterId.toString() !== userId.toString()) {
        return errorResponse(res, 'No tienes permiso para modificar esta cuenta', 403);
      }

      // Configurar splits
      account.isSplit = true;
      account.splitConfig = splits.map((split, index) => ({
        splitNumber: index + 1,
        items: split.items || [],
        subtotal: split.subtotal || 0,
        tip: split.tip || { amount: 0, type: 'none' },
        total: split.total || 0,
        paymentStatus: 'pending'
      }));

      // Cambiar estado de cuenta
      account.changeStatus('split_pending', userId, 'Cuenta dividida');

      // Validar que la división sea correcta
      const validation = account.validateSplit();
      if (!validation.valid) {
        return errorResponse(res, validation.message, 400);
      }

      await account.save();

      return successResponse(res, { account }, 'Cuenta dividida exitosamente');
    } catch (error) {
      console.error('Error configurando split:', error);
      return errorResponse(res, 'Error al dividir cuenta', 500);
    }
  }

  // ✨ FEATURE 6: Pagar una división específica
  async paySplit(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id, splitNum } = req.params;
      const { paymentMethod, paymentType, mixedPayments } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (!account.isSplit) {
        return errorResponse(res, 'Esta cuenta no está dividida', 400);
      }

      // Buscar el split
      const splitIndex = account.splitConfig.findIndex(s => s.splitNumber === parseInt(splitNum));
      if (splitIndex === -1) {
        return errorResponse(res, 'División no encontrada', 404);
      }

      const split = account.splitConfig[splitIndex];

      if (split.paymentStatus === 'paid') {
        return errorResponse(res, 'Esta división ya fue pagada', 400);
      }

      // Crear venta para este split
      const saleData = {
        tenantId,
        items: [], // Se construirán de los items del split
        total: split.total,
        discount: 0,
        paymentType: paymentType || 'single',
        method: paymentType === 'single' ? paymentMethod : undefined,
        mixedPayments: paymentType === 'mixed' ? mixedPayments : undefined,
        tipo: 'mostrador',
        tienda: account.tiendaId,
        turno: account.turnoId,
        user: userId,
        tip: split.tip,
        sourceAccount: account._id,
        restaurantInfo: {
          tableNumber: account.tableId.number || '',
          tableId: account.tableId,
          waiterId: account.waiterId,
          splitNumber: split.splitNumber,
          guestCount: account.guestCount
        }
      };

      // Construir items del split
      split.items.forEach(ref => {
        const order = account.orders[ref.orderIndex];
        if (order) {
          const item = order.items[ref.itemIndex];
          if (item) {
            saleData.items.push({
              productId: item.productId,
              quantity: ref.quantity || item.quantity,
              price: item.price,
              name: item.name,
              note: item.note
            });
          }
        }
      });

      const sale = new Sale(saleData);
      await sale.save();

      // Marcar split como pagado
      account.splitConfig[splitIndex].paymentStatus = 'paid';
      account.splitConfig[splitIndex].paidAt = new Date();
      account.splitConfig[splitIndex].paidBy = userId;
      account.splitConfig[splitIndex].saleId = sale._id;
      account.splitConfig[splitIndex].paymentMethod = paymentMethod;
      account.splitConfig[splitIndex].paymentType = paymentType || 'single';
      account.splitConfig[splitIndex].mixedPayments = mixedPayments;

      // Agregar a finalSales
      if (!account.finalSales) {
        account.finalSales = [];
      }
      account.finalSales.push(sale._id);

      // Si todos los splits están pagados, cerrar cuenta
      const allPaid = account.areAllSplitsPaid();
      if (allPaid) {
        account.changeStatus('paid', userId, 'Todos los splits pagados');
        account.closedAt = new Date();

        // Liberar mesa
        const table = await Table.findById(account.tableId);
        if (table) {
          await table.release();
        }
      }

      await account.save();

      return successResponse(res, { account, sale }, `División ${splitNum} pagada exitosamente`, 201);
    } catch (error) {
      console.error('Error pagando split:', error);
      return errorResponse(res, 'Error al pagar división', 500);
    }
  }

  // ✨ FEATURE 7: Pagar cuenta completa (sin split)
  async payAccount(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { paymentMethod, paymentType, mixedPayments } = req.body;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableId')
        .populate('waiterId', 'username');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (account.isSplit) {
        return errorResponse(res, 'Esta cuenta está dividida. Paga cada división por separado.', 400);
      }

      if (account.status === 'paid') {
        return errorResponse(res, 'Esta cuenta ya fue pagada', 400);
      }

      // Crear venta
      const saleData = {
        tenantId,
        items: [],
        total: account.total,
        discount: account.discount,
        paymentType: paymentType || 'single',
        method: paymentType === 'single' ? paymentMethod : undefined,
        mixedPayments: paymentType === 'mixed' ? mixedPayments : undefined,
        type: 'mostrador',
        tienda: account.tiendaId,
        turno: account.turnoId,
        user: userId,
        tip: account.tip,
        sourceAccount: account._id,
        restaurantInfo: {
          tableNumber: account.tableId.number || '',
          tableId: account.tableId,
          waiterId: account.waiterId._id,
          waiterName: account.waiterId.username,
          guestCount: account.guestCount
        }
      };

      // Construir items de todas las órdenes
      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.status !== 'cancelled') {
            saleData.items.push({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              name: item.name,
              note: item.note
            });
          }
        });
      });

      const sale = new Sale(saleData);
      await sale.save();

      // Actualizar cuenta
      account.paymentType = paymentType || 'single';
      account.paymentMethod = paymentMethod;
      account.mixedPayments = mixedPayments;
      account.finalSales = [sale._id];
      account.changeStatus('paid', userId, 'Cuenta pagada');
      account.closedAt = new Date();

      await account.save();

      // Liberar mesa
      await account.tableId.release();

      return successResponse(res, { account, sale }, 'Cuenta pagada exitosamente', 201);
    } catch (error) {
      console.error('Error pagando cuenta:', error);
      return errorResponse(res, 'Error al pagar cuenta', 500);
    }
  }

  // ✨ FEATURE 7: Cerrar cuenta (método alternativo que solo marca como cerrada sin pagar)
  async closeAccount(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Cambiar estado
      account.changeStatus('closed_pending', userId, 'Cliente pidió la cuenta');

      await account.save();

      return successResponse(res, { account }, 'Cuenta cerrada. Pendiente de pago.');
    } catch (error) {
      console.error('Error cerrando cuenta:', error);
      return errorResponse(res, 'Error al cerrar cuenta', 500);
    }
  }
}

module.exports = new AccountsController();
