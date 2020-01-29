const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomBoxPrizeSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    box_index: {
        type: Number,
        default: 0
    },
    box_prize: {
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

module.exports = RoomBoxPrize = mongoose.model('rps_room_box_prizes', RoomBoxPrizeSchema);
