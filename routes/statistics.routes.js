const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');

// User Model
const User = require('../model/User');
const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const GameLog = require('../model/GameLog');
const Room = require('../model/Room');

router.get('/get-customer-statistics', auth, async (req, res) => {
    try {
      const _id = req.query._id;
      const statistics = {
        deposit: 0,
        withdraw: 0,
        gameProfit: 0
      };
  
      const user = await User.findOne({_id});
      const receipts = await Receipt.find({user_id: _id});
      const transactions = await Transaction.find({user:_id});
      
      for (r of receipts) {
        if (r.payment_type === 'Deposit') {
          statistics['deposit'] += r.amount / 100.0;
        } else if (r.payment_type === 'Withdraw') {
          statistics['withdraw'] += r.amount / 100.0;
        }
      }

      for (t of transactions) {
          if (t.description != 'deposit' && t.description != 'withdraw') {
              statistics['gameProfit'] += t.amount / 100.0;
          }
      }
  
      res.json({
        success: true,
        statistics,
      });
    } catch (err) {
      console.error(err);
      res.json({
        success: false,
        err: message
      });
    }
});

module.exports = router;
