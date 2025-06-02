const express = require('express');
const axios = require('axios');

const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const socket = require('../socketController');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
// User Model
const User = require('../model/User');
const Transaction = require('../model/Transaction');
const Notification = require('../model/Notification');
const GameLog = require('../model/GameLog');
const Room = require('../model/Room');

router.get('/activity', admin, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  try {
    const transactions = await Transaction.find({})
      .populate({ path: 'user', model: User })
      .sort({ created_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await Transaction.countDocuments({});

    let result = [];

    transactions.forEach((transaction, index) => {
      let temp = {
        _id: transaction['_id'],
        username: transaction['user']['username'],
        description: transaction['description'],
        amount: transaction['amount'],
        created_at: moment(transaction['created_at']).format(
          'YYYY-MM-DD hh:mm:ss'
        )
      };
      result.push(temp);
    });

    res.json({
      success: true,
      query: req.query,
      total: count,
      activities: result,
      pages: Math.ceil(count / pagination)
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

// new user
router.post('/', async (req, res) => {
  try {
    const { username, password, bio, avatar, referralCode, avatarMethod, recaptchaToken } = req.body;

    // Check if username contains bad language
    if (containsBadLanguage(username)) {
      return res.json({
        success: false,
        error: 'USERNAME CONTAINS RESERVED WORDS'
      });
    }

    // Validate reCAPTCHA
    const secretKey = '6Lfto1EpAAAAAEOO1gb-uSsqMmkVDjcoJRHClm28';
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${recaptchaToken}`,
    });
    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.json({
        success: false,
        error: 'reCAPTCHA verification failed. Please try again.',
      });
    }
    // Simple validation
    if (!username || !password) {
      return res.json({
        success: false,
        error: 'PLEASE ENTER ALL FIELDS'
      });
    }

    const lowerCaseUsername = username.toLowerCase(); // Convert username to lowercase

    // Check if username already exists (case-insensitive)
    const existingUser = await User.findOne({ username: { $regex: new RegExp('^' + lowerCaseUsername, 'i') } });
    if (existingUser) {
      return res.json({
        success: false,
        error: 'USERNAME ALREADY EXISTS'
      });
    }

    // Generate referral code
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

    // Find the owner of the referral code, if it exists
    let referralOwner = null;
    if (referralCode) {
      referralOwner = await User.findOne({ referralCode });
    }

    const newUser = new User({
      username,
      password,
      bio,
      totalWagered: 0,
      totalTraded: 0,
      balance: 0,
      rewards: [],
      credit_score: 1000,
      ai_mode: 'Markov',
      status: 'off',
      avatar: '',
      referralCode: generateReferralCode(),
      referralUsername: referralOwner ? referralOwner._id : null
    });

    // Create salt & hash
    bcrypt.genSalt(10, (err, salt) => {
      if (err) throw err;
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) throw err;
        newUser.password = hash;
        await newUser.save();

        // If there is a referral owner, send notification to reffal owner
        if (referralOwner) {
          referralOwner.rewards.push({ user: newUser._id, amount: 0 });
          await referralOwner.save();

          const notificationData = {
            _id: newUser._id,
            message: `Thanks for referring me! You will now receive 5% from my deposits.`,
            username: newUser.username,
            avatar: newUser.avatar,
            accessory: '',
            elite: '',
            room: '',
            rank: 0,
            created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            created_at_str: moment(new Date()).format('LLL'),
            updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            is_read: false
          };

          socket.sendNotification(referralOwner._id, notificationData);

        }

        jwt.sign(
          { user: newUser, is_admin: 0 },
          process.env.SECRET_OR_KEY,
          (err, token) => {
            res.json({
              success: true,
              message: 'new user created',
              token,
              user: newUser
            });
          }
        );
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL SERVER ERROR'
    });
  }
});


verifyRecaptcha = async (token) => {
  const secretKey = '6Lfto1EpAAAAAEOO1gb-uSsqMmkVDjcoJRHClm28';
  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `secret=${secretKey}&response=${token}`,
  });
  const data = await response.json();
  return data.success;
};


function containsBadLanguage(username) {
  const explicitWords = ['admin', 'ADMIN', 'RPSGAME', 'catsino.fun', 'rpsdotgame', 'system', 'support', 'BOT', 'B0T', 'bot', 'BoT'];
  const lowercasedUsername = username.toLowerCase();

  return explicitWords.some((word) => lowercasedUsername.includes(word));
};

router.post('/username', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { newUsername } = req.body;

    if (!newUsername || newUsername.trim() === '') {
      return res.json({
        success: false,
        error: 'NEW USERNAME CANNOT BE BLANK.'
      });
    }

    if (containsBadLanguage(newUsername)) {
      return res.json({
        success: false,
        error: 'USERNAME CONTAINS RESERVED WORDS'
      });
    }


    const existingUser = await User.findOne({ username: newUsername });

    if (existingUser) {
      return res.json({
        success: false,
        error: 'ERROR CODE 69 420'
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.json({
        success: false,
        error: 'User not found.'
      });
    }

    user.username = newUsername;
    await user.save();
    res.json({
      success: true,
      message: 'USERNAME CHANGED SUCCESSFULLY.<br /><br />REFRESH TO SEE CHANGES...RAWRR. 🐈'
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

router.get('/vault-transactions', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.json({ success: false, error: 'NO USER FOUND' });
    }

    const transactions = await Transaction.find({
      user: userId,
      description: /vault/i // Regular expression to match descriptions containing the word 'vault'
    })
      .sort({ createdAt: -1 }) // Sort by creation date in descending order
      .limit(10); // Limit the results to the most recent 10 transactions

    res.json({
      success: true,
      transactions
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

router.post('/deposit', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const balance = req.user.balance;
    const { amount } = req.body;

    if (!userId) {
      return res.json({ success: false, error: 'NO USER FOUND' });
    }

    // 1. Check if user is already in the middle of a withdrawal
    if (req.user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'TOO FAST',
        betResult: -100
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.json({ success: false, error: 'INVALID AMOUNT' });
    }

    if (parsedAmount > balance) {
      return res.json({ success: false, error: 'NOT ENOUGH FUNDS' });
    }

    req.user.balance -= parsedAmount;

    let vault = await Vault.findOne({ user: userId });

    if (!vault) {
      // If no vault exists, create a new one
      vault = new Vault({
        user: userId,
        balance: 0 // Start with zero balance and then add the deposited amount
      });
    }

    vault.balance += parsedAmount;
    const newTransaction = new Transaction({
      user: userId,
      amount: -parsedAmount,
      description: `vault deposit`,
      room: ''
    });

    const notification = new Notification({
      from: userId,
      to: userId,
      room: '',
      amount: -parsedAmount,
      message: `You deposited into your vault`
    });

    const notificationData = {
      message: notification.message,
      username: req.user.username,
      avatar: req.user.avatar,
      amount: -parsedAmount,
      accessory: req.user.accessory,
      elite: req.user.elite,
      rank: req.user.totalWagered,
      created_at: new Date(),
      created_at_str: new Date().toISOString(),
      updated_at: new Date(),
      is_read: false
    };

    // Save all documents and update user balance
    await saveDocumentWithRetry(req.user);
    await saveDocumentWithRetry(vault);
    await saveDocumentWithRetry(newTransaction);
    await saveDocumentWithRetry(notification);

    // Send notification via socket
    socket.sendNotification(userId, notificationData);

    res.json({
      success: true,
      message: 'FUNDS ADDED TO VAULT',
      newBalance: req.user.balance,
      newTransaction: newTransaction,
      vaultBalance: vault.balance
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

router.post('/withdraw', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!userId) {
      return res.json({ success: false, error: 'NO USER FOUND' });
    }

    // 2. Check if user is already in the middle of a withdrawal
    if (req.user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'TOO FAST',
        betResult: -100
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.json({ success: false, error: 'INVALID AMOUNT' });
    }

    const vault = await Vault.findOne({ user: userId });
    if (!vault) {
      return res.json({ success: false, error: 'VAULT NOT FOUND' });
    }

    if (parsedAmount > vault.balance) {
      return res.json({ success: false, error: 'NOT ENOUGH FUNDS IN VAULT' });
    }

    vault.balance -= parsedAmount;
    req.user.balance += parsedAmount;

    const newTransaction = new Transaction({
      user: userId,
      amount: parsedAmount,
      description: `vault withdrawal`,
      room: ''
    });

    const notification = new Notification({
      from: userId,
      to: userId,
      room: '',
      amount: parsedAmount,
      message: `You withdrew from your vault`
    });

    const notificationData = {
      message: notification.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      amount: parsedAmount,
      rank: req.user.totalWagered,
      created_at: new Date(),
      created_at_str: new Date().toISOString(),
      updated_at: new Date(),
      is_read: false
    };

    await saveDocumentWithRetry(req.user);
    await saveDocumentWithRetry(vault);
    await saveDocumentWithRetry(newTransaction);
    await saveDocumentWithRetry(notification);

    socket.sendNotification(userId, notificationData);

    res.json({
      success: true,
      message: 'FUNDS WITHDRAWN FROM VAULT',
      newBalance: req.user.balance,
      newTransaction: newTransaction,
      vaultBalance: vault.balance
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});


router.post('/withdraw', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!userId) {
      return res.json({ success: false, error: 'NO USER FOUND' });
    }

    if (req.user.isWithdrawing) {
      return res.json({
        success: false,
        error: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.'
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'TOO FAST',
        betResult: -100
      });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.json({ success: false, error: 'INVALID AMOUNT' });
    }

    const vault = await Vault.findOne({ user: userId });
    if (!vault) {
      return res.json({ success: false, error: 'VAULT NOT FOUND' });
    }

    if (parsedAmount > vault.balance) {
      return res.json({ success: false, error: 'NOT ENOUGH FUNDS IN VAULT' });
    }

    vault.balance -= parsedAmount;
    req.user.balance += parsedAmount;

    const newTransaction = new Transaction({
      user: userId,
      amount: parsedAmount,
      description: `vault withdrawal`,
      room: ''
    });

    const notification = new Notification({
      from: userId,
      to: userId,
      room: '',
      amount: parsedAmount,
      message: `You withdrew from your vault`
    });

    const notificationData = {
      message: notification.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      elite: req.user.elite,
      amount: parsedAmount,
      rank: req.user.totalWagered,
      created_at: new Date(),
      created_at_str: new Date().toISOString(),
      updated_at: new Date(),
      is_read: false
    };

    await saveDocumentWithRetry(req.user);
    await saveDocumentWithRetry(vault);
    await saveDocumentWithRetry(newTransaction);
    await saveDocumentWithRetry(notification);

    socket.sendNotification(userId, notificationData);

    res.json({
      success: true,
      message: 'FUNDS WITHDRAWN FROM VAULT',
      newBalance: req.user.balance,
      newTransaction: newTransaction,
      vaultBalance: vault.balance
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});


router.get('/vault', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.json({ success: false, error: 'NO USER FOUND' });
    }

    const vault = await Vault.findOne({ user: userId });
    res.json({
      success: true,
      vaultBalance: vault ? vault.balance : 0
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, error: err.message });
  }
});

router.post('/bio', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have a user object in req from the auth middleware
    const { link } = req.body;
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.json({
        success: false,
        error: 'User not found.'
      });
    }

    user.bio = link;
    await saveDocumentWithRetry(user);

    // Respond with success message
    res.json({
      success: true,
      message: 'BIO UPDATED SUCCESSFULLY 🐈'
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

router.post('/get-info', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body._id });

    if (!user) {
      return res.json({
        success: false,
        message: 'User not found'
      });
    }

    const userCopy = user.toObject();

    delete userCopy.email;
    delete userCopy.password;
    delete userCopy.balance;

    res.json({
      success: true,
      query: req.query,
      user: userCopy
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: 'An error occurred'
    });
  }
});

router.post('/getId', admin, async (req, res) => {
  try {
    const userId = await User.findOne({ username: req.body.username }, { _id: 1 });
    if (!userId) {
      return res.json({
        success: true,
        query: req.query,
        user: null,
      });
    }

    res.json({
      success: true,
      query: req.query,
      user: userId._id, // Return the _id value directly
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message,
    });
  }
});


const bonusNumbers = [0.04, 0, 0.01, 0.03, 0.3, 0, 0.2, 0.1, 0.05, 0.02];

router.post('/add-bonus', auth, async (req, res) => {
  try {
    const { user } = req;
    const lastBonus = user.last_bonus ? new Date(user.last_bonus) : null;
    const now = new Date();

    // Check if a withdrawal is in progress
    if (req.user.isWithdrawing) {
      console.error('Bonus claim failed: Withdrawal in progress.');
      return res.status(400).json({
        success: false,
        message: 'WITHDRAWAL IN PROGRESS. Please wait until it completes.',
      });
    }

    // Check if the bonus cooldown period has passed
    if (lastBonus && now - lastBonus <= 6 * 60 * 60 * 1000) {
      console.error('Bonus claim failed: Cooldown period not over.');
      return res.status(400).json({
        success: false,
        message: 'Bonus can only be claimed once every 6 hours.',
      });
    }

    // Check if the user has wagered enough
    if (user.totalWagered <= 0.01) {
      console.error('Bonus claim failed: Insufficient total wagered.');
      return res.status(400).json({
        success: false,
        message: 'Total wagered must be more than 20000 to claim bonus.',
      });
    }

    // Check if the user has enough balance for the deduction
    const deduction = 0.01;
    if (user.balance < deduction) {
      console.error('Bonus claim failed: Insufficient balance.');
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance to claim the bonus.',
      });
    }

    // Deduct balance and update last bonus timestamp
    user.balance -= deduction;
    user.last_bonus = Date.now();

    const deductionTransaction = new Transaction({
      user: user._id,
      amount: -deduction,
      description: `Bonus claim deduction`,
      room: '',
    });

    await saveDocumentWithRetry(deductionTransaction);

    // Define weights inversely proportional to the bonus values (higher weight for smaller numbers)
    const weights = bonusNumbers.map(num => {
      if (num === 0) return 10; // High weight for 0
      return 1 / (num + 0.01); // Inverse weight for non-zero numbers, add 0.01 to avoid division by zero
    });

    // Normalize weights to sum to 1
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const normalizedWeights = weights.map(w => w / totalWeight);

    // Select a random bonus amount using weighted random selection
    let randomValue = Math.random();
    let cumulativeWeight = 0;
    let randomIndex = 0;

    for (let i = 0; i < normalizedWeights.length; i++) {
      cumulativeWeight += normalizedWeights[i];
      if (randomValue <= cumulativeWeight) {
        randomIndex = i;
        break;
      }
    }

    const number = bonusNumbers[randomIndex];
    if (number === 0) {
      await saveDocumentWithRetry(user);
      return res.json({
        success: true,
        amount: 0,
        message: 'No bonus was added, better luck next time!',
      });
    }

    // Add bonus to user balance
    user.balance += number;

    const newTransaction = new Transaction({
      user: user._id,
      amount: number,
      description: `Bonus added`,
      room: '',
    });

    const notificationJ = new Notification({
      from: user._id,
      to: user._id,
      room: '',
      amount: number,
      message: `You received a bonus`,
    });

    const notificationData = {
      message: `You received a bonus`,
      username: user.username,
      avatar: user.avatar,
      accessory: user.accessory,
      elite: user.elite,
      amount: number,
      rank: user.totalWagered,
      created_at: new Date(),
      created_at_str: new Date().toISOString(),
      updated_at: new Date(),
      is_read: false,
    };

    await saveDocumentWithRetry(user);
    await saveDocumentWithRetry(newTransaction);
    await saveDocumentWithRetry(notificationJ);

    socket.sendNotification(user._id, notificationData);

    res.json({
      success: true,
      amount: number,
    });
  } catch (err) {
    console.error('Error in /add-bonus route:', err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
    });
  }
});

router.get('/location', async (req, res) => {
  try {
    const response = await axios.get('https://ipapi.co/json/');
    res.json({ success: true, location: response.data });
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch location' });
  }
});

module.exports = router;
