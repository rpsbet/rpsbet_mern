const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const JukeboxSchema = new Schema({
  videoId: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  progress: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number,
    default: 0,
  }
});

module.exports = GameType = mongoose.model('rps_jukebox', JukeboxSchema);
