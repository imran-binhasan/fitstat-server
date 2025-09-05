
const express = require('express');
const paymentController = require('../controllers/paymentController');
const { verifyToken, authorize } = require('../middleware/auth');
const { 
  validate, 
  validateObjectId, 
  validateEmail,
  schemas 
} = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create payment intent
router.post('/create-payment-intent', 
  validate(schemas.paymentIntent),
  paymentController.createPaymentIntent
);

// Process payment after Stripe confirmation
router.post('/', 
  validate(schemas.payment),
  paymentController.processPayment
);

// Get user's own payments
router.get('/my-payments', paymentController.getUserPayments);

// Get user's latest payment
router.get('/latest', paymentController.getLatestUserPayment);

// Get specific payment by ID (users can only view their own unless admin)
router.get('/:id', 
  validateObjectId(),
  paymentController.getPaymentById
);

// Get booked slots for a class
router.get('/slots/booked', 
  validate(Joi.object({
    classId: Joi.string().required()
  }), 'query'),
  paymentController.getBookedSlots
);

// Admin and Trainer routes
router.use(authorize('admin', 'trainer'));

// Get all payments with filters (Admin/Trainer)
router.get('/', 
  validate(schemas.pagination.keys({
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').optional(),
    userEmail: Joi.string().email().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    sortBy: Joi.string().valid('createdAt', 'packagePrice', 'paymentStatus').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }), 'query'),
  paymentController.getAllPayments
);

// Admin only routes
router.use(authorize('admin'));

// Refund payment
router.post('/:id/refund', 
  validateObjectId(),
  validate(Joi.object({
    reason: Joi.string().valid('duplicate', 'fraudulent', 'requested_by_customer').default('requested_by_customer')
  })),
  paymentController.refundPayment
);

// Get payment statistics
router.get('/admin/stats', paymentController.getPaymentStats);

// Get dashboard statistics
router.get('/admin/dashboard', paymentController.getDashboardStats);

module.exports = router;