const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    required: true
  },
  room: {
    type: String,
    default: ''
  },
  is_read: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = Notification = mongoose.model('rps_notification', NotificationSchema);
