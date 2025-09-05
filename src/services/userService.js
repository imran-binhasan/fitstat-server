const User = require('../models/User');
const { 
  notFoundError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

class UserService {
  async createUser(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw conflictError('User already exists with this email');
      }

      const user = new User(userData);
      await user.save();
      
      logger.info('New user created:', { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      });

      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw notFoundError('User');
      }
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw notFoundError('User');
      }
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error fetching user by email:', error);
      throw error;
    }
  }

  async getAllUsers(filter = {}, options = {}) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        sort = { createdAt: -1 },
        select = '-password'
      } = options;

      const skip = (page - 1) * limit;

      const users = await User.find(filter)
        .select(select)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await User.countDocuments(filter);

      return {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching users:', error);
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId, 
        updateData, 
        { 
          new: true, 
          runValidators: true 
        }
      );

      if (!user) {
        throw notFoundError('User');
      }

      logger.info('User updated:', { userId, updatedFields: Object.keys(updateData) });
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw notFoundError('User');
      }

      logger.info('User deleted:', { userId, email: user.email });
      return { message: 'User deleted successfully' };
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  async applyForTrainer(userId, applicationData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw notFoundError('User');
      }

      if (user.role === 'trainer') {
        throw validationError('User is already a trainer');
      }

      if (user.status === 'pending') {
        throw validationError('Application is already pending');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          ...applicationData,
          status: 'pending'
        },
        { new: true, runValidators: true }
      );

      logger.info('Trainer application submitted:', { userId, email: user.email });
      return updatedUser.getPublicProfile();
    } catch (error) {
      logger.error('Error submitting trainer application:', error);
      throw error;
    }
  }

  async approveTrainerApplication(userId, approvalData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: approvalData.status,
          role: approvalData.role,
          $unset: { feedback: 1 } // Remove any previous feedback
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw notFoundError('User');
      }

      logger.info('Trainer application approved:', { userId, email: user.email });
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error approving trainer application:', error);
      throw error;
    }
  }

  async rejectTrainerApplication(userId, rejectionData) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: rejectionData.status,
          feedback: rejectionData.feedback
        },
        { new: true, runValidators: true }
      );

      if (!user) {
        throw notFoundError('User');
      }

      logger.info('Trainer application rejected:', { userId, email: user.email });
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error rejecting trainer application:', error);
      throw error;
    }
  }

  async addSlot(userId, slotData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw notFoundError('User');
      }

      if (user.role !== 'trainer') {
        throw validationError('Only trainers can add slots');
      }

      // Check if slot with same name already exists
      const existingSlot = user.slots.find(slot => slot.slotName === slotData.slotName);
      if (existingSlot) {
        throw conflictError('Slot with this name already exists');
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { slots: slotData } },
        { new: true, runValidators: true }
      );

      logger.info('Slot added:', { userId, slotName: slotData.slotName });
      return updatedUser.getPublicProfile();
    } catch (error) {
      logger.error('Error adding slot:', error);
      throw error;
    }
  }

  async removeSlot(userId, slotName) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { $pull: { slots: { slotName } } },
        { new: true }
      );

      if (!user) {
        throw notFoundError('User');
      }

      logger.info('Slot removed:', { userId, slotName });
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error removing slot:', error);
      throw error;
    }
  }

  async getTrainers(limit = null) {
    try {
      const query = User.findTrainers(limit).select('-password');
      const trainers = await query;

      return trainers.map(trainer => trainer.getPublicProfile());
    } catch (error) {
      logger.error('Error fetching trainers:', error);
      throw error;
    }
  }

  async getTrainersByClass(className) {
    try {
      const trainers = await User.find({
        'slots.selectedClasses.label': { $regex: new RegExp(className, 'i') }
      }).select('-password');

      return trainers.map(trainer => trainer.getPublicProfile());
    } catch (error) {
      logger.error('Error fetching trainers by class:', error);
      throw error;
    }
  }

  async getPendingApplications() {
    try {
      const applications = await User.findPendingApplications();
      return applications;
    } catch (error) {
      logger.error('Error fetching pending applications:', error);
      throw error;
    }
  }

  async removeTrainer(userId) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        {
          status: 'inactive',
          role: 'member'
        },
        { new: true }
      );

      if (!user) {
        throw notFoundError('User');
      }

      logger.info('Trainer role removed:', { userId, email: user.email });
      return user.getPublicProfile();
    } catch (error) {
      logger.error('Error removing trainer role:', error);
      throw error;
    }
  }

  async updateLastLogin(userId) {
    try {
      await User.findByIdAndUpdate(userId, { lastLogin: new Date() });
    } catch (error) {
      logger.error('Error updating last login:', error);
    }
  }

  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 }
          }
        }
      ]);

      const statusStats = await User.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      return {
        roleStats: stats,
        statusStats
      };
    } catch (error) {
      logger.error('Error fetching user stats:', error);
      throw error;
    }
  }
}

module.exports = new UserService();