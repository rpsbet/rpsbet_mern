const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
  name: {
    type: String,
    default: ''
  },
  room_number: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  ticker: {
    type: String,
    default: ''
  },
  
  website_link: {
    type: String,
    default: ''
  },
  x_link: {
    type: String,
    default: ''
  },
  telegram_link: {
    type: String,
    default: ''
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  joiners: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  game_type: {
    type: Schema.Types.ObjectId,
    ref: 'GameType',
    index: true
  },
  selectedStrategy: {
    type: String,
    default: 'Random'
  },
  last_updated_strat: {
    type: Date,
    index: true
  },
  qs_game_type: {
    type: Number,
    default: 2
  },
  qs_nation: {
    type: Number,
    default: 0
  },
  rps_game_type: {
    type: Number,
    default: 0
  },
  bet_amount: {
    type: Number,
    default: 0.0
  },
  user_bet: {
    type: Number,
    default: 0.0
  },
  pr: {
    type: Number,
    default: 0.0
  },
  host_pr: {
    type: Number,
    default: 0.0
  },
  endgame_type: {
    type: Boolean,
    default: false
  },
  endgame_amount: {
    type: Number,
    default: 0.0
  },
  is_private: {
    type: Boolean,
    default: false
  },
  room_password: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  dislikes: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  views: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  battles: {
    type: Number,
    default: 0
  },
  status: { type: String, index: true },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  hosts: [{
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    rank: {
      type: Number,
      default: 0
    },
    avatar: {
      type: String,
      default: ''
    },
    username: {
      type: String,
      default: ''
    },
    walletAddress: {
      type: String,
      default: ''
    },
    accessory: {
      type: String,
      default: ''
    },
    share: {
      type: Number,
      default: 0.0
    },
    initial_stake: {
      type: Number,
      default: 0.0
    },
    stake: {
      type: Number,
      default: 0.0
    }
  }]
});

RoomSchema.index({ creator: 1, game_type: 1 });


module.exports = Room = mongoose.model('rps_rooms', RoomSchema);
