const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
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
    index: true // Indexing the 'updated_at' field
  }
});

module.exports = Message = mongoose.model('rps_message', MessageSchema);
