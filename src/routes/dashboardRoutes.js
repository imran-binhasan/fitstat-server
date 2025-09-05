const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');
const Joi = require('joi');

const router = express.Router();

// All dashboard routes require admin authentication
router.use(verifyToken);
router.use(authorize('admin'));

// Main dashboard statistics
router.get('/stats', dashboardController.getDashboardStats);

// Advanced analytics
router.get('/analytics', dashboardController.getAdvancedAnalytics);

// Specific metric endpoints
router.get('/user-engagement', dashboardController.getUserEngagement);

router.get('/revenue/category', dashboardController.getRevenueByCategory);

router.get('/trainer-performance', dashboardController.getTrainerPerformance);

router.get('/popular-slots', dashboardController.getPopularTimeSlots);

// System and operational data
router.get('/system-health', dashboardController.getSystemHealth);

router.get('/recent-activity', 
  validate(Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10)
  }), 'query'),
  dashboardController.getRecentActivity
);

router.get('/top-classes', 
  validate(Joi.object({
    limit: Joi.number().integer().min(1).max(20).default(5)
  }), 'query'),
  dashboardController.getTopClasses
);

module.exports = router;