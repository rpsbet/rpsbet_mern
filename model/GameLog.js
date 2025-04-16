const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameLogSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'rps_rooms'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users'
    },
    joined_user: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users'
    },
    game_type: {
        type: Schema.Types.ObjectId,
        ref: 'rps_game_types'
    },
    bet_amount: {
        type: Number,
        default: 0.0
    },
    selected_rps: {
        type: String,
        default: ''
    },
    qs_game_type: {
        type: Number,
        default: 0
    },
    selected_qs_position: {
        type: Number,
        default: 0
    },
    commission: {
        type: Number,
        default: 0.0
    },
    game_result: {
        type: Number,
        default: 0
    },
    winnings: {
        type: Number,
        default: 0.0
    },
    endgame_amount: {
        type: Number,
        default: 0.0
    },
    host_pr: {
        type: Number,
        default: 0.0
    },
    user_bet: {
        type: Number,
        default: 0.0
    },
    status: {
        type: String,
        default: ''
    },
    ai_mode: {
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
    },
    hosts: [{
        host: {
            type: Schema.Types.ObjectId,
            ref: 'rps_users'
        },
        rank: {
            type: Number,
            default: 0.0
        },
        avatar: {
            type: String,
            default: ''
        },
        accessory: {
            type: String,
            default: ''
        },
        elite: {
            type: String,
            default: ''
        },
        share: {
            type: Number,
            default: 0.0
        },
    }],
});

module.exports = GameLog = mongoose.model('rps_game_logs', GameLogSchema);
