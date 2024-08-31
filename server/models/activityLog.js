const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  name: String,
  type: String,
  subtypes: {
    type: Map,
    of: String
},
  quantity: Number,
  price: Number,
  activityType: String, 
  date: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
