const User = require('../models/User');
const { Class, Payment, Subscriber, Review, Forum } = require('../models');
const logger = require('../utils/logger');

class DashboardService {
  async getDashboardStats() {
    try {
      // Get all statistics in parallel for better performance
      const [
        userStats,
        paymentStats,
        classStats,
        subscriberStats,
        reviewStats,
        forumStats,
        recentTransactions,
        topClasses,
        recentUsers
      ] = await Promise.all([
        this.getUserStats(),
        this.getPaymentOverview(),
        this.getClassOverview(),
        this.getSubscriberCount(),
        this.getReviewOverview(),
        this.getForumOverview(),
        this.getRecentTransactions(),
        this.getTopPerformingClasses(),
        this.getRecentUsers()
      ]);

      return {
        overview: {
          totalUsers: userStats.totalUsers,
          totalMembers: userStats.memberCount,
          totalTrainers: userStats.trainerCount,
          totalBookings: paymentStats.totalBookings,
          totalRevenue: paymentStats.totalRevenue,
          paidMembers: paymentStats.paidMembers,
          totalClasses: classStats.totalClasses,
          activeClasses: classStats.activeClasses,
          subscribers: subscriberStats,
          totalReviews: reviewStats.totalReviews,
          averageRating: reviewStats.averageRating,
          totalForumPosts: forumStats.totalPosts,
          activePosts: forumStats.activePosts
        },
        recentActivity: {
          transactions: recentTransactions,
          newUsers: recentUsers
        },
        insights: {
          topClasses,
          monthlyRevenue: paymentStats.monthlyTrends || [],
          userGrowth: userStats.monthlyGrowth || []
        }
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            memberCount: {
              $sum: { $cond: [{ $eq: ['$role', 'member'] }, 1, 0] }
            },
            trainerCount: {
              $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] }
            },
            adminCount: {
              $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] }
            },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            pendingApplications: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]);

      // Monthly user growth (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyGrowth = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            newUsers: { $sum: 1 },
            newMembers: {
              $sum: { $cond: [{ $eq: ['$role', 'member'] }, 1, 0] }
            },
            newTrainers: {
              $sum: { $cond: [{ $eq: ['$role', 'trainer'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        ...stats[0],
        monthlyGrowth
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw error;
    }
  }

  async getPaymentOverview() {
    try {
      const stats = await Payment.aggregate([
        {
          $match: { paymentStatus: 'completed' }
        },
        {
          $group: {
            _id: null,
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$packagePrice' },
            averageBookingValue: { $avg: '$packagePrice' }
          }
        }
      ]);

      // Unique paying members
      const paidMembers = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$userEmail'
          }
        },
        {
          $count: 'uniqueMemberCount'
        }
      ]);

      // Monthly revenue trends (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrends = await Payment.aggregate([
        {
          $match: {
            paymentStatus: 'completed',
            createdAt: { $gte: sixMonthsAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$packagePrice' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      return {
        ...stats[0],
        paidMembers: paidMembers[0]?.uniqueMemberCount || 0,
        monthlyTrends
      };
    } catch (error) {
      logger.error('Error fetching payment overview:', error);
      throw error;
    }
  }

  async getClassOverview() {
    try {
      const stats = await Class.aggregate([
        {
          $group: {
            _id: null,
            totalClasses: { $sum: 1 },
            activeClasses: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            totalBookings: { $sum: '$bookingCount' },
            averagePrice: { $avg: '$price' }
          }
        }
      ]);

      return stats[0] || {
        totalClasses: 0,
        activeClasses: 0,
        totalBookings: 0,
        averagePrice: 0
      };
    } catch (error) {
      logger.error('Error fetching class overview:', error);
      throw error;
    }
  }

  async getSubscriberCount() {
    try {
      const count = await Subscriber.countDocuments({ isActive: true });
      return count;
    } catch (error) {
      logger.error('Error fetching subscriber count:', error);
      return 0;
    }
  }

  async getReviewOverview() {
    try {
      const stats = await Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            verifiedReviews: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        verifiedReviews: 0
      };
    } catch (error) {
      logger.error('Error fetching review overview:', error);
      return { totalReviews: 0, averageRating: 0, verifiedReviews: 0 };
    }
  }

  async getForumOverview() {
    try {
      const stats = await Forum.aggregate([
        {
          $group: {
            _id: null,
            totalPosts: { $sum: 1 },
            activePosts: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            totalVotes: { $sum: '$voteCount' },
            totalViews: { $sum: '$viewCount' }
          }
        }
      ]);

      return stats[0] || {
        totalPosts: 0,
        activePosts: 0,
        totalVotes: 0,
        totalViews: 0
      };
    } catch (error) {
      logger.error('Error fetching forum overview:', error);
      return { totalPosts: 0, activePosts: 0, totalVotes: 0, totalViews: 0 };
    }
  }

  async getRecentTransactions(limit = 10) {
    try {
      const transactions = await Payment.find({ paymentStatus: 'completed' })
        .populate('classId', 'name category')
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('userEmail userName packagePrice createdAt classId trainerName');

      return transactions;
    } catch (error) {
      logger.error('Error fetching recent transactions:', error);
      return [];
    }
  }

  async getTopPerformingClasses(limit = 5) {
    try {
      const classes = await Class.find({ isActive: true })
        .sort({ bookingCount: -1 })
        .limit(limit)
        .select('name category bookingCount price difficulty');

      return classes;
    } catch (error) {
      logger.error('Error fetching top performing classes:', error);
      return [];
    }
  }

  async getRecentUsers(limit = 5) {
    try {
      const users = await User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('name email role status createdAt photoURL');

      return users;
    } catch (error) {
      logger.error('Error fetching recent users:', error);
      return [];
    }
  }

  async getAdvancedAnalytics() {
    try {
      const [
        userEngagement,
        revenueByCategory,
        trainerPerformance,
        popularTimeSlots
      ] = await Promise.all([
        this.getUserEngagementMetrics(),
        this.getRevenueByCategory(),
        this.getTrainerPerformanceMetrics(),
        this.getPopularTimeSlots()
      ]);

      return {
        userEngagement,
        revenueByCategory,
        trainerPerformance,
        popularTimeSlots
      };
    } catch (error) {
      logger.error('Error fetching advanced analytics:', error);
      throw error;
    }
  }

  async getUserEngagementMetrics() {
    try {
      // Users who have made payments
      const payingUsers = await Payment.distinct('userEmail', { paymentStatus: 'completed' });
      
      // Users who have posted in forums
      const forumUsers = await Forum.distinct('author.email', { isActive: true });
      
      // Users who have left reviews
      const reviewUsers = await Review.distinct('userEmail', { isVisible: true });

      const totalUsers = await User.countDocuments({ role: 'member' });

      return {
        totalMembers: totalUsers,
        payingMembers: payingUsers.length,
        forumActiveMembers: forumUsers.length,
        reviewingMembers: reviewUsers.length,
        engagementRate: totalUsers > 0 ? ((payingUsers.length / totalUsers) * 100).toFixed(2) : 0
      };
    } catch (error) {
      logger.error('Error fetching user engagement metrics:', error);
      return {};
    }
  }

  async getRevenueByCategory() {
    try {
      const revenueByCategory = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $lookup: {
            from: 'classes',
            localField: 'classId',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        { $unwind: '$classInfo' },
        {
          $group: {
            _id: '$classInfo.category',
            totalRevenue: { $sum: '$packagePrice' },
            bookingCount: { $sum: 1 },
            averagePrice: { $avg: '$packagePrice' }
          }
        },
        { $sort: { totalRevenue: -1 } }
      ]);

      return revenueByCategory;
    } catch (error) {
      logger.error('Error fetching revenue by category:', error);
      return [];
    }
  }

  async getTrainerPerformanceMetrics() {
    try {
      const trainerStats = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$trainerEmail',
            trainerName: { $first: '$trainerName' },
            totalBookings: { $sum: 1 },
            totalRevenue: { $sum: '$packagePrice' },
            averageBookingValue: { $avg: '$packagePrice' }
          }
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 10 }
      ]);

      // Get trainer ratings
      const trainerRatings = await Review.aggregate([
        { $match: { trainerEmail: { $exists: true }, isVisible: true } },
        {
          $group: {
            _id: '$trainerEmail',
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      // Combine booking stats with ratings
      const combined = trainerStats.map(trainer => {
        const rating = trainerRatings.find(r => r._id === trainer._id);
        return {
          ...trainer,
          averageRating: rating ? rating.averageRating : 0,
          totalReviews: rating ? rating.totalReviews : 0
        };
      });

      return combined;
    } catch (error) {
      logger.error('Error fetching trainer performance metrics:', error);
      return [];
    }
  }

  async getPopularTimeSlots() {
    try {
      const timeSlots = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$slotName',
            bookingCount: { $sum: 1 },
            revenue: { $sum: '$packagePrice' }
          }
        },
        { $sort: { bookingCount: -1 } },
        { $limit: 10 }
      ]);

      return timeSlots;
    } catch (error) {
      logger.error('Error fetching popular time slots:', error);
      return [];
    }
  }

  async getSystemHealth() {
    try {
      const uptime = process.uptime();
      const memoryUsage = process.memoryUsage();
      
      return {
        uptime: {
          seconds: uptime,
          formatted: this.formatUptime(uptime)
        },
        memory: {
          used: Math.round(memoryUsage.heapUsed / 1024 / 1024 * 100) / 100,
          total: Math.round(memoryUsage.heapTotal / 1024 / 1024 * 100) / 100,
          external: Math.round(memoryUsage.external / 1024 / 1024 * 100) / 100
        },
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development'
      };
    } catch (error) {
      logger.error('Error fetching system health:', error);
      return {};
    }
  }

  formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${days}d ${hours}h ${minutes}m`;
  }
}

module.exports = new DashboardService();