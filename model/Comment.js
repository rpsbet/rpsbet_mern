const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    avatar: {
        type: String,
        ref: 'User.avatar'
    },
    accessory: {
        type: String,
        ref: 'User.accessory'
    },
    totalWagered: {
        type: Number,
        ref: 'User.totalWagered'
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'Room'
    },
    content: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

const Comment = mongoose.model('rps_comments', CommentSchema);

module.exports = Comment;
