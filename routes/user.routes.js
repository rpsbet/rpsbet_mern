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
const Transaction = require('../model/Transaction');

router.get('/', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const is_banned = req.query.is_banned;
  try {
    const users = await User.find({is_deleted: is_banned}, { _id: 1, username: 1, email: 1, created_at: 1 })
      .sort({date: 'desc'})
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await User.countDocuments({is_deleted: is_banned});

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

router.get('/activity', auth, async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  try {
    const transactions = await Transaction.find({})
      .populate({path: 'user', model: User})
      .sort({created_at: 'desc'})
      .skip(pagination * page - pagination)
      .limit(pagination);
    const count = await Transaction.countDocuments({});

    let result = [];

    transactions.forEach((transaction, index) => {
      let temp = {
        _id : transaction['_id'],
        username : transaction['user']['username'],
        description: transaction['description'],
        amount: transaction['amount'],
        created_at: moment(transaction['created_at']).format('YYYY-MM-DD hh:mm:ss')
      }
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

  user = await User.findOne({ username });

  if (user)
    return res.json({
      success: false,
      error: 'Username already exists'
    });

  const verification_code = Math.floor(Math.random() * 8999) + 1000;

  const newUser = new User({
    username,
    email,
    password,
    bio,
    balance: 0,
    status: 'off',
    avatar,
    verification_code
  });

  // Create salt & hash
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      newUser.save().then(user => {
        jwt.sign({ user: user, is_admin: 0 }, process.env.SECRET_OR_KEY, (err, token) => {
          sendgrid.sendWelcomeEmail(email, username, verification_code);

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
    if (req.body.balance) {
      user.balance = req.body.balance * 100;
    }

    if (req.body.is_deleted === true || req.body.is_deleted === false) {
      user.is_deleted = req.body.is_deleted;
    }

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
