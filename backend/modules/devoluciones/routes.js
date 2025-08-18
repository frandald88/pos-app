const express = require('express');
const router = express.Router();
const Return = require('./model');
const Sale = require('../../core/sales/model');
const Product = require('../../core/products/model');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ MIGRADO + MEJORADO: Crear devolución
router.post('/', verifyToken, async (req, res) => {
  try {
    const { saleId, returnedItems, refundAmount, refundMethod, customerNotes } = req.body;
    console.log('Datos recibidos:', req.body);

    console.log('Campos individuales:', {
        saleId,
        returnedItems,
        refundAmount,
        refundMethod,
        customerNotes
      });
    
    
    // Validaciones básicas
    if (!saleId || !returnedItems || !refundAmount || !refundMethod) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: saleId, returnedItems, refundAmount, refundMethod' 
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
    
    // Verificar que la venta existe

          // ✅ NUEVO: Validar método de devolución según pago original
     
    const sale = await Sale.findById(saleId).populate('tienda', 'nombre');
    if (!sale) {
      return res.status(404).json({ message: 'Venta no encontrada' });
    }

     if (sale.paymentType === 'mixed') {
        // Para pagos mixtos, validar que los métodos de devolución coincidan
        if (!req.body.mixedRefunds || !Array.isArray(req.body.mixedRefunds)) {
          return res.status(400).json({ 
            message: 'Para ventas con pago mixto se requiere especificar mixedRefunds' 
          });
        }
        
        // Validar que no se exceda el monto por método
        for (const refund of req.body.mixedRefunds) {
          const originalPayment = sale.mixedPayments.find(p => p.method === refund.method);
          if (!originalPayment) {
            return res.status(400).json({ 
              message: `No se puede devolver por ${refund.method} porque no fue usado en la venta original` 
            });
          }
          if (refund.amount > originalPayment.amount) {
            return res.status(400).json({ 
              message: `No se puede devolver $${refund.amount} por ${refund.method}, máximo disponible: $${originalPayment.amount}` 
            });
          }
        }
      } else {
        // Para pagos únicos, el método debe coincidir
        if (refundMethod !== sale.method) {
          return res.status(400).json({ 
            message: `La devolución debe hacerse por ${sale.method} (método original de pago). Si necesita usar otro método, justifique la excepción.`,
            originalMethod: sale.method,
            requestedMethod: refundMethod
          });
        }
      } 
    
    // Verificar que la venta tiene tienda
    if (!sale.tienda) {
      return res.status(400).json({
        message: 'No se puede devolver una venta que no tiene tienda asignada. Contacte a un administrador.',
      });
    }
    
    // Verificar límite de devolución
    const currentReturned = sale.totalReturned || 0;
    const maxRefundable = sale.total - currentReturned;
    
    if (refundAmount > maxRefundable) {
      return res.status(400).json({ 
        message: `El monto de devolución ($${refundAmount}) excede el máximo retornable ($${maxRefundable.toFixed(2)})` 
      });
    }
    
    // Validar artículos devueltos
    const validatedItems = [];
    let totalCalculated = 0;
    
    for (const item of returnedItems) {
      if (!item.name || !item.quantity || !item.originalPrice) {
        return res.status(400).json({ 
          message: 'Cada artículo debe tener: name, quantity, originalPrice, reason' 
        });
      }
      
      if (item.quantity <= 0) {
        return res.status(400).json({ 
          message: 'La cantidad debe ser mayor a 0' 
        });
      }
      
      // Verificar que el artículo estaba en la venta original
      const originalItem = sale.items.find(saleItem => 
        saleItem.name === item.name || 
        (item.productId && saleItem.productId && saleItem.productId.toString() === item.productId.toString())
      );
      
      if (!originalItem) {
        return res.status(400).json({ 
          message: `El artículo "${item.name}" no se encontró en la venta original` 
        });
      }

      // ✅ VERIFICAR QUE NO SE EXCEDA LA CANTIDAD ORIGINAL
      if (item.quantity > originalItem.quantity) {
        return res.status(400).json({ 
          message: `La cantidad a devolver (${item.quantity}) de "${item.name}" excede la cantidad original vendida (${originalItem.quantity})` 
        });
      }
      
      const refundPrice = item.refundPrice || item.originalPrice;
      
      // ✅ CALCULAR EL TOTAL SOLO DE LOS PRODUCTOS DEVUELTOS
      totalCalculated += refundPrice * item.quantity;
      
      validatedItems.push({
        productId: item.productId || originalItem.productId,
        name: item.name,
        quantity: parseInt(item.quantity),
        originalPrice: parseFloat(item.originalPrice),
        refundPrice: parseFloat(refundPrice),
        reason: item.reason?.trim() || 'No especificado',
        condition: item.condition || 'Nuevo'
      });
    }

    // ✅ VALIDACIÓN CRÍTICA: El monto manual debe coincidir con el calculado automáticamente
    // Permitimos una diferencia mínima por redondeo (0.01)
    /*const difference = Math.abs(totalCalculated - refundAmount);
    if (difference > 0.01) {
      return res.status(400).json({ 
        message: `El monto de reembolso manual ($${refundAmount}) no coincide con el total calculado de los productos devueltos ($${totalCalculated.toFixed(2)}). Diferencia: $${difference.toFixed(2)}`,
        calculated: totalCalculated,
        provided: refundAmount
      });
    }
      */
    if (refundAmount > totalCalculated) {
      return res.status(400).json({ 
          message: `El monto de reembolso ($${refundAmount}) no puede ser mayor al valor de los productos ($${totalCalculated.toFixed(2)})`
        });
      }
    
    // Crear registro de devolución
    const returnRecord = new Return({
      saleId,
      returnedItems: validatedItems,
      refundAmount: parseFloat(refundAmount),
      refundMethod: sale.paymentType === 'mixed' ? 'mixto' : refundMethod,
      mixedRefunds: sale.paymentType === 'mixed' ? req.body.mixedRefunds : undefined,
      originalPaymentType: sale.paymentType || 'single',
      originalPaymentMethod: sale.method,
      processedBy: req.userId,
      tienda: sale.tienda._id,
      customerNotes: customerNotes?.trim(),
      status: 'procesada'
    });

    console.log('Datos a guardar en Return:', returnRecord);

    await returnRecord.save();
    
    // Actualizar stock de productos devueltos
    for (const item of validatedItems) {
      if (item.productId && item.condition === 'Nuevo') {
        await Product.findByIdAndUpdate(
          item.productId, 
          { $inc: { stock: item.quantity } }
        );
      }
      // Si está dañado o usado, no se devuelve al stock
    }
    
    // Actualizar el total de devoluciones en la venta
    sale.totalReturned = currentReturned + refundAmount;
    await sale.save();
    
    // Respuesta con datos poblados
    const populatedReturn = await Return.findById(returnRecord._id)
      .populate('saleId', 'total date method')
      .populate('processedBy', 'username')
      .populate('tienda', 'nombre');

    res.status(201).json({ 
      message: 'Devolución registrada correctamente',
      return: populatedReturn,
      saleUpdated: {
        totalOriginal: sale.total,
        totalReturned: sale.totalReturned,
        remaining: sale.total - sale.totalReturned
      }
    });
  } catch (error) {
    
    console.error('Error al crear devolución:', error.stack);
    res.status(500).json({ 
      message: 'Error interno al crear la devolución',
      error: error.message
    });
  }
});

// ✅ MIGRADO + MEJORADO: Obtener todas las devoluciones
router.get('/', verifyToken, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      tiendaId, 
      status, 
      refundMethod,
      limit = 50,
      page = 1 
    } = req.query;
    
    const filter = {};
    
    // Filtros por fecha
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate + 'T00:00:00.000Z');
      if (endDate) filter.date.$lte = new Date(endDate + 'T23:59:59.999Z');
    }
    
    // Otros filtros
    if (tiendaId) filter.tienda = tiendaId;
    if (status && ['procesada', 'aprobada', 'rechazada', 'pendiente'].includes(status)) {
      filter.status = status;
    }
    if (refundMethod && ['efectivo', 'transferencia', 'tarjeta', 'credito_tienda'].includes(refundMethod)) {
      filter.refundMethod = refundMethod;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const returns = await Return.find(filter)
      .populate('saleId', 'total date method type')
      .populate('processedBy', 'username')
      .populate('tienda', 'nombre')
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Return.countDocuments(filter);
    
    // Calcular estadísticas
    const stats = await Return.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalDevoluciones: { $sum: 1 },
          montoTotalDevuelto: { $sum: '$refundAmount' },
          porMetodo: { $push: { metodo: '$refundMethod', monto: '$refundAmount' } }
        }
      }
    ]);
    
    const estadisticas = stats[0] || {
      totalDevoluciones: 0,
      montoTotalDevuelto: 0,
      porMetodo: []
    };
    
    // Agrupar por método de devolución
    const resumenPorMetodo = estadisticas.porMetodo.reduce((acc, item) => {
      acc[item.metodo] = (acc[item.metodo] || 0) + item.monto;
      return acc;
    }, {});

    res.json({
      returns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      estadisticas: {
        totalDevoluciones: estadisticas.totalDevoluciones,
        montoTotalDevuelto: Number(estadisticas.montoTotalDevuelto.toFixed(2)),
        resumenPorMetodo
      },
      filtros: { startDate, endDate, tiendaId, status, refundMethod }
    });
  } catch (error) {
    console.error('Error obteniendo devoluciones:', error);
    res.status(500).json({ 
      message: 'Error interno al obtener devoluciones', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Obtener devolución por ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const returnRecord = await Return.findById(req.params.id)
      .populate('saleId', 'total date method type items')
      .populate('processedBy', 'username')
      .populate('tienda', 'nombre')
      .populate('returnedItems.productId', 'name sku');
    
    if (!returnRecord) {
      return res.status(404).json({ message: 'Devolución no encontrada' });
    }
    
    res.json(returnRecord);
  } catch (error) {
    console.error('Error obteniendo devolución:', error);
    res.status(500).json({ 
      message: 'Error al obtener devolución', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Aprobar/Rechazar devolución (solo admin)
router.patch('/:id/status', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    if (!['aprobada', 'rechazada'].includes(status)) {
      return res.status(400).json({ 
        message: 'Estado inválido. Debe ser "aprobada" o "rechazada"' 
      });
    }
    
    const returnRecord = await Return.findById(req.params.id);
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
        if (item.productId && item.condition === 'Nuevo') {
          await Product.findByIdAndUpdate(
            item.productId,
            { $inc: { stock: -item.quantity } }
          );
        }
      }
      
      // Revertir total devuelto en la venta
      await Sale.findByIdAndUpdate(
        returnRecord.saleId,
        { $inc: { totalReturned: -returnRecord.refundAmount } }
      );
    }
    
    const updatedReturn = await Return.findByIdAndUpdate(
      req.params.id,
      { 
        status, 
        adminNotes: adminNotes?.trim() 
      },
      { new: true }
    ).populate('saleId', 'total date')
     .populate('processedBy', 'username')
     .populate('tienda', 'nombre');
    
    res.json({ 
      message: `Devolución ${status} exitosamente`,
      return: updatedReturn
    });
  } catch (error) {
    console.error('Error actualizando estado de devolución:', error);
    res.status(500).json({ 
      message: 'Error al actualizar estado', 
      error: error.message 
    });
  }
});

// ✅ NUEVO: Reporte de devoluciones
router.get('/report/summary', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate, tiendaId } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'Se requieren fechas de inicio y fin' 
      });
    }
    
    const matchFilter = {
      date: {
        $gte: new Date(startDate + 'T00:00:00.000Z'),
        $lte: new Date(endDate + 'T23:59:59.999Z')
      }
    };
    
    if (tiendaId) {
      matchFilter.tienda = mongoose.Types.ObjectId(tiendaId);
    }
    
    const summary = await Return.aggregate([
      { $match: matchFilter },
      { $unwind: '$returnedItems' },
      {
        $group: {
          _id: null,
          totalDevoluciones: { $sum: 1 },
          montoTotal: { $sum: '$refundAmount' },
          itemsDevueltos: { $sum: '$returnedItems.quantity' },
          razonesComunes: { $push: '$returnedItems.reason' },
          metodosDevolucion: { $push: '$refundMethod' }
        }
      }
    ]);
    
    const result = summary[0] || {
      totalDevoluciones: 0,
      montoTotal: 0,
      itemsDevueltos: 0,
      razonesComunes: [],
      metodosDevolucion: []
    };
    
    // Contar frecuencia de razones
    const razonesCount = result.razonesComunes.reduce((acc, razon) => {
      acc[razon] = (acc[razon] || 0) + 1;
      return acc;
    }, {});
    
    // Contar métodos de devolución
    const metodosCount = result.metodosDevolucion.reduce((acc, metodo) => {
      acc[metodo] = (acc[metodo] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      periodo: { startDate, endDate },
      tienda: tiendaId || 'todas',
      resumen: {
        totalDevoluciones: result.totalDevoluciones,
        montoTotal: Number(result.montoTotal.toFixed(2)),
        itemsDevueltos: result.itemsDevueltos,
        promedioDevolucion: result.totalDevoluciones > 0 ? 
          Number((result.montoTotal / result.totalDevoluciones).toFixed(2)) : 0
      },
      razonesComunes: razonesCount,
      metodosDevolucion: metodosCount
    });
  } catch (error) {
    console.error('Error generando reporte de devoluciones:', error);
    res.status(500).json({ 
      message: 'Error al generar reporte', 
      error: error.message 
    });
  }
});

module.exports = router;