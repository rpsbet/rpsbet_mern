// models/GameType.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameTypeSchema = new Schema({
  game_type_id: {
    type: Number,
    default: 0
  },
  game_type_name: {
    type: String,
    default: '',
    // Add a unique index for case-insensitive game type names
    // This will help prevent duplicates like "strategy" and "Strategy"
    // We'll handle lowercasing the input before saving.
    index: { unique: true, collation: { locale: 'en', strength: 2 } } // strength: 2 for case-insensitivity
  },
  short_name: { // Keep short_name for initial migration, might be deprecated later
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

// Update updated_at on save
GameTypeSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = GameType = mongoose.model('rps_game_types', GameTypeSchema);
