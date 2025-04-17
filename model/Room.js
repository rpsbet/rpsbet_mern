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
  game_type: { type: Schema.Types.ObjectId, ref: 'rps_game_types' },
  selectedStrategy: { type: String, default: 'o3Mini' },
  last_updated_strat: { type: Date },
  qs_game_type: { type: Number, default: 2 },
  qs_nation: { type: Number, default: 0 },
  rps_game_type: { type: Number, default: 0 },
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
  prompt: {
    type: String,
    default: 'Create a Wheel of Fortune game, display the numbers 1 through 10 on the wheel and use https://t4.ftcdn.net/jpg/02/66/72/41/360_F_266724172_Iy8gdKgMa7XmrhYYxLCxyhx6J7070Pr8.jpg as the background and show a spin button. Add this https://cdn.freesound.org/previews/752/752225_15867640-lq.mp3 sound. Whichever number the wheel lands on is the multiplier.'
  },
  gameCode: { type: String, default: '' },
  battles: { type: Number, default: 0 },
  status: { type: String },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
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

// Add indexes
RoomSchema.index({ status: 1, updated_at: -1 }); // Primary query and sort
RoomSchema.index({ game_type: 1, status: 1 });   // Filter by game_type and status
RoomSchema.index({ creator: 1 });                 // Population of creator
RoomSchema.index({ joiners: 1 });                // Population of joiners (multi-key index)
RoomSchema.index({ created_at: -1 });            // Alternative sorting option

module.exports = mongoose.model('rps_rooms', RoomSchema);