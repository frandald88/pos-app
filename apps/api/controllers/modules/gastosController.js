const Expense = require('../../core/gastos/model');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const path = require('path');
const fs = require('fs');

class GastosController {
  /**
   * Crear gasto (con validacion de tienda segun rol)
   */
  async createExpense(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { concepto, proveedor, monto, metodoPago, tienda } = req.body;

      // Validaciones basicas
      if (!concepto || !proveedor || !monto || !metodoPago || !tienda) {
        return errorResponse(res, 'Todos los campos son requeridos: concepto, proveedor, monto, metodoPago, tienda', 400);
      }

      if (isNaN(monto) || parseFloat(monto) <= 0) {
        return errorResponse(res, 'El monto debe ser un numero mayor a 0', 400);
      }

      // Verificar permisos de tienda segun rol
      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      if (user.role !== 'admin') {
        // Para vendedores/repartidores, verificar que solo puedan usar su tienda asignada
        if (!user.tienda) {
          return errorResponse(res, 'No tienes una tienda asignada. Contacta al administrador.', 400);
        }

        if (user.tienda.toString() !== tienda) {
          return errorResponse(res, 'No puedes crear gastos para una tienda diferente a la asignada.', 403);
        }
      }

      // Crear fecha local (zona horaria de Mexico)
      const localDate = new Date();
      // Ajustar a zona horaria de Mexico (UTC-6)
      const mexicoOffset = -6 * 60; // -6 horas en minutos
      const utcTime = localDate.getTime() + (localDate.getTimezoneOffset() * 60000);
      const mexicoTime = new Date(utcTime + (mexicoOffset * 60000));

      const expenseData = {
        concepto: concepto.trim(),
        proveedor: proveedor.trim(),
        monto: parseFloat(monto),
        metodoPago,
        tienda,
        createdBy: req.userId,
        tenantId: req.tenantId,
        status: 'pendiente',
        createdAt: mexicoTime,
      };

      if (req.file) {
        expenseData.evidencia = req.file.filename;
      }

      const expense = new Expense(expenseData);
      await expense.save();

      // Poblar datos para respuesta
      const populatedExpense = await Expense.findOne({ _id: expense._id, tenantId: req.tenantId })
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre');

      return successResponse(res, { expense: populatedExpense }, 'Gasto registrado exitosamente', 201);
    } catch (error) {
      console.error('Error guardando gasto:', error);

      // Si hubo error y se subio archivo, eliminarlo
      if (req.file) {
        const filePath = path.join(__dirname, '../../uploads/expenses', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      return errorResponse(res, 'Error al guardar gasto', 500);
    }
  }

  /**
   * Obtener reporte de gastos (solo admin)
   */
  async getReport(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { startDate, endDate, proveedor, metodoPago, tiendaId, status, limit = 100 } = req.query;
      const filter = { tenantId: req.tenantId };

      // Filtros de fecha ajustados a zona horaria de Mexico
      const mexicoOffset = -6 * 60; // -6 horas en minutos
      const adjustToMexicoTime = (date) => {
        const utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
        return new Date(utcTime + (mexicoOffset * 60000));
      };

      if (startDate && endDate) {
        const start = adjustToMexicoTime(new Date(startDate + 'T00:00:00'));
        const end = adjustToMexicoTime(new Date(endDate + 'T23:59:59'));
        filter.createdAt = { $gte: start, $lte: end };
      } else if (startDate) {
        const start = adjustToMexicoTime(new Date(startDate + 'T00:00:00'));
        filter.createdAt = { $gte: start };
      } else if (endDate) {
        const end = adjustToMexicoTime(new Date(endDate + 'T23:59:59'));
        filter.createdAt = { $lte: end };
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
            porMetodo: {
              $push: {
                metodoPago: '$metodoPago',
                monto: '$monto'
              }
            }
          }
        }
      ]);

      const summary = totals[0] || { totalMonto: 0, totalGastos: 0, porMetodo: [] };

      return successResponse(res, {
        expenses,
        summary: {
          totalMonto: summary.totalMonto,
          totalGastos: summary.totalGastos,
          porMetodo: summary.porMetodo.reduce((acc, item) => {
            acc[item.metodoPago] = (acc[item.metodoPago] || 0) + item.monto;
            return acc;
          }, {})
        }
      }, 'Reporte generado exitosamente');
    } catch (error) {
      console.error('Error cargando reporte:', error);
      return errorResponse(res, 'Error al cargar reporte', 500);
    }
  }

  /**
   * Obtener gastos del usuario actual o de su tienda
   * - Admin: puede obtener todos los gastos (sin filtro de tienda)
   * - Vendedor: obtiene TODOS los gastos de su tienda (no solo los que creó)
   */
  async getMine(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { limit = 50 } = req.query;

      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let filter = { tenantId: req.tenantId };

      // Si no es admin, filtrar por tienda asignada y mostrar todos los gastos de esa tienda
      if (user.role !== 'admin') {
        if (!user.tienda) {
          return errorResponse(res, 'No tienes una tienda asignada', 400);
        }
        filter.tienda = user.tienda;
      }

      const expenses = await Expense.find(filter)
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      return successResponse(res, expenses, 'Gastos obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo mis gastos:', error);
      return errorResponse(res, 'Error al obtener gastos', 500);
    }
  }

  /**
   * Descargar evidencia
   */
  async getEvidencia(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const filename = req.params.filename;

      // Validar que el filename no contenga caracteres peligrosos
      if (!/^[a-zA-Z0-9.\-_]+$/.test(filename)) {
        return errorResponse(res, 'Nombre de archivo invalido', 400);
      }

      // Verificar que la evidencia pertenece a un gasto del tenant actual
      const expense = await Expense.findOne({ evidencia: filename, tenantId: req.tenantId });
      if (!expense) {
        return errorResponse(res, 'Evidencia no encontrada o no autorizada', 404);
      }

      const filePath = path.join(__dirname, '../../uploads/expenses', filename);

      if (fs.existsSync(filePath)) {
        res.sendFile(path.resolve(filePath));
      } else {
        return errorResponse(res, 'Evidencia no encontrada', 404);
      }
    } catch (error) {
      console.error('Error descargando evidencia:', error);
      return errorResponse(res, 'Error al descargar evidencia', 500);
    }
  }

  /**
   * Cambiar estado y agregar nota (solo admin)
   */
  async updateStatus(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { status, nota } = req.body;

      // Validar estado
      if (!['pendiente', 'aprobado', 'denegado', 'en revision'].includes(status)) {
        return errorResponse(res, 'Estado invalido', 400);
      }

      // Verificar que el gasto existe
      const expense = await Expense.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!expense) {
        return errorResponse(res, 'Gasto no encontrado', 404);
      }

      const updatedExpense = await Expense.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { status, nota: nota || '' },
        { new: true }
      ).populate('createdBy', 'username')
       .populate('tienda', 'nombre');

      return successResponse(res, { expense: updatedExpense }, 'Estado del gasto actualizado exitosamente');
    } catch (error) {
      console.error('Error actualizando status de gasto:', error);
      return errorResponse(res, 'Error actualizando gasto', 500);
    }
  }

  /**
   * Eliminar gasto (solo admin, solo si esta aprobado o denegado)
   */
  async deleteExpense(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const expense = await Expense.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!expense) {
        return errorResponse(res, 'Gasto no encontrado', 404);
      }

      if (!['aprobado', 'denegado'].includes(expense.status)) {
        return errorResponse(res, 'Solo se pueden eliminar gastos en estado aprobado o denegado', 400);
      }

      // Eliminar evidencia fisica si existe
      if (expense.evidencia) {
        const filePath = path.join(__dirname, '../../uploads/expenses', expense.evidencia);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      await Expense.findOneAndDelete({ _id: req.params.id, tenantId: req.tenantId });

      return successResponse(res, {
        deletedExpense: {
          _id: expense._id,
          concepto: expense.concepto,
          monto: expense.monto
        }
      }, 'Gasto eliminado exitosamente');
    } catch (error) {
      console.error('Error eliminando gasto:', error);
      return errorResponse(res, 'Error al eliminar gasto', 500);
    }
  }

  /**
   * Obtener proveedores unicos
   */
  async getProviders(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const providers = await Expense.distinct('proveedor', {
        tenantId: req.tenantId,
        proveedor: { $ne: null, $ne: '' }
      });

      return successResponse(res, providers.sort(), 'Proveedores obtenidos exitosamente');
    } catch (error) {
      console.error('Error obteniendo proveedores:', error);
      return errorResponse(res, 'Error al obtener proveedores', 500);
    }
  }

  /**
   * Buscar proveedores para autocompletado
   */
  async searchProviders(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const { q } = req.query;

      if (!q || q.trim().length < 2) {
        return successResponse(res, [], 'Resultados obtenidos exitosamente');
      }

      const providers = await Expense.distinct('proveedor', {
        tenantId: req.tenantId,
        proveedor: { $regex: q.trim(), $options: 'i' }
      });

      return successResponse(res, providers.sort().slice(0, 10), 'Resultados obtenidos exitosamente');
    } catch (error) {
      console.error('Error buscando proveedores:', error);
      return errorResponse(res, 'Error al buscar proveedores', 500);
    }
  }

  /**
   * Obtener tiendas disponibles segun el rol del usuario
   */
  async getAvailableStores(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId }).populate('tienda', 'nombre');

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      let availableStores = [];

      if (user.role === 'admin') {
        // Admin puede ver todas las tiendas
        const Tienda = require('../../modules/tiendas/model');
        availableStores = await Tienda.find({ tenantId: req.tenantId }, 'nombre').sort({ nombre: 1 });
      } else {
        // Vendedor/repartidor solo puede ver su tienda asignada
        if (user.tienda) {
          availableStores = [user.tienda];
        }
      }

      return successResponse(res, {
        stores: availableStores,
        userRole: user.role,
        defaultStore: user.role !== 'admin' ? user.tienda?._id : null
      }, 'Tiendas disponibles obtenidas exitosamente');
    } catch (error) {
      console.error('Error obteniendo tiendas disponibles:', error);
      return errorResponse(res, 'Error al obtener tiendas disponibles', 500);
    }
  }

  /**
   * Obtener gasto por ID
   */
  async getById(req, res) {
    try {
      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      const expense = await Expense.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('createdBy', 'username')
        .populate('tienda', 'nombre');

      if (!expense) {
        return errorResponse(res, 'Gasto no encontrado', 404);
      }

      return successResponse(res, expense, 'Gasto obtenido exitosamente');
    } catch (error) {
      console.error('Error obteniendo gasto:', error);
      return errorResponse(res, 'Error al obtener gasto', 500);
    }
  }
}

module.exports = new GastosController();
