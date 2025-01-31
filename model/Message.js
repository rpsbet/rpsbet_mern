const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  from: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users',
    index: true
  },
  to: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users',
    index: true
  },
  message: {
    type: String,
    required: true
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
    default: Date.now,
    index: true
  }
});

module.exports = Message = mongoose.model('rps_message', MessageSchema);
