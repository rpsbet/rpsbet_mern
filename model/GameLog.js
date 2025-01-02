const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const GameLogSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    joined_user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    game_type: {
        type: Schema.Types.ObjectId,
        ref: 'GameType'
    },
    bet_amount: {
        type: Number,
        default: 0
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
        default: 0
    },
    game_result: {
        type: Number,
        default: 0
    },
    winnings: {
        type: Number,
        default: 0
    },

    endgame_amount: {
        type: Number,
        default: 0
    },

    host_pr: {
        type: Number,
        default: 0
    },
    user_bet: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        default: ''
    },
    ai_mode: {
        type: String,
        default: ''
    },
    qbot: {
        type: Boolean,
        defalut: ''
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
        accessory: {
            type: String,
            default: ''
        },
        share: {
            type: Number,
            default: 0
        },
        initial_stake: {
            type: Number,
            default: 0
        },
    }],
});

module.exports = GameLog = mongoose.model('rps_game_logs', GameLogSchema);
