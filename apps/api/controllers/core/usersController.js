const User = require('../../core/users/model');
const mongoose = require('mongoose');
const { validatePassword } = require('../../shared/utils/passwordValidation');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class UsersController {

  // ✅ CORREGIDO: Obtener datos del usuario logueado CON tienda
  async getMe(req, res) {
    try {
      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId })
        .select('_id username role tienda')
        .populate('tienda', 'nombre');

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (err) {
      res.status(500).json({ message: 'Error al obtener el usuario actual', error: err.message });
    }
  }

  // ✅ CORREGIDO: Nuevo endpoint específico para reemplazos
  async getReplacements(req, res) {
    try {
      const { tiendaId } = req.params;

      console.log('🔍 Fetching replacement users for store:', tiendaId);

      const users = await User.find({
        tenantId: req.tenantId,
        tienda: tiendaId
      }).select('-password')
        .populate('tienda', 'nombre');

      console.log('✅ Found users for replacements:', users.length);

      res.json(users);
    } catch (error) {
      console.error('❌ Error fetching replacement users:', error);
      res.status(500).json({ message: error.message });
    }
  }

  // ✅ NUEVA: Ruta para usuarios eliminados ANTES de rutas con parámetros
  async getDeleted(req, res) {
    try {
      const deletedUsers = await User.find({
        tenantId: req.tenantId,
        isDeleted: true
      })
        .setOptions({ includeDeleted: true })
        .select('-password')
        .populate('tienda', 'nombre')
        .populate('deletedBy', 'username')
        .sort({ deletedAt: -1 });

      res.json(deletedUsers);
    } catch (err) {
      res.status(500).json({
        message: 'Error al obtener usuarios eliminados',
        error: err.message
      });
    }
  }

  // Obtener perfil del usuario
  async getProfile(req, res) {
    try {
      const Tenant = require('../../core/tenants/model');

      console.log('🔍 getProfile - userId:', req.userId, 'tenantId:', req.tenantId);

      if (!req.userId || !req.tenantId) {
        console.error('❌ Missing userId or tenantId:', { userId: req.userId, tenantId: req.tenantId });
        return res.status(400).json({ message: 'UserId o TenantId no proporcionado' });
      }

      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId })
        .populate('tienda', 'nombre');

      if (!user) {
        console.error('❌ User not found with userId:', req.userId, 'tenantId:', req.tenantId);
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Obtener información del tenant para enviar businessType y configuración
      const tenant = await Tenant.findById(req.tenantId)
        .select('businessType restaurantConfig limits');

      res.json({
        username: user.username,
        role: user.role,
        tienda: user.tienda?._id || null,
        tiendaNombre: user.tienda?.nombre || null,
        // ✨ NUEVO: Información del tenant
        tenant: {
          businessType: tenant?.businessType || 'dark_kitchen',
          isRestaurant: tenant?.businessType === 'restaurant',
          restaurantConfig: tenant?.businessType === 'restaurant' ? tenant.restaurantConfig : null,
          limits: tenant?.limits || {}
        }
      });
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      res.status(500).json({ message: 'Error al obtener perfil' });
    }
  }

  // Obtener todos los usuarios (solo admin)
  async getAll(req, res) {
    try {
      const startTime = Date.now();

      // Obtener la tienda del usuario actual
      const currentUser = await User.findOne({ _id: req.userId, tenantId: req.tenantId })
        .select('tienda role')
        .lean();

      const step1Time = Date.now();
      console.log(`⏱️ [getAll Users] Current user query: ${step1Time - startTime}ms`);

      if (!currentUser) {
        return res.status(404).json({ message: 'Usuario actual no encontrado' });
      }

      // Obtener parámetros de query (role y tienda opcionales)
      const { role, tienda } = req.query;

      let filter = {
        tenantId: req.tenantId // Siempre filtrar por tenant
      };

      // Si el usuario no es admin, filtrar por su tienda
      if (currentUser.role !== 'admin') {
        if (currentUser.tienda) {
          filter.tienda = currentUser.tienda;
        } else {
          // Si el usuario no-admin no tiene tienda, no devolver usuarios
          return res.json([]);
        }
      } else {
        // Si es admin, puede filtrar por tienda específica si se proporciona
        if (tienda) {
          filter.tienda = tienda;
        }
      }

      // Filtrar por rol si se proporciona
      if (role) {
        filter.role = role;
      }

      const step2Time = Date.now();
      const users = await User.find(filter)
        .select('username nombre email role tienda telefono')
        .populate('tienda', 'nombre')
        .lean();

      const endTime = Date.now();
      console.log(`⏱️ [getAll Users] Users query: ${endTime - step2Time}ms (${users.length} users)`);
      console.log(`⏱️ [getAll Users] TIEMPO TOTAL: ${endTime - startTime}ms`);

      res.json(users);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
    }
  }

  // MODIFICADO: Crear nuevo usuario
  async create(req, res) {
    try {
      const { username, email, password, role, telefono, tienda } = req.body;

      // Validar campos requeridos
      if (!username || !password || !role) {
        return errorResponse(res, 'Username, password y role son requeridos', 400);
      }

      // Validación: vendedores y repartidores deben tener tienda
      if (role !== "admin" && !tienda) {
        return errorResponse(res, "Los usuarios que no son admin deben tener una tienda asignada", 400);
      }

      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      // Validar fortaleza de contraseña
      const passwordValidation = validatePassword(password, {
        name: username,
        email: email
      });
      if (!passwordValidation.valid) {
        // Si hay sugerencias, incluirlas en el mensaje
        if (passwordValidation.suggestions && passwordValidation.suggestions.length > 0) {
          return errorResponse(res, passwordValidation.message, 400, {
            suggestions: passwordValidation.suggestions
          });
        }
        return errorResponse(res, passwordValidation.message, 400);
      }

      const newUser = new User({
        username,
        email: email ? email.toLowerCase().trim() : undefined,
        password,
        role,
        telefono,
        tienda,
        tenantId: req.tenantId
      });
      const savedUser = await newUser.save();

      return successResponse(res, {
        user: {
          _id: savedUser._id,
          id: savedUser._id,
          username: savedUser.username,
          role: savedUser.role
        }
      }, "Usuario creado exitosamente", 201);
    } catch (error) {
      console.error("Error al crear usuario:", error);
      return errorResponse(res, "Error al crear usuario", 400, { error: error.message });
    }
  }

  // ✅ CORREGIDO: Actualizar usuario con mejor manejo de tienda para admins
  async update(req, res) {
    try {
      const { username, email, password, role, telefono, tienda } = req.body;

      console.log('🔍 Updating user with data:', { username, email, role, telefono, tienda });

      // Construir objeto de actualización basado en el rol
      const updateData = {
        username,
        role,
        telefono
      };

      // Actualizar email si se proporciona
      if (email) {
        updateData.email = email.toLowerCase().trim();
      }

      // Solo manejar tienda si NO es admin
      if (role !== 'admin') {
        // Para usuarios no-admin, tienda es requerida
        if (!tienda) {
          return res.status(400).json({
            message: "Los usuarios que no son admin deben tener una tienda asignada"
          });
        }
        updateData.tienda = tienda;
      } else {
        // Para admins, remover tienda explícitamente
        updateData.$unset = { tienda: 1 };
      }

      console.log('🔍 Final update data:', updateData);

      // Si se proporciona contraseña, necesitamos usar save() para que el hook pre-save la hashee
      if (password && password.trim()) {
        // Validar fortaleza de contraseña
        const passwordValidation = validatePassword(password, {
          name: username,
          email: email
        });
        if (!passwordValidation.valid) {
          return res.status(400).json({
            message: passwordValidation.message,
            suggestions: passwordValidation.suggestions || []
          });
        }

        // Buscar usuario, actualizar y guardar para que se hashee la contraseña
        const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });
        if (!user) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // Actualizar campos
        user.username = username;
        user.role = role;
        user.telefono = telefono;
        if (email) user.email = email.toLowerCase().trim();
        user.password = password; // El hook pre-save lo hasheará

        if (role !== 'admin') {
          user.tienda = tienda;
        } else {
          user.tienda = undefined;
        }

        await user.save();

        const populatedUser = await User.findById(user._id).populate('tienda', 'nombre');

        console.log('✅ User updated with new password:', populatedUser.username);
        return res.json({
          message: 'Usuario actualizado exitosamente',
          user: {
            _id: populatedUser._id,
            username: populatedUser.username,
            email: populatedUser.email,
            role: populatedUser.role,
            telefono: populatedUser.telefono,
            tienda: populatedUser.tienda
          }
        });
      }

      // Sin cambio de contraseña, usar findOneAndUpdate
      const updatedUser = await User.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        updateData,
        {
          new: true,
          runValidators: role !== 'admin' // Solo validar si no es admin
        }
      ).populate('tienda', 'nombre');

      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log('✅ User updated successfully:', updatedUser.username);
      res.json({
        message: 'Usuario actualizado exitosamente',
        user: {
          _id: updatedUser._id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          telefono: updatedUser.telefono,
          tienda: updatedUser.tienda
        }
      });
    } catch (err) {
      console.error('❌ Error updating user:', err);
      res.status(400).json({
        message: 'Error al actualizar usuario',
        error: err.message
      });
    }
  }

  // ✅ NUEVA: Ruta para restaurar usuarios
  async restore(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .setOptions({ includeDeleted: true });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (!user.isDeleted) {
        return res.status(400).json({ message: 'El usuario no está eliminado' });
      }

      await user.restore();

      res.json({
        message: 'Usuario restaurado exitosamente',
        user: {
          username: user.username,
          role: user.role
        }
      });
    } catch (err) {
      res.status(400).json({
        message: 'Error al restaurar usuario',
        error: err.message
      });
    }
  }

  // Obtener usuario por ID
  async getById(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('tienda', 'nombre');

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Error al obtener usuario', error: error.message });
    }
  }

  // Eliminar usuario
  async delete(req, res) {
    try {
      const user = await User.findOne({ _id: req.params.id, tenantId: req.tenantId });

      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (user.isDeleted) {
        return res.status(400).json({ message: 'El usuario ya está eliminado' });
      }

      await user.softDelete(req.userId);

      res.json({
        message: 'Usuario eliminado exitosamente',
        action: 'soft_deleted',
        note: 'El usuario fue ocultado pero sus registros se mantuvieron para auditoría. Se puede restaurar desde la sección de usuarios eliminados.'
      });
    } catch (err) {
      res.status(400).json({
        message: 'Error al eliminar usuario',
        error: err.message
      });
    }
  }
}

module.exports = new UsersController();