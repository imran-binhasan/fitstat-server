const classService = require('../services/classService');
const { asyncHandler } = require('../middleware/errorHandler');

class ClassController {
  // Get all classes with search and pagination
  getAllClasses = asyncHandler(async (req, res) => {
    const options = {
      search: req.query.search,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 6,
      category: req.query.category,
      difficulty: req.query.difficulty,
      sortBy: req.query.sortBy,
      sortOrder: req.query.sortOrder
    };

    const result = await classService.getAllClasses(options);

    res.status(200).json({
      success: true,
      message: 'Classes retrieved successfully',
      data: result
    });
  });

  // Get all classes without pagination (for dropdowns, etc.)
  getAllClassesSimple = asyncHandler(async (req, res) => {
    const options = { page: 1, limit: 1000 }; // Large limit to get all
    const result = await classService.getAllClasses(options);

    res.status(200).json({
      success: true,
      message: 'All classes retrieved successfully',
      data: result.classes
    });
  });

  // Get class by ID
  getClassById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const classData = await classService.getClassById(id);

    res.status(200).json({
      success: true,
      message: 'Class retrieved successfully',
      data: classData
    });
  });

  // Create new class (Admin/Trainer only)
  createClass = asyncHandler(async (req, res) => {
    const newClass = await classService.createClass(req.body);

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: newClass
    });
  });

  // Update class (Admin/Trainer only)
  updateClass = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedClass = await classService.updateClass(id, req.body);

    res.status(200).json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass
    });
  });

  // Delete class (Admin only)
  deleteClass = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await classService.deleteClass(id);

    res.status(200).json({
      success: true,
      message: 'Class deactivated successfully'
    });
  });

  // Increment booking count
  incrementBookingCount = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updatedClass = await classService.incrementBookingCount(id);

    res.status(200).json({
      success: true,
      message: 'Booking count updated successfully',
      data: updatedClass
    });
  });

  // Get popular classes
  getPopularClasses = asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const classes = await classService.getPopularClasses(limit);

    res.status(200).json({
      success: true,
      message: 'Popular classes retrieved successfully',
      data: classes
    });
  });

  // Get classes grouped by category
  getClassesByCategory = asyncHandler(async (req, res) => {
    const categories = await classService.getClassesByCategory();

    res.status(200).json({
      success: true,
      message: 'Classes by category retrieved successfully',
      data: categories
    });
  });

  // Get class statistics (Admin only)
  getClassStats = asyncHandler(async (req, res) => {
    const stats = await classService.getClassStats();

    res.status(200).json({
      success: true,
      message: 'Class statistics retrieved successfully',
      data: stats
    });
  });

  // Search classes
  searchClasses = asyncHandler(async (req, res) => {
    const { q: searchTerm } = req.query;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10
    };

    const result = await classService.searchClasses(searchTerm, options);

    res.status(200).json({
      success: true,
      message: 'Search completed successfully',
      data: result
    });
  });

  // Validate class capacity
  validateCapacity = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { bookings = 1 } = req.query;

    await classService.validateClassCapacity(id, parseInt(bookings));

    res.status(200).json({
      success: true,
      message: 'Class has available capacity'
    });
  });
}

module.exports = new ClassController();