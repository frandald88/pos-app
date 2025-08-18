const Expense = require('../../modules/gastos/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

class GastosController {
  // Configurar multer para evidencias
  setupMulter() {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        const dir = path.join(__dirname, '../../uploads/expenses');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
      },
      filename: function (req, file, cb) {
        const timestamp = Date.now();
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        cb(null, `${timestamp}-${cleanName}`);
      },
    });

    const fileFilter = (req, file, cb) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen (JPG, PNG) y PDF'), false);
      }
    };

    return multer({ 
      storage,
      fileFilter,
      limits: { fileSize: 5 * 1024 * 1024 } // 5MB máximo
    });
  }

  // Crear gasto
  async create(req, res) {
    try {
      const { concepto, proveedor, monto, metodoPago, tienda } = req.body;
      
      // Validaciones
      if (!concepto || !proveedor || !monto || !metodoPago || !tienda) {
        return errorResponse(res, 'Todos los campos son requeridos: concepto, proveedor, monto, metodoPago, tienda', 400);
      }
      
      if (isNaN(monto) || parseFloat(monto) <= 0) {
        return errorResponse(res, 'El monto debe ser un número mayor a 0', 400);
      }
      
      const expenseData = {
        concepto: concepto.trim(),
        proveedor: proveedor.trim(),
        monto: parseFloat(monto),
        metodoPago,
        tienda,
        createdBy: req.userId,
        status: 'pendiente',
      };

      if (req.file) {
        expenseData.evidencia = req.file.filename;
      }

      const expense = new Expense(expenseData);
      await expense.save();
      
      const populatedExpense = await Expense.findById(expense._id)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre');
      
      return successResponse(res, { expense: populatedExpense }, 'Gasto registrado exitosamente', 201);
    } catch (err) {
      console.error('Error al guardar gasto:', err);
      
      // Si hubo error y se subió archivo, eliminarlo
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads/expenses', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      
      return errorResponse(res, 'Error al guardar gasto', 500);
    }
  }

  // Obtener reporte de gastos
  async getReport(req, res) {
    try {
      const { startDate, endDate, proveedor, metodoPago, tiendaId, status, limit = 100 } = req.query;
      const filter = {};

      // Filtros de fecha
      if (startDate && endDate) {
        const start = new Date(startDate + 'T00:00:00.000Z');
        const end = new Date(endDate + 'T23:59:59.999Z');
        filter.createdAt = { $gte: start, $lte: end };
      }

      // Otros filtros
      if (proveedor) filter.proveedor = { $regex: proveedor, $options: 'i' };
      if (metodoPago) filter.metodoPago = metodoPago;
      if (tiendaId) filter.tienda = tiendaId;
      if (status) filter.status = status;

      const expenses = await Expense.find(filter)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      // Calcular totales
      const totals = await Expense.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalMonto: { $sum: '$monto' },
            totalGastos: { $sum: 1 },
            porMetodo: { $push: { metodoPago: '$metodoPago', monto: '$monto' } }
          }
        }
      ]);

      const summary = totals[0] || { totalMonto: 0, totalGastos: 0, porMetodo: [] };
      const resumenPorMetodo = summary.porMetodo.reduce((acc, item) => {
        acc[item.metodoPago] = (acc[item.metodoPago] || 0) + item.monto;
        return acc;
      }, {});

      return successResponse(res, {
        expenses,
        summary: {
          totalMonto: Number(summary.totalMonto.toFixed(2)),
          totalGastos: summary.totalGastos,
          porMetodo: resumenPorMetodo
        }
      }, 'Reporte generado exitosamente');
    } catch (err) {
      console.error('Error al cargar reporte:', err);
      return errorResponse(res, 'Error al cargar reporte', 500);
    }
  }

  // Cambiar estado del gasto
  async updateStatus(req, res) {
    try {
      const { status, nota } = req.body;
      const { id } = req.params;

      if (!['pendiente', 'aprobado', 'denegado', 'en revision'].includes(status)) {
        return errorResponse(res, 'Estado inválido', 400);
      }
      
      const expense = await Expense.findById(id);
      if (!expense) {
        return errorResponse(res, 'Gasto no encontrado', 404);
      }

      const updatedExpense = await Expense.findByIdAndUpdate(
        id, 
        { status, nota: nota || '' },
        { new: true }
      ).populate('createdBy', 'username')
       .populate('tienda', 'nombre');

      return successResponse(res, { expense: updatedExpense }, 'Estado del gasto actualizado exitosamente');
    } catch (err) {
      console.error('Error actualizando status de gasto:', err);
      return errorResponse(res, 'Error actualizando gasto', 500);
    }
  }

  // Eliminar gasto
  async delete(req, res) {
    try {
      const { id } = req.params;
      
      const expense = await Expense.findById(id);
      if (!expense) {
        return errorResponse(res, 'Gasto no encontrado', 404);
      }

      if (!['aprobado', 'denegado'].includes(expense.status)) {
        return errorResponse(res, 'Solo se pueden eliminar gastos en estado aprobado o denegado', 400);
      }

      // Eliminar evidencia física si existe
      if (expense.evidencia) {
        const filePath = path.join(__dirname, '../../uploads/expenses', expense.evidencia);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Expense.findByIdAndDelete(id);
      
      return successResponse(res, { 
        deletedExpense: { _id: expense._id, concepto: expense.concepto, monto: expense.monto }
      }, 'Gasto eliminado exitosamente');
    } catch (err) {
      console.error('Error al eliminar gasto:', err);
      return errorResponse(res, 'Error al eliminar gasto', 500);
    }
  }

  // Obtener gastos del usuario actual
  async getMine(req, res) {
    try {
      const { limit = 50 } = req.query;
      
      const expenses = await Expense.find({ createdBy: req.userId })
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return successResponse(res, expenses, 'Gastos obtenidos exitosamente');
    } catch (err) {
      console.error('Error al obtener mis gastos:', err);
      return errorResponse(res, 'Error al obtener gastos', 500);
    }
  }

  // Descargar evidencia
  async downloadEvidence(req, res) {
    try {
      const filename = req.params.filename;
      
      if (!/^[a-zA-Z0-9.\-_]+$/.test(filename)) {
        return errorResponse(res, 'Nombre de archivo inválido', 400);
      }
      
      const filePath = path.join(__dirname, '../../uploads/expenses', filename);
      
      if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
      } else {
        return errorResponse(res, 'Evidencia no encontrada', 404);
      }
    } catch (err) {
      console.error('Error al descargar evidencia:', err);
      return errorResponse(res, 'Error al descargar evidencia', 500);
    }
  }
}

module.exports = new GastosController();