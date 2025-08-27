const express = require('express');
const router = express.Router();
const Order = require('./model');
const User = require('../../core/users/model');
const mongoose = require('mongoose'); // ← AGREGAR ESTA LÍNEA
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ MIGRADO + MEJORADO: Crear nueva orden
router.post('/', verifyToken, async (req, res) => {
  try {
    const { proveedor, producto, cantidad, unidad, fechaEmision, tienda, assignedTo } = req.body;
    
    // Validaciones
    if (!proveedor || !producto || !cantidad || !fechaEmision) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: proveedor, producto, cantidad, fechaEmision' 
      });
    }
    
    if (isNaN(cantidad) || cantidad <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser un número mayor a 0' });
    }
    
    const emisionDate = new Date(fechaEmision);
    if (isNaN(emisionDate.getTime())) {
      return res.status(400).json({ message: 'Fecha de emisión inválida' });
    }

    const newOrder = new Order({
      proveedor: proveedor.trim(),
      producto: producto.trim(),
      cantidad: parseFloat(cantidad),
      unidad: unidad || 'pza',
      fechaEmision: emisionDate,
      status: 'pendiente',
      createdBy: req.userId,
      tienda,
      assignedTo: assignedTo || null
    });

    await newOrder.save();
    
    const populatedOrder = await Order.findById(newOrder._id)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .populate('assignedTo', 'username role');
    
    res.status(201).json({ 
      message: 'Orden creada exitosamente',
      order: populatedOrder
    });
  } catch (error) {
    console.error('Error al crear orden:', error);
    res.status(500).json({ 
      message: 'Error al crear la orden', 
      error: error.message 
    });
  }
});

// ✅ MIGRADO + MEJORADO: Obtener todas las órdenes
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      status, 
      proveedor, 
      startDate, 
      endDate, 
      tiendaId, 
      limit = 50,
      page = 1 
    } = req.query;
    
    const filter = {};
    
    // Filtros
    if (status && ['pendiente', 'completada', 'cancelada'].includes(status)) {
      filter.status = status;
    }
    if (proveedor) {
      filter.proveedor = { $regex: proveedor, $options: 'i' };
    }
    if (tiendaId) {
      filter.tienda = tiendaId;
    }
    
    // Filtro por fechas de emisión
    if (startDate || endDate) {
      filter.fechaEmision = {};
      if (startDate) filter.fechaEmision.$gte = new Date(startDate);
      if (endDate) filter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const orders = await Order.find(filter)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .populate('assignedTo', 'username role')
      .sort({ fechaEmision: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Order.countDocuments(filter);
    
    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ 
      message: 'Error al obtener órdenes', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Obtener mis órdenes (del usuario actual)
router.get('/mine', verifyToken, async (req, res) => {
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
    
    res.json(orders);
  } catch (error) {
    console.error('Error al obtener mis órdenes:', error);
    res.status(500).json({ 
      message: 'Error al obtener órdenes', 
      error: error.message 
    });
  }
});

// ✅ MIGRADO + MEJORADO: Actualizar status, fechaEntrega y nota
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { status, fechaEntrega, nota, assignedTo } = req.body;
    
    // Verificar que la orden existe
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    // Solo admin, creador o usuario asignado pueden actualizar
    const currentUser = await User.findById(req.userId);
    
    const canUpdate = currentUser.role === 'admin' || 
                     order.createdBy.toString() === req.userId ||
                     (order.assignedTo && order.assignedTo.toString() === req.userId);
    
    if (!canUpdate) {
      return res.status(403).json({ 
        message: 'No tienes permisos para actualizar esta orden' 
      });
    }
    
    const updateFields = {};
    
    // Validar y agregar campos
    if (status) {
      if (!['pendiente', 'completada', 'cancelada'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido' });
      }
      updateFields.status = status;
    }
    
    if (fechaEntrega) {
      const entregaDate = new Date(fechaEntrega);
      if (isNaN(entregaDate.getTime())) {
        return res.status(400).json({ message: 'Fecha de entrega inválida' });
      }
      if (entregaDate < order.fechaEmision) {
        return res.status(400).json({ 
          message: 'La fecha de entrega debe ser posterior a la fecha de emisión' 
        });
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
      req.params.id, 
      updateFields,
      { new: true }
    ).populate('createdBy', 'username')
     .populate('tienda', 'nombre')
     .populate('assignedTo', 'username role');
    
    res.json({ 
      message: 'Orden actualizada exitosamente',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error al actualizar orden:', error);
    res.status(500).json({ 
      message: 'Error al actualizar orden', 
      error: error.message 
    });
  }
});

// ✅ MIGRADO + MEJORADO: Eliminar una orden (solo si está completada o cancelada)
router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    if (order.status !== 'completada' && order.status !== 'cancelada') {
      return res.status(400).json({ 
        message: 'Solo se pueden eliminar órdenes completadas o canceladas' 
      });
    }

    await Order.findByIdAndDelete(req.params.id);
    
    res.json({ 
      message: 'Orden eliminada exitosamente',
      deletedOrder: {
        _id: order._id,
        proveedor: order.proveedor,
        producto: order.producto
      }
    });
  } catch (error) {
    console.error('Error al eliminar orden:', error);
    res.status(500).json({ 
      message: 'Error al eliminar orden', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Obtener tiendas para órdenes (todos los usuarios) - DEBE IR ANTES DE /:id
router.get('/tiendas', verifyToken, async (req, res) => {
  try {
    const Tienda = require('../../core/tiendas/model');
    const tiendas = await Tienda.find({}, 'nombre').sort({ nombre: 1 });
    
    res.json(tiendas);
  } catch (err) {
    console.error('Error fetching tiendas for orders:', err);
    res.status(500).json({ message: 'Error al obtener tiendas', error: err.message });
  }
});

// ✅ NUEVO: Obtener usuarios para asignación (vendedores y repartidores)
router.get('/users', verifyToken, async (req, res) => {
  try {
    const { tiendaId } = req.query;
    
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
        return res.json([]);
      }
    }
    
    const users = await User.find(filter, 'username role tienda')
      .populate('tienda', 'nombre')
      .sort({ username: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching users for assignment:', err);
    res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
  }
});

// ✅ NUEVO: Obtener orden por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('tienda', 'nombre')
      .populate('assignedTo', 'username role');
    
    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ 
      message: 'Error al obtener orden', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Reporte de órdenes (solo admin)
router.get('/report/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tiendaId } = req.query;
    const matchFilter = {};
    
    // Filtros de fecha
    if (startDate || endDate) {
      matchFilter.fechaEmision = {};
      if (startDate) matchFilter.fechaEmision.$gte = new Date(startDate);
      if (endDate) matchFilter.fechaEmision.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (tiendaId) {
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
    
    res.json({
      ...result,
      totalProveedores: result.proveedores.length
    });
  } catch (error) {
    console.error('Error en reporte de órdenes:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte', 
      error: error.message 
    });
  }
});

module.exports = router;