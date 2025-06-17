const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  name: { type: String, default: '' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  dislikes: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  views: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  room_number: { type: String, default: '' },
  image: { type: String, default: '' },
  ticker: { type: String, default: '' },
  tax: { type: Number, default: 0.0 },
  website_link: { type: String, default: '' },
  x_link: { type: String, default: '' },
  telegram_link: { type: String, default: '' },
  creator: { type: Schema.Types.ObjectId, ref: 'rps_users' },
  joiners: [{ type: Schema.Types.ObjectId, ref: 'rps_users', default: [] }],
  game_type: [{ type: String, default: [] }],
  last_updated_strat: { type: Date },
  bet_amount: { type: Number, default: 0.0 },
  user_bet: { type: Number, default: 0.0 },
  pr: { type: Number, default: 0.0 },
  host_pr: { type: Number, default: 0.0 },
  endgame_type: { type: Boolean, default: true },
  endgame_amount: { type: Number, default: 0.0 },
  is_private: { type: Boolean, default: false },
  room_password: { type: String, default: '' },
  description: { type: String, default: '' },
  pool_id: { type: String, default: '' },
  proxiedAssets: {
    images: [{ type: String, default: '' }],
    audio: [{ type: String, default: '' }],
    theme: { type: Schema.Types.Mixed, default: {} },
    background: { type: Schema.Types.Mixed, default: {} }
  },
  // gameCode field removed - now stored in separate GameCode collection
  battles: { type: Number, default: 0 },
  status: { type: String, index: true },
  created_at: { type: Date, default: Date.now },
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
});

// Existing indexes
RoomSchema.index({ status: 1, updated_at: -1 });
RoomSchema.index({ creator: 1 });
RoomSchema.index({ joiners: 1 });
RoomSchema.index({ created_at: -1 });
RoomSchema.index({ status: 1, game_type: 1, updated_at: -1 }); // For filtered game type queries
RoomSchema.index({ status: 1, created_at: -1 });               // Alternative sorting option
RoomSchema.index({ "hosts.host": 1, status: 1 }); 

module.exports = mongoose.model('rps_rooms', RoomSchema);
