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
      ref: 'User'
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
    default: [0.0005, 0.001],
  },
  referralCode: {
    type: String,
    required: true,
    unique: true
  },
  referralId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rewards: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
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
  totalProfit: {
    type: Number,
    default: 0
  },
  profitAllTimeHigh: {
    type: Number,
    default: 0
  },
  profitAllTimeLow: {
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
  verification_code: {
    type: String,
    default: ''
  },
  is_activated: {
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
