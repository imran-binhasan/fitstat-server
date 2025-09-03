const logger = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle Mongoose cast errors
const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

// Handle Mongoose duplicate field errors
const handleDuplicateFieldsDB = (error) => {
  const value = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new AppError(message, 400);
};

// Handle Mongoose validation errors
const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Handle JWT errors
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Send error in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message
    });
  } 
  // Programming or other unknown error: don't leak error details
  else {
    // Log error for developers
    logger.error('ERROR 💥:', err);

    // Send generic message
    res.status(500).json({
      success: false,
      message: 'Something went wrong!'
    });
  }
};

// Main error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Log the error
  logger.error(`Error ${err.statusCode}:`, {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Validation error helper
const validationError = (message, field = null) => {
  const errorMessage = field ? `${field}: ${message}` : message;
  return new AppError(errorMessage, 400);
};

// Authentication error helper
const authError = (message = 'Authentication failed') => {
  return new AppError(message, 401);
};

// Authorization error helper
const forbiddenError = (message = 'Access denied') => {
  return new AppError(message, 403);
};

// Not found error helper
const notFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404);
};

// Conflict error helper
const conflictError = (message = 'Resource already exists') => {
  return new AppError(message, 409);
};

// Rate limit error helper
const rateLimitError = (message = 'Too many requests') => {
  return new AppError(message, 429);
};

// Server error helper
const serverError = (message = 'Internal server error') => {
  return new AppError(message, 500, false);
};

module.exports = {
  AppError,
  globalErrorHandler,
  asyncHandler,
  notFoundHandler,
  validationError,
  authError,
  forbiddenError,
  notFoundError,
  conflictError,
  rateLimitError,
  serverError
};