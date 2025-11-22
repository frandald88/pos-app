const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const empleadosController = require('../../controllers/modules/empleadosController');

// Rutas específicas DEBEN ir ANTES que las rutas con parámetros

// Obtener historiales eliminados
router.get('/history/deleted', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.getDeleted);

// Restaurar historial eliminado
router.patch('/history/:id/restore', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.restore);

// Ranking de empleados con menos faltas
router.get('/history/ranking/faltas', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.getRankingFaltas);

// Obtener empleados activos
router.get('/activos', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.getActivos);

// Crear historial
router.post('/history', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.createHistory);

// Obtener historial completo
router.get('/history', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.getHistory);

// Obtener historial por employeeId
router.get('/history/employee/:employeeId', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.getByEmployee);

// Actualizar historial
router.put('/history/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.updateHistory);

// Eliminar registro (con soft delete)
router.delete('/history/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, empleadosController.deleteHistory);

module.exports = router;
