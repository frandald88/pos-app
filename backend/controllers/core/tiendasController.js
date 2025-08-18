const Tienda = require('../../core/tiendas/model');
const User = require('../../core/users/model');
const Product = require('../../core/products/model');
const Sale = require('../../core/sales/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class TiendasController {
  // Obtener todas las tiendas
  async getAll(req, res) {
    try {
      const { search, includeStats = false, limit = 50, page = 1 } = req.query;
      const filter = {};

      if (search) {
        filter.$or = [
          { nombre: { $regex: search, $options: 'i' } },
          { direccion: { $regex: search, $options: 'i' } },
          { telefono: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const tiendas = await Tienda.find(filter).sort({ nombre: 1 }).skip(skip).limit(parseInt(limit)).lean();
      const total = await Tienda.countDocuments(filter);

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
}

module.exports = new TiendasController();
