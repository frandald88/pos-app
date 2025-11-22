const Order = require('../../core/delivery/model');
const User = require('../../core/users/model');
const Tienda = require('../../modules/tiendas/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class DeliveryController {
  /**
   * Obtener mis ordenes (del usuario actual)
   */
  async getMine(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, limit = 20 } = req.query;
      const filter = { tenantId: req.tenantId, createdBy: req.userId };

      if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
        filter.status = status;
      }

      const orders = await Order.find(filter)
        .populate('tienda', 'nombre')
        .sort({ fechaEmision: -1 })
        .limit(parseInt(limit));

      return successResponse(res, orders, 'Ordenes obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo mis ordenes:', error);
      return errorResponse(res, 'Error al obtener ordenes', 500);
    }
  }

  /**
   * Obtener tiendas para ordenes
   */
  async getTiendas(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const tiendas = await Tienda.find({ tenantId: req.tenantId }, 'nombre').sort({ nombre: 1 });
      return successResponse(res, tiendas, 'Tiendas obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo tiendas:', error);
      return errorResponse(res, 'Error al obtener tiendas', 500);
    }
  }

  /**
   * Obtener usuarios para asignacion
   */
  async getUsers(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { tiendaId } = req.query;

      // Obtener informacion del usuario actual
      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId }).populate('tienda');

      let filter = { tenantId: req.tenantId, role: { $in: ['vendedor', 'repartidor'] } };

      // Control de acceso por rol
      if (currentUser.role === 'admin') {
        // Admin puede filtrar por tienda especifica o ver todos
        if (tiendaId) {
          filter.tienda = tiendaId;
        }
      } else {
        // Vendedores y repartidores solo ven usuarios de su propia tienda
        if (currentUser.tienda) {
          filter.tienda = currentUser.tienda._id;
        } else {
          // Si no tiene tienda asignada, no ve ningun usuario
          return successResponse(res, [], 'Usuarios obtenidos exitosamente');
        }
      }

      const users = await User.find(filter, 'username role tienda')
        .populate('tienda', 'nombre')
        .sort({ username: 1 });

      return successResponse(res, users, 'Usuarios obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return errorResponse(res, 'Error al obtener usuarios', 500);
    }
  }

  /**
   * Reporte de ordenes (solo admin)
   */
  async getReportSummary(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { startDate, endDate, tiendaId } = req.query;

      const matchFilter = { tenantId: req.tenantId };

      // Filtros de fecha
      if (startDate || endDate) {
        matchFilter.fechaEmision = {};
        if (startDate) matchFilter.fechaEmision.$gte = new Date(startDate);
        if (endDate) matchFilter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
      }

      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        matchFilter.tienda = new mongoose.Types.ObjectId(tiendaId);
      }

      const summary = await Order.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalOrdenes: { $sum: 1 },
            pendientes: {
              $sum: { $cond: [{ $eq: ['$status', 'pendiente'] }, 1, 0] }
            },
            completadas: {
              $sum: { $cond: [{ $eq: ['$status', 'completada'] }, 1, 0] }
            },
            canceladas: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelada'] }, 1, 0] }
            },
            proveedores: { $addToSet: '$proveedor' }
          }
        }
      ]);

      const result = summary[0] || {
        totalOrdenes: 0,
        pendientes: 0,
        completadas: 0,
        canceladas: 0,
        proveedores: []
      };

      return successResponse(res, {
        ...result,
        totalProveedores: result.proveedores.length
      }, 'Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      return errorResponse(res, 'Error al generar reporte', 500);
    }
  }

  /**
   * Crear nueva orden
   */
  async createOrder(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { proveedor, producto, cantidad, unidad, fechaEmision, tienda, assignedTo } = req.body;

      if (!proveedor || !producto || !cantidad || !fechaEmision) {
        return errorResponse(res, 'Faltan campos obligatorios: proveedor, producto, cantidad, fechaEmision', 400);
      }

      if (!assignedTo) {
        return errorResponse(res, 'Debes asignar la orden a un usuario', 400);
      }

      if (isNaN(cantidad) || cantidad <= 0) {
        return errorResponse(res, 'La cantidad debe ser un numero mayor a 0', 400);
      }

      const emisionDate = new Date(fechaEmision);
      if (isNaN(emisionDate.getTime())) {
        return errorResponse(res, 'Fecha de emision invalida', 400);
      }

      const newOrder = new Order({
        tenantId: req.tenantId,
        proveedor: proveedor.trim(),
        producto: producto.trim(),
        cantidad: parseFloat(cantidad),
        unidad: unidad || 'pza',
        fechaEmision: emisionDate,
        status: 'pendiente',
        createdBy: req.userId,
        tienda,
        assignedTo
      });

      await newOrder.save();

      const populatedOrder = await Order.findById(newOrder._id)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .populate('assignedTo', 'username role');

      return successResponse(res, { order: populatedOrder }, 'Orden creada exitosamente', 201);
    } catch (error) {
      console.error('Error creando orden:', error);
      return errorResponse(res, 'Error al crear la orden', 500);
    }
  }

  /**
   * Obtener todas las ordenes
   */
  async getAll(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, proveedor, startDate, endDate, tiendaId, limit = 50, page = 1 } = req.query;

      // Convertir tenantId a ObjectId para que funcione tanto en find como en aggregation
      const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);
      const filter = { tenantId: tenantObjectId };

      if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
        filter.status = status;
      }
      if (proveedor) {
        filter.proveedor = { $regex: proveedor, $options: 'i' };
      }
      if (tiendaId) {
        // Convertir a ObjectId para agregacion
        if (mongoose.Types.ObjectId.isValid(tiendaId)) {
          filter.tienda = new mongoose.Types.ObjectId(tiendaId);
        } else {
          filter.tienda = tiendaId;
        }
      }

      if (startDate || endDate) {
        filter.fechaEmision = {};
        if (startDate) filter.fechaEmision.$gte = new Date(startDate);
        if (endDate) filter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      // Determinar orden
      let ordersQuery;

      if (filter.status === 'pendiente') {
        // Filtro de pendientes: mas viejas primero
        ordersQuery = Order.find(filter)
          .populate('createdBy', 'username')
          .populate('tienda', 'nombre')
          .populate('assignedTo', 'username role')
          .sort({ fechaEmision: 1 })
          .skip(skip)
          .limit(parseInt(limit));
      } else if (filter.status) {
        // Filtro de completadas o canceladas: mas nuevas primero
        ordersQuery = Order.find(filter)
          .populate('createdBy', 'username')
          .populate('tienda', 'nombre')
          .populate('assignedTo', 'username role')
          .sort({ fechaEmision: -1 })
          .skip(skip)
          .limit(parseInt(limit));
      } else {
        // Sin filtro de status: usar agregacion para ordenar por prioridad de status
        const pipeline = [];

        // Agregar filtro de tienda si existe
        if (Object.keys(filter).length > 0) {
          pipeline.push({ $match: filter });
        }

        pipeline.push(
          {
            $addFields: {
              statusPriority: {
                $switch: {
                  branches: [
                    { case: { $eq: ['$status', 'pendiente'] }, then: 1 },
                    { case: { $eq: ['$status', 'completada'] }, then: 2 },
                    { case: { $eq: ['$status', 'cancelada'] }, then: 3 }
                  ],
                  default: 4
                }
              }
            }
          },
          {
            $sort: {
              statusPriority: 1,  // Primero pendientes
              fechaEmision: 1     // Dentro de cada status, mas viejas primero
            }
          },
          { $skip: skip },
          { $limit: parseInt(limit) }
        );

        const ordersRaw = await Order.aggregate(pipeline);

        // Poblar manualmente despues de agregacion
        const orders = await Order.populate(ordersRaw, [
          { path: 'createdBy', select: 'username' },
          { path: 'tienda', select: 'nombre' },
          { path: 'assignedTo', select: 'username role' }
        ]);

        const total = await Order.countDocuments(filter);

        return successResponse(res, {
          orders,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }, 'Ordenes obtenidas exitosamente');
      }

      const orders = await ordersQuery;
      const total = await Order.countDocuments(filter);

      return successResponse(res, {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Ordenes obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo ordenes:', error);
      return errorResponse(res, 'Error al obtener ordenes', 500);
    }
  }

  /**
   * Obtener orden por ID
   */
  async getById(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de orden invalido', 400);
      }

      const order = await Order.findOne({ _id: id, tenantId: req.tenantId })
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .populate('assignedTo', 'username role');

      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }

      return successResponse(res, order, 'Orden obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo orden:', error);
      return errorResponse(res, 'Error al obtener orden', 500);
    }
  }

  /**
   * Actualizar orden
   */
  async updateOrder(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, fechaEntrega, nota } = req.body;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de orden invalido', 400);
      }

      // Verificar que la orden existe
      const order = await Order.findOne({ _id: id, tenantId: req.tenantId });
      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }

      // Solo admin, creador o usuario asignado pueden actualizar
      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId });

      const canUpdate = currentUser.role === 'admin' ||
                       order.createdBy.toString() === req.userId ||
                       (order.assignedTo && order.assignedTo.toString() === req.userId);

      if (!canUpdate) {
        return errorResponse(res, 'No tienes permisos para actualizar esta orden', 403);
      }

      const updateFields = {};

      // Validar y agregar campos
      if (status) {
        if (!['pendiente', 'completada', 'cancelada'].includes(status)) {
          return errorResponse(res, 'Estado invalido', 400);
        }
        updateFields.status = status;
      }

      if (fechaEntrega) {
        const entregaDate = new Date(fechaEntrega);
        if (isNaN(entregaDate.getTime())) {
          return errorResponse(res, 'Fecha de entrega invalida', 400);
        }

        // Normalizar ambas fechas a medianoche para comparacion de solo dia
        const entregaNormalized = new Date(entregaDate);
        entregaNormalized.setHours(0, 0, 0, 0);

        const emisionNormalized = new Date(order.fechaEmision);
        emisionNormalized.setHours(0, 0, 0, 0);

        if (entregaNormalized < emisionNormalized) {
          return errorResponse(res, 'La fecha de entrega no puede ser anterior a la fecha de emision', 400);
        }
        updateFields.fechaEntrega = entregaDate;
      }

      if (nota !== undefined) {
        updateFields.nota = nota.trim();
      }

      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        updateFields,
        { new: true }
      ).populate('createdBy', 'username')
       .populate('tienda', 'nombre')
       .populate('assignedTo', 'username role');

      return successResponse(res, { order: updatedOrder }, 'Orden actualizada exitosamente');
    } catch (error) {
      console.error('Error actualizando orden:', error);
      return errorResponse(res, 'Error al actualizar orden', 500);
    }
  }

  /**
   * Eliminar orden (solo admin)
   */
  async deleteOrder(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { id } = req.params;

      const order = await Order.findOne({ _id: id, tenantId: req.tenantId });
      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }

      if (order.status !== 'completada' && order.status !== 'cancelada') {
        return errorResponse(res, 'Solo se pueden eliminar ordenes completadas o canceladas', 400);
      }

      await Order.findByIdAndDelete(id);

      return successResponse(res, {
        deletedOrder: { _id: order._id, proveedor: order.proveedor, producto: order.producto }
      }, 'Orden eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando orden:', error);
      return errorResponse(res, 'Error al eliminar orden', 500);
    }
  }
}

module.exports = new DeliveryController();
