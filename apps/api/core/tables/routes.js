const express = require('express');
const router = express.Router();
const tablesController = require('./controller');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Todas las rutas requieren autenticación y tenant
const authMiddleware = [verifyToken, identifyTenant, requireTenant];

// Obtener secciones únicas (disponible para todos los usuarios autenticados)
router.get('/sections', authMiddleware, tablesController.getSections);

// Listar mesas (todos los usuarios autenticados pueden ver)
router.get('/', authMiddleware, tablesController.getAll);

// Obtener mesa por ID
router.get('/:id', authMiddleware, tablesController.getById);

// Crear mesa (solo admin)
router.post('/', [...authMiddleware, requireAdmin], tablesController.create);

// Actualizar mesa (solo admin)
router.put('/:id', [...authMiddleware, requireAdmin], tablesController.update);

// Cambiar estado de mesa (todos los usuarios pueden cambiar estado, ej: meseros ponen en limpieza)
router.patch('/:id/status', authMiddleware, tablesController.changeStatus);

// Eliminar mesa (solo admin)
router.delete('/:id', [...authMiddleware, requireAdmin], tablesController.delete);

module.exports = router;
