const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const mongoose = require('mongoose');

class UsersController {

  // Obtener todos los usuarios (solo admin)
  async getAll(req, res) {
    try {
      const { role, tiendaId, limit = 50, page = 1 } = req.query;
      
      // Construir filtros
      const filter = {};
      if (role && ['admin', 'vendedor', 'repartidor'].includes(role)) {
        filter.role = role;
      }
      if (tiendaId && mongoose.Types.ObjectId.isValid(tiendaId)) {
        filter.tienda = tiendaId;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const users = await User.find(filter)
        .select('-password')
        .populate('tienda', 'nombre')
        .sort({ username: 1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await User.countDocuments(filter);

      return successResponse(res, {
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit))
        }
      }, 'Usuarios obtenidos exitosamente');

    } catch (error) {
      console.error('Error obteniendo usuarios:', error);
      return errorResponse(res, 'Error al obtener usuarios', 500);
    }
  }

  // Obtener usuario por ID
  async getById(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de usuario inválido', 400);
      }

      const user = await User.findById(id)
        .select('-password')
        .populate('tienda', 'nombre');

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      return successResponse(res, user, 'Usuario obtenido exitosamente');

    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      return errorResponse(res, 'Error al obtener usuario', 500);
    }
  }

  // Obtener datos del usuario actual
  async getMe(req, res) {
    try {
      const user = await User.findById(req.userId)
        .select('-password')
        .populate('tienda', 'nombre');

      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      return successResponse(res, {
        _id: user._id,
        username: user.username,
        role: user.role,
        telefono: user.telefono,
        tienda: user.tienda
      }, 'Datos del usuario actual obtenidos exitosamente');

    } catch (error) {
      console.error('Error obteniendo usuario actual:', error);
      return errorResponse(res, 'Error al obtener el usuario actual', 500);
    }
  }

  // Crear nuevo usuario
  async create(req, res) {
    try {
      const { username, password, role, telefono, tienda } = req.body;

      // Validaciones básicas
      if (!username || !password) {
        return errorResponse(res, 'Username y password son requeridos', 400);
      }

      if (!['admin', 'vendedor', 'repartidor'].includes(role)) {
        return errorResponse(res, 'Rol inválido', 400);
      }

      // Validación: vendedores y repartidores deben tener tienda
      if (role !== 'admin' && !tienda) {
        return errorResponse(res, 'Los usuarios que no son admin deben tener una tienda asignada', 400);
      }

      // Verificar que la tienda existe si se proporciona
      if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      // Verificar si el usuario ya existe
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return errorResponse(res, 'El nombre de usuario ya está en uso', 400);
      }

      // Crear nuevo usuario
      const newUser = new User({
        username,
        password,
        role,
        telefono,
        tienda: role !== 'admin' ? tienda : null
      });

      await newUser.save();

      // Obtener el usuario creado con la tienda poblada
      const createdUser = await User.findById(newUser._id)
        .select('-password')
        .populate('tienda', 'nombre');

      return successResponse(res, createdUser, 'Usuario creado exitosamente', 201);

    } catch (error) {
      console.error('Error creando usuario:', error);
      if (error.code === 11000) {
        return errorResponse(res, 'El nombre de usuario ya está en uso', 400);
      }
      return errorResponse(res, 'Error al crear usuario', 500);
    }
  }

  // Actualizar usuario
  async update(req, res) {
    try {
      const { id } = req.params;
      const { username, role, telefono, tienda, password } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de usuario inválido', 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Validar rol si se proporciona
      if (role && !['admin', 'vendedor', 'repartidor'].includes(role)) {
        return errorResponse(res, 'Rol inválido', 400);
      }

      // Validar tienda si se proporciona
      if (tienda && !mongoose.Types.ObjectId.isValid(tienda)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      // Preparar datos de actualización
      const updateData = {};
      if (username) updateData.username = username;
      if (role) {
        updateData.role = role;
        updateData.tienda = role !== 'admin' ? tienda : null;
      }
      if (telefono !== undefined) updateData.telefono = telefono;
      if (password) updateData.password = password;

      // Actualizar usuario
      await User.findByIdAndUpdate(id, updateData, { 
        runValidators: true,
        new: true
      });

      // Obtener usuario actualizado
      const updatedUser = await User.findById(id)
        .select('-password')
        .populate('tienda', 'nombre');

      return successResponse(res, updatedUser, 'Usuario actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando usuario:', error);
      if (error.code === 11000) {
        return errorResponse(res, 'El nombre de usuario ya está en uso', 400);
      }
      return errorResponse(res, 'Error al actualizar usuario', 500);
    }
  }

  // Eliminar usuario
  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return errorResponse(res, 'ID de usuario inválido', 400);
      }

      // Verificar que no se esté intentando eliminar a sí mismo
      if (id === req.userId) {
        return errorResponse(res, 'No puedes eliminar tu propia cuenta', 400);
      }

      const user = await User.findById(id);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      await User.findByIdAndDelete(id);

      return successResponse(res, {}, 'Usuario eliminado exitosamente');

    } catch (error) {
      console.error('Error eliminando usuario:', error);
      return errorResponse(res, 'Error al eliminar usuario', 500);
    }
  }

  // Obtener usuarios por tienda
  async getByTienda(req, res) {
    try {
      const { tiendaId } = req.params;
      const { role } = req.query;

      if (!mongoose.Types.ObjectId.isValid(tiendaId)) {
        return errorResponse(res, 'ID de tienda inválido', 400);
      }

      const filter = { tienda: tiendaId };
      if (role && ['vendedor', 'repartidor'].includes(role)) {
        filter.role = role;
      }

      const users = await User.find(filter)
        .select('-password')
        .populate('tienda', 'nombre')
        .sort({ username: 1 });

      return successResponse(res, users, 'Usuarios de la tienda obtenidos exitosamente');

    } catch (error) {
      console.error('Error obteniendo usuarios por tienda:', error);
      return errorResponse(res, 'Error al obtener usuarios de la tienda', 500);
    }
  }

  // Actualizar perfil del usuario actual
  async updateProfile(req, res) {
    try {
      const { telefono, password } = req.body;

      const user = await User.findById(req.userId);
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      const updateData = {};
      if (telefono !== undefined) updateData.telefono = telefono;
      if (password) updateData.password = password;

      await User.findByIdAndUpdate(req.userId, updateData, { runValidators: true });

      const updatedUser = await User.findById(req.userId)
        .select('-password')
        .populate('tienda', 'nombre');

      return successResponse(res, updatedUser, 'Perfil actualizado exitosamente');

    } catch (error) {
      console.error('Error actualizando perfil:', error);
      return errorResponse(res, 'Error al actualizar perfil', 500);
    }
  }

  // Obtener estadísticas de usuarios
  async getStats(req, res) {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ 
        // Aquí podrías agregar filtros para usuarios activos
      });

      return successResponse(res, {
        totalUsers,
        activeUsers,
        usersByRole: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }, 'Estadísticas de usuarios obtenidas exitosamente');

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return errorResponse(res, 'Error al obtener estadísticas', 500);
    }
  }
}

module.exports = new UsersController();