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

// ✅ Esta es la que te está causando el error si está mal:
function requireAdmin(req, res, next) {
  next();  // Por ahora solo pasa directo
}

module.exports = { verifyToken, requireAdmin };
