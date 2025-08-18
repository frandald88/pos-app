const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../../core/users/model');
const { successResponse, errorResponse } = require('../../shared/utils/responseHelper');

class AuthController {

  // Login de usuario
  async login(req, res) {
    console.log('🔑 Login attempt received:', req.body);
    console.log('🔍 Environment check:', {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET_EXISTS: !!process.env.JWT_SECRET,
      MONGO_URI: process.env.MONGO_URI ? 'exists' : 'missing'
    });
    
    try {
      const { username, password } = req.body;

      // Validaciones basicas
      if (!username || !password) {
        console.log('❌ Missing username or password');
        return errorResponse(res, 'Username y password son requeridos', 400);
      }

      console.log('🔍 Searching for user in database:', username);

      // Buscar usuario con timeout
      const user = await Promise.race([
        User.findOne({ username }).populate('tienda', 'nombre'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database timeout')), 5000)
        )
      ]);
      
      if (!user) {
        console.log('❌ User not found:', username);
        return errorResponse(res, 'Usuario no encontrado', 400);
      }

      console.log('✅ User found:', {
        username: user.username,
        role: user.role,
        hasPassword: !!user.password
      });

      // Verificar contraseña
      console.log('🔍 Verifying password...');
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        console.log('❌ Invalid password for user:', username);
        return errorResponse(res, 'Contraseña incorrecta', 400);
      }

      console.log('✅ Password verified for user:', username);

      // Generar token
      const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
      console.log('🔑 Generating token with secret length:', jwtSecret.length);
      
      const token = jwt.sign(
        { 
          id: user._id,
          role: user.role,
          username: user.username,
          tienda: user.tienda?._id || null
        },
        jwtSecret,
        { expiresIn: '1d' }
      );

      console.log('✅ Token generated successfully for user:', username);

      // Respuesta exitosa
      const response = {
        token,
        user: {
          id: user._id,
          nombre: user.username, // ✅ Agregar nombre para compatibilidad con frontend
          username: user.username,
          role: user.role,
          tienda: user.tienda?._id || null,
          tiendaNombre: user.tienda?.nombre || null,
          telefono: user.telefono
        }
      };

      console.log('✅ Sending successful response for user:', username);
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
      
      // Buscar usuario por ID del token
      const user = await User.findById(req.userId)
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
    return successResponse(res, {}, 'Funcion no implementada');
  }

  async refreshToken(req, res) {
    return successResponse(res, {}, 'Funcion no implementada');
  }

  async logout(req, res) {
    return successResponse(res, {}, 'Logout exitoso');
  }
}

module.exports = new AuthController();