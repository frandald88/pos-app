const Tienda = require('../../modules/tiendas/model');
const User = require('../../core/users/model');
const Product = require('../../core/products/model');
const Sale = require('../../core/sales/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class TiendasController {
  // Obtener todas las tiendas
  async getAll(req, res) {
    try {
      const { search, includeStats = false, includeArchived, limit = 50, page = 1 } = req.query;
      const filter = {};

      console.log('🔍 includeArchived recibido:', includeArchived, 'tipo:', typeof includeArchived);

      // Por defecto, no incluir archivadas (solo si no se especifica o es false)
      if (includeArchived !== 'true') {
        filter.$or = [
          { activa: true },
          { activa: { $exists: false } }  // Incluir tiendas sin campo activa (se consideran activas)
        ];
        console.log('✅ Filtrando solo activas');
      } else {
        console.log('✅ Mostrando todas (incluyendo archivadas)');
      }

      // Si hay búsqueda, agregar condición $and para combinar filtros
      if (search) {
        const searchCondition = {
          $or: [
            { nombre: { $regex: search, $options: 'i' } },
            { direccion: { $regex: search, $options: 'i' } },
            { telefono: { $regex: search, $options: 'i' } }
          ]
        };

        // Si ya hay un filtro de activa, combinar con $and
        if (filter.$or) {
          filter.$and = [
            { $or: filter.$or },  // Condición de activa
            searchCondition        // Condición de búsqueda
          ];
          delete filter.$or;
        } else {
          filter.$or = searchCondition.$or;
        }
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      console.log('📊 Filtro final de MongoDB:', JSON.stringify(filter, null, 2));

      const tiendas = await Tienda.find(filter).sort({ nombre: 1 }).skip(skip).limit(parseInt(limit)).lean();
      const total = await Tienda.countDocuments(filter);

      console.log(`✅ Encontradas ${tiendas.length} tiendas`);
      console.log('Tiendas:', tiendas.map(t => ({ nombre: t.nombre, activa: t.activa })));

      if (includeStats === 'true') {
        for (let tienda of tiendas) {
          const userStats = await User.aggregate([
            { $match: { tienda: tienda._id } },
            { $group: { _id: '$role', count: { $sum: 1 } } }
          ]);

          const productCount = await Product.countDocuments({ tienda: tienda._id });

          const lastMonth = new Date();
          lastMonth.setMonth(lastMonth.getMonth() - 1);

          const salesStats = await Sale.aggregate([
            { $match: { tienda: tienda._id, date: { $gte: lastMonth } } },
            { $group: { _id: null, totalSales: { $sum: 1 }, totalAmount: { $sum: '$total' } } }
          ]);

          tienda.stats = {
            users: userStats.reduce((acc, stat) => { acc[stat._id] = stat.count; return acc; }, {}),
            totalUsers: userStats.reduce((sum, stat) => sum + stat.count, 0),
            totalProducts: productCount,
            lastMonthSales: salesStats[0] || { totalSales: 0, totalAmount: 0 }
          };
        }
      }

      return successResponse(res, {
        tiendas,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Tiendas obtenidas exitosamente');

    } catch (error) {
      console.error('Error al obtener tiendas:', error);
      return errorResponse(res, 'Error al obtener tiendas', 500);
    }
  }

  // Obtener tienda por ID
  async getById(req, res) {
    try {
      const { id } = req.params;
      const { includeDetails = false } = req.query;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      const tienda = await Tienda.findById(id).lean();
      if (!tienda) return errorResponse(res, 'Tienda no encontrada', 404);

      if (includeDetails === 'true') {
        const users = await User.find({ tienda: id }).select('username role telefono').sort({ username: 1 });

        const productStats = await Product.aggregate([
          { $match: { tienda: new mongoose.Types.ObjectId(id) } },
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              totalStock: { $sum: '$stock' },
              totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
              lowStock: { $sum: { $cond: [{ $lte: ['$stock', 10] }, 1, 0] } },
              outOfStock: { $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] } }
            }
          }
        ]);

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        const salesStats = await Sale.aggregate([
          { $match: { tienda: new mongoose.Types.ObjectId(id), date: { $gte: lastMonth } } },
          {
            $group: {
              _id: null,
              totalSales: { $sum: 1 },
              totalAmount: { $sum: '$total' },
              avgAmount: { $avg: '$total' },
              byMethod: { $push: { method: '$method', amount: '$total' } }
            }
          }
        ]);

        tienda.details = {
          users,
          productStats: productStats[0] || {
            totalProducts: 0,
            totalStock: 0,
            totalValue: 0,
            lowStock: 0,
            outOfStock: 0
          },
          salesStats: salesStats[0] || {
            totalSales: 0,
            totalAmount: 0,
            avgAmount: 0,
            byMethod: []
          }
        };
      }

      return successResponse(res, tienda, 'Tienda obtenida exitosamente');

    } catch (error) {
      console.error('Error al obtener tienda:', error);
      return errorResponse(res, 'Error al obtener tienda', 500);
    }
  }

  // Crear nueva tienda
  async create(req, res) {
    try {
      const { nombre, direccion, telefono } = req.body;

      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre de la tienda es requerido', 400);
      }

      const existingTienda = await Tienda.findOne({ nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' } });
      if (existingTienda) return errorResponse(res, 'Ya existe una tienda con este nombre', 400);

      const newTienda = new Tienda({
        nombre: nombre.trim(),
        direccion: direccion?.trim(),
        telefono: telefono?.trim()
      });

      await newTienda.save();
      return successResponse(res, newTienda, 'Tienda creada exitosamente', 201);

    } catch (error) {
      console.error('Error al crear tienda:', error);
      return errorResponse(res, 'Error al crear tienda', 500);
    }
  }

  // Actualizar tienda
  async update(req, res) {
    try {
      const { id } = req.params;
      const { nombre, direccion, telefono } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      if (!nombre || nombre.trim() === '') {
        return errorResponse(res, 'El nombre de la tienda es requerido', 400);
      }

      // Verificar duplicado (excluyendo la actual)
      const existingTienda = await Tienda.findOne({
        nombre: { $regex: `^${nombre.trim()}$`, $options: 'i' },
        _id: { $ne: id }
      });

      if (existingTienda) {
        return errorResponse(res, 'Ya existe otra tienda con este nombre', 400);
      }

      const updatedTienda = await Tienda.findByIdAndUpdate(
        id,
        {
          nombre: nombre.trim(),
          direccion: direccion?.trim(),
          telefono: telefono?.trim()
        },
        { new: true, runValidators: true }
      );

      if (!updatedTienda) {
        return errorResponse(res, 'Tienda no encontrada', 404);
      }

      return successResponse(res, updatedTienda, 'Tienda actualizada exitosamente');

    } catch (error) {
      console.error('Error al actualizar tienda:', error);
      return errorResponse(res, 'Error al actualizar tienda', 500);
    }
  }

  // Verificar relaciones de una tienda
  async getRelationships(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      const relationships = {
        users: await User.countDocuments({ tienda: id }),
        products: await Product.countDocuments({ tienda: id }),
        sales: await Sale.countDocuments({ tienda: id })
      };

      const total = Object.values(relationships).reduce((sum, count) => sum + count, 0);

      return successResponse(res, {
        hasRelationships: total > 0,
        total,
        data: relationships
      }, 'Relaciones verificadas exitosamente');

    } catch (error) {
      console.error('Error al verificar relaciones:', error);
      return errorResponse(res, 'Error al verificar relaciones', 500);
    }
  }

  // Archivar tienda (soft delete)
  async archive(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      const tienda = await Tienda.findByIdAndUpdate(
        id,
        { activa: false },
        { new: true }
      );

      if (!tienda) {
        return errorResponse(res, 'Tienda no encontrada', 404);
      }

      return successResponse(res, tienda, 'Tienda archivada exitosamente');

    } catch (error) {
      console.error('Error al archivar tienda:', error);
      return errorResponse(res, 'Error al archivar tienda', 500);
    }
  }

  // Restaurar tienda archivada
  async restore(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      const tienda = await Tienda.findByIdAndUpdate(
        id,
        { activa: true },
        { new: true }
      );

      if (!tienda) {
        return errorResponse(res, 'Tienda no encontrada', 404);
      }

      return successResponse(res, tienda, 'Tienda restaurada exitosamente');

    } catch (error) {
      console.error('Error al restaurar tienda:', error);
      return errorResponse(res, 'Error al restaurar tienda', 500);
    }
  }

  // Eliminar tienda
  async deleteTienda(req, res) {
    try {
      console.log('🗑️ Iniciando eliminación de tienda...');
      const { id } = req.params;
      const { forceDelete } = req.body || {};
      const { force } = req.query;

      console.log('📝 Parámetros recibidos:', { id, forceDelete, force });

      // Puede venir como query param (?force=true) o en el body
      const shouldForceDelete = forceDelete === true || force === 'true';
      console.log('💪 shouldForceDelete:', shouldForceDelete);

      if (!mongoose.Types.ObjectId.isValid(id)) {
        console.log('❌ ID inválido');
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      console.log('🔍 Buscando tienda...');
      const tienda = await Tienda.findById(id);
      if (!tienda) {
        console.log('❌ Tienda no encontrada');
        return errorResponse(res, 'Tienda no encontrada', 404);
      }
      console.log('✅ Tienda encontrada:', tienda.nombre);

      if (!shouldForceDelete) {
        console.log('🔍 Verificando relaciones...');
        // Verificar relaciones
        const relationships = {
          users: await User.countDocuments({ tienda: id }),
          products: await Product.countDocuments({ tienda: id }),
          sales: await Sale.countDocuments({ tienda: id })
        };

        console.log('📊 Relaciones:', relationships);
        const total = Object.values(relationships).reduce((sum, count) => sum + count, 0);

        if (total > 0) {
          console.log('❌ Tiene relaciones, no se puede eliminar');
          return errorResponse(res, 'No se puede eliminar: La tienda tiene datos asociados', 400, {
            canDelete: false,
            relationships,
            total,
            suggestion: 'Considera archivar la tienda en lugar de eliminarla'
          });
        }
        console.log('✅ No tiene relaciones');
      } else {
        console.log('⚠️ Eliminación forzada, saltando verificación de relaciones');
      }

      console.log('🗑️ Eliminando tienda de la base de datos...');
      await Tienda.findByIdAndDelete(id);
      console.log('✅ Tienda eliminada exitosamente');

      return successResponse(
        res,
        null,
        shouldForceDelete ? 'Tienda eliminada permanentemente' : 'Tienda eliminada exitosamente'
      );

    } catch (error) {
      console.error('❌❌❌ Error al eliminar tienda:', error);
      console.error('Stack trace:', error.stack);
      return errorResponse(res, 'Error al eliminar tienda', 500);
    }
  }
}

module.exports = new TiendasController();
