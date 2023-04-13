const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const BangBetItemSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    joiner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    bang: {
        type: Number,
        default: 0,
    },
    bang_list: {
        type: [String],
        default: []
    },
    bet_amount: {
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

module.exports = BangBetItem = mongoose.model('rps_bang_bet_item', BangBetItemSchema);
