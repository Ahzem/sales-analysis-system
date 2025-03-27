const Visitor = require('../models/Visitor');
const logger = require('../utils/logger');

/**
 * Track a visitor and return visitor statistics
 * @route POST /api/visits/track
 * @access Public
 */
const trackVisit = async (req, res) => {
  try {
    // Get browser ID from middleware or fallback to a header
    const browserId = req.browserId || req.headers['x-browser-id'];
    
    if (!browserId) {
      return res.status(400).json({
        success: false,
        message: 'No browser ID provided'
      });
    }
    
    const now = new Date();
    
    // Optional - collect additional info for analytics
    const userAgent = req.headers['user-agent'];
    const referrer = req.headers.referer || req.headers.referrer;
    const ipAddress = req.ip || 
                      req.headers['x-forwarded-for'] || 
                      req.connection.remoteAddress;
    
    // Try to find an existing visitor record
    let visitor = await Visitor.findOne({ browserId });
    
    if (visitor) {
      // Existing visitor - update last visit time and increment count
      visitor.lastVisit = now;
      visitor.visitCount += 1;
      
      // Update optional fields if they're provided and changed
      if (userAgent && visitor.userAgent !== userAgent) visitor.userAgent = userAgent;
      if (referrer && visitor.referrer !== referrer) visitor.referrer = referrer;
      if (ipAddress) visitor.ipAddress = ipAddress;
      
      await visitor.save();
      
      logger.info(`Returning visitor: ${browserId.substring(0, 8)}... (visit #${visitor.visitCount})`);
    } else {
      // New visitor - create a new record
      visitor = await Visitor.create({
        browserId,
        firstVisit: now,
        lastVisit: now,
        visitCount: 1,
        userAgent,
        referrer,
        ipAddress
      });
      
      logger.info(`New visitor recorded: ${browserId.substring(0, 8)}...`);
    }
    
    // Get visitor statistics
    // Start of today for daily active calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get total unique visitors count
    const totalVisitors = await Visitor.countDocuments();
    
    // Get visitors active today
    const activeToday = await Visitor.countDocuments({
      lastVisit: { $gte: today }
    });
    
    // Return statistics
    return res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        activeToday
      }
    });
    
  } catch (error) {
    logger.error('Error tracking visitor:', error);
    return res.status(500).json({
      success: false,
      message: 'Error tracking visitor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get visitor statistics for admin dashboard
 * @route GET /api/visits/stats
 * @access Private (should be protected by auth middleware)
 */
const getVisitorStats = async (req, res) => {
  try {
    // Start of today for daily active calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get total unique visitors
    const totalVisitors = await Visitor.countDocuments();
    
    // Get visitors active today
    const activeToday = await Visitor.countDocuments({
      lastVisit: { $gte: today }
    });
    
    // Get new visitors today (first visit today)
    const newToday = await Visitor.countDocuments({
      firstVisit: { $gte: today }
    });
    
    // Get returning visitors (more than 1 visit)
    const returningVisitors = await Visitor.countDocuments({
      visitCount: { $gt: 1 }
    });
    
    // Return detailed statistics
    return res.status(200).json({
      success: true,
      data: {
        totalVisitors,
        activeToday,
        newToday,
        returningVisitors,
        returnRate: totalVisitors > 0 ? (returningVisitors / totalVisitors * 100).toFixed(1) : 0
      }
    });
    
  } catch (error) {
    logger.error('Error getting visitor stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Error retrieving visitor statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  trackVisit,
  getVisitorStats
};