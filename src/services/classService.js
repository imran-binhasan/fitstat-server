const { Class } = require('../models');
const { 
  notFoundError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class ClassService {
  async createClass(classData) {
    try {
      // Check if class with same name already exists
      const existingClass = await Class.findOne({ 
        name: { $regex: new RegExp(`^${classData.name}$`, 'i') }
      });
      
      if (existingClass) {
        throw conflictError('Class with this name already exists');
      }

      const newClass = new Class(classData);
      await newClass.save();
      
      logger.info('New class created:', { 
        classId: newClass._id, 
        name: newClass.name,
        category: newClass.category
      });

      return newClass;
    } catch (error) {
      logger.error('Error creating class:', error);
      throw error;
    }
  }

  async getAllClasses(options = {}) {
    try {
      const { 
        search = '', 
        page = 1, 
        limit = 6,
        category,
        difficulty,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      const query = { isActive: true };

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }

      // Filter by category
      if (category) {
        query.category = { $regex: new RegExp(category, 'i') };
      }

      // Filter by difficulty
      if (difficulty) {
        query.difficulty = difficulty;
      }

      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const classes = await Class.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Class.countDocuments(query);

      return {
        classes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalClasses: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching classes:', error);
      throw error;
    }
  }

  async getClassById(classId) {
    try {
      const classData = await Class.findById(classId);
      if (!classData) {
        throw notFoundError('Class');
      }
      return classData;
    } catch (error) {
      logger.error('Error fetching class by ID:', error);
      throw error;
    }
  }

  async updateClass(classId, updateData) {
    try {
      // Check if updating name conflicts with existing class
      if (updateData.name) {
        const existingClass = await Class.findOne({ 
          name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
          _id: { $ne: classId }
        });
        
        if (existingClass) {
          throw conflictError('Class with this name already exists');
        }
      }

      const updatedClass = await Class.findByIdAndUpdate(
        classId, 
        updateData, 
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!updatedClass) {
        throw notFoundError('Class');
      }

      logger.info('Class updated:', { 
        classId, 
        updatedFields: Object.keys(updateData) 
      });

      return updatedClass;
    } catch (error) {
      logger.error('Error updating class:', error);
      throw error;
    }
  }

  async deleteClass(classId) {
    try {
      const classData = await Class.findByIdAndUpdate(
        classId,
        { isActive: false },
        { new: true }
      );

      if (!classData) {
        throw notFoundError('Class');
      }

      logger.info('Class deactivated:', { classId, name: classData.name });
      return { message: 'Class deactivated successfully' };
    } catch (error) {
      logger.error('Error deactivating class:', error);
      throw error;
    }
  }

  async incrementBookingCount(classId) {
    try {
      const updatedClass = await Class.findByIdAndUpdate(
        classId,
        { $inc: { bookingCount: 1 } },
        { new: true }
      );

      if (!updatedClass) {
        throw notFoundError('Class');
      }

      logger.info('Class booking count incremented:', { 
        classId, 
        newCount: updatedClass.bookingCount 
      });

      return updatedClass;
    } catch (error) {
      logger.error('Error incrementing booking count:', error);
      throw error;
    }
  }

  async getPopularClasses(limit = 6) {
    try {
      const classes = await Class.find({ isActive: true })
        .sort({ bookingCount: -1 })
        .limit(limit);

      return classes;
    } catch (error) {
      logger.error('Error fetching popular classes:', error);
      throw error;
    }
  }

  async getClassesByCategory() {
    try {
      const categories = await Class.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            classes: {
              $push: {
                _id: '$_id',
                name: '$name',
                difficulty: '$difficulty',
                price: '$price',
                bookingCount: '$bookingCount'
              }
            }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return categories;
    } catch (error) {
      logger.error('Error fetching classes by category:', error);
      throw error;
    }
  }

  async getClassStats() {
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
            avgPrice: { $avg: '$price' },
            difficultyBreakdown: {
              $push: '$difficulty'
            },
            categoryBreakdown: {
              $push: '$category'
            }
          }
        }
      ]);

      // Get difficulty distribution
      const difficultyStats = await Class.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$difficulty',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get category distribution
      const categoryStats = await Class.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgPrice: { $avg: '$price' },
            totalBookings: { $sum: '$bookingCount' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      return {
        overview: stats[0] || {
          totalClasses: 0,
          activeClasses: 0,
          totalBookings: 0,
          avgPrice: 0
        },
        difficultyDistribution: difficultyStats,
        categoryDistribution: categoryStats
      };
    } catch (error) {
      logger.error('Error fetching class stats:', error);
      throw error;
    }
  }

  async searchClasses(searchTerm, options = {}) {
    try {
      const { limit = 10, page = 1 } = options;
      const skip = (page - 1) * limit;

      const searchQuery = {
        isActive: true,
        $text: { $search: searchTerm }
      };

      const classes = await Class.find(searchQuery)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(limit);

      const total = await Class.countDocuments(searchQuery);

      return {
        classes,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalResults: total
        }
      };
    } catch (error) {
      logger.error('Error searching classes:', error);
      throw error;
    }
  }

  async validateClassCapacity(classId, requestedBookings = 1) {
    try {
      const classData = await this.getClassById(classId);
      
      if (classData.bookingCount + requestedBookings > classData.maxCapacity) {
        throw validationError('Class is fully booked');
      }

      return true;
    } catch (error) {
      logger.error('Error validating class capacity:', error);
      throw error;
    }
  }
}

module.exports = new ClassService();