const Order = require('../../modules/delivery/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class DeliveryController {
  // Crear nueva orden
  async create(req, res) {
    try {
      const { proveedor, producto, cantidad, unidad, fechaEmision, tienda } = req.body;
      
      if (!proveedor || !producto || !cantidad || !fechaEmision) {
        return errorResponse(res, 'Faltan campos obligatorios: proveedor, producto, cantidad, fechaEmision', 400);
      }
      
      if (isNaN(cantidad) || cantidad <= 0) {
        return errorResponse(res, 'La cantidad debe ser un número mayor a 0', 400);
      }
      
      const emisionDate = new Date(fechaEmision);
      if (isNaN(emisionDate.getTime())) {
        return errorResponse(res, 'Fecha de emisión inválida', 400);
      }

      const newOrder = new Order({
        proveedor: proveedor.trim(),
        producto: producto.trim(),
        cantidad: parseFloat(cantidad),
        unidad: unidad || 'pza',
        fechaEmision: emisionDate,
        status: 'pendiente',
        createdBy: req.userId,
        tienda
      });

      await newOrder.save();
      
      const populatedOrder = await Order.findById(newOrder._id)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre');
      
      return successResponse(res, { order: populatedOrder }, 'Orden creada exitosamente', 201);
    } catch (error) {
      console.error('Error al crear orden:', error);
      return errorResponse(res, 'Error al crear la orden', 500);
    }
  }

  // Obtener todas las órdenes
  async getAll(req, res) {
    try {
      const { status, proveedor, startDate, endDate, tiendaId, limit = 50, page = 1 } = req.query;
      
      const filter = {};
      
      if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
        filter.status = status;
      }
      if (proveedor) {
        filter.proveedor = { $regex: proveedor, $options: 'i' };
      }
      if (tiendaId) {
        filter.tienda = tiendaId;
      }
      
      if (startDate || endDate) {
        filter.fechaEmision = {};
        if (startDate) filter.fechaEmision.$gte = new Date(startDate);
        if (endDate) filter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const orders = await Order.find(filter)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .sort({ fechaEmision: -1 })
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Order.countDocuments(filter);
      
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
      console.error('Error al obtener órdenes:', error);
      return errorResponse(res, 'Error al obtener órdenes', 500);
    }
  }

  // Actualizar orden
  async update(req, res) {
    try {
      const { status, fechaEntrega, nota } = req.body;
      const { id } = req.params;
      
      const order = await Order.findById(id);
      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }
      
      // Solo admin o el creador pueden actualizar
      const currentUser = await User.findById(req.userId);
      if (currentUser.role !== 'admin' && order.createdBy.toString() !== req.userId) {
        return errorResponse(res, 'Solo puedes actualizar tus propias órdenes o ser administrador', 403);
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
        if (entregaDate < order.fechaEmision) {
          return errorResponse(res, 'La fecha de entrega debe ser posterior a la fecha de emisión', 400);
        }
        updateFields.fechaEntrega = entregaDate;
      }
      
      if (nota !== undefined) {
        updateFields.nota = nota.trim();
      }
      
      const updatedOrder = await Order.findByIdAndUpdate(id, updateFields, { new: true })
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre');
      
      return successResponse(res, { order: updatedOrder }, 'Orden actualizada exitosamente');
    } catch (error) {
      console.error('Error al actualizar orden:', error);
      return errorResponse(res, 'Error al actualizar orden', 500);
    }
  }

  // Eliminar orden
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const order = await Order.findById(id);
      if (!order) {
        return errorResponse(res, 'Orden no encontrada', 404);
      }

      if (order.status !== 'completada' && order.status !== 'cancelada') {
        return errorResponse(res, 'Solo se pueden eliminar órdenes completadas o canceladas', 400);
      }

      await Order.findByIdAndDelete(id);
      
      return successResponse(res, { 
        deletedOrder: { _id: order._id, proveedor: order.proveedor, producto: order.producto }
      }, 'Orden eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar orden:', error);
      return errorResponse(res, 'Error al eliminar orden', 500);
    }
  }

  // Obtener mis órdenes
  async getMine(req, res) {
    try {
      const { status, limit = 20 } = req.query;
      const filter = { createdBy: req.userId };
      
      if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
        filter.status = status;
      }
      
      const orders = await Order.find(filter)
        .populate('tienda', 'nombre')
        .sort({ fechaEmision: -1 })
        .limit(parseInt(limit));
      
      return successResponse(res, orders, 'Órdenes obtenidas exitosamente');
    } catch (error) {
      console.error('Error al obtener mis órdenes:', error);
      return errorResponse(res, 'Error al obtener órdenes', 500);
    }
  }
}

module.exports = new DeliveryController();