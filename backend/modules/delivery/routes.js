const express = require('express');
const router = express.Router();
const deliveryController = require('../../controllers/modules/deliveryController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Rutas específicas primero (antes de rutas con parámetros)

// Obtener mis órdenes (del usuario actual)
router.get('/mine', verifyToken, deliveryController.getMine);

// Obtener tiendas para órdenes
router.get('/tiendas', verifyToken, async (req, res) => {
  try {
    const Tienda = require('../../core/tiendas/model');
    const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
    
    const tiendas = await Tienda.find({}, 'nombre').sort({ nombre: 1 });
    return successResponse(res, tiendas, 'Tiendas obtenidas exitosamente');
  } catch (err) {
    console.error('Error fetching tiendas for orders:', err);
    const { errorResponse } = require('../../shared/utils/responseHelper');
    return errorResponse(res, 'Error al obtener tiendas', 500);
  }
});

// Obtener usuarios para asignación
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    const User = require('../../core/users/model');
    const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
    
    // Obtener información del usuario actual
    const currentUser = await User.findById(req.userId).populate('tienda');
    
    let filter = { role: { $in: ['vendedor', 'repartidor'] } };
    
    // Control de acceso por rol
    if (currentUser.role === 'admin') {
      // Admin puede filtrar por tienda específica o ver todos
      if (tiendaId) {
        filter.tienda = tiendaId;
      }
    } else {
      // Vendedores y repartidores solo ven usuarios de su propia tienda
      if (currentUser.tienda) {
        filter.tienda = currentUser.tienda._id;
      } else {
        // Si no tiene tienda asignada, no ve ningún usuario
        return successResponse(res, [], 'Usuarios obtenidos exitosamente');
      }
    }
    
    const users = await User.find(filter, 'username role tienda')
      .populate('tienda', 'nombre')
      .sort({ username: 1 });
    
    return successResponse(res, users, 'Usuarios obtenidos exitosamente');
  } catch (err) {
    console.error('Error fetching users for assignment:', err);
    const { errorResponse } = require('../../shared/utils/responseHelper');
    return errorResponse(res, 'Error al obtener usuarios', 500);
  }
});

// Reporte de órdenes (solo admin)
router.get('/report/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tiendaId } = req.query;
    const Order = require('./model');
    const mongoose = require('mongoose');
    const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
    
    const matchFilter = {};
    
    // Filtros de fecha
    if (startDate || endDate) {
      matchFilter.fechaEmision = {};
      if (startDate) matchFilter.fechaEmision.$gte = new Date(startDate);
      if (endDate) matchFilter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
      matchFilter.tienda = mongoose.Types.ObjectId(tiendaId);
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
    console.error('Error en reporte de órdenes:', error);
    const { errorResponse } = require('../../shared/utils/responseHelper');
    return errorResponse(res, 'Error al generar reporte', 500);
  }
});

// Rutas principales (CRUD)

// Crear nueva orden
router.post('/', verifyToken, deliveryController.create);

// Obtener todas las órdenes
router.get('/', verifyToken, deliveryController.getAll);

// Obtener orden por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const Order = require('./model');
    const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
    const mongoose = require('mongoose');
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'ID de orden inválido', 400);
    }
    
    const order = await Order.findById(id)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .populate('assignedTo', 'username role');
    
    if (!order) {
      return errorResponse(res, 'Orden no encontrada', 404);
    }
    
    return successResponse(res, order, 'Orden obtenida exitosamente');
  } catch (error) {
    console.error('Error al obtener orden:', error);
    const { errorResponse } = require('../../shared/utils/responseHelper');
    return errorResponse(res, 'Error al obtener orden', 500);
  }
});

// Actualizar orden
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { status, fechaEntrega, nota, assignedTo } = req.body;
    const Order = require('./model');
    const User = require('../../core/users/model');
    const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
    const mongoose = require('mongoose');
    
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, 'ID de orden inválido', 400);
    }
    
    // Verificar que la orden existe
    const order = await Order.findById(id);
    if (!order) {
      return errorResponse(res, 'Orden no encontrada', 404);
    }
    
    // Solo admin, creador o usuario asignado pueden actualizar
    const currentUser = await User.findById(req.userId);
    
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
    
    if (assignedTo !== undefined) {
      updateFields.assignedTo = assignedTo || null;
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
    console.error('Error al actualizar orden:', error);
    const { errorResponse } = require('../../shared/utils/responseHelper');
    return errorResponse(res, 'Error al actualizar orden', 500);
  }
});

// Eliminar orden
router.delete('/:id', verifyToken, requireAdmin, deliveryController.delete);

module.exports = router;