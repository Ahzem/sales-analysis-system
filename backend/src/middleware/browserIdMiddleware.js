const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Middleware to ensure each request has a browserId
 * This either extracts an existing ID from cookies or generates a new one
 */
const browserIdMiddleware = (req, res, next) => {
  try {
    // Check for existing browser ID in cookies
    let browserId = req.cookies?.browserId;
    
    // If no browser ID exists, generate a new one
    if (!browserId) {
      browserId = uuidv4();
      
      // Set a cookie to persist the browser ID for future visits
      // Expires in 1 year
      res.cookie('browserId', browserId, {
        maxAge: 365 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
      });
      
      logger.info(`Generated new browser ID: ${browserId.substring(0, 8)}...`);
    }
    
    // Attach the browserId to the request object for use in controllers
    req.browserId = browserId;
    
    next();
  } catch (error) {
    logger.error('Error in browserIdMiddleware:', error);
    // Even if there's an error, let the request continue
    next();
  }
};

module.exports = browserIdMiddleware;