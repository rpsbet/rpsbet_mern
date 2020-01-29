const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuestionSchema = new Schema({
    game_type: {
        type: Schema.Types.ObjectId,
        ref: 'GameType'
    },
    question: {
        type: String,
        default: ''
    },
    game_level: {
        type: Number,
        default: 1
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

module.exports = Question = mongoose.model('rps_questions', QuestionSchema);
