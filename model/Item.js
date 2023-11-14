const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OwnerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
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
        default: 0
    }
});

const ItemSchema = new Schema({
    owners: [OwnerSchema],
    productName: {
        type: String,
        default: ''
    },
    image: {
        type: String
    },
    item_type: {
        type: Schema.Types.ObjectId,
        ref: 'itemType',
        default: null
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

module.exports = Item = mongoose.model('rps_items', ItemSchema);
