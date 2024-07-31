const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the AttachedPlayer schema
const AttachedPlayerSchema = new Schema({
  room: {
    type: Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  room_name: {
    type: String,
    default: '',
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bet_amounts: {
    type: [Number],
    default: []
  },
  selected_strategy: {
    type: String,
    default: ''
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

// Indexes to improve query performance
AttachedPlayerSchema.index({ room: 1, user: 1 });
AttachedPlayerSchema.index({ created_at: 1 });

module.exports = AttachedPlayer = mongoose.model('rps_attached_players', AttachedPlayerSchema);
