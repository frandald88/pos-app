const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/core/usersController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// ✅ IMPORTANTE: Rutas específicas ANTES que rutas con parámetros

// ✅ CORREGIDO: Obtener datos del usuario logueado CON tienda
router.get('/me', verifyToken, usersController.getMe);

// ✅ CORREGIDO: Nuevo endpoint específico para reemplazos
router.get('/replacements/:tiendaId', verifyToken, usersController.getReplacements);

// ✅ NUEVA: Ruta para usuarios eliminados ANTES de rutas con parámetros
router.get('/deleted', verifyToken, requireAdmin, usersController.getDeleted);

// Obtener perfil del usuario
router.get('/profile', verifyToken, usersController.getProfile);

// Obtener todos los usuarios (solo admin)
router.get('/', verifyToken, usersController.getAll);

// MODIFICADO: Crear nuevo usuario
router.post("/", verifyToken, usersController.create);

// ✅ CORREGIDO: Actualizar usuario con mejor manejo de tienda para admins
router.put('/:id', verifyToken, requireAdmin, usersController.update);

// ✅ NUEVA: Ruta para restaurar usuarios
router.patch('/:id/restore', verifyToken, requireAdmin, usersController.restore);

// ✅ Rutas con parámetros AL FINAL
// Obtener usuario por ID
router.get('/:id', verifyToken, usersController.getById);

// Eliminar usuario
router.delete('/:id', verifyToken, requireAdmin, usersController.delete);

module.exports = router;