const express = require('express');
const router = express.Router();
const accountsController = require('./controller');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Todas las rutas requieren autenticación y tenant
const authMiddleware = [verifyToken, identifyTenant, requireTenant];

// Listar cuentas
router.get('/', authMiddleware, accountsController.getAll);

// Obtener cuenta por ID
router.get('/:id', authMiddleware, accountsController.getById);

// Crear nueva cuenta (abrir mesa)
router.post('/', authMiddleware, accountsController.create);

// Agregar orden a cuenta existente
router.post('/:id/orders', authMiddleware, accountsController.addOrder);

// Actualizar estado de item específico
router.patch('/:id/items/status', authMiddleware, accountsController.updateItemStatus);

// Aplicar descuento
router.patch('/:id/discount', authMiddleware, accountsController.applyDiscount);

// Cancelar cuenta (requiere admin si está configurado)
router.post('/:id/cancel', authMiddleware, accountsController.cancel);

// Features 4-7: Propina, Ticket, Split, Pago
router.patch('/:id/tip', authMiddleware, accountsController.applyTip);
router.get('/:id/preliminary-ticket', authMiddleware, accountsController.generatePreliminaryTicket);
router.post('/:id/split', authMiddleware, accountsController.configureSplit);
router.post('/:id/split/:splitNum/pay', authMiddleware, accountsController.paySplit);
router.post('/:id/pay', authMiddleware, accountsController.payAccount);
router.post('/:id/close', authMiddleware, accountsController.closeAccount);

// Features 8-10: Cocina
router.post('/:id/send-to-kitchen', authMiddleware, accountsController.sendToKitchen);
router.patch('/:id/mark-ready', authMiddleware, accountsController.markItemReady);
router.patch('/:id/cancel-item', authMiddleware, accountsController.cancelItem);
router.patch('/:id/edit-item', authMiddleware, accountsController.editItem);

// Features 11-15: Subcuentas
router.post('/:id/subcuentas', authMiddleware, accountsController.addSubcuenta);
router.delete('/:id/subcuentas', authMiddleware, accountsController.removeSubcuenta);
router.patch('/:id/subcuentas/assign', authMiddleware, accountsController.assignItemToSubcuenta);
router.get('/:id/subcuentas/summary', authMiddleware, accountsController.getSubcuentasSummary);
router.post('/:id/subcuentas/pay', authMiddleware, accountsController.paySubcuenta);

// IMPORTANTE: Esta ruta debe ir al final porque /kitchen/items podría confundirse con /:id
router.get('/kitchen/items', authMiddleware, accountsController.getKitchenItems);

module.exports = router;
