const express = require('express');
const router = express.Router();
const vacacionesController = require('../../controllers/modules/vacacionesController');
const { verifyToken, requireAdmin } = require('../../shared/middleware/authMiddleware');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');

// Deletion management routes (must be before parameterized routes)
router.get('/deleted', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.getDeleted);
router.patch('/:id/restore', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.restore);
router.delete('/cleanup', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.cleanup);

// Days available and request creation
router.get('/days-available/:userId', verifyToken, identifyTenant, requireTenant, vacacionesController.getDaysAvailable);
router.post('/request', verifyToken, identifyTenant, requireTenant, vacacionesController.createRequest);

// Employee routes
router.get('/mine', verifyToken, identifyTenant, requireTenant, vacacionesController.getMine);

// Admin routes
router.get('/all', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.getAll);
router.patch('/:id/status', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.updateStatus);
router.delete('/:id', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.deleteRequest);

// Verification and utility routes
router.get('/verify/:userId', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.verify);
router.post('/update-taken-days', verifyToken, identifyTenant, requireTenant, requireAdmin, vacacionesController.updateTakenDays);
router.get('/days-summary/:userId', verifyToken, identifyTenant, requireTenant, vacacionesController.getDaysSummary);

// Individual request route (must be after other GET routes to avoid conflicts)
router.get('/:id', verifyToken, identifyTenant, requireTenant, vacacionesController.getById);

module.exports = router;
