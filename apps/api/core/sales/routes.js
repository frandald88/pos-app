const express = require('express');
const router = express.Router();
const salesController = require('../../controllers/core/salesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { verificarTurnoActivo } = require('../../middleware/turnoMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Obtener todas las ventas con filtros y soporte para pagos mixtos
router.get('/', verifyToken, identifyTenant, requireTenant, salesController.getAll);

// Obtener tiendas para filtro (solo admin)
router.get('/tiendas', verifyToken, identifyTenant, requireTenant, salesController.getTiendas);

// Obtener ventas pendientes por tienda (para validación al cerrar turno)
router.get('/pending', verifyToken, identifyTenant, requireTenant, salesController.getPendingSales);

// Generar cotización PDF con soporte para pagos mixtos
router.post('/quote', verifyToken, identifyTenant, requireTenant, salesController.generateQuote);

// Crear nueva venta con soporte para pagos mixtos (requiere turno activo)
router.post('/', verifyToken, identifyTenant, requireTenant, verificarTurnoActivo, salesController.create);

// Validar pagos mixtos antes de crear la venta
router.post('/validate-mixed-payment', verifyToken, identifyTenant, requireTenant, salesController.validateMixedPayment);

// Eliminar múltiples ventas
router.post('/delete-multiple', verifyToken, identifyTenant, requireTenant, requireAdmin, salesController.deleteMultiple);

// Eliminar ventas sin tienda
router.delete('/no-store', verifyToken, identifyTenant, requireTenant, requireAdmin, salesController.deleteNoStore);

// Actualizar estado de venta
router.put('/:id/status', verifyToken, identifyTenant, requireTenant, salesController.updateStatus);

// Asignar repartidor a una venta
router.patch('/:id/delivery-person', verifyToken, identifyTenant, requireTenant, salesController.assignDeliveryPerson);

// Obtener estadísticas de pagos mixtos
router.get('/mixed-payment-stats', verifyToken, identifyTenant, requireTenant, salesController.getMixedPaymentStats);

// Obtener ventas por rango de fechas
router.get('/date-range', verifyToken, identifyTenant, requireTenant, salesController.getByDateRange);

// Obtener venta por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, salesController.getById);

module.exports = router;