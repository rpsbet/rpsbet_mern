const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomQuestionSchema = new Schema({
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    question: {
        type: Schema.Types.ObjectId,
        ref: 'Question'
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

module.exports = RoomQuestion = mongoose.model('rps_room_questions', RoomQuestionSchema);
