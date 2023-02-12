const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DgBetItemSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    joiner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    dg: {
        type: String,
        default: '',
    },
    bet_amount: {
        type: Number,
        default: 0
    },
    joiner_dg: {
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

module.exports = DgBetItem = mongoose.model('rps_dg_bet_item', DgBetItemSchema);
