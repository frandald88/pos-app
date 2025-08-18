const express = require('express');
const router = express.Router();
const Return = require('../models/Return');
const Sale = require('../models/Sale');
const Product = require('../models/Product');
const { verifyToken } = require('../middleware/authMiddleware');

// ✅ Crear devolución (mejorado)
router.post('/', verifyToken, async (req, res) => {
  const { saleId, returnedItems, refundAmount, refundMethod, customerNotes } = req.body;
  
  try {
    // Validaciones básicas
    if (!saleId || !returnedItems || !refundAmount) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: saleId, returnedItems, refundAmount' 
      });
    }

    if (!Array.isArray(returnedItems) || returnedItems.length === 0) {
      return res.status(400).json({ 
        message: 'returnedItems debe ser un array con al menos un elemento' 
      });
    }

    if (refundAmount <= 0) {
      return res.status(400).json({ 
        message: 'El monto de devolución debe ser mayor a 0' 
      });
    }

    // Buscar la venta original
    const sale = await Sale.findById(saleId);
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

    // Verificar que no se exceda el monto total de la venta
    const currentReturned = sale.totalReturned || 0;
    const maxRefundable = sale.total - currentReturned;
    
    if (refundAmount > maxRefundable) {
      return res.status(400).json({ 
        message: `El monto de devolución (${refundAmount}) excede el máximo retornable (${maxRefundable.toFixed(2)})` 
      });
    }

    // Validar cada artículo devuelto
    for (const item of returnedItems) {
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ 
          message: 'Cada artículo debe tener una cantidad válida mayor a 0' 
        });
      }
      
      if (!item.reason) {
        return res.status(400).json({ 
          message: 'Cada artículo debe tener una razón de devolución' 
        });
      }
    }

    // Actualizar stock de productos devueltos
    for (const item of returnedItems) {
      if (item.productId) {
        const product = await Product.findById(item.productId);
        if (product) {
          await Product.findByIdAndUpdate(
            item.productId, 
            { $inc: { stock: item.quantity } }
          );
        }
      }
    }

    // Actualizar el total de devoluciones en la venta
    await Sale.findByIdAndUpdate(
      saleId,
      { $inc: { totalReturned: refundAmount } }
    );

    // Registrar devolución
    const returnRecord = new Return({
      saleId,
      returnedItems,
      refundAmount,
      refundMethod: refundMethod || 'efectivo',
      customerNotes: customerNotes?.trim(),
      processedBy: req.userId,
      status: 'procesada'
    });

    await returnRecord.save();

    // Devolver la devolución con información poblada
    const populatedReturn = await Return.findById(returnRecord._id)
      .populate('saleId', 'total date')
      .populate('processedBy', 'username')
      .populate('returnedItems.productId', 'name sku');

    res.status(201).json({ 
      message: 'Devolución registrada correctamente',
      return: populatedReturn,
      saleInfo: {
        totalOriginal: sale.total,
        totalReturned: sale.totalReturned + refundAmount,
        remaining: sale.total - (sale.totalReturned + refundAmount)
      }
    });

  } catch (error) {
    if (error.message.includes('tienda') && error.message.includes('required')) {
      return res.status(400).json({
        message: 'No se puede devolver una venta que no tiene tienda asignada. Contacte a un administrador.',
      });
    }
    console.error('Error al crear devolución:', error);
    res.status(500).json({ message: 'Error interno al crear la devolución.' });
  }
});

// ✅ Obtener todas las devoluciones (mejorado con filtros)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      status, 
      refundMethod,
      limit = 50,
      page = 1 
    } = req.query;
    
    // Construir filtros
    const filter = {};
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    if (status && ['procesada', 'aprobada', 'rechazada', 'pendiente'].includes(status)) {
      filter.status = status;
    }
    
    if (refundMethod && ['efectivo', 'transferencia', 'tarjeta', 'credito_tienda'].includes(refundMethod)) {
      filter.refundMethod = refundMethod;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Obtener devoluciones con paginación
    const returns = await Return.find(filter)
      .populate('saleId', 'total date method')
      .populate('processedBy', 'username')
      .populate('returnedItems.productId', 'name sku')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Return.countDocuments(filter);
    
    // Estadísticas
    const stats = await Return.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDevoluciones: { $sum: 1 },
          montoTotalDevuelto: { $sum: '$refundAmount' }
        }
      }
    ]);
    
    const estadisticas = stats[0] || {
      totalDevoluciones: 0,
      montoTotalDevuelto: 0
    };

    res.json({
      returns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      estadisticas,
      filtros: { startDate, endDate, status, refundMethod }
    });

  } catch (error) {
    console.error('Error obteniendo devoluciones:', error);
    res.status(500).json({ message: 'Error interno', error: error.message });
  }
});

// ✅ Obtener devolución por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const returnRecord = await Return.findById(id)
      .populate('saleId', 'total date method items')
      .populate('processedBy', 'username')
      .populate('returnedItems.productId', 'name sku price');
    
    if (!returnRecord) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }
    
    res.json(returnRecord);
  } catch (error) {
    console.error('Error obteniendo devolución:', error);
    res.status(500).json({ message: 'Error al obtener devolución', error: error.message });
  }
});

// ✅ Actualizar estado de devolución (aprobar/rechazar)
router.patch('/:id/status', verifyToken, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const { id } = req.params;
    
    if (!['aprobada', 'rechazada'].includes(status)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Debe ser "aprobada" o "rechazada"' 
      });
    }
    
    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }
    
    if (returnRecord.status !== 'procesada') {
      return res.status(400).json({ 
        message: `Esta devolución ya está ${returnRecord.status}` 
      });
    }
    
    // Si se rechaza, revertir cambios en stock y venta
    if (status === 'rechazada') {
      // Revertir stock
      for (const item of returnRecord.returnedItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
          );
        }
      }
      
      // Revertir monto en la venta
      await Sale.findByIdAndUpdate(
        returnRecord.saleId,
        { $inc: { totalReturned: -returnRecord.refundAmount } }
      );
    }
    
    // Actualizar estado
    const updatedReturn = await Return.findByIdAndUpdate(
      id,
      { 
        status, 
        adminNotes: adminNotes?.trim(),
        updatedAt: new Date()
      },
      { new: true }
    ).populate('saleId', 'total date')
     .populate('processedBy', 'username');
    
    res.json({
      message: `Devolución ${status} correctamente`,
      return: updatedReturn
    });

  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ message: 'Error al actualizar estado', error: error.message });
  }
});

// ✅ Eliminar devolución (solo si está pendiente)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    const returnRecord = await Return.findById(id);
    if (!returnRecord) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }
    
    if (returnRecord.status === 'aprobada') {
      return res.status(400).json({ 
        message: 'No se puede eliminar una devolución aprobada' 
      });
    }
    
    // Revertir cambios si la devolución estaba procesada
    if (returnRecord.status === 'procesada') {
      // Revertir stock
      for (const item of returnRecord.returnedItems) {
        if (item.productId) {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
          );
        }
      }
      
      // Revertir monto en la venta
      await Sale.findByIdAndUpdate(
        returnRecord.saleId,
        { $inc: { totalReturned: -returnRecord.refundAmount } }
      );
    }
    
    await Return.findByIdAndDelete(id);
    
    res.json({ message: 'Devolución eliminada correctamente' });

  } catch (error) {
    console.error('Error eliminando devolución:', error);
    res.status(500).json({ message: 'Error al eliminar devolución', error: error.message });
  }
});

module.exports = router;