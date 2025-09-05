const express = require('express');
const Joi = require('joi');
const userController = require('../controllers/userController');
const { verifyToken, authorize, canApplyForTrainer } = require('../middleware/auth');
const { 
  validate, 
  validateObjectId, 
  validateEmail,
  schemas 
} = require('../middleware/validation');

const router = express.Router();

// Public routes
router.get('/trainers', userController.getAllTrainers);
router.get('/trainers/team', userController.getFeaturedTrainers);
router.get('/trainers/class/:name', userController.getTrainersByClass);
router.get('/trainer/:id', validateObjectId(), userController.getUserById);
router.get('/booking/:id', validateObjectId(), userController.getTrainerForBooking);

// Protected routes - require authentication
router.use(verifyToken);

// User profile routes
router.get('/me', userController.getMyProfile);
router.patch('/me', 
  validate(schemas.trainerApplication.fork(['name', 'age', 'photoURL'], (schema) => schema.optional())),
  userController.updateMyProfile
);

// Trainer application routes
router.patch('/:id/apply', 
  validateObjectId(),
  canApplyForTrainer,
  validate(schemas.trainerApplication),
  userController.applyForTrainer
);

// Slot management routes (trainers only)
router.patch('/:id/slot', 
  validateObjectId(),
  authorize('trainer'),
  validate(schemas.slotCreation),
  userController.addSlot
);

router.patch('/:id/slot/remove', 
  validateObjectId(),
  authorize('trainer'),
  userController.removeSlot
);

// Admin only routes
router.use(authorize('admin'));

// User management
router.get('/', 
  validate(schemas.pagination.keys({
    role: Joi.string().valid('member', 'trainer', 'admin').optional(),
    status: Joi.string().valid('active', 'pending', 'rejected', 'inactive').optional()
  }), 'query'),
  userController.getAllUsers
);

router.get('/user', 
  validateEmail('query'),
  userController.getUserByEmail
);

router.get('/stats', userController.getUserStats);

router.post('/', 
  validate(schemas.userRegistration),
  userController.createUser
);

router.delete('/:id', 
  validateObjectId(),
  userController.deleteUser
);

// Trainer application management
router.get('/applications', userController.getPendingApplications);
router.get('/application/:id', 
  validateObjectId(),
  userController.getApplicationDetail
);

router.patch('/application/accept/:id', 
  validateObjectId(),
  validate({
    status: Joi.string().valid('active').required(),
    role: Joi.string().valid('trainer').required()
  }),
  userController.approveTrainerApplication
);

router.patch('/application/reject/:id', 
  validateObjectId(),
  validate({
    status: Joi.string().valid('rejected').required(),
    feedback: Joi.string().max(500).required()
  }),
  userController.rejectTrainerApplication
);

router.patch('/trainer/:id/remove', 
  validateObjectId(),
  userController.removeTrainer
);

module.exports = router;