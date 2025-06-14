// models/GameCode.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameCodeSchema = new Schema({
  room: { 
    type: Schema.Types.ObjectId, 
    ref: 'rps_rooms', 
    required: true,
    unique: true // Each room can only have one game code
  },
  code: { 
    type: String, 
    required: true,
    index: true // Index for faster searches
  },
  version: { 
    type: Number, 
    default: 1 
  },
  created_at: { 
    type: Date, 
    default: Date.now 
  },
  updated_at: { 
    type: Date, 
    default: Date.now 
  },
  created_by: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users',
    required: true
  }
});

// Indexes for optimization
GameCodeSchema.index({ created_by: 1 });
GameCodeSchema.index({ updated_at: -1 });

// Update the updated_at field before saving
GameCodeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('game_codes', GameCodeSchema);
