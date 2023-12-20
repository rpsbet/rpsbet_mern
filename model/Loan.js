const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LoanerSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    amount: {
        type: Number,
        default: 0
    },
    paidBack: {
        type: String,
        default: 0
    },
    period: {
        type: Number,
        default: 0
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

const LoanSchema = new Schema({
    lender: {
        type: Schema.Types.ObjectId,
        ref: 'lender',
        default: null
    },
    loaners: [LoanerSchema],
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
