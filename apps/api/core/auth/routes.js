const express = require('express');
const router = express.Router();
const authController = require('../../controllers/core/authController');
const { identifyTenant, requireTenant } = require('../../shared/middleware/tenantMiddleware');
const { verifyToken } = require('../../shared/middleware/authMiddleware');

// Login route (público - no requiere tenant)
router.post('/login', authController.login);

// Verify token route
router.get('/verify', authController.verifyToken);

// Get profile route (con tenant si está disponible)
router.get('/profile', identifyTenant, authController.getProfile);

// Change password route (requiere autenticación y tenant)
router.patch('/change-password', verifyToken, identifyTenant, requireTenant, authController.changePassword);

// Refresh token route
router.post('/refresh', authController.refreshToken);

// Logout route
router.post('/logout', authController.logout);

// ========================================
// RECUPERACIÓN DE CONTRASEÑA
// ========================================

// Solicitar recuperación de contraseña (público)
router.post('/forgot-password', authController.forgotPassword);

// Verificar token de reset (público)
router.post('/verify-reset-token', authController.verifyResetToken);

// Restablecer contraseña con token (público)
router.post('/reset-password', authController.resetPassword);

module.exports = router;
