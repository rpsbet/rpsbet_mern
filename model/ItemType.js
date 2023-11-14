const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemTypeSchema = new Schema({
    item_type_name: {
        type: String,
        default: ''
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

module.exports = ItemType = mongoose.model('rps_item_types', ItemTypeSchema);
