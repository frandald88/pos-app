const express = require('express');
const router = express.Router();
const salesController = require('../../controllers/core/salesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');

// Obtener todas las ventas con filtros y soporte para pagos mixtos
router.get('/', verifyToken, salesController.getAll);

// Obtener tiendas para filtro (solo admin)
router.get('/tiendas', verifyToken, salesController.getTiendas);

// Generar cotización PDF con soporte para pagos mixtos
router.post('/quote', verifyToken, salesController.generateQuote);

// Crear nueva venta con soporte para pagos mixtos
router.post('/', verifyToken, salesController.create);

// Validar pagos mixtos antes de crear la venta
router.post('/validate-mixed-payment', verifyToken, salesController.validateMixedPayment);

// Eliminar múltiples ventas
router.post('/delete-multiple', verifyToken, requireAdmin, salesController.deleteMultiple);

// Eliminar ventas sin tienda
router.delete('/no-store', verifyToken, requireAdmin, salesController.deleteNoStore);

// Actualizar estado de venta
router.put('/:id/status', verifyToken, salesController.updateStatus);

// Obtener estadísticas de pagos mixtos
router.get('/mixed-payment-stats', verifyToken, salesController.getMixedPaymentStats);

// Obtener ventas por rango de fechas
router.get('/date-range', verifyToken, salesController.getByDateRange);

// Obtener venta por ID
router.get('/:id', verifyToken, salesController.getById);

module.exports = router;