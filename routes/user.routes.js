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

// User Model
const User = require('../model/User');
const Transaction = require('../model/Transaction');
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
router.post('/', async (req, res) => {
  try {
    const { username, password, bio, avatar, referralCode, avatarMethod, recaptchaToken } = req.body;

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
        error: 'PLEASE FILL IN ALL THE FIELDS'
      });
    }

    // Check if username already exists
    const existingUser = await User.findOne({ username });
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
      rewards: 0,
      credit_score: 1000,
      ai_mode: 'Markov',
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

        // If there is a referral owner, update their balance
        if (referralOwner) {
          referralOwner.balance += 0;
          referralOwner.rewards += 1;
          await referralOwner.save();
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
  

router.post('/username', auth, async (req, res) => {
  try {
    const userId = req.user.id; // Assuming you have a user object in req from the auth middleware
    const { newUsername } = req.body;

    // Your logic to check for a valid new username
    if (!newUsername || newUsername.trim() === '') {
      return res.json({
        success: false,
        error: 'New username cannot be blank.'
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

router.post('/get-info', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.body._id });
    res.json({
      success: true,
      query: req.query,
      user: user
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});
router.post('/getId', admin, async (req, res) => {
  try {
    const userId = await User.findOne({ username: req.body.username }, { _id: 1 });
    // console.log("userId", userId);
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
