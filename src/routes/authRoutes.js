const express = require('express');
const authController = require('../controllers/authController');
const { verifyToken, authRateLimit } = require('../middleware/auth');
const { validate, validateEmail, schemas } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Public authentication routes
router.post('/register', 
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  validate(schemas.userRegistration),
  authController.register
);

router.post('/login', 
  authRateLimit(5, 15 * 60 * 1000), // 5 attempts per 15 minutes
  validate(schemas.userLogin),
  authController.login
);

router.post('/social-login', 
  authRateLimit(10, 15 * 60 * 1000), // 10 attempts per 15 minutes
  validate(Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().min(2).max(50).required(),
    photoURL: Joi.string().uri().optional(),
    provider: Joi.string().valid('google', 'facebook', 'github').required()
  })),
  authController.socialLogin
);

router.post('/forgot-password', 
  authRateLimit(3, 15 * 60 * 1000), // 3 attempts per 15 minutes
  validate(Joi.object({
    email: Joi.string().email().required()
  })),
  authController.forgotPassword
);

// Legacy JWT generation endpoint (for backward compatibility)
router.post('/jwt', 
  validate(Joi.object({
    email: Joi.string().email().required(),
    id: Joi.string().optional()
  })),
  authController.generateToken
);

// Role verification endpoint
router.get('/verify-role', 
  validateEmail('query'),
  authController.verifyRole
);

// Protected routes - require authentication
router.use(verifyToken);

// Token refresh
router.post('/refresh-token', authController.refreshToken);

// Change password
router.patch('/change-password', 
  validate(Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
  })),
  authController.changePassword
);

// Check authentication status
router.get('/me', authController.checkAuth);

// Logout
router.post('/logout', authController.logout);

module.exports = router;