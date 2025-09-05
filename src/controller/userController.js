const userService = require('../services/userService');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserController {
  // Get all users (Admin only)
  getAllUsers = asyncHandler(async (req, res) => {
    const { page, limit, role, status } = req.query;
    
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    
    const options = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10
    };

    const result = await userService.getAllUsers(filter, options);

    res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });
  });

  // Get user by email
  getUserByEmail = asyncHandler(async (req, res) => {
    const { email } = req.query;
    const user = await userService.getUserByEmail(email);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  });

  // Get user by ID
  getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: 'User retrieved successfully',
      data: user
    });
  });

  // Create new user
  createUser = asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user
    });
  });

  // Apply for trainer role
  applyForTrainer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.applyForTrainer(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Trainer application submitted successfully',
      data: user
    });
  });

  // Add slot to trainer
  addSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.addSlot(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Slot added successfully',
      data: user
    });
  });

  // Remove slot from trainer
  removeSlot = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { slotNameToRemove } = req.body;
    
    const user = await userService.removeSlot(id, slotNameToRemove);

    res.status(200).json({
      success: true,
      message: 'Slot removed successfully',
      data: user
    });
  });

  // Get all trainers
  getAllTrainers = asyncHandler(async (req, res) => {
    const trainers = await userService.getTrainers();

    res.status(200).json({
      success: true,
      message: 'Trainers retrieved successfully',
      data: trainers
    });
  });

  // Get featured trainers (limited number)
  getFeaturedTrainers = asyncHandler(async (req, res) => {
    const trainers = await userService.getTrainers(3);

    res.status(200).json({
      success: true,
      message: 'Featured trainers retrieved successfully',
      data: trainers
    });
  });

  // Get trainers by class name
  getTrainersByClass = asyncHandler(async (req, res) => {
    const { name } = req.params;
    const trainers = await userService.getTrainersByClass(name);

    res.status(200).json({
      success: true,
      message: `Trainers for ${name} retrieved successfully`,
      data: trainers
    });
  });

  // Get trainer details for booking
  getTrainerForBooking = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const trainer = await userService.getUserById(id);

    // Return only necessary fields for booking
    const bookingData = {
      _id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      skills: trainer.skills
    };

    res.status(200).json({
      success: true,
      message: 'Trainer details retrieved successfully',
      data: bookingData
    });
  });

  // Get pending trainer applications (Admin only)
  getPendingApplications = asyncHandler(async (req, res) => {
    const applications = await userService.getPendingApplications();

    res.status(200).json({
      success: true,
      message: 'Pending applications retrieved successfully',
      data: applications
    });
  });

  // Get application detail by ID (Admin only)
  getApplicationDetail = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const application = await userService.getUserById(id);

    res.status(200).json({
      success: true,
      message: 'Application details retrieved successfully',
      data: application
    });
  });

  // Approve trainer application (Admin only)
  approveTrainerApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.approveTrainerApplication(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Trainer application approved successfully',
      data: user
    });
  });

  // Reject trainer application (Admin only)
  rejectTrainerApplication = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.rejectTrainerApplication(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Trainer application rejected successfully',
      data: user
    });
  });

  // Remove trainer role (Admin only)
  removeTrainer = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.removeTrainer(id);

    res.status(200).json({
      success: true,
      message: 'Trainer role removed successfully',
      data: user
    });
  });

  // Update user profile
  updateProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const user = await userService.updateUser(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });

  // Delete user (Admin only)
  deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await userService.deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  // Get user statistics (Admin only)
  getUserStats = asyncHandler(async (req, res) => {
    const stats = await userService.getUserStats();

    res.status(200).json({
      success: true,
      message: 'User statistics retrieved successfully',
      data: stats
    });
  });

  // Get current user profile
  getMyProfile = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: req.user
    });
  });

  // Update current user profile
  updateMyProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.user._id, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  });
}

module.exports = new UserController();