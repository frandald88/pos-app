const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const purchaseOrdersController = require('../../controllers/modules/purchaseOrdersController');

// Rutas auxiliares (antes de rutas con parámetros)

// Obtener tiendas para selector
router.get('/tiendas', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.getTiendas);

// Obtener usuarios para selector
router.get('/users', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.getUsers);

// Rutas CRUD

// Obtener todas las órdenes de compra
router.get('/', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.getAll);

// Crear nueva orden de compra
router.post('/', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.create);

// Obtener orden por ID
router.get('/:id', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.getById);

// Actualizar orden
router.put('/:id', verifyToken, identifyTenant, requireTenant, purchaseOrdersController.update);

// Eliminar orden (solo admin, órdenes completadas o canceladas)
router.delete('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, purchaseOrdersController.delete);

module.exports = router;
