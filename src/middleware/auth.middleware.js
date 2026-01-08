import { verifyAccessToken } from '../utils/jwt.utils.js';
import User from '../models/User.model.js';
import { CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { tokenManager } from '../utils/tokenManager.js';

// User authentication middleware
export const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Not authenticated. Please login.'
      });
    }

    const decoded = verifyAccessToken(token);
    
    const user = await User.findById(decoded.id);
    
    if (!user || !user.isActive) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: 'Password changed recently. Please login again.'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    
    return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// Admin-only middleware
export const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(CONSTANTS.HTTP_STATUS.FORBIDDEN).json({
      success: false,
      error: 'Access denied. Admin only.'
    });
  }
  next();
};

// Admin AdSense authentication (for system-level AdSense operations)
export const requireAdminAdsenseAuth = async (req, res, next) => {
  try {
    if (!tokenManager.initialized) {
      await tokenManager.initialize();
    }

    if (!tokenManager.hasValidTokens()) {
      return res.status(CONSTANTS.HTTP_STATUS.SERVICE_UNAVAILABLE).json({
        success: false,
        error: CONSTANTS.ERRORS.SERVICE_UNAVAILABLE,
        message: CONSTANTS.ERRORS.ADMIN_AUTH_REQUIRED
      });
    }

    const tokens = tokenManager.getTokens();
    const freshTokens = await tokenManager.refreshTokenIfNeeded(tokens);

    req.adsenseTokens = freshTokens;
    next();
  } catch (error) {
    logger.error('Admin AdSense authentication error', {
      error: error.message,
      stack: error.stack
    });

    return res.status(CONSTANTS.HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      error: 'Authentication failed',
      message: error.message
    });
  }
};