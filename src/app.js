require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import utilities and middleware
const logger = require('./utils/logger');
const database = require('./config/database');
const { 
  globalErrorHandler, 
  notFoundHandler 
} = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// TODO: Import other routes as they are created

class App {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 4000;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  initializeMiddleware() {
    // Security middleware
    this.app.use(helmet({
      crossOriginEmbedderPolicy: false,
    }));

    // CORS configuration
    const corsOptions = {
      origin: process.env.ALLOWED_ORIGINS ? 
        process.env.ALLOWED_ORIGINS.split(',') : 
        ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    };
    this.app.use(cors(corsOptions));

    // Compression middleware
    this.app.use(compression());

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', limiter);

    // Body parsing middleware
    this.app.use(express.json({ 
      limit: '10mb',
      type: 'application/json'
    }));
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // HTTP request logging
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined', {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      }));
    }

    // Custom request logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(req.method, req.originalUrl, res.statusCode, duration);
      });
      
      next();
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'FitStat API v1.0',
        documentation: '/api/docs',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
  }

  initializeRoutes() {
    // Mount routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', userRoutes);
    
    // TODO: Add other routes here as they are created
    // this.app.use('/api/classes', classRoutes);
    // this.app.use('/api/forums', forumRoutes);
    // this.app.use('/api/payments', paymentRoutes);
    // this.app.use('/api/newsletters', newsletterRoutes);
    // this.app.use('/api/reviews', reviewRoutes);
    
    // API documentation route placeholder
    this.app.get('/api/docs', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'API Documentation',
        endpoints: {
          auth: '/api/auth',
          users: '/api/users',
          // TODO: Add other endpoints as they are created
        }
      });
    });
  }

  initializeErrorHandling() {
    // Handle 404 errors
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(globalErrorHandler);
  }

  async start() {
    try {
      // Connect to database
      await database.connect();
      
      // Start server
      this.server = this.app.listen(this.port, () => {
        logger.success(`🚀 Server running on port ${this.port}`);
        logger.info(`📖 API Documentation: http://localhost:${this.port}/api/docs`);
        logger.info(`🏥 Health Check: http://localhost:${this.port}/health`);
        logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Handle server shutdown gracefully
      process.on('SIGTERM', this.gracefulShutdown.bind(this));
      process.on('SIGINT', this.gracefulShutdown.bind(this));

    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  async gracefulShutdown(signal) {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    if (this.server) {
      this.server.close(async () => {
        logger.info('HTTP server closed.');
        
        try {
          await database.disconnect();
          logger.info('Database connection closed.');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database shutdown:', error);
          process.exit(1);
        }
      });
    }
  }
}

// Create and start the application
const app = new App();

if (require.main === module) {
  app.start();
}

module.exports = app;