const express = require('express');
const router = express.Router();
const cajaController = require('../../controllers/modules/cajaController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Reporte de corte de caja
router.get('/reporte', verifyToken, requireAdmin, cajaController.getReport);

// Movimientos de caja del día
router.get('/movimientos', verifyToken, requireAdmin, cajaController.getMovements);

// Estado actual de caja (tiempo real)
router.get('/estado', verifyToken, requireAdmin, cajaController.getStatus);

module.exports = router;