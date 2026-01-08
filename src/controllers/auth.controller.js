import { AuthService } from '../services/auth.service.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils.js';
import User from '../models/User.model.js';
import { CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  static async register(req, res) {
    try {
      const { name, email, password, confirmPassword } = req.body;
      console.log('req.body :>> ', req.body);

      // Validate password confirmation
      if (password !== confirmPassword) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Passwords do not match'
        });
      }

      const user = await AuthService.register({ name, email, password });

      // Generate tokens
      const accessToken = generateAccessToken(user._id);
      const refreshToken = generateRefreshToken(user._id);

      // Save refresh token
      user.refreshToken = refreshToken;
      await user.save();

      // Remove password from response
      user.password = undefined;

      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            websites: user.websites,
            role: user.role,
            createdAt: user.createdAt
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Register error', { error: error.message });
      
      const statusCode = error.message === 'Email already registered' 
        ? CONSTANTS.HTTP_STATUS.BAD_REQUEST 
        : CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Registration failed'
      });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;

      const { user, accessToken, refreshToken } = await AuthService.login(email, password);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            websites: user.websites,
            role: user.role,
            lastLogin: user.lastLogin
          },
          accessToken,
          refreshToken
        }
      });
    } catch (error) {
      logger.error('Login error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: error.message || 'Login failed'
      });
    }
  }

  static async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: 'Refresh token is required'
        });
      }

      const newAccessToken = await AuthService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: { accessToken: newAccessToken }
      });
    } catch (error) {
      logger.error('Refresh token error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
  }

  static async logout(req, res) {
    try {
      await AuthService.logout(req.user.id);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = req.user;

      res.json({
        success: true,
        data: {
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            websites: user.websites,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            lastLogin: user.lastLogin
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to fetch profile'
      });
    }
  }

  static async updateProfile(req, res) {
    try {
      const { name, email } = req.body;
      const userId = req.user.id;

      const user = await User.findById(userId);
      
      if (name) user.name = name;
      if (email && email !== user.email) {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            error: 'Email already in use'
          });
        }
        user.email = email;
        user.isEmailVerified = false;
      }

      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to update profile'
      });
    }
  }

  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      await AuthService.changePassword(userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error', { error: error.message });
      
      const statusCode = error.message === 'Current password is incorrect'
        ? CONSTANTS.HTTP_STATUS.BAD_REQUEST
        : CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        success: false,
        error: error.message || 'Failed to change password'
      });
    }
  }

  static async addWebsite(req, res) {
    try {
      const { domain, siteId, accountId } = req.body;
      const user = req.user;

      await user.addWebsite({ domain, siteId, accountId });

      res.json({
        success: true,
        message: 'Website added successfully',
        data: { websites: user.websites }
      });
    } catch (error) {
      logger.error('Add website error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to add website'
      });
    }
  }

  static async removeWebsite(req, res) {
    try {
      const { domain } = req.params;
      const user = req.user;

      await user.removeWebsite(domain);

      res.json({
        success: true,
        message: 'Website removed successfully',
        data: { websites: user.websites }
      });
    } catch (error) {
      logger.error('Remove website error', { error: error.message });
      
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        error: 'Failed to remove website'
      });
    }
  }
}