const newsletterService = require('../services/newsletterService');
const { asyncHandler } = require('../middleware/errorHandler');

class NewsletterController {
  // Subscribe to newsletter (Public)
  subscribe = asyncHandler(async (req, res) => {
    await newsletterService.validateSubscriberData(req.body);
    const subscriber = await newsletterService.subscribe(req.body);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscriber
    });
  });

  // Unsubscribe from newsletter (Public)
  unsubscribe = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await newsletterService.unsubscribe(email);

    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter'
    });
  });

  // Get all subscribers (Admin only)
  getAllSubscribers = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : true,
      topic: req.query.topic,
      frequency: req.query.frequency,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await newsletterService.getAllSubscribers(options);

    res.status(200).json({
      success: true,
      message: 'Subscribers retrieved successfully',
      data: result
    });
  });

  // Get subscriber by email
  getSubscriberByEmail = asyncHandler(async (req, res) => {
    const { email } = req.query;
    const subscriber = await newsletterService.getSubscriberByEmail(email);

    res.status(200).json({
      success: true,
      message: 'Subscriber retrieved successfully',
      data: subscriber
    });
  });

  // Update subscriber preferences
  updatePreferences = asyncHandler(async (req, res) => {
    const { email } = req.params;
    const { preferences } = req.body;
    
    const subscriber = await newsletterService.updateSubscriberPreferences(email, preferences);

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: subscriber
    });
  });

  // Delete subscriber (Admin only)
  deleteSubscriber = asyncHandler(async (req, res) => {
    const { email } = req.query;
    await newsletterService.deleteSubscriber(email);

    res.status(200).json({
      success: true,
      message: 'Subscriber deleted successfully'
    });
  });

  // Get subscriber statistics (Admin only)
  getSubscriberStats = asyncHandler(async (req, res) => {
    const stats = await newsletterService.getSubscriberStats();

    res.status(200).json({
      success: true,
      message: 'Subscriber statistics retrieved successfully',
      data: stats
    });
  });

  // Get subscribers by topic (Admin only)
  getSubscribersByTopic = asyncHandler(async (req, res) => {
    const { topic } = req.params;
    const subscribers = await newsletterService.getSubscribersByTopic(topic);

    res.status(200).json({
      success: true,
      message: `Subscribers for topic "${topic}" retrieved successfully`,
      data: subscribers
    });
  });

  // Get subscribers by frequency (Admin only)
  getSubscribersByFrequency = asyncHandler(async (req, res) => {
    const { frequency } = req.params;
    const subscribers = await newsletterService.getSubscribersByFrequency(frequency);

    res.status(200).json({
      success: true,
      message: `Subscribers with "${frequency}" frequency retrieved successfully`,
      data: subscribers
    });
  });

  // Bulk unsubscribe (Admin only)
  bulkUnsubscribe = asyncHandler(async (req, res) => {
    const { emails } = req.body;
    const result = await newsletterService.bulkUnsubscribe(emails);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { modifiedCount: result.modifiedCount }
    });
  });

  // Export subscribers (Admin only)
  exportSubscribers = asyncHandler(async (req, res) => {
    const filters = {};
    if (req.query.topic) filters['preferences.topics'] = req.query.topic;
    if (req.query.frequency) filters['preferences.frequency'] = req.query.frequency;
    
    const csvData = await newsletterService.exportSubscribers(filters);

    res.status(200).json({
      success: true,
      message: 'Subscribers exported successfully',
      data: csvData
    });
  });
}

module.exports = new NewsletterController();