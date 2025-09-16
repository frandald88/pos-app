const jwt = require('jsonwebtoken');
const User = require('../../core/users/model');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_key_12345';
    const decoded = jwt.verify(token, jwtSecret);
    
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
}

async function requireAdmin(req, res, next) {
  try {
    // Si ya tenemos el rol en el token, usarlo
    if (req.userRole && req.userRole === 'admin') {
      return next();
    }
    
    // Si no, consultar la base de datos
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador' });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
  }
}

function requireRoles(allowedRoles) {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Acceso denegado. Se requiere uno de los siguientes roles: ${allowedRoles.join(', ')}` 
        });
      }
      
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Error al verificar permisos', error: error.message });
    }
  };
}

module.exports = { verifyToken, requireAdmin, requireRoles };
