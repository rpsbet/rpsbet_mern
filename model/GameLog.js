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
        type: Number,
        default: 0
    },
    game_result: {
        type: Number,
        default: 0
    },
    room_question: {
        type: Schema.Types.ObjectId,
        ref: 'RoomQuestion',
        default: null
    },
    answer: {
        type: Schema.Types.ObjectId,
        ref: 'Answer',
        default: null
    },
    selected_box: {
        type: Schema.Types.ObjectId,
        ref: 'RoomBoxPrize',
        default: null
    },
    is_anonymous: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        defalut: ''
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

module.exports = GameLog = mongoose.model('rps_game_logs', GameLogSchema);
