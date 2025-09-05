const express = require('express');
const reviewController = require('../controllers/reviewController');
const { verifyToken, authorize, optionalAuth } = require('../middleware/auth');
const { 
  validate, 
  validateObjectId, 
  validateEmail,
  schemas 
} = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Public routes
router.get('/', 
  validate(schemas.pagination.keys({
    rating: Joi.number().integer().min(1).max(5).optional(),
    classId: Joi.string().optional(),
    trainerEmail: Joi.string().email().optional(),
    isVerified: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'rating').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }), 'query'),
  reviewController.getAllReviews
);

router.get('/top', 
  validate(schemas.pagination.keys({
    limit: Joi.number().min(1).max(100).optional()
  }), 'query'),
  reviewController.getTopReviews
);

router.get('/class/:classId', 
  validateObjectId('classId'),
  validate(schemas.pagination.keys({
    rating: Joi.number().integer().min(1).max(5).optional(),
    isVerified: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'rating').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }), 'query'),
  reviewController.getClassReviews
);

router.get('/trainer/:trainerEmail', 
  validateEmail('params', 'trainerEmail'),
  validate(schemas.pagination.keys({
    rating: Joi.number().integer().min(1).max(5).optional(),
    isVerified: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'rating').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }), 'query'),
  reviewController.getTrainerReviews
);

router.get('/:id', 
  validateObjectId(),
  optionalAuth,
  reviewController.getReviewById
);

// Protected routes - require authentication
router.use(verifyToken);

// User reviews
router.get('/user/my-reviews', reviewController.getUserReviews);

router.get('/user/latest', reviewController.getLatestUserReview);

// Create, update, delete reviews
router.post('/', 
  validate(schemas.review),
  reviewController.createReview
);

router.patch('/:id', 
  validateObjectId(),
  validate(schemas.review.fork(['userEmail', 'userName'], (schema) => schema.optional())),
  reviewController.updateReview
);

router.delete('/:id', 
  validateObjectId(),
  reviewController.deleteReview
);

// Admin only routes
router.use(authorize('admin'));

// Review moderation
router.patch('/:id/verify', 
  validateObjectId(),
  reviewController.verifyReview
);

router.patch('/:id/hide', 
  validateObjectId(),
  reviewController.hideReview
);

router.patch('/:id/show', 
  validateObjectId(),
  reviewController.showReview
);

// Bulk operations
router.post('/bulk/verify', 
  validate(Joi.object({
    reviewIds: Joi.array().items(Joi.string().required()).min(1).required()
  })),
  reviewController.bulkVerifyReviews
);

router.post('/bulk/hide', 
  validate(Joi.object({
    reviewIds: Joi.array().items(Joi.string().required()).min(1).required()
  })),
  reviewController.bulkHideReviews
);

// Statistics
router.get('/admin/stats', reviewController.getReviewStats);

module.exports = router;