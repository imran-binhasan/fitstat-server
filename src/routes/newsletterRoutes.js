
const express = require('express');
const newsletterController = require('../controllers/newsletterController');
const { verifyToken, authorize } = require('../middleware/auth');
const { 
  validate, 
  validateEmail,
  schemas 
} = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// Public routes
router.post('/subscribe', 
  validate(schemas.newsletterSubscription),
  newsletterController.subscribe
);

router.post('/unsubscribe', 
  validate(Joi.object({
    email: Joi.string().email().required()
  })),
  newsletterController.unsubscribe
);

// Protected routes - require authentication
router.use(verifyToken);

// Update subscriber preferences (users can update their own)
router.patch('/preferences/:email', 
  validateEmail('params', 'email'),
  validate(Joi.object({
    preferences: Joi.object({
      topics: Joi.array().items(
        Joi.string().valid('fitness', 'nutrition', 'wellness', 'classes', 'events')
      ).optional(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').optional()
    }).required()
  })),
  newsletterController.updatePreferences
);

// Admin only routes
router.use(authorize('admin'));

// Get all subscribers with filters
router.get('/', 
  validate(schemas.pagination.keys({
    isActive: Joi.boolean().optional(),
    topic: Joi.string().valid('fitness', 'nutrition', 'wellness', 'classes', 'events').optional(),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').optional(),
    sortBy: Joi.string().valid('createdAt', 'email', 'name').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional()
  }), 'query'),
  newsletterController.getAllSubscribers
);

// Get subscriber by email
router.get('/subscriber', 
  validateEmail('query'),
  newsletterController.getSubscriberByEmail
);

// Get subscriber statistics
router.get('/stats', newsletterController.getSubscriberStats);

// Get subscribers by topic
router.get('/topic/:topic', 
  validate(Joi.object({
    topic: Joi.string().valid('fitness', 'nutrition', 'wellness', 'classes', 'events').required()
  }), 'params'),
  newsletterController.getSubscribersByTopic
);

// Get subscribers by frequency
router.get('/frequency/:frequency', 
  validate(Joi.object({
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').required()
  }), 'params'),
  newsletterController.getSubscribersByFrequency
);

// Bulk unsubscribe
router.post('/bulk-unsubscribe', 
  validate(Joi.object({
    emails: Joi.array().items(Joi.string().email()).min(1).required()
  })),
  newsletterController.bulkUnsubscribe
);

// Export subscribers
router.get('/export', 
  validate(Joi.object({
    topic: Joi.string().valid('fitness', 'nutrition', 'wellness', 'classes', 'events').optional(),
    frequency: Joi.string().valid('daily', 'weekly', 'monthly').optional()
  }), 'query'),
  newsletterController.exportSubscribers
);

// Delete subscriber
router.delete('/', 
  validateEmail('query'),
  newsletterController.deleteSubscriber
);

module.exports = router;