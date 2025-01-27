/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const {
  calculate7dayProfit,
  calculate1dayProfit,
  calculateAllTimeProfit
} = require('../helper/util/profitCalculation');
const saveDocumentWithRetry = require('../helper/util/retrySave');

const router = express.Router();
const bcrypt = require('bcryptjs');
// User Model
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Message = require('../model/Message');
const Transaction = require('../model/Transaction');
const ChangePasswordRequest = require('../model/ChangePasswordRequest');
const { OAuth2Client } = require('google-auth-library');

const auth = require('../middleware/auth');

// @route   POST api/auth
// @desc    Auth user
// @access  Public
// eslint-disable-next-line consistent-return

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const generateRandomPassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
};

const generateReferralCode = () => {
  let referralCode = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  for (let i = 0; i < 6; i++) {
    referralCode += characters.charAt(
      Math.floor(Math.random() * characters.length)
    );
  }
  return referralCode;
};
// Google OAuth 2.0 login route
router.post('/google', async (req, res) => {
  const { token } = req.body;
  const tokenString = token.token; // Extract token from the object

  if (typeof tokenString !== 'string') {
    console.log('Invalid token format');
    return res.status(400).json({ success: false, error: 'Token must be a string' });
  }

  try {
    // Verify the Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenString,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // Extract user data from payload
    const { name, email, picture } = payload;
    const username = email.split('@')[0];


    let user = await User.findOne({ email: email });

    if (!user) {
      user = new User({
        username,
        password: generateRandomPassword(),
        bio: '',
        totalWagered: 0,
        balance: 0,
        email: email,
        rewards: [],
        credit_score: 1000,
        ai_mode: 'Random',
        status: 'off',
        avatar: picture,
        referralCode: generateReferralCode(),
        referralId: null
      });

      await user.save();
    }

    // Generate JWT token for the user
    const jwtToken = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.SECRET_OR_KEY,
      { expiresIn: '7d' } // Token expires in 7 days
    );

    res.json({
      success: true,
      message: "WE'RE IN BOYS",
      token: jwtToken,
      user
    });
  } catch (error) {
    console.error('Error verifying Google token:', error);
    res.status(401).json({ success: false, error: 'Invalid Google token' });
  }
});

// login
router.post('/', (req, res) => {
  const { email, password } = req.body;
  // Simple validation
  if (!email || !password) {
    console.log(!email, !password)
    return res.json({
      success: false,
      error: 'PLEASE ENTER ALL FIELDS'
    });
  }

  const lowerCaseEmail = email.toLowerCase(); // Convert email to lowercase

  // Check for existing user (case-insensitive)
  User.findOne({
    is_deleted: false,
    $or: [
      { email: { $regex: new RegExp('^' + lowerCaseEmail, 'i') } },
      { username: { $regex: new RegExp('^' + lowerCaseEmail, 'i') } }
    ]
  }).then(user => {
    if (!user)
      return res.json({
        success: false,
        error: 'USER DOES NOT EXIST'
      });

    // Validate password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (!isMatch)
        return res.json({
          success: false,
          error: 'INVALID CREDENTIALS'
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
  }).catch(error => {
    console.error('Error finding user:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  });
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
        try {
          saveDocumentWithRetry(request.user);
        } catch (error) {
          console.error("Error saving  request.user:", error);
        }
        return res.json({
          success: true
        });
      });
    });
  } catch (error) {
    res.json({ success: false, error: error.toString() });
  }
});


// New endpoint for fetching profit data
router.get('/profit', auth, async (req, res) => {
  try {
    const user = req.user._id;
    const allTransactions = await Transaction.find({ user: user });

    const profitData = getProfitData(allTransactions);
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
// routes/auth.js (or wherever you define /user route)
router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const transactions = await Transaction.find({ user: userId })
      .sort({ created_at: -1 })
      .limit(5);

    const unread_message_count = await Message.countDocuments({
      to: userId,
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


// routes/auth.js (or wherever you have your transactions endpoint)
router.get('/transactions', auth, async (req, res) => {
  try {
    const { page = 1, filterType, search, sortBy } = req.query;

    const limit = 25;
    const skip = (parseInt(page) - 1) * limit;

    // Build base query (only for the logged-in user)
    let query = { user: req.user._id };

    // For quick mapping from filter type to a substring we want in `description`
    const filterMap = {
      showWithdrawals: 'withdraw', // e.g. 'withdraw' in description
      showDeposits: 'deposit',
      showTrades: 'trade',
      showTips: 'tip',
      showLoans: 'loan',
    };

    // 1) If user selected a filter
    if (filterType && filterMap[filterType]) {
      query.description = {
        $regex: filterMap[filterType],
        $options: 'i', // case-insensitive
      };
    }

    // 2) If user is searching, override or combine with filter
    //    Typically you might do an OR/AND. For simplicity, we’ll do either filter or search
    //    If you want them to stack, you'd combine the conditions instead of overriding them.
    if (search) {
      query.description = {
        $regex: search,
        $options: 'i',
      };
    }

    // 3) Sorting
    let sortOptions = { created_at: -1 }; // default: newest first
    if (sortBy === 'amount') {
      sortOptions = { amount: -1 }; // largest amounts first
    } else if (sortBy === 'date') {
      sortOptions = { created_at: -1 }; // already the default
    }

    // 4) Fetch transactions
    const transactions = await Transaction.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    const totalCount = await Transaction.countDocuments(query);

    return res.json({
      success: true,
      all_transactions: transactions,
      totalCount,
      page: parseInt(page),
      hasMore: skip + transactions.length < totalCount,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

const getProfitData = (transactions) => ({
  sevenDayProfit: calculate7dayProfit(transactions),
  oneDayProfit: calculate1dayProfit(transactions),
  allTimeProfit: calculateAllTimeProfit(transactions),
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
        try {
          saveDocumentWithRetry(req.user);
        } catch (error) {
          console.error("Error saving   req.user:", error);
        }
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
    try {
      await saveDocumentWithRetry(req.user);
    } catch (error) {
      console.error("Error saving req.user:", error);
    }

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
    try {
      await saveDocumentWithRetry(req.user);
    } catch (error) {
      console.error("Error saving req.user:", error);
    }
    res.json({
      success: true,
      message: 'LOGGED TF OUT!'
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

module.exports = router;
