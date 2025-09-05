const reviewService = require('../services/reviewService');
const { asyncHandler } = require('../middleware/errorHandler');

class ReviewController {
  // Create new review
  createReview = asyncHandler(async (req, res) => {
    await reviewService.validateReviewData(req.body);
    const review = await reviewService.createReview(req.body);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: review
    });
  });

  // Get all reviews with filters (Public)
  getAllReviews = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      rating: req.query.rating,
      classId: req.query.classId,
      trainerEmail: req.query.trainerEmail,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await reviewService.getAllReviews(options);

    res.status(200).json({
      success: true,
      message: 'Reviews retrieved successfully',
      data: result
    });
  });

  // Get review by ID
  getReviewById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id);

    res.status(200).json({
      success: true,
      message: 'Review retrieved successfully',
      data: review
    });
  });

  // Get user's reviews
  getUserReviews = asyncHandler(async (req, res) => {
    const userEmail = req.query.userEmail || req.user.email;
    
    // Users can only view their own reviews unless admin
    if (req.user.role !== 'admin' && userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own reviews'
      });
    }

    const reviews = await reviewService.getReviewByUser(userEmail);

    res.status(200).json({
      success: true,
      message: 'User reviews retrieved successfully',
      data: reviews
    });
  });

  // Get user's latest review
  getLatestUserReview = asyncHandler(async (req, res) => {
    const userEmail = req.query.userEmail || req.user.email;
    
    // Users can only view their own reviews unless admin
    if (req.user.role !== 'admin' && userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own reviews'
      });
    }

    const review = await reviewService.getLatestReviewByUser(userEmail);

    res.status(200).json({
      success: true,
      message: 'Latest review retrieved successfully',
      data: review
    });
  });

  // Update review
  updateReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.updateReview(id, req.body, req.user.email, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: review
    });
  });

  // Delete review
  deleteReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await reviewService.deleteReview(id, req.user.email, req.user.role);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  });

  // Get reviews for a specific class
  getClassReviews = asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      rating: req.query.rating,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await reviewService.getReviewsForClass(classId, options);

    res.status(200).json({
      success: true,
      message: 'Class reviews retrieved successfully',
      data: result
    });
  });

  // Get reviews for a specific trainer
  getTrainerReviews = asyncHandler(async (req, res) => {
    const { trainerEmail } = req.params;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      rating: req.query.rating,
      isVerified: req.query.isVerified !== undefined ? req.query.isVerified === 'true' : undefined,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await reviewService.getReviewsForTrainer(trainerEmail, options);

    res.status(200).json({
      success: true,
      message: 'Trainer reviews retrieved successfully',
      data: result
    });
  });

  // Get top reviews
  getTopReviews = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await reviewService.getTopReviews(limit);

    res.status(200).json({
      success: true,
      message: 'Top reviews retrieved successfully',
      data: reviews
    });
  });

  // Verify review (Admin only)
  verifyReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.verifyReview(id);

    res.status(200).json({
      success: true,
      message: 'Review verified successfully',
      data: review
    });
  });

  // Hide review (Admin only)
  hideReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.hideReview(id);

    res.status(200).json({
      success: true,
      message: 'Review hidden successfully',
      data: review
    });
  });

  // Show review (Admin only)
  showReview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const review = await reviewService.showReview(id);

    res.status(200).json({
      success: true,
      message: 'Review made visible successfully',
      data: review
    });
  });

  // Get review statistics (Admin only)
  getReviewStats = asyncHandler(async (req, res) => {
    const stats = await reviewService.getReviewStats();

    res.status(200).json({
      success: true,
      message: 'Review statistics retrieved successfully',
      data: stats
    });
  });

  // Bulk verify reviews (Admin only)
  bulkVerifyReviews = asyncHandler(async (req, res) => {
    const { reviewIds } = req.body;
    const result = await reviewService.bulkVerifyReviews(reviewIds);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { modifiedCount: result.modifiedCount }
    });
  });

  // Bulk hide reviews (Admin only)
  bulkHideReviews = asyncHandler(async (req, res) => {
    const { reviewIds } = req.body;
    const result = await reviewService.bulkHideReviews(reviewIds);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { modifiedCount: result.modifiedCount }
    });
  });
}

module.exports = new ReviewController();