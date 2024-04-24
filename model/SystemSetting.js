const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SystemSettingSchema = new Schema({
    name: {
        type: String,
        default: ''
    },
    value: {
        type: String,
        defalut: ''
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

SystemSettingSchema.index({ name: 1 }); // Index on the 'name' field

module.exports = SystemSetting = mongoose.model('rps_system_setting', SystemSettingSchema);
