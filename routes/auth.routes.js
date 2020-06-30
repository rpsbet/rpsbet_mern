/* eslint-disable consistent-return */
/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = express.Router();
const bcrypt = require('bcryptjs');
// User Model
const jwt = require('jsonwebtoken');
const User = require('../model/User');
const Message = require('../model/Message');
const ChangePasswordRequest = require('../model/ChangePasswordRequest');

const auth = require('../middleware/auth');
const sendgrid = require('../helper/sendgrid');

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
  User.findOne({ email }).then(user => {
    if (!user)
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
            message: 'User logged in',
            token,
            user
          });
        }
      );
    });
  });
});

// @route   GET api/auth/user
// @desc    Get user data
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      to: req.user,
      is_read: false
    });

    res.json({
      success: true,
      message: 'User has been authenticated',
      user: req.user,
      unread_message_count: count
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

router.post('/sendResetPasswordEmail', async (req, res) => {
  try {
    User.findOne({ email: req.body.email }).then(async user => {
      if (!user)
        return res.json({
          success: false,
          error: 'Email does not exist in our database'
        });

      const request = new ChangePasswordRequest({ user: user });
      await request.save();
      
      sendgrid.sendResetPasswordEmail(user.email, user.username, request._id + '-' + user._id);

      return res.json({
        success: true,
      });
    });

  } catch (error) {
    res.json({ success: false, error });
  }
});

router.post('/resetPassword', async (req, res) => {
  try {
    const params = req.body.params.split('-');
    if (params.length !== 2) {
      return res.json({
        success: false,
        error: 'Invalid Params'
      });
    }
    console.log(1);

    const request = await ChangePasswordRequest.findOne({_id: params[0]})
            .populate({path: 'user', model: User});
    console.log(request);

    if (request.user._id != params[1]) {
      return res.json({
        success: false,
        error: 'Invalid Params'
      });
    }

    console.log(123123123);

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(req.body.password, salt, (err, hash) => {
        if (err) throw err;
        request.user.password = hash;
        request.user.save();
        return res.json({
          success: true,
        });
      });
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
      message: 'User has been logged out'
    });
  } catch (error) {
    res.json({ success: false, error });
  }
});

module.exports = router;
