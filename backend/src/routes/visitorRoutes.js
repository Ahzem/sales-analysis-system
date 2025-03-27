const express = require('express');
const router = express.Router();
const { trackVisit, getVisitorStats } = require('../controllers/visitorController');
const browserIdMiddleware = require('../middleware/browserIdMiddleware');

// Apply the browser ID middleware to all visitor routes
router.use(browserIdMiddleware);

// Track a visitor and return basic statistics
router.post('/track', trackVisit);

// Get detailed visitor statistics (this would typically be protected by auth)
router.get('/stats', getVisitorStats);

module.exports = router;