const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Payment } = require('../models');
const classService = require('./classService');
const { 
  notFoundError, 
  validationError, 
  serverError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class PaymentService {
  async createPaymentIntent(amount, currency = 'usd', metadata = {}) {
    try {
      if (amount < 50) { // Stripe minimum is $0.50
        throw validationError('Amount must be at least $0.50');
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        payment_method_types: ['card'],
        metadata,
        capture_method: 'automatic'
      });

      logger.info('Payment intent created:', { 
        paymentIntentId: paymentIntent.id,
        amount,
        currency
      });

      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      
      if (error.type === 'StripeError') {
        throw validationError(`Payment error: ${error.message}`);
      }
      
      throw serverError('Failed to create payment intent');
    }
  }

  async processPayment(paymentData) {
    try {
      // Validate class exists and has capacity
      if (paymentData.classId) {
        await classService.validateClassCapacity(paymentData.classId);
      }

      // Verify payment intent with Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentData.paymentIntentId
      );

      if (paymentIntent.status !== 'succeeded') {
        throw validationError('Payment was not successful');
      }

      // Create payment record
      const payment = new Payment({
        ...paymentData,
        paymentStatus: 'completed'
      });

      await payment.save();

      // Update class booking count if applicable
      if (paymentData.classId) {
        await classService.incrementBookingCount(paymentData.classId);
      }

      logger.info('Payment processed successfully:', { 
        paymentId: payment._id,
        userEmail: payment.userEmail,
        amount: payment.packagePrice
      });

      return payment;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw error;
    }
  }

  async getAllPayments(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        status,
        userEmail,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = {};

      // Filter by status
      if (status) {
        query.paymentStatus = status;
      }

      // Filter by user email
      if (userEmail) {
        query.userEmail = userEmail;
      }

      // Filter by date range
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const payments = await Payment.find(query)
        .populate('classId', 'name category difficulty')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Payment.countDocuments(query);

      return {
        payments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPayments: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching payments:', error);
      throw error;
    }
  }

  async getPaymentById(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate('classId', 'name category difficulty price');
      
      if (!payment) {
        throw notFoundError('Payment');
      }

      return payment;
    } catch (error) {
      logger.error('Error fetching payment by ID:', error);
      throw error;
    }
  }

  async getPaymentByUser(userEmail) {
    try {
      const payments = await Payment.find({ userEmail })
        .populate('classId', 'name category difficulty')
        .sort({ createdAt: -1 });

      return payments;
    } catch (error) {
      logger.error('Error fetching user payments:', error);
      throw error;
    }
  }

  async getLatestPaymentByUser(userEmail) {
    try {
      const payment = await Payment.findOne({ userEmail })
        .populate('classId', 'name category difficulty')
        .sort({ createdAt: -1 });

      return payment;
    } catch (error) {
      logger.error('Error fetching latest user payment:', error);
      throw error;
    }
  }

  async refundPayment(paymentId, reason = 'requested_by_customer') {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw notFoundError('Payment');
      }

      if (payment.paymentStatus === 'refunded') {
        throw validationError('Payment has already been refunded');
      }

      // Process refund with Stripe
      const refund = await stripe.refunds.create({
        payment_intent: payment.paymentIntentId,
        reason
      });

      // Update payment status
      const updatedPayment = await Payment.findByIdAndUpdate(
        paymentId,
        { 
          paymentStatus: 'refunded',
          refundId: refund.id,
          refundedAt: new Date()
        },
        { new: true }
      );

      logger.info('Payment refunded:', { 
        paymentId,
        refundId: refund.id,
        amount: payment.packagePrice
      });

      return updatedPayment;
    } catch (error) {
      logger.error('Error refunding payment:', error);
      
      if (error.type === 'StripeError') {
        throw validationError(`Refund error: ${error.message}`);
      }
      
      throw error;
    }
  }

  async getBookedSlots(classId) {
    try {
      const bookedSlots = await Payment.find({ 
        classId,
        paymentStatus: 'completed'
      }).select('slotName userEmail userName createdAt');

      return bookedSlots;
    } catch (error) {
      logger.error('Error fetching booked slots:', error);
      throw error;
    }
  }

  async getPaymentStats() {
    try {
      const stats = await Payment.aggregate([
        {
          $group: {
            _id: null,
            totalPayments: { $sum: 1 },
            totalRevenue: { $sum: '$packagePrice' },
            completedPayments: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'completed'] }, 1, 0] }
            },
            refundedPayments: {
              $sum: { $cond: [{ $eq: ['$paymentStatus', 'refunded'] }, 1, 0] }
            },
            avgPaymentAmount: { $avg: '$packagePrice' }
          }
        }
      ]);

      // Revenue by month for last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

      const monthlyRevenue = await Payment.aggregate([
        {
          $match: {
            createdAt: { $gte: twelveMonthsAgo },
            paymentStatus: 'completed'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            revenue: { $sum: '$packagePrice' },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Top paying users
      const topUsers = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        {
          $group: {
            _id: '$userEmail',
            userName: { $first: '$userName' },
            totalSpent: { $sum: '$packagePrice' },
            totalBookings: { $sum: 1 }
          }
        },
        { $sort: { totalSpent: -1 } },
        { $limit: 10 }
      ]);

      // Unique paying members count
      const uniquePayingMembers = await Payment.aggregate([
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

      return {
        overview: stats[0] || {
          totalPayments: 0,
          totalRevenue: 0,
          completedPayments: 0,
          refundedPayments: 0,
          avgPaymentAmount: 0
        },
        monthlyRevenue,
        topUsers,
        uniquePayingMembers: uniquePayingMembers[0]?.uniqueMemberCount || 0
      };
    } catch (error) {
      logger.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  async getDashboardStats() {
    try {
      // Get basic counts
      const totalBookings = await Payment.countDocuments();
      const totalRevenue = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: null, total: { $sum: '$packagePrice' } } }
      ]);

      // Get recent transactions
      const recentTransactions = await Payment.find()
        .populate('classId', 'name')
        .sort({ createdAt: -1 })
        .limit(10)
        .select('userEmail userName packagePrice paymentStatus createdAt classId');

      // Get unique paying members
      const uniquePayingMembers = await Payment.aggregate([
        { $match: { paymentStatus: 'completed' } },
        { $group: { _id: '$userEmail' } },
        { $count: 'count' }
      ]);

      return {
        totalBookings,
        totalRevenue: totalRevenue[0]?.total || 0,
        recentTransactions,
        uniquePayingMembers: uniquePayingMembers[0]?.count || 0
      };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  async validatePaymentData(paymentData) {
    try {
      // Validate required fields
      const requiredFields = [
        'userEmail', 'userName', 'trainerName', 'trainerEmail',
        'classId', 'packageName', 'packagePrice', 'slotName', 'paymentIntentId'
      ];

      for (const field of requiredFields) {
        if (!paymentData[field]) {
          throw validationError(`Missing required field: ${field}`);
        }
      }

      // Validate price
      if (paymentData.packagePrice < 0) {
        throw validationError('Package price cannot be negative');
      }

      // Validate class exists
      if (paymentData.classId) {
        await classService.getClassById(paymentData.classId);
      }

      return true;
    } catch (error) {
      logger.error('Payment validation error:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();