const Joi = require('joi');
const logger = require('../utils/logger');

// Validation schemas
const schemas = {
  // User validation schemas
  userRegistration: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    photoURL: Joi.string().uri().optional().allow(''),
    role: Joi.string().valid('member', 'trainer').default('member')
  }),

  userLogin: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  trainerApplication: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    age: Joi.number().min(13).max(100).required(),
    photoURL: Joi.string().uri().required(),
    skills: Joi.array().items(Joi.string()).min(1).required(),
    availableDays: Joi.array().items(
      Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')
    ).min(1).required(),
    hoursPerDay: Joi.number().min(1).max(24).required(),
    experience: Joi.number().min(0).required(),
    socialLinks: Joi.object({
      facebook: Joi.string().allow(''),
      twitter: Joi.string().allow(''),
      instagram: Joi.string().allow(''),
      linkedin: Joi.string().allow('')
    }).optional(),
    biodata: Joi.string().max(1000).required()
  }),

  slotCreation: Joi.object({
    selectedClasses: Joi.array().items(
      Joi.object({
        label: Joi.string().required(),
        value: Joi.string().required()
      })
    ).min(1).required(),
    slotName: Joi.string().required(),
    slotTime: Joi.string().required(),
    slotDay: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required()
  }),

  // Class validation schemas
  classCreation: Joi.object({
    name: Joi.string().max(100).required(),
    description: Joi.string().max(1000).required(),
    image: Joi.string().uri().required(),
    price: Joi.number().min(0).required(),
    duration: Joi.number().min(1).required(),
    difficulty: Joi.string().valid('Beginner', 'Intermediate', 'Advanced').required(),
    category: Joi.string().required(),
    maxCapacity: Joi.number().min(1).default(20)
  }),

  // Forum validation schemas
  forumPost: Joi.object({
    title: Joi.string().max(200).required(),
    content: Joi.string().max(5000).required(),
    author: Joi.object({
      name: Joi.string().required(),
      email: Joi.string().email().required(),
      avatar: Joi.string().uri().optional()
    }).required(),
    category: Joi.string().required(),
    tags: Joi.array().items(Joi.string()).optional()
  }),

  // Newsletter validation schema
  newsletterSubscription: Joi.object({
    email: Joi.string().email().required(),
    name: Joi.string().optional(),
    preferences: Joi.object({
      topics: Joi.array().items(
        Joi.string().valid('fitness', 'nutrition', 'wellness', 'classes', 'events')
      ).optional(),
      frequency: Joi.string().valid('daily', 'weekly', 'monthly').default('weekly')
    }).optional()
  }),

  // Payment validation schema
  paymentIntent: Joi.object({
    price: Joi.number().min(0).required()
  }),

  payment: Joi.object({
    userEmail: Joi.string().email().required(),
    userName: Joi.string().required(),
    trainerName: Joi.string().required(),
    trainerEmail: Joi.string().email().required(),
    classId: Joi.string().required(),
    packageName: Joi.string().required(),
    packagePrice: Joi.number().min(0).required(),
    slotName: Joi.string().required(),
    paymentIntentId: Joi.string().required(),
    paymentMethod: Joi.string().default('card'),
    currency: Joi.string().default('usd')
  }),

  // Review validation schema
  review: Joi.object({
    userEmail: Joi.string().email().required(),
    userName: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().max(1000).required(),
    trainerEmail: Joi.string().email().optional(),
    classId: Joi.string().optional()
  }),

  // Query validation schemas
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(10)
  }),

  search: Joi.object({
    search: Joi.string().allow('').default(''),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(6)
  })
};

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      logger.warn('Validation error:', { 
        endpoint: `${req.method} ${req.path}`,
        errors: errorDetails 
      });

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace the request property with validated data
    req[property] = value;
    next();
  };
};

// Common validation middleware
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`
      });
    }
    
    next();
  };
};

// Email validation middleware
const validateEmail = (property = 'query', field = 'email') => {
  return (req, res, next) => {
    const email = req[property][field];
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: `${field} is required`
      });
    }

    const emailSchema = Joi.string().email();
    const { error } = emailSchema.validate(email);

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    next();
  };
};

module.exports = {
  schemas,
  validate,
  validateObjectId,
  validateEmail
};