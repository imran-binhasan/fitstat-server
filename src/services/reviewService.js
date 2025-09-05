const { Review } = require('../models');
const { 
  notFoundError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ReviewService {
  async createReview(reviewData) {
    try {
      // Check if user has already reviewed (if classId or trainerEmail provided)
      if (reviewData.classId || reviewData.trainerEmail) {
        const existingReview = await Review.findOne({
          userEmail: reviewData.userEmail,
          $or: [
            { classId: reviewData.classId },
            { trainerEmail: reviewData.trainerEmail }
          ]
        });

        if (existingReview) {
          throw conflictError('You have already submitted a review for this item');
        }
      }

      const review = new Review(reviewData);
      await review.save();
      
      logger.info('New review created:', { 
        reviewId: review._id, 
        userEmail: review.userEmail,
        rating: review.rating
      });

      return review;
    } catch (error) {
      logger.error('Error creating review:', error);
      throw error;
    }
  }

  async getAllReviews(options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        rating,
        classId,
        trainerEmail,
        isVerified,
        isVisible = true,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = {};

      // Filter by visibility
      if (isVisible !== undefined) {
        query.isVisible = isVisible;
      }

      // Filter by rating
      if (rating) {
        query.rating = parseInt(rating);
      }

      // Filter by class
      if (classId) {
        query.classId = classId;
      }

      // Filter by trainer
      if (trainerEmail) {
        query.trainerEmail = trainerEmail;
      }

      // Filter by verification status
      if (isVerified !== undefined) {
        query.isVerified = isVerified;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const reviews = await Review.find(query)
        .populate('classId', 'name category difficulty')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments(query);

      return {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching reviews:', error);
      throw error;
    }
  }

  async getReviewById(reviewId) {
    try {
      const review = await Review.findById(reviewId)
        .populate('classId', 'name category difficulty');
      
      if (!review) {
        throw notFoundError('Review');
      }

      return review;
    } catch (error) {
      logger.error('Error fetching review by ID:', error);
      throw error;
    }
  }

  async getReviewByUser(userEmail) {
    try {
      const reviews = await Review.find({ userEmail })
        .populate('classId', 'name category difficulty')
        .sort({ createdAt: -1 });

      return reviews;
    } catch (error) {
      logger.error('Error fetching user reviews:', error);
      throw error;
    }
  }

  async getLatestReviewByUser(userEmail) {
    try {
      const review = await Review.findOne({ userEmail })
        .populate('classId', 'name category difficulty')
        .sort({ createdAt: -1 });

      return review;
    } catch (error) {
      logger.error('Error fetching latest user review:', error);
      throw error;
    }
  }

  async updateReview(reviewId, updateData, userEmail, userRole) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw notFoundError('Review');
      }

      // Users can only update their own reviews, admins can update any
      if (review.userEmail !== userEmail && userRole !== 'admin') {
        throw validationError('You can only update your own reviews');
      }

      const updatedReview = await Review.findByIdAndUpdate(
        reviewId, 
        updateData, 
        { 
          new: true, 
          runValidators: true 
        }
      ).populate('classId', 'name category difficulty');

      logger.info('Review updated:', { 
        reviewId, 
        updatedBy: userEmail,
        updatedFields: Object.keys(updateData) 
      });

      return updatedReview;
    } catch (error) {
      logger.error('Error updating review:', error);
      throw error;
    }
  }

  async deleteReview(reviewId, userEmail, userRole) {
    try {
      const review = await Review.findById(reviewId);
      
      if (!review) {
        throw notFoundError('Review');
      }

      // Users can only delete their own reviews, admins can delete any
      if (review.userEmail !== userEmail && userRole !== 'admin') {
        throw validationError('You can only delete your own reviews');
      }

      await Review.findByIdAndDelete(reviewId);

      logger.info('Review deleted:', { 
        reviewId, 
        deletedBy: userEmail,
        originalUser: review.userEmail 
      });

      return { message: 'Review deleted successfully' };
    } catch (error) {
      logger.error('Error deleting review:', error);
      throw error;
    }
  }

  async verifyReview(reviewId) {
    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        { isVerified: true },
        { new: true }
      ).populate('classId', 'name category difficulty');

      if (!review) {
        throw notFoundError('Review');
      }

      logger.info('Review verified:', { reviewId });

      return review;
    } catch (error) {
      logger.error('Error verifying review:', error);
      throw error;
    }
  }

  async hideReview(reviewId) {
    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        { isVisible: false },
        { new: true }
      ).populate('classId', 'name category difficulty');

      if (!review) {
        throw notFoundError('Review');
      }

      logger.info('Review hidden:', { reviewId });

      return review;
    } catch (error) {
      logger.error('Error hiding review:', error);
      throw error;
    }
  }

  async showReview(reviewId) {
    try {
      const review = await Review.findByIdAndUpdate(
        reviewId,
        { isVisible: true },
        { new: true }
      ).populate('classId', 'name category difficulty');

      if (!review) {
        throw notFoundError('Review');
      }

      logger.info('Review made visible:', { reviewId });

      return review;
    } catch (error) {
      logger.error('Error showing review:', error);
      throw error;
    }
  }

  async getReviewStats() {
    try {
      const stats = await Review.aggregate([
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            visibleReviews: {
              $sum: { $cond: [{ $eq: ['$isVisible', true] }, 1, 0] }
            },
            verifiedReviews: {
              $sum: { $cond: [{ $eq: ['$isVerified', true] }, 1, 0] }
            },
            averageRating: { $avg: '$rating' }
          }
        }
      ]);

      // Rating distribution
      const ratingDistribution = await Review.aggregate([
        { $match: { isVisible: true } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Monthly review trends
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyTrends = await Review.aggregate([
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
            count: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]);

      // Top reviewed classes
      const topReviewedClasses = await Review.aggregate([
        { $match: { isVisible: true, classId: { $exists: true } } },
        {
          $group: {
            _id: '$classId',
            reviewCount: { $sum: 1 },
            averageRating: { $avg: '$rating' }
          }
        },
        { $sort: { reviewCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: 'classes',
            localField: '_id',
            foreignField: '_id',
            as: 'classInfo'
          }
        },
        {
          $project: {
            reviewCount: 1,
            averageRating: 1,
            className: { $arrayElemAt: ['$classInfo.name', 0] },
            classCategory: { $arrayElemAt: ['$classInfo.category', 0] }
          }
        }
      ]);

      return {
        overview: stats[0] || {
          totalReviews: 0,
          visibleReviews: 0,
          verifiedReviews: 0,
          averageRating: 0
        },
        ratingDistribution,
        monthlyTrends,
        topReviewedClasses
      };
    } catch (error) {
      logger.error('Error fetching review stats:', error);
      throw error;
    }
  }

  async getReviewsForClass(classId, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        rating,
        isVerified,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = { 
        classId,
        isVisible: true
      };

      if (rating) query.rating = parseInt(rating);
      if (isVerified !== undefined) query.isVerified = isVerified;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const reviews = await Review.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments(query);

      // Get average rating for this class
      const avgRatingResult = await Review.aggregate([
        { $match: { classId: classId, isVisible: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const classRatingInfo = avgRatingResult[0] || {
        averageRating: 0,
        totalReviews: 0
      };

      return {
        reviews,
        classRating: {
          average: Math.round(classRatingInfo.averageRating * 10) / 10,
          total: classRatingInfo.totalReviews
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching class reviews:', error);
      throw error;
    }
  }

  async getReviewsForTrainer(trainerEmail, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        rating,
        isVerified,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = { 
        trainerEmail,
        isVisible: true
      };

      if (rating) query.rating = parseInt(rating);
      if (isVerified !== undefined) query.isVerified = isVerified;

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const reviews = await Review.find(query)
        .populate('classId', 'name category')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments(query);

      // Get average rating for this trainer
      const avgRatingResult = await Review.aggregate([
        { $match: { trainerEmail, isVisible: true } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const trainerRatingInfo = avgRatingResult[0] || {
        averageRating: 0,
        totalReviews: 0
      };

      return {
        reviews,
        trainerRating: {
          average: Math.round(trainerRatingInfo.averageRating * 10) / 10,
          total: trainerRatingInfo.totalReviews
        },
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching trainer reviews:', error);
      throw error;
    }
  }

  async getTopReviews(limit = 10) {
    try {
      const reviews = await Review.find({ 
        isVisible: true,
        rating: { $gte: 4 }
      })
        .populate('classId', 'name category')
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);

      return reviews;
    } catch (error) {
      logger.error('Error fetching top reviews:', error);
      throw error;
    }
  }

  async getFeaturedReviews(limit = 6) {
    try {
      const reviews = await Review.find({ 
        isVisible: true,
        isVerified: true,
        rating: { $gte: 4 }
      })
        .populate('classId', 'name category')
        .sort({ rating: -1, createdAt: -1 })
        .limit(limit);

      return reviews;
    } catch (error) {
      logger.error('Error fetching featured reviews:', error);
      throw error;
    }
  }

  async getRecentReviews(limit = 10) {
    try {
      const reviews = await Review.find({ isVisible: true })
        .populate('classId', 'name category')
        .sort({ createdAt: -1 })
        .limit(limit);

      return reviews;
    } catch (error) {
      logger.error('Error fetching recent reviews:', error);
      throw error;
    }
  }

  async bulkVerifyReviews(reviewIds) {
    try {
      const result = await Review.updateMany(
        { _id: { $in: reviewIds } },
        { isVerified: true }
      );

      logger.info('Bulk review verification:', { 
        reviewCount: reviewIds.length,
        modifiedCount: result.modifiedCount 
      });

      return {
        message: `${result.modifiedCount} reviews verified successfully`,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error in bulk verify reviews:', error);
      throw error;
    }
  }

  async bulkHideReviews(reviewIds) {
    try {
      const result = await Review.updateMany(
        { _id: { $in: reviewIds } },
        { isVisible: false }
      );

      logger.info('Bulk review hiding:', { 
        reviewCount: reviewIds.length,
        modifiedCount: result.modifiedCount 
      });

      return {
        message: `${result.modifiedCount} reviews hidden successfully`,
        modifiedCount: result.modifiedCount
      };
    } catch (error) {
      logger.error('Error in bulk hide reviews:', error);
      throw error;
    }
  }

  async bulkDeleteReviews(reviewIds) {
    try {
      const result = await Review.deleteMany({
        _id: { $in: reviewIds }
      });

      logger.info('Bulk review deletion:', { 
        reviewCount: reviewIds.length,
        deletedCount: result.deletedCount 
      });

      return {
        message: `${result.deletedCount} reviews deleted successfully`,
        deletedCount: result.deletedCount
      };
    } catch (error) {
      logger.error('Error in bulk delete reviews:', error);
      throw error;
    }
  }

  async getReviewsByRating(rating, options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const reviews = await Review.find({ 
        rating: parseInt(rating), 
        isVisible: true 
      })
        .populate('classId', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments({ 
        rating: parseInt(rating), 
        isVisible: true 
      });

      return {
        reviews,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching reviews by rating:', error);
      throw error;
    }
  }

  async searchReviews(searchTerm, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10,
        rating,
        isVerified
      } = options;

      const skip = (page - 1) * limit;
      const query = {
        isVisible: true,
        $or: [
          { comment: { $regex: searchTerm, $options: 'i' } },
          { userName: { $regex: searchTerm, $options: 'i' } }
        ]
      };

      if (rating) query.rating = parseInt(rating);
      if (isVerified !== undefined) query.isVerified = isVerified;

      const reviews = await Review.find(query)
        .populate('classId', 'name category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Review.countDocuments(query);

      return {
        reviews,
        searchTerm,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReviews: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error searching reviews:', error);
      throw error;
    }
  }

  async getReviewSummaryForClass(classId) {
    try {
      const summary = await Review.aggregate([
        { 
          $match: { 
            classId: classId, 
            isVisible: true 
          } 
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      const totalReviews = summary.reduce((acc, item) => acc + item.count, 0);
      const averageRating = summary.reduce((acc, item) => acc + (item._id * item.count), 0) / totalReviews || 0;

      const ratingBreakdown = {
        5: 0, 4: 0, 3: 0, 2: 0, 1: 0
      };

      summary.forEach(item => {
        ratingBreakdown[item._id] = item.count;
      });

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingBreakdown,
        percentageBreakdown: {
          5: totalReviews > 0 ? Math.round((ratingBreakdown[5] / totalReviews) * 100) : 0,
          4: totalReviews > 0 ? Math.round((ratingBreakdown[4] / totalReviews) * 100) : 0,
          3: totalReviews > 0 ? Math.round((ratingBreakdown[3] / totalReviews) * 100) : 0,
          2: totalReviews > 0 ? Math.round((ratingBreakdown[2] / totalReviews) * 100) : 0,
          1: totalReviews > 0 ? Math.round((ratingBreakdown[1] / totalReviews) * 100) : 0
        }
      };
    } catch (error) {
      logger.error('Error getting review summary for class:', error);
      throw error;
    }
  }

  async validateReviewData(reviewData) {
    try {
      // Basic validation
      if (!reviewData.userEmail || !reviewData.userName) {
        throw validationError('User email and name are required');
      }

      if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
        throw validationError('Rating must be between 1 and 5');
      }

      if (!reviewData.comment || reviewData.comment.trim().length < 10) {
        throw validationError('Comment must be at least 10 characters long');
      }

      if (reviewData.comment.length > 1000) {
        throw validationError('Comment cannot exceed 1000 characters');
      }

      // At least one of classId or trainerEmail should be provided
      if (!reviewData.classId && !reviewData.trainerEmail) {
        throw validationError('Either classId or trainerEmail must be provided');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(reviewData.userEmail)) {
        throw validationError('Invalid email format');
      }

      if (reviewData.trainerEmail && !emailRegex.test(reviewData.trainerEmail)) {
        throw validationError('Invalid trainer email format');
      }

      return true;
    } catch (error) {
      logger.error('Review validation error:', error);
      throw error;
    }
  }

  async checkReviewPermission(userEmail, classId = null, trainerEmail = null) {
    try {
      // Check if user has already reviewed this item
      const query = { userEmail };
      
      if (classId || trainerEmail) {
        query.$or = [];
        if (classId) query.$or.push({ classId });
        if (trainerEmail) query.$or.push({ trainerEmail });
      }

      const existingReview = await Review.findOne(query);
      
      return {
        canReview: !existingReview,
        hasExistingReview: !!existingReview,
        existingReviewId: existingReview?._id
      };
    } catch (error) {
      logger.error('Error checking review permission:', error);
      throw error;
    }
  }
}

module.exports = new ReviewService();