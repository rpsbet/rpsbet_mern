const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReceiptSchema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'rps_users'
  },
  payment_method: {
    type: String,
    default: 'Stripe'
  },
  payment_type: {
    type: String,
    default: ''
  },
  amount: {
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

module.exports = Receipt = mongoose.model('rps_receipt', ReceiptSchema);
