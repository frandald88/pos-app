const jwt = require('jsonwebtoken');
const User = require('../../core/users/model');

function verifyToken(req, res, next) {
  console.log('🔍 Verifying token...');
  
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No authorization header or wrong format');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  console.log('🔍 Token received:', token.substring(0, 20) + '...');

  try {
    // Usar el mismo secret que en authController
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
    console.log('🔑 Using JWT secret for verification');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('✅ Token decoded successfully:', { id: decoded.id, role: decoded.role });
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
    return res.status(403).json({ message: 'Token inválido' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    console.log('🔍 Checking admin permissions for user:', req.userId);
    
    // Si ya tenemos el rol en el token, usarlo
    if (req.userRole && req.userRole === 'admin') {
      console.log('✅ Admin role confirmed from token');
      return next();
    }
    
    // Si no, consultar la base de datos
    const user = await User.findById(req.userId);
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.role !== 'admin') {
      console.log('❌ User is not admin:', user.role);
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    console.log('✅ Admin permissions confirmed');
    next();
  } catch (error) {
    console.error('❌ Error checking admin permissions:', error);
    return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
  }
}

function requireRoles(allowedRoles) {
  return async (req, res, next) => {
    try {
      console.log('🔍 Checking roles:', allowedRoles, 'for user:', req.userId);
      
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      if (!allowedRoles.includes(user.role)) {
        console.log('❌ User role not allowed:', user.role);
        return res.status(403).json({ 
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
        });
      }
      
      console.log('✅ Role permissions confirmed');
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
    }
  };
}

module.exports = { verifyToken, requireAdmin, requireRoles };
