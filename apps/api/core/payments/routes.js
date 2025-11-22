const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/core/paymentController');
const { verifyToken } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// ========== RUTAS PÚBLICAS ==========

// Webhook de Stripe (NO usar verifyToken - Stripe envía su propia firma)
router.post('/webhook', express.raw({ type: 'application/json' }), paymentController.handleWebhook);

// Obtener planes disponibles (público)
router.get('/plans', paymentController.getPlans);

// ========== RUTAS PROTEGIDAS ==========

// Crear customer en Stripe
router.post('/create-customer', verifyToken, identifyTenant, requireTenant, paymentController.createCustomer);

// Crear sesión de checkout (método recomendado)
router.post('/create-checkout-session', verifyToken, identifyTenant, requireTenant, paymentController.createCheckoutSession);

// Crear suscripción directamente (alternativa)
router.post('/create-subscription', verifyToken, identifyTenant, requireTenant, paymentController.createSubscription);

// Cancelar suscripción
router.post('/cancel-subscription', verifyToken, identifyTenant, requireTenant, paymentController.cancelSubscription);

// Obtener información de suscripción actual
router.get('/subscription', verifyToken, identifyTenant, requireTenant, paymentController.getCurrentSubscription);

module.exports = router;
