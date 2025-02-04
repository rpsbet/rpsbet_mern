const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define SubStrategy schema
const SubStrategySchema = new Schema({
    markov: { type: Number, default: 0 },
    adam: { type: Number, default: 0 },
    gpt3: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Define the JoiningStrategy schema
const JoiningStrategySchema = new Schema({
    markov: { type: SubStrategySchema, default: () => ({}) },
    adam: { type: SubStrategySchema, default: () => ({}) },
    gpt: { type: SubStrategySchema, default: () => ({}) },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Define the QBot schema
const QBotSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'rps_users' },
    net_proft: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    joining: { type: JoiningStrategySchema, default: () => ({}) },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Add indexes for improved performance
QBotSchema.index({ user: 1 });  // Index user field for faster lookup by user
QBotSchema.index({ active: 1 }); // Index active field for faster active lookup
QBotSchema.index({ created_at: -1 }); // Index created_at field for fast sorting by creation date
QBotSchema.index({ updated_at: -1 }); // Index updated_at field for fast sorting by update date


module.exports = QBot = mongoose.model('rps_q_bot', QBotSchema);