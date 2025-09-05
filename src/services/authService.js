const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { 
  authError, 
  validationError, 
  conflictError 
} = require('../middleware/errorHandler');
const userService = require('./userService');
const logger = require('../utils/logger');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email });
      if (existingUser) {
        throw conflictError('User already exists with this email');
      }

      // Create new user
      const user = await userService.createUser(userData);

      // Generate JWT token
      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      logger.info('User registered successfully:', { 
        userId: user._id, 
        email: user.email 
      });

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(email, password) {
    try {
      // Find user with password field
      const user = await User.findOne({ email }).select('+password');
      
      if (!user) {
        throw authError('Invalid email or password');
      }

      // Check if password is provided (for OAuth users)
      if (!user.password) {
        throw authError('Please use social login or set a password first');
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw authError('Invalid email or password');
      }

      // Check account status
      if (user.status === 'inactive') {
        throw authError('Account is deactivated. Please contact support.');
      }

      // Update last login
      await userService.updateLastLogin(user._id);

      // Generate JWT token
      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      logger.info('User logged in successfully:', { 
        userId: user._id, 
        email: user.email 
      });

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async socialLogin(socialData) {
    try {
      const { email, name, photoURL, provider } = socialData;

      // Find or create user
      let user = await User.findOne({ email });
      
      if (!user) {
        // Create new user for social login
        user = await userService.createUser({
          email,
          name,
          photoURL,
          isEmailVerified: true // Social accounts are pre-verified
        });
      } else {
        // Update user info if needed
        const updateData = {};
        if (!user.name && name) updateData.name = name;
        if (!user.photoURL && photoURL) updateData.photoURL = photoURL;
        
        if (Object.keys(updateData).length > 0) {
          user = await userService.updateUser(user._id, updateData);
        }
      }

      // Check account status
      if (user.status === 'inactive') {
        throw authError('Account is deactivated. Please contact support.');
      }

      // Update last login
      await userService.updateLastLogin(user._id);

      // Generate JWT token
      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      logger.info('Social login successful:', { 
        userId: user._id, 
        email: user.email,
        provider 
      });

      return {
        user,
        token
      };
    } catch (error) {
      logger.error('Social login error:', error);
      throw error;
    }
  }

  async refreshToken(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw authError('User not found');
      }

      if (user.status === 'inactive') {
        throw authError('Account is deactivated');
      }

      const token = generateToken({
        id: user._id,
        email: user.email,
        role: user.role
      });

      return {
        user: user.getPublicProfile(),
        token
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  async verifyUserRole(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        throw authError('User not found');
      }

      return {
        role: user.role,
        status: user.status
      };
    } catch (error) {
      logger.error('Role verification error:', error);
      throw error;
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw authError('User not found');
      }

      // Verify current password
      if (user.password) {
        const isCurrentPasswordValid = await user.comparePassword(currentPassword);
        if (!isCurrentPasswordValid) {
          throw authError('Current password is incorrect');
        }
      }

      // Update password
      user.password = newPassword;
      await user.save();

      logger.info('Password changed successfully:', { userId });

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Password change error:', error);
      throw error;
    }
  }

  async forgotPassword(email) {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal that user doesn't exist
        return { message: 'If user exists, password reset link has been sent' };
      }

      // In a real application, you would:
      // 1. Generate a password reset token
      // 2. Store it in database with expiration
      // 3. Send email with reset link
      
      logger.info('Password reset requested:', { email });

      return { message: 'Password reset link has been sent to your email' };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  async logout(userId) {
    try {
      // In a stateless JWT system, logout is handled client-side
      // But we can log the event and potentially blacklist the token
      
      logger.info('User logged out:', { userId });
      
      return { message: 'Logged out successfully' };
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();