const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema({
  browserId: { 
    type: String, 
    required: true, 
    unique: true, 
  },
  firstVisit: { 
    type: Date, 
    default: Date.now 
  },
  lastVisit: { 
    type: Date, 
    default: Date.now 
  },
  visitCount: { 
    type: Number, 
    default: 1 
  },
  // Optional fields for more detailed analytics
  userAgent: { 
    type: String 
  },
  referrer: { 
    type: String 
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

// Create an index on the browserId field for faster lookups
VisitorSchema.index({ browserId: 1 });

// Add an index on lastVisit for querying active users
VisitorSchema.index({ lastVisit: -1 });

module.exports = mongoose.model('Visitor', VisitorSchema);