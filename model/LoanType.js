const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoanTypeSchema = new Schema({
    loan_type_name: {
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

module.exports = LoanType = mongoose.model('rps_loan_types', LoanTypeSchema);
