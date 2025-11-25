const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');
const { validatePassword } = require('../../shared/utils/passwordValidation');

class AuthController {

  // Login de usuario
  async login(req, res) {
    console.log('🔑 Login attempt received:', req.body);

    try {
      const { email, password, tenantId } = req.body;

      // Validaciones basicas
      if (!email || !password) {
        console.log('❌ Missing email or password');
        return errorResponse(res, 'Email y password son requeridos', 400);
      }

      console.log('🔍 Searching for user by email:', email);

      // Buscar usuarios con este email (puede estar en campo email o username)
      // Usar regex case-insensitive para manejar emails guardados con diferente case
      const emailRegex = new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
      const users = await Promise.race([
        User.find({
          $or: [
            { email: emailRegex },
            { username: emailRegex }
          ]
        })
          .populate('tienda', 'nombre')
          .populate('tenantId', 'companyName subdomain businessType'),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ]);

      if (!users || users.length === 0) {
        console.log('❌ User not found with email:', email);
        // Debug: buscar si existe con otro case
        const debugUser = await User.findOne({
          $or: [
            { email: { $regex: new RegExp(`^${email}$`, 'i') } },
            { username: { $regex: new RegExp(`^${email}$`, 'i') } }
          ]
        });
        if (debugUser) {
          console.log('🔍 Found user with case-insensitive search:', {
            username: debugUser.username,
            email: debugUser.email
          });
        }
        return errorResponse(res, 'Usuario no encontrado', 400);
      }

      // Si el usuario está en múltiples tenants y no se especificó cuál
      if (users.length > 1 && !tenantId) {
        console.log('📋 User has multiple tenants, returning list');
        const tenants = users.map(u => ({
          tenantId: u.tenantId._id,
          companyName: u.tenantId.companyName,
          subdomain: u.tenantId.subdomain
        }));

        return successResponse(res, {
          requiresTenantSelection: true,
          tenants
        }, 'Selecciona un workspace');
      }

      // Seleccionar el usuario correcto
      let user;
      if (tenantId) {
        user = users.find(u => u.tenantId._id.toString() === tenantId);
        if (!user) {
          return errorResponse(res, 'Usuario no encontrado en este workspace', 400);
        }
      } else {
        user = users[0];
      }

      console.log('✅ User found:', {
        username: user.username,
        email: user.email,
        role: user.role,
        tenant: user.tenantId.companyName
      });

      // Verificar contraseña
      console.log('🔍 Verifying password...');
      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        console.log('❌ Invalid password for user:', email);
        return errorResponse(res, 'Contraseña incorrecta', 400);
      }

      console.log('✅ Password verified for user:', email);

      // Generar token
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';

      const token = jwt.sign(
        {
          id: user._id,
          role: user.role,
          username: user.username,
          email: user.email,
          tienda: user.tienda?._id || null,
          tenantId: user.tenantId._id
        },
        jwtSecret,
        { expiresIn: '1d' }
      );

      console.log('✅ Token generated successfully for user:', email);

      // Respuesta exitosa
      const response = {
        token,
        user: {
          id: user._id,
          nombre: user.username,
          username: user.username,
          email: user.email,
          role: user.role,
          tienda: user.tienda?._id || null,
          tiendaNombre: user.tienda?.nombre || null,
          telefono: user.telefono,
          mustChangePassword: user.mustChangePassword || false
        },
        tenant: {
          id: user.tenantId._id,
          companyName: user.tenantId.companyName,
          subdomain: user.tenantId.subdomain,
          businessType: user.tenantId.businessType || 'supermarket'
        }
      };

      console.log('✅ Sending successful response for user:', email);
      return successResponse(res, response, 'Login exitoso');

    } catch (error) {
      console.error('❌ Error en login:', error);

      if (error.message === 'Database timeout') {
        return errorResponse(res, 'Error de conexion a base de datos', 500);
      }

      return errorResponse(res, 'Error al iniciar sesion', 500);
    }
  }

  // Verificar token
  async verifyToken(req, res) {
    try {
      console.log('🔍 Verifying token...');
      return successResponse(res, { verified: true }, 'Token valido');
    } catch (error) {
      console.error('Error verificando token:', error);
      return errorResponse(res, 'Error al verificar token', 500);
    }
  }

  // ✅ IMPLEMENTAR CORRECTAMENTE getProfile
  async getProfile(req, res) {
    try {
      console.log('👤 Getting profile for user ID:', req.userId);

      // Buscar usuario por ID del token y tenantId si está disponible
      const query = { _id: req.userId };
      if (req.tenantId) {
        query.tenantId = req.tenantId;
      }

      const user = await User.findOne(query)
        .populate('tienda', 'nombre')
        .select('-password'); // Excluir password

      if (!user) {
        console.log('❌ User not found for ID:', req.userId);
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      console.log('✅ Profile found:', {
        username: user.username,
        role: user.role,
        tienda: user.tienda?.nombre
      });

      // Respuesta con formato esperado por el frontend
      const response = {
        user: {
          id: user._id,
          nombre: user.username, // Usar username como nombre
          username: user.username,
          email: user.username, // Para compatibilidad si el frontend busca email
          role: user.role,
          tienda: user.tienda,
          telefono: user.telefono,
          activo: true, // Asumir activo si existe
          createdAt: user.createdAt
        }
      };

      return successResponse(res, response, 'Perfil obtenido exitosamente');
      
    } catch (error) {
      console.error('❌ Error getting profile:', error);
      return errorResponse(res, 'Error al obtener perfil', 500);
    }
  }

  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validar campos requeridos
      if (!currentPassword || !newPassword) {
        return errorResponse(res, 'La contraseña actual y la nueva contraseña son requeridas', 400);
      }

      // Validar tenantId
      if (!req.tenantId) {
        return errorResponse(res, 'Tenant no identificado', 400);
      }

      // Obtener usuario actual
      const user = await User.findOne({ _id: req.userId, tenantId: req.tenantId });
      if (!user) {
        return errorResponse(res, 'Usuario no encontrado', 404);
      }

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return errorResponse(res, 'La contraseña actual es incorrecta', 401);
      }

      // Validar que la nueva contraseña sea diferente a la actual
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return errorResponse(res, 'La nueva contraseña debe ser diferente a la contraseña actual', 400);
      }

      // Validar fortaleza de la nueva contraseña
      const passwordValidation = validatePassword(newPassword, {
        name: user.username,
        email: user.email
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

      // Actualizar contraseña (el modelo se encarga del hash)
      user.password = newPassword;
      user.mustChangePassword = false; // Limpiar flag de cambio obligatorio
      await user.save();

      return successResponse(res, {
        message: 'Contraseña actualizada exitosamente'
      }, 'Contraseña actualizada exitosamente');

    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      return errorResponse(res, 'Error al cambiar contraseña', 500);
    }
  }

  async refreshToken(req, res) {
    return successResponse(res, {}, 'Funcion no implementada');
  }

  async logout(req, res) {
    return successResponse(res, {}, 'Logout exitoso');
  }
}

module.exports = new AuthController();