const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StrategySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  reasoning: {
    type: Number,
    required: true
  },
  speed: {
    type: Number,
    required: true
  },
  predictability: {
    type: Number,
    required: true
  },
  levelToUnlock: {
    type: Number,
    required: true
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

module.exports = Strategy = mongoose.model('rps_strategies', StrategySchema);