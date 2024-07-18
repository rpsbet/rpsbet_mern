const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VaultSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    balance: {
        type: Number,
        default: 0
    },
});


module.exports = Vault = mongoose.model('rps_vaults', VaultSchema);
