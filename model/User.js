const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  privyId: {
    type: String,
    unique: true,
    sparse: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true // Add index for faster lookups
  },
  accounts: {
    type: [String],
    default: [],
  },
  elite: {
    type: String,
    default: ''
  },
  last_elite_payment: {
    type: Date,
    default: Date.now,
    index: true
  },
  isWithdrawing: {
    type: Boolean,
    default: false
  },
  email: {
    type: String,
    required: false,
    unique: true,
    sparse: true,
    default: undefined
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
  elite_free_used: {
    type: Boolean,
    default: false
  },
  ip_addresses: [{
    type: String
  }],
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
    default: 0,
    index: true // Index for ranking queries
  },
  last_seen: {
    type: Date,
    default: Date.now,
    index: true // Index for activity tracking
  },
  // Add cache invalidation timestamp
  cache_version: {
    type: Number,
    default: 1
  },
  // Add frequently accessed computed fields
  rank: {
    type: Number,
    default: 0
  },
  displayName: {
    type: String
  }
});

// Compound indexes for complex queries
UserSchema.index({ totalWagered: -1, last_seen: -1 }); // Leaderboard queries
UserSchema.index({ elite: 1, last_elite_payment: -1 }); // Elite user queries
UserSchema.index({ referralCode: 1, created_at: -1 }); // Referral queries


module.exports = User = mongoose.model('rps_users', UserSchema);
