const Return = require('../../core/devoluciones/model');
const Sale = require('../../core/sales/model');
const Product = require('../../core/products/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class DevolucionesController {
  /**
   * Crear devolucion
   */
  async createReturn(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { saleId, returnedItems, refundAmount, refundMethod, customerNotes } = req.body;
      console.log('Datos recibidos:', req.body);

      console.log('Campos individuales:', {
        saleId,
        returnedItems,
        refundAmount,
        refundMethod,
        customerNotes
      });

      // Validaciones basicas
      if (!saleId || !returnedItems || !refundAmount || !refundMethod) {
        return errorResponse(res, 'Faltan campos requeridos: saleId, returnedItems, refundAmount, refundMethod', 400);
      }

      if (!Array.isArray(returnedItems) || returnedItems.length === 0) {
        return errorResponse(res, 'returnedItems debe ser un array con al menos un elemento', 400);
      }

      if (refundAmount <= 0) {
        return errorResponse(res, 'El monto de devolucion debe ser mayor a 0', 400);
      }

      // Verificar que la venta existe
      const sale = await Sale.findOne({ _id: saleId, tenantId: req.tenantId }).populate('tienda', 'nombre');
      if (!sale) {
        return errorResponse(res, 'Venta no encontrada', 404);
      }

      // Validar metodo de devolucion segun pago original
      if (sale.paymentType === 'mixed') {
        // Para pagos mixtos, validar que los metodos de devolucion coincidan
        if (!req.body.mixedRefunds || !Array.isArray(req.body.mixedRefunds)) {
          return errorResponse(res, 'Para ventas con pago mixto se requiere especificar mixedRefunds', 400);
        }

        // Validar que no se exceda el monto por metodo
        for (const refund of req.body.mixedRefunds) {
          const originalPayment = sale.mixedPayments.find(p => p.method === refund.method);
          if (!originalPayment) {
            return errorResponse(res, `No se puede devolver por ${refund.method} porque no fue usado en la venta original`, 400);
          }
          if (refund.amount > originalPayment.amount) {
            return errorResponse(res, `No se puede devolver $${refund.amount} por ${refund.method}, maximo disponible: $${originalPayment.amount}`, 400);
          }
        }
      } else {
        // Para pagos unicos, permitir devolver en efectivo o por el metodo original
        const allowedMethods = [sale.method];

        // Si la venta fue con tarjeta o transferencia, tambien permitir efectivo
        if (sale.method === 'tarjeta' || sale.method === 'transferencia') {
          allowedMethods.push('efectivo');
        }

        if (!allowedMethods.includes(refundMethod)) {
          return errorResponse(res, `La devolucion debe hacerse por ${allowedMethods.join(' o ')} (metodos permitidos para esta venta).`, 400);
        }
      }

      // Verificar que la venta tiene tienda
      if (!sale.tienda) {
        return errorResponse(res, 'No se puede devolver una venta que no tiene tienda asignada. Contacte a un administrador.', 400);
      }

      // Verificar limite de devolucion
      const currentReturned = sale.totalReturned || 0;
      const maxRefundable = sale.total - currentReturned;

      if (refundAmount > maxRefundable) {
        return errorResponse(res, `El monto de devolucion ($${refundAmount}) excede el maximo retornable ($${maxRefundable.toFixed(2)})`, 400);
      }

      // Validar articulos devueltos
      const validatedItems = [];
      let totalCalculated = 0;

      for (const item of returnedItems) {
        if (!item.name || !item.quantity || !item.originalPrice) {
          return errorResponse(res, 'Cada articulo debe tener: name, quantity, originalPrice, reason', 400);
        }

        if (item.quantity <= 0) {
          return errorResponse(res, 'La cantidad debe ser mayor a 0', 400);
        }

        // Verificar que el articulo estaba en la venta original
        const originalItem = sale.items.find(saleItem =>
          saleItem.name === item.name ||
          (item.productId && saleItem.productId && saleItem.productId.toString() === item.productId.toString())
        );

        if (!originalItem) {
          return errorResponse(res, `El articulo "${item.name}" no se encontro en la venta original`, 400);
        }

        // Verificar que no se exceda la cantidad original
        if (item.quantity > originalItem.quantity) {
          return errorResponse(res, `La cantidad a devolver (${item.quantity}) de "${item.name}" excede la cantidad original vendida (${originalItem.quantity})`, 400);
        }

        const refundPrice = item.refundPrice || item.originalPrice;

        // Calcular el total solo de los productos devueltos
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

      if (refundAmount > totalCalculated) {
        return errorResponse(res, `El monto de reembolso ($${refundAmount}) no puede ser mayor al valor de los productos ($${totalCalculated.toFixed(2)})`, 400);
      }

      // Crear registro de devolucion
      const returnRecord = new Return({
        tenantId: req.tenantId,
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

      // 📦 RESTAURACIÓN DE STOCK: Solo para supermercados
      // Obtener el tipo de negocio del tenant
      const Tenant = require('../../core/tenants/model');
      const tenant = await Tenant.findById(req.tenantId).select('businessType');

      if (tenant?.businessType === 'supermarket') {
        // Actualizar stock de productos devueltos
        for (const item of validatedItems) {
          if (item.productId && item.condition === 'Nuevo') {
            await Product.findByIdAndUpdate(
              item.productId,
              { $inc: { stock: item.quantity } }
            );
          }
          // Si esta dañado o usado, no se devuelve al stock
        }
      }

      // Actualizar el total de devoluciones y establecer status inteligente
      console.log('ANTES - Sale status:', sale.status, 'totalReturned:', sale.totalReturned);
      const newTotalReturned = currentReturned + refundAmount;
      sale.totalReturned = newTotalReturned;

      // Logica inteligente: Status segun el tipo de devolucion
      if (newTotalReturned >= sale.total) {
        // Devolucion total
        sale.status = 'cancelada';
        console.log('DEVOLUCION TOTAL - Marcando como cancelada');
      } else {
        // Devolucion parcial
        sale.status = 'parcialmente_devuelta';
        console.log('DEVOLUCION PARCIAL - Marcando como parcialmente_devuelta');
      }

      await sale.save();
      console.log('DESPUES - Sale status:', sale.status, 'totalReturned:', sale.totalReturned, 'remaining:', sale.total - sale.totalReturned);

      // Respuesta con datos poblados
      const populatedReturn = await Return.findById(returnRecord._id)
        .populate('saleId', 'total date method')
        .populate('processedBy', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, {
        return: populatedReturn,
        saleUpdated: {
          totalOriginal: sale.total,
          totalReturned: sale.totalReturned,
          remaining: sale.total - sale.totalReturned
        }
      }, 'Devolucion registrada correctamente', 201);
    } catch (error) {
      console.error('Error creando devolucion:', error.stack);
      return errorResponse(res, 'Error interno al crear la devolucion', 500);
    }
  }

  /**
   * Obtener todas las devoluciones
   */
  async getAll(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const {
        startDate,
        endDate,
        tiendaId,
        status,
        refundMethod,
        limit = 50,
        page = 1
      } = req.query;

      const filter = { tenantId: req.tenantId };

      // Filtros por fecha
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) {
          const startDateStr = startDate.includes('T') ? startDate : startDate + 'T00:00:00.000Z';
          filter.date.$gte = new Date(startDateStr);
        }
        if (endDate) {
          const endDateStr = endDate.includes('T') ? endDate : endDate + 'T23:59:59.999Z';
          filter.date.$lte = new Date(endDateStr);
        }
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

      // Calcular estadisticas
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

      // Agrupar por metodo de devolucion
      const resumenPorMetodo = estadisticas.porMetodo.reduce((acc, item) => {
        acc[item.metodo] = (acc[item.metodo] || 0) + item.monto;
        return acc;
      }, {});

      return successResponse(res, {
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
      }, 'Devoluciones obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo devoluciones:', error);
      return errorResponse(res, 'Error interno al obtener devoluciones', 500);
    }
  }

  /**
   * Obtener devoluciones por saleId
   */
  async getBySale(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const returns = await Return.find({ tenantId: req.tenantId, saleId: req.params.saleId })
        .populate('saleId', 'total date method type items tienda')
        .populate('processedBy', 'username')
        .populate('tienda', 'nombre')
        .sort({ date: -1 });

      if (!returns || returns.length === 0) {
        return errorResponse(res, 'No se encontraron devoluciones para esta venta', 404);
      }

      return successResponse(res, {
        returns,
        sale: returns[0].saleId,
        totalReturned: returns.reduce((sum, ret) => sum + ret.refundAmount, 0)
      }, 'Devoluciones obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo devoluciones por venta:', error);
      return errorResponse(res, 'Error al obtener devoluciones', 500);
    }
  }

  /**
   * Obtener devolucion por ID
   */
  async getById(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const returnRecord = await Return.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('saleId', 'total date method type items')
        .populate('processedBy', 'username')
        .populate('tienda', 'nombre')
        .populate('returnedItems.productId', 'name sku');

      if (!returnRecord) {
        return errorResponse(res, 'Devolucion no encontrada', 404);
      }

      return successResponse(res, returnRecord, 'Devolucion obtenida exitosamente');
    } catch (error) {
      console.error('Error obteniendo devolucion:', error);
      return errorResponse(res, 'Error al obtener devolucion', 500);
    }
  }

  /**
   * Aprobar/Rechazar devolucion (solo admin)
   */
  async updateStatus(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, adminNotes } = req.body;

      if (!['aprobada', 'rechazada'].includes(status)) {
        return errorResponse(res, 'Estado invalido. Debe ser "aprobada" o "rechazada"', 400);
      }

      const returnRecord = await Return.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!returnRecord) {
        return errorResponse(res, 'Devolucion no encontrada', 404);
      }

      if (returnRecord.status !== 'procesada') {
        return errorResponse(res, `Esta devolucion ya esta ${returnRecord.status}`, 400);
      }

      // Si se rechaza, revertir cambios en stock y venta
      if (status === 'rechazada') {
        // 📦 REVERSIÓN DE STOCK: Solo para supermercados
        // Obtener el tipo de negocio del tenant
        const Tenant = require('../../core/tenants/model');
        const tenant = await Tenant.findById(req.tenantId).select('businessType');

        if (tenant?.businessType === 'supermarket') {
          // Revertir stock (quitarlo porque la devolución fue rechazada)
          for (const item of returnRecord.returnedItems) {
            if (item.productId && item.condition === 'Nuevo') {
              await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } }
              );
            }
          }
        }

        // Revertir total devuelto en la venta y restaurar status anterior si corresponde
        const sale = await Sale.findById(returnRecord.saleId);
        const newTotalReturned = sale.totalReturned - returnRecord.refundAmount;

        const updateData = { $inc: { totalReturned: -returnRecord.refundAmount } };

        // Si no queda ninguna devolución, restaurar a estado entregado
        if (newTotalReturned <= 0 && sale.status === 'cancelada') {
          updateData.status = 'entregado_y_cobrado';
        }

        await Sale.findByIdAndUpdate(returnRecord.saleId, updateData);
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

      return successResponse(res, {
        return: updatedReturn
      }, `Devolucion ${status} exitosamente`);
    } catch (error) {
      console.error('Error actualizando estado de devolucion:', error);
      return errorResponse(res, 'Error al actualizar estado', 500);
    }
  }

  /**
   * Reporte de devoluciones
   */
  async getReportSummary(req, res) {
    try {
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { startDate, endDate, tiendaId } = req.query;

      if (!startDate || !endDate) {
        return errorResponse(res, 'Se requieren fechas de inicio y fin', 400);
      }

      const matchFilter = {
        tenantId: req.tenantId,
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

      // Contar metodos de devolucion
      const metodosCount = result.metodosDevolucion.reduce((acc, metodo) => {
        acc[metodo] = (acc[metodo] || 0) + 1;
        return acc;
      }, {});

      return successResponse(res, {
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
      }, 'Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generando reporte de devoluciones:', error);
      return errorResponse(res, 'Error al generar reporte', 500);
    }
  }
}

module.exports = new DevolucionesController();
