const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const auth = require('../middleware/auth');
const cron = require('node-cron');

// User Model
const User = require('../model/User');
const SystemSetting = require('../model/SystemSetting');

router.get('/', async (req, res) => {
  try {
    const settings = await SystemSetting.find({});

    const result = {};
    for (setting of settings) {
        result[setting.name] = setting.value;
    }
    res.json({
      success: true,
      settings: result,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/', auth, async (req, res) => {
    try {
      const settings = req.body.settings;
      for (setting of settings) {
          const s = await SystemSetting.findOne({name: setting.name});
          if (s) {
              s.value = setting.value;
              s.save();
          } else {
              const new_setting = new SystemSetting({name: setting.name, value: setting.value});
              new_setting.save();
          }
      }
  
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
