const paymentService = require('../services/paymentService');
const { asyncHandler } = require('../middleware/errorHandler');

class PaymentController {
  // Create payment intent
  createPaymentIntent = asyncHandler(async (req, res) => {
    const { price, currency, metadata } = req.body;
    const result = await paymentService.createPaymentIntent(price, currency, metadata);

    res.status(200).json({
      success: true,
      message: 'Payment intent created successfully',
      data: result
    });
  });

  // Process payment after successful Stripe confirmation
  processPayment = asyncHandler(async (req, res) => {
    await paymentService.validatePaymentData(req.body);
    const payment = await paymentService.processPayment(req.body);

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: payment
    });
  });

  // Get all payments (Admin only)
  getAllPayments = asyncHandler(async (req, res) => {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      status: req.query.status,
      userEmail: req.query.userEmail,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await paymentService.getAllPayments(options);

    res.status(200).json({
      success: true,
      message: 'Payments retrieved successfully',
      data: result
    });
  });

  // Get payment by ID
  getPaymentById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const payment = await paymentService.getPaymentById(id);

    res.status(200).json({
      success: true,
      message: 'Payment retrieved successfully',
      data: payment
    });
  });

  // Get user's payments
  getUserPayments = asyncHandler(async (req, res) => {
    const userEmail = req.query.email || req.user.email;
    
    // Users can only view their own payments unless admin
    if (req.user.role !== 'admin' && userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own payments'
      });
    }

    const payments = await paymentService.getPaymentByUser(userEmail);

    res.status(200).json({
      success: true,
      message: 'User payments retrieved successfully',
      data: payments
    });
  });

  // Get user's latest payment
  getLatestUserPayment = asyncHandler(async (req, res) => {
    const userEmail = req.query.email || req.user.email;
    
    // Users can only view their own payments unless admin
    if (req.user.role !== 'admin' && userEmail !== req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own payments'
      });
    }

    const payment = await paymentService.getLatestPaymentByUser(userEmail);

    res.status(200).json({
      success: true,
      message: 'Latest payment retrieved successfully',
      data: payment
    });
  });

  // Refund payment (Admin only)
  refundPayment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    
    const payment = await paymentService.refundPayment(id, reason);

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: payment
    });
  });

  // Get booked slots for a class
  getBookedSlots = asyncHandler(async (req, res) => {
    const { classId } = req.query;
    const bookedSlots = await paymentService.getBookedSlots(classId);

    res.status(200).json({
      success: true,
      message: 'Booked slots retrieved successfully',
      data: bookedSlots
    });
  });

  // Get payment statistics (Admin only)
  getPaymentStats = asyncHandler(async (req, res) => {
    const stats = await paymentService.getPaymentStats();

    res.status(200).json({
      success: true,
      message: 'Payment statistics retrieved successfully',
      data: stats
    });
  });

  // Get dashboard stats (Admin only)
  getDashboardStats = asyncHandler(async (req, res) => {
    const stats = await paymentService.getDashboardStats();

    res.status(200).json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: stats
    });
  });
}

module.exports = new PaymentController();