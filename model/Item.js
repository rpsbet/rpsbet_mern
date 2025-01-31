const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OwnerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users',
        index: true
    },
    avatar: {
        type: String,
        default: ''
    },
    rank: {
        type: Number,
        default: ''
    },
    accessory: {
        type: String,
        default: ''
    },
    count: {
        type: Number,
        default: 0
    },
    price: {
        type: String,
        default: 0
    },
    onSale: {
        type: Number,
        default: 0,
        index: true
    },
    rentOption: {
        type: Boolean,
        default: false
    },
    lastPayment: {
        type: Date
    },
    originalOwner: {
        type: Schema.Types.ObjectId,
        ref: 'rps_users'
    }
});

const ItemSchema = new Schema({
    owners: [OwnerSchema],
    productName: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        index: true
    },
    item_type: {
        type: Schema.Types.ObjectId,
        ref: 'itemType',
        default: null,
        index: true
    },
    CP: {
        type: Number,
        default: 0
    },
    DP: {
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

// Ensure compound indexes for efficient queries
ItemSchema.index({ 'owners.onSale': 1, 'item_type': 1, 'image': 1 });

module.exports = Item = mongoose.model('rps_items', ItemSchema);
