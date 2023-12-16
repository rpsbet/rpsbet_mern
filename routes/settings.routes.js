const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const auth = require('../middleware/auth');
const cron = require('node-cron');

// User Model
const User = require('../model/User');
const SystemSetting = require('../model/SystemSetting');
const Jukebox = require('../model/Jukebox');

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
      err: message
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

router.post('/add-to-queue', async (req, res) => {
  const { videoId, title, totalDuration } = req.body;
  try {
    if (totalDuration > 10) {
      const newVideo = new Jukebox({
        videoId,
        title,
        totalDuration
      });

      const savedVideo = await newVideo.save();
      res.json(savedVideo);
    } else {
      // Respond with an error if the video duration is less than or equal to 10 seconds
      res.status(400).json({ error: 'Video duration must be more than 10 seconds.' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Unable to add video to the queue.' });
  }
});


router.get('/get-queue', async (req, res) => {
  try {
    const queue = await Jukebox.find().sort({ _id: 1 }); // Order by insertion time
    res.json(queue);
  } catch (error) {
    res.status(500).json({ error: 'Unable to retrieve the video queue.' });
  }
});

// route

cron.schedule('*/10 * * * * *', async () => {
  try {
    // Fetch the current video in the queue
    const currentVideo = await Jukebox.findOne({ /* Your query criteria for the current video */ });

    if (currentVideo) {
      // Calculate the new progress
      const newProgress = currentVideo.progress + 10;

      // Check if the progress exceeds the total duration
      if (newProgress > currentVideo.totalDuration) {
        // Remove the document if the progress exceeds the total duration
        await currentVideo.remove();
      } else {
        // Update the progress and save the document
        currentVideo.progress = newProgress;
        await currentVideo.save();
      }
    }
  } catch (error) {
    console.error('Error updating progress:', error);
  }
});



module.exports = router;
