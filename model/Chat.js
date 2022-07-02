const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ChatSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  message: {
    type: String,
    ref: ''
  },
  created_at: {
    type: Date,
    default: Date.now
  },
});

module.exports = Chat = mongoose.model('rps_chat', ChatSchema);
