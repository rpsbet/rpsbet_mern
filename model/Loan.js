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

const LoanSchema = new Schema({
    owners: [OwnerSchema],
    loan_amount: {
        type: Number,
        default: 0
    },
    loan_period: {
        type: Number,
        default: 0
    },
    loan_type: {
        type: Schema.Types.ObjectId,
        ref: 'loanType',
        default: null
    },
    apy: {
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

module.exports = Loan = mongoose.model('rps_loans', LoanSchema);
