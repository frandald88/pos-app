const Account = require('./model');
const Table = require('../tables/model');
const Tenant = require('../tenants/model');
const Turno = require('../turnos/model');
const Sale = require('../sales/model');
const User = require('../users/model');
const Product = require('../products/model');
const { getNextSequence } = require('../../shared/utils/counterHelper');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class AccountsController {
  // Crear nueva cuenta (abrir mesa)
  async create(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { tableId, tableIds: inputTableIds, guestCount, notes, subcuentas } = req.body;

      // Soportar tanto tableId (single) como tableIds (array)
      let tableIds = inputTableIds || (tableId ? [tableId] : []);

      // Validaciones
      if (!tableIds || tableIds.length === 0) {
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

      // Verificar que todas las mesas existen y están disponibles
      const tables = await Table.find({ _id: { $in: tableIds }, tenantId });
      if (tables.length !== tableIds.length) {
        return errorResponse(res, 'Una o más mesas no encontradas', 404);
      }

      const occupiedTables = tables.filter(t => t.status === 'occupied');
      if (occupiedTables.length > 0) {
        const occupiedNumbers = occupiedTables.map(t => t.number).join(', ');
        return errorResponse(res, `Las siguientes mesas ya están ocupadas: ${occupiedNumbers}`, 400);
      }

      // Usar la primera mesa como referencia para tienda
      const primaryTable = tables[0];

      // Obtener usuario (mesero)
      const user = await User.findById(userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Obtener turno activo
      const turno = await Turno.findOne({
        tenantId,
        tienda: user.tienda || primaryTable.tiendaId,
        estado: 'abierto'
      });

      if (!turno) {
        return errorResponse(res, 'No hay un turno activo. Abre un turno primero.', 400);
      }

      // Generar folio de venta (para trazabilidad y auditoría)
      // El folio se genera al crear la cuenta y se mantiene cuando se genera la venta final
      const folio = await getNextSequence('sale', tenantId);

      // Crear cuenta
      const account = new Account({
        tenantId,
        tiendaId: primaryTable.tiendaId,
        turnoId: turno._id,
        tableIds,
        waiterId: userId,
        guestCount: guestCount || 1,
        notes,
        status: 'open',
        orders: [],
        openedAt: new Date(),
        folio,
        subcuentas: subcuentas || []
      });

      await account.save();

      // Marcar todas las mesas como ocupadas
      for (const table of tables) {
        await table.occupy(account._id);
      }

      // Agregar al historial de estados
      account.statusHistory.push({
        status: 'open',
        changedBy: userId,
        changedAt: new Date(),
        reason: tableIds.length > 1 ? `Cuenta abierta (${tableIds.length} mesas combinadas)` : 'Cuenta abierta'
      });

      await account.save();

      // Poblar datos para response
      await account.populate('waiterId', 'username');
      await account.populate('tableIds', 'number section');

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
        .populate('tableIds', 'number section')
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
        .populate('tableIds', 'number section capacity')
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
          status: 'pending',
          subcuentaName: item.subcuentaName || null
        });
      }

      // Consolidar productos duplicados en órdenes pendientes existentes
      // Esto agrupa productos iguales (mismo productId, subcuentaName y estado pending)
      let itemsToAdd = [];

      for (const newItem of validatedItems) {
        let merged = false;

        // Buscar en órdenes existentes que no han sido enviadas a cocina
        for (const order of account.orders) {
          if (order.sentToKitchen) continue; // Saltar órdenes ya enviadas

          for (const existingItem of order.items) {
            // Verificar si es el mismo producto, misma subcuenta, y estado pending
            const sameProduct = existingItem.productId.toString() === newItem.productId.toString();
            const sameSubcuenta = (existingItem.subcuentaName || null) === (newItem.subcuentaName || null);
            const isPending = existingItem.status === 'pending';

            if (sameProduct && sameSubcuenta && isPending) {
              // Incrementar cantidad del item existente
              existingItem.quantity += newItem.quantity;
              merged = true;
              break;
            }
          }

          if (merged) break;
        }

        // Si no se consolidó, agregar a la lista de nuevos items
        if (!merged) {
          itemsToAdd.push(newItem);
        }
      }

      // Solo crear nueva orden si hay items que no se consolidaron
      if (itemsToAdd.length > 0) {
        await account.addOrder(itemsToAdd, userId);
      } else {
        // Si todos se consolidaron, solo recalcular totales y guardar
        account.calculateTotals();
        await account.save();
      }

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

      // Liberar todas las mesas
      for (const tableId of account.tableIds) {
        const table = await Table.findById(tableId);
        if (table) {
          await table.release();
        }
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
        .populate('tableIds', 'number section')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre direccion telefono ticketConfig')
        .populate('orders.items.productId', 'name price');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Construir datos del ticket preliminar
      const ticketConfig = account.tiendaId.ticketConfig || {};
      const ticketData = {
        tipo: 'PRELIMINAR',
        folio: account.folio,
        fecha: new Date(),
        mesa: account.tableIds.map(t => t.number).join('+') + (account.tableIds[0]?.section ? ` - ${account.tableIds[0].section}` : ''),
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
        },
        ticketConfig: {
          logo: ticketConfig.logo,
          mostrarLogo: ticketConfig.mostrarLogo,
          nombreNegocio: ticketConfig.nombreNegocio || account.tiendaId.nombre,
          rfc: ticketConfig.rfc,
          mostrarRFC: ticketConfig.mostrarRFC,
          camposMostrar: ticketConfig.camposMostrar || {},
          mensajeSuperior: ticketConfig.mensajeSuperior,
          mensajeInferior: ticketConfig.mensajeInferior || '¡GRACIAS POR SU PREFERENCIA!',
          anchoTicket: ticketConfig.anchoTicket || '80mm',
          tamanoFuente: ticketConfig.tamanoFuente || 'normal',
          leyendaFiscal: ticketConfig.leyendaFiscal
        }
      };

      // Construir lista de items
      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.status !== 'cancelled') {
            ticketData.items.push({
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              note: item.note,
              subcuentaName: item.subcuentaName || null
            });
          }
        });
      });

      return successResponse(res, { ticket: ticketData }, 'Ticket preliminar generado');
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
        tip: {
          amount: 0,
          percentage: 0,
          type: 'none'
        },
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
      const { paymentMethod, paymentType, mixedPayments, tipAmount, tipPercentage, tipType } = req.body;

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

      // Mapeo de métodos de pago
      const methodMap = {
        'cash': 'efectivo',
        'card': 'tarjeta',
        'transfer': 'transferencia',
        'efectivo': 'efectivo',
        'tarjeta': 'tarjeta',
        'transferencia': 'transferencia'
      };

      // Calcular propina
      let finalTipAmount = 0;
      if (tipType === 'percentage' && tipPercentage) {
        finalTipAmount = (split.total * tipPercentage) / 100;
      } else if (tipType === 'fixed' && tipAmount) {
        finalTipAmount = tipAmount;
      }

      // Total de venta NO incluye propina - la propina es un ingreso adicional separado
      const saleTotal = split.total;

      // Generar folio
      // Usar el folio de la cuenta (ya generado al crear la cuenta)
      // Agregar sufijo para identificar el split (ej: 00025-S1, 00025-S2)
      const folio = `${account.folio}-S${splitNum}`;

      // Crear venta para este split
      const saleData = {
        tenantId,
        folio,
        items: [], // Se construirán de los items del split
        total: saleTotal,
        discount: 0,
        paymentType: paymentType || 'single',
        method: methodMap[paymentMethod] || paymentMethod,
        mixedPayments: paymentType === 'mixed' ? mixedPayments : undefined,
        type: 'mostrador',
        status: 'entregado_y_cobrado',
        tienda: account.tiendaId,
        turno: account.turnoId,
        user: userId,
        tip: {
          amount: finalTipAmount,
          percentage: tipPercentage || 0,
          type: tipType || 'none'
        },
        sourceAccount: account._id,
        restaurantInfo: {
          tableNumber: account.tableIds.map(t => t.number).join('+') || '',
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
      account.splitConfig[splitIndex].paymentMethod = methodMap[paymentMethod] || paymentMethod;
      account.splitConfig[splitIndex].paymentType = paymentType || 'single';
      account.splitConfig[splitIndex].mixedPayments = mixedPayments;
      account.splitConfig[splitIndex].tip = {
        amount: finalTipAmount,
        percentage: tipPercentage || 0,
        type: tipType || 'none'
      };

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

        // Liberar todas las mesas
        for (const tableId of account.tableIds) {
          const table = await Table.findById(tableId);
          if (table) {
            await table.release();
          }
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
      const { paymentMethod, paymentType, mixedPayments, tip } = req.body;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableIds')
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

      // Mapeo de métodos de pago
      const methodMap = {
        'cash': 'efectivo',
        'card': 'tarjeta',
        'transfer': 'transferencia',
        'efectivo': 'efectivo',
        'tarjeta': 'tarjeta',
        'transferencia': 'transferencia'
      };

      // Verificar si hay subcuentas pagadas y calcular restante
      let totalToPay = account.total;
      let itemsToInclude = [];
      let paidSubcuentas = [];

      if (account.subcuentas && account.subcuentas.length > 0) {
        paidSubcuentas = account.subcuentas.filter(s => s.isPaid);
        const unpaidSubcuentas = account.subcuentas.filter(s => !s.isPaid);

        if (paidSubcuentas.length > 0) {
          // Calcular total restante (solo subcuentas no pagadas)
          totalToPay = 0;

          // Items de subcuentas no pagadas
          account.orders.forEach(order => {
            order.items.forEach(item => {
              if (item.status !== 'cancelled') {
                const isInUnpaidSubcuenta = unpaidSubcuentas.some(s => s.name === item.subcuentaName);
                const isUnassigned = !item.subcuentaName;

                if (isInUnpaidSubcuenta || isUnassigned) {
                  totalToPay += item.price * item.quantity;
                  itemsToInclude.push(item);
                }
              }
            });
          });

          // Total de venta NO incluye propina - la propina es un ingreso adicional separado
        }
      }

      // Si no hay subcuentas pagadas, incluir todos los items
      if (paidSubcuentas.length === 0) {
        account.orders.forEach(order => {
          order.items.forEach(item => {
            if (item.status !== 'cancelled') {
              itemsToInclude.push(item);
            }
          });
        });

        // Total de venta NO incluye propina - la propina es un ingreso adicional separado
        totalToPay = account.subtotal - account.discount;
      }

      // Usar el folio de la cuenta (ya generado al crear la cuenta)
      const folio = account.folio;

      // Crear venta
      const saleData = {
        tenantId,
        folio,
        items: [],
        total: totalToPay,
        discount: paidSubcuentas.length > 0 ? 0 : account.discount,
        paymentType: paymentType || 'single',
        method: paymentType === 'mixed' ? 'efectivo' : (methodMap[paymentMethod] || paymentMethod),
        mixedPayments: paymentType === 'mixed' && mixedPayments && mixedPayments.length > 0
          ? mixedPayments.map(mp => ({
              method: methodMap[mp.method] || mp.method,
              amount: mp.amount,
              reference: mp.reference || '',
              receivedAmount: mp.receivedAmount || mp.amount
            }))
          : undefined,
        type: 'mostrador',
        status: 'entregado_y_cobrado',
        tienda: account.tiendaId,
        turno: account.turnoId,
        user: userId,
        tip: tip || account.tip,
        sourceAccount: account._id,
        restaurantInfo: {
          tableNumber: account.tableIds.map(t => t.number).join('+') || '',
          tableId: account.tableId,
          waiterId: account.waiterId._id,
          waiterName: account.waiterId.username,
          guestCount: account.guestCount
        }
      };

      // Construir items
      itemsToInclude.forEach(item => {
        saleData.items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          name: item.name,
          note: item.note
        });
      });

      const sale = new Sale(saleData);
      await sale.save();

      // Actualizar cuenta
      account.paymentType = paymentType || 'single';

      if (paymentType === 'mixed') {
        account.paymentMethod = 'efectivo'; // Para pagos mixtos, establecer método base
        account.mixedPayments = mixedPayments && mixedPayments.length > 0
          ? mixedPayments.map(mp => ({
              method: methodMap[mp.method] || mp.method,
              amount: mp.amount,
              reference: mp.reference || '',
              receivedAmount: mp.receivedAmount || mp.amount
            }))
          : [];
      } else {
        account.paymentMethod = methodMap[paymentMethod] || paymentMethod;
        account.mixedPayments = undefined;
      }

      // Agregar venta a finalSales
      if (!account.finalSales) {
        account.finalSales = [];
      }
      account.finalSales.push(sale._id);

      // Marcar subcuentas no pagadas como pagadas
      if (account.subcuentas && account.subcuentas.length > 0) {
        account.subcuentas.forEach(subcuenta => {
          if (!subcuenta.isPaid) {
            subcuenta.isPaid = true;
            subcuenta.paidAt = new Date();
            subcuenta.paidBy = userId;

            if (paymentType === 'mixed') {
              subcuenta.paymentMethod = 'efectivo';
              subcuenta.paymentType = 'mixed';
              subcuenta.mixedPayments = account.mixedPayments;
            } else {
              subcuenta.paymentMethod = methodMap[paymentMethod] || paymentMethod;
              subcuenta.paymentType = 'single';
            }

            subcuenta.saleId = sale._id;
          }
        });
      }

      account.changeStatus('paid', userId, paidSubcuentas.length > 0
        ? `Cuenta pagada (restante de ${paidSubcuentas.length} subcuenta(s) ya pagada(s))`
        : 'Cuenta pagada');
      account.closedAt = new Date();

      await account.save();

      // Liberar todas las mesas
      for (const table of account.tableIds) {
        if (table && table.release) {
          await table.release();
        }
      }

      const message = paidSubcuentas.length > 0
        ? `Restante pagado exitosamente (${paidSubcuentas.length} subcuenta(s) ya estaban pagadas)`
        : 'Cuenta pagada exitosamente';

      return successResponse(res, {
        account,
        sale,
        paidSubcuentas: paidSubcuentas.length,
        totalPaid: totalToPay
      }, message, 201);
    } catch (error) {
      console.error('Error pagando cuenta:', error);
      return errorResponse(res, 'Error al pagar cuenta', 500);
    }
  }

  // ✨ FEATURE 8: Enviar items a cocina
  async sendToKitchen(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableIds', 'number section')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre ticketConfig');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (account.status !== 'open') {
        return errorResponse(res, 'Solo se pueden enviar items de cuentas abiertas', 400);
      }

      // Encontrar items pendientes y marcarlos como preparing
      const itemsToSend = [];
      const now = new Date();

      account.orders.forEach((order, orderIdx) => {
        order.items.forEach((item, itemIdx) => {
          if (item.status === 'pending') {
            item.status = 'preparing';
            item.sentToKitchenAt = now;

            itemsToSend.push({
              orderNumber: order.orderNumber,
              orderIdx,
              itemIdx,
              productId: item.productId,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              note: item.note
            });
          }
        });

        // Marcar orden como enviada a cocina
        if (order.items.some(item => item.status === 'preparing')) {
          order.sentToKitchen = true;
        }
      });

      if (itemsToSend.length === 0) {
        return errorResponse(res, 'No hay items pendientes para enviar a cocina', 400);
      }

      await account.save();

      // Construir datos de comanda
      const comandaData = {
        folio: account.folio,
        mesa: account.tableIds.map(t => t.number).join('+') + (account.tableIds[0]?.section ? ` - ${account.tableIds[0].section}` : ''),
        mesero: account.waiterId.username,
        fecha: now,
        items: itemsToSend,
        tienda: {
          nombre: account.tiendaId.nombre,
          ticketConfig: account.tiendaId.ticketConfig
        }
      };

      return successResponse(res, {
        account,
        comandaData,
        itemsSent: itemsToSend.length
      }, `${itemsToSend.length} item(s) enviado(s) a cocina`);
    } catch (error) {
      console.error('Error enviando a cocina:', error);
      return errorResponse(res, 'Error al enviar a cocina', 500);
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

  // ✨ FEATURE 9: Obtener items en cocina (para pantalla de cocina)
  async getKitchenItems(req, res) {
    try {
      const tenantId = req.tenantId;
      const { tiendaId, status } = req.query;

      // Filtro base
      const filter = {
        tenantId,
        status: 'open',
        'orders.items.status': { $in: status ? [status] : ['preparing', 'ready'] }
      };

      if (tiendaId) {
        filter.tiendaId = tiendaId;
      }

      const accounts = await Account.find(filter)
        .populate('tableIds', 'number section')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre')
        .sort({ 'orders.items.sentToKitchenAt': 1 });

      // Extraer items para cocina
      const kitchenItems = [];

      accounts.forEach(account => {
        account.orders.forEach((order, orderIdx) => {
          order.items.forEach((item, itemIdx) => {
            if (['preparing', 'ready'].includes(item.status)) {
              kitchenItems.push({
                accountId: account._id,
                folio: account.folio,
                mesa: account.tableIds?.length > 0 ? account.tableIds.map(t => t.number).join('+') + (account.tableIds[0]?.section ? ` - ${account.tableIds[0].section}` : '') : 'N/A',
                mesero: account.waiterId?.username || 'N/A',
                tienda: account.tiendaId?.nombre || 'N/A',
                orderNumber: order.orderNumber,
                orderIdx,
                itemIdx,
                productId: item.productId,
                name: item.name,
                quantity: item.quantity,
                note: item.note,
                status: item.status,
                sentToKitchenAt: item.sentToKitchenAt,
                readyAt: item.readyAt
              });
            }
          });
        });
      });

      // Ordenar por tiempo de envío a cocina
      kitchenItems.sort((a, b) => new Date(a.sentToKitchenAt) - new Date(b.sentToKitchenAt));

      // Estadísticas
      const stats = {
        total: kitchenItems.length,
        preparing: kitchenItems.filter(i => i.status === 'preparing').length,
        ready: kitchenItems.filter(i => i.status === 'ready').length
      };

      return successResponse(res, { kitchenItems, stats });
    } catch (error) {
      console.error('Error obteniendo items de cocina:', error);
      return errorResponse(res, 'Error al obtener items de cocina', 500);
    }
  }

  // ✨ FEATURE 9: Marcar item como listo
  async markItemReady(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { orderIdx, itemIdx } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (!account.orders[orderIdx] || !account.orders[orderIdx].items[itemIdx]) {
        return errorResponse(res, 'Item no encontrado', 404);
      }

      const item = account.orders[orderIdx].items[itemIdx];

      if (item.status !== 'preparing') {
        return errorResponse(res, 'Solo se pueden marcar como listos items en preparación', 400);
      }

      item.status = 'ready';
      item.readyAt = new Date();

      await account.save();

      return successResponse(res, { account }, 'Item marcado como listo');
    } catch (error) {
      console.error('Error marcando item como listo:', error);
      return errorResponse(res, 'Error al marcar item', 500);
    }
  }

  // ✨ FEATURE 10: Cancelar item de cocina
  async cancelItem(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const { orderIdx, itemIdx, reason } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (!account.orders[orderIdx] || !account.orders[orderIdx].items[itemIdx]) {
        return errorResponse(res, 'Item no encontrado', 404);
      }

      const item = account.orders[orderIdx].items[itemIdx];

      if (item.status === 'served') {
        return errorResponse(res, 'No se pueden cancelar items ya servidos', 400);
      }

      if (item.status === 'cancelled') {
        return errorResponse(res, 'Este item ya fue cancelado', 400);
      }

      item.status = 'cancelled';
      item.cancelledAt = new Date();
      item.cancelledBy = userId;
      item.cancellationReason = reason || 'Sin razón especificada';

      await account.save();

      return successResponse(res, { account }, 'Item cancelado exitosamente');
    } catch (error) {
      console.error('Error cancelando item:', error);
      return errorResponse(res, 'Error al cancelar item', 500);
    }
  }

  // ✨ NUEVO: Editar item antes de enviar a cocina
  async editItem(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { orderIdx, itemIdx, quantity, note, subcuentaName } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (!account.orders[orderIdx] || !account.orders[orderIdx].items[itemIdx]) {
        return errorResponse(res, 'Item no encontrado', 404);
      }

      const item = account.orders[orderIdx].items[itemIdx];

      // Solo se pueden editar items que NO han sido enviados a cocina
      if (item.status !== 'pending') {
        return errorResponse(res, 'Solo se pueden editar items que no han sido enviados a preparación', 400);
      }

      if (item.status === 'cancelled') {
        return errorResponse(res, 'No se pueden editar items cancelados', 400);
      }

      // Validar cantidad si se proporciona
      if (quantity !== undefined) {
        if (quantity <= 0) {
          return errorResponse(res, 'La cantidad debe ser mayor a 0', 400);
        }
        item.quantity = quantity;
      }

      // Actualizar nota si se proporciona
      if (note !== undefined) {
        item.note = note;
      }

      // Actualizar subcuenta si se proporciona
      if (subcuentaName !== undefined) {
        // Si es null o '', remover asignación
        item.subcuentaName = subcuentaName || null;

        // Si se asigna a una subcuenta, verificar que existe
        if (subcuentaName) {
          const subcuentaExists = account.subcuentas.some(s => s.name === subcuentaName);
          if (!subcuentaExists) {
            return errorResponse(res, 'La subcuenta especificada no existe', 400);
          }
        }
      }

      // Recalcular totales
      account.calculateTotals();

      // Si hay subcuentas, recalcular sus totales
      if (account.subcuentas && account.subcuentas.length > 0) {
        account.calculateSubcuentaTotals();
      }

      await account.save();

      return successResponse(res, { account }, 'Item editado exitosamente');
    } catch (error) {
      console.error('Error editando item:', error);
      return errorResponse(res, 'Error al editar item', 500);
    }
  }

  // ============ SUBCUENTAS ============

  // Agregar nombre de subcuenta
  async addSubcuenta(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { name } = req.body;

      if (!name || !name.trim()) {
        return errorResponse(res, 'El nombre es requerido', 400);
      }

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Verificar que no exista ya
      const exists = account.subcuentas.some(s => s.name.toLowerCase() === name.trim().toLowerCase());
      if (exists) {
        return errorResponse(res, 'Ya existe una subcuenta con ese nombre', 400);
      }

      account.subcuentas.push({ name: name.trim() });
      await account.save();

      return successResponse(res, { account }, 'Subcuenta agregada');
    } catch (error) {
      console.error('Error agregando subcuenta:', error);
      return errorResponse(res, 'Error al agregar subcuenta', 500);
    }
  }

  // Eliminar subcuenta
  async removeSubcuenta(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { name } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      const subcuenta = account.subcuentas.find(s => s.name === name);
      if (!subcuenta) {
        return errorResponse(res, 'Subcuenta no encontrada', 404);
      }

      if (subcuenta.isPaid) {
        return errorResponse(res, 'No se puede eliminar una subcuenta ya pagada', 400);
      }

      // Desasignar items de esta subcuenta
      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.subcuentaName === name) {
            item.subcuentaName = null;
          }
        });
      });

      account.subcuentas = account.subcuentas.filter(s => s.name !== name);
      await account.save();

      return successResponse(res, { account }, 'Subcuenta eliminada');
    } catch (error) {
      console.error('Error eliminando subcuenta:', error);
      return errorResponse(res, 'Error al eliminar subcuenta', 500);
    }
  }

  // Asignar item a subcuenta
  async assignItemToSubcuenta(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;
      const { orderIdx, itemIdx, subcuentaName } = req.body;

      const account = await Account.findOne({ _id: id, tenantId });
      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      if (!account.orders[orderIdx] || !account.orders[orderIdx].items[itemIdx]) {
        return errorResponse(res, 'Item no encontrado', 404);
      }

      // Verificar que la subcuenta existe (si se proporciona nombre)
      if (subcuentaName) {
        const subcuentaExists = account.subcuentas.some(s => s.name === subcuentaName);
        if (!subcuentaExists) {
          return errorResponse(res, 'Subcuenta no encontrada', 404);
        }
      }

      account.orders[orderIdx].items[itemIdx].subcuentaName = subcuentaName || null;
      account.calculateSubcuentaTotals();
      await account.save();

      return successResponse(res, { account }, 'Item asignado a subcuenta');
    } catch (error) {
      console.error('Error asignando item:', error);
      return errorResponse(res, 'Error al asignar item', 500);
    }
  }

  // Obtener resumen de subcuentas
  async getSubcuentasSummary(req, res) {
    try {
      const tenantId = req.tenantId;
      const { id } = req.params;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableIds', 'number section')
        .populate('waiterId', 'username');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      account.calculateSubcuentaTotals();

      // Calcular si hay items sin asignar que fueron pagados
      let unassignedPaidCount = 0;
      let unassignedPaidTotal = 0;
      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.status !== 'cancelled' && item.subcuentaName === '__UNASSIGNED_PAID__') {
            unassignedPaidCount++;
            unassignedPaidTotal += item.price * item.quantity;
          }
        });
      });

      const summary = {
        subcuentas: account.subcuentas.map(sub => ({
          name: sub.name,
          isPaid: sub.isPaid,
          subtotal: sub.subtotal,
          tip: sub.tip,
          total: sub.total,
          items: []
        })),
        unassigned: {
          items: account.getUnassignedItems(),
          subtotal: 0,
          isPaid: unassignedPaidCount > 0,
          paidItemsCount: unassignedPaidCount,
          paidTotal: unassignedPaidTotal
        },
        totalPaid: 0,
        totalPending: 0
      };

      // Agregar items a cada subcuenta
      account.orders.forEach((order, orderIdx) => {
        order.items.forEach((item, itemIdx) => {
          if (item.status !== 'cancelled') {
            const itemData = {
              orderIdx,
              itemIdx,
              name: item.name,
              quantity: item.quantity,
              price: item.price,
              total: item.price * item.quantity
            };

            if (item.subcuentaName) {
              // Excluir items marcados como pagados sin asignar
              if (item.subcuentaName !== '__UNASSIGNED_PAID__') {
                const subSummary = summary.subcuentas.find(s => s.name === item.subcuentaName);
                if (subSummary) {
                  subSummary.items.push(itemData);
                }
              }
            } else {
              summary.unassigned.subtotal += item.price * item.quantity;
            }
          }
        });
      });

      // Calcular totales pagados y pendientes
      summary.subcuentas.forEach(sub => {
        if (sub.isPaid) {
          summary.totalPaid += sub.total;
        } else {
          summary.totalPending += sub.total;
        }
      });

      // Agregar no asignados al pendiente
      summary.totalPending += summary.unassigned.subtotal;

      return successResponse(res, summary);
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      return errorResponse(res, 'Error al obtener resumen de subcuentas', 500);
    }
  }

  // Pagar subcuenta
  async paySubcuenta(req, res) {
    try {
      const tenantId = req.tenantId;
      const userId = req.userId;
      const { id } = req.params;
      const {
        subcuentaName,
        paymentMethod,
        paymentType,
        mixedPayments,
        tipAmount,
        tipPercentage,
        tipType,
        discount: proportionalDiscount,
        payUnassigned
      } = req.body;

      const account = await Account.findOne({ _id: id, tenantId })
        .populate('tableIds')
        .populate('waiterId', 'username')
        .populate('tiendaId', 'nombre');

      if (!account) {
        return errorResponse(res, 'Cuenta no encontrada', 404);
      }

      // Modo de pago de items sin asignar
      const isPayingUnassigned = payUnassigned || !subcuentaName;

      let subcuenta = null;
      let subtotal = 0;

      if (!isPayingUnassigned) {
        // Pago de subcuenta normal
        subcuenta = account.subcuentas.find(s => s.name === subcuentaName);
        if (!subcuenta) {
          return errorResponse(res, 'Subcuenta no encontrada', 404);
        }

        if (subcuenta.isPaid) {
          return errorResponse(res, 'Esta subcuenta ya fue pagada', 400);
        }

        // Calcular subtotal de la subcuenta
        subtotal = account.getSubcuentaSubtotal(subcuentaName);
      } else {
        // Pago de items sin asignar
        // Calcular subtotal de items sin asignar
        account.orders.forEach(order => {
          order.items.forEach(item => {
            if (item.status !== 'cancelled' && !item.subcuentaName) {
              subtotal += item.price * item.quantity;
            }
          });
        });

        if (subtotal === 0) {
          return errorResponse(res, 'No hay items sin asignar para pagar', 400);
        }
      }

      // Calcular propina
      let finalTipAmount = 0;
      if (tipType === 'percentage' && tipPercentage) {
        finalTipAmount = (subtotal * tipPercentage) / 100;
      } else if (tipType === 'fixed' && tipAmount) {
        finalTipAmount = tipAmount;
      }

      // Calcular total con descuento proporcional
      // Total de venta NO incluye propina - la propina es un ingreso adicional separado
      const finalDiscount = proportionalDiscount || 0;
      const total = subtotal - finalDiscount;

      // Crear venta para esta subcuenta o items sin asignar
      const Sale = require('../sales/model');
      const { getNextSequence } = require('../../shared/utils/counterHelper');
      const saleItems = [];

      account.orders.forEach(order => {
        order.items.forEach(item => {
          if (item.status !== 'cancelled') {
            // Para subcuenta: coincide el nombre
            // Para sin asignar: no tiene subcuentaName
            const shouldInclude = isPayingUnassigned
              ? !item.subcuentaName
              : item.subcuentaName === subcuentaName;

            if (shouldInclude) {
              saleItems.push({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                name: item.name,
                note: item.note
              });
            }
          }
        });
      });

      // Usar el folio de la cuenta (ya generado al crear la cuenta)
      // Agregar sufijo para identificar la subcuenta (ej: 00025-SC1, 00025-SC2)
      const subcuentaIndex = account.subcuentas.findIndex(s => s.name === subcuentaName);
      const folio = isPayingUnassigned
        ? `${account.folio}-UN`
        : `${account.folio}-SC${subcuentaIndex + 1}`;

      // Map payment method to correct enum value
      const methodMap = {
        'cash': 'efectivo',
        'card': 'tarjeta',
        'transfer': 'transferencia',
        'mixed': 'efectivo' // Para pago mixto, usar efectivo como método principal
      };

      const sale = new Sale({
        tenantId,
        folio,
        tienda: account.tiendaId._id,
        turno: account.turnoId,
        user: userId,
        items: saleItems,
        total,
        discount: finalDiscount,
        method: methodMap[paymentMethod] || paymentMethod,
        paymentType: paymentType || 'single',
        mixedPayments: paymentType === 'mixed' && mixedPayments ? mixedPayments : undefined,
        tip: {
          amount: finalTipAmount,
          percentage: tipPercentage || 0,
          type: tipType || 'none'
        },
        cliente: null,
        status: 'entregado_y_cobrado',
        sourceAccount: account._id,
        restaurantInfo: {
          tableNumber: account.tableIds.map(t => t.number).join('+'),
          tableId: account.tableIds[0]?._id,
          waiterId: account.waiterId._id,
          waiterName: account.waiterId.username
        }
      });

      await sale.save();

      // Actualizar subcuenta (solo si no estamos pagando items sin asignar)
      if (!isPayingUnassigned) {
        subcuenta.isPaid = true;
        subcuenta.paidAt = new Date();
        subcuenta.paidBy = userId;
        subcuenta.paymentMethod = methodMap[paymentMethod] || paymentMethod;
        subcuenta.paymentType = paymentType || 'single';
        subcuenta.mixedPayments = paymentType === 'mixed' && mixedPayments ? mixedPayments : undefined;
        subcuenta.tip = {
          amount: finalTipAmount,
          percentage: tipPercentage,
          type: tipType || 'none'
        };
        subcuenta.subtotal = subtotal;
        subcuenta.total = total;
        subcuenta.saleId = sale._id;
      } else {
        // Si estamos pagando items sin asignar, asignarles una subcuenta especial "__UNASSIGNED_PAID__"
        // para que no se cuenten como pendientes
        account.orders.forEach(order => {
          order.items.forEach(item => {
            if (item.status !== 'cancelled' && !item.subcuentaName) {
              item.subcuentaName = '__UNASSIGNED_PAID__';
            }
          });
        });
      }

      // Agregar a finalSales
      if (!account.finalSales) {
        account.finalSales = [];
      }
      account.finalSales.push(sale._id);

      // Si todas las subcuentas están pagadas y no hay items sin asignar, cerrar cuenta
      const allPaid = account.areAllSubcuentasPaid();
      const unassignedItems = account.getUnassignedItems();

      if (allPaid && unassignedItems.length === 0) {
        account.changeStatus('paid', userId, 'Todas las subcuentas pagadas y sin items pendientes');
        account.closedAt = new Date();

        // Liberar todas las mesas
        const Table = require('../tables/model');
        for (const tableId of account.tableIds) {
          const table = await Table.findById(tableId);
          if (table) {
            await table.release();
          }
        }
      }

      await account.save();

      const message = isPayingUnassigned ? 'Items sin asignar pagados exitosamente' : 'Subcuenta pagada exitosamente';
      return successResponse(res, { account, sale, subcuenta }, message, 201);
    } catch (error) {
      console.error('Error pagando subcuenta:', error);
      return errorResponse(res, 'Error al pagar subcuenta', 500);
    }
  }
}

module.exports = new AccountsController();
