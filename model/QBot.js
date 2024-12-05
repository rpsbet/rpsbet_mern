const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define SubStrategy schema
const SubStrategySchema = new Schema({
    copycat: { type: Number, default: 0 },
    hiddenmarkov: { type: Number, default: 0 },
    markov: { type: Number, default: 0 },
    random: { type: Number, default: 0 },
    feedback: { type: Number, default: 0 },
    innovate: { type: Number, default: 0 },
    hertz: { type: Number, default: 0 },
    martingale: { type: Number, default: 0 },
    adam: { type: Number, default: 0 },
    tesla: { type: Number, default: 0 },
    npc: { type: Number, default: 0 },
    sniper: { type: Number, default: 0 },
    skillissueold: { type: Number, default: 0 },
    skillissue: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Define the JoiningStrategy schema
const JoiningStrategySchema = new Schema({
    copycat: { type: SubStrategySchema, default: () => ({}) },
    hiddenmarkov: { type: SubStrategySchema, default: () => ({}) },
    markov: { type: SubStrategySchema, default: () => ({}) },
    random: { type: SubStrategySchema, default: () => ({}) },
    feedback: { type: SubStrategySchema, default: () => ({}) },
    innovate: { type: SubStrategySchema, default: () => ({}) },
    hertz: { type: SubStrategySchema, default: () => ({}) },
    martingale: { type: SubStrategySchema, default: () => ({}) },
    adam: { type: SubStrategySchema, default: () => ({}) },
    tesla: { type: SubStrategySchema, default: () => ({}) },
    npc: { type: SubStrategySchema, default: () => ({}) },
    sniper: { type: SubStrategySchema, default: () => ({}) },
    skillissueold: { type: SubStrategySchema, default: () => ({}) },
    skillissue: { type: SubStrategySchema, default: () => ({}) },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Define the HostingStrategy schema
const HostingStrategySchema = new Schema({
    copycat: { type: Number, default: 0 },
    hiddenmarkov: { type: Number, default: 0 },
    markov: { type: Number, default: 0 },
    random: { type: Number, default: 0 },
    feedback: { type: Number, default: 0 },
    innovate: { type: Number, default: 0 },
    hertz: { type: Number, default: 0 },
    martingale: { type: Number, default: 0 },
    adam: { type: Number, default: 0 },
    tesla: { type: Number, default: 0 },
    npc: { type: Number, default: 0 },
    sniper: { type: Number, default: 0 },
    skillissueold: { type: Number, default: 0 },
    skillissue: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Define the QBot schema
const QBotSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    net_proft: { type: Number, default: 0 },
    active: { type: Boolean, default: false },
    joining: { type: JoiningStrategySchema, default: () => ({}) },
    hosting: { type: HostingStrategySchema, default: () => ({}) },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

// Add indexes for improved performance
QBotSchema.index({ user: 1 });  // Index user field for faster lookup by user
QBotSchema.index({ active: 1 }); // Index active field for faster active lookup
QBotSchema.index({ created_at: -1 }); // Index created_at field for fast sorting by creation date
QBotSchema.index({ updated_at: -1 }); // Index updated_at field for fast sorting by update date

// Optional: If you often query by specific strategies, you can add more indexes
// Example for copycat strategy in joining field:
QBotSchema.index({ 'joining.copycat': 1 });
// Example for copycat strategy in hosting field:
QBotSchema.index({ 'hosting.copycat': 1 });

module.exports = QBot = mongoose.model('rps_q_bot', QBotSchema);