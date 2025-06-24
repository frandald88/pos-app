const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token inválido' });
  }
}

// Placeholder, se puede mejorar si luego agregas roles en el modelo de usuario
function requireAdmin(req, res, next) {
  next(); // Por ahora, simplemente permite el paso
}

module.exports = { verifyToken, requireAdmin };
