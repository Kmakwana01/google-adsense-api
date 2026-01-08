import { CONSTANTS } from '../config/constants.js';
import { tokenManager } from '../utils/tokenManager.js';
import { logger } from '../utils/logger.js';

export const requireAuth = async (req, res, next) => {
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

    // ✅ auto refresh works here
    const freshTokens = await tokenManager.refreshTokenIfNeeded(tokens);

    req.tokens = freshTokens;
    next();
  } catch (error) {
    logger.error('Authentication error', {
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
