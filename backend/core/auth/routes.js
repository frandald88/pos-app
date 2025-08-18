const express = require('express');
const router = express.Router();
const authController = require('../../controllers/core/authController');

// Login route
router.post('/login', authController.login);

// Verify token route
router.get('/verify', authController.verifyToken);

// Get profile route  
router.get('/profile', authController.getProfile);

// Change password route
router.patch('/change-password', authController.changePassword);

// Refresh token route
router.post('/refresh', authController.refreshToken);

// Logout route
router.post('/logout', authController.logout);

module.exports = router;
