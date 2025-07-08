const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const auth = require('../middleware/auth');
const cron = require('node-cron');

// User Model
const User = require('../model/User');
const SystemSetting = require('../model/SystemSetting');

// Bet simulation controller
let betSimulator = null;

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

// Bet Simulation Control Endpoints
router.post('/simulation/start', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can control bet simulation'
      });
    }

    const { BetSimulator } = require('../helper/util/betSimulationCron');
    
    if (!betSimulator) {
      betSimulator = new BetSimulator(req.io);
    }

    if (betSimulator.isRunning) {
      return res.json({
        success: false,
        message: 'Bet simulation is already running'
      });
    }

    betSimulator.start();
    
    res.json({
      success: true,
      message: 'Bet simulation started',
      stats: betSimulator.getStats()
    });
  } catch (error) {
    console.error('Error starting bet simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start bet simulation'
    });
  }
});

router.post('/simulation/stop', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can control bet simulation'
      });
    }

    if (!betSimulator || !betSimulator.isRunning) {
      return res.json({
        success: false,
        message: 'Bet simulation is not running'
      });
    }

    betSimulator.stop();
    
    res.json({
      success: true,
      message: 'Bet simulation stopped',
      stats: betSimulator.getStats()
    });
  } catch (error) {
    console.error('Error stopping bet simulation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop bet simulation'
    });
  }
});

router.get('/simulation/status', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can view simulation status'
      });
    }

    const stats = betSimulator ? betSimulator.getStats() : {
      isRunning: false,
      simulationCount: 0,
      startTime: null
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error getting simulation status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get simulation status'
    });
  }
});

// Store reference to simulator when it's initialized
router.setSimulator = (simulator) => {
  betSimulator = simulator;
};

module.exports = router;
