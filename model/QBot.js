const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the SubStrategySchema first
const SubStrategySchema = new Schema({
    copycat: {
        type: Number,
        default: 0
    },
    hiddenmarkov: {
        type: Number,
        default: 0
    },
    markov: {
        type: Number,
        default: 0
    },
    random: {
        type: Number,
        default: 0
    },
    feedback: {
        type: Number,
        default: 0
    },
    innovate: {
        type: Number,
        default: 0
    },
    hertz: {
        type: Number,
        default: 0
    },
    martingale: {
        type: Number,
        default: 0
    },
    adam: {
        type: Number,
        default: 0
    },
    tesla: {
        type: Number,
        default: 0
    },
    npc: {
        type: Number,
        default: 0
    },
    sniper: {
        type: Number,
        default: 0
    },
    skillissue: {
        type: Number,
        default: 0
    },
    skillissue2: {
        type: Number,
        default: 0
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

// Define StrategySchema with nested sub-strategies
const StrategySchema = new Schema({
    copycat: {
        type: SubStrategySchema,
        default: () => ({})
    },
    hiddenmarkov: {
        type: SubStrategySchema,
        default: () => ({})
    },
    markov: {
        type: SubStrategySchema,
        default: () => ({})
    },
    random: {
        type: SubStrategySchema,
        default: () => ({})
    },
    feedback: {
        type: SubStrategySchema,
        default: () => ({})
    },
    innovate: {
        type: SubStrategySchema,
        default: () => ({})
    },
    hertz: {
        type: SubStrategySchema,
        default: () => ({})
    },
    martingale: {
        type: SubStrategySchema,
        default: () => ({})
    },
    adam: {
        type: SubStrategySchema,
        default: () => ({})
    },
    tesla: {
        type: SubStrategySchema,
        default: () => ({})
    },
    npc: {
        type: SubStrategySchema,
        default: () => ({})
    },
    sniper: {
        type: SubStrategySchema,
        default: () => ({})
    },
    skillissue: {
        type: SubStrategySchema,
        default: () => ({})
    },
    skillissue2: {
        type: SubStrategySchema,
        default: () => ({})
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


// Define QBotSchema with two master branches: joining and hosting
const QBotSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    net_proft: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: false,
    },
    joining: {
        type: StrategySchema,
        default: () => ({})
    },
    hosting: {
        type: StrategySchema,
        default: () => ({})
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

module.exports = QBot = mongoose.model('rps_q_bot', QBotSchema);
