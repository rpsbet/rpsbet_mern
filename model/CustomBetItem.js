const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CustomBetItemSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'rps_rooms'
    },
    joiner: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users',
        default: null
    },
    bet_amount: {
        type: Number,
        default: 0
    },
    multiplier: {
        type: Number,
        default: 1
    },
    result: {
        type: String,
        default: ''
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

module.exports = QsBetItem = mongoose.model('rps_custom_bet_item', CustomBetItemSchema);
