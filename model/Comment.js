const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users'
    },
    avatar: {
        type: String,
        ref: 'rps_users.avatar'
    },
    accessory: {
        type: String,
        ref: 'rps_users.accessory'
    },
    elite: {
        type: String,
        ref: 'rps_users.elite'
    },
    totalWagered: {
        type: Number,
        ref: 'rps_users.totalWagered'
    },
    room: {
        type: Schema.Types.ObjectId,
        ref: 'rps_rooms'
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
