const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
const gravatar = require('gravatar');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');

// User Model
const User = require('../model/User');

router.get('/', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  try {
    const users = await User.find({}, { _id: 1, username: 1, email: 1, created_at: 1 })
      .sort({date: 'desc'})
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await User.countDocuments({is_admin: false});

    let result = [];
    
    users.forEach((user, index) => {
      let temp = {
        _id : user['_id'],
        username : user['username'],
        email : user['email'],
        date : moment(user['created_at']).format('YYYY-MM-DD')
      }
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

router.post('/', async (req, res) => {
  const { username, email, password, bio, avatar } = req.body;

  // Simple validation
  if (!username || !email || !password) {
    return res.json({
      success: false,
      error: 'Please enter all fields'
    });
  }

  // Check for existing user
  let user = await User.findOne({ email });

  if (user)
    return res.json({
      success: false,
      error: 'Email already exists'
    });

  user = await User.findOne({ username: email });

  if (user)
    return res.json({
      success: false,
      error: 'Username already exists'
    });

  const newUser = new User({
    username,
    email,
    password,
    bio,
    balance: 0,
    status: 'off',
    avatar
  });

  // Create salt & hash
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then(user => {
        jwt.sign({ user: user, is_admin: 0 }, process.env.SECRET_OR_KEY, (err, token) => {
          sendgrid.sendWelcomeEmail(email, username);

          res.json({
            success: true,
            message: 'new user created',
            token,
            user
          });
        });
      });
    });
  });
});

router.post('/get-info', async (req, res) => {
  try {
    const user = await User.findOne({_id: req.body._id});

    res.json({
      success: true,
      query: req.query,
      user: user,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

router.post('/updateCustomer', auth, async (req, res) => {
  try {
    const user = await User.findOne({_id: req.body._id});
    user.balance = req.body.balance * 100;
    await user.save();

    res.json({
      success: true,
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
