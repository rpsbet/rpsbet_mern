const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users'
  },
  message: {
    type: String
  },
  messageType: {
    type: String,
    enum: ['text', 'gif'], // Add more types if needed
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
    type: String,
    ref: 'rps_users.avatar'
  },
  accessory: {
    type: String,
    ref: 'rps_users.accessory'
  },
  rank: {
    type: Number,
    ref: 'rps_users.totalWagered'
  },
  replyTo: [
    {
      sender: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users'
      },
      username: {
        type: String,
        ref: 'rps_users.username'
      },
      avatar: {
        type: String
      },
      rank: {
        type: Number,
        ref: 'rps_users.totalWagered'
      },
      accessory: {
        type: String,
        ref: 'rps_users.accessory'
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
  ]
});

ChatSchema.index({ created_at: -1 }); // Index on created_at for sorting
ChatSchema.index({ sender: 1 }); // Index on sender for populating
ChatSchema.index({ 'replyTo.sender': 1 })

module.exports = Chat = mongoose.model('rps_chat', ChatSchema);
