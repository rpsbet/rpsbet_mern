const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OwnerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true // Add index on user
    },
    avatar: {
        type: String, // Assuming the avatar is a URL or file path
        default: '' // Provide a default avatar URL if necessary
    },
    rank: {
        type: Number, // Or you can use Number if rank is represented by a numerical value
        default: '' // Default rank if necessary
    },
    accessory: {
        type: String, // Assuming accessory is represented as a string
        default: '' // Default accessory if necessary
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
        index: true // Add index on onSale
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
        ref: 'User'
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
        index: true // Add index on image
    },
    item_type: {
        type: Schema.Types.ObjectId,
        ref: 'itemType',
        default: null,
        index: true // Add index on item_type
    },
    CP: {
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
