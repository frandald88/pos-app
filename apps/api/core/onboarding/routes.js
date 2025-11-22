const express = require('express');
const router = express.Router();
const onboardingController = require('../../controllers/core/onboardingController');
const { verifyToken } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Todas las rutas de onboarding requieren autenticación y tenant

// Obtener estado del onboarding
router.get('/status', verifyToken, identifyTenant, requireTenant, onboardingController.getStatus);

// Actualizar progreso
router.put('/progress', verifyToken, identifyTenant, requireTenant, onboardingController.updateProgress);

// Completar onboarding
router.post('/complete', verifyToken, identifyTenant, requireTenant, onboardingController.complete);

// Reiniciar onboarding (para re-ver el tour)
router.post('/reset', verifyToken, identifyTenant, requireTenant, onboardingController.reset);

// Obtener códigos de área de países
router.get('/country-codes', verifyToken, identifyTenant, requireTenant, onboardingController.getCountryCodes);

// Obtener productos de ejemplo
router.get('/sample-products', verifyToken, identifyTenant, requireTenant, onboardingController.getSampleProducts);

// Cargar productos de ejemplo
router.post('/load-sample-products', verifyToken, identifyTenant, requireTenant, onboardingController.loadSampleProducts);

// ✨ NUEVO: Actualizar tipo de negocio (Paso 0)
router.put('/business-type', verifyToken, identifyTenant, requireTenant, onboardingController.updateBusinessType);

// Actualizar configuración de tienda (Paso 1)
router.put('/store-config', verifyToken, identifyTenant, requireTenant, onboardingController.updateStoreConfig);

// Crear miembro del equipo (Paso 3)
router.post('/team-member', verifyToken, identifyTenant, requireTenant, onboardingController.createTeamMember);

module.exports = router;
