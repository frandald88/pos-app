const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/core/usersController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkResourceLimit, incrementResourceCount, decrementResourceCount } = require('../../shared/middleware/limitMiddleware');

// ✅ IMPORTANTE: Rutas específicas ANTES que rutas con parámetros

// ✅ CORREGIDO: Obtener datos del usuario logueado CON tienda
router.get('/me', verifyToken, identifyTenant, requireTenant, usersController.getMe);

// ✅ CORREGIDO: Nuevo endpoint específico para reemplazos
router.get('/replacements/:tiendaId', verifyToken, identifyTenant, requireTenant, usersController.getReplacements);

// ✅ NUEVA: Ruta para usuarios eliminados ANTES de rutas con parámetros
router.get('/deleted', verifyToken, identifyTenant, requireTenant, requireAdmin, usersController.getDeleted);

// Obtener perfil del usuario
router.get('/profile', verifyToken, identifyTenant, requireTenant, usersController.getProfile);

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, identifyTenant, requireTenant, usersController.getAll);

// MODIFICADO: Crear nuevo usuario (con límites de plan)
router.post("/",
  verifyToken,
  identifyTenant,
  requireTenant,
  checkResourceLimit('users'),
  usersController.create,
  incrementResourceCount('users')
);

// ✅ CORREGIDO: Actualizar usuario con mejor manejo de tienda para admins
router.put('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, usersController.update);

// ✅ NUEVA: Ruta para restaurar usuarios
router.patch('/:id/restore', verifyToken, identifyTenant, requireTenant, requireAdmin, usersController.restore);

// ✅ Rutas con parámetros AL FINAL
// Obtener usuario por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, usersController.getById);

// Eliminar usuario (con decremento de contador)
router.delete('/:id',
  verifyToken,
  identifyTenant,
  requireTenant,
  requireAdmin,
  usersController.delete,
  decrementResourceCount('users')
);

module.exports = router;