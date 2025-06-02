/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const {
  calculate7dayProfit,
  calculate1dayProfit,
  calculateAllTimeProfit
} = require('../helper/util/profitCalculation');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const moment = require('moment');
const socket = require('../socketController.js');
const Notification = require('../model/Notification');
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

// routes/auth.js (or wherever your auth routes live)
router.post('/phantom', async (req, res) => {
  const { walletAddress } = req.body;
  if (!walletAddress) {
    return res.json({ success: false, error: 'Missing wallet address' });
  }

  try {
    // 1) Check if there's any user who has this address in accounts
    let user = await User.findOne({ accounts: walletAddress });

    if (user) {
      // Existing user found. We "log them in" by returning a JWT.
      const token = jwt.sign(
        { id: user._id, is_admin: user.is_admin },
        process.env.SECRET_OR_KEY,
        { expiresIn: '7d' }
      );
      return res.json({
        success: true,
        message: "DEGEN CONNECTED!",
        token,
        user
      });
    }

    // 2) If not found, create a new user
    // e.g. let's default username to the last 6 chars of the wallet
    const lastSix = walletAddress.slice(-6);
    const username = `CAT_${lastSix}`;

    const newUser = new User({
      username,
      password: generateRandomPassword(),
      bio: '',
      totalWagered: 0,
      totalTraded: 0,
      balance: 0,
      rewards: [],
      credit_score: 1000,
      ai_mode: 'Random',
      status: 'off',
      accounts: [walletAddress],
      avatar: '',
      referralCode: generateReferralCode(),
      referralUsername: ''
    });
    await newUser.save();

    // 3) Return the JWT for the new user
    const token = jwt.sign(
      { id: newUser._id, is_admin: newUser.is_admin },
      process.env.SECRET_OR_KEY,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: "Degen registration detected...",
      token,
      user: newUser
    });
  } catch (error) {
    console.error('Error in /auth/phantom route:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error connecting Phantom wallet.'
    });
  }
});

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
        totalTraded: 0,
        balance: 0,
        email: email,
        rewards: [],
        credit_score: 1000,
        ai_mode: 'Random',
        status: 'off',
        avatar: picture,
        referralCode: generateReferralCode(),
        referralUsername: ''
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

//Privy Login
router.post('/privy', async (req, res) => {
  const { privyId, email, wallet } = req.body;

  if (!privyId) {
    return res.status(400).json({
      success: false,
      error: 'Missing Privy user ID',
    });
  }

  try {
    // Step 1: Look up user by privyId or wallet/email fallback
    let user = await User.findOne({
      $or: [
        { privyId },
        wallet ? { accounts: wallet } : null,
        email ? { email } : null,
      ].filter(Boolean)
    });

    if (!user) {
      // Step 2: Create new user
      const username = `PRIVY_${privyId.slice(-6)}`;

      user = new User({
        privyId,
        username,
        email: email || '',
        password: generateRandomPassword(),
        bio: '',
        totalWagered: 0,
        totalTraded: 0,
        balance: 0,
        rewards: [],
        credit_score: 1000,
        ai_mode: 'Random',
        status: 'off',
        avatar: '',
        referralCode: generateReferralCode(),
        referralUsername: '',
        accounts: wallet ? [wallet] : [],
      });

      await user.save();
    }

    // Step 3: Generate JWT
    const token = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.SECRET_OR_KEY,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Logged in via Privy',
      token,
      user,
    });

  } catch (error) {
    console.error('Error in /auth/privy route:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during Privy authentication.',
    });
  }
});



router.post('/users/add-wallet', auth, async (req, res) => {
  try {
    const { walletAddress } = req.body;
    const userId = req.user._id; // from token, for example

    // Check if any user has this wallet (besides the current user).
    const foundUser = await User.findOne({
      _id: { $ne: userId },
      accounts: walletAddress,
    });
    if (foundUser) {
      return res.json({
        success: false,
        message: 'Wallet address already associated with another user.',
      });
    }

    // Otherwise, add to the current user if not already in array
    const currentUser = await User.findById(userId);
    if (!currentUser.accounts.includes(walletAddress)) {
      currentUser.accounts.push(walletAddress);
      await currentUser.save();
    }

    return res.json({ success: true, updatedUser: currentUser });
  } catch (err) {
    console.error('Error adding wallet address:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error adding wallet address.',
    });
  }
});

// routes/auth.js
router.post('/cancel-elite', auth, async (req, res) => {
  const userId = req.user.id;

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.elite) {
      return res.status(400).json({
        success: false,
        message: 'No active Elite subscription to cancel',
      });
    }

    // Update user's elite status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        elite: null,
        last_elite_payment: null,
      },
      { new: true }
    );

    // Create new transaction
    const newTransaction = new Transaction({
      user: userId,
      amount: 0,
      description: 'Elite Subscription Cancellation',
    });

    await saveDocumentWithRetry(newTransaction);

    // Create notification
    const notification = new Notification({
      from: userId,
      to: userId,
      room: null,
      message: 'Cancelled Elite subscription',
      amount: 0,
      is_read: false,
    });

    const notificationData = {
      message: notification.message,
      username: user.username,
      avatar: user.avatar,
      accessory: user.accessory,
      elite: null,
      room: null,
      amount: 0,
      rank: user.totalWagered || 0,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    // Save notification
    await saveDocumentWithRetry(notification);

    // Emit events
    socket.newTransaction(newTransaction);
    socket.sendNotification(userId, notificationData);

    // Return success response
    return res.json({
      success: true,
      message: 'Successfully cancelled Elite subscription',
      user: {
        balance: updatedUser.balance,
        elite: updatedUser.elite,
        last_elite_payment: updatedUser.last_elite_payment,
      },
    });
  } catch (err) {
    console.error('Cancel elite subscription error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while cancelling subscription',
      error: err.message,
    });
  }
});

router.post('/purchase-elite', auth, async (req, res) => {
  const { type } = req.body;
  const userId = req.user.id;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  // Define subscription amounts
  const subscriptionAmounts = {
    red: 0.2,
    black: 1.0,
  };

  if (!['red', 'black'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription type',
    });
  }

  try {
    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.elite === type) {
      return res.status(400).json({
        success: false,
        message: `You are already subscribed to ${type} elite membership`,
      });
    }

    // Add IP to user's IP history if not already present
    if (!user.ip_addresses.includes(clientIp)) {
      user.ip_addresses.push(clientIp);
      await user.save();
    }

    // Check for free trial eligibility (only for red tier)
    let amount = subscriptionAmounts[type];
    let isFreeMonth = false;
    let message = `Successfully subscribed to ${type.charAt(0).toUpperCase() + type.slice(1)} Elite membership`;

    if (type === 'red' && !user.elite_free_used) {
      // Check if any other accounts with this IP have used the free trial
      const ipMatch = await User.findOne({
        ip_addresses: clientIp,
        elite_free_used: true,
        _id: { $ne: userId } // Not the current user
      });

      if (!ipMatch) {
        // User is eligible for free month
        amount = 0;
        isFreeMonth = true;
        message = 'Successfully activated your FREE first month of Red Elite membership!';
      }
    }

    // Check if user has enough balance when not free
    if (!isFreeMonth && user.balance < amount) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to purchase subscription',
      });
    }

    // Update user's balance, elite status, and subscription date
    const updateData = {
      elite: type,
      last_elite_payment: new Date()
    };

    // Only deduct balance if not free
    if (!isFreeMonth) {
      updateData.$inc = { balance: -amount };
    }

    // Mark free trial as used if applicable
    if (isFreeMonth) {
      updateData.elite_free_used = true;
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    // Create new transaction (only if not free)
    if (!isFreeMonth) {
      const newTransaction = new Transaction({
        user: userId,
        amount: -amount,
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} Elite Subscription Purchase`,
      });
      await saveDocumentWithRetry(newTransaction);
      socket.newTransaction(newTransaction);
    }

    // Create notification with appropriate message
    const notificationText = isFreeMonth 
      ? `Activated FREE first month of Red Elite subscription` 
      : `Purchased ${type} elite subscription`;

    const notification = new Notification({
      from: userId,
      to: userId,
      room: null,
      message: notificationText,
      amount: isFreeMonth ? 0 : amount,
      is_read: false,
    });

    const notificationData = {
      message: notification.message,
      username: user.username,
      avatar: user.avatar,
      accessory: user.accessory,
      elite: type,
      room: null,
      amount: isFreeMonth ? 0 : amount,
      rank: user.totalWagered || 0,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    // Save notification
    await saveDocumentWithRetry(notification);
    socket.sendNotification(userId, notificationData);

    // Return success response
    return res.json({
      success: true,
      message: message,
      user: {
        balance: updatedUser.balance,
        elite: updatedUser.elite,
        elite_free_used: updatedUser.elite_free_used,
        last_elite_payment: updatedUser.last_elite_payment,
      },
    });
  } catch (err) {
    console.error('Elite subscription error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while processing subscription',
      error: err.message,
    });
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

router.post('/set-referral', auth, async (req, res) => {
  try {
    const { referralCode } = req.body;

    // If referralCode is blank, clear the referralUsername field
    if (!referralCode || referralCode.trim() === '') {
      req.user.referralUsername = null;
      await req.user.save();
      return res.json({
        success: true,
        message: 'Referral code cleared successfully.',
      });
    }

    // Find the user with the given referralCode
    const referredUser = await User.findOne({ referralCode });

    if (!referredUser) {
      return res.json({
        success: false,
        error: 'Invalid referral code.',
      });
    }

    // Save the referred user's ID in the referralUsername field of the current user
    req.user.referralUsername = referredUser.username;
    await req.user.save();

    return res.json({
      success: true,
      message: 'Referral code applied successfully.',
      referredUser: referredUser.username,
    });
  } catch (error) {
    console.error('Error in /set-referral route:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error while setting referral code.',
    });
  }
});

router.get('/user', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const cacheKey = `user:${userId}`;

    // Get Redis client from app (set in server.js)
    const redisClient = req.app.get('redisClient');

    // Check cache
    let cached;
    try {
      cached = await redisClient.get(cacheKey);
    } catch (redisErr) {
      console.error('Redis error, bypassing cache:', redisErr);
    }

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Fetch data from database
    const transactions = await Transaction.find({ user: userId })
      .sort({ created_at: -1 })
      .limit(5)
      .lean(); // Optimize with lean

    const response = {
      success: true,
      user: req.user,
      transactions,
    };

    // Cache for 5 minutes
    try {
      await redisClient.setEx(cacheKey, 300, JSON.stringify(response));
    } catch (redisErr) {
      console.error('Failed to cache:', redisErr);
    }

    res.json(response);
  } catch (error) {
    console.error('Error in /user:', error);
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
// router.post('/deleteAccount', auth, async (req, res) => {
//   try {
//     if (req.user.balance > 0) {
//       return res.json({
//         success: false,
//         error: 'Oops! Please withdraw all funds first.'
//       });
//     }

//     req.user.is_deleted = true;
//     try {
//       await saveDocumentWithRetry(req.user);
//     } catch (error) {
//       console.error("Error saving req.user:", error);
//     }

//     return res.json({
//       success: true
//     });
//   } catch (error) {
//     res.json({ success: false, error });
//   }
// });

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
