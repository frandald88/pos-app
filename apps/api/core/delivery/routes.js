const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { checkFeatureAccess } = require('../../shared/middleware/limitMiddleware');
const deliveryController = require('../../controllers/modules/deliveryController');

// Rutas específicas primero (antes de rutas con parámetros)

// Obtener mis órdenes (del usuario actual)
router.get('/mine', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.getMine);

// Obtener tiendas para órdenes
router.get('/tiendas', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.getTiendas);

// Obtener usuarios para asignación
router.get('/users', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.getUsers);

// Reporte de órdenes (solo admin)
router.get('/report/summary', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), requireAdmin, deliveryController.getReportSummary);

// Rutas principales (CRUD)

// Crear nueva orden
router.post('/', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.createOrder);

// Obtener todas las órdenes
router.get('/', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.getAll);

// Obtener orden por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.getById);

// Actualizar orden
router.put('/:id', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), deliveryController.updateOrder);

// Eliminar orden
router.delete('/:id', verifyToken, identifyTenant, requireTenant, checkFeatureAccess('delivery'), requireAdmin, deliveryController.deleteOrder);

module.exports = router;
