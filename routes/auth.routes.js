/* eslint-disable consistent-return */
const express = require('express');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const moment = require('moment');
const { Connection, PublicKey } = require('@solana/web3.js');
const socket = require('../socketController.js');
const Notification = require('../model/Notification');
const router = express.Router();
const bcrypt = require('bcryptjs');
// User Model
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Transaction = require('../model/Transaction');
const ChangePasswordRequest = require('../model/ChangePasswordRequest');
const { OAuth2Client } = require('google-auth-library');

const auth = require('../middleware/auth');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const userCache = new Map();
// Memory cache for transactions (separate from user cache)
const transactionCache = new Map();

// Cache validity check function (if not already defined)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const isCacheValid = (cached) => {
  return cached && (Date.now() - cached.timestamp) < CACHE_DURATION;
};

// Clean cache function (if not already defined)
const cleanCache = () => {
  const now = Date.now();

  // Clean user cache
  for (const [key, value] of userCache) {
    if (now - value.timestamp > CACHE_DURATION) {
      userCache.delete(key);
    }
  }

  // Clean transaction cache
  for (const [key, value] of transactionCache) {
    if (now - value.timestamp > CACHE_DURATION) {
      transactionCache.delete(key);
    }
  }
};


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
    const redisClient = req.app.get('redisClient');

    // Step 1: Check Redis cache first
    const userCacheKey = `user:privy:${privyId}`;
    let user = null;
    let fromCache = false;

    try {
      const cachedUser = await redisClient.get(userCacheKey);
      if (cachedUser) {
        user = JSON.parse(cachedUser);
        fromCache = true;
      }
    } catch (redisErr) {
      console.error('Redis error during user lookup:', redisErr);
    }

    // Step 2: If not in cache, look up in database
    if (!user) {
      user = await User.findOne({
        $or: [
          { privyId },
          wallet ? { accounts: wallet } : null,
          email ? { email } : null,
        ].filter(Boolean)
      });

      if (!user) {
        // Step 3: Create new user
        const username = `CAT_${privyId.slice(-6)}`;

        user = new User({
          privyId,
          username,
          email: email || null,
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
      } else if (wallet && !user.accounts.includes(wallet)) {
        // Update user with new wallet
        user.accounts.push(wallet);
        await user.save();
      }

      // Cache the user data for 15 minutes
      try {
        await redisClient.setEx(
          userCacheKey,
          900, // 15 minutes
          JSON.stringify(user.toObject())
        );
        console.log(`User cached: ${privyId}`);
      } catch (redisErr) {
        console.error('Failed to cache user:', redisErr);
      }
    }

    // Step 4: Generate JWT
    const token = jwt.sign(
      { id: user._id, is_admin: user.is_admin },
      process.env.SECRET_OR_KEY,
      { expiresIn: '7d' }
    );

    // Step 5: Cache the session
    const sessionCacheKey = `session:${user._id}`;
    try {
      await redisClient.setEx(
        sessionCacheKey,
        604800, // 7 days (same as JWT expiry)
        JSON.stringify({
          userId: user._id,
          privyId,
          wallet: wallet || (user.accounts.length > 0 ? user.accounts[0] : null),
          createdAt: new Date().toISOString()
        })
      );
    } catch (redisErr) {
      console.error('Failed to cache session:', redisErr);
    }

    return res.json({
      success: true,
      message: fromCache ? 'Success (cached) :)' : 'Success :)',
      token,
      user: {
        ...user.toObject ? user.toObject() : user,
        primaryWallet: wallet || (user.accounts.length > 0 ? user.accounts[0] : null)
      },
    });

  } catch (error) {
    console.error('Error in /auth/privy route:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error during Privy authentication.',
    });
  }
});

router.get('/wallet-balance/:walletAddress', auth, async (req, res) => {
  try {
    const { walletAddress } = req.params;

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address required'
      });
    }

    const SolanaBalanceChecker = require('../helper/util/solanaBalance');
    const balance = await SolanaBalanceChecker.getSOLBalance(walletAddress);

    res.json({
      success: true,
      balance,
      walletAddress
    });
  } catch (error) {
    console.error('Error fetching wallet balance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch wallet balance'
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
  const { type, signature, amount } = req.body;
  const userId = req.user.id;

  // Define subscription amounts (use the FRONTEND amounts, not backend amounts)
  const subscriptionAmounts = {
    red: 0.1,   // Changed from 0.2 to match frontend
    black: 0.4, // Changed from 1.0 to match frontend
  };

  if (!['red', 'black'].includes(type)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid subscription type',
    });
  }

  if (!signature) {
    return res.status(400).json({
      success: false,
      message: 'Transaction signature is required',
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

    // Check if this transaction signature has already been used
    const existingTransaction = await Transaction.findOne({ txtHash: signature });
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: 'Transaction signature has already been used',
      });
    }

    // Get the expected amount for this subscription type
    const expectedAmount = subscriptionAmounts[type];
    const actualAmount = amount || expectedAmount;

    // Validate amount if provided
    if (amount && Math.abs(amount - expectedAmount) > 0.001) {
      return res.status(400).json({
        success: false,
        message: `Invalid amount. Expected ${expectedAmount} SOL for ${type} subscription`,
      });
    }

    // console.log('[purchase-elite] Creating pending transaction:', {
    //   userId,
    //   type,
    //   signature,
    //   amount: actualAmount
    // });

    // Create PENDING transaction - let cron job verify and complete it
    const newTransaction = new Transaction({
      user: userId,
      amount: -actualAmount, // Negative because it's an expense
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} Elite Subscription`, // This should match the cron job pattern
      txtHash: signature,
      hash: signature, // Some parts of your code use 'hash', others use 'txtHash'
      status: 'pending', // Important: Let cron job verify this
      type: 'elite_subscription', // Add type for easier filtering
      subscriptionType: type, // Store the subscription type
    });

    await saveDocumentWithRetry(newTransaction);

    // console.log('[purchase-elite] Pending transaction created:', newTransaction._id);

    // Emit the pending transaction immediately
    socket.newTransaction(newTransaction);

    // Return success - the cron job will handle verification and user updates
    return res.json({
      success: true,
      message: `Elite subscription transaction submitted. Verification in progress...`,
      transaction: {
        id: newTransaction._id,
        signature,
        type,
        amount: actualAmount,
        status: 'pending'
      },
      // Don't update user.elite yet - let cron job do it after verification
      user: {
        id: user._id,
        elite: user.elite, // Return current status
        // The cron job will update this and send real-time updates
      }
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
    const userId = req.user._id.toString();
    const cacheKey = `user_${userId}`;

    // Check cache first
    const cached = userCache.get(cacheKey);
    if (isCacheValid(cached)) {
      return res.json({
        ...cached.data,
        fromCache: true
      });
    }

    // Fetch only user data (no transactions)
    const user = await User.findById(userId)
      .select('-password -ip_addresses') // Exclude sensitive data
      .lean(); // Much faster than full mongoose docs

    const response = {
      success: true,
      user,
      fromCache: false
    };

    // Cache the result
    userCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    // Clean old cache entries occasionally
    if (userCache.size > 1000) {
      cleanCache();
    }

    res.json(response);

  } catch (error) {
    console.error('Error in /user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// New route for transactions only
router.get('/user/transactions', auth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const cacheKey = `transactions_${userId}`;

    // Check cache first
    const cached = transactionCache.get(cacheKey);
    if (isCacheValid(cached)) {
      return res.json({
        ...cached.data,
        fromCache: true
      });
    }

    // Get user transactions with pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50; // Default to 50 transactions
    const skip = (page - 1) * limit;

    const [transactions, totalCount] = await Promise.all([
      Transaction.find({ user: userId })
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .select('amount description created_at hash status')
        .lean(),

      Transaction.countDocuments({ user: userId })
    ]);

    const response = {
      success: true,
      transactions,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasMore: skip + transactions.length < totalCount
      },
      fromCache: false
    };

    // Cache the result (shorter cache time for transactions as they change more frequently)
    transactionCache.set(cacheKey, {
      data: response,
      timestamp: Date.now()
    });

    res.json(response);

  } catch (error) {
    console.error('Error in /user/transactions:', error);
    res.status(500).json({ success: false, error: error.message });
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

// Change Password in EditAccountModal
router.post('/changePasswordAndAvatar', auth, async (req, res) => {
  try {
    const { new_password, new_avatar } = req.body;

    // If password is provided, hash it
    if (new_password) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(new_password, salt);
      req.user.password = hash;
    }

    // FIXED: Avatar is now a URL, not base64 data
    if (new_avatar) {
      // Validate it's a proper Pinata URL
      if (new_avatar.startsWith('https://gateway.pinata.cloud/ipfs/')) {
        req.user.avatar = new_avatar;
        console.log('✅ Avatar URL saved:', new_avatar.substring(0, 60) + '...');
      } else if (new_avatar.startsWith('data:')) {
        // Reject base64 data
        console.warn('⚠️ Rejected base64 avatar upload');
        return res.json({
          success: false,
          error: 'Please upload avatar through the proper upload system.'
        });
      } else {
        req.user.avatar = new_avatar; // Allow other valid URLs
      }
    }

    await saveDocumentWithRetry(req.user);
    const userId = req.user._id.toString();
    const cacheKey = `user_${userId}`;
    if (userCache.has(cacheKey)) {
      userCache.delete(cacheKey);
      console.log(`✅ Invalidated cache for user: ${userId}`);
    }
    return res.json({ success: true });
  } catch (error) {
    console.error("Error in /changePasswordAndAvatar:", error);
    return res.json({ success: false, error: error.message || error });
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
    // Update user status
    req.user.status = 'off';

    // Save with proper error handling
    await saveDocumentWithRetry(req.user);

    res.json({
      success: true,
      message: 'Successfully logged out!'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete logout process'
    });
  }
});

module.exports = router;
