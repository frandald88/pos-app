const PurchaseOrder = require('../../modules/purchaseOrders/model');
const User = require('../../core/users/model');
const Tienda = require('../../modules/tiendas/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class PurchaseOrdersController {
  /**
   * Obtener tiendas para órdenes
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
   * Obtener usuarios para asignación
   */
  async getUsers(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { tiendaId } = req.query;

      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId }).populate('tienda');

      let filter = { tenantId: req.tenantId, role: { $in: ['vendedor', 'repartidor'] } };

      if (currentUser.role === 'admin') {
        if (tiendaId) {
          filter.tienda = tiendaId;
        }
      } else {
        if (currentUser.tienda) {
          filter.tienda = currentUser.tienda._id;
        } else {
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
   * Crear nueva orden
   */
  async create(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { proveedor, producto, cantidad, unidad, fechaEmision, tienda, assignedTo } = req.body;

      if (!proveedor || !producto || !cantidad || !fechaEmision) {
        return errorResponse(res, 'Faltan campos obligatorios: proveedor, producto, cantidad, fechaEmision', 400);
      }

      if (!tienda) {
        return errorResponse(res, 'La tienda es requerida', 400);
      }

      if (!assignedTo) {
        return errorResponse(res, 'Debes asignar la orden a un usuario', 400);
      }

      if (isNaN(cantidad) || cantidad <= 0) {
        return errorResponse(res, 'La cantidad debe ser un número mayor a 0', 400);
      }

      const emisionDate = new Date(fechaEmision);
      if (isNaN(emisionDate.getTime())) {
        return errorResponse(res, 'Fecha de emisión inválida', 400);
      }

      const newOrder = new PurchaseOrder({
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

      const populatedOrder = await PurchaseOrder.findById(newOrder._id)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .populate('assignedTo', 'username role');

      return successResponse(res, { order: populatedOrder }, 'Orden creada exitosamente', 201);
    } catch (error) {
      console.error('Error creando orden:', error.message, error.stack);
      return errorResponse(res, `Error al crear la orden: ${error.message}`, 500);
    }
  }

  /**
   * Obtener todas las órdenes
   */
  async getAll(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, proveedor, startDate, endDate, tiendaId, limit = 50, page = 1 } = req.query;

      // Convertir tenantId a ObjectId para aggregation
      const tenantObjectId = new mongoose.Types.ObjectId(req.tenantId);
      const filter = { tenantId: tenantObjectId };

      if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
        filter.status = status;
      }
      if (proveedor) {
        filter.proveedor = { $regex: proveedor, $options: 'i' };
      }
      if (tiendaId) {
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

      let ordersQuery;

      if (filter.status === 'pendiente') {
        ordersQuery = PurchaseOrder.find(filter)
          .populate('createdBy', 'username')
          .populate('tienda', 'nombre')
          .populate('assignedTo', 'username role')
          .sort({ fechaEmision: 1 })
          .skip(skip)
          .limit(parseInt(limit));
      } else if (filter.status) {
        ordersQuery = PurchaseOrder.find(filter)
          .populate('createdBy', 'username')
          .populate('tienda', 'nombre')
          .populate('assignedTo', 'username role')
          .sort({ fechaEmision: -1 })
          .skip(skip)
          .limit(parseInt(limit));
      } else {
        // Sin filtro de status: usar aggregation para ordenar por prioridad
        const pipeline = [
          { $match: filter },
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
              statusPriority: 1,
              fechaEmision: 1
            }
          },
          { $skip: skip },
          { $limit: parseInt(limit) }
        ];

        const ordersRaw = await PurchaseOrder.aggregate(pipeline);

        const orders = await PurchaseOrder.populate(ordersRaw, [
          { path: 'createdBy', select: 'username' },
          { path: 'tienda', select: 'nombre' },
          { path: 'assignedTo', select: 'username role' }
        ]);

        const total = await PurchaseOrder.countDocuments(filter);

        return successResponse(res, {
          orders,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }, 'Órdenes obtenidas exitosamente');
      }

      const orders = await ordersQuery;
      const total = await PurchaseOrder.countDocuments(filter);

      return successResponse(res, {
        orders,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Órdenes obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      return errorResponse(res, 'Error al obtener órdenes', 500);
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
        return errorResponse(res, 'ID de orden inválido', 400);
      }

      const order = await PurchaseOrder.findOne({ _id: id, tenantId: req.tenantId })
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
  async update(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, fechaEntrega, nota } = req.body;
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de orden inválido', 400);
      }

      const order = await PurchaseOrder.findOne({ _id: id, tenantId: req.tenantId });
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

      if (status) {
        if (!['pendiente', 'completada', 'cancelada'].includes(status)) {
          return errorResponse(res, 'Estado inválido', 400);
        }
        updateFields.status = status;
      }

      if (fechaEntrega) {
        const entregaDate = new Date(fechaEntrega);
        if (isNaN(entregaDate.getTime())) {
          return errorResponse(res, 'Fecha de entrega inválida', 400);
        }

        const entregaNormalized = new Date(entregaDate);
        entregaNormalized.setHours(0, 0, 0, 0);

        const emisionNormalized = new Date(order.fechaEmision);
        emisionNormalized.setHours(0, 0, 0, 0);

        if (entregaNormalized < emisionNormalized) {
          return errorResponse(res, 'La fecha de entrega no puede ser anterior a la fecha de emisión', 400);
        }
        updateFields.fechaEntrega = entregaDate;
      }

      if (nota !== undefined) {
        updateFields.nota = nota.trim();
      }

      const updatedOrder = await PurchaseOrder.findByIdAndUpdate(
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
  async delete(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { id } = req.params;

      const order = await PurchaseOrder.findOne({ _id: id, tenantId: req.tenantId });
      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }

      if (order.status !== 'completada' && order.status !== 'cancelada') {
        return errorResponse(res, 'Solo se pueden eliminar órdenes completadas o canceladas', 400);
      }

      await PurchaseOrder.findByIdAndDelete(id);

      return successResponse(res, {
        deletedOrder: { _id: order._id, proveedor: order.proveedor, producto: order.producto }
      }, 'Orden eliminada exitosamente');
    } catch (error) {
      console.error('Error eliminando orden:', error);
      return errorResponse(res, 'Error al eliminar orden', 500);
    }
  }
}

module.exports = new PurchaseOrdersController();
