const authService = require('../services/authService');
const { asyncHandler } = require('../middleware/errorHandler');

class AuthController {
  // User registration
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  // User login
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  // Social login (Google, Facebook, etc.)
  socialLogin = asyncHandler(async (req, res) => {
    const result = await authService.socialLogin(req.body);

    res.status(200).json({
      success: true,
      message: 'Social login successful',
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  // Generate JWT token
  generateToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Token generated successfully',
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  // Refresh token
  refreshToken = asyncHandler(async (req, res) => {
    const result = await authService.refreshToken(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        user: result.user,
        token: result.token
      }
    });
  });

  // Verify user role
  verifyRole = asyncHandler(async (req, res) => {
    const { email } = req.query;
    const result = await authService.verifyUserRole(email);

    res.status(200).json({
      success: true,
      message: 'Role verified successfully',
      data: result
    });
  });

  // Change password
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // Forgot password
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // Logout
  logout = asyncHandler(async (req, res) => {
    const result = await authService.logout(req.user.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  });

  // Check authentication status
  checkAuth = asyncHandler(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'User is authenticated',
      data: {
        user: req.user,
        isAuthenticated: true
      }
    });
  });
}

module.exports = new AuthController();