const { Subscriber } = require('../models');
const { 
  notFoundError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class NewsletterService {
  async subscribe(subscriberData) {
    try {
      // Check if email already exists
      const existingSubscriber = await Subscriber.findOne({ 
        email: subscriberData.email 
      });

      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          throw conflictError('Email is already subscribed to newsletter');
        } else {
          // Reactivate inactive subscription
          existingSubscriber.isActive = true;
          if (subscriberData.name) existingSubscriber.name = subscriberData.name;
          if (subscriberData.preferences) {
            existingSubscriber.preferences = subscriberData.preferences;
          }
          await existingSubscriber.save();
          
          logger.info('Newsletter subscription reactivated:', { 
            email: existingSubscriber.email 
          });
          
          return existingSubscriber;
        }
      }

      // Create new subscription
      const subscriber = new Subscriber(subscriberData);
      await subscriber.save();
      
      logger.info('New newsletter subscriber:', { 
        email: subscriber.email,
        preferences: subscriber.preferences
      });

      return subscriber;
    } catch (error) {
      logger.error('Error subscribing to newsletter:', error);
      throw error;
    }
  }

  async unsubscribe(email) {
    try {
      const subscriber = await Subscriber.findOne({ email });
      
      if (!subscriber) {
        throw notFoundError('Subscriber not found');
      }

      if (!subscriber.isActive) {
        throw validationError('Email is already unsubscribed');
      }

      subscriber.isActive = false;
      await subscriber.save();
      
      logger.info('Newsletter unsubscription:', { email });
      
      return { message: 'Successfully unsubscribed from newsletter' };
    } catch (error) {
      logger.error('Error unsubscribing from newsletter:', error);
      throw error;
    }
  }

  async getAllSubscribers(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        isActive = true,
        topic,
        frequency,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = {};

      // Filter by active status
      if (isActive !== undefined) {
        query.isActive = isActive;
      }

      // Filter by topic preference
      if (topic) {
        query['preferences.topics'] = topic;
      }

      // Filter by frequency preference
      if (frequency) {
        query['preferences.frequency'] = frequency;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const subscribers = await Subscriber.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Subscriber.countDocuments(query);

      return {
        subscribers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalSubscribers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching subscribers:', error);
      throw error;
    }
  }

  async getSubscriberByEmail(email) {
    try {
      const subscriber = await Subscriber.findOne({ email });
      
      if (!subscriber) {
        throw notFoundError('Subscriber');
      }

      return subscriber;
    } catch (error) {
      logger.error('Error fetching subscriber by email:', error);
      throw error;
    }
  }

  async updateSubscriberPreferences(email, preferences) {
    try {
      const subscriber = await Subscriber.findOneAndUpdate(
        { email },
        { preferences },
        { new: true, runValidators: true }
      );

      if (!subscriber) {
        throw notFoundError('Subscriber');
      }

      logger.info('Subscriber preferences updated:', { email, preferences });

      return subscriber;
    } catch (error) {
      logger.error('Error updating subscriber preferences:', error);
      throw error;
    }
  }

  async deleteSubscriber(email) {
    try {
      const subscriber = await Subscriber.findOneAndDelete({ email });
      
      if (!subscriber) {
        throw notFoundError('Subscriber');
      }

      logger.info('Subscriber deleted:', { email });
      
      return { message: 'Subscriber deleted successfully' };
    } catch (error) {
      logger.error('Error deleting subscriber:', error);
      throw error;
    }
  }

  async getSubscriberStats() {
    try {
      const stats = await Subscriber.aggregate([
        {
          $group: {
            _id: null,
            totalSubscribers: { $sum: 1 },
            activeSubscribers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            inactiveSubscribers: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
            }
          }
        }
      ]);

      // Frequency distribution
      const frequencyStats = await Subscriber.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$preferences.frequency',
            count: { $sum: 1 }
          }
        }
      ]);

      // Topic preferences distribution
      const topicStats = await Subscriber.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$preferences.topics' },
        {
          $group: {
            _id: '$preferences.topics',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      // Monthly subscription trends (last 12 months)
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyStats = await Subscriber.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newSubscribers: { $sum: 1 },
            activeSubscribers: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        overview: stats[0] || {
          totalSubscribers: 0,
          activeSubscribers: 0,
          inactiveSubscribers: 0
        },
        frequencyDistribution: frequencyStats,
        topicDistribution: topicStats,
        monthlyTrends: monthlyStats
      };
    } catch (error) {
      logger.error('Error fetching subscriber stats:', error);
      throw error;
    }
  }

  async getSubscribersByTopic(topic) {
    try {
      const subscribers = await Subscriber.find({
        isActive: true,
        'preferences.topics': topic
      }).select('email name preferences');

      return subscribers;
    } catch (error) {
      logger.error('Error fetching subscribers by topic:', error);
      throw error;
    }
  }

  async getSubscribersByFrequency(frequency) {
    try {
      const subscribers = await Subscriber.find({
        isActive: true,
        'preferences.frequency': frequency
      }).select('email name preferences');

      return subscribers;
    } catch (error) {
      logger.error('Error fetching subscribers by frequency:', error);
      throw error;
    }
  }

  async bulkUnsubscribe(emails) {
    try {
      const result = await Subscriber.updateMany(
        { email: { $in: emails } },
        { isActive: false }
      );

      logger.info('Bulk unsubscribe completed:', { 
        emailCount: emails.length,
        modifiedCount: result.modifiedCount 
      });

      return {
        message: `${result.modifiedCount} subscribers unsubscribed successfully`,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error in bulk unsubscribe:', error);
      throw error;
    }
  }

  async exportSubscribers(filters = {}) {
    try {
      const query = { isActive: true, ...filters };
      
      const subscribers = await Subscriber.find(query)
        .select('email name preferences createdAt')
        .sort({ createdAt: -1 });

      // Format for CSV export
      const csvData = subscribers.map(subscriber => ({
        email: subscriber.email,
        name: subscriber.name || '',
        topics: subscriber.preferences?.topics?.join(';') || '',
        frequency: subscriber.preferences?.frequency || 'weekly',
        subscribedDate: subscriber.createdAt.toISOString().split('T')[0]
      }));

      logger.info('Subscribers exported:', { count: csvData.length });

      return csvData;
    } catch (error) {
      logger.error('Error exporting subscribers:', error);
      throw error;
    }
  }

  async validateSubscriberData(subscriberData) {
    try {
      // Basic validation
      if (!subscriberData.email) {
        throw validationError('Email is required');
      }

      // Validate email format (basic check)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(subscriberData.email)) {
        throw validationError('Invalid email format');
      }

      // Validate preferences if provided
      if (subscriberData.preferences) {
        const validTopics = ['fitness', 'nutrition', 'wellness', 'classes', 'events'];
        const validFrequencies = ['daily', 'weekly', 'monthly'];

        if (subscriberData.preferences.topics) {
          const invalidTopics = subscriberData.preferences.topics.filter(
            topic => !validTopics.includes(topic)
          );
          if (invalidTopics.length > 0) {
            throw validationError(`Invalid topics: ${invalidTopics.join(', ')}`);
          }
        }

        if (subscriberData.preferences.frequency && 
            !validFrequencies.includes(subscriberData.preferences.frequency)) {
          throw validationError('Invalid frequency. Must be daily, weekly, or monthly');
        }
      }

      return true;
    } catch (error) {
      logger.error('Subscriber validation error:', error);
      throw error;
    }
  }
}

module.exports = new NewsletterService();