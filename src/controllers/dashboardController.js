const dashboardService = require('../services/dashboardService');
const { asyncHandler } = require('../middleware/errorHandler');

class DashboardController {
  // Get main dashboard statistics
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await dashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  });

  // Get advanced analytics
  getAdvancedAnalytics = asyncHandler(async (req, res) => {
    const analytics = await dashboardService.getAdvancedAnalytics();

    res.status(200).json({
      success: true,
      message: 'Advanced analytics retrieved successfully',
      data: analytics
    });
  });

  // Get user engagement metrics
  getUserEngagement = asyncHandler(async (req, res) => {
    const engagement = await dashboardService.getUserEngagementMetrics();

    res.status(200).json({
      success: true,
      message: 'User engagement metrics retrieved successfully',
      data: engagement
    });
  });

  // Get revenue breakdown by category
  getRevenueByCategory = asyncHandler(async (req, res) => {
    const revenue = await dashboardService.getRevenueByCategory();

    res.status(200).json({
      success: true,
      message: 'Revenue by category retrieved successfully',
      data: revenue
    });
  });

  // Get trainer performance metrics
  getTrainerPerformance = asyncHandler(async (req, res) => {
    const performance = await dashboardService.getTrainerPerformanceMetrics();

    res.status(200).json({
      success: true,
      message: 'Trainer performance metrics retrieved successfully',
      data: performance
    });
  });

  // Get popular time slots
  getPopularTimeSlots = asyncHandler(async (req, res) => {
    const timeSlots = await dashboardService.getPopularTimeSlots();

    res.status(200).json({
      success: true,
      message: 'Popular time slots retrieved successfully',
      data: timeSlots
    });
  });

  // Get system health information
  getSystemHealth = asyncHandler(async (req, res) => {
    const health = await dashboardService.getSystemHealth();

    res.status(200).json({
      success: true,
      message: 'System health retrieved successfully',
      data: health
    });
  });

  // Get recent activity summary
  getRecentActivity = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;
    
    const [recentTransactions, recentUsers] = await Promise.all([
      dashboardService.getRecentTransactions(limit),
      dashboardService.getRecentUsers(limit)
    ]);

    res.status(200).json({
      success: true,
      message: 'Recent activity retrieved successfully',
      data: {
        transactions: recentTransactions,
        users: recentUsers
      }
    });
  });

  // Get top performing classes
  getTopClasses = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 5;
    const topClasses = await dashboardService.getTopPerformingClasses(limit);

    res.status(200).json({
      success: true,
      message: 'Top performing classes retrieved successfully',
      data: topClasses
    });
  });
}

module.exports = new DashboardController();
