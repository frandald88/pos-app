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

  // ========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ========================================

  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/forgot-password
   */
  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return errorResponse(res, 'El email es requerido', 400);
      }

      // Buscar usuario por email
      const user = await User.findOne({
        email: email.toLowerCase().trim()
      }).select('_id username email tenantId');

      // Por seguridad, siempre devolver mensaje genérico (no revelar si el email existe)
      const genericMessage = 'Si el email existe en nuestro sistema, recibirás un enlace de recuperación';

      if (!user || !user.email) {
        // Log para auditoría
        console.log(`⚠️ Intento de reset para email no registrado: ${email}`);
        return successResponse(res, {}, genericMessage);
      }

      // Generar token único y seguro
      const crypto = require('crypto');
      const resetToken = crypto.randomBytes(32).toString('hex');

      // Hashear el token antes de guardarlo
      const bcrypt = require('bcryptjs');
      const hashedToken = await bcrypt.hash(resetToken, 10);

      // Crear registro de reset
      const PasswordReset = require('../../core/auth/passwordResetModel');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

      await PasswordReset.create({
        userId: user._id,
        tenantId: user.tenantId,
        token: hashedToken,
        expiresAt,
        requestIp: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
      });

      // Construir URL de reset
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

      // Enviar email
      const emailService = require('../../shared/services/emailService');
      await emailService.sendPasswordResetEmail({
        to: user.email,
        username: user.username,
        resetUrl,
        expiresInMinutes: 60
      });

      console.log(`✅ Email de recuperación enviado a: ${email}`);

      return successResponse(res, {}, genericMessage);

    } catch (error) {
      console.error('❌ Error en forgot-password:', error);
      console.error('Stack trace:', error.stack);
      console.error('Error message:', error.message);
      return errorResponse(res, 'Error al procesar solicitud', 500);
    }
  }

  /**
   * Verificar si un token de reset es válido
   * POST /api/auth/verify-reset-token
   */
  async verifyResetToken(req, res) {
    try {
      const { token, email } = req.body;

      if (!token || !email) {
        return errorResponse(res, 'Token y email son requeridos', 400);
      }

      // Buscar usuario
      const user = await User.findOne({
        email: email.toLowerCase().trim()
      }).select('_id');

      if (!user) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Buscar token de reset
      const PasswordReset = require('../../core/auth/passwordResetModel');
      const resetRequests = await PasswordReset.find({
        userId: user._id,
        used: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!resetRequests || resetRequests.length === 0) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Verificar el token contra cada request (por si hay múltiples)
      const bcrypt = require('bcryptjs');
      let validRequest = null;

      for (const request of resetRequests) {
        const isValid = await bcrypt.compare(token, request.token);
        if (isValid) {
          validRequest = request;
          break;
        }
      }

      if (!validRequest) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      return successResponse(res, {
        valid: true,
        expiresAt: validRequest.expiresAt
      }, 'Token válido');

    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return errorResponse(res, 'Error al verificar token', 500);
    }
  }

  /**
   * Restablecer contraseña con token
   * POST /api/auth/reset-password
   */
  async resetPassword(req, res) {
    try {
      const { token, email, newPassword } = req.body;

      if (!token || !email || !newPassword) {
        return errorResponse(res, 'Token, email y nueva contraseña son requeridos', 400);
      }

      // Validar fortaleza de contraseña
      const { validatePassword } = require('../../shared/utils/passwordValidation');
      const passwordValidation = validatePassword(newPassword, {
        email: email
      });

      if (!passwordValidation.valid) {
        return errorResponse(res, passwordValidation.message, 400, {
          suggestions: passwordValidation.suggestions || []
        });
      }

      // Buscar usuario
      const user = await User.findOne({
        email: email.toLowerCase().trim()
      }).select('_id username email tenantId password');

      if (!user) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Buscar token de reset válido
      const PasswordReset = require('../../core/auth/passwordResetModel');
      const resetRequests = await PasswordReset.find({
        userId: user._id,
        used: false,
        expiresAt: { $gt: new Date() }
      }).sort({ createdAt: -1 });

      if (!resetRequests || resetRequests.length === 0) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Verificar el token
      const bcrypt = require('bcryptjs');
      let validRequest = null;

      for (const request of resetRequests) {
        const isValid = await bcrypt.compare(token, request.token);
        if (isValid) {
          validRequest = request;
          break;
        }
      }

      if (!validRequest) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Validar que la nueva contraseña sea diferente a la actual
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        return errorResponse(res, 'La nueva contraseña debe ser diferente a la contraseña anterior', 400);
      }

      // Actualizar contraseña
      user.password = newPassword; // El hook pre-save la hasheará
      user.mustChangePassword = false; // Por si tenía flag de cambio forzado
      await user.save();

      // Marcar token como usado
      await validRequest.markAsUsed();

      // Invalidar todos los demás tokens de reset de este usuario
      await PasswordReset.updateMany(
        {
          userId: user._id,
          used: false,
          _id: { $ne: validRequest._id }
        },
        {
          used: true,
          usedAt: new Date()
        }
      );

      // Enviar email de confirmación
      const emailService = require('../../shared/services/emailService');
      await emailService.sendPasswordChangedEmail({
        to: user.email,
        username: user.username,
        changeDate: new Date()
      });

      console.log(`✅ Contraseña restablecida para usuario: ${user.username}`);

      return successResponse(res, {
        message: 'Contraseña actualizada exitosamente'
      }, 'Contraseña restablecida exitosamente');

    } catch (error) {
      console.error('❌ Error al restablecer contraseña:', error);
      return errorResponse(res, 'Error al restablecer contraseña', 500);
    }
  }

  // Verificar token de activación de cuenta
  async verifyActivationToken(req, res) {
    try {
      const { token } = req.params;

      if (!token) {
        return errorResponse(res, 'Token requerido', 400);
      }

      // Buscar usuario con este token
      const user = await User.findOne({
        activationToken: token,
        activationTokenExpires: { $gt: new Date() }
      }).populate('tenantId', 'companyName');

      if (!user) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      return successResponse(res, {
        email: user.email,
        companyName: user.tenantId?.companyName || '',
        valid: true
      }, 'Token válido');

    } catch (error) {
      console.error('Error al verificar token de activación:', error);
      return errorResponse(res, 'Error al verificar token', 500);
    }
  }

  // Activar cuenta y establecer contraseña
  async activateAccount(req, res) {
    try {
      const { token, password } = req.body;

      // Validaciones
      if (!token || !password) {
        return errorResponse(res, 'Token y contraseña son requeridos', 400);
      }

      // Validar contraseña
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return errorResponse(res, passwordValidation.message, 400);
      }

      // Buscar usuario con este token
      const user = await User.findOne({
        activationToken: token,
        activationTokenExpires: { $gt: new Date() }
      });

      if (!user) {
        return errorResponse(res, 'Token inválido o expirado', 400);
      }

      // Activar cuenta y establecer contraseña
      user.password = password; // El hook pre-save la hasheará
      user.isActive = true;
      user.activationToken = undefined;
      user.activationTokenExpires = undefined;
      await user.save();

      console.log('Cuenta activada exitosamente:', user.email);

      return successResponse(res, {
        message: 'Cuenta activada exitosamente'
      }, 'Cuenta activada - ahora puedes iniciar sesión');

    } catch (error) {
      console.error('Error al activar cuenta:', error);
      return errorResponse(res, 'Error al activar cuenta', 500);
    }
  }
}

module.exports = new AuthController();