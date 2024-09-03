const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const NativePriceSchema = new Schema({
    rate: {
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

module.exports = NativePrice = mongoose.model('rps_native_prices', NativePriceSchema);
