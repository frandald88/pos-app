const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/core/paymentController');
const { verifyToken } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// ========== RUTAS PÚBLICAS ==========

// NOTA: El webhook está montado directamente en server.js ANTES de express.json()
// para que pueda recibir el body raw necesario para verificar la firma de Stripe

// Obtener planes disponibles (público)
router.get('/plans', paymentController.getPlans);

// Verificar sesión de pago (público - para nuevos usuarios)
router.get('/verify-session/:sessionId', paymentController.verifySession);

// ========== RUTAS PROTEGIDAS ==========

// Crear customer en Stripe
router.post('/create-customer', verifyToken, identifyTenant, requireTenant, paymentController.createCustomer);

// Crear sesión de checkout (método recomendado)
// NOTA: No requiere verifyToken porque puede llamarse durante el registro
router.post('/create-checkout-session', paymentController.createCheckoutSession);

// Crear suscripción directamente (alternativa)
router.post('/create-subscription', verifyToken, identifyTenant, requireTenant, paymentController.createSubscription);

// Cancelar suscripción
router.post('/cancel-subscription', verifyToken, identifyTenant, requireTenant, paymentController.cancelSubscription);

// Obtener información de suscripción actual
router.get('/subscription', verifyToken, identifyTenant, requireTenant, paymentController.getCurrentSubscription);

// Crear sesión del portal de cliente (para gestionar suscripción)
router.post('/create-portal-session', verifyToken, identifyTenant, requireTenant, paymentController.createPortalSession);

// Cambiar plan de suscripción
router.post('/change-plan', verifyToken, identifyTenant, requireTenant, paymentController.changePlan);

module.exports = router;
