const express = require('express');
const fetch = require('node-fetch');

const router = express.Router();
const bcrypt = require('bcryptjs');
const jdenticon = require('jdenticon');
const crypto = require('crypto');
const robohashAvatars = require("robohash-avatars");
const jwt = require('jsonwebtoken');
const moment = require('moment');
const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');
const admin = require('../middleware/admin');
const socket = require('../socketController');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const convertToCurrency = require('../helper/util/conversion');

// User Model
const User = require('../model/User');
const Transaction = require('../model/Transaction');
const Vault = require('../model/Vault');
const Notification = require('../model/Notification');
const GameLog = require('../model/GameLog');
const Room = require('../model/Room');

router.get('/', admin, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const is_banned = req.query.is_banned;
  try {
    const users = await User.find(
      { is_deleted: is_banned },
      { _id: 1, username: 1, created_at: 1, rewards: 1 }
    )
      .sort({ created_at: 'desc' })
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await User.countDocuments({ is_deleted: is_banned });

    let result = [];
    users.forEach((user, index) => {
      let temp = {
        _id: user['_id'],
        username: user['username'],
        // email: user['email'],
        rewards: user['rewards'],
        date: moment(user['created_at']).format('YYYY-MM-DD')
      };
      result.push(temp);
    });
    res.json({
      success: true,
      query: req.query,
      total: count,
      users: result,
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
        error: 'SEND A PICTURE OF YOUR ID TO SUPPORT SO WE CAN VERIFY YOUR PASS FOR THESE WORDS'
      });
    }

    if (containsBot(username)) {
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

    function generateAvatar(userId, avatarMethod) {
      if (avatarMethod === 'robohash') {
        // if robohash avatar style is chosen with a random background
        const avatarURL = robohashAvatars.generateAvatar({
          username: userId,
          background: robohashAvatars.BackgroundSets.RandomBackground1,
          characters: robohashAvatars.CharacterSets.Kittens,
        });
        return avatarURL;
      } else {
        // if jdenticon is chosen
        const hash = crypto.createHash('sha256').update(userId).digest('hex');
        const svg = jdenticon.toSvg(hash, 64, { padding: 0 });
        const encodedSvg = encodeURIComponent(svg);
        return `data:image/svg+xml,${encodedSvg}`;
      }
    }

    const newUser = new User({
      username,
      password,
      bio,
      totalWagered: 0,
      balance: 0,
      rewards: [],
      credit_score: 1000,
      ai_mode: 'Random',
      status: 'off',
      avatar,
      referralCode: generateReferralCode(),
      referralId: referralOwner ? referralOwner._id : null
    });

    // Generate avatar based on the chosen method
    newUser.avatar = generateAvatar(username, avatarMethod);

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
            // sendgrid.sendWelcomeEmail(email, username, verification_code);
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
  const explicitWords = ['nigger', 'nigga', 'nigg3r', 'n1gger', 'coon', 'c00n', 'paki', 'chink', 'ni99er'];
  const lowercasedUsername = username.toLowerCase();

  return explicitWords.some((word) => lowercasedUsername.includes(word));
};

function containsBot(username) {
  const explicitWords = ['BOT', 'B0T', 'bot', 'BoT', 'Admin', 'support'];
  const lowercasedUsername = username.toLowerCase();

  return explicitWords.some((word) => lowercasedUsername.includes(word));
};

router.post('/username', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have a user object in req from the auth middleware
    const { newUsername } = req.body;

    // Your logic to check for a valid new username
    if (!newUsername || newUsername.trim() === '') {
      return res.json({
        success: false,
        error: 'NEW USERNAME CANNOT BE BLANK.'
      });
    }

    // Check if username contains bad language
    if (containsBadLanguage(newUsername)) {
      return res.json({
        success: false,
        error: 'SEND A PICTURE OF YOUR ID TO SUPPORT SO WE CAN VERIFY YOUR PASS FOR THESE WORDS'
      });
    }

    if (containsBot(newUsername)) {
      return res.json({
        success: false,
        error: 'USERNAME CONTAINS RESERVED WORDS'
      });
    }


    const existingUser = await User.findOne({ username: newUsername });

    // Check if the username is already taken
    if (existingUser) {
      return res.json({
        success: false,
        error: 'ERROR CODE 69 420'
      });
    }

    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.json({
        success: false,
        error: 'User not found.'
      });
    }

    // Update the username
    user.username = newUsername;

    // Save the updated user
    await user.save();

    // Respond with success message
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
        balance: 0 // Start with zero balance and add the deposited amount
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
      message: `You deposited ${convertToCurrency(parsedAmount)} into your vault`
    });

    const notificationData = {
      message: notification.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
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
      message: `You withdrew ${convertToCurrency(parsedAmount)} from your vault`
    });

    const notificationData = {
      message: notification.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
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
    if (!vault) {
      return res.json({ success: false, error: 'VAULT NOT FOUND' });
    }

    res.json({
      success: true,
      vaultBalance: vault.balance
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
    // Find the user based on _id
    const user = await User.findOne({ _id: req.body._id });

    // Check if user is found
    if (!user) {
      return res.json({
        success: false,
        message: 'User not found'
      });
    }

    // Create a copy of the user object to avoid mutating the original
    const userCopy = user.toObject();

    // Remove sensitive fields from the userCopy object
    delete userCopy.email;
    delete userCopy.password;

    // Send the response with the filtered user data
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

const bonusNumbers = [1.25, 0.20, 0.10, 0.4, 2.50, 1, 0.50, 1.5, 5, 2];

// Route to add bonus
router.post('/add-bonus', auth, async (req, res) => {
  try {
    const { user } = req;
    const lastBonus = user.last_bonus ? new Date(user.last_bonus) : null;
    const now = new Date();

    if (lastBonus && now - lastBonus <= 6 * 60 * 60 * 1000) {
      return res.status(400).json({ message: 'Bonus can only be claimed once every 6 hours.' });
    }

    if (user.totalWagered <= 2500) {
      return res.status(400).json({ message: 'Total wagered must be more than 2500 to claim bonus.' });
    }

    const randomIndex = Math.floor(Math.random() * bonusNumbers.length);
    const number = bonusNumbers[randomIndex];

    if (number > 5) {
      number -= 99999;
    }

    user.balance += number;
    user.last_bonus = Date.now();

    const newTransaction = new Transaction({
      user: user._id,
      amount: number,
      description: `Bonus added: ${number}`,
      room: ''
    });

    let notificationJ = new Notification({
      from: user._id,
      to: user._id,
      room: '',
      message: `You received a bonus of ${convertToCurrency(number)}`
    });

    const notificationData = {
      message: `You received a bonus of ${convertToCurrency(number)}`,
      username: user.username,
      avatar: user.avatar,
      accessory: user.accessory,
      rank: user.totalWagered,
      created_at: new Date(),
      created_at_str: new Date().toISOString(),
      updated_at: new Date(),
      is_read: false
    };

    await saveDocumentWithRetry(user);
    await saveDocumentWithRetry(newTransaction);
    await saveDocumentWithRetry(notificationJ);

    socket.sendNotification(user._id, notificationData);

    res.json({
      success: true,
      amount: number
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request.',
    });
  }
});


router.post('/updateCustomer', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body._id });
    if (req.body.balance) {
      user.balance = req.body.balance;
    }

    if (req.body.is_deleted === true || req.body.is_deleted === false) {
      user.is_deleted = req.body.is_deleted;
    }
    await user.save();

    res.json({
      success: true
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
