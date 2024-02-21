const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const socket = require('../socketController.js');
const router = express.Router();

const moment = require('moment');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

const User = require('../model/User');
const Room = require('../model/Room');

const Item = require('../model/Item');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
const RoomBoxPrize = require('../model/RoomBoxPrize');
const Question = require('../model/Question');
const Answer = require('../model/Answer');
const BrainGameType = require('../model/BrainGameType');
const Message = require('../model/Message');
const Notification = require('../model/Notification');

const Transaction = require('../model/Transaction');
const SystemSetting = require('../model/SystemSetting');
const SpleeshGuess = require('../model/SpleeshGuess');
const DropGuess = require('../model/DropGuess');
const BangGuess = require('../model/BangGuess');
const RollGuess = require('../model/RollGuess');
const RpsBetItem = require('../model/RpsBetItem');
const BjBetItem = require('../model/BjBetItem');
const QsBetItem = require('../model/QsBetItem');
const DropBetItem = require('../model/DropBetItem');
const BangBetItem = require('../model/BangBetItem');
const RollBetItem = require('../model/RollBetItem');
const { predictNext } = require('../helper/util/predictNext');
const { predictNextBj } = require('../helper/util/predictNextBj');
const { predictNextQs } = require('../helper/util/predictNextQs');
const { predictNextDrop } = require('../helper/util/predictNextDrop');
const avatarUtils = require('../helper/util/getRank');
const convertToCurrency = require('../helper/util/conversion');

let user_access_log = {};

router.get('/game_types', async (req, res) => {
  try {
    const gameTypes = await GameType.find({}).sort({ created_at: 1 });
    res.json({
      success: true,
      query: req.query,
      gameTypeList: gameTypes
    });
  } catch (err) {
    res.json({
      success: false,
      err: ''
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
        success: false
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

// /api/room/:id call
router.get('/room/:id', async (req, res) => {
  try {
    const room = await Room.findOne({ _id: req.params.id })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'brain_game_type', model: BrainGameType })
      .populate({ path: 'joiners', model: User });

    const gameLogList = await GameLog.find({ room: room })
      .sort({ created_at: 'desc' })
      .populate({ path: 'room', model: Room })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'joined_user', model: User });

    const creator = await User.findOne({ _id: room.creator });
    const joiners = await User.find({ _id: { $in: room.joiners } });

    const boxPrizeList = await RoomBoxPrize.find({ room: room }).sort({
      _id: 'asc'
    });
    const rpsBetItem = await RpsBetItem.findOne({
      room: room._id,
      joiner_rps: ''
    }).sort({ _id: 'asc' });
    const bjBetItem = await BjBetItem.findOne({
      room: room,
      joiner_bj: ''
    }).sort({ _id: 'asc' });
    const qsBetItem = await QsBetItem.findOne({
      room: room,
      joiner_qs: ''
    }).sort({ _id: 'asc' });
    const dropBetItem = await DropBetItem.findOne({
      room: room,
      joiner_drop: ''
    }).sort({ _id: 'asc' });
    const bangBetItem = await BangBetItem.findOne({
      room: room,
      joiner_bang: ''
    }).sort({ _id: 'asc' });
    const rollBetItem = await RollBetItem.findOne({
      room: room,
      joiner_roll: ''
    }).sort({ _id: 'asc' });

    async function emitRps(req) {
      const rpsItems = await RpsBetItem.find({ room: room });
      const rps1 = rpsItems.filter(item => item.joiner_rps !== '').slice(-5);
      if (rps1.length > 0 && req.io) {
        req.io.emit('RPS_1', rps1);
      }
    }

    await emitRps(req);

    let hasEmitted = false;


    let hasDropEmitted = false;

    async function emitDropGuesses(req) {
      if (!hasDropEmitted) {
        const drop_guesses = await DropGuess.find({ room: room });
        if (req.io.sockets) {
          req.io.sockets.emit('DROP_GUESSES1', drop_guesses);
        }
        hasDropEmitted = true;
      }
    }
    emitDropGuesses(req);

    // let hasBangEmitted = false;

    // async function emitBangElapsedTime(req, room) {
    //   if (!hasBangEmitted && room.status === 'open') {
    //     const bang_guesses = await BangBetItem.find({ room: room });
    //     const bangs = bang_guesses.map(guess => guess.bang);
    //     const currentTime = await getCurrentTime();
    //     const lastBangTime =
    //       bang_guesses.length > 0
    //         ? bang_guesses[bang_guesses.length - 1].created_at
    //         : currentTime;
    //     const elapsedTime = currentTime - lastBangTime;
    //     const roomId = room._id;
    //     const socketName = `BANG_GUESSES1_${roomId}`;
    //     if (req.io.sockets) {
    //       req.io.sockets.emit(socketName, { bangs, elapsedTime });
    //     }
    //     hasBangEmitted = true;
    //   }
    // }
    // emitBangElapsedTime(req, room);

    // let hasRollEmitted = false;

    // async function emitRollElapsedTime(req, room) {
    //   if (!hasRollEmitted && room.status === 'open') {
    //     const roll_guesses = await RollBetItem.find({ room: room });
    //     const rolls = roll_guesses.map(guess => guess.roll);
    //     const faces = roll_guesses.map(guess => guess.face);
    //     const currentTime = await getCurrentRollTime();
    //     const lastRollTime =
    //       roll_guesses.length > 0
    //         ? roll_guesses[roll_guesses.length - 1].created_at
    //         : currentTime;
    //     const elapsedTime = currentTime - lastRollTime;
    //     const roomId = room._id;
    //     const socketName = `ROLL_GUESSES1_${roomId}`;
    //     if (req.io.sockets) {
    //       req.io.sockets.emit(socketName, { rolls, faces, elapsedTime });
    //     }
    //     hasRollEmitted = true;
    //   }
    // }
    // emitRollElapsedTime(req, room);

    const roomHistory = await convertGameLogToHistoryStyle(gameLogList);

    res.json({
      success: true,
      query: req.query,
      roomInfo: {
        _id: room['_id'],
        created_at: room['created_at'],
        creator_id: room['creator'],
        creator_avatar: creator['avatar'],
        rank: creator['totalWagered'],
        accessory: creator['accessory'],
        aveMultiplier: room['aveMultiplier'],
        creator_name: creator['username'],
        endgame_amount: room['endgame_amount'],
        joiners: joiners,
        game_type: room['game_type']['game_type_name'],
        bet_amount: parseFloat(room['user_bet']),
        spleesh_bet_unit: room['spleesh_bet_unit'],
        brain_game_type: room['brain_game_type'],
        host_pr: room['host_pr'],
        pr: room['pr'],
        new_host_pr: room['new_host_pr'],
        crashed: room['crashed'],
        user_bet: room['user_bet'],
        room_name: room['game_type']['short_name'] + '-' + room['room_number'],
        brain_game_score: room['brain_game_score'],
        selected_drop: room['selected_drop'],
        selected_bj: room['selected_bj'],
        multiplier: room['multiplier'],
        qs_game_type: room['qs_game_type'],
        qs_nation: room['qs_nation'],
        rps_game_type: room['rps_game_type'],
        room_history: roomHistory,
        box_list: boxPrizeList,
        status: room['status'],
        rps_bet_item_id: rpsBetItem ? rpsBetItem.id : null,
        drop_bet_item_id: dropBetItem ? dropBetItem.id : null,
        bang_bet_item_id: bangBetItem ? bangBetItem.id : null,
        roll_bet_item_id: rollBetItem ? rollBetItem.id : null,
        bj_bet_item_id: bjBetItem ? bjBetItem.id : null,
        qs_bet_item_id: qsBetItem ? qsBetItem.id : null,
        is_private: room['is_private'],
        youtubeUrl: room['youtubeUrl'],
        gameBackground: room['gameBackground'],
        game_log_list: gameLogList.map(({ bet_amount }) => bet_amount)
      }
    });
  } catch (err) {
    res.json({
      success: false,
      err: err.toString()
    });
  }
});

router.get('/question/:brain_game_type', async (req, res) => {
  try {
    const [question] = await Question.aggregate([
      {
        $match: { brain_game_type: new ObjectId(req.params.brain_game_type) }
      },
      {
        $sample: { size: 1 }
      }
    ]);

    const [correctAnswer] = await Answer.aggregate([
      {
        $match: {
          question: new ObjectId(question._id),
          is_correct_answer: true
        }
      },
      {
        $sample: { size: 1 }
      }
    ]);

    const wrongAnswers = await Answer.aggregate([
      {
        $match: {
          question: new ObjectId(question._id),
          is_correct_answer: false
        }
      },
      {
        $sample: { size: 3 }
      }
    ]);

    const answers = [
      { _id: correctAnswer._id, answer: correctAnswer.answer },
      ...wrongAnswers.map(answer => ({
        _id: answer._id,
        answer: answer.answer
      }))
    ].sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      question: { _id: question._id, question: question.question, image: question.image },
      answers
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/answer', auth, async (req, res) => {
  try {
    const count = await Answer.countDocuments({
      _id: req.body.answer_id,
      question: new ObjectId(req.body.question_id),
      is_correct_answer: true
    });

    res.json({
      success: true,
      answer_result: count > 0 ? 1 : -1
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});


const convertGameLogToHistoryStyle = async gameLogList => {
  let result = [];

  gameLogList.forEach(gameLog => {
    try {
      let temp = {
        _id: gameLog._id,
        room_name:
          gameLog['game_type']['short_name'] +
          '-' +
          gameLog['room']['room_number'],
        history: '',
        gameBackground: gameLog['room']['gameBackground'],
        created_at: gameLog['created_at'],
        status: gameLog['room']['status']
      };

      const joined_user_avatar = `<img class='avatar' data-userid="${gameLog['joined_user']['_id']
        }" src='${gameLog['joined_user']['avatar']
        }'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(
          gameLog['joined_user']['totalWagered']
        )}" />`;

      const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']
        }" src='${gameLog['creator']['avatar']
        }'  alt='' onerror='this.src="/img/profile-thumbnail.svg"' style="border: ${avatarUtils.getBorderByRank(
          gameLog['creator']['totalWagered']
        )}" />`;
      const joined_user_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['joined_user']['accessory']}' rank='${gameLog['joined_user']['totalWagered']}' data-userid="${gameLog['joined_user']['_id']}">${joined_user_avatar}</a>`;
      const creator_link = `<a href="javascript:void(0)" class="user-link" accessory='${gameLog['creator']['accessory']}' rank='${gameLog['creator']['totalWagered']}' data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;

      const betAmount = parseFloat(gameLog['room']['bet_amount']);
      const userBet = parseFloat(gameLog['room']['user_bet']);
      const multiplier =
        parseFloat(gameLog['room']['user_bet']) /
        parseFloat(gameLog['room']['bet_amount']);

      const multiplierDisplay = multiplier.toFixed(2);
      const color = multiplier < 1 ? '#ffdd15' : '#ff0a28'; // yellow : red

      let room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;

      if (gameLog['room']['status'] === 'open') {
        room_name = `<a style='color: #b9bbbe;'  href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
      }
      // history logs
      if (gameLog['game_type']['game_type_name'] === 'RPS') {
        if (gameLog.game_result === 1) {
          temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['winnings']
          )} (${gameLog['winnings'] / gameLog['bet_amount']}X)</span> (${convertToCurrency(
            gameLog['commission']
          )} RTB) in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['user_bet'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            userBet
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else if (gameLog.game_result === 0) {
          temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(
            gameLog['bet_amount'] * 2
          )} (1.00X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Blackjack') {
        if (gameLog.game_result === 1) {
          temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount'] * 2
          )} (2.00X)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['user_bet'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            userBet
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else if (gameLog.game_result === 0) {
          temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(
            gameLog['bet_amount'] * 2
          )} (1.00X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Quick Shoot') {
        if (gameLog.game_result === 1) {
          const winnings =
            gameLog['bet_amount'] / (gameLog['room']['qs_game_type'] - 1) +
            gameLog['bet_amount'];
          const winningsDisplay = convertToCurrency(winnings);
          const multiplierDisplay = (winnings / gameLog['bet_amount']).toFixed(
            2
          );

          temp.history = `
            ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span>
            (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['user_bet'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            userBet
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Drop Game') {
        if (gameLog.game_result === 1) {
          const winnings = parseFloat(
            gameLog['bet_amount'] + gameLog['selected_drop']
          );
          const winningsDisplay = convertToCurrency(winnings);
          const multiplierDisplay = (
            (gameLog['bet_amount'] + gameLog['selected_drop']) /
            gameLog['bet_amount']
          ).toFixed(2);

          temp.history = `
            ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> 
            (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            gameLog['room']['host_pr']
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Bang!') {
        if (gameLog.game_result === 1) {
          const winnings = parseFloat(
            gameLog['cashoutAmount']
          );
          const winningsDisplay = convertToCurrency(winnings);
          const multiplierDisplay = (
            (gameLog['cashoutAmount']) /
            gameLog['bet_amount']
          ).toFixed(2);
          temp.history = `
            ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            gameLog['room']['host_pr']
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Roll') {
        if (gameLog.game_result === 1) {
          const winnings = parseFloat(
            gameLog['bet_amount'] * gameLog['multiplier']
          );
          const winningsDisplay = convertToCurrency(winnings);
          const multiplierDisplay = (
            (gameLog['bet_amount'] * gameLog['multiplier']) /
            gameLog['bet_amount']
          ).toFixed(2);

          temp.history = `
            ${joined_user_link} won <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            gameLog['room']['host_pr']
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Spleesh!') {
        if (gameLog.game_result === 1) {
          const winnings =
            (gameLog['host_pr'] + gameLog['bet_amount']);
          const winningsDisplay = convertToCurrency(winnings);
          const multiplierDisplay = (
            (parseFloat(gameLog['host_pr']) + gameLog['bet_amount']) /
            parseFloat(gameLog['bet_amount'])
          ).toFixed(2);

          temp.history = `${joined_user_link} won 
          <span style='color: #ff0a28;'>${winningsDisplay} (${multiplierDisplay}X)</span> 
          (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          const userBet = parseFloat(gameLog['user_bet']);
          const roomBetAmount = gameLog['room']['bet_amount'];
          const unstakedDisplay = convertToCurrency(userBet);
          const multiplierDisplay = (
            (userBet) /
            roomBetAmount
          ).toFixed(2);

          const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';

          temp.history = `${creator_link} unstaked 
      <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            gameLog['bet_amount']
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Mystery Box') {
        if (gameLog.game_result === 0) {
          const betAmount = parseFloat(gameLog['bet_amount']);
          const openingMessage = `${joined_user_link} opened a box <span style='color: #ffdd15;'>${convertToCurrency(
            betAmount
          )}</span>`;
          const resultMessage = `and didn't get <span style='color: #ffdd15;'>shit (0.00X)</span>`;

          temp.history = `${openingMessage} ${resultMessage} in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            gameLog['bet_amount'] - gameLog['room']['endgame_amount']
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          const roomPr = parseFloat(gameLog['room']['pr']);
          const roomUserBet = parseFloat(gameLog['room']['user_bet']);
          const roomBetAmount = parseFloat(gameLog['room']['bet_amount']);

          const unstakedAmount = roomPr + roomUserBet;
          const unstakedDisplay = convertToCurrency(unstakedAmount);
          const multiplierDisplay = (
            (roomPr + roomUserBet) /
            roomBetAmount
          ).toFixed(2);

          const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';

          temp.history = `${creator_link} unstaked 
      <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        } else {
          const gameResult = parseFloat(gameLog['game_result']);
          const betAmount = parseFloat(gameLog['bet_amount']);
          const color =
            gameResult / gameLog['room']['bet_amount'] < 1
              ? '#ffdd15'
              : '#ff0a28';
          const winningsDisplay = convertToCurrency(gameResult);
          const multiplierDisplay = (gameResult / betAmount).toFixed(2);

          temp.history = `${joined_user_link} opened a box and won 
          <span style="color: ${color}">${winningsDisplay} (${multiplierDisplay}X)</span>
          (${convertToCurrency(gameLog['commission'])} RTB) in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Brain Game') {
        const betAmount = parseFloat(gameLog['bet_amount']);
        const roomPr = parseFloat(gameLog['room']['pr']);
        const roomUserBet = parseFloat(gameLog['room']['user_bet']);
        const roomBetAmount = parseFloat(gameLog['room']['bet_amount']);

        if (gameLog.game_result === 0) {
          temp.history = `${joined_user_link}, scored ${gameLog['brain_game_score']
            } and split <span style='color: #b9bbbe;'>${convertToCurrency(
              betAmount * 2
            )}</span> in ${room_name}`;
        } else if (gameLog.game_result === 1) {
          const winnings = betAmount * 2;
          temp.history = `${joined_user_link} scored ${gameLog['brain_game_score']
            } and won <span style='color: #ff0a28;'>${convertToCurrency(
              winnings
            )} (2.00X)</span> (${convertToCurrency(
              gameLog['commission']
            )} RTB) in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          temp.history = `${creator_link} received a <span style='color: #ff0a28;'>${convertToCurrency(
            betAmount
          )}</span> Auto-Payout in ${room_name}`;
        } else if (gameLog.game_result === -100) {
          const unstakedAmount = roomPr;
          const unstakedDisplay = convertToCurrency(unstakedAmount);
          const multiplierDisplay = (unstakedAmount / roomBetAmount).toFixed(2);
          const color = multiplierDisplay < 1 ? '#ffdd15' : '#ff0a28';

          temp.history = `${creator_link} unstaked 
      <span style='color: ${color};'>${unstakedDisplay} (${multiplierDisplay}X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} scored ${gameLog['brain_game_score']
            } and lost <span style='color: ##ffdd15;'>${convertToCurrency(
              betAmount
            )} (0.00X)</span> in ${room_name}`;
        }
      }
      result.push(temp);
    } catch (e) {
      return;
    }
  });
  return result;
};

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
      .populate({ path: 'room', model: Room })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'joined_user', model: User });

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

const updateDigitToPoint2 = number => {
  if (parseFloat(number) - parseInt(number) > 0) {
    return parseFloat(number).toFixed(2);
  }
  return number;
};
const getRoomList = async (pageSize, game_type, excludeIds = []) => {
  const search_condition = { status: 'open', game_type: { $ne: null }, _id: { $nin: excludeIds } };

  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type }).select('_id');
    search_condition.game_type = gameType._id;
  }

  try {
    const preRooms = await Room.find(search_condition)
      .select('_id creator joiners game_type spleesh_bet_unit bet_amount user_bet pr host_pr status room_number created_at likes views hosts')
      .populate({ path: 'creator', model: User, select: 'avatar totalWagered accessory status' })
      .populate({ path: 'game_type', model: GameType })
      .limit(pageSize)

      // .populate({ path: 'brain_game_type', model: BrainGameType });

    const result = await Promise.all(preRooms.map(async (room) => {
      try {
        const joinerData = await Promise.all(room.joiners.map(async (joinedUser) => {
          const user = await User.findOne({ _id: joinedUser }).select('avatar totalWagered accessory status');
          return {
            avatar: user.avatar,
            totalWagered: user.totalWagered,
            accessory: user.accessory,
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
            accessory: joiner.accessory
          })),
          rank: room.creator?.totalWagered || 0,
          creator_avatar: room.creator?.avatar || '',
          accessory: room.creator?.accessory || '',
          creator_status: room.creator?.status || '',
          game_type: room.game_type,
          bet_amount: room.bet_amount,
          pr: room.pr,
          user_bet: parseFloat(room.user_bet),
          winnings: '',
          spleesh_bet_unit: room.spleesh_bet_unit,
          is_private: room.is_private,
          gameBackground: room.gameBackground,
          status: room.status,
          index: room.room_number,
          created_at: moment(room.created_at).format('YYYY-MM-DD HH:mm'),
          likes: room.likes,
          views: room.views,
          hosts: room.hosts
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
    
    // Sort by views array length
    filteredResults.sort((a, b) => {
      return b.views.length - a.views.length;
    });

    // Apply the limit after sorting
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
    const { pageSize = 10, game_type = 'All' } = req.query;

    const history = await getHistory(
      parseInt(pageSize),
      null,
      game_type
    );

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      total: history.count,

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
    const { pageSize = 10, game_type = 'All' } = req.query;

    const history = await getHistory(
      parseInt(pageSize),
      req.user._id,
      game_type
    );

    res.json({
      success: true,
      pageSize: parseInt(pageSize),
      history: history.history,
      total: history.count,

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
      total: rooms.count,
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
      game_type,
      aveMultiplier,
      endgame_amount,
      is_anonymous,
      box_list,
      rps_list,
      qs_list,
      drop_list,
      bang_list,
      roll_list,
      bj_list,
      rps_game_type
    } = req.body;

    if (bet_amount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }

    if (bet_amount > req.user.bankroll) {
      return res.json({
        success: false,
        message: 'HOST HAS GONE BANKRUPT...FURIOUS!'
      });
    }

    if (bet_amount > req.user.balance) {
      return res.json({
        success: false,
        message: "NOT ENUFF FUNDS AT THIS MEOWMENT"
      });
    }

    if (req.user.dailyWithdrawals > 0.02) {
      return res.json({
        success: false,
        message: "Exceeded Daily Withdrawal Limit. Unable to Create a room. Please try again tomorrow! (During Launch Phase only)"
      });
    }

    const gameType = await GameType.findOne({
      game_type_id: parseInt(game_type)
    });

    let host_pr = 0;
    let user_bet = 0;
    let pr = 0;

    if (game_type == '1') {
      // RPS
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
      pr = user_bet * 2;
    } else if (game_type == '2') {
      // Spleesh!
      host_pr = 0;
      user_bet = parseFloat(bet_amount);
      pr = parseFloat(bet_amount);
    } else if (game_type == '3') {
      // Brain Game
      pr = parseFloat(bet_amount);
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    } else if (game_type == '4') {
      // Mystery Box
      pr = parseFloat(req.body.max_prize);
      host_pr = parseFloat(bet_amount);
    } else if (game_type == '5') {
      // Quick Shoot
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    } else if (game_type == '6') {
      // Drop Game
      pr = parseFloat(req.body.max_return);
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    } else if (game_type == '7') {
      // Bang!
      pr = parseFloat(req.body.max_return);
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    } else if (game_type == '8') {
      // Roll
      pr = parseFloat(req.body.max_return);
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
    } else if (game_type == '9') {
      // Blackjack
      host_pr = parseFloat(bet_amount);
      user_bet = parseFloat(bet_amount);
      pr = user_bet * 2;
    }

    const roomCount = await Room.countDocuments({});

    const newRoom = new Room({
      ...req.body,
      creator: req.user,
      joiners: [],
      hosts: [{ host: req.user._id, avatar: req.user.avatar, accessory: req.user.accessory, rank: req.user.totalWagered, share: req.body.bet_amount }],
      game_type: gameType,
      user_bet,
      pr,
      endgame_amount,
      host_pr,
      room_number: roomCount + 1,
      status: 'open'
    });
    await newRoom.save();

    if (gameType.game_type_name === 'Mystery Box') {
      for (const box of box_list) {
        const newBox = new RoomBoxPrize({
          room: newRoom,
          box_prize: box.box_prize,
          box_price: box.box_price,
          status: 'init'
        });
        await newBox.save();
      }
    } else if (gameType.game_type_name === 'RPS') {
      for (const rps of rps_list) {
        const newRps = new RpsBetItem({
          room: newRoom,
          rps: rps.rps
        });
        await newRps.save();

        if (rps_game_type === 1) {

          const item = await Item.findOne({ productName: rps.rps });
          if (item) {
            // Find the owner entry for the current user
            const owner = item.owners.find(owner => owner.user.toString() === req.user._id.toString());

            if (owner && owner.count >= 1) {
              owner.count -= 1;
              await item.save();
            } else {
              return res.json({
                success: false,
                message: 'You do not own enough items for the RRPS gametype.'
              });
            }
          } else {
            return res.json({
              success: false,
              message: 'Item not found for the RRPS gametype.'
            });
          }
        }
      }
    } else if (gameType.game_type_name === 'Quick Shoot') {
      for (const qs of qs_list) {
        const newQs = new QsBetItem({
          room: newRoom,
          qs: qs.qs
        });
        await newQs.save();
      }
    } else if (gameType.game_type_name === 'Drop Game') {
      for (const drop of drop_list) {
        const newDrop = new DropBetItem({
          room: newRoom,
          drop: drop.drop
        });
        await newDrop.save();
      }
    } else if (gameType.game_type_name === 'Bang!') {
      // const roomId = newRoom.id;
      // initializeRound(bang_list, newRoom, req.io.sockets, roomId);
      for (const bang of bang_list) {
        const newBang = new BangBetItem({
          room: newRoom,
          bang: bang.bang
        });
        await newBang.save();
      }
    } else if (gameType.game_type_name === 'Roll') {
      for (const roll of roll_list) {
        const newRoll = new RollBetItem({
          room: newRoom,
          roll: roll.roll,
          face: roll.face
        });
        await newRoll.save();
      }
    } else if (gameType.game_type_name === 'Blackjack') {
      for (const bj of bj_list) {
        const newBj = new BjBetItem({
          room: newRoom,
          bj: bj.bj,
          score: bj.score
        });
        await newBj.save();
      }
    }

    const newTransaction = new Transaction({
      user: req.user,
      amount: 0,
      description: 'created ' + gameType.short_name + '-' + newRoom.room_number,
      room: newRoom._id
    });

    if (is_anonymous === true) {
      req.user.balance -= 10;
      newTransaction.amount -= 10;
    }

    req.user.balance -= bet_amount;
    newTransaction.amount -= bet_amount;

    await req.user.save();
    await newTransaction.save();

    const rooms = await getRoomList(7, 'All');
    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      pageSize: rooms.pageSize,
      roomList: rooms.rooms,
      total: rooms.count
    });

    res.json({
      success: true,
      message: 'room create',
      newTransaction
    });
  } catch (err) {
    console.error('Error saving room:', err);

    res.json({
      success: false,
      message: 'something went wrong'
    });
  }
});

async function getRoomNetProfits(room_id) {
  try {
    const gameLogs = await GameLog.find({
      $and: [{ room: { $ne: null } }, { game_result: { $nin: [3, -100] } }],
      room: room_id
    })
      .sort({ created_at: 'asc' })
      .populate({ path: 'game_type', model: GameType, select: 'short_name' })
      .populate({ path: 'room', model: Room, select: 'qs_game_type' })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id'
      });

    const playerStats = {};

    for (const gameLog of gameLogs) {
      const tax = await SystemSetting.findOne({ name: 'commission' });

      const creatorUser = await User.findOne({ _id: gameLog.creator }).select(
        'accessory'
      );

      const accessory = creatorUser ? creatorUser.accessory : null;
      let item;
      if (accessory) {
        item = await Item.findOne({ image: accessory }).select('CP');
      } else {
        item = { CP: tax.value };
      }

      const commission = item.CP;

      const actor = gameLog.joined_user.username;
      const wagered = gameLog.bet_amount;
      let net_profit = 0;

      if (gameLog.game_type && gameLog.game_type.short_name === 'S!') {
        if (gameLog.game_result === 1) {
          net_profit = 0 - wagered;
        } else {
          net_profit =
            wagered;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'QS') {
        if (gameLog.game_result === 1) {
          net_profit = 0 - wagered;
        } else {
          net_profit =
            (wagered + wagered / (gameLog.room.qs_game_type - 1)) -
            wagered;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
        if (gameLog.game_result === 1) {
          net_profit = 0 - wagered;
        } else {
          net_profit =
            (wagered + gameLog.selected_drop);
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'MB') {
        net_profit = gameLog.game_result - wagered;
      } else {
        if (gameLog.game_result === 0) {
          net_profit = 0;
        } else if (gameLog.game_result === -1) {
          net_profit = wagered;
        } else {
          net_profit = 0 - wagered;
        }
      }

      if (playerStats[actor]) {
        playerStats[actor].wagered += wagered;
        playerStats[actor].net_profit += net_profit;
        playerStats[actor].bets +=
          gameLog.game_result === 0 ||
            gameLog.game_result === -1 ||
            gameLog.game_result === 1
            ? 1
            : 0;
      } else {
        playerStats[actor] = {
          wagered,
          net_profit,
          bets:
            gameLog.game_result === 0 ||
              gameLog.game_result === -1 ||
              gameLog.game_result === 1
              ? 1
              : 0
        };
      }
    }

    const room_info = Object.values(playerStats).map(player => ({
      net_profit: player.net_profit,
      bets: player.bets
    }));

    return {
      room_info
    };
  } catch (error) {
    console.log('error***', error);
  }
}
const getMyRoomsWithStats = async (
  user_id,
  pageSize,
  game_type,
  status = 'open',
  sort = 'desc'
) => {
  const searchCondition = {
    $or: [
      { creator: user_id },
      { 'hosts.host': user_id }
    ]
  };

  if (status !== undefined) {
    searchCondition.status = status;
  }
  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type });
    searchCondition.game_type = gameType._id;
  }
  if (status === 'finished') {
    searchCondition.joiners = { $exists: true, $ne: [] };
  }

  const rooms = await Room.find(searchCondition)
    .populate({ path: 'game_type', model: GameType })
    .limit(pageSize);

  const count = await Room.countDocuments(searchCondition);

  const result = await Promise.all(rooms.map(async (room) => {
    try {
      const temp = {
        _id: room._id,
        game_type: room.game_type,
        bet_amount: room.bet_amount,
        rps_list: room.rps_list,
        qs_list: room.qs_list,
        drop_list: room.drop_list,
        bang_list: room.bang_list,
        roll_list: room.roll_list,
        pr: room.host_pr,
        winnings: '',
        index: room.room_number,
        endgame_amount: room.endgame_amount,
        is_private: room.is_private,
        status: room.status,
        created_at: room.created_at,
        coHost: false,
        net_profit: 0,
        bets: 0
      };

      const roomStatistics = await getRoomNetProfits(room._id);
      if (roomStatistics.room_info && roomStatistics.room_info.length > 0) {
        const { net_profit, bets } = roomStatistics.room_info[0];
        temp.net_profit = net_profit;
        temp.bets = bets;
      }

      const gameLogCount = await GameLog.countDocuments({ room: room._id });

      if (gameLogCount === 0) {
        temp.winnings = temp.bet_amount;
      } else {
        switch (room.game_type.game_type_id) {
          case 1: // RPS
            temp.winnings = room.user_bet;
            break;
          case 2: // Spleesh!
            // temp.bet_amount = (room.user_bet === 0 && room.bet_amount === room.pr) ? room.pr : temp.bet_amount;
            // temp.winnings = parseFloat(room.user_bet) + parseFloat(room.host_pr) + temp.bet_amount;
            temp.winnings = parseFloat(room.user_bet);
            break;
          case 3: // Brain Game
            temp.winnings = room.pr;
            break;
          case 4: // Mystery Box
            temp.winnings = parseFloat(room.user_bet) + parseFloat(room.host_pr);
            break;
          case 5: // Quick Shoot
          case 6: // Drop Game
            temp.winnings = room.user_bet;
            break;
          case 7: // Bang!
          case 8: // Roll
          case 9: // Blackjack
            temp.winnings = updateDigitToPoint2(room.user_bet);
            break;
          default:
            break;
        }
      }

      const isCoHost = room.hosts.slice(1).find(host => host.host.equals(user_id));
      if (isCoHost) {
        temp.coHost = true;
        const hostShare = isCoHost.share;
        temp.winnings = (hostShare / parseFloat(room.user_bet)) * parseFloat(room.user_bet);
      }

      return temp;
    } catch (e) {
      console.log(e.toString());
    }
  }));

  // Sorting
  const sortingMap = {
    'asc': (a, b) => a.created_at - b.created_at,
    'desc': (a, b) => b.created_at - a.created_at,
    'net_profit_asc': (a, b) => a.net_profit - b.net_profit,
    'net_profit_desc': (a, b) => b.net_profit - a.net_profit,
    'bets_asc': (a, b) => a.bets - b.bets,
    'bets_desc': (a, b) => b.bets - a.bets
  };

  result.sort(sortingMap[sort] || sortingMap['desc']);

  return { rooms: result, count };
};


router.get('/my_games', auth, async (req, res) => {
  try {
    // const pageSize = req.query.pageSize
    //   ? parseInt(req.query.pageSize)
    //   : 10;
    const pageSize = 10;
    const game_type = req.query.game_type ? req.query.game_type : 'All';
    const status = req.query.status;
    const sort = req.query.sort ? req.query.sort : 'desc';
    const excludeRoomStats = req.query.excludeRoomStats;
    let rooms;
    if (excludeRoomStats === "true") {

      rooms = await getMyRooms(
        req.user._id,
        pageSize,
        game_type,
        status,
        sort
      );


    } else {

      rooms = await getMyRoomsWithStats(
        req.user._id,
        pageSize,
        game_type,
        status,
        sort
      );
    }

    res.json({
      success: true,
      pageSize: pageSize,
      myGames: rooms.rooms,
      total: rooms.count,
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
  game_type,
  status = 'open',
  sort = 'desc',
) => {
  const search_condition = {
    creator: new ObjectId(user_id)
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
      let temp = {
        _id: room._id,
        game_type: room.game_type,
        bet_amount: room.bet_amount,
        rps_list: room.rps_list,
        qs_list: room.qs_list,
        drop_list: room.drop_list,
        bang_list: room.bang_list,
        roll_list: room.roll_list,
        pr: room.host_pr,
        winnings: '',
        index: room.room_number,
        endgame_amount: room.endgame_amount,
        is_private: room.is_private,
        status: room.status,
        created_at: room.created_at,
        // statistics: '',
        net_profit: '',
        bets: ''
      };

      const gameLogCount = await GameLog.countDocuments({ room: room._id });

      if (gameLogCount === 0) {
        temp.winnings = temp.bet_amount;
      } else if (room.game_type.game_type_id === 1) {
        // RPS
        temp.winnings = room.user_bet;
      } else if (room.game_type.game_type_id === 2) {
        // Spleesh!
        temp.winnings =
          parseFloat(room.user_bet);
      } else if (room.game_type.game_type_id === 3) {
        // Brain Game
        temp.winnings = room.pr;
      } else if (room.game_type.game_type_id === 4) {
        // Mystery Box
        temp.winnings = parseFloat(room.user_bet) + parseFloat(room.host_pr);
      } else if (room.game_type.game_type_id === 5) {
        // Quick Shoot
        temp.winnings = room.user_bet;
      } else if (room.game_type.game_type_id === 6) {
        // Drop Game
        temp.winnings = room.user_bet;
      } else if (room.game_type.game_type_id === 7) {
        // Bang!
        temp.winnings = updateDigitToPoint2(room.user_bet);
      } else if (room.game_type.game_type_id === 8) {
        // Roll
        temp.winnings = updateDigitToPoint2(room.user_bet);
      } else if (room.game_type.game_type_id === 9) {
        // Blackjack
        temp.winnings = updateDigitToPoint2(room.user_bet);
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
    const userId = req.user._id;
    const roomId = req.body.room_id;

    if (!check_access_time(userId)) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }
    if (req.user.dailyWithdrawals > 0.02) {
      return res.json({
        success: false,
        message: "Exceeded Daily Withdrawal Limit. Unable to End this room. Please try again tomorrow! (During Launch Phase only)"
      });
    }
    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS BATTLE HAS NOW ENDED'
      });
    }

    roomInfo.status = 'finished';
    // stopBangGame(roomId, req.io.sockets);

    const gameLogCount = await GameLog.countDocuments({ room: roomId });
    let message = new Notification({
      from: userId,
      to: roomInfo.creator,
      room: roomInfo._id,
      message: '',
      is_anonymous: req.body.is_anonymous,
      is_read: false
    });

    const newTransaction = new Transaction({
      user: roomInfo.creator,
      amount: 0,
      description: `ended ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: roomId
    });

    const gameTypeName = roomInfo.game_type.game_type_name;
    const rps_game_type = roomInfo.rps_game_type;
    if (gameTypeName === 'RPS' && rps_game_type === 1) {

      const rpsBetItems = await RpsBetItem.find({
        room: roomInfo._id,
        joiner_rps: ''
      });

      for (const item of rpsBetItems) {
        const creatorItem = await Item.findOne({
          'owners.user': roomInfo.creator._id,
          'productName': item.rps,
          'item_type': '653ee7ac17c9f5ee21245649'
        });

        if (creatorItem) {
          const owner = creatorItem.owners.find(
            (owner) => owner.user.toString() === roomInfo.creator._id.toString()
          );

          if (owner) {
            owner.count += 1;
            await creatorItem.save();
          }
        }
      }
    }

    if (gameLogCount === 0) {
      newTransaction.amount += roomInfo.bet_amount;

      message.message =
        `Earned ${convertToCurrency(roomInfo.bet_amount)} from ending ` +
        `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
    } else {
      // set balance
      if (
        gameTypeName === 'RPS' ||
        gameTypeName === 'Spleesh!' ||
        gameTypeName === 'Blackjack' ||
        gameTypeName === 'Quick Shoot' ||
        gameTypeName === 'Drop Game' ||
        gameTypeName === 'Bang!' ||
        gameTypeName === 'Roll'
      ) {
        newTransaction.amount += roomInfo.user_bet;
        message.message =
          `Earned ${convertToCurrency(roomInfo.user_bet)} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      } else if (gameTypeName === 'Mystery Box') {
        newTransaction.amount +=
          roomInfo.host_pr + parseFloat(roomInfo.user_bet);
        message.message =
          `Earned ${convertToCurrency(
            roomInfo.host_pr + parseFloat(roomInfo.user_bet)
          )} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      } else if (gameTypeName === 'Brain Game') {
        newTransaction.amount += roomInfo.host_pr;
        message.message =
          `Earned ${convertToCurrency(roomInfo.host_pr)} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      }

      newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo.creator,
        joined_user: roomInfo.creator,
        game_type: roomInfo.game_type,
        bet_amount: roomInfo.host_pr,
        is_anonymous: roomInfo.is_anonymous,
        game_result: -100
      });

      await newGameLog.save();
    }

    roomInfo.creator.balance += newTransaction.amount;
    await roomInfo.creator.save();
    await roomInfo.save();
    await newTransaction.save();

    sendEndedMessageToJoiners(
      roomId,
      roomInfo.creator._id,
      message.message,
      roomInfo.is_anonymous
    );

    const myRooms = await getMyRooms(userId);

    res.json({
      success: true,
      myGames: myRooms.rooms,
      pageSize: myRooms.pageSize,
      newTransaction
    });

    const rooms = await getRoomList(7, 'All');

    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      total: rooms.count,
      roomList: rooms.rooms,
      pageSize: rooms.pageSize
    });
  } catch (err) {
    res.json({
      success: false,
      already_finished: false,
      message: err
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
router.post('/unstake', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const roomId = req.body.room_id;

    if (!check_access_time(userId)) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }

    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS BATTLE HAS NOW ENDED'
      });
    }

    // Find the host's share index
    const hostIndex = roomInfo.hosts.findIndex(host => host.host.equals(userId));

    if (hostIndex === -1) {
      return res.json({
        success: false,
        message: 'You are not a host of this room'
      });
    }

    // Deduct the unstake amount from the host's share
    const unstakeAmount = roomInfo.hosts[hostIndex].share;
    req.user.balance += unstakeAmount;
    // Create a new transaction for unstaking
    const newTransaction = new Transaction({
      user: userId,
      amount: unstakeAmount,
      description: `Unstaked from ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: roomId
    });

    // Update room's user_bet and remove the host entry from the array
    roomInfo.user_bet -= unstakeAmount;
    roomInfo.endgame_amount -= unstakeAmount;
    roomInfo.hosts.splice(hostIndex, 1); // Remove the host entry
    await Promise.all([roomInfo.save(), req.user.save(), newTransaction.save()]);

    // Retrieve the user's updated room list
    const myRooms = await getMyRooms(userId);

    // Send response with updated room list and new transaction
    res.json({
      success: true,
      myGames: myRooms.rooms,
      pageSize: myRooms.pageSize,
      newTransaction
    });

    // Emit socket event to update room list for all users
    const rooms = await getRoomList(7, 'All');
    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      total: rooms.count,
      roomList: rooms.rooms,
      pageSize: rooms.pageSize
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
    });
  }
});



router.post('/end_game', auth, async (req, res) => {


  try {
    const userId = req.user._id;
    const roomId = req.body.room_id;

    if (!check_access_time(userId)) {
      return res.json({
        success: false,
        message: 'irregular action',
        betResult: -1000
      });
    }
    const roomInfo = await Room.findOne({ _id: roomId })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

    if (roomInfo.status === 'finished') {
      return res.json({
        success: false,
        already_finished: true,
        message: 'THIS BATTLE HAS ENDED ALREADY'
      });
    }

    roomInfo.status = 'finished';
    // stopBangGame(roomId, req.io.sockets);

    const gameLogCount = await GameLog.countDocuments({ room: roomId });
    let message = new Notification({
      from: userId,
      to: roomInfo.creator,
      room: roomInfo._id,
      message: '',
      is_anonymous: req.body.is_anonymous,
      is_read: false
    });

    const newTransaction = new Transaction({
      user: roomInfo.creator,
      amount: 0,
      description: `ended ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: roomId
    });

    const gameTypeName = roomInfo.game_type.game_type_name;
    const rps_game_type = roomInfo.rps_game_type;
    if (gameTypeName === 'RPS' && rps_game_type === 1) {

      const rpsBetItems = await RpsBetItem.find({
        room: roomInfo._id,
        joiner_rps: ''
      });

      for (const item of rpsBetItems) {
        const creatorItem = await Item.findOne({
          'owners.user': roomInfo.creator._id,
          'productName': item.rps,
          'item_type': '653ee7ac17c9f5ee21245649'
        });

        if (creatorItem) {
          const owner = creatorItem.owners.find(
            (owner) => owner.user.toString() === roomInfo.creator._id.toString()
          );

          if (owner) {
            owner.count += 1;
            await creatorItem.save();
          }
        }
      }
    }

    if (gameLogCount === 0) {
      newTransaction.amount += roomInfo.bet_amount;

      message.message =
        `Earned ${convertToCurrency(roomInfo.bet_amount)} from ending ` +
        `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
    } else {
      // set balance


      if (
        gameTypeName === 'RPS' ||
        gameTypeName === 'Spleesh!' ||
        gameTypeName === 'Blackjack' ||
        gameTypeName === 'Quick Shoot' ||
        gameTypeName === 'Drop Game' ||
        gameTypeName === 'Bang!' ||
        gameTypeName === 'Roll'
      ) {
        newTransaction.amount += roomInfo.user_bet;
        message.message =
          `Earned ${convertToCurrency(roomInfo.user_bet)} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      } else if (gameTypeName === 'Mystery Box') {
        newTransaction.amount +=
          roomInfo.host_pr + parseFloat(roomInfo.user_bet);
        message.message =
          `Earned ${convertToCurrency(
            roomInfo.host_pr + parseFloat(roomInfo.user_bet)
          )} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      } else if (gameTypeName === 'Brain Game') {
        newTransaction.amount += roomInfo.host_pr;
        message.message =
          `Earned ${convertToCurrency(roomInfo.host_pr)} from ending ` +
          `${roomInfo.game_type.short_name}-${roomInfo.room_number}`;
      }

      newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo.creator,
        joined_user: roomInfo.creator,
        game_type: roomInfo.game_type,
        bet_amount: roomInfo.host_pr,
        is_anonymous: roomInfo.is_anonymous,
        game_result: -100
      });

      await newGameLog.save();
    }

    roomInfo.creator.balance += newTransaction.amount;
    await roomInfo.creator.save();
    await roomInfo.save();
    await newTransaction.save();

    sendEndedMessageToJoiners(
      roomId,
      roomInfo.creator._id,
      message.message,
      roomInfo.is_anonymous
    );

    const myRooms = await getMyRooms(userId);

    res.json({
      success: true,
      myGames: myRooms.rooms,
      pageSize: myRooms.pageSize,
      newTransaction
    });

    const rooms = await getRoomList(7, 'All');

    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      total: rooms.count,
      roomList: rooms.rooms,
      pageSize: rooms.pageSize
    });
  } catch (err) {
    res.json({
      success: false,
      already_finished: false,
      message: err
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
router.get('/notifications', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const messages = await Notification.find({
      $or: [{ from: userId }, { to: userId }]
    }).populate([
      { path: 'from', model: User },
      { path: 'to', model: User }
    ]).sort({ created_at: -1 }).limit(20);

    const notifications = messages.reduce((acc, message) => {
      const targetUser = message.from && message.from._id.equals(userId)
        ? message.to
        : message.from;

      if (!targetUser) return acc;

      if (
        !acc[targetUser._id] ||
        acc[targetUser._id].updated_at < message.updated_at
      ) {
        acc[targetUser._id] = {
          _id: targetUser._id,
          message: message.message,
          username: targetUser.username,
          avatar: targetUser.avatar,
          accessory: targetUser.accessory,
          room: targetUser.room,
          rank: targetUser.totalWagered,
          created_at: message.created_at,
          created_at_str: moment(message.created_at).format('LLL'),
          updated_at: message.updated_at,
          is_read: false
        };
      }
      return acc;
    }, {});

    const sortedNotifications = Object.values(notifications).sort((a, b) => {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    const recentNotifications = sortedNotifications.slice(0, 10);

    res.json({
      success: true,
      notifications: recentNotifications
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: err.message
    });
  }
});


const decrementUserBalance = async (userId, betAmount) => {
  const user = await User.findOne({ _id: userId });

  // Check if the balance after decrement would be negative
  if (user.balance - betAmount < 0) {
    throw new Error('NOT ENUFF FUNDS AT THIS MEOWMENT');
  }

  user.balance -= betAmount;
  await user.save();
  return user.balance;
};

router.post('/start_brain_game', auth, async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);

    const balance = await decrementUserBalance(userId, req.body.bet_amount);

    res.json({
      success: true,
      balance
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
    });
  }
});

router.post('/start_blackjack', auth, async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);
    const balance = await decrementUserBalance(userId, req.body.bet_amount);

    res.json({
      success: true,
      balance
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
    });
  }
});

router.get('/get_roll_guesses', async (req, res) => {
  try {
    const room = req.query.roomId;
    const recentRolls = await RollBetItem.find({ room: room.roomId })
      .sort({ created_at: -1 })
      .limit(20);
    await RollBetItem.updateMany(
      { _id: { $in: recentRolls.map(item => item._id) } },
      { $set: { status: 'FOUND' } }
    );
    const rolls = recentRolls.map((item) => item.roll);
    const faces = recentRolls.map((item) => item.face);

    // const reversedRolls = rolls.slice().reverse();
    // const reversedFaces = faces.slice().reverse();

    if (req.io.sockets) {
      const socketName = `ROLL_GUESSES_${room.roomId}`;
      req.io.sockets.emit(socketName, { rolls: rolls, faces: faces });
    }

    res.json({
      success: true
    });

  } catch (err) {
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});


router.get('/get_spleesh_guesses', async (req, res) => {
  try {
    const room = req.query.roomId;

    const spleesh_guesses = await SpleeshGuess.find({ room: room.roomId });
    if (req.io.sockets) {
      req.io.sockets.emit('SPLEESH_GUESSES', spleesh_guesses);
    }
    res.json({
      success: true,
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});

router.get('/get_bang_guess', async (req, res) => {
  // console.log("called ")
  try {
    const room = req.query.roomId;
    const recentBangs = await BangBetItem.find({ room: room.roomId })
      .sort({ created_at: -1 })
      .limit(100);

    // Reverse the order of recentBangs
    recentBangs.reverse();

    const bangs = recentBangs.map(bet => bet.bang);
    const elapsedTime = '';
    if (req.io.sockets) {
      const socketName = `BANG_GUESSES_${room.roomId}`;
      req.io.sockets.emit(socketName, { bangs: bangs, elapsedTime });
    }

    res.json({
      success: true
    });

  } catch (err) {
    res.json({
      success: false,
      message: err.toString(),
    });
  }
});


router.post('/start_roll', auth, async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);
    const { roomId, gameType } = req.body;
    const room = await Room.findOne({ _id: roomId });
    const room_number = room.room_number;
    const game_type = await GameType.findOne({ game_type_name: gameType });
    const short_name = game_type.short_name;

    const balance = await decrementUserBalance(userId, req.body.bet_amount);
    const newTransaction = new Transaction({
      user: req.user,
      amount: -req.body.bet_amount,
      description:
        'joined ' +
        short_name +
        '-' +
        room_number,
      room: roomId
    });
    newTransaction.save();

    res.json({
      success: true,
      balance,
      newTransaction: newTransaction,
      // message: 'Tip has been sent. 💸 Yipeee!'
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
    });
  }
});

router.post('/get_notification_room_info', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: new ObjectId(req.body.user_id) });

    await Notification.updateMany(
      {
        is_read: false,
        from: new ObjectId(req.body.user_id),
        to: new ObjectId(req.user._id)
      },
      { $set: { is_read: true } },
      (err, writeResult) => {
        console.log('set messages as read (open chat room)', err);
      }
    );

    const notificationLogs = await Notification.find({
      $or: [
        {
          from: new ObjectId(req.body.user_id),
          to: new ObjectId(req.user._id)
        },
        { from: new ObjectId(req.user._id), to: new ObjectId(req.body.user_id) }
      ]
    }).sort({ created_at: 'asc' });

    let messages = [];
    for (const notificationLog of notificationLogs) {
      const message = {
        from: notificationLog.from,
        to: notificationLog.to,
        message: notificationLog.message,
        // messageContent: chatLog.messageContent,
        created_at: moment(notificationLog.created_at).format('LLL')
      };
      messages.push(message);
    }

    res.json({
      success: true,
      RoomInfo: {
        user_id: user._id,
        avatar: user.avatar,
        rank: user.totalWagered,
        accessory: user.accessory,
        username: user.username,
        notificationLog: messages
      }
    });
  } catch (err) {
    res.json({
      success: false,
      message: err
    });
  }
});

router.post('/get_chat_room_info', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: new ObjectId(req.body.user_id) });

    await Message.updateMany(
      {
        is_read: false,
        from: new ObjectId(req.body.user_id),
        to: new ObjectId(req.user._id)
      },
      { $set: { is_read: true } },
      (err, writeResult) => {
        console.log('set messages as read (open chat room)', err);
      }
    );

    const chatLogs = await Message.find({
      $or: [
        {
          from: new ObjectId(req.body.user_id),
          to: new ObjectId(req.user._id)
        },
        { from: new ObjectId(req.user._id), to: new ObjectId(req.body.user_id) }
      ]
    }).sort({ created_at: 'asc' });

    let messages = [];
    for (const chatLog of chatLogs) {
      const message = {
        from: chatLog.from,
        to: chatLog.to,
        message: chatLog.message,
        // messageContent: chatLog.messageContent,
        created_at: moment(chatLog.created_at).format('LLL')
      };
      messages.push(message);
    }

    res.json({
      success: true,
      chatRoomInfo: {
        user_id: user._id,
        accessory: user.accessory,
        avatar: user.avatar,
        rank: user.totalWagered,
        username: user.username,
        chatLogs: messages
      }
    });
  } catch (err) {
    res.json({
      success: false,
      message: err
    });
  }
});

function check_access_time(user_id) {
  const check_result =
    user_access_log[user_id] && Date.now() - user_access_log[user_id] < 3000
      ? false
      : true;
  user_access_log[user_id] = Date.now();
  return check_result;
}

async function sendEndedMessageToJoiners(roomId, from, message, is_anonymous) {
  let joiners = {};
  const gameLogList = await GameLog.find({ room: new ObjectId(roomId) });
  const now = moment(new Date()).format('LLL');

  gameLogList.forEach(log => {
    if (log.joined_user === from || joiners[log.joined_user]) {
      return;
    }
    joiners[log.joined_user] = 1;
    const temp = new Notification({
      from: new ObjectId(from),
      to: new ObjectId(log.joined_user),
      message: message,
      is_anonymous: is_anonymous,
      is_read: false
    });
    temp.save();
    socket.sendNotification(log.joined_user, {
      from: from,
      to: log.joined_user,
      room: roomId,
      message: message,
      created_at: now
    });
  });
}

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

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    const coHostAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(coHostAmount) || coHostAmount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }

    req.user.balance = req.user.balance || 0;

    if (userBalance < coHostAmount) {
      return res.json({
        success: false,
        message: 'NOT ENUFF FUNDS AT THIS MEOWMENT'
      });
    }

    const description = `Co-hosted room ${gameType.short_name}-${room.room_number}`;

    const existingHostIndex = room.hosts.findIndex(host => host.host.equals(req.user._id));

    // Check if the user is not already the first host
    if (existingHostIndex !== 0) {
      if (existingHostIndex !== -1) {
        room.hosts[existingHostIndex].share += coHostAmount;
      } else {
        room.hosts.push({ host: req.user._id, share: coHostAmount, accessory: req.user.accessory, rank: req.user.totalWagered });
      }

      const newTransactionJ = new Transaction({
        created_at: now,
        user: req.user._id,
        amount: -coHostAmount,
        description
      });

      // Update balances and save transactions
      room.user_bet = parseFloat(room.user_bet) + coHostAmount;
      room.endgame_amount += coHostAmount;
      req.user.balance -= coHostAmount;

      const savePromises = [
        room.save(),
        req.user.save(),
        newTransactionJ.save()
      ];

      await Promise.all(savePromises);

      return res.json({
        success: true,
        balance: req.user.balance,
        newTransaction: newTransactionJ,
        message: 'Bankroll has increased! You are now a Co-Host and share profits/losses with the Host.'
      });
    } else {
      return res.json({
        success: false,
        message: 'Why Co-Host when you are already the Host? Go to "Manage" and Top Up your game instead.'
      });
    }
  } catch (e) {
    console.log('ERROR in top_up_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate coHostAmount'
    });
  }
});

router.post('/topUp', auth, async (req, res) => {
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

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    const topUpAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(topUpAmount) || topUpAmount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }

    req.user.balance = req.user.balance || 0;

    if (userBalance < topUpAmount) {
      return res.json({
        success: false,
        message: 'NOT ENUFF FUNDS AT THIS MEOWMENT'
      });
    }

    const description = `Topped Up room ${gameType.short_name}-${room.room_number}`;


    const newTransactionJ = new Transaction({
      created_at: now,
      user: req.user._id,
      amount: -topUpAmount,
      description
    });

    // Update balances and save transactions
    room.bet_amount += topUpAmount;
    room.user_bet = parseFloat(room.user_bet) + topUpAmount;
    req.user.balance -= topUpAmount;

    const savePromises = [
      room.save(),
      req.user.save(),
      newTransactionJ.save()
    ];

    await Promise.all(savePromises);

    return res.json({
      success: true,
      balance: req.user.balance,
      newTransaction: newTransactionJ,
      message: 'Top Up was successful. Bankroll increased!'
    });
  } catch (e) {
    console.log('ERROR in top_up_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate top-up'
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

    const now = moment().format('LLL');
    const payoutAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(payoutAmount) || payoutAmount < 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }

    if (
      (gameType.short_name === 'MB') &&
      (topUpAmount > room.bet_amount * 4) ||
      (gameType.short_name === 'S!' &&
        room.spleesh_bet_unit === 0.01 &&
        room.endgame_amount < 0.44) ||
      (gameType.short_name === 'S!' &&
        room.spleesh_bet_unit === 0.1 &&
        room.endgame_amount < 4.4) ||
      (gameType.short_name === 'S!' &&
        room.spleesh_bet_unit === 0.001 &&
        room.endgame_amount < 0.044)
    ) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, GAME TOO PROFITABLE!'
      });
    }


    room.endgame_amount = payoutAmount;

    const savePromises = [
      room.save(),
      req.user.save()
    ];

    await Promise.all(savePromises);


    return res.json({
      success: true,
      message: 'Payout settings have been changed.!'
    });
  } catch (e) {
    console.log('ERROR in payout_request', e);
    return res.json({
      success: false,
      message: 'Failed to initiate payout settings'
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

    const now = moment().format('LLL');
    const userBalance = req.user.balance;
    const tipAmount = parseFloat(req.body.amount); // Parse amount as a float

    if (isNaN(tipAmount) || tipAmount <= 0) {
      return res.json({
        success: false,
        message: 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!'
      });
    }
    if (req.user.dailyWithdrawals > 0.02) {
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
      user: userToTip,
      amount: tipAmount,
      description
    });

    // Update balances and save transactions
    userToTip.balance += tipAmount;
    req.user.balance -= tipAmount;

    const savePromises = [
      userToTip.save(),
      req.user.save(),
      newTransactionC.save(),
      newTransactionJ.save()
    ];

    await Promise.all(savePromises);

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

    const savePromises = [
      req.user.save(),
      newTransactionJ.save(),
      duplicatedRoom.save()
    ];

    await Promise.all(savePromises);

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


router.post('/bet', auth, async (req, res) => {
  try {
    const tax = await SystemSetting.findOne({ name: 'commission' });
    const rain = await SystemSetting.findOne({ name: 'rain' });
    const platform = await SystemSetting.findOne({ name: 'platform' });
    const RockType = ['Rock', 'MoonRock', 'QuickBall'];
    const PaperType = [
      'Paper',
      'MoonPaper',
      'Microwave',
      'Tumbledryer',
      'Brain'
    ];
    const ScissorsType = ['Scissors', 'Knife', 'Blender', 'MoonScissors'];
    const BearType = ['Bear', 'MoonBear', 'Gorilla'];
    const BullType = ['Bull', 'MoonBull'];
    const WhaleType = ['Whale', 'MoonWhale', 'Snowman', 'Sledge'];
    function determineGameResult(userSelection, systemSelection) {
      // console.log("userSelection, systemSelection", userSelection, systemSelection)
      const key = {
        win: [
          [RockType, ScissorsType],
          [RockType, BearType],
          [RockType, BullType],
          [PaperType, RockType],
          [PaperType, BearType],
          [ScissorsType, PaperType],
          [ScissorsType, BullType],
          [ScissorsType, WhaleType],
          [BearType, ScissorsType],
          [BullType, BearType],
          [WhaleType, RockType],
          [WhaleType, BullType],
          [WhaleType, BearType]
        ],
        draw: [
          [RockType, RockType],
          [PaperType, PaperType],
          [PaperType, BullType],
          [PaperType, WhaleType],
          [ScissorsType, ScissorsType],
          [BearType, BearType],
          [BullType, BullType],
          [BullType, PaperType],
          [WhaleType, PaperType],
          [WhaleType, WhaleType]
        ],
        lose: [
          [RockType, PaperType],
          [RockType, WhaleType],
          [PaperType, ScissorsType],
          [ScissorsType, RockType],
          [ScissorsType, BearType],
          [BearType, BullType],
          [BearType, PaperType],
          [BearType, RockType],
          [BearType, WhaleType],
          [BullType, RockType],
          [BullType, ScissorsType],
          [BullType, WhaleType],
          [WhaleType, ScissorsType]
        ]
      };

      for (const [userType, systemType] of key.win) {
        if (
          userType.includes(userSelection) &&
          systemType.includes(systemSelection)
        ) {
          return 1; // User wins
        }
      }

      for (const [userType, systemType] of key.draw) {
        if (
          userType.includes(userSelection) &&
          systemType.includes(systemSelection)
        ) {
          return 0; // Draw
        }
      }

      for (const [userType, systemType] of key.lose) {
        if (
          userType.includes(userSelection) &&
          systemType.includes(systemSelection)
        ) {
          return -1; // User loses
        }
      }

      return 0; // Default
    }

    const determineWinnings = async (betAmount, userSelection, systemSelection) => {
      // console.log(betAmount, userSelection, systemSelection)
      const validUserSelections = [
        'Rock',
        'MoonRock',
        'QuickBall',
        'Paper',
        'MoonPaper',
        'Microwave',
        'Tumbledryer',
        'Brain',
        'Scissors',
        'Knife',
        'Blender',
        'MoonScissors',
        'Bear',
        'MoonBear',
        'Gorilla',
        'Bull',
        'MoonBull',
        'Whale',
        'MoonWhale',
        'Snowman',
        'Sledge'
      ];

      if (!validUserSelections.includes(userSelection)) {
        throw new Error('Invalid user selection');
      }

      let multiplier = 1;
      let winnings = betAmount;

      switch (userSelection) {
        case 'Rock':
          if (systemSelection === 'Scissors') {
            multiplier = 4;
          }
          break;

        case 'MoonRock':
          multiplier = 2;
          break;

        case 'Paper':
          break;

        case 'MoonPaper':
          break;

        case 'Scissors':
          break;
        case 'MoonScissors':
          break;
        case 'Bear':
          // console.log("D");

          // Find all items that match the conditions and sort them by updated_at in descending order
          const items = await RpsBetItem.find({
            joiner_rps: { $ne: null },
            room: req.body._id,
            joiner: req.user._id
          }).sort({ updated_at: -1 });

          // let multiplier = 1.0; // Initialize multiplier

          // Iterate through the sorted items
          for (const item of items) {
            const prevResult = determineGameResult(item.joiner_rps, item.rps);

            // console.log("Result:", prevResult);

            if (prevResult === 1) {
              multiplier += 0.1;
              // console.log("Multiplier:", multiplier);
            } else {
              // Break the loop if the result is not 1
              break;
            }
          }

          break;

        case 'MoonBear':
          // console.log("DWD");

          // Find all items that match the conditions and sort them by updated_at in descending order
          const moonBearItems = await RpsBetItem.find({
            joiner_rps: { $ne: null },
            room: req.body._id,
            joiner: req.user._id
          }).sort({ updated_at: -1 });

          let moonBearMultiplier = 1.0; // Initialize multiplier

          // Iterate through the sorted items
          for (const moonBearItem of moonBearItems) {
            const lastResult = determineGameResult(moonBearItem.joiner_rps, moonBearItem.rps);

            // console.log("Result:", lastResult);

            if (lastResult === 1) {
              moonBearMultiplier += 0.2;
              // console.log("Multiplier:", moonBearMultiplier);
            } else {
              // Break the loop if the result is not 1
              break;
            }
          }

          break;

        case 'Bull':
          if (Math.random() < 0.3) {
            multiplier = 1.5;
          }
          break;
        case 'MoonBull':
          if (Math.random() < 0.45) {
            multiplier = 1.5;
          }
          break;
        case 'Whale':
          break;
        case 'MoonWhale':
          multiplier = 2;

          break;
        case 'Microwave':
          const microwaveItems = await RpsBetItem.countDocuments({
            room: req.body._id,
            joiner_rps: { $ne: null },
            joiner: req.user._id
          });

          multiplier = microwaveItems * 0.1;
          break;


        case 'Blender':
          if (Math.random() < 0.05) {
            multiplier = 14;
          } else {
            multiplier = 0.1;

          }
          break;
        case 'QuickBall':
          const lastQuickBallItem = await RpsBetItem.findOne({
            joiner_rps: { $ne: null },
            room: req.body._id,
            joiner: req.user._id
          }).sort({ updated_at: -1 });
          if (lastQuickBallItem.joiner_rps === "QuickBall") {
            multiplier = 2;
          }
          break;
        case 'Knife':
          const knifeUsers = await RpsBetItem.find({
            room: req.body._id,
            joiner_rps: 'Knife',
            joiner: req.user._id
          });

          if (knifeUsers.length === 0) {
            multiplier = 3;
          }
          break;
        case 'Tumbledryer':
          break;
        case 'Brain':
          if (systemSelection === 'Bear' || systemSelection === 'MoonBear') {
            multiplier = 2;
          } else {
            multiplier = 0.5;
          }
          break;
        case 'Gorilla':
          const gorillaItems = await RpsBetItem.find({
            room: req.body._id,
            joiner_rps: { $ne: null },
            joiner: req.user._id
          }).limit(10);

          if (gorillaItems.length <= 10) {
            // Check if any of the rps values are Gorilla
            const hasGorilla = gorillaItems.some(item => item.rps === 'Gorilla');

            // If none of the rps values are Gorilla, set multiplier to 4
            if (!hasGorilla) {
              multiplier = 4;
            }
          }
          break;
        case 'Snowman':
          const snowmanItems = await RpsBetItem.find({
            room: req.body._id,
            joiner_rps: { $ne: null },
            joiner: req.user._id
          });

          if (snowmanItems.length === 0) {
            multiplier = 7;
          } else {
            multiplier = 0.25;
          }
          break;
        case 'Sledge':
          multiplier = betAmount + 1;
          break;
        default:
          // Default case if userSelection doesn't match any specific case
          break;
      }
      // console.log("betAmount / multiplier: ", betAmount, multiplier);
      winnings = betAmount * multiplier;

      return winnings;
    };

    const suits = ['♠', '♣', '♥', '♦'];
    const deck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

    // Function to generate a random card from the deck
    function getRandomCard() {
      const randomSuitIndex = Math.floor(Math.random() * suits.length);
      const randomCardIndex = Math.floor(Math.random() * deck.length);
      return {
        suit: suits[randomSuitIndex],
        card_host: deck[randomCardIndex],
      };
    }

    // Function to calculate the value of a card
    function getCardValue(card, currentScore) {
      if (card.card_host === 'A') {
        // Handle Ace as 11 or 1 based on the current score
        return currentScore + 11 <= 21 ? 11 : 1;
      } else if (['K', 'Q', 'J'].includes(card.card_host)) {
        // Face cards are worth 10 points
        return 10;
      } else {
        // Numeric cards are worth their face value
        return parseInt(card.card_host);
      }
    }

    // Function to update host's score and return the updated score
    function updateHostScore(currentScoreHost, currentScore) {
      const card = getRandomCard();
      const cardValue = getCardValue(card, currentScoreHost);

      // Update the score_host and add the card to an array
      currentScoreHost += cardValue;

      return {
        newScoreHost: currentScoreHost,
        card: { ...card, value: cardValue }, // Include the card along with its value
      };
    }

    const start = new Date();
    if (req.body._id) {
      if (req.user.dailyWithdrawals > 0.02) {
        res.json({
          success: false,
          message: 'illregular action',
          betResult: -1000
        });

        return;
      }
      if (!check_access_time(req.user._id)) {
        res.json({
          success: false,
          message: 'illregular action',
          betResult: -1000
        });

        return;
      }

      roomInfo = await Room.findOne({ _id: req.body._id })
        .populate({ path: 'creator', model: User })
        .populate({ path: 'game_type', model: GameType });

      if (roomInfo['creator']._id === req.user._id) {
        res.json({
          success: false,
          message: `YOU'VE CAT TO BE KITTEN ME! DIS YOUR OWN GAME!`,
          betResult: -101
        });

        return;
      }

      if (roomInfo['status'] === 'finished') {
        res.json({
          success: false,
          message: 'THIS BATTLE HAS NOW ENDED',
          betResult: -100
        });

        return;
      }

      const creatorUser = await User.findOne({
        _id: roomInfo['creator']._id
      }).select('accessory');
      const accessory = creatorUser.accessory;
      let item;

      if (accessory) {
        item = await Item.findOne({ image: accessory }).select('CP');
      } else {
        item = { CP: tax.value };
      }
      const commission = item.CP;

      newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo['creator'],
        joined_user: req.user,
        game_type: roomInfo['game_type'],
        bet_amount: roomInfo['bet_amount'],
        is_anonymous: req.body.is_anonymous
      });

      newTransactionC = new Transaction({
        user: roomInfo['creator'],
        amount: 0,
        description:
          'auto-payout in ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'],
        room: req.body._id
      });
      newTransactionJ = new Transaction({
        user: req.user,
        amount: 0,
        description:
          'joined ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'],
        room: req.body._id
      });

      // if (req.body.is_anonymous == true) {
      //   req.user['balance'] -= 10;
      //   newTransactionJ.amount -= 10;
      // }

      let message = new Notification({
        from: req.user,
        to: roomInfo['creator'],
        room: req.body._id,
        message: '',
        is_anonymous: req.body.is_anonymous,
        is_read: false
      });

      if (roomInfo['game_type']['game_type_name'] === 'RPS') {
        if (
          parseFloat(req.body.bet_amount) > parseFloat(roomInfo['user_bet']) ||
          parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)
        ) {
          // Return an error or some other response to the user, e.g.:
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        const availableBetItem = await RpsBetItem.findOne({
          room: req.body._id,
          joiner_rps: ''
        });
        let bet_item = availableBetItem;

        if (!bet_item) {

          if (roomInfo['rps_game_type'] === 0) {
            const allBetItems = await RpsBetItem.find({
              room: new ObjectId(req.body._id)
            });
            const nextItem = predictNext(allBetItems);
            bet_item = new RpsBetItem({
              room: new ObjectId(req.body._id),
              rps: nextItem
            });
            await bet_item.save();
          }
        }


        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        newGameLog.selected_rps = req.body.selected_rps;
        // console.log('bet_item.rps', bet_item.rps);
        // console.log('req.body.selected_rps', req.body.selected_rps);
        if (roomInfo['rps_game_type'] === 0) {

          newTransactionJ.amount -= parseFloat(req.body.bet_amount);
          if (
            (bet_item.rps === 'R' && req.body.selected_rps == 'P') ||
            (bet_item.rps === 'P' && req.body.selected_rps == 'S') ||
            (bet_item.rps === 'S' && req.body.selected_rps == 'R')
          ) {
            // console.log('win')

            newGameLog.game_result = 1;
            newTransactionJ.amount +=
              parseFloat(req.body.bet_amount) * 2 * ((100 - commission) / 100);

            newGameLog.commission =
              parseFloat(req.body.bet_amount) * 2 * ((commission - 0.5) / 100);

            // update rain
            rain.value =
              parseFloat(rain.value) +
              parseFloat(req.body.bet_amount) * 2 * ((commission - 0.5) / 100);

            rain.save();

            // update platform stat (0.5%)
            platform.value =
              parseFloat(platform.value) +
              parseFloat(req.body.bet_amount) * 2 * (tax.value / 100);
            platform.save();

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATE_RAIN', {
                rain: rain.value
              });
            }

            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

            roomInfo['host_pr'] -= parseFloat(req.body.bet_amount);
            roomInfo['user_bet'] -= parseFloat(req.body.bet_amount);

            // update bankroll
            if (roomInfo['user_bet'] != 0) {
              roomInfo['user_bet'] =
                parseFloat(roomInfo['user_bet']) +
                parseFloat(req.body.bet_amount) *
                2 *
                ((commission - 0.5) / 100);
            }

            message.message =
              'Won ' +
              // bet_item.bet_amount * 2 +
              convertToCurrency(req.body.bet_amount * 2) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else if (bet_item.rps === req.body.selected_rps) {
            // console.log('draw')

            newGameLog.game_result = 0;

            newTransactionJ.amount += parseFloat(req.body.bet_amount);
            message.message =
              'Split ' +
              convertToCurrency(req.body.bet_amount * 2) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else {
            // console.log('loss')

            newGameLog.game_result = -1;

            roomInfo.host_pr =
              (parseFloat(roomInfo.host_pr) || 0) +
              parseFloat(req.body.bet_amount);
            roomInfo.user_bet =
              (parseFloat(roomInfo.user_bet) || 0) +
              parseFloat(req.body.bet_amount);

            if (
              roomInfo['endgame_type'] &&
              roomInfo['user_bet'] >= roomInfo['endgame_amount']
            ) {
              newTransactionC.amount +=
                parseFloat(roomInfo['user_bet']) -
                parseFloat(roomInfo['endgame_amount']);

              const newGameLogC = new GameLog({
                room: roomInfo,
                creator: roomInfo['creator'],
                joined_user: roomInfo['creator'],
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['host_pr'],
                user_bet: roomInfo['user_bet'],
                is_anonymous: roomInfo['is_anonymous'],
                game_result: 3
              });
              await newGameLogC.save();
              roomInfo['user_bet'] = parseFloat(
                roomInfo['endgame_amount']
              ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
            }

            message.message =
              'Lost ' +
              convertToCurrency(req.body.bet_amount) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          }
          newGameLog.winnings = convertToCurrency(req.body.bet_amount) * 2;
        } else {
          // RRPS Starts here
          const userSelection = req.body.selected_rps;
          const systemSelection = bet_item.rps;
          result = determineGameResult(userSelection, systemSelection);
          // console.log("result", result);
          if (systemSelection === 'MoonRock') {
            result = -1;
          }
          if (result === 0) {
            if (userSelection === 'Paper') {
              if (Math.random() < 0.5) {
                result = 1; // 50% chance to change result to 1
              }
            } else if (userSelection === 'MoonPaper') {
              if (Math.random() < 0.6) {
                result = 1; // 60% chance to change result to 1
              }
            } else if (systemSelection === 'Paper') {
              if (Math.random() < 0.5) {
                result = -1; // 50% chance to change result to -1
              }
            } else if (systemSelection === 'MoonPaper') {
              if (Math.random() < 0.6) {
                result = -1; // 60% chance to change result to -1
              }
            }
          }
          // console.log("result2", result);

          const tumbledryerItems = await RpsBetItem.find({
            room: req.body._id,
            joiner_rps: { $ne: null },
            joiner: req.user._id,
            rps: 'Bear'
          });

          if (userSelection === 'Tumbledryer') {
            for (const item of tumbledryerItems) {
              const tumbleResult = determineGameResult(item.joiner_rps, item.rps);

              if (tumbleResult === 1) {
                if (userSelection === 'Tumbledryer' && (systemSelection === 'Whale' || systemSelection === 'MoonWhale')) {
                  result = 1;
                }
              }
            }
          }
          // console.log("result3", result);

          if (result === 1) {
            winnings = await determineWinnings(
              parseFloat(req.body.bet_amount),
              userSelection,
              systemSelection
            );
            const lastGame = await RpsBetItem.findOne({
              joiner_rps: { $ne: null },
              room: req.body._id,
              joiner: req.user._id
            }).sort({ updated_at: -1 });
            if (lastGame) {
              if (lastGame.joiner_rps === "Scissors" && (lastGame.rps === 'Rock' || lastGame.rps === 'MoonRock')) {
                winnings *= 2;
              } else if (lastGame.joiner_rps === "MoonScissors" && (lastGame.rps === 'Rock' || lastGame.rps === 'MoonRock')) {
                winnings *= 3;
              }
            }

            newGameLog.game_result = 1;
            newTransactionJ.amount += winnings * ((100 - commission) / 100);

            newGameLog.commission = winnings * ((commission - 0.5) / 100);

            // update rain
            rain.value =
              parseFloat(rain.value) + winnings * ((commission - 0.5) / 100);

            rain.save();

            // update platform stat (0.5%)
            platform.value =
              parseFloat(platform.value) + winnings * (tax.value / 100);
            platform.save();

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATE_RAIN', {
                rain: rain.value
              });
            }

            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

            roomInfo['host_pr'] -= winnings;
            roomInfo['user_bet'] -= winnings;

            // update bankroll
            if (roomInfo['user_bet'] != 0) {
              roomInfo['user_bet'] =
                parseFloat(roomInfo['user_bet']) +
                winnings * ((commission - 0.5) / 100);
            }

            message.message =
              'Won ' +
              // bet_item.bet_amount * 2 +
              convertToCurrency(winnings) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else if (result === 0) {
            newGameLog.game_result = 0;
            newTransactionJ.amount += parseFloat(req.body.bet_amount);
            message.message =
              'Split ' +
              convertToCurrency(req.body.bet_amount * 2) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else {
            winnings = await determineWinnings(
              parseFloat(req.body.bet_amount),
              systemSelection,
              userSelection
            );

            if (userSelection === "Whale" || userSelection === "MoonWhale") {
              winnings = winnings / 2
            }

            // winnings = winnings * 2
            newGameLog.game_result = -1;
            if (req.user.balance - winnings < 0) {

              newTransactionJ.amount -= req.user.balance
              roomInfo.host_pr =
                (parseFloat(roomInfo.host_pr) || 0) +
                parseFloat(req.user.balance);
              roomInfo.user_bet =
                (parseFloat(roomInfo.user_bet) || 0) +
                parseFloat(req.user.balance);

            } else {
              newTransactionJ.amount -= winnings;
              roomInfo.host_pr =
                (parseFloat(roomInfo.host_pr) || 0) +
                parseFloat(winnings);
              roomInfo.user_bet =
                (parseFloat(roomInfo.user_bet) || 0) +
                parseFloat(winnings);
            }

            if (
              roomInfo['endgame_type'] &&
              roomInfo['user_bet'] >= roomInfo['endgame_amount']
            ) {
              newTransactionC.amount +=
                parseFloat(roomInfo['user_bet']) -
                parseFloat(roomInfo['endgame_amount']);

              const newGameLogC = new GameLog({
                room: roomInfo,
                creator: roomInfo['creator'],
                joined_user: roomInfo['creator'],
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['host_pr'],
                user_bet: roomInfo['user_bet'],
                is_anonymous: roomInfo['is_anonymous'],
                game_result: 3
              });
              await newGameLogC.save();
              roomInfo['user_bet'] = parseFloat(
                roomInfo['endgame_amount']
              ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
            }

            message.message =
              'Lost ' +
              convertToCurrency(req.body.bet_amount) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          }

        }
        if (roomInfo['rps_game_type'] === 0) {
          winnings = parseFloat(req.body.bet_amount) * 2;
        }
        // console.log("final winnings")
        // console.log("final winnings", winnings)
        newGameLog.winnings = winnings;
        bet_item.joiner = req.user;
        bet_item.joiner_rps = req.body.selected_rps;
        await bet_item.save();
        if (roomInfo['rps_game_type'] === 0) {
          const lastFiveBetItems = await RpsBetItem.find({
            room: req.body._id,
            joiner_rps: { $exists: true, $ne: '' }
          })
            .sort({ created_at: 'desc' })
            .limit(5);
          // Reverse the order of lastFiveBetItems
          const reversedLastFiveBetItems = lastFiveBetItems.slice().reverse();

          if (req.io.sockets && reversedLastFiveBetItems.length > 0) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet'],
              rps: reversedLastFiveBetItems
            });
          }
        } else {
          const lastFiveBetItems = await RpsBetItem.find({
            room: req.body._id
          });
          const rps = lastFiveBetItems
            .filter(item => item.joiner_rps !== '')
            .slice(-5);
          if (rps.length > 0 && req.io) {
            req.io.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet'],
              rps: rps
            });
          }
          const nextItem = await RpsBetItem.findOne({
            room: req.body._id,
            joiner_rps: ''
          });
          if (nextItem) {
            await nextItem.save();
          } else {
            roomInfo.status = 'finished';
          }
        }

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newGameLogC = new GameLog({
            room: roomInfo,
            creator: roomInfo['creator'],
            joined_user: roomInfo['creator'],
            game_type: roomInfo['game_type'],
            bet_amount: roomInfo['host_pr'],
            user_bet: roomInfo['user_bet'],
            is_anonymous: roomInfo['is_anonymous'],
            game_result: -100
          });
          await newGameLogC.save();
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Quick Shoot') {

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        if (
          parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1) +
          parseFloat(req.body.bet_amount) -
          (roomInfo['qs_game_type'] - 1) * parseFloat(roomInfo['user_bet']) >
          parseFloat(roomInfo['user_bet']) ||
          parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)
        ) {
          // Return an error or some other response to the user, e.g.:
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        const availableBetItem = await QsBetItem.findOne({
          _id: req.body.qs_bet_item_id,
          joiner_qs: ''
        });

        let bet_item = availableBetItem;
        if (bet_item) {
          // Get next available item
          bet_item = await QsBetItem.findOne({
            room: new ObjectId(req.body._id),
            joiner_qs: ''
          }).sort({ _id: 'asc' });
        } else {
          // Create new QsBetItem with predicted qs value
          const allBetItems = await QsBetItem.find({
            room: new ObjectId(req.body._id)
          });

          const nextItem = predictNextQs(allBetItems, roomInfo['qs_game_type']);
          bet_item = new QsBetItem({
            room: new ObjectId(req.body._id),
            qs: nextItem
          });

          await bet_item.save();
        }
        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }
        newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        newGameLog.selected_qs_position = req.body.selected_qs_position;

        if (Number(bet_item.qs) === req.body.selected_qs_position) {
          newGameLog.game_result = -1;

          roomInfo['user_bet'] =
            parseFloat(roomInfo['user_bet']) + parseFloat(req.body.bet_amount);
          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['host_pr'],
              user_bet: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo['user_bet'] = parseFloat(
              roomInfo['endgame_amount']
            ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL_QS', {
              bankroll: roomInfo['user_bet'],
              qs: bet_item.qs
            });
          }

          bet_item.joiner = req.user;
          bet_item.joiner_qs = req.body.selected_qs;
          await bet_item.save();

          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = 1;
          newTransactionJ.amount +=
            (parseFloat(req.body.bet_amount) +
              parseFloat(req.body.bet_amount) /
              (roomInfo['qs_game_type'] - 1)) *
            ((100 - commission) / 100);
          roomInfo['host_pr'] -=
            parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1);
          roomInfo['user_bet'] -=
            parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1);

          // if (req.io.sockets) {
          //   req.io.sockets.emit('UPDATED_BANKROLL_QS', {
          //     bankroll: roomInfo['user_bet']
          //   });
          // }

          newGameLog.commission =
            (parseFloat(req.body.bet_amount) +
              parseFloat(req.body.bet_amount) /
              (roomInfo['qs_game_type'] - 1)) *
            ((commission - 0.5) / 100);

          // update rain
          rain.value =
            parseFloat(rain.value) +
            (parseFloat(req.body.bet_amount) +
              parseFloat(req.body.bet_amount) /
              (roomInfo['qs_game_type'] - 1)) *
            ((commission - 0.5) / 100);

          rain.save();

          // update platform stat (0.5%)
          platform.value =
            parseFloat(platform.value) +
            (parseFloat(req.body.bet_amount) +
              parseFloat(req.body.bet_amount) /
              (roomInfo['qs_game_type'] - 1)) *
            (tax.value / 100);

          platform.save();

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATE_RAIN', {
              rain: rain.value
            });
          }

          // update bankroll
          if (roomInfo['user_bet'] != 0) {
            roomInfo['user_bet'] =
              parseFloat(roomInfo['user_bet']) +
              (parseFloat(req.body.bet_amount) +
                parseFloat(req.body.bet_amount) /
                (roomInfo['qs_game_type'] - 1)) *
              ((commission - 0.5) / 100);

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL_QS', {
                bankroll: roomInfo['user_bet'],
                qs: bet_item.qs
              });
            }
          }
          message.message =
            'Won ' +
            convertToCurrency(
              parseFloat(req.body.bet_amount) /
              parseFloat(roomInfo['qs_game_type'] - 1) +
              parseFloat(req.body.bet_amount)
            ) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }

        bet_item.joiner = req.user;
        bet_item.joiner_qs = req.body.selected_qs_position;
        await bet_item.save();

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newGameLogC = new GameLog({
            room: roomInfo,
            creator: roomInfo['creator'],
            joined_user: roomInfo['creator'],
            game_type: roomInfo['game_type'],
            bet_amount: roomInfo['host_pr'],
            user_bet: roomInfo['user_bet'],
            is_anonymous: roomInfo['is_anonymous'],
            game_result: -100
          });
          await newGameLogC.save();
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Drop Game') {
        if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        const availableBetItem = await DropBetItem.findOne({
          _id: req.body.drop_bet_item_id,
          joiner_drop: ''
        });

        let bet_item = availableBetItem;
        if (bet_item) {
          // Get next available item
          bet_item = await DropBetItem.findOne({
            room: new ObjectId(req.body._id),
            joiner_drop: ''
          }).sort({ _id: 'asc' });
        } else {
          const allBetItems = await DropBetItem.find({
            room: new ObjectId(req.body._id)
          });
          let nextItem = predictNextDrop(allBetItems);

          if (nextItem > roomInfo['user_bet']) {
            nextItem = roomInfo['user_bet'];
          }

          bet_item = new DropBetItem({
            room: new ObjectId(req.body._id),
            drop: nextItem
          });

          await bet_item.save();
        }

        newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        if (bet_item.drop < req.body.bet_amount) {
          newGameLog.selected_drop = bet_item.drop;
          newGameLog.game_result = 1;
          newTransactionJ.amount +=
            (parseFloat(req.body.bet_amount) + bet_item.drop) *
            ((100 - commission) / 100);
          newGameLog.commission =
            (parseFloat(req.body.bet_amount) + bet_item.drop) *
            ((commission - 0.5) / 100);

          // update rain
          rain.value =
            parseFloat(rain.value) +
            (parseFloat(req.body.bet_amount) + bet_item.drop) *
            ((commission - 0.5) / 100);

          rain.save();

          // update platform stat (0.5%)
          platform.value =
            parseFloat(platform.value) +
            (parseFloat(req.body.bet_amount) + bet_item.drop) *
            (tax.value / 100);
          platform.save();

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATE_RAIN', {
              rain: rain.value
            });
          }

          roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

          roomInfo['host_pr'] -= bet_item.drop;
          roomInfo['user_bet'] -= bet_item.drop;
          // update bankroll
          if (roomInfo['user_bet'] != 0) {
            roomInfo['user_bet'] =
              parseFloat(roomInfo['user_bet']) +
              (parseFloat(req.body.bet_amount) + bet_item.drop) *
              ((commission - 0.5) / 100);
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          // Save the new drop guess
          const newDropGuess = new DropGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_drop: bet_item.drop
          });
          await newDropGuess.save();

          newGameLog.room.bet_amount = bet_item.drop;

          const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('DROP_GUESSES', guesses);
          }

          message.message =
            'Won ' +
            // bet_item.bet_amount * 2 +
            convertToCurrency(bet_item.drop) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else if (bet_item.drop === req.body.bet_amount) {
          newGameLog.game_result = 0;

          newTransactionJ.amount += parseFloat(req.body.bet_amount);
          // Save the new drop guess
          const newDropGuess = new DropGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_drop: bet_item.drop
          });
          await newDropGuess.save();
          const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('DROP_GUESSES', guesses);
          }

          message.message =
            'Split ' +
            convertToCurrency(req.body.bet_amount * 2) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = -1;

          roomInfo.host_pr =
            (parseFloat(roomInfo.host_pr) || 0) +
            parseFloat(req.body.bet_amount);
          roomInfo.user_bet =
            (parseFloat(roomInfo.user_bet) || 0) +
            parseFloat(req.body.bet_amount);

          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          // Save the new drop guess
          const newDropGuess = new DropGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_drop: bet_item.drop
          });
          await newDropGuess.save();
        }
        const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
          created_at: 'ascending'
        });
        if (req.io.sockets) {
          req.io.sockets.emit('DROP_GUESSES', guesses);
        }

        bet_item.joiner = req.user;
        bet_item.joiner_drop = req.body.bet_amount;
        await bet_item.save();

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newGameLogC = new GameLog({
            room: roomInfo,
            creator: roomInfo['creator'],
            joined_user: roomInfo['creator'],
            game_type: roomInfo['game_type'],
            bet_amount: roomInfo['host_pr'],
            user_bet: roomInfo['user_bet'],
            is_anonymous: roomInfo['is_anonymous'],
            game_result: -100
          });
          await newGameLogC.save();
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Bang!') {
        if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
          // Return an error or some other response to the user, e.g.:
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        const cashoutAmount = req.body.multiplier * req.body.bet_amount;

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        newGameLog.cashoutAmount = cashoutAmount;

        newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        const bet_item = await BangBetItem.findOne({
          room: roomInfo,
          bang: { $ne: '' }
        })
          .sort({ _id: 'desc' })
          .limit(1);
        console.log("bet_item", bet_item);
        console.log("bet_amount", req.body.bet_amount);
        console.log("crashed", req.body.crashed)
        console.log("multiplier", req.body.multiplier)
        
        console.log("cashoutAmount", cashoutAmount)

        if (!req.body.crashed && req.body.multiplier <= bet_item.bang) {

          newGameLog.game_result = 1;
          if (
            parseFloat(roomInfo['user_bet']) -
            cashoutAmount >
            0
          ) {
            console.log("win1 bankroll enough")
            newTransactionJ.amount +=
              cashoutAmount *
              ((100 - commission) / 100);


            roomInfo['host_pr'] -=
              cashoutAmount;
            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - 
              cashoutAmount;


            message.message =
              'Won ' +
              convertToCurrency(cashoutAmount
              ) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else {
            // console.log("win1 end")

            newTransactionJ.amount +=
              parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            roomInfo.status = 'finished';

            roomInfo['user_bet'] = 0;
            roomInfo['host_pr'] = 0;

            const newBangGuess = new BangGuess({
              room: roomInfo._id,
              bet_amount: newGameLog.bet_amount,
              host_bang: bet_item.bang
            });
            await newBangGuess.save();


            const guesses = await BangGuess.find({ room: roomInfo._id }).sort({
              created_at: 'ascending'
            });
            if (req.io.sockets) {
              req.io.sockets.emit('BANG_GUESSES', guesses);
            }
            message.message =
              'Won ' +
              convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['host_pr'],
              user_bet: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: -100
            });
            await newGameLogC.save();
          }
          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

        } else {
          newGameLog.game_result = -1;
          console.log("crashed / loss")

          roomInfo.host_pr =
            (parseFloat(roomInfo.host_pr) || 0) +
            parseFloat(req.body.bet_amount);
          roomInfo.user_bet =
            (parseFloat(roomInfo.user_bet) || 0) +
            parseFloat(req.body.bet_amount);

          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newBangGuess = new BangGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_bang: bet_item.bang
          });
          await newBangGuess.save();
        }
        const guesses = await BangGuess.find({ room: roomInfo._id }).sort({
          created_at: 'ascending'
        });
        if (req.io.sockets) {
          req.io.sockets.emit('BANG_GUESSES', guesses);
        }

        bet_item.joiner = req.user;
        bet_item.joiner_bang = req.body.bet_amount;
        await bet_item.save();

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }


      } else if (roomInfo['game_type']['game_type_name'] === 'Roll') {
        if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {

          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        // newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        const recentItems = await RollBetItem.find({ room: roomInfo._id, status: 'FOUND' })
          .sort({ created_at: -1 }) // Sort in descending order based on created_at
          .limit(20);


        const reversedRecentItems = recentItems.slice().reverse();

        const faces = recentItems.map((item) => item.face);
        // console.log(faces)
        const bet_item = recentItems[14];

        if (bet_item.face === req.body.selected_roll) {
          newGameLog.multiplier = bet_item.roll;
          newGameLog.game_result = 1;

          if (
            roomInfo['user_bet'] -
            parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll) >
            0
          ) {
            newTransactionJ.amount +=
              parseFloat(req.body.bet_amount) *
              parseFloat(bet_item.roll) *
              ((100 - commission) / 100);

            roomInfo['user_bet'] -= (parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll));

            roomInfo['host_pr'] -=
              (parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll));

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            message.message =
              'Won ' +
              convertToCurrency(
                parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll)
              ) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else {
            newTransactionJ.amount +=
              parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            roomInfo.status = 'finished';
            message.message =
              'Won ' +
              convertToCurrency(parseFloat(roomInfo['user_bet'])) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];

            roomInfo['user_bet'] = 0;
            roomInfo['host_pr'] = 0;
          }
          const newRollGuess = new RollGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_roll: bet_item.roll
          });
          await newRollGuess.save();

          newGameLog.multiplier = bet_item.roll;

          const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('ROLL_GUESSES', guesses);
          }
        } else if (
          (bet_item.face === 'R' && req.body.selected_roll == 'P') ||
          (bet_item.face === 'P' && req.body.selected_roll == 'S') ||
          (bet_item.face === 'S' && req.body.selected_roll == 'R')
        ) {
          newGameLog.multiplier = 4;
          newGameLog.game_result = 1;

          if (roomInfo['user_bet'] - parseFloat(req.body.bet_amount) * 4 > 0) {
            newTransactionJ.amount +=
              parseFloat(req.body.bet_amount) *
              4 *
              ((100 - commission) / 100);

            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

            roomInfo['host_pr'] -= (parseFloat(req.body.bet_amount) * 4);
            roomInfo['user_bet'] -= (parseFloat(req.body.bet_amount) * 4);

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            message.message =
              'Won ' +
              convertToCurrency(parseFloat(req.body.bet_amount) * 4) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
          } else {
            newTransactionJ.amount +=
              parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            roomInfo.status = 'finished';
            message.message =
              'Won ' +
              // bet_item.bet_amount * 2 +
              convertToCurrency(parseFloat(roomInfo['user_bet'])) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];

            roomInfo['user_bet'] = 0;
            roomInfo['host_pr'] = 0;
          }
          const newRollGuess = new RollGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_roll: 4
          });
          await newRollGuess.save();

          newGameLog.multiplier = 4;

          const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('ROLL_GUESSES', guesses);
          }
        } else {
          newGameLog.game_result = -1;

          roomInfo.host_pr =
            (parseFloat(roomInfo.host_pr) || 0) +
            parseFloat(req.body.bet_amount);
          roomInfo.user_bet =
            (parseFloat(roomInfo.user_bet) || 0) +
            parseFloat(req.body.bet_amount);



          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newRollGuess = new RollGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_roll: bet_item.roll
          });
          await newRollGuess.save();
        }
        const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
          created_at: 'ascending'
        });
        if (req.io.sockets) {
          req.io.sockets.emit('ROLL_GUESSES', guesses);
        }

        bet_item.joiner = req.user;
        bet_item.joiner_roll = req.body.bet_amount;
        await bet_item.save();

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newGameLogC = new GameLog({
            room: roomInfo,
            creator: roomInfo['creator'],
            joined_user: roomInfo['creator'],
            game_type: roomInfo['game_type'],
            bet_amount: roomInfo['host_pr'],
            user_bet: roomInfo['user_bet'],
            is_anonymous: roomInfo['is_anonymous'],
            game_result: -100
          });
          await newGameLogC.save();
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Spleesh!') {
        if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
          // Return an error or some other response to the user, e.g.:
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }

        newTransactionJ.amount -= req.body.bet_amount;
        newGameLog.bet_amount = req.body.bet_amount;
        newGameLog.host_pr = roomInfo['host_pr'];

        if (roomInfo.pr === req.body.bet_amount) {
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(parseFloat(roomInfo['user_bet'])) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newGameLog.commission =
            (parseFloat(roomInfo['user_bet']) + roomInfo['bet_amount']) *
            ((commission - 0.5) / 100);

          rain.value =
            parseFloat(rain.value) +
            (parseFloat(roomInfo['user_bet']) + roomInfo['bet_amount']) *
            ((commission - 0.5) / 100);

          rain.save();

          // update platform stat (0.5%)
          platform.value =
            parseFloat(platform.value) +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) * (tax.value / 100);
          platform.save();

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATE_RAIN', {
              rain: rain.value
            });
          }


          // console.log("wirth", (roomInfo['host_pr'] + (2 * roomInfo['bet_amount'])) *
          // ((100 - commission) / 100))
          // console.log("wirthout", (roomInfo['host_pr'] + roomInfo['bet_amount']))

          // joiner winnings
          newTransactionJ.amount +=
            (roomInfo['host_pr'] + (2 * roomInfo.pr)) *
            ((100 - commission) / 100);

          // update bankroll
          if (parseFloat(roomInfo['user_bet']) !== 0) {
            roomInfo['user_bet'] =
              parseFloat(roomInfo['user_bet']) -
              (roomInfo['host_pr'] + roomInfo.pr);
          }


          // update host_pr
          if (parseFloat(roomInfo['host_pr']) !== 0) {
            roomInfo['host_pr'] = 0;
          }


          let newBetAmount;
          let attemptCount = 0;

          if (roomInfo.spleesh_bet_unit === 0.01) {
            do {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
              attemptCount++;
            } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
          } else if (roomInfo.spleesh_bet_unit === 0.1) {
            do {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
              attemptCount++;
            } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
          } else {
            do {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
              attemptCount++;
            } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
          }

          if (newBetAmount <= parseFloat(roomInfo['user_bet'])) {

            // restart game
            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - newBetAmount;
            roomInfo.pr = newBetAmount;
            roomInfo['host_pr'] = 0;

            // Reset the spleesh guess array
            SpleeshGuess.deleteMany({ room: roomInfo._id }, function (err) {
              if (err) {
                console.log(err);
              }
            });
            const guesses = await SpleeshGuess.find({ room: roomInfo._id }).sort({
              created_at: 'ascending'
            });
            if (req.io.sockets) {
              req.io.sockets.emit('SPLEESH_GUESSES', guesses);
            }

          } else {
            newTransactionC.amount += parseFloat(roomInfo['user_bet']);
            roomInfo.status = 'finished';

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['bet_amount'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: -100
            });
            await newGameLogC.save();
          }
        } else {
          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newGameLog.game_result = -1;

          roomInfo['host_pr'] += req.body.bet_amount;
          roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) + req.body.bet_amount;

          const newSpleeshGuess = new SpleeshGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount
          });
          await newSpleeshGuess.save();

          if (!roomInfo.joiners.includes(req.user)) {
            roomInfo.joiners.addToSet(req.user);
            await roomInfo.save();
          }

          if (
            (roomInfo['endgame_type'] &&
              (roomInfo['host_pr'] + roomInfo.pr)) >= roomInfo['endgame_amount']
          ) {
            // console.log("endgame exec", roomInfo['host_pr']);

            newTransactionC.amount +=
              (parseFloat(roomInfo['user_bet']) -
                parseFloat(roomInfo['endgame_amount']));
            roomInfo['user_bet'] =
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['host_pr'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();

            // Randomize the new bet amount
            let newBetAmount;

            if (roomInfo.spleesh_bet_unit === 0.01) {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
              while (newBetAmount > roomInfo['user_bet']) {
                newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
              }
            } else if (roomInfo.spleesh_bet_unit === 0.1) {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
              while (newBetAmount > roomInfo['user_bet']) {
                newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
              }
            } else {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
              while (newBetAmount > roomInfo['user_bet']) {
                newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
              }
            }

            roomInfo.pr = newBetAmount;
            roomInfo['host_pr'] = 0;
            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - newBetAmount;

            SpleeshGuess.deleteMany({ room: roomInfo._id }, function (err) {
              if (err) {
                console.log(err);
              }
            });
          }
        }

        const guesses = await SpleeshGuess.find({ room: roomInfo._id }).sort({
          created_at: 'ascending'
        });
        if (req.io.sockets) {
          req.io.sockets.emit('SPLEESH_GUESSES', guesses);
        }

      } else if (roomInfo['game_type']['game_type_name'] === 'Mystery Box') {
        let selected_box = await RoomBoxPrize.findOne({
          _id: new ObjectId(req.body.selected_id)
        }).populate({ path: 'joiner', model: User });
        selected_box.status = 'opened';
        selected_box.joiner = req.user;
        await selected_box.save();

        newGameLog.game_result = selected_box.box_prize;
        newGameLog.bet_amount = req.body.bet_amount;

        if (selected_box.box_price > req.user.balance) {
          return res.json({
            success: false,
            message: "NOT ENUFF FUNDS AT THIS MEOWMENT"
          });
        }
        newTransactionJ.amount -= selected_box.box_price;
        newTransactionJ.amount +=
          selected_box.box_prize * ((100 - commission) / 100);

        newGameLog.commission =
          selected_box.box_prize * ((commission - 0.5) / 100);

        // update rain
        rain.value =
          parseFloat(rain.value) +
          selected_box.box_prize * ((commission - 0.5) / 100);

        rain.save();

        // update platform stat (0.5%)
        platform.value =
          parseFloat(platform.value) +
          selected_box.box_prize * (tax.value / 100);
        platform.save();

        if (req.io.sockets) {
          req.io.sockets.emit('UPDATE_RAIN', {
            rain: rain.value
          });
        }

        // update bankroll
        roomInfo['user_bet'] =
          parseFloat(roomInfo['user_bet']) +
          selected_box.box_prize * ((commission - 0.5) / 100);

        if (selected_box.box_prize === 0) {
          message.message =
            'Lost ' +
            convertToCurrency(selected_box.box_price) +
            ' opening an empty box in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          message.message =
            'Won ' +
            convertToCurrency(selected_box.box_prize) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }

        opened_amount = 0;
        box_list = await RoomBoxPrize.find({ room: roomInfo });
        max_prize = 0;
        lowest_box_price = -1;
        new_host_pr = 0;

        box_list.forEach(box => {
          if (box.status === 'opened') {
            new_host_pr += box.box_price;
          } else {
            new_host_pr += box.box_prize;

            if (lowest_box_price === -1 || lowest_box_price > box.box_price) {
              lowest_box_price = box.box_price;
            }

            if (max_prize < box.box_prize) {
              max_prize = box.box_prize;
            }
          }
        });

        // Retrieve the updated box list data from the database
        const updatedBoxList = await RoomBoxPrize.find({ room: roomInfo });

        // Emit the updated box list data to the connected clients
        if (req.io.sockets) {
          req.io.sockets.emit('UPDATED_BOX_LIST', {
            box_list: updatedBoxList
          });
        }

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (
          (roomInfo['endgame_type'] &&
            new_host_pr >= roomInfo.endgame_amount) ||
          max_prize === 0
        ) {
          if (max_prize === 0) {
            if (parseFloat(roomInfo.user_bet) - roomInfo.bet_amount >= 0) {
              roomInfo.user_bet =
                parseFloat(roomInfo.user_bet) - roomInfo.bet_amount;
              const originalBoxList = await RoomBoxPrize.find({
                room: roomInfo
              }).select('box_prize box_price');

              let originalHasZero = originalBoxList.some(
                box => box.box_price === 0
              );
              await RoomBoxPrize.deleteMany({ room: roomInfo });

              let boxPrizes = originalBoxList.map(box => box.box_prize);

              // shuffle the box prizes
              for (let i = boxPrizes.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                [boxPrizes[i], boxPrizes[j]] = [boxPrizes[j], boxPrizes[i]];
              }

              let updatedBoxList = originalBoxList.map((box, index) => {
                // Pick a random box_price from the originalBoxList
                let randomIndex = Math.floor(Math.random() * originalBoxList.length);
                let randomBoxPrice = originalBoxList[randomIndex].box_price;

                // Use the randomly picked box_price for the new box
                let newBox = new RoomBoxPrize({
                  room: roomInfo,
                  box_prize: boxPrizes[index],
                  box_price: randomBoxPrice,
                  status: 'init'
                });

                newBox.save();
                return newBox;
              });


              if (req.io.sockets) {
                req.io.sockets.emit('UPDATED_BOX_LIST', {
                  box_list: updatedBoxList
                });
              }
            } else if (
              roomInfo.endgame_amount &&
              new_host_pr - roomInfo.endgame_amount <= 0
            ) {
              newTransactionC.amount +=
                parseFloat(roomInfo.user_bet) + parseFloat(new_host_pr);

              roomInfo.status = 'finished';

              const newGameLogC = new GameLog({
                room: roomInfo,
                creator: roomInfo['creator'],
                joined_user: roomInfo['creator'],
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['host_pr'],
                is_anonymous: roomInfo['is_anonymous'],
                game_result: -100
              });
              await newGameLogC.save();
            }
          } else {
            newTransactionC.amount += new_host_pr - roomInfo.endgame_amount;

            const messageC =
              'I received ' +
              new_host_pr +
              ' ETH ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
            sendEndedMessageToJoiners(
              roomInfo._id,
              roomInfo['creator']['id'],
              messageC,
              roomInfo.is_anonymous
            );
            // newGameLog.game_result = 3;

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: new_host_pr,
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo.user_bet =
              parseFloat(roomInfo.user_bet) +
              roomInfo.endgame_amount -
              roomInfo.bet_amount;
            newGameLog.new_host_pr = new_host_pr;
            new_host_pr = roomInfo.bet_amount;

            const originalBoxList = await RoomBoxPrize.find({
              room: roomInfo
            }).select('box_prize box_price');

            await RoomBoxPrize.deleteMany({ room: roomInfo });

            let boxPrizes = originalBoxList.map(box => box.box_prize);

            // shuffle the box prizes
            for (let i = boxPrizes.length - 1; i > 0; i--) {
              let j = Math.floor(Math.random() * (i + 1));
              [boxPrizes[i], boxPrizes[j]] = [boxPrizes[j], boxPrizes[i]];
            }

            let updatedBoxList = originalBoxList.map((box, index) => {
              // Pick a random box_price from the originalBoxList
              let randomIndex = Math.floor(Math.random() * originalBoxList.length);
              let randomBoxPrice = originalBoxList[randomIndex].box_price;

              // Use the randomly picked box_price for the new box
              let newBox = new RoomBoxPrize({
                room: roomInfo,
                box_prize: boxPrizes[index],
                box_price: randomBoxPrice,
                status: 'init'
              });

              newBox.save();
              return newBox;
            });

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BOX_LIST', {
                box_list: updatedBoxList
              });
            }
          }
        }

        roomInfo.new_host_pr = new_host_pr;
        // new_host_pr -= roomInfo.endgame_amount;
        roomInfo.host_pr = new_host_pr;
        roomInfo.pr = max_prize;
        newGameLog.selected_box = selected_box;
      } else if (roomInfo['game_type']['game_type_name'] === 'Blackjack') {

        // console.log("****NEW BET******")
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        const score = parseInt(req.body.score);
        let score_host = parseInt(req.body.score_host);
        // console.log("score: ", score);
        // console.log("score_host: ", score_host);
        let cardsArray = [];
        if (score === 6198) {
          const result = updateHostScore(score_host, score);
          // console.log("result: ", result);
          score_host = result.newScoreHost;
          // console.log("currentScoreHost: ", score_host);
          cardsArray.push({ card: result.card, score: score_host });
          if (score === 6198 && score_host === 21) {
            // console.log("split", score, score_host)

            newGameLog.game_result = 0;

            newTransactionJ.amount += parseFloat(req.body.bet_amount);
            message.message =
              'Split ' +
              convertToCurrency(req.body.bet_amount * 2) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
            if (req.io.sockets) {
              req.io.sockets.emit('CARDS_ARRAY', {
                cardsArray: cardsArray
              });
            }
          } else {
            newGameLog.game_result = 1;
            // console.log("blackjack", score)

            newTransactionJ.amount += (((parseFloat(req.body.bet_amount * 2) + (parseFloat(req.body.bet_amount) * 0.5))) * ((100 - commission) / 100));
            message.message =
              'Win ' +
              convertToCurrency(parseFloat(req.body.bet_amount + (parseFloat(req.body.bet_amount) * 0.5))) +
              ' in ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];

            roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - ((parseFloat(req.body.bet_amount) + (parseFloat(req.body.bet_amount) * 0.5)));

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATED_BANKROLL', {
                bankroll: roomInfo['user_bet']
              });
            }

            // update rain
            rain.value =
              parseFloat(rain.value) +
              roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

            rain.save();

            // update platform stat (0.5%)
            platform.value =
              parseFloat(platform.value) +
              roomInfo['bet_amount'] * 2 * (tax.value / 100);
            platform.save();

            if (req.io.sockets) {
              req.io.sockets.emit('UPDATE_RAIN', {
                rain: rain.value
              });
            }
            if (req.io.sockets) {
              req.io.sockets.emit('CARDS_ARRAY', {
                cardsArray: cardsArray
              });
            }

          }
        } else if (score <= 21) {

          const allBetItems = await BjBetItem.find({
            room: new ObjectId(req.body._id)
          });
          const host_bj = predictNextBj(allBetItems, score_host);
          if (host_bj === 'hit') {
            let currentScoreHost = score_host;


            // Loop to continue hitting until the host busts or stands
            while (currentScoreHost < 21 && predictNextBj(allBetItems, currentScoreHost) === 'hit') {

              const result = updateHostScore(currentScoreHost, score);
              currentScoreHost = result.newScoreHost;
              cardsArray.push({ card: result.card, score: currentScoreHost });
              if (currentScoreHost >= score) {
                break;
              }
            }

            if ((score > currentScoreHost) || currentScoreHost > 21) {
              newGameLog.game_result = 1;
              // console.log("win", score, currentScoreHost)

              newTransactionJ.amount += (parseFloat(req.body.bet_amount * 2) * ((100 - commission) / 100));
              message.message =
                'Win ' +
                convertToCurrency(req.body.bet_amount * 2) +
                ' in ' +
                roomInfo['game_type']['short_name'] +
                '-' +
                roomInfo['room_number'];

              roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - parseFloat(req.body.bet_amount);

              if (req.io.sockets) {
                req.io.sockets.emit('UPDATED_BANKROLL', {
                  bankroll: roomInfo['user_bet']
                });
              }


              // update rain
              rain.value =
                parseFloat(rain.value) +
                roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

              rain.save();

              // update platform stat (0.5%)
              platform.value =
                parseFloat(platform.value) +
                roomInfo['bet_amount'] * 2 * (tax.value / 100);
              platform.save();

              if (req.io.sockets) {
                req.io.sockets.emit('UPDATE_RAIN', {
                  rain: rain.value
                });
              }

              if (req.io.sockets) {
                req.io.sockets.emit('CARDS_ARRAY', {
                  cardsArray: cardsArray
                });
              }

            } else if ((score === currentScoreHost)) {

              newGameLog.game_result = 0;

              newTransactionJ.amount += parseFloat(req.body.bet_amount);
              message.message =
                'Split ' +
                convertToCurrency(req.body.bet_amount * 2) +
                ' in ' +
                roomInfo['game_type']['short_name'] +
                '-' +
                roomInfo['room_number'];
              if (req.io.sockets) {
                req.io.sockets.emit('CARDS_ARRAY', {
                  cardsArray: cardsArray
                });
              }
            } else {

              newGameLog.game_result = -1;
              // lost bj
              roomInfo.host_pr =
                (parseFloat(roomInfo.host_pr) || 0) +
                parseFloat(req.body.bet_amount);
              roomInfo.user_bet =
                (parseFloat(roomInfo.user_bet) || 0) +
                parseFloat(req.body.bet_amount);

              if (
                roomInfo['endgame_type'] &&
                roomInfo['user_bet'] >= roomInfo['endgame_amount']
              ) {

                newTransactionC.amount +=
                  parseFloat(roomInfo['user_bet']) -
                  parseFloat(roomInfo['endgame_amount']);

                const newGameLogC = new GameLog({
                  room: roomInfo,
                  creator: roomInfo['creator'],
                  joined_user: roomInfo['creator'],
                  game_type: roomInfo['game_type'],
                  bet_amount: roomInfo['host_pr'],
                  user_bet: roomInfo['user_bet'],
                  is_anonymous: roomInfo['is_anonymous'],
                  game_result: 3
                });
                await newGameLogC.save();
                roomInfo['user_bet'] = parseFloat(
                  roomInfo['endgame_amount']
                ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
              }

              if (req.io.sockets) {
                req.io.sockets.emit('UPDATED_BANKROLL', {
                  bankroll: roomInfo['user_bet']
                });
              }

              message.message =
                'Lost ' +
                convertToCurrency(req.body.bet_amount) +
                ' in ' +
                roomInfo['game_type']['short_name'] +
                '-' +
                roomInfo['room_number'];
              if (req.io.sockets) {
                req.io.sockets.emit('CARDS_ARRAY', {
                  cardsArray: cardsArray
                });
              }
            }
          }

        } else {

          newGameLog.game_result = -1;
          // lost bj
          roomInfo.host_pr =
            (parseFloat(roomInfo.host_pr) || 0) +
            parseFloat(req.body.bet_amount);
          roomInfo.user_bet =
            (parseFloat(roomInfo.user_bet) || 0) +
            parseFloat(req.body.bet_amount);

          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo['endgame_amount']);

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['host_pr'],
              user_bet: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();
            roomInfo['user_bet'] = parseFloat(
              roomInfo['endgame_amount']
            ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
          }

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            'Lost ' +
            convertToCurrency(req.body.bet_amount) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          if (req.io.sockets) {
            req.io.sockets.emit('CARDS_ARRAY', {
              cardsArray: cardsArray
            });
          }
        }

        // bet_item.joiner = req.user;
        // bet_item.joiner_bj = req.body.selected_bj;
        // await bet_item.save();

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          const newGameLogC = new GameLog({
            room: roomInfo,
            creator: roomInfo['creator'],
            joined_user: roomInfo['creator'],
            game_type: roomInfo['game_type'],
            bet_amount: roomInfo['host_pr'],
            user_bet: roomInfo['user_bet'],
            is_anonymous: roomInfo['is_anonymous'],
            game_result: -100
          });
          await newGameLogC.save();
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
        newGameLog.bet_amount = roomInfo['bet_amount'];
        newGameLog.brain_game_score = req.body.brain_game_score;

        newTransactionJ.amount -= roomInfo['bet_amount'];

        // roomInfo['user_bet'] += roomInfo['bet_amount'];
        if (roomInfo.brain_game_score == req.body.brain_game_score) {
          //draw          Draw, No Winner! PR will be split.
          message.message =
            'Split ' +
            convertToCurrency(roomInfo['bet_amount'] * 2) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newTransactionJ.amount += roomInfo['bet_amount'];
          // newTransactionC.amount += roomInfo['bet_amount'];

          // roomInfo.status = 'finished';
          newGameLog.game_result = 0;
        } else if (roomInfo.brain_game_score < req.body.brain_game_score) {
          //win       WOW, What a BRAIN BOX - You WIN!
          message.message =
            'Won ' +
            convertToCurrency(roomInfo['bet_amount'] * 2) +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newTransactionJ.amount +=
            roomInfo['bet_amount'] * 2 * ((100 - commission) / 100);

          newGameLog.commission =
            roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

          // update rain
          rain.value =
            parseFloat(rain.value) +
            roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

          rain.save();

          // update platform stat (0.5%)
          platform.value =
            parseFloat(platform.value) +
            roomInfo['bet_amount'] * 2 * (tax.value / 100);
          platform.save();

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATE_RAIN', {
              rain: rain.value
            });
          }

          roomInfo['pr'] -= roomInfo['bet_amount'];
          roomInfo['host_pr'] -= roomInfo['bet_amount'];
          // update bankroll

          roomInfo['host_pr'] =
            parseFloat(roomInfo['host_pr']) +
            parseFloat(roomInfo['bet_amount']) * 2 * ((commission - 0.5) / 100);
          roomInfo['pr'] =
            parseFloat(roomInfo['pr']) +
            parseFloat(roomInfo['bet_amount']) * 2 * ((commission - 0.5) / 100);

          if (roomInfo['host_pr'] <= parseFloat(roomInfo['user_bet'])) {
            roomInfo.status = 'finished';
            newTransactionC.amount += parseFloat(roomInfo['host_pr']);
            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['host_pr'],
              user_bet: roomInfo['user_bet'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: -100
            });
            await newGameLogC.save();
          }

          newGameLog.game_result = 1;
          // roomInfo.status = 'finished';
        } else {
          //failed    Oops, back to school for you loser!!
          message.message =
            'Lost ' +
            convertToCurrency(roomInfo['bet_amount']) +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
          roomInfo['pr'] += roomInfo['bet_amount'];
          roomInfo['host_pr'] += roomInfo['bet_amount'];
          newGameLog.game_result = -1;
          if (
            roomInfo['endgame_amount'] > 0 &&
            roomInfo['host_pr'] > roomInfo['endgame_amount']
          ) {
            // roomInfo.status = 'finished';

            newTransactionC.amount +=
              roomInfo['host_pr'] - roomInfo['endgame_amount'];

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['bet_amount'],
              host_pr: roomInfo['host_pr'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: 3
            });
            await newGameLogC.save();

            roomInfo['host_pr'] = parseFloat(roomInfo['endgame_amount']);
            roomInfo['pr'] = parseFloat(roomInfo['endgame_amount']);
          }
        }
      }
      roomInfo['creator']['balance'] += newTransactionC.amount;
      roomInfo['creator']['gamePlayed']++;
      roomInfo['creator']['totalProfit'] += Math.abs(newTransactionC.amount);
      roomInfo['creator']['totalWagered'] += Math.abs(newTransactionJ.amount);


      if (roomInfo['creator']['profitAllTimeHigh'] < newTransactionC.amount) {
        roomInfo['creator']['profitAllTimeHigh'] = newTransactionC.amount;
      }
      if (roomInfo['creator']['profitAllTimeLow'] > newTransactionC.amount) {
        roomInfo['creator']['profitAllTimeLow'] = newTransactionC.amount;
      }
      roomInfo['creator'].save();

      req.user['balance'] += newTransactionJ.amount;
      req.user['gamePlayed']++;
      req.user['totalProfit'] += Math.abs(newTransactionJ.amount);
      req.user['totalWagered'] += Math.abs(newTransactionJ.amount);

      if (req.user['profitAllTimeHigh'] < newTransactionJ.amount) {
        req.user['profitAllTimeHigh'] = newTransactionJ.amount;
      }
      if (req.user['profitAllTimeLow'] > newTransactionJ.amount) {
        req.user['profitAllTimeLow'] = newTransactionJ.amount;
      }

      if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
        req.user['balance'] += roomInfo['bet_amount'];

        const brain_game_type = await BrainGameType.findOne({ _id: roomInfo.brain_game_type });

        if (brain_game_type) {
          brain_game_type.plays++;
          await brain_game_type.save(); // Save the changes to the document
        }
      }

      // Save the changes to the user document
      await req.user.save();

      newGameLog.save();
      await roomInfo.save();

      if (!roomInfo.joiners.includes(req.user)) {
        roomInfo.joiners.addToSet(req.user);
        await roomInfo.save();
      }
      setTimeout(async () => {
        // const rooms = await getRoomList(10, 'All');
        // req.io.sockets.emit('UPDATED_ROOM_LIST', {
        //   _id: roomInfo['_id'],
        //   total: rooms.count,
        //             total: rooms.count,

        //   roomList: rooms.rooms,
        //   pageSize: rooms.pageSize
        // });

        if (newTransactionJ.amount !== 0) {
          newTransactionJ.save();
        }

        // Check if user_bet matches the share value of the first host
        if (roomInfo['bet_amount'] === roomInfo.hosts[0].share) {

          if (newTransactionC.amount !== 0) {
            newTransactionC.save();
            socket.newTransaction(newTransactionC);
          }
        } else {
          let totalSharesAndBet = roomInfo['bet_amount'];

          // Iterate over each host asynchronously
          roomInfo.hosts.forEach(async (host) => {
            // Add the current host's share to the total
            totalSharesAndBet += host.share;
          });
          roomInfo.hosts.forEach(async (host) => {
            // Calculate share percentage for the current host
            const sharePercentage = (host.share / totalSharesAndBet) * 100;

            // Calculate the amount for the current host based on the share percentage
            const amountForHost = (parseFloat(roomInfo.user_bet) * sharePercentage) / 100;

            // Create a new transaction for the current host
            const newTransactionForHost = new Transaction({
              user: host.host,
              amount: amountForHost,
              description: 'Co-Hosting auto-payout in ' + roomInfo.game_type.short_name + '-' + roomInfo.room_number,
              room: req.body._id
            });

            if (newTransactionForHost.amount !== 0) {
              await newTransactionForHost.save();
              socket.newTransaction(newTransactionForHost);
            }

            const user = await User.findOne({ host: host.host });

            if (user) {
              user.balance += amountForHost;
              await user.save();
            } else {
              console.log(`User with host ${host.host} not found.`);
            }
          });
        }


        if (message.from._id !== message.to._id) {
          message.save();
          socket.sendNotification(message.to._id, {
            from: message.from._id,
            to: message.to._id,
            message: message.message,
            created_at: moment(new Date()).format('LLL')
          });

          if (newGameLog.game_result === 1) {

            const chanceOfExecution = 0.05;
            const randomValue = Math.random();

            if (randomValue < chanceOfExecution) {
              const items = await Item.find({
                item_type: '653ee7ac17c9f5ee21245649',
                'owners.user': '629685058f368a1838372754'
              });

              // Check if there are any matching items
              if (items.length === 0) {
                console.log('No matching items found');
              }

              const gameTypeConditions = [
                {
                  name: 'Brain Game',
                  id: '654e25cb98cb749b169756d5',
                  chance: 0.8
                },
                {
                  name: 'Quick Shoot',
                  id: '654ce2591190b95f119a9904',
                  chance: 0.8
                },
                {
                  name: 'RPS',
                  ids: [
                    '653fa125fcff1e90ab8b742f',
                    '653fa43dfcff1e90ab8b7431',
                    '653fb118fcff1e90ab8b7434',
                    '653fa42efcff1e90ab8b7430',
                    '653faf7afcff1e90ab8b7432',
                    '653fb106fcff1e90ab8b7433'
                  ],
                  chances: [0.25, 0.25, 0.25, 0.05, 0.05, 0.05]
                },
                {
                  name: 'Roll',
                  ids: [
                    '653fa125fcff1e90ab8b742f',
                    '653fa43dfcff1e90ab8b7431',
                    '653fb118fcff1e90ab8b7434',
                    '653f617717c9f5ee2124565d',
                    '653f769417c9f5ee21245665',
                    '653f793017c9f5ee21245666'
                  ],
                  chances: [0.2, 0.2, 0.2, 0.2, 0.1, 0.05]
                }
              ];

              const selectedGameType = roomInfo['game_type']['game_type_name'];
              const matchingGameType = gameTypeConditions.find(
                condition => condition.name === selectedGameType
              );

              if (matchingGameType) {
                if (
                  Array.isArray(matchingGameType.ids) &&
                  Array.isArray(matchingGameType.chances)
                ) {
                  const totalChances = matchingGameType.chances.reduce(
                    (acc, chance) => acc + chance,
                    0
                  );
                  const randomValueForSpecialItem = Math.random();

                  let cumulativeProbability = 0;
                  for (let i = 0; i < matchingGameType.ids.length; i++) {
                    cumulativeProbability +=
                      matchingGameType.chances[i] / totalChances;

                    if (randomValueForSpecialItem < cumulativeProbability) {
                      // Use the specific item with the corresponding ID
                      const specialItem = await Item.findById(
                        matchingGameType.ids[i]
                      );

                      if (specialItem) {
                        // Update logic for the special item
                        const ownerIndexSpecialItem = specialItem.owners.findIndex(
                          owner =>
                            owner.user.toString() === '629685058f368a1838372754'
                        );

                        if (ownerIndexSpecialItem !== -1) {
                          specialItem.owners[ownerIndexSpecialItem].count -= 1;
                          specialItem.owners[ownerIndexSpecialItem].onSale -= 1;
                        }

                        const userExistsSpecialItem = specialItem.owners.some(
                          owner => owner.user.toString() === req.user.id
                        );

                        if (userExistsSpecialItem) {
                          specialItem.owners.find(
                            owner => owner.user.toString() === req.user.id
                          ).count += 1;
                        } else {
                          specialItem.owners.push({
                            user: req.user.id,
                            count: 1
                          });
                        }

                        await specialItem.save();

                        if (req.io.sockets) {
                          req.io.sockets.emit('CARD_PRIZE', {
                            image: specialItem.image,
                            productName: specialItem.productName
                          });
                        }

                        return; // Exit the function after processing the special item
                      }
                    }
                  }
                } else {
                  const chanceOfSpecialItem = matchingGameType.chance;
                  const randomValueForSpecialItem = Math.random();

                  if (randomValueForSpecialItem < chanceOfSpecialItem) {
                    const specialItem = await Item.findById(matchingGameType.id);

                    if (specialItem) {
                      // Update logic for the special item
                      const ownerIndexSpecialItem = specialItem.owners.findIndex(
                        owner =>
                          owner.user.toString() === '629685058f368a1838372754'
                      );

                      if (ownerIndexSpecialItem !== -1) {
                        specialItem.owners[ownerIndexSpecialItem].count -= 1;
                        specialItem.owners[ownerIndexSpecialItem].onSale -= 1;
                      }

                      const userExistsSpecialItem = specialItem.owners.some(
                        owner => owner.user.toString() === req.user.id
                      );

                      if (userExistsSpecialItem) {
                        specialItem.owners.find(
                          owner => owner.user.toString() === req.user.id
                        ).count += 1;
                      } else {
                        specialItem.owners.push({
                          user: req.user.id,
                          count: 1
                        });
                      }

                      await specialItem.save();

                      if (req.io.sockets) {
                        req.io.sockets.emit('CARD_PRIZE', {
                          image: specialItem.image,
                          productName: specialItem.productName
                        });
                      }

                      return; // Exit the function after processing the special item
                    }
                  }
                }
              }

              // If not a matching game type or the random chance didn't select the special item, continue with the existing logic
              const randomIndex = Math.floor(Math.random() * items.length);
              const selectedItem = items[randomIndex];

              const ownerIndex = selectedItem.owners.findIndex(
                owner => owner.user.toString() === '629685058f368a1838372754'
              );

              if (ownerIndex !== -1) {
                selectedItem.owners[ownerIndex].count -= 1;
                selectedItem.owners[ownerIndex].onSale -= 1;
              }

              const userExists = selectedItem.owners.some(
                owner => owner.user.toString() === req.user.id
              );

              if (userExists) {
                selectedItem.owners.find(
                  owner => owner.user.toString() === req.user.id
                ).count += 1;
              } else {
                selectedItem.owners.push({
                  user: req.user.id,
                  count: 1
                });
              }

              await selectedItem.save();

              if (req.io.sockets) {
                req.io.sockets.emit('CARD_PRIZE', {
                  image: selectedItem.image,
                  productName: selectedItem.productName
                });
              }
            }
          }
        }
      }, 0);
      res.json({
        success: true,
        message: 'successful bet',
        betResult: newGameLog.game_result,
        newTransaction: newTransactionJ,
        roomStatus: roomInfo.status
      });
    }
  } catch (err) {
    res.json({
      success: false,
      message: err
    });
  }
});

module.exports = router;
