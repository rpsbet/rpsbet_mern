const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  
  username: {
    type: String,
    required: true,
    unique: true
  },
  accounts: {
    type: [String],
    default: [],
  },
  isWithdrawing: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: false,
    unique: true
  },
  completedTutorials: {
    type: [Number],
    default: []
  },
  password: {
    type: String,
    required: true
  },
  credit_score: {
    type: Number,
    default: 0
  },
  lenders: [
    {
      type: Schema.Types.ObjectId,
      ref: 'rps_users'
    }
  ],
  ai_mode: {
    type: String,
    default: 'Markov'
  },
  prompt: {
    type: String,
    default: 'You are an expert in Rock Paper Scissors.'
  },
  ai_mode: {
    type: String,
    default: 'Markov'
  },
  range: {
    type: [Number],
    default: [0.001, 0.002],
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referralUsername: {
    type: String,
    ref: 'rps_users',
    default: ''
  },
  rewards: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'rps_users'
    },
    amount: {
      type: Number,
      default: 0
    }
  }],
  dailyWithdrawals: {
    type: Number,
    default: 0
  },
  accessory: {
    type: String,
    ref: 'Item',
    default: null
  },
  bio: {
    type: String,
  },
  avatar: {
    type: String
  },
  balance: {
    type: Number,
    default: 0
  },
  totalWagered: {
    type: Number,
    default: 0
  },
  totalTraded: {
    type: Number,
    default: 0
  },
  gameProfit: {
    type: Number,
    default: 0
  },
  tradingProfit: {
    type: Number,
    default: 0
  },
  gamePlayed: {
    type: Number,
    default: 0
  },
  status: { type: String },
  is_deleted: {
    type: Boolean,
    default: false
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  last_seen:  {
    type: Date,
    default: Date.now
  },
  last_bonus:  {
    type: Date,
    default: Date.now
  }
});

module.exports = User = mongoose.model('rps_users', UserSchema);
