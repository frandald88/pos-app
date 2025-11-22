const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const devolucionesController = require('../../controllers/modules/devolucionesController');

// Rutas específicas primero

// Obtener devoluciones por saleId
router.get('/by-sale/:saleId', verifyToken, identifyTenant, requireTenant, devolucionesController.getBySale);

// Reporte de devoluciones (solo admin)
router.get('/report/summary', verifyToken, identifyTenant, requireTenant, requireAdmin, devolucionesController.getReportSummary);

// Aprobar/Rechazar devolución (solo admin)
router.patch('/:id/status', verifyToken, identifyTenant, requireTenant, requireAdmin, devolucionesController.updateStatus);

// Rutas principales (CRUD)

// Crear devolución
router.post('/', verifyToken, identifyTenant, requireTenant, devolucionesController.createReturn);

// Obtener todas las devoluciones
router.get('/', verifyToken, identifyTenant, requireTenant, devolucionesController.getAll);

// Obtener devolución por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, devolucionesController.getById);

module.exports = router;
