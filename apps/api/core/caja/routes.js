const express = require('express');
const router = express.Router();
const cajaController = require('../../controllers/modules/cajaController');
const { verifyToken, requireAdmin, requireRoles } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Reporte de corte de caja - Acceso para admin y vendedor
router.get('/reporte', verifyToken, identifyTenant, requireTenant, requireRoles(['admin', 'vendedor']), cajaController.getReport);

// Movimientos de caja del día - Acceso para admin y vendedor
router.get('/movimientos', verifyToken, identifyTenant, requireTenant, requireRoles(['admin', 'vendedor']), cajaController.getMovements);

// Estado actual de caja (tiempo real) - Acceso para admin y vendedor
router.get('/estado', verifyToken, identifyTenant, requireTenant, requireRoles(['admin', 'vendedor']), cajaController.getStatus);

module.exports = router;