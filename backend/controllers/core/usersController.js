const User = require('../../core/users/model');
const mongoose = require('mongoose');

class UsersController {

  // ✅ CORREGIDO: Obtener datos del usuario logueado CON tienda
  async getMe(req, res) {
    try {
      const user = await User.findById(req.userId)
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
      const deletedUsers = await User.find({ isDeleted: true })
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
      const user = await User.findById(req.userId).populate('tienda', 'nombre');
      res.json({
        username: user.username,
        role: user.role,
        tienda: user.tienda?._id || null,
        tiendaNombre: user.tienda?.nombre || null
      });
    } catch (error) {
      console.error('Error al obtener perfil de usuario:', error);
      res.status(500).json({ message: 'Error al obtener perfil' });
    }
  }

  // Obtener todos los usuarios (solo admin)
  async getAll(req, res) {
    try {
      // Obtener la tienda del usuario actual
      const currentUser = await User.findById(req.userId).select('tienda role');

      // Obtener parámetros de query (role y tienda opcionales)
      const { role, tienda } = req.query;

      let filter = {};

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

      const users = await User.find(filter).select('username nombre role tienda telefono')
        .populate('tienda', 'nombre');

      console.log('✅ Users found:', users.length, 'with filters:', filter);
      res.json(users);
    } catch (err) {
      console.error('❌ Error fetching users:', err);
      res.status(500).json({ message: 'Error al obtener usuarios', error: err.message });
    }
  }

  // MODIFICADO: Crear nuevo usuario
  async create(req, res) {
    try {
      const { username, password, role, telefono, tienda } = req.body;
          
      // Validación: vendedores y repartidores deben tener tienda
      if (role !== "admin" && !tienda) {
        return res.status(400).json({ 
          message: "Los usuarios que no son admin deben tener una tienda asignada" 
        });
      }
          
      const newUser = new User({ username, password, role, telefono, tienda });
      const savedUser = await newUser.save();
          
      res.status(201).json({ 
        message: "Usuario creado exitosamente",
        _id: savedUser._id,
        id: savedUser._id
      });
    } catch (error) {
      console.error("Error al crear usuario:", error);
      res.status(400).json({ message: "Error al crear usuario", error: error.message });
    }
  }

  // ✅ CORREGIDO: Actualizar usuario con mejor manejo de tienda para admins
  async update(req, res) {
    try {
      const { username, role, telefono, tienda } = req.body;
      
      console.log('🔍 Updating user with data:', { username, role, telefono, tienda });
      
      // Construir objeto de actualización basado en el rol
      const updateData = {
        username,
        role,
        telefono
      };
      
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
      
      // Usar findByIdAndUpdate con validación deshabilitada para admins
      const updatedUser = await User.findByIdAndUpdate(
        req.params.id, 
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
      const user = await User.findById(req.params.id).setOptions({ includeDeleted: true });
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
      const user = await User.findById(req.params.id).populate('tienda', 'nombre');
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
      const user = await User.findById(req.params.id);
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