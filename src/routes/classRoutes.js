const express = require('express');
const Joi = require('joi');
const classController = require('../controllers/classController');
const { verifyToken, authorize } = require('../middleware/auth');
const { 
  validate, 
  validateObjectId, 
  schemas 
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/', 
  validate(schemas.search, 'query'),
  classController.getAllClasses
);

router.get('/all', classController.getAllClassesSimple);

router.get('/popular', 
  validate(schemas.pagination.keys({ 
    limit: Joi.number().min(1).max(100).optional()
  }), 'query'),
  classController.getPopularClasses
);

router.get('/categories', classController.getClassesByCategory);

router.get('/search', 
  validate(schemas.search.keys({
    q: Joi.string().required()
  }), 'query'),
  classController.searchClasses
);

router.get('/:id', 
  validateObjectId(),
  classController.getClassById
);

router.get('/:id/validate-capacity', 
  validateObjectId(),
  classController.validateCapacity
);

// Protected routes - require authentication
router.use(verifyToken);

// Booking-related routes (authenticated users)
router.patch('/:id/book', 
  validateObjectId(),
  classController.incrementBookingCount
);

// Admin and Trainer routes
router.use(authorize('admin', 'trainer'));

router.post('/', 
  validate(schemas.classCreation),
  classController.createClass
);

router.patch('/:id', 
  validateObjectId(),
  validate(schemas.classCreation.fork(
    ['name', 'description', 'image', 'price', 'duration', 'difficulty', 'category'],
    (schema) => schema.optional()
  )),
  classController.updateClass
);

// Admin only routes
router.use(authorize('admin'));

router.delete('/:id', 
  validateObjectId(),
  classController.deleteClass
);

router.get('/admin/stats', classController.getClassStats);

module.exports = router;