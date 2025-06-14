const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users',
    required: true
  },
  // ADD THIS MISSING FIELD
  username: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'gif'],
    default: 'text'
  },
  messageContent: {
    type: String
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  avatar: {
    type: String
  },
  accessory: {
    type: String
  },
  elite: {
    type: String
  },
  rank: {
    type: Number
  },
  replyTo: {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'rps_users'
    },
    username: {
      type: String
    },
    avatar: {
      type: String
    },
    rank: {
      type: Number
    },
    accessory: {
      type: String
    },
    elite: {
      type: String
    },
    message: {
      type: String
    },
    messageType: {
      type: String
    },
    time: {
      type: String
    }
  }
});

ChatSchema.index({ created_at: -1 });
ChatSchema.index({ sender: 1, created_at: -1 });
ChatSchema.index({ username: 1 });

module.exports = Chat = mongoose.model('rps_chat', ChatSchema);