const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  room_number: {
    type: Number,
    default: 0
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  game_type: {
    type: Schema.Types.ObjectId,
    ref: 'GameType'
  },
  selected_rps: {
    type: Number,
    default: 0
  },
  selected_qs_position: {
    type: Number,
    default: 0
  },
  qs_game_type: {
    type: Number,
    default: 2
  },
  brain_game_type: {
    type: Schema.Types.ObjectId,
    ref: 'BrainGameType',
    default: null
  },
  brain_game_score: {
    type: Number,
    default: 0
  },
  bet_amount: {
    type: Number,
    default: 0
  },
  user_bet: {
    type: String,
    default: ''
  },
  spleesh_bet_unit: {
    type: Number,
    default: 1
  },
  pr: {
    type: Number,
    default: 0
  },
  host_pr: {
    type: Number,
    default: 0
  },
  is_anonymous: {
    type: Boolean,
    default: false
  },
  endgame_type: {
    type: Boolean,
    default: false
  },
  endgame_amount: {
    type: Number,
    default: 0
  },
  note: {
    type: String,
    default: ''
  },
  is_private: {
    type: Boolean,
    default: false
  },
  room_password: {
    type: String,
    default: ''
  },
  status: { type: String },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

module.exports = Room = mongoose.model('rps_rooms', RoomSchema);
