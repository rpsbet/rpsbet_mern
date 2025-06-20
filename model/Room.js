// 1. OPTIMIZED ROOM SCHEMA WITH BETTER INDEXES
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  name: { type: String, default: '', index: true }, // Add index for search
  likes: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  views: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  room_number: { type: String, default: '', index: true }, // Add index
  image: { type: String, default: '' },
  ticker: { type: String, default: '' },
  tax: { type: Number, default: 0.0 },
  website_link: { type: String, default: '' },
  x_link: { type: String, default: '' },
  telegram_link: { type: String, default: '' },
  creator: { type: Schema.Types.ObjectId, ref: 'rps_users', index: true },
  joiners: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  game_type: [{ type: String, default: [], index: true }], // Index for filtering
  last_updated_strat: { type: Date },
  bet_amount: { type: Number, default: 0.0 },
  user_bet: { type: Number, default: 0.0, index: true }, // Index for sorting by liquidity
  pr: { type: Number, default: 0.0 },
  host_pr: { type: Number, default: 0.0 },
  endgame_type: { type: Boolean, default: true },
  endgame_amount: { type: Number, default: 0.0 },
  is_private: { type: Boolean, default: false, index: true },
  room_password: { type: String, default: '' },
  description: { type: String, default: '' }, // Consider text index for search
  pool_id: { type: String, default: '' },
  proxiedAssets: {
    images: [{ type: String, default: '' }],
    audio: [{ type: String, default: '' }],
    theme: { type: Schema.Types.Mixed, default: {} },
    background: { type: Schema.Types.Mixed, default: {} }
  },
  battles: { type: Number, default: 0, index: true }, // Index for sorting
  status: { type: String, index: true },
  created_at: { type: Date, default: Date.now, index: true },
  updated_at: { type: Date, default: Date.now, index: true },
  hosts: [{
    host: { type: Schema.Types.ObjectId, ref: 'rps_users' },
    rank: { type: Number, default: 0 },
    avatar: { type: String, default: '' },
    username: { type: String, default: '' },
    walletAddress: { type: String, default: '' },
    accessory: { type: String, default: '' },
    elite: { type: String, default: '' },
    share: { type: Number, default: 0.0 },
  }],
  
  // NEW: Add computed fields for faster queries
  popularity_score: { type: Number, default: 0, index: true }, // Computed: likes + views + battles
  last_activity: { type: Date, default: Date.now, index: true }, // Updated on any room activity
}, {
  // Schema options for better performance
  timestamps: false, // We handle this manually
  versionKey: false, // Remove __v field
  minimize: false,   // Don't remove empty objects
});

// OPTIMIZED INDEXES - Replace existing with these
RoomSchema.index({ status: 1, updated_at: -1, popularity_score: -1 }); // Main query
RoomSchema.index({ status: 1, game_type: 1, updated_at: -1 }); // Game type filter
RoomSchema.index({ status: 1, user_bet: -1 }); // Liquidity sorting
RoomSchema.index({ status: 1, battles: -1 }); // Battle count sorting
RoomSchema.index({ status: 1, created_at: -1 }); // Age sorting
RoomSchema.index({ creator: 1, status: 1 }); // Creator rooms
RoomSchema.index({ "hosts.host": 1, status: 1 }); // Host participation
RoomSchema.index({ is_private: 1, status: 1 }); // Private room filter

// TEXT INDEX for search functionality
RoomSchema.index({ 
  name: "text", 
  description: "text", 
  game_type: "text" 
}, {
  weights: {
    name: 10,
    game_type: 5,
    description: 1
  }
});

// COMPOUND INDEX for pagination performance
RoomSchema.index({ 
  status: 1, 
  game_type: 1, 
  updated_at: -1, 
  _id: 1 
}); // For stable pagination

module.exports = mongoose.model('rps_rooms', RoomSchema);