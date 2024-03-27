/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const {
  calculate7dayProfit,
  calculate1dayProfit,
  calculateAllTimeProfit
} = require('../helper/util/profitCalculation');
const router = express.Router();
const bcrypt = require('bcryptjs');
// User Model
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Message = require('../model/Message');
const Transaction = require('../model/Transaction');
const ChangePasswordRequest = require('../model/ChangePasswordRequest');

const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');
const { resetPassword } = require('../helper/mailer');

// @route   POST api/auth
// @desc    Auth user
// @access  Public
// eslint-disable-next-line consistent-return
router.post('/', (req, res) => {
  const { email, password } = req.body;
  //  Simple validation
  if (!email || !password) {
    return res.json({
      success: false,
      error: 'Please enter all fields'
    });
  }

  // Check for existing user
  User.findOne({
    $and: [
      { is_deleted: false },
      { $or: [{ email: email }, { username: email }] }
    ]
  }).then(user => {
    if (!user || user.is_deleted === true)
      return res.json({
        success: false,
        error: 'User does not exist'
      });

    // Validate password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch)
        return res.json({
          success: false,
          error: 'Invalid credentials'
        });
      jwt.sign(
        { id: user._id, is_admin: 0 },
        process.env.SECRET_OR_KEY,
        { expiresIn: '7d' },
        (err, token) => {
          res.json({
            success: true,
            message: "NICE, YOU'RE IN!",
            token,
            user
          });
        }
      );
    });
  });
});

// New endpoint for fetching profit data
router.get('/profit', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const allTransactions = await Transaction.find({ user: user });

    const profitData = getProfitData(allTransactions);
console.log(profitData)
    res.json({
      success: true,
      user: req.user,
      profitData,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
// Calculate profits without including transactions with 'withdraw' or 'deposit' in the description
router.get('/user', auth, async (req, res) => {
  try {
    const { loadMore, filterType, search, sortBy } = req.query;
    const queryLimit = parseInt(loadMore) ? 10 + parseInt(loadMore) : 5;
    const user = req.user._id;

    const filterTypes = {
      showWithdrawals: 'withdraw',
      showDeposits: 'deposit',
      showTrades: 'trade',
      showLoans: 'loan',
      showTips: 'tip',
    };

    let query = { user: user };

    if (filterType && filterTypes[filterType]) {
      query.description = { $regex: filterTypes[filterType], $options: 'i' };
    } else if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    const transactions = await Transaction.find({ user: user })
      .sort(sortBy === 'amount' ? { amount: -1 } : { created_at: -1 })
      .limit(queryLimit);
    let unread_message_count = await Message.countDocuments({
      to: req.user._id,
      is_read: false,
    });

    res.json({
      success: true,
      user: req.user,
      unread_message_count,
      transactions,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});


const getProfitData = (transactions) => ({
  sevenDayProfit: calculate7dayProfit(transactions),
  oneDayProfit: calculate1dayProfit(transactions),
  allTimeProfit: calculateAllTimeProfit(transactions),
});


// Forgot Password
router.post('/sendResetPasswordEmail', async (req, res) => {
  try {
    User.findOne({ email: req.body.email }).then(async user => {
      if (!user || user.is_deleted === true)
        return res.json({
          success: false,
          error: 'Email does not exist in our community.'
        });

      const request = new ChangePasswordRequest({ user: user });
      await request.save();
      resetPassword(
        user.email,
        user.username,
        `${request._id}-${user._id}`
      ).then(() =>
        res.json({
          success: true
        })
      );
    });
  } catch (error) {
    res.json({ success: false, error: error.toString() });
  }
});

// Forgot Password
router.post('/resetPassword', async (req, res) => {
  try {
    const params = req.body.code.split('-');
    if (params.length !== 2) {
      return res.json({
        success: false,
        error: 'Invalid Action'
      });
    }

    const request = await ChangePasswordRequest.findOne({
      _id: params[0]
    }).populate({ path: 'user', model: User });

    if (request.user._id != params[1]) {
      return res.json({
        success: false,
        error: 'Invalid Action'
      });
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) throw err;
        request.user.password = hash;
        request.user.save();
        return res.json({
          success: true
        });
      });
    });
  } catch (error) {
    res.json({ success: false, error: error.toString() });
  }
});

// Change Password in EditAccountModal
router.post('/changePasswordAndAvatar', auth, async (req, res) => {
  try {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.new_password, salt, (err, hash) => {
        if (err) throw err;
        if (req.body.new_password !== '') {
          req.user.password = hash;
        }
        req.user.avatar = req.body.new_avatar;
        req.user.save();
        return res.json({
          success: true
        });
      });
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

// Delete Account
router.post('/deleteAccount', auth, async (req, res) => {
  try {
    if (req.user.balance > 0) {
      return res.json({
        success: false,
        error: 'Oops! Please withdraw all funds first.'
      });
    }

    req.user.is_deleted = true;
    req.user.save();

    return res.json({
      success: true
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

// @route   GET api/auth/logout
// @desc    logout
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    req.user.status = 'off';
    req.user.save();
    res.json({
      success: true,
      message: 'LOGGED TF OUT!'
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

router.post('/resend_verification_email', auth, async (req, res) => {
  try {
    const verification_code = Math.floor(Math.random() * 8999) + 1000;
    req.user.verification_code = verification_code;
    req.user.save();

    sendgrid.sendWelcomeEmail(
      req.user.email,

      req.user.username,

      verification_code
    );

    res.json({
      success: true,
      message: 'Email has been sent. Please check your inbox (including spam).'
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

router.post('/verify_email', auth, async (req, res) => {
  try {
    if (req.user.verification_code === req.body.verification_code) {
      req.user.is_activated = true;
      req.user.save();

      res.json({
        success: true,
        message: ''
      });
    } else {
      res.json({
        success: false,
        error: 'Wrong Verification Code'
      });
    }
  } catch (error) {
    res.json({ success: false, error });
  }
});

module.exports = router;
