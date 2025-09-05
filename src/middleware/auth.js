const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Generate JWT token
const generateToken = (payload, options = {}) => {
  const defaultOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '4h',
    issuer: 'fitstat-api',
    audience: 'fitstat-app'
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, { ...defaultOptions, ...options });
};

// Verify JWT token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user still exists
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // Check if user is active
    if (user.status === 'inactive') {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    // Attach user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token'
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Token verification failed'
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.status !== 'inactive') {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (error) {
    // Just continue without user if token is invalid
    next();
  }
};

// Authorization middleware factory
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized access attempt:', {
        userId: req.user._id,
        userRole: req.user.role,
        requiredRoles: roles,
        endpoint: `${req.method} ${req.path}`
      });

      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Check if user owns the resource
const checkOwnership = (resourceField = 'userEmail') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const userIdentifier = req.user.email;
    const resourceOwner = req.body[resourceField] || req.query[resourceField];
    
    if (resourceOwner && resourceOwner !== userIdentifier) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own resources'
      });
    }

    next();
  };
};

// Rate limiting for authentication attempts
const authRateLimit = (maxAttempts = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip + req.body.email;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old attempts
    const userAttempts = attempts.get(key) || [];
    const validAttempts = userAttempts.filter(attempt => attempt > windowStart);
    
    if (validAttempts.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: `Too many authentication attempts. Try again in ${windowMs / 60000} minutes.`
      });
    }

    validAttempts.push(now);
    attempts.set(key, validAttempts);
    
    next();
  };
};

// Middleware to check if user can apply for trainer role
const canApplyForTrainer = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user already has trainer role
    if (req.user.role === 'trainer') {
      return res.status(400).json({
        success: false,
        message: 'User is already a trainer'
      });
    }

    // Check if user has pending application
    if (req.user.status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Application is already pending'
      });
    }

    next();
  } catch (error) {
    logger.error('Error checking trainer application eligibility:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  authorize,
  checkOwnership,
  authRateLimit,
  canApplyForTrainer
};