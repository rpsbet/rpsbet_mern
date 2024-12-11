const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true // Indexing the 'from' field
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true // Indexing the 'to' field
  },
  message: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: ''
  },
  amount: {
    type: Number,
    default: 0
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true // Indexing the 'created_at' field
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Define indexes separately if you prefer
NotificationSchema.index({ created_at: -1 }); // Indexing 'created_at' field in descending order

module.exports = Notification = mongoose.model('rps_notification', NotificationSchema);
