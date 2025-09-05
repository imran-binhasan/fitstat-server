const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConfig {
  constructor() {
    this.connection = null;
  }

  async connect() {
    try {
      console.log('MONGODB_URI loaded:', !!process.env.MONGODB_URI);
      console.log('Attempting to connect to MongoDB...');
      
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false
      };

      this.connection = await mongoose.connect(process.env.MONGODB_URI, options);
      
      logger.info('✅ MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('error', (error) => {
        logger.error('❌ MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ MongoDB disconnected');
      });

      process.on('SIGINT', this.gracefulShutdown.bind(this));
      process.on('SIGTERM', this.gracefulShutdown.bind(this));

      return this.connection;
    } catch (error) {
      console.log('MongoDB connection error details:', error);
      logger.error('❌ MongoDB connection failed:', error.message || error);
      process.exit(1);
    }
  }

  async gracefulShutdown() {
    try {
      await mongoose.connection.close();
      logger.info('✅ MongoDB connection closed gracefully');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during MongoDB shutdown:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      logger.info('✅ MongoDB disconnected');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = new DatabaseConfig();