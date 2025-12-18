const express = require('express');
const router = express.Router();
const tenantsController = require('./controller');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// ========== RUTAS PÚBLICAS (sin autenticación) ==========

// ✅ NUEVO: Registro completo (tenant + owner + tienda + JWT)
router.post('/register', tenantsController.register);

// ✅ NUEVO: Verificar disponibilidad de subdomain
router.get('/check-subdomain/:subdomain', tenantsController.checkSubdomain);

// ✅ NUEVO: Obtener slots de Founder disponibles (público)
router.get('/founder-slots', tenantsController.getFounderSlots);

// Crear tenant - Registro de nuevo negocio (endpoint legacy)
router.post('/', tenantsController.create);

// Rutas protegidas (requieren autenticación)
// Obtener estadísticas del tenant actual
router.get('/stats', verifyToken, identifyTenant, requireTenant, tenantsController.getStats);

// Rutas de super admin (para gestionar todos los tenants)
// En el futuro, podrías agregar un middleware requireSuperAdmin
router.get('/', verifyToken, tenantsController.getAll);
router.get('/:id', verifyToken, tenantsController.getById);
router.put('/:id', verifyToken, requireAdmin, tenantsController.update);
router.post('/:id/suspend', verifyToken, requireAdmin, tenantsController.suspend);
router.post('/:id/reactivate', verifyToken, requireAdmin, tenantsController.reactivate);

// ✅ NUEVO: Upgrade de plan (requiere autenticación)
router.post('/:tenantId/upgrade', verifyToken, identifyTenant, requireTenant, tenantsController.upgradePlan);

// Endpoint para ejecutar manualmente el chequeo de suscripciones (solo admin)
router.post('/admin/check-subscriptions', verifyToken, requireAdmin, async (req, res) => {
  const subscriptionCheckJob = require('../../shared/jobs/subscriptionCheckJob');

  try {
    const result = await subscriptionCheckJob.runNow();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
