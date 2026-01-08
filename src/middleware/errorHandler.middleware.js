import { CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  const statusCode = err.statusCode || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR;
  
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

export const notFoundHandler = (req, res) => {
  res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: 'Route not found',
    path: req.path
  });
};