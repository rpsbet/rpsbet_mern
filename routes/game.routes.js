const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();
const moment = require('moment');
const auth = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const Comment = require('../model/Comment');

const Item = require('../model/Item');
const User = require('../model/User');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const Strategy = require('../model/Strategy');
const GameLog = require('../model/GameLog');
const AttachedPlayer = require('../model/AttachedPlayer');
const Receipt = require('../model/Receipt');
const Message = require('../model/Message');
const Notification = require('../model/Notification');
const QBot = require('../model/QBot');
const Transaction = require('../model/Transaction');
const SystemSetting = require('../model/SystemSetting');
const RpsBetItem = require('../model/RpsBetItem');
const QsBetItem = require('../model/QsBetItem');
const { convertGameLogToHistoryStyle } = require('../helper/util/convertGameLogToHistoryStyle');
const avatarUtils = require('../helper/util/getRank');
const executeBet3 = require('../helper/util/betExecutor3');
const saveDocumentWithRetry = require('../helper/util/retrySave');
const check_access_time = require('../helper/util/checkAccessTime');
let semaphore2 = 1;
let semaphore3 = 1;
const roomLocks = {};
const multer = require('multer');
const FormData = require('form-data');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const axios = require('axios');

// Environment variables
const PINATA_JWT = process.env.PINATA_JWT;


let user_access_log = {};
router.get('/game_types', async (req, res) => {
  try {
    const excludedGameTypes = ['Roll', 'Bang!', 'Spleesh!', 'Blackjack', 'Drop Game', 'Mystery Box', 'Brain Game'];
    const gameTypes = await GameType.find({ game_type_name: { $nin: excludedGameTypes } }).sort({ created_at: 1 });
    res.json({
      success: true,
      query: req.query,
      gameTypeList: gameTypes
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message
    });
  }
});

router.get('/strategies', async (req, res) => {
  try {
    const excludedStrategies = ['Bush Mosteller', 'Random', 'Skill-issue-old'];
    const strategies = await Strategy.find({ name: { $nin: excludedStrategies } }).sort({ created_at: 1 });
    res.json({
      success: true,
      query: req.query,
      strategies: strategies
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message
    });
  }
});

router.get('/recently-closed', async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'finished', battles: { $gt: 0 } }) // Skip rooms where battles = 0
      .select('name battles bet_amount host_pr user_bet room_number image game_type created_at') // Select specific fields
      .populate({
        path: 'game_type',
        model: GameType,
        select: 'short_name game_type_name'
      })
      .sort({ created_at: -1 })
      .limit(20);

    if (rooms.length > 0) {
      res.json({
        success: true,
        rooms: rooms
      });
    } else {
      res.json({
        success: true,
        message: 'No recently closed rooms found.'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.post('/upload-to-pinata', upload.single('file'), async (req, res) => {
  console.log('=== POST /api/upload-to-pinata called ===');
  console.log("Request Headers:", req.headers);
  console.log("req.file:", req.file);

  try {
    // 1) Ensure a file is present
    if (!req.file) {
      console.error('No file uploaded.');
      return res.status(400).json({
        success: false,
        message: 'No file was provided in the "file" field.'
      });
    }

    // 2) Build form data for Pinata
    //    - req.file.buffer is the raw binary from Multer memoryStorage
    const formData = new FormData();
    formData.append('file', req.file.buffer, req.file.originalname || 'upload.png');

    // 3) Send POST request to Pinata
    //    - Use your JWT for the `Authorization: Bearer ...` header
    //    - `formData.getHeaders()` merges the correct Content-Type/boundary
    const pinataRes = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders()
      }
    });

    // 4) Check Pinata response
    if (pinataRes.status !== 200) {
      console.error('Pinata upload failed:', pinataRes.data);
      throw new Error('Pinata upload failed. Check logs.');
    }

    // 5) Extract IPFS hash and form an IPFS gateway URL
    const { IpfsHash } = pinataRes.data;
    const imageUrl = `https://gateway.pinata.cloud/ipfs/${IpfsHash}`;

    console.log('Pinata IPFS upload success:', IpfsHash);

    // 6) Send the URL back to the client
    return res.json({
      success: true,
      imageUrl
    });
  } catch (error) {
    console.error('Error uploading to Pinata:', error);
    return res.status(500).json({
      success: false,
      message: 'Error uploading to Pinata',
      error: error.message
    });
  }
});


router.patch('/range/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { newValue } = req.body;

  try {
    console.log("newValue", newValue)
    const user = await User.findByIdAndUpdate(user_id, { range: newValue }, { new: true });
    console.log("user", user)
    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }
    res.json({
      success: true,
      message: 'Successful!'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message
    });
  }
});

router.patch('/strategies/:user_id', async (req, res) => {
  const { user_id } = req.params;
  const { strategy } = req.body;

  try {
    const user = await User.findByIdAndUpdate(user_id, { ai_mode: strategy }, { new: true });

    if (!user) {
      return res.status(404).json({ success: false, message: 'user not found' });
    }

    res.json({
      success: true,
      message: 'Successful!'
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message
    });
  }
});

router.post('/detachPlayer/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;

  try {
    const room = await Room.findById(room_id);
    if (!room) {
      console.log('Room not found');
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const attachedPlayer = await AttachedPlayer.findOne({ room: room_id, user: user_id });
    if (!attachedPlayer) {
      console.log('Attached player not found');
      return res.status(404).json({ success: false, message: 'Attached player not found' });
    }

    await AttachedPlayer.deleteOne({ _id: attachedPlayer._id });

    res.json({
      success: true,
      message: 'Successfully detached from the room'
    });
  } catch (err) {
    console.error('Error detaching player from room:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.put('/updateAttachment/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;
  const { bet_amounts, selected_strategy } = req.body;

  try {
    const updatedAttachment = await AttachedPlayer.findOneAndUpdate(
      { user: user_id, room: room_id },
      { $set: { bet_amounts, selected_strategy, updated_at: Date.now() } },
      { new: true, runValidators: true }
    );

    if (updatedAttachment) {
      return res.json({
        success: true,
        message: 'Attachment updated successfully',
        updatedAttachment
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'No attachment found for this user and room'
      });
    }
  } catch (err) {
    console.error('Error updating attachment:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.get('/getattachedrooms', auth, async (req, res) => {
  const user_id = req.user._id;
  try {
    const attachments = await AttachedPlayer.find({ user: user_id });
    return res.json({
      success: true,
      attachments: attachments || [],
    });
  } catch (err) {
    console.error('Error finding attachments:', err.message);

    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message,
    });
  }
});


router.get('/checkAttachment/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;
  try {
    const existingAttachment = await AttachedPlayer.findOne({ user: user_id, room: room_id });

    if (existingAttachment) {
      return res.json({
        success: true,
        attached: true,
        message: 'User is already attached to this room',
        attachedPlayer: existingAttachment
      });
    } else {
      return res.json({
        success: true,
        attached: false,
        message: 'User is not attached to this room'
      });
    }
  } catch (err) {
    console.error('Error checking attachment:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});


router.patch('/attachPlayer/:room_id', auth, async (req, res) => {
  const { room_id } = req.params;
  const user_id = req.user._id;
  const ai_mode = req.user.ai_mode;
  const bet_amounts = req.body.bet_amounts;
  try {

    const room = await Room.findById(room_id).populate({ path: 'game_type', model: GameType });
    if (!room) {
      console.log('Room not found');
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
    }

    const newAttachedPlayer = new AttachedPlayer({
      user: user_id,
      room: room_id,
      room_name: room['game_type']['short_name'] + '-' + room['room_number'],
      selected_strategy: ai_mode,
      bet_amounts: bet_amounts
    });

    await newAttachedPlayer.save();

    res.json({
      success: true,
      message: 'Successfully attached to the room!',
    });
  } catch (err) {
    console.error('Error updating room:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.patch('/rooms/:room_id', async (req, res) => {
  const { room_id } = req.params;

  try {

    if (roomLocks[room_id]) {
      return res.status(409).json({ success: false, message: 'Room is currently being updated' });
    }

    roomLocks[room_id] = true;

    const room = await Room.findById(room_id);
    if (!room) {
      console.log('Room not found');
      delete roomLocks[room_id];
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    if (room.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
    }
    const findRandomBot = async () => {
      let attempts = 0;
      while (attempts < 6) {
        const randomBot = await User.aggregate([
          { $match: { username: { $regex: /BOT/i } } },
          { $sample: { size: 1 } }
        ]);
        const botId = randomBot[0]._id;

        if (!room.joiners.includes(botId)) {
          return botId;
        }
        attempts++;
      }
      throw new Error('No available bots found');
    };

    const botId = await findRandomBot();

    if (room.joiners.includes(botId)) {
      delete roomLocks[room_id];
      return res.status(400).json({
        success: false,
        message: 'Bot is already in the room'
      });
    }

    const updatedRoom = await Room.findByIdAndUpdate(
      room_id,
      { $push: { joiners: botId } },
      { new: true }
    );

    delete roomLocks[room_id];

    res.json({
      success: true,
      message: 'Bot joined the room successfully!',
      room: updatedRoom
    });
  } catch (err) {
    console.error('Error updating room:', err.message);
    delete roomLocks[room_id];
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});


router.patch('/rooms/:room_id/remove-bots', async (req, res) => {
  const { room_id } = req.params;
  const bots = [
    '65eafc72aea25957ac8ea60d',
    '65eafa5caea25957ac8ea60b',
    '62b9ef88a5409449f63f7ccb',
    '65eafb7daea25957ac8ea60c'
  ];

  try {
    roomLocks[room_id] = true;

    let room = await Room.findById(room_id);

    if (!room) {
      delete roomLocks[room_id];
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    room.status = 'waiting';
    await saveDocumentWithRetry(room);

    const removeAllMatchingBots = async () => {
      try {
        room = await Room.findById(room_id);

        if (!room) {
          throw new Error('Room not found');
        }

        const matchingBots = room.joiners.filter(joiner => bots.includes(joiner.toString()));

        if (matchingBots.length === 0) {
          if (room.status !== 'open') {
            room.status = 'open';
            await saveDocumentWithRetry(room);
          }
          return room;
        }

        room.joiners = room.joiners.filter(joiner => !bots.includes(joiner.toString()));

        room.status = 'open';
        await saveDocumentWithRetry(room);

        return room;
      } catch (err) {
        throw err;
      }
    };

    const updatedRoom = await removeAllMatchingBots();

    delete roomLocks[room_id];

    if (updatedRoom) {
      res.json({
        success: true,
        message: 'All matching bots removed from the room and room status updated!',
        room: updatedRoom
      });
    } else {
      res.json({
        success: true,
        message: 'No matching bots found in the room',
        room: room
      });
    }

  } catch (err) {
    console.error('Error removing bots from room:', err.message);
    delete roomLocks[room_id];
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.get('/rooms/:room_id/bots-count', async (req, res) => {
  const { room_id } = req.params;
  try {
    const room = await Room.findById(room_id);
    if (!room) {
      console.log('Room not found');
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    const findBots = async () => {
      const bots = await User.aggregate([
        { $match: { username: { $regex: /BOT/i } } },
        { $project: { _id: { $toString: '$_id' } } }
      ]);
      return bots.map(bot => bot._id);
    };

    const botIds = await findBots();
    const joinerIds = room.joiners.map(joiner => joiner.toString());
    const botCount = joinerIds.reduce((count, joinerId) => {
      if (botIds.includes(joinerId)) {
        count++;
      }
      return count;
    }, 0);

    res.json({
      success: true,
      botCount
    });
  } catch (err) {
    console.error('Error retrieving bot count:', err.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});

router.patch('/room/strategies/:room_id', async (req, res) => {
  const { room_id } = req.params;
  const { strategy } = req.body;

  try {
    const room = await Room.findByIdAndUpdate(room_id, { selectedStrategy: strategy }, { new: true });

    if (!room) {
      return res.status(404).json({ success: false, message: 'Room not found' });
    }

    res.json({
      success: true,
      message: 'Room strategy updated successfully!',
      room: room
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
});


router.post('/checkGamePassword', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.body.room_id });
    if (room.room_password === req.body.password) {
      res.json({
        success: true
      });
    } else {
      res.json({
        success: false,

      });
    }
  } catch (err) {
    res.json({
      success: false,
      err: message
    });
  }
});

router.patch('/room/:id/:type', auth, async (req, res) => {
  const { id, type } = req.params;
  if (!['like', 'dislike', 'view'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }
  const updateQuery =
    type === 'view'
      ? {
        $set: {
          views: { $concatArrays: ['$views', [req.user._id]] }
        }
      }
      : {
        $set: {
          [`${type}s`]: {
            $cond: [
              { $in: [req.user._id, `$${type}s`] },
              { $setDifference: [`$${type}s`, [req.user._id]] },
              { $concatArrays: [`$${type}s`, [req.user._id]] }
            ]
          }
        }
      };
  try {
    const room = await Room.findOneAndUpdate({ _id: id }, [updateQuery], {
      new: true
    });
    if (!room) {
      return res
        .status(404)
        .json({ success: false, message: 'Room not found' });
    }
    res.json({ success: true, message: 'Successful!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'joiners', model: User });
    let gameLogQuery = GameLog.find({ room: room })
      .sort({ created_at: 'desc' })
      .populate({ path: 'room', model: Room, select: '_id winnings selectedStrategy commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name game_type_name' })
      .populate({ path: 'creator', model: User, select: '_id avatar username accessory totalWagered' })
      .populate({ path: 'joined_user', model: User, select: '_id avatar username accessory totalWagered' });

    const limit = 3000;
    gameLogQuery = gameLogQuery.limit(limit);
    const totalGameLogsCount = 0;

    const gameLogList = await gameLogQuery;

    const creator = await User.findOne({ _id: room.creator });
    const joiners = await User.find({ _id: { $in: room.joiners } });

    const roomHistory = await convertGameLogToHistoryStyle(gameLogList);
    res.json({
      success: true,
      query: req.query,
      roomInfo: {
        _id: room['_id'],
        name: room['name'],
        image: room['image'],
        ticker: room['ticker'],
        x_link: room['x_link'],
        website_link: room['website_link'],
        telegram_link: room['telegram_link'],
        created_at: room['created_at'],
        creator_id: room['creator'],
        username: creator['username'],
        creator_avatar: creator['avatar'],
        rank: creator['totalWagered'],
        accessory: creator['accessory'],
        hosts: room.hosts.map(host => ({
          host: host['host'],
          username: host['username'],
          avatar: host['avatar'],
          rank: host['rank'],
          accessory: host['accessory'],
          stake: host['stake'],
          share: host['share']
        })),
        endgame_amount: room['endgame_amount'],
        endgame_type: room['endgame_type'],
        description: room['description'],
        joiners: joiners,
        game_type: room['game_type']['game_type_name'],
        bet_amount: parseFloat(room['bet_amount']),
        user_bet: parseFloat(room['user_bet']),
        host_pr: room['host_pr'],
        pr: room['pr'],
        user_bet: room['user_bet'],
        room_name: room['game_type']['short_name'] + '-' + room['room_number'],
        total_stakes: room.hosts.reduce((acc, host) => acc + host.stake, 0),
        qs_game_type: room['qs_game_type'],
        selectedStrategy: room['selectedStrategy'],
        qs_nation: room['qs_nation'],
        rps_game_type: room['rps_game_type'],
        qs_game_type: room['qs_game_type'],
        room_history: roomHistory,
        status: room['status'],
        is_private: room['is_private'],
        game_log_list: gameLogList.map(({ bet_amount }) => bet_amount)
      },
      totalGameLogsCount: totalGameLogsCount
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString()
    });
  }
});

// Define your route
router.get('/rpsbetitems/:roomId', auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const rpsBetItems = await RpsBetItem.find({
      room: roomId,
      joiner: req.user._id,
      joiner_rps: { $ne: null }
    })
      .sort({ created_at: -1 })
      .limit(50);

    res.json({
      success: true,
      data: rpsBetItems
    });
  } catch (err) {

    res.json({
      success: false,
      err: err
    });
  }
});

router.get('/qsbetitems/:roomId', auth, async (req, res) => {
  const { roomId } = req.params;
  try {
    const qsBetItems = await QsBetItem.find({
      room: roomId,
      joiner: req.user._id,
      joiner_qs: { $ne: null }
    })

      .sort({ created_at: -1 })
      .limit(50);
    res.json({
      success: true,
      data: qsBetItems
    });
  } catch (err) {

    res.json({
      success: false,
      err: err
    });
  }
});

// GET /api/comments/:room_id
router.get('/comments/:room_id', async (req, res) => {
  try {
    const room_id = req.params.room_id;
    const comments = await Comment.find({ room: room_id })
      .populate({ path: 'user', model: User })
      .select('_id accessory avatar username totalWagered content created_at')
      .sort({ created_at: -1 });
    res.json({
      success: true,
      comments: comments
    });
  } catch (err) {

    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/comments', auth, async (req, res) => {
  try {
    const { room_id, content } = req.body;
    room = await Room.findOne({ _id: room_id });

    let message = new Notification({
      from: req.user._id,
      to: room.creator,
      room: room_id,
      message: '',
      amount: 0,
      is_read: false
    });

    const truncatedContent = content.length > 10 ? content.substring(0, 10) + '...' : content;
    message.message = `${req.user.username} left a comment ${truncatedContent}`;

    const comment = new Comment({
      user: req.user._id,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      totalWagered: req.user.totalWagered,
      room: room_id,
      content: content
    });

    await saveDocumentWithRetry(comment);

    const newCommentData = {
      _id: comment._id,
      user: {
        _id: req.user._id,
        username: req.user.username,
        avatar: req.user.avatar,
        accessory: req.user.accessory,
        totalWagered: req.user.totalWagered
      },
      content: comment.content,
      created_at: comment.created_at,
      room: comment.room
    };
    req.io.sockets.emit('NEW_COMMENT', newCommentData);

    const notificationData = {
      message: message.message,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      room: room_id,
      amount: 0,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false
    };
    await saveDocumentWithRetry(message);
    socket.sendNotification(message.to, notificationData);

    res.json({
      success: true,
      comment: newCommentData
    });
  } catch (err) {
    console.error("Error creating comment:", err);
    res.json({
      success: false,
      err
    });
  }
});


router.delete('/comments/:comment_id', async (req, res) => {
  try {
    const commentId = req.params.comment_id;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    await Comment.findByIdAndDelete(commentId);

    req.io.sockets.emit('DELETE_COMMENT', { commentId });

    res.json({
      success: true,
      commentId,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.message,
    });
  }
});

router.get('/topWins', async (req, res) => {
  try {

    const recentGameLogs = await GameLog.find({})
      .sort({ created_at: -1 })
      .limit(4)
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id avatar username accessory totalWagered'
      });

    const topGameLogs = recentGameLogs
      .sort((a, b) => b.winnings - a.winnings)
      .slice(0, 4);


    res.json({
      success: true,
      pageSize: 4,
      history: topGameLogs
    });
  } catch (err) {
    console.error("Error in '/topWins' endpoint:", err);
    res.status(500).json({ message: 'Server Error' });
  }
});

router.get('/topWithdrawals', async (req, res) => {
  try {
    const topWds = await Receipt.find({ payment_type: { $regex: /Withdraw/i } })
      .sort({ amount: -1 })
      .populate({
        path: 'user_id',
        model: User,
        select: '_id avatar accessory totalWagered username'
      });

    const filteredWithdrawals = topWds
      .filter(withdrawal =>
        withdrawal.user_id &&
        !['OFFICIALRPSGAME', 'pimpedpistols', '69'].includes(withdrawal.user_id.username)
      );

    const sortedWithdrawals = filteredWithdrawals
      .map(withdrawal => ({
        ...withdrawal.toObject(),
        amount: Math.abs(withdrawal.amount)
      }))
      .slice(0, 4);

    res.json({
      success: true,
      pageSize: 4,
      history: sortedWithdrawals
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
});

const getHistory = async (pageSize, my_id, game_type) => {
  try {
    const id_condition = {};
    const game_type_condition = {};

    if (my_id) {
      id_condition['$or'] = [{ creator: my_id }, { joined_user: my_id }];
    }

    if (game_type !== 'All') {
      const gameType = await GameType.findOne({ short_name: game_type });
      game_type_condition.game_type = gameType._id;
    }

    const search_condition = { $and: [id_condition, game_type_condition] };

    const gameLogQuery = GameLog.find(search_condition)
      .sort({ created_at: 'desc' })
      .limit(pageSize)
      .populate({ path: 'room', model: Room, select: '_id winnings commission creator status ai_mode hosts room_number game_type bet_amount user_bet host_pr created_at' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name game_type_name' })
      .populate({ path: 'creator', model: User, select: '_id avatar accessory totalWagered' })
      .populate({ path: 'joined_user', model: User, select: '_id avatar accessory totalWagered' });
    const countQuery = GameLog.countDocuments(search_condition);

    const [gameLogList, count] = await Promise.all([gameLogQuery, countQuery]);

    const result = await convertGameLogToHistoryStyle(gameLogList);

    return {
      history: result,
      count,
      pageSize
    };
  } catch (err) {
    return false;
  }
};

const getRoomList = async (pageSize, game_type, excludeIds = []) => {
  const search_condition = { status: 'open', game_type: { $ne: null }, _id: { $nin: excludeIds } };

  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type }).select('_id');
    search_condition.game_type = gameType._id;
  }

  try {
    const preRooms = await Room.find(search_condition)
      .select('_id name selectedStrategy image description room_number creator battles username joiners game_type qs_game_type is_private bet_amount user_bet pr host_pr status created_at updated_at hosts')
      .populate({ path: 'creator', model: User, select: 'avatar totalWagered username accessory status' })
      .populate({ path: 'game_type', model: GameType })
      .sort({ updated_at: -1 })
      .limit(pageSize);

    const result = await Promise.all(preRooms.map(async (room) => {
      try {
        const joinerData = await Promise.all(room.joiners.map(async (joinedUser) => {
          const user = await User.findOne({ _id: joinedUser }).select('avatar totalWagered username accessory status');
          return {
            avatar: user.avatar,
            totalWagered: user.totalWagered,
            accessory: user.accessory,
            username: user.username,
            rank: user.totalWagered,
          };
        }));
        const temp = {
          _id: room._id,
          creator_id: room.creator ? room.creator._id : '',
          joiners: room.joiners,
          joiner_avatars: joinerData.map(joiner => ({
            avatar: joiner.avatar,
            rank: joiner.totalWagered,
            username: joiner.username,
            accessory: joiner.accessory
          })),
          rank: room.creator?.totalWagered || 0,
          creator_avatar: room.creator?.avatar || '',
          accessory: room.creator?.accessory || '',
          username: room.creator?.username || '',
          creator_status: room.creator?.status || '',
          game_type: room.game_type,
          name: room.name,
          description: room.description,
          image: room.image,
          qs_game_type: room.qs_game_type,
          bet_amount: room.bet_amount,
          pr: room.pr,
          host_pr: room.host_pr,
          room_name: room.game_type.short_name + '-' + room.room_number,
          total_stakes: room.hosts.reduce((acc, host) => acc + host.stake, 0),
          user_bet: parseFloat(room.user_bet),
          winnings: '',
          is_private: room.is_private,
          status: room.status,
          index: room.room_number,
          created_at: moment(room.created_at).format('YYYY-MM-DD HH:mm'),
          updated_at: room.updated_at,
          likes: room.likes,
          views: room.views,
          battles: room.battles,
          hosts: room.hosts,
          selectedStrategy: room.selectedStrategy
        };

        switch (temp.game_type.game_type_id) {
          case 1:
            temp.winnings = room.user_bet;
            break;
          case 2:
            const gameLogList = await GameLog.find({ room }).sort({ bet_amount: 'desc' });
            if (!gameLogList || gameLogList.length === 0) {
              temp.winnings = temp.spleesh_bet_unit + room.user_bet;
            } else {
              const winningBet = [temp.spleesh_bet_unit + room.user_bet];
              const possibleWinnings = Array.from({ length: 9 }, (_, i) => i + 1)
                .reverse()
                .map(async (i) => {
                  const is_exist = await Promise.all(
                    gameLogList.map(async (log) => log.bet_amount === i * temp.spleesh_bet_unit)
                  );
                  return !is_exist.includes(true) ? i * temp.spleesh_bet_unit + room.user_bet : null;
                });

              temp.winnings = (await Promise.all(possibleWinnings)).find((value) => value !== null) || winningBet[0];
            }
            break;
          case 3:
            temp.winnings = room.pr;
            break;
          case 4:
            temp.winnings = parseFloat(room.host_pr) + parseFloat(room.user_bet);
            break;
          case 5:
          case 6:
          case 7:
          case 8:
            temp.winnings = room.user_bet;
            break;
        }

        return temp;
      } catch (error) {
        console.error({ error: error.toString() });
        return null;
      }
    }));

    const filteredResults = result.filter((temp) => temp !== null);
    const limitedResults = filteredResults.slice(0, pageSize);

    return {
      rooms: limitedResults,
    };
  } catch (error) {
    console.error('Error in getRoomList:', error);
    return {
      rooms: [],
    };
  }
};

router.get('/history', async (req, res) => {
  try {
    const { pageSize = 1, game_type = 'All' } = req.query;

    const history = await getHistory(
      parseInt(pageSize),
      null,
      game_type
    );
    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString()
    });
  }
});

router.get('/my_history', auth, async (req, res) => {
  try {
    const { pageSize = 16, game_type = 'All' } = req.query;

    const history = await getHistory(
      parseInt(pageSize),
      req.user._id,
      game_type
    );

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString()
    });
  }
});

router.get('/count', async (req, res) => {

  const game_type = req.query.game_type ? req.query.game_type : 'All';
  try {
    let search_condition = { status: 'open' };

    if (game_type !== 'All') {
      const gameType = await GameType.findOne({ short_name: game_type }).select('_id');
      search_condition.game_type = gameType._id;
    }

    const roomCount = await Room.countDocuments(search_condition);

    res.json({
      success: true,
      game_type: game_type,
      roomCount: roomCount
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.toString()
    });
  }
});


// /api/rooms call
router.get('/rooms', async (req, res) => {

  const pageSize = req.query.pageSize ? parseInt(req.query.pageSize) : 10;
  const game_type = req.query.game_type ? req.query.game_type : 'All';
  const excludeIds = req.query.excludeIds;

  try {
    const rooms = await getRoomList(pageSize, game_type, excludeIds);
    res.json({
      pageSize: pageSize,
      success: true,
      query: req.query,
      roomList: rooms.rooms,
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString()
    });
  }
});

router.post('/rooms', auth, async (req, res) => {
  try {
    const {
      bet_amount,
      name,
      image,
      ticker,
      telegram_link,
      x_link,
      website_link,
      game_type,
      endgame_amount,
      endgame_type,
      description,
      rps_list,
      qs_list,
      rps_game_type,
    } = req.body;

    if (bet_amount <= 0) {
      return res.json({ success: false, message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!' });
    }
    if (bet_amount < 0.0001) {
      return res.json({ success: false, message: 'MEOWNIMUM BET IS 0.0001 SOL!' });
    }
    if (endgame_type && parseFloat(endgame_amount) < bet_amount) {
      return res.json({ success: false, message: 'MINIMUM AUTO-PAYOUT MUST BE EQUAL TO BANKROLL' });
    }
    if (req.user.username.includes('BOT')) {
      return res.json({ success: false, message: 'DO NOT HAVE PURRMISSION' });
    }
    if (bet_amount > req.user.bankroll) {
      return res.json({ success: false, message: 'HOST HAS GONE BANKRUPT...FURIOUS!' });
    }
    if (bet_amount > req.user.balance) {
      return res.json({ success: false, message: 'NOT ENUFF FUNDS AT THIS MEOWMENT' });
    }
    if (req.user.dailyWithdrawals > 2.5) {
      return res.json({
        success: false,
        message: 'Exceeded Daily Withdrawal Limit. Unable to Create a room. Please try again tomorrow! (During Launch Phase only)',
      });
    }

    const gameType = await GameType.findOne({ game_type_id: parseInt(game_type) });

    let host_pr = 0;
    let user_bet = 0;
    let pr = 0;

    if (game_type == '1') {
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
      pr = user_bet * 2;
    } else if (game_type == '5') {
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    }

    const roomCount = await Room.countDocuments({});
    const newRoom = new Room({
      ...req.body,
      creator_id: req.user._id,
      creator_avatar: req.user.avatar,
      creator_status: "on",
      joiners: [],
      hosts: [
        {
          host: req.user._id,
          avatar: req.user.avatar,
          username: req.user.username,
          accessory: req.user.accessory,
          rank: req.user.totalWagered,
          share: 100,
          stake: parseFloat(bet_amount),
        },
      ],
      game_type: gameType ? gameType.toObject() : {},
      user_bet,
      name,
      image,
      ticker,
      x_link,
      telegram_link,
      website_link,
      pr: 0,
      endgame_amount: endgame_type ? endgame_amount : parseFloat(bet_amount),
      endgame_type,
      host_pr,
      room_number: roomCount + 1,
      index: roomCount + 1,
      status: 'open',
      description,
    });

    try {
      await saveDocumentWithRetry(newRoom);
    } catch (error) {
      console.error('Error saving newRoom:', error);
    }
    req.io.sockets.emit('UPDATED_ROOM_LIST', newRoom);

    if (gameType.game_type_name === 'RPS') {
      for (const rps of rps_list) {
        const newRps = new RpsBetItem({ room: newRoom, rps: rps.rps });
        try {
          await saveDocumentWithRetry(newRps);
        } catch (error) {
          console.error('Error saving newRps:', error);
        }

        if (rps_game_type === 1) {
          const item = await Item.findOne({ productName: rps.rps });
          if (item) {
            const owner = item.owners.find((owner) => owner.user.toString() === req.user._id.toString());
            if (owner && owner.count >= 1) {
              owner.count -= 1;
              try {
                await saveDocumentWithRetry(item);
              } catch (error) {
                console.error('Error saving item:', error);
              }
            } else {
              return res.json({
                success: false,
                message: 'You do not own enough items for the RRPS gametype.',
              });
            }
          } else {
            return res.json({ success: false, message: 'Item not found for the RRPS gametype.' });
          }
        }
      }
    } else if (gameType.game_type_name === 'Quick Shoot') {
      for (const qs of qs_list) {
        const newQs = new QsBetItem({ room: newRoom, qs: qs.qs });
        try {
          await saveDocumentWithRetry(newQs);
        } catch (error) {
          console.error('Error saving newRps:', error);
        }
      }
    }

    const newTransaction = new Transaction({
      user: req.user,
      amount: 0,
      description: 'created ' + gameType.short_name + '-' + newRoom.room_number,
      room: newRoom._id,
    });

    req.user.balance -= bet_amount;
    newTransaction.amount -= bet_amount;
    req.user.updated_at = new Date();

    try {
      await saveDocumentWithRetry(req.user);
      await saveDocumentWithRetry(newTransaction);
    } catch (error) {
      console.error('Error saving:', error);
    }

    res.json({
      success: true,
      message: 'room create',
      newTransaction,
    });
  } catch (err) {
    console.error('Error saving room:', err);

    res.json({
      success: false,
      message: 'something went wrong',
    });
  }
});


router.get('/my_games', auth, async (req, res) => {
  try {
    const pageSize = 50;
    const game_type = req.query.game_type ? req.query.game_type : 'All';
    const status = req.query.status;
    const sort = req.query.sort ? req.query.sort : 'desc';

    const { rooms, count } = await getMyRooms(
      req.user._id,
      pageSize,
      game_type,
      status,
      sort
    );
    res.json({
      success: true,
      pageSize: pageSize,
      myGames: rooms,
      total: count,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
    });
  }
});

const getMyRooms = async (
  user_id,
  pageSize,
  game_type = 'All',
  status = 'open',
  sort = 'desc',
) => {
  const search_condition = {
    'hosts': { $elemMatch: { host: user_id, share: { $gt: 0 } } }
  };

  if (status) {
    search_condition.status = status;
  }
  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type });
    search_condition.game_type = gameType._id;
  }
  if (status === 'finished') {
    search_condition.joiners = { $exists: true, $ne: [] };
  }

  const rooms = await Room.find(search_condition)
    .populate({ path: 'game_type', model: GameType })
    .limit(pageSize);

  const count = await Room.countDocuments(search_condition);

  let result = [];

  for (const room of rooms) {

    try {
      const isCoHost = room.hosts.find(
        host => host.host.toString() === user_id.toString() && host.share === 100
      );
      const gameLogCount = await GameLog.countDocuments({ room: room._id });
      const creatorDetails = await User.findById(room.creator).select('avatar totalWagered accessory');
      const creatorAvatar = creatorDetails?.avatar || '';
      const creatorTotalWagered = creatorDetails?.totalWagered || 0;
      const creatorAccessory = creatorDetails?.accessory || '';

      let temp = {
        _id: room._id,
        creator_id: room.creator,
        creator_avatar: creatorAvatar,
        rank: creatorTotalWagered,
        accessory: creatorAccessory,
        game_type: room.game_type,
        bet_amount: room.bet_amount,
        rps_list: room.rps_list,
        qs_list: room.qs_list,
        user_bet: room.user_bet,
        share: (() => {
          const matchingHost = room.hosts.find(host => host.host.toString() === user_id.toString());
          if (matchingHost) {
            return matchingHost.share;
          } else {
            return 0;
          }
        })(),
        stake: (() => {
          const matchingHost = room.hosts.find(host => host.host.toString() === user_id.toString());
          if (matchingHost) {
            return matchingHost.stake;
          } else {
            return 0;
          }
        })(),
        initial_stake: (() => {
          const matchingHost = room.hosts.find(host => host.host.toString() === user_id.toString());
          if (matchingHost) {
            return matchingHost.initial_stake;
          } else {
            return 0;
          }
        })(),
        pr: room.host_pr,
        winnings: '',
        index: room.room_number,
        endgame_type: room.endgame_type,
        endgame_amount: room.endgame_amount,
        is_private: room.is_private,
        status: room.status,
        created_at: room.created_at,
        coHost: isCoHost,
        selectedStrategy: room.selectedStrategy,
        // statistics: '',
        net_profit: '',
        battles: gameLogCount,
        hosts: room.hosts
      };


      if (gameLogCount === 0) {
        temp.winnings = temp.bet_amount;
      } else if (room.game_type.game_type_id === 1) {
        // RPS
        temp.winnings = room.user_bet;
      } else if (room.game_type.game_type_id === 5) {
        // Quick Shoot
        temp.winnings = room.user_bet;
      }


      if (isCoHost) {
        const hostShare = isCoHost.share;
        temp.winnings = (hostShare / 100) * parseFloat(room.user_bet);
        if (room.creator.toString() !== user_id.toString()) {
          temp.coHost = isCoHost;
        }
      }

      result.push(temp);
      if (sort === 'asc') {
        result.sort((a, b) => a.created_at - b.created_at);
      } else if (sort === 'desc') {
        result.sort((a, b) => b.created_at - a.created_at);
      } else if (sort === 'net_profit_asc') {
        result.sort((a, b) => a.net_profit - b.net_profit);
      } else if (sort === 'net_profit_desc') {
        result.sort((a, b) => b.net_profit - a.net_profit);
      } else if (sort === 'bets_asc') {
        result.sort((a, b) => a.bets - b.bets);
      } else {
        result.sort((a, b) => b.bets - a.bets);
      }
    } catch (e) {
      console.log(e.toString());
    }
  }

  return {
    rooms: result,
    count: count
  };
};

router.post('/end_game', auth, async (req, res) => {
  try {
    const { _id: userId, updated_at, dailyWithdrawals, username, avatar, accessory, totalWagered } = req.user;
    const { room_id: roomId } = req.body;

    const timeDifference = (new Date() - new Date(updated_at)) / 1000; // Difference in seconds
    if (timeDifference <= 1.5) {
      return res.json({
        success: false,
        message: 'Too fast. Please wait a few seconds before trying again.',
      });
    }

    if (!(await check_access_time(userId))) {
      return res.json({
        success: false,
        message: 'Irregular action',
        betResult: -1000,
      });
    }

    if (dailyWithdrawals > 4.269) {
      return res.json({
        success: false,
        message: 'Exceeded Daily Withdrawal Limit. Unable to end this room. Please try again tomorrow!',
      });
    }

    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User, select: 'username _id' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name' })
      .select('status hosts user_bet host_pr pr bet_amount room_number selectedStrategy');

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ALREADY ENDED',
      });
    }

    roomInfo.status = 'finished';
    await saveDocumentWithRetry(roomInfo);

    const strategyKey = roomInfo.selectedStrategy.replace(/[\s-]/g, '').toLowerCase();
    const hostUpdates = [];

    for (const hostData of roomInfo.hosts) {
      const hostId = hostData.host;
      const host = await User.findById(hostId).select('balance updated_at');
      if (!host) continue;

      const amount = (hostData.share / 100) * parseFloat(roomInfo.user_bet);
      host.balance += amount;
      host.updated_at = new Date();
      hostUpdates.push(saveDocumentWithRetry(host));

      let qbotHost = await QBot.findOne({ user: req.user._id }).select('hosting updated_at') || new QBot({ user: roomInfo.creator._id });
      qbotHost.hosting = qbotHost.hosting || {};
      qbotHost.hosting[strategyKey] = (qbotHost.hosting[strategyKey] || 0) + (roomInfo.host_pr + roomInfo.pr - roomInfo.bet_amount);
      qbotHost.updated_at = new Date();
      hostUpdates.push(saveDocumentWithRetry(qbotHost));

      const message = `You ended your game ${roomInfo.game_type.short_name}-${roomInfo.room_number}. Received ${amount.toFixed(2)}.`;
      const notificationData = {
        _id: userId,
        message,
        username,
        avatar,
        amount,
        accessory,
        room: roomInfo._id,
        rank: totalWagered,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };
      socket.sendNotification(hostId, notificationData);
    }

    await Promise.all(hostUpdates);

    const newGameLog = new GameLog({
      room: roomInfo._id,
      creator: roomInfo.creator._id,
      joined_user: roomInfo.creator._id,
      game_type: roomInfo.game_type._id,
      bet_amount: roomInfo.host_pr,
      hosts: roomInfo.hosts,
      game_result: -100,
    });

    const newTransactionC = new Transaction({
      user: userId,
      amount: roomInfo.hosts[0].share / 100 * parseFloat(roomInfo.user_bet),
      description: `ended ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: roomId,
    });

    await Promise.all([saveDocumentWithRetry(newGameLog), saveDocumentWithRetry(newTransactionC)]);

    req.io.sockets.emit('ROOM_ENDED', { roomId });


    res.json({
      success: true,
      roomId,
      newTransaction: newTransactionC,
    });
  } catch (err) {
    console.error('ERROR in end_game:', err);
    res.json({
      success: false,
      already_finished: false,
      message: err.message,
    });
  }
});

// buy route
router.post('/coHost', auth, async (req, res) => {
  try {
    const rowId = req.body.rowId;
    const room = await Room.findOne({ _id: rowId });
    const gameType = await GameType.findOne({ _id: room.game_type });

    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND'
      });
    }

    const accessAllowed = await check_access_time(req.user._id);
    console.log("accessAllowed", accessAllowed)
    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    if (room.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
    }

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    let coHostAmount = parseFloat(req.body.amount);

    if (isNaN(coHostAmount) || coHostAmount <= 0) {
      return res.json({
        success: false,
        message: 'INVALID AMOUNT! PLEASE ENTER A VALID NUMBER.'
      });
    }

    if (userBalance < coHostAmount) {
      return res.json({
        success: false,
        message: 'INSUFFICIENT FUNDS!'
      });
    }

    const fee = coHostAmount * 0.025;
    const amountAfterFee = coHostAmount - fee;

    room.user_bet = parseFloat(room.user_bet) + coHostAmount;
    room.host_pr += coHostAmount;
    room.endgame_amount += coHostAmount;
    req.user.balance -= coHostAmount;

    room.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    const existingHostIndex = room.hosts.findIndex(host => host.host.equals(req.user._id));
    const totalBankroll = parseFloat(room.user_bet);

    const baseShare = (amountAfterFee / totalBankroll) * 100;

    const maxBoostFactor = 1.6;
    const minBoostFactor = 1.025;
    const boostFactor = minBoostFactor + ((coHostAmount / totalBankroll) * (maxBoostFactor - minBoostFactor));
    const boostedShare = baseShare * boostFactor;


    if (existingHostIndex === -1) {
      const newHost = {
        host: req.user._id,
        share: boostedShare,
        accessory: req.user.accessory,
        username: req.user.username,
        avatar: req.user.avatar,
        rank: req.user.totalWagered,
        initial_stake: coHostAmount,
        stake: amountAfterFee
      };
      room.hosts.push(newHost);
    } else {
      const host = room.hosts[existingHostIndex];
      const updatedShare = (((host.share / 100) * totalBankroll + amountAfterFee) / totalBankroll) * 100;
      host.share = updatedShare * boostFactor;
      host.initial_stake += coHostAmount;
      host.stake += amountAfterFee;
    }

    let totalShares = 0;
    room.hosts.forEach(host => totalShares += host.share);
    const normalizationFactor = 100 / totalShares;
    room.hosts.forEach(host => host.share *= normalizationFactor);

    room.hosts.forEach(host => {
      const isCurrentUserHost = host.host.equals(req.user._id);

      const message = `${isCurrentUserHost ? "You" : req.user.username} now ${isCurrentUserHost ? "share" : "shares"} ${(boostedShare).toFixed(2)}% of ${gameType.short_name + '-' + room.room_number
        }, your new share is ${(host.share).toFixed(2)}%`;

      const temp = new Notification({
        from: req.user._id,
        to: host.host,
        room: room._id,
        amount: isCurrentUserHost ? -coHostAmount : 0,
        message: message,
        is_read: false,
      });

      try {
        saveDocumentWithRetry(temp);
      } catch (error) {
        console.error("Error saving temp:", error);
      }

      const notificationData = {
        _id: req.user._id,
        message: message,
        username: req.user.username,
        avatar: req.user.avatar,
        accessory: req.user.accessory,
        room: room._id,
        rank: req.user.totalWagered,
        amount: isCurrentUserHost ? -coHostAmount : 0, // Use coHostAmount for the amount field
        created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        created_at_str: moment(new Date()).format('LLL'),
        updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };

      // Send notification through the socket
      socket.sendNotification(host.host, notificationData);
    });

    const newTransaction = new Transaction({
      created_at: now,
      user: req.user._id,
      amount: -coHostAmount,
      description: `Pumped ${gameType.short_name}-${room.room_number}`,
      room: room._id
    });

    try {
      await Promise.all([
        saveDocumentWithRetry(room),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransaction)
      ]);
    } catch (error) {
      console.error("Error saving documents:", error);
    }

    const timeBucket = Math.floor(new Date(now).getTime() / (60 * 1000));
    const newCandle = {
      _id: timeBucket,
      open: room.user_bet - coHostAmount,
      close: room.user_bet,
      high: Math.max(room.user_bet - coHostAmount, room.user_bet),
      low: Math.min(room.user_bet - coHostAmount, room.user_bet),
      volume: coHostAmount,
      buyVolume: coHostAmount,
      sellVolume: 0,
      startTime: new Date(timeBucket * 60 * 1000)
    };

    if (req.io.sockets) {
      req.io.sockets.emit(`NEW_CANDLE_${room._id}`, {
        newCandle: newCandle
      });
    }

    const newGameLog = new GameLog({
      room: room._id,
      creator: req.user._id,
      joined_user: null,
      game_type: gameType,
      bet_amount: coHostAmount,
      selected_rps: '',
      ai_mode: '',
      commission: 0,
      game_result: 444,
      winnings: 0,
      endgame_amount: coHostAmount,
      host_pr: coHostAmount,
      user_bet: 0,
      status: 'open',
      hosts: room.hosts
    });

    try {
      await newGameLog.save();

      let gameLogQuery = GameLog.find({ room: room._id })
        .sort({ created_at: 'desc' })
        .limit(1)
        .populate({ path: 'room', model: Room, select: '_id winnings commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at' })
        .populate({ path: 'game_type', model: GameType, select: 'short_name game_type_name' })
        .populate({ path: 'creator', model: User, select: '_id avatar username accessory totalWagered' })
        .populate({ path: 'joined_user', model: User, select: '_id avatar username accessory totalWagered' });

      const gameLogList = await gameLogQuery;

      const newLog = await convertGameLogToHistoryStyle(gameLogList);

      if (req.io.sockets) {
        req.io.sockets.emit(`UPDATED_BANKROLL_${room._id}`, {
          bankroll: room.user_bet,
          host_pr: room.host_pr,
          newLog: newLog,
          user: req.user
        });
        req.io.sockets.emit('NEW_LOG', {
          newLog: newLog
        });
      }
    } catch (error) {
      console.error('Error saving game log:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save game log'
      });
    }

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
    });
  } catch (error) {
    console.log('ERROR in coHost:', error);
    return res.json({
      success: false,
      message: 'FAILED TO INITIATE CO-HOST ARRANGEMENT.'
    });
  }
});

// sell route (unstake)
router.post('/unstake', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const roomId = req.body.room_id;
    const stakeAmount = req.body.stake_amount;

    if (stakeAmount <= 0) {
      return res.json({
        success: false,
        message: 'Invalid unstake amount'
      });
    }

    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

    if (!roomInfo) {
      return res.json({
        success: false,
        message: 'Room not found'
      });
    }

    const gameType = await GameType.findOne({ _id: roomInfo.game_type });

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS NOW ENDED'
      });
    }

    const hostIndex = roomInfo.hosts.findIndex(host => host.host.equals(userId));
    if (hostIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not a host of this room'
      });
    }

    const userStake = roomInfo.hosts[hostIndex].stake;

    if (stakeAmount > userStake) {
      return res.json({
        success: false,
        message: 'Unstake amount exceeds your current stake'
      });
    }

    const unstakeAmount = parseFloat(stakeAmount);
    roomInfo.hosts[hostIndex].stake -= unstakeAmount;
    roomInfo.hosts[hostIndex].initial_stake -= unstakeAmount;
    req.user.balance = parseFloat(req.user.balance) + unstakeAmount;

    if (roomInfo.hosts[hostIndex].stake === 0) {
      roomInfo.hosts.splice(hostIndex, 1);
    }

    // Adjust shares
    if (roomInfo.hosts.length === 1) {
      roomInfo.hosts[0].share = 100;
    } else {
      const remainingBankroll = roomInfo.user_bet;
      roomInfo.hosts.forEach(host => {
        if (host.stake > 0) {
          host.share = (host.stake / remainingBankroll) * 100;
        }
      });

      let totalShares = 0;
      roomInfo.hosts.forEach(host => totalShares += host.share);
      const normalizationFactor = 100 / totalShares;
      roomInfo.hosts.forEach(host => host.share *= normalizationFactor);
    }

    const newTransaction = new Transaction({
      user: userId,
      amount: unstakeAmount,
      description: `Jeeted ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: roomId
    });

    // Update the candle
    const open = roomInfo.user_bet;
    const close = roomInfo.user_bet - unstakeAmount; // New value after unstake
    const high = Math.max(open, close); // The highest value in this period
    const low = Math.min(open, close); // The lowest value in this period

    const updatedCandle = {
      newCandle: {
        open: open,
        high: high,
        low: low,
        close: close,
        volume: unstakeAmount,
        buyVolume: 0,
        sellVolume: unstakeAmount,
        startTime: moment().valueOf()
      }
    };

    req.io.sockets.emit(`NEW_CANDLE_${roomInfo._id}`, updatedCandle);

    const newGameLog = new GameLog({
      room: roomInfo,
      creator: roomInfo.creator,
      joined_user: null,
      game_type: roomInfo.game_type,
      bet_amount: unstakeAmount,
      selected_rps: '',
      ai_mode: '',
      commission: 0,
      game_result: 666,
      winnings: 0,
      endgame_amount: unstakeAmount,
      host_pr: unstakeAmount,
      user_bet: 0,
      status: 'open',
      hosts: []
    });

    try {
      await newGameLog.save();
    } catch (error) {
      console.error('Error saving game log:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save game log'
      });
    }

    roomInfo.user_bet -= unstakeAmount;
    roomInfo.host_pr -= unstakeAmount;
    roomInfo.endgame_amount -= unstakeAmount;
    roomInfo.updated_at = moment(new Date()).format('YYYY-MM-DD HH:mm');

    roomInfo.hosts.forEach(host => {
      const isCurrentUserHost = req.user._id === host.host;
      const message = `${isCurrentUserHost ? "You" : req.user.username} jeeted ${(stakeAmount)} in ${gameType.short_name}-${roomInfo.room_number}, your new Share is ${(host.share).toFixed(2)}%`;

      const notificationData = {
        _id: userId,
        message: message,
        username: req.user.username,
        avatar: req.user.avatar,
        accessory: req.user.accessory,
        amount: isCurrentUserHost ? stakeAmount : 0,
        room: roomInfo._id,
        rank: req.user.totalWagered,
        created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        created_at_str: moment(new Date()).format('LLL'),
        updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        is_read: false
      };

      socket.sendNotification(host.host, notificationData);
    });

    try {
      await Promise.all([
        saveDocumentWithRetry(roomInfo),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransaction)
      ]);
    } catch (error) {
      console.error("Error saving documents:", error);
    }

    res.json({
      success: true,
      newTransaction
    });

    let gameLogQuery = GameLog.find({ room: roomInfo._id })
      .sort({ created_at: 'desc' })
      .limit(1)
      .populate({ path: 'room', model: Room, select: '_id winnings commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name game_type_name' })
      .populate({ path: 'creator', model: User, select: '_id avatar username accessory totalWagered' })
      .populate({ path: 'joined_user', model: User, select: '_id avatar username accessory totalWagered' });

    const gameLogList = await gameLogQuery;

    const newLog = await convertGameLogToHistoryStyle(gameLogList);

    if (req.io.sockets) {
      req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, {
        bankroll: roomInfo.user_bet,
        host_pr: roomInfo.host_pr,
        newLog: newLog,
        user: req.user
      });
      req.io.sockets.emit('NEW_LOG', {
        newLog: newLog
      });
    }

  } catch (err) {
    console.error('ERROR in unstake:', err);
    res.json({
      success: false,
      message: 'Failed to process unstake request'
    });
  }
});

router.get('/my_chat', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const messages1 = await Message.find({ from: userId }).populate({
      path: 'to',
      model: User
    });
    const messages2 = await Message.find({ to: userId }).populate({
      path: 'from',
      model: User
    });

    const myChat = {};

    for (let message of messages1) {
      if (
        message.to &&
        (!myChat[message.to._id] ||
          myChat[message.to._id].updated_at < message.updated_at)
      ) {
        myChat[message.to._id] = {
          ...myChat[message.to._id],
          _id: message.to._id,
          message: message.message,
          username: message.to.username,
          avatar: message.to.avatar,
          accessory: message.to.accessory,
          rank: message.to.totalWagered,
          created_at: message.created_at,
          created_at_str: moment(message.created_at).format('LLL'),
          updated_at: message.updated_at,
          unread_message_count: 0
        };
      }
    }

    for (let message of messages2) {
      if (message.from && message.from._id === message.to) {
        continue;
      }

      if (
        message.from &&
        (!myChat[message.from._id] ||
          myChat[message.from._id].updated_at < message.updated_at)
      ) {
        myChat[message.from._id] = {
          ...myChat[message.from._id],
          _id: message.from._id,
          message: message.message,
          username: message.from.username,
          avatar: message.from.avatar,
          accessory: message.from.accessory,
          rank: message.from.totalWagered,
          created_at: message.created_at,
          created_at_str: moment(message.created_at).format('LLL'),
          updated_at: message.updated_at
        };
      }

      if (message.from && !myChat[message.from._id].unread_message_count) {
        myChat[message.from._id].unread_message_count = 0;
      }

      if (message.from && !message.is_read) {
        myChat[message.from._id].unread_message_count++;
      }
    }

    res.json({
      success: true,
      myChat
    });
  } catch (err) {
    console.log(err);
    res.json({
      success: false,
      message: err
    });
  }
});

// routes/game.js

router.post('/mark_chat_as_read', auth, async (req, res) => {
  try {
    // Mark all messages from "req.body.fromId" to the current user (req.user._id) as read
    await Message.updateMany(
      {
        from: new ObjectId(req.body.fromId),
        to: req.user._id,
        is_read: false
      },
      { $set: { is_read: true } }
    );

    // Return success
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.toString()
    });
  }
});

router.patch('/qbotStatus', auth, async (req, res) => {
  try {
    const { userId, isActive } = req.body;
    if (!userId || typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'User ID and isActive status are required'
      });
    }

    const qbot = await QBot.findOneAndUpdate(
      { user: userId },
      { active: isActive },
      { new: true, upsert: true }
    ).select('user _id active');
    if (req.io.sockets) {
      const socketName = 'QBOT_STATUS';
      req.io.sockets.emit(socketName, qbot);
    }

    res.json({
      success: true,
      isActive: qbot.active
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.get('/qbotStatuses', auth, async (req, res) => {
  try {
    const { userIds } = req.query;
    if (!userIds) {
      return res.status(400).json({
        success: false,
        message: 'User IDs are required',
      });
    }

    const userIdsArray = userIds.split(',');
    const statuses = await QBot.find(
      { user: { $in: userIdsArray }, active: true },
      'user active'
    );

    // Transform statuses into a lookup object
    const statusesMap = userIdsArray.reduce((acc, id) => {
      acc[id] = !!statuses.find((status) => status.user.toString() === id);
      return acc;
    }, {});

    res.json({
      success: true,
      statuses: statusesMap,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

router.get('/qbotStatus', auth, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }
    const isActive = await QBot.findOne(
      { user: userId, active: true },
      'active'
    );
    res.json({
      success: true,
      isActive: !!isActive
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ to: userId })
      .populate([
        { path: 'from', model: User, select: 'username avatar accessory totalWagered' }
      ])
      .sort({ created_at: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      notifications: notifications.map(notification => ({
        _id: notification.from._id,
        message: notification.message,
        username: notification.from.username,
        avatar: notification.from.avatar,
        accessory: notification.from.accessory,
        room: notification.room,
        rank: notification.from.totalWagered,
        created_at: notification.created_at,
        created_at_str: moment(notification.created_at).format('LLL'),
        updated_at: notification.updated_at,
        amount: notification.amount ? notification.amount : 0,
        is_read: notification.is_read
      }))
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message
    });
  }
});

router.patch('/read_notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    const notifications = await Notification.find({ to: userId })
      .sort({ created_at: -1 })
      .limit(10);

    const notificationIds = notifications.map(notification => notification._id);
    await Notification.updateMany({ _id: { $in: notificationIds } }, { $set: { is_read: true } });
    res.json({
      success: true,
      message: 'Most recent notifications marked as read successfully.'
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message
    });
  }
});

router.post('/get_chat_room_info', auth, async (req, res) => {
  try {
    const { user_id, offset = 0, limit = 20 } = req.body;

    const user = await User.findOne({ _id: new ObjectId(user_id) });

    // 1) Query messages sorted by newest first:
    let chatLogs = await Message.find({
      $or: [
        { from: new ObjectId(user_id), to: new ObjectId(req.user._id) },
        { from: new ObjectId(req.user._id), to: new ObjectId(user_id) }
      ]
    })
      .sort({ created_at: -1 })    // newest -> oldest
      .skip(Number(offset))        // how many to skip
      .limit(Number(limit));       // how many to retrieve

    // 2) Reverse so we end up with oldest -> newest in the final array
    //    (because we sorted descending above)
    chatLogs = chatLogs.reverse();

    // 3) Transform them for the response
    const messages = chatLogs.map(chatLog => ({
      from: chatLog.from,
      to: chatLog.to,
      message: chatLog.message,
      created_at: moment(chatLog.created_at).format('MM-DD-YYYY HH:mm:ss')
    }));

    // Check if there are more older messages
    // We do that by counting total docs (or using .countDocuments())
    const totalCount = await Message.countDocuments({
      $or: [
        { from: new ObjectId(user_id), to: new ObjectId(req.user._id) },
        { from: new ObjectId(req.user._id), to: new ObjectId(user_id) }
      ]
    });
    // If offset+limit >= totalCount, there are no more older messages
    const hasMore = offset + limit < totalCount;

    res.json({
      success: true,
      chatRoomInfo: {
        user_id: user._id,
        accessory: user.accessory,
        avatar: user.avatar,
        rank: user.totalWagered,
        username: user.username,
        chatLogs: messages,
        hasMore,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err
    });
  }
});

const getTimeBucket = (timeRange) => {
  switch (timeRange) {
    case '1m':
      return 1;
    case '15m':
      return 15;
    case '4h':
      return 4 * 60;
    case '24h':
      return 24 * 60;
    default:
      return 1;
  }
};

router.post('/getGlobalChatLogs', async (req, res) => {
  try {
    // 1) Fetch last 15 messages from Chat, sorted descending
    const results = await Chat.find({})
      .sort({ created_at: -1 })
      .limit(15)
      .populate({
        path: 'sender',
        model: User,
        select: 'username avatar accessory totalWagered'
      })
      .populate({
        path: 'replyTo',
        model: 'Chat',
        populate: {
          path: 'sender',
          model: User,
          select: 'username avatar accessory totalWagered'
        }
      })
      .lean();

    // 2) Transform the results (like in your socket code)
    const transformedResults = results.map(({ created_at, message, messageType, messageContent, sender, replyTo }) => {
      const extractedReplyTo = replyTo && replyTo.length > 0 ? replyTo[0] : null;
      const transformedReplyTo = extractedReplyTo
        ? {
          username: extractedReplyTo.sender?.username ?? '',
          senderId: extractedReplyTo.sender?._id ?? '',
          avatar: extractedReplyTo.sender?.avatar ?? '',
          rank: extractedReplyTo.sender?.totalWagered ?? '',
          accessory: extractedReplyTo.sender?.accessory ?? '',
          message: extractedReplyTo.message,
          messageType: extractedReplyTo.messageType,
          time: moment(extractedReplyTo.created_at).format('hh:mm')
        }
        : null;

      return {
        sender: sender?.username ?? '',
        senderId: sender?._id ?? '',
        message,
        messageType,
        messageContent,
        avatar: sender?.avatar ?? '',
        accessory: sender?.accessory ?? '',
        replyTo: transformedReplyTo,
        rank: sender?.totalWagered ?? '',
        time: moment(created_at).format('hh:mm')
      };
    });

    // 3) Sort so oldest -> newest if needed
    const sortedResults = transformedResults.sort((a, b) =>
      a.created_at > b.created_at ? 1 : -1
    );
    // 4) Return to client
    return res.json({
      success: true,
      chatLogs: sortedResults
    });
  } catch (error) {
    console.error('Error fetching global chat:', error);
    return res.json({
      success: false,
      message: 'Error fetching global chat'
    });
  }
});

router.get('/candles/:room', async (req, res) => {
  try {
    const room = req.params.room;
    const { timeRange = '1m' } = req.query;

    const bucketSize = getTimeBucket(timeRange);

    const roomData = await Room.findById(room);
    const user_bet = parseFloat(roomData.user_bet);
    if (isNaN(user_bet)) {
      console.error(`[ERROR] Invalid liquidity (user_bet) for room: ${room}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid liquidity value.',
      });
    }

    let transactions = await Transaction.find({ room: room }).sort({ created_at: 1 });

    let previousLiquidity = user_bet; // Default to user_bet
    const finalCandles = [];
    const candleMap = new Map(); // Map to group transactions by minute

    transactions.forEach((transaction) => {
      const transactionTime = moment(transaction.created_at).startOf('minute').toISOString();
      const transactionAmount = transaction.amount;

      // Check if a candle already exists for this minute
      if (!candleMap.has(transactionTime)) {
        // Create a new candle
        candleMap.set(transactionTime, {
          _id: `candle_${transactionTime}`,
          open: previousLiquidity,
          high: previousLiquidity,
          low: previousLiquidity,
          close: previousLiquidity,
          volume: 0,
          buyVolume: 0,
          sellVolume: 0,
          startTime: transaction.created_at,
        });
      }

      // Merge logic: Update the existing candle for this minute
      const currentCandle = candleMap.get(transactionTime);
      previousLiquidity += transactionAmount;
      currentCandle.high = Math.max(currentCandle.high, previousLiquidity);
      currentCandle.low = Math.min(currentCandle.low, previousLiquidity);
      currentCandle.close = previousLiquidity;
      currentCandle.volume += Math.abs(transactionAmount);
      if (transactionAmount > 0) {
        currentCandle.buyVolume += transactionAmount;
      } else {
        currentCandle.sellVolume += Math.abs(transactionAmount);
      }
    });

    finalCandles.push(...Array.from(candleMap.values()).sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));

    const transactionData = transactions.map((transaction) => ({
      description: transaction.description,
      amount: transaction.amount,
      created_at: transaction.created_at,
    }));

    res.json({
      success: true,
      candles: finalCandles,
      transactions: transactionData,
    });
  } catch (err) {
    // console.error(`[ERROR] An error occurred: ${err.message}`);
    res.status(500).json({
      success: false,
      err: err.message,
    });
  }
});

router.post('/topUp', auth, async (req, res) => {
  try {
    const rowId = req.body.rowId;
    const room = await Room.findOne({ _id: rowId });
    const gameType = await GameType.findOne({ _id: room.game_type });
    const accessAllowed = await check_access_time(req.user._id);

    if (!accessAllowed) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND'
      });
    }

    if (room.status !== 'open') {
      return res.json({
        success: false,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
    }

    const userBalance = req.user.balance;
    const topUpAmount = parseFloat(req.body.amount);

    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      return res.json({
        success: false,
        message: 'Please enter a valid amount'
      });
    }
    if (userBalance < topUpAmount) {
      return res.json({
        success: false,
        message: 'Insufficient funds'
      });
    }

    const description = `Topped Up room ${gameType.short_name}-${room.room_number}`;
    const newTransaction = new Transaction({
      created_at: new Date(),
      user: req.user._id,
      amount: -topUpAmount,
      description
    });

    const oldValuation = parseFloat(room.user_bet);
    const newTotalBet = oldValuation + topUpAmount;
    req.user.balance -= topUpAmount;
    const existingHostIndex = room.hosts.findIndex(host => host.host.equals(req.user._id));
    let newShare;
    const bondingCurveThreshold = 1000; // Example threshold
    const bondingCurveFactor = newTotalBet > bondingCurveThreshold ? 1.2 : 1.0;
    const baseSharePrice = newTotalBet / (room.hosts.length + 1);

    const newSharePrice = baseSharePrice * bondingCurveFactor;
    if (existingHostIndex === -1) {
      // New host joining, calculate their share
      newShare = (topUpAmount / newSharePrice) * 100;
      room.hosts.push({
        host: req.user._id,
        stake: topUpAmount,
        initial_stake: topUpAmount,
        share: newShare,
        accessory: req.user.accessory,
        username: req.user.username,
        avatar: req.user.avatar,
        rank: req.user.totalWagered
      });
    } else {
      // Update existing host stake and recalculate their share minimally
      const host = room.hosts[existingHostIndex];
      host.stake += topUpAmount;
      host.share = ((host.stake / newTotalBet) * 100);
    }

    // Minimize normalization adjustments
    let totalShares = room.hosts.reduce((sum, host) => sum + host.share, 0);

    if (totalShares !== 100) {
      const normalizationFactor = 100 / totalShares;
      room.hosts.forEach(host => {
        host.share *= normalizationFactor;
      });
    }

    room.bet_amount += topUpAmount;
    room.host_pr += topUpAmount;
    room.endgame_amount += topUpAmount;
    room.user_bet = newTotalBet;

    await Promise.all([
      saveDocumentWithRetry(room),
      saveDocumentWithRetry(req.user),
      saveDocumentWithRetry(newTransaction)
    ]);

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction,
      message: 'Top Up was successful. Bankroll increased!'
    });
  } catch (error) {
    console.error('Error in top_up_request', error);
    return res.json({
      success: false,
      message: 'Failed to process top-up'
    });
  }
});



router.post('/editPayout', auth, async (req, res) => {
  try {
    const rowId = req.body.rowId;
    const room = await Room.findOne({ _id: rowId });

    const gameType = await GameType.findOne({ _id: room.game_type });

    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND'
      });
    }

    if (room.status !== 'open') {
      return res.json({
        success: false,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
    }

    const now = moment().format('LLL');
    const payoutAmount = parseFloat(req.body.amount);

    if (isNaN(payoutAmount) || payoutAmount < 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }
    if (payoutAmount < parseFloat(room.user_bet)) {
      return res.json({
        success: false,
        message: 'PAYOUT TOO LOW! MINIMUM IS BANKROLL'
      });
    }

    room.endgame_amount = payoutAmount;
    if (room.endgame_amount === 0) {
      room.endgame_type = false;
    } else {
      room.endgame_type = true;
    }
    try {
      await Promise.all([
        saveDocumentWithRetry(room),
        saveDocumentWithRetry(req.user),
      ]);
    } catch (error) {
      console.error("Error saving documents:", error);
    }

    return res.json({
      success: true,
      message: 'PAYOUT SETTINGS HAVE BEEN CHANGED.'
    });
  } catch (e) {
    console.log('ERROR in payout_request', e);
    return res.json({
      success: false,
      message: 'FAILED TO INITIATE PAYOUT SETTINGS'
    });
  }
});

router.post('/tip', auth, async (req, res) => {
  try {
    const toAddress = req.body.addressTo;
    const userToTip = await User.findOne({ _id: toAddress });

    if (!userToTip) {
      return res.json({
        success: false,
        message: 'PURR-SON NOT FOUND'
      });
    }
    if (parseFloat(userToTip.totalWagered) < 500) {
      return res.json({
        success: false,
        message: 'CANNOT TIP THIS USER, THEIR RANK IS TOO LOW'
      });
    }

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    if (req.user.username.includes('BOT')) {
      return res.json({
        success: false,
        message: 'DO NOT HAVE PURRMISSION'
      });
    }

    const tipAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(tipAmount) || tipAmount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }
    if (req.user.dailyWithdrawals > 4.269) {
      return res.json({
        success: false,
        message: 'UNABLE TO TIP TODAY, PLEASE CHECK BACK TOMORROW!'
      });
    }

    // Initialize balance fields if they are undefined
    userToTip.balance = userToTip.balance || 0;
    req.user.balance = req.user.balance || 0;

    if (userBalance < tipAmount) {
      return res.json({
        success: false,
        message: 'NOT ENUFF FUNDS AT THIS MEOWMENT'
      });
    }


    // Create a default description
    let description = `Received Tip from ${req.user.username}`;

    if (req.body.message) {
      description = `${req.body.message} (Tip from ${req.user.username})`;
    }

    const newTransactionC = new Transaction({
      created_at: now,
      user: req.user,
      amount: -tipAmount,
      description: `Tipped ${userToTip.username}`
    });

    const newTransactionJ = new Transaction({
      created_at: now,
      user: userToTip._id,
      amount: tipAmount,
      description
    });

    let tipMessage = req.body.message ? `"${req.body.message}"` : ''; // Add quotes only if a message exists

    let notification = new Notification({
      from: req.user._id,
      to: userToTip._id,
      room: '',
      message: `Tipped you ${(tipAmount)} ${tipMessage}`,
      amount: tipAmount,
      is_read: false
    });

    let notificationC = new Notification({
      from: userToTip,
      to: req.user._id,
      room: '',
      message: `You Tipped ${(tipAmount)} ${tipMessage}`,
      amount: -tipAmount,
      is_read: false
    });

    const notificationData = {
      message: notification.message,
      amount: tipAmount,
      username: req.user.username,
      avatar: req.user.avatar,
      accessory: req.user.accessory,
      rank: req.user.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    };
    const notificationDataC = {
      message: notificationC.message,
      amount: -tipAmount,
      username: userToTip.username,
      avatar: userToTip.avatar,
      accessory: userToTip.accessory,
      rank: userToTip.totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    };

    try {
      await saveDocumentWithRetry(notification);
      await saveDocumentWithRetry(notificationC);
      socket.sendNotification(userToTip._id, notificationData);
      socket.sendNotification(req.user._id, notificationDataC);
    } catch (error) {
      console.error("Error saving tip notification:", error);
    }

    // Update balances and save transactions
    userToTip.balance += tipAmount;
    req.user.balance -= tipAmount;

    try {
      await Promise.all([
        saveDocumentWithRetry(userToTip),
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(newTransactionC),
        saveDocumentWithRetry(newTransactionJ)
      ]);
    } catch (error) {
      console.error("Error saving documents:", error);
    }

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction: newTransactionC,
      message: 'Tip has been sent. 💸 Yipeee!'
    });
  } catch (e) {
    console.log('ERROR in tip_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate tip'
    });
  }
});

router.post('/reCreate', auth, async (req, res) => {
  try {
    const {
      room_id
    } = req.body;
    const room = await Room.findOne({ _id: room_id });
    const gameType = await GameType.findOne({ _id: room.game_type });
    if (!room) {
      return res.json({
        success: false,
        message: 'ROOM NOT FOUND'
      });
    }

    const mostRecentRoom = await Room.findOne().sort({ _id: -1 });

    let newRoomNumber;
    if (mostRecentRoom) {
      newRoomNumber = mostRecentRoom.room_number + 1;
    } else {
      newRoomNumber = 1;
    }

    // Duplicate the found room
    const duplicatedRoom = new Room({
      game_type: room.game_type,
      endgame_amount: room.endgame_amount,
      creator: room.creator,
      qs_list: room.qs_list,
      rps_list: room.rps_list,
      bet_amount: room.bet_amount,
      room_number: newRoomNumber, // Use the incremented room number
      // Copy other fields as needed
    });

    // Create a default description
    let description = `Re-Created Room ${gameType.short_name}-${room.room_number}`;

    const newTransactionJ = new Transaction({
      created_at: now,
      user: req.user._id,
      amount: betAmount,
      description
    });

    req.user.balance -= tipAmount;
    req.user.updated_at = new Date();

    try {
      await Promise.all([
        saveDocumentWithRetry(req.user),
        saveDocumentWithRetry(duplicatedRoom),
        saveDocumentWithRetry(newTransactionJ)
      ]);
    } catch (error) {
      console.error("Error saving documents:", error);
    }


    return res.json({
      success: true,
      message: 'Room duplicated successfully',
      newTransaction: newTransactionJ,

    });

  } catch (e) {
    console.log('ERROR in re-create req', e);
    return res.json({
      success: false,
      message: 'Failed to re-create room'
    });
  }
});

const MAX_RETRIES = 3;

router.post('/bet3', auth, async (req, res) => {
  let retryCount = 0;

  while (retryCount < MAX_RETRIES) {
    try {
      const requestId = uuidv4();

      if (semaphore3 === 0) {
        return res.status(503).json({ success: false, message: 'Service Unavailable' });
      }
      semaphore3 = 0;

      const [accessAllowed, betResult] = await Promise.all([
        check_access_time(req.user._id),
        executeBet3(req)
      ]);

      semaphore3 = 1;

      if (!accessAllowed) {
        const responseData = {
          success: false,
          message: 'irregular action',
          betResult: -1000,
          requestId: requestId
        };

        return res.json(responseData);
      }

      res.json({
        success: betResult.success,
        message: betResult.message,
        betResult: betResult.betResult,
        newTransaction: betResult.newTransaction,
        roomStatus: betResult.roomStatus,
        requestId: requestId
      });

      return;

    } catch (err) {
      console.error(`Error occurred on attempt ${retryCount + 1}:`, err);
      retryCount++; // Increment retry count

      semaphore3 = 1;

      if (retryCount === MAX_RETRIES) {
        console.error('Max retry limit reached');
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
      }
      console.log(`Retrying after a delay...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
});

module.exports = router;
