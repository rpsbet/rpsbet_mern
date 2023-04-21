const ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');
const socket = require('../socketController.js');
const ntpClient = require('ntp-client'); // Import the NTP client library

const router = express.Router();

const moment = require('moment');
const auth = require('../middleware/auth');

const Room = require('../model/Room');
const User = require('../model/User');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
const RoomBoxPrize = require('../model/RoomBoxPrize');
const Question = require('../model/Question');
const Answer = require('../model/Answer');
const BrainGameType = require('../model/BrainGameType');
const Message = require('../model/Message');
const Transaction = require('../model/Transaction');
const SystemSetting = require('../model/SystemSetting');
const SpleeshGuess = require('../model/SpleeshGuess');
const DropGuess = require('../model/DropGuess');
const BangGuess = require('../model/BangGuess');
const RpsBetItem = require('../model/RpsBetItem');
const QsBetItem = require('../model/QsBetItem');
const DropBetItem = require('../model/DropBetItem');
const BangBetItem = require('../model/BangBetItem');
const { predictNext, calcWinChance } = require('../helper/util/predictNext');
const {
  predictNextQs,
  calcWinChanceQs
} = require('../helper/util/predictNextQs');
const { predictNextDrop } = require('../helper/util/predictNextDrop');
const { predictNextBang } = require('../helper/util/predictNextBang');
const convertToCurrency = require('../helper/util/conversion');

let user_access_log = {};

// /api/game_types call
router.get('/game_types', async (req, res) => {
  try {
    const gameTypes = await GameType.find({});
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
      room: room,
      joiner_rps: ''
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
    let hasEmitted = false;

    async function emitGuesses(req) {
      if (!hasEmitted) {
        const spleesh_guesses = await SpleeshGuess.find({ room: room });
        if (req.io.sockets) {
          req.io.sockets.emit('SPLEESH_GUESSES1', spleesh_guesses);
        }
        hasEmitted = true;
      }
    }
    emitGuesses(req);

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

    async function getCurrentTime() {
      return new Promise((resolve, reject) => {
        ntpClient.getNetworkTime('time.google.com', 123, function(err, date) {
          if (err) {
            reject(err);
          } else {
            resolve(date);
          }
        });
      });
    }

    let hasBangEmitted = false;

    async function emitBangGuesses(req, room) {
      if (!hasBangEmitted) {
        const bang_guesses = await BangBetItem.find({ room: room });
        const bangs = bang_guesses.map(guess => guess.bang);

        // Calculate elapsed time from when the function was called
        const currentTime = await getCurrentTime();
        const lastBangTime =
          bang_guesses.length > 0
            ? bang_guesses[bang_guesses.length - 1].created_at
            : currentTime;
        const elapsedTime = currentTime - lastBangTime;
        const roomId = room._id;
        const socketName = `BANG_GUESSES1_${roomId}`;
        if (req.io.sockets) {
          req.io.sockets.emit(socketName, { bangs, elapsedTime });
        }
        hasBangEmitted = true;
      }
    }

    emitBangGuesses(req, room);

    const roomHistory = await convertGameLogToHistoryStyle(gameLogList);

    res.json({
      success: true,
      query: req.query,
      roomInfo: {
        _id: room['_id'],
        creator_id: room['creator'],
        creator_name: creator['username'],
        joiners: joiners,
        game_type: room['game_type']['game_type_name'],
        bet_amount: parseFloat(room['user_bet']),
        spleesh_bet_unit: room['spleesh_bet_unit'],
        brain_game_type: room['brain_game_type'],
        host_pr: room['host_pr'],
        new_host_pr: room['new_host_pr'],
        user_bet: room['user_bet'],
        brain_game_score: room['brain_game_score'],
        selected_drop: room['selected_drop'],
        selected_bang: room['selected_bang'],
        qs_game_type: room['qs_game_type'],
        room_history: roomHistory,
        box_list: boxPrizeList,
        rps_bet_item_id: rpsBetItem ? rpsBetItem.id : null,
        drop_bet_item_id: dropBetItem ? dropBetItem.id : null,
        bang_bet_item_id: bangBetItem ? bangBetItem.id : null,
        qs_bet_item_id: qsBetItem ? qsBetItem.id : null,
        is_private: room['is_private'],
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
    const question = await Question.aggregate([
      {
        $match: { brain_game_type: new ObjectId(req.params.brain_game_type) }
      },
      {
        $sample: { size: 1 }
      }
    ]);

    const correctAnswer = await Answer.aggregate([
      {
        $match: {
          question: new ObjectId(question[0]._id),
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
          question: new ObjectId(question[0]._id),
          is_correct_answer: false
        }
      },
      {
        $sample: { size: 3 }
      }
    ]);

    let answers = [
      { _id: correctAnswer[0]._id, answer: correctAnswer[0].answer }
    ];

    wrongAnswers.forEach(answer => {
      answers.push({
        _id: answer._id,
        answer: answer.answer
      });
    });

    answers.sort(() => Math.random() - 0.5);

    res.json({
      success: true,
      question: { _id: question[0]._id, question: question[0].question },
      // question: {_id: question._id, question: question.question},
      answers
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

router.post('/answer', async (req, res) => {
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
        // created_at: moment(gameLog['created_at']).fromNow()
        created_at: gameLog['created_at'],
        status: gameLog['room']['status']
      };

      const joined_user_avatar = `<img class='avatar' data-userid="${gameLog['joined_user']['_id']}" src='${gameLog['joined_user']['avatar']} ' alt='' onerror='this.src="/img/profile-thumbnail.svg"' />`;
      const creator_avatar = `<img class='avatar' data-userid="${gameLog['creator']['_id']}" src='${gameLog['creator']['avatar']} ' alt='' onerror='this.src="/img/profile-thumbnail.svg"' />`;
      const joined_user_link = `<a href="javascript:void(0)" class="user-link" data-userid="${gameLog['joined_user']['_id']}">${joined_user_avatar}</a>`;
      const creator_link = `<a href="javascript:void(0)" class="user-link" data-userid="${gameLog['creator']['_id']}">${creator_avatar}</a>`;

      const betAmount = parseFloat(gameLog['room']['bet_amount']);
      const userBet = parseFloat(gameLog['room']['user_bet']);
      const multiplier =
        parseFloat(gameLog['room']['user_bet']) /
        parseFloat(gameLog['room']['bet_amount']);

      const multiplierDisplay = multiplier.toFixed(2);
      const color = multiplier < 1 ? '#ffdd15' : '#ff0a28'; // yellow : red

      let room_name = '';
      if (gameLog['room']['status'] === 'open') {
        room_name = `<a style='color: #b9bbbe;'  href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
      } else {
        room_name = `<a style='color: #b9bbbe;' href="/join/${gameLog['room']['_id']}">${gameLog['game_type']['short_name']}-${gameLog['room']['room_number']}</a>`;
        // $(':button').prop('disabled', true);
      }

      if (gameLog['game_type']['game_type_name'] === 'RPS') {
        if (gameLog.game_result === 1) {
          temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'] * 2)
          )} (2.00X)</span> against ${creator_link} in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['user_bet'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            updateDigitToPoint2(userBet)
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else if (gameLog.game_result === 0) {
          temp.history = `${joined_user_link} split <span style='color: #b9bbbe;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'] * 2)
          )} (1.00X)</span> with ${creator_link} in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )} (0.00X)</span> against ${creator_link} in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Quick Shoot') {
        if (gameLog.game_result === 1) {
          temp.history = `
         ${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['bet_amount'] / (gameLog['room']['qs_game_type'] - 1) +
                gameLog['bet_amount']
            )
          )} (${(
            updateDigitToPoint2(
              gameLog['bet_amount'] / (gameLog['room']['qs_game_type'] - 1) +
                gameLog['bet_amount']
            ) / gameLog['bet_amount']
          ).toFixed(2)}X)
						</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['user_bet'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            updateDigitToPoint2(userBet)
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Drop Game') {
        if (gameLog.game_result === 1) {
          temp.history = `
         ${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              parseFloat(gameLog['bet_amount'] + gameLog['selected_drop'])
            )
          )} (${parseFloat(
            (gameLog['bet_amount'] + gameLog['selected_drop']) /
              gameLog['bet_amount']
          ).toFixed(2)}X)
						</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['bet_amount'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            updateDigitToPoint2(gameLog['room']['host_pr'])
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Bang!') {
        if (gameLog.game_result === 1) {
          temp.history = `
         ${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              parseFloat(gameLog['bet_amount'] + gameLog['selected_bang'])
            )
          )} (${parseFloat(
            (gameLog['bet_amount'] + gameLog['selected_bang']) /
              gameLog['bet_amount']
          ).toFixed(2)}X)
						</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['bet_amount'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked <span style='color: ${color};'>${convertToCurrency(
            updateDigitToPoint2(gameLog['room']['host_pr'])
          )} (${multiplierDisplay}x)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Spleesh!') {
        if (gameLog.game_result === 1) {
          temp.history = `${joined_user_link} won <span style='color: #ff0a28;'>${convertToCurrency(
            parseFloat(gameLog['host_pr']) +
              parseFloat(gameLog['room']['bet_amount'])
          )} (${(
            (parseFloat(gameLog['host_pr']) +
              parseFloat(gameLog['room']['bet_amount'])) /
            parseFloat(gameLog['bet_amount'])
          ).toFixed(2)}X)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['bet_amount'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked 
<span style='color: ${
            (
              (parseFloat(gameLog['host_pr']) + gameLog['room']['bet_amount']) /
              gameLog['room']['bet_amount']
            ).toFixed(2) < 1
              ? '#ffdd15'
              : '#ff0a28'
          };'>${convertToCurrency(
            updateDigitToPoint2(
              parseFloat(gameLog['host_pr']) +
                parseFloat(gameLog['user_bet']) +
                (gameLog['user_bet'] === 0 &&
                gameLog['room']['bet_amount'] === gameLog['room']['pr']
                  ? gameLog['room']['pr']
                  : gameLog['room']['pr'] + gameLog['room']['bet_amount'])
            )
          )} (${(
            (parseFloat(gameLog['host_pr']) + gameLog['room']['bet_amount']) /
            gameLog['room']['bet_amount']
          ).toFixed(2)}X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} lost <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )} (0.00X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Mystery Box') {
        if (gameLog.game_result === 0) {
          temp.history = `${joined_user_link} opened a box <span style='color: #ffdd15;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )}</span>
						and didn't get <span style='color: #ffdd15;'>shit (0.00x)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(
              gameLog['bet_amount'] - gameLog['room']['endgame_amount']
            )
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked 
          <span
          style='color: ${
            (
              parseFloat(gameLog['room']['pr'] + gameLog['room']['user_bet']) /
              gameLog['room']['bet_amount']
            ).toFixed(2) < 1
              ? '#ffdd15'
              : '#ff0a28'
          };'
          >${convertToCurrency(
            updateDigitToPoint2(
              gameLog['room']['pr'] + parseFloat(gameLog['room']['user_bet'])
            )
          )} (${parseFloat(
            (gameLog['room']['pr'] + parseFloat(gameLog['room']['user_bet'])) /
              gameLog['room']['bet_amount']
          ).toFixed(2)}X)</span> in ${room_name}`;
        } else {
          temp.history = `${joined_user_link} opened a box and won <span style="color: ${
            parseFloat(gameLog['game_result']) / gameLog['room']['bet_amount'] <
            1
              ? '#ffdd15'
              : '#ff0a28'
          }">${convertToCurrency(
            updateDigitToPoint2(gameLog['game_result'])
          )} (${(gameLog['game_result'] / gameLog['bet_amount']).toFixed(
            2
          )}X)</span> in ${room_name}`;
        }
      } else if (gameLog['game_type']['game_type_name'] === 'Brain Game') {
        if (gameLog.game_result === 0) {
          //draw          Draw, No Winner! PR will be split.
          temp.history = `${joined_user_link} bet <span style='color: #02c526;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )}</span>, scored ${gameLog['brain_game_score']} 
						and split <span style='color: #02c526;'>${convertToCurrency(
              updateDigitToPoint2(gameLog['room']['pr'])
            )}</span> in ${room_name}`;
        } else if (gameLog.game_result === 1) {
          //win       WOW, What a BRAIN BOX - You WIN!
          temp.history = `${joined_user_link} scored ${
            gameLog['brain_game_score']
          }
						and won <span style='color: #ff0a28;'>${convertToCurrency(
              updateDigitToPoint2(gameLog['bet_amount'] * 2)
            )} (2.00X)</span> in ${room_name}`;
        } else if (gameLog.game_result === 3) {
          //dividends
          temp.history = `${creator_link} received <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
          )}</span> from their game ${room_name}`;
        } else if (gameLog.game_result === -100) {
          //end game
          temp.history = `${creator_link} unstaked 
          <span
          style='color: ${
            (
              parseFloat(gameLog['room']['pr'] + gameLog['room']['user_bet']) /
              gameLog['room']['bet_amount']
            ).toFixed(2) < 1
              ? '#ffdd15'
              : '#ff0a28'
          };'
          >${convertToCurrency(
            updateDigitToPoint2(
              gameLog['room']['pr'] + parseFloat(gameLog['room']['user_bet'])
            )
          )} (${parseFloat(
            (gameLog['room']['pr'] + parseFloat(gameLog['room']['user_bet'])) /
              gameLog['room']['bet_amount']
          ).toFixed(2)}X)</span> in ${room_name}`;
        } else {
          //failed    Oops, back to school for you loser!!
          temp.history = `${joined_user_link} scored ${
            gameLog['brain_game_score']
          } and lost <span style='color: #ff0a28;'>${convertToCurrency(
            updateDigitToPoint2(gameLog['bet_amount'])
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

const getHistory = async (pagination, page, my_id, game_type) => {
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

    const gameLogList = await GameLog.find(search_condition)
      .sort({ created_at: 'desc' })
      .skip(pagination * (page - 1))
      .limit(pagination)
      .populate({ path: 'room', model: Room })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'joined_user', model: User });

    const count = await GameLog.countDocuments(search_condition);

    const result = await convertGameLogToHistoryStyle(gameLogList);

    return {
      history: result,
      count: count,
      page: page,
      totalPage: Math.ceil(count / pagination)
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

const getRoomList = async (pagination, page, game_type) => {
  const search_condition = { status: 'open', game_type: { $ne: null } };

  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type });
    search_condition.game_type = gameType._id;
  }

  const preRooms = await Room.find(search_condition)
    .sort({ created_at: 'desc' })
    .skip(pagination * page - pagination)
    .limit(pagination);

  const rooms = await Room.find({
    _id: { $in: preRooms.map(({ _id }) => _id) }
  })
    .populate({ path: 'creator', model: User })
    .populate({ path: 'game_type', model: GameType })
    .populate({ path: 'brain_game_type', model: BrainGameType });
  const count = await Room.countDocuments(search_condition);

  let result = [];
  for (const room of rooms) {
    const room_id = room['game_type']['short_name'] + '-' + room['room_number'];
    try {
      const joinerAvatars = [];
      for (const joinedUser of room['joiners']) {
        const user = await User.findOne({ _id: joinedUser });
        joinerAvatars.push(user.avatar);
      }
      const temp = {
        _id: room['_id'],
        creator:
          room['is_anonymous'] === true
            ? 'Anonymous'
            : room['creator']
            ? room['creator']['username']
            : '',
        creator_id: room['creator']['_id'],
        joiners: room['joiners'],
        joiner_avatars: joinerAvatars,
        creator_avatar: room['creator']['avatar'],
        creator_status: room['creator']['status'],
        game_type: room['game_type'],
        user_bet: room['user_bet'],
        pr: room['pr'],
        rps_list: room['rps_list'],
        qs_list: room['qs_list'],
        drop_list: room['drop_list'],
        bang_list: room['bang_list'],
        winnings: '',
        spleesh_bet_unit: room['spleesh_bet_unit'],
        is_anonymous: room['is_anonymous'],
        is_private: room['is_private'],
        brain_game_type: room['brain_game_type'],
        status: room['status'],
        index: room['room_number'],
        created_at: moment(room['created_at']).format('YYYY-MM-DD HH:mm')
      };

      if (temp.game_type.game_type_id === 1) {
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 2) {
        const gameLogList = await GameLog.find({ room: room }).sort({
          bet_amount: 'desc'
        });
        if (!gameLogList || gameLogList.length == 0) {
          temp.winnings =
            temp.spleesh_bet_unit + updateDigitToPoint2(room['user_bet']);
        } else {
          for (let i = 10; i > 0; i--) {
            let is_exist = false;
            for (let j = 0; j < gameLogList.length; j++) {
              if (gameLogList[j].bet_amount == i * temp.spleesh_bet_unit) {
                is_exist = true;
                break;
              }
            }

            if (!is_exist) {
              temp.winnings =
                i * temp.spleesh_bet_unit +
                updateDigitToPoint2(room['user_bet']);
              break;
            }
          }
        }
      } else if (temp.game_type.game_type_id === 3) {
        temp.winnings = updateDigitToPoint2(room['pr']);
      } else if (temp.game_type.game_type_id === 4) {
        // mystery box
        temp.winnings =
          parseFloat(room['host_pr']) + parseFloat(room['user_bet']);
      } else if (temp.game_type.game_type_id === 5) {
        // quick shoot
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 6) {
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 7) {
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      }

      result.push(temp);
    } catch (e) {
      console.log({ error: e.toString() });
    }
  }
  return {
    rooms: result.sort((a, b) => (a.created_at > b.created_at ? -1 : 1)),
    count: count,
    page: page
  };
};

router.get('/history', async (req, res) => {
  try {
    const pagination = req.query.pagination
      ? parseInt(req.query.pagination)
      : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const game_type = req.query.game_type ? req.query.game_type : 'All';

    const history = await getHistory(pagination, page, null, game_type);

    res.json({
      success: true,
      page: page,
      history: history.history,
      total: history.count,
      pages: Math.ceil(history.count / pagination)
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

router.get('/my_history', auth, async (req, res) => {
  try {
    const pagination = req.query.pagination
      ? parseInt(req.query.pagination)
      : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const game_type = req.query.game_type ? req.query.game_type : 'All';

    const history = await getHistory(pagination, page, req.user._id, game_type);

    res.json({
      success: true,
      page: page,
      history: history.history,
      total: history.count,
      pages: Math.ceil(history.count / pagination)
    });
  } catch (err) {
    res.json({
      success: false,
      err: err
    });
  }
});

// /api/rooms call
router.get('/rooms', async (req, res) => {
  const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
  const page = req.query.page ? parseInt(req.query.page) : 1;
  const game_type = req.query.game_type ? req.query.game_type : 'All';

  try {
    const rooms = await getRoomList(pagination, page, game_type);
    res.json({
      page: page,
      success: true,
      query: req.query,
      total: rooms.count,
      roomList: rooms.rooms,
      pages: Math.ceil(rooms.count / pagination)
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
    if (req.body.bet_amount <= 0) {
      return res.json({
        success: false,
        message: 'Wrong bet amount!'
      });
    }

    if (req.body.bet_amount > req.user.bankroll) {
      return res.json({
        success: false,
        message: 'Not enough bankroll!'
      });
    }

    if (req.body.bet_amount > req.user.balance) {
      return res.json({
        success: false,
        message: 'MAKE A DEPOSIT, BROKIE!'
      });
    }

    gameType = await GameType.findOne({
      game_type_id: parseInt(req.body.game_type)
    });
    // new room
    if (req.body.game_type === 1) {
      // RPS
      host_pr = parseFloat(req.body.bet_amount);
      user_bet = parseFloat(req.body.bet_amount);
      pr = user_bet * 2;
    } else if (req.body.game_type === 2) {
      // Spleesh!
      user_bet = 0;
      host_pr = 0;
      pr = parseFloat(req.body.bet_amount);
    } else if (req.body.game_type === 3) {
      // Brain Game
      pr = req.body.bet_amount;
      host_pr = req.body.bet_amount;
      user_bet = req.body.bet_amount;
    } else if (req.body.game_type == 4) {
      // Mystery Box
      pr = req.body.max_prize;
      host_pr = req.body.bet_amount;
      user_bet = 0; /*req.body.lowest_box_price; */
    } else if (req.body.game_type == 5) {
      // Quick Shoot
      pr = 0;
      host_pr = parseFloat(req.body.bet_amount);
      user_bet = parseFloat(req.body.bet_amount);
    } else if (req.body.game_type == 6) {
      // Drop Game
      pr = req.body.max_return;
      host_pr = parseFloat(req.body.bet_amount);
      user_bet = parseFloat(req.body.bet_amount);
    } else if (req.body.game_type == 7) {
      // Bang!
      pr = req.body.max_return;
      host_pr = parseFloat(req.body.bet_amount);
      user_bet = parseFloat(req.body.bet_amount);
    }

    const roomCount = await Room.countDocuments({});
    newRoom = new Room({
      ...req.body,
      creator: req.user,
      joiners: [],
      game_type: gameType,
      user_bet: user_bet,
      pr: pr,
      host_pr: host_pr,
      room_number: roomCount + 1,
      status: 'open'
    });
    await newRoom.save();

    if (gameType.game_type_name === 'Mystery Box') {
      req.body.box_list.forEach(box => {
        newBox = new RoomBoxPrize({
          room: newRoom,
          box_prize: box.box_prize,
          box_price: box.box_price,
          status: 'init'
        });
        newBox.save();
      });
    } else if (gameType.game_type_name === 'RPS') {
      req.body.rps_list.forEach(rps => {
        newRps = new RpsBetItem({
          room: newRoom,
          rps: rps.rps
          // bet_amount: rps.bet_amount
        });
        newRps.save();
      });
    } else if (gameType.game_type_name === 'Quick Shoot') {
      req.body.qs_list.forEach(qs => {
        newQs = new QsBetItem({
          room: newRoom,
          qs: qs.qs
          // bet_amount: rps.bet_amount
        });
        newQs.save();
      });
    } else if (gameType.game_type_name === 'Drop Game') {
      req.body.drop_list.forEach(drop => {
        newDrop = new DropBetItem({
          room: newRoom,
          drop: drop.drop
          // bet_amount: rps.bet_amount
        });
        newDrop.save();
      });
    } else if (gameType.game_type_name === 'Bang!') {
      const roomBets = [];
      const roomId = newRoom.id;

      const emitBangGuesses = () => {
        if (req.io.sockets) {
          const bangs = roomBets.map(bet => bet.bang);
          const socketName = `BANG_GUESSES_${roomId}`;
          const elapsedTime = '';
          req.io.sockets.emit(socketName, { bangs: bangs, elapsedTime });
        }
      };

      const predictAndEmit = async () => {
        const nextBangPrediction = await predictNextBang(req.body.bang_list);
        // console.log(nextBangPrediction)
        const currentTime = await getCurrentTime();
        const newBet = new BangBetItem({
          room: newRoom,
          bang: nextBangPrediction,
          created_at: currentTime // Save the current time as the 'created_at' field
        });
        await newBet.save();
        roomBets.push(newBet);
        emitBangGuesses();

        setTimeout(predictAndEmit, nextBangPrediction * 1000 + 7000);
        // console.log("time", ((Math.log(nextBangPrediction) / Math.log(1.5)) * 5 * 1000) + 7000);
      };

      // Initialize the first round and emit the initial state of bang guesses
      const initializeRound = async () => {
        const nextBangPrediction = await predictNextBang(req.body.bang_list);
        // console.log(nextBangPrediction)

        const currentTime = await getCurrentTime(); // Get the current time using NTP
        const newBet = new BangBetItem({
          room: newRoom,
          bang: nextBangPrediction,
          created_at: currentTime // Save the current time as the 'created_at' field
        });
        await newBet.save();
        roomBets.push(newBet);
        emitBangGuesses();

        // Schedule the next round after value + 10 seconds
        setTimeout(predictAndEmit, nextBangPrediction * 1000 + 7000);
        // console.log("time", ((Math.log(nextBangPrediction) / Math.log(1.5)) * 5 * 1000) + 7000);
      };
      initializeRound();

      req.body.bang_list.forEach(async bang => {
        const currentTime = await getCurrentTime(); // Get the current time using NTP
        const newBang = new BangBetItem({
          room: newRoom,
          bang: bang.bang,
          created_at: currentTime // Save the current time as the 'created_at' field
        });
        await newBang.save();
        roomBets.push(newBang);
      });
    }
    async function getCurrentTime() {
      return new Promise((resolve, reject) => {
        ntpClient.getNetworkTime('time.google.com', 123, function(err, date) {
          if (err) {
            reject(err);
          } else {
            resolve(date);
          }
        });
      });
    }

    newTransaction = new Transaction({
      user: req.user,
      amount: 0,
      description:
        'create ' + gameType.game_type_name + ' - ' + newRoom.room_number
    });

    if (req.body.is_anonymous === true) {
      req.user['balance'] -= 10;
      newTransaction.amount -= 10;
    }

    req.user['balance'] -= req.body.bet_amount;
    newTransaction.amount -= req.body.bet_amount;

    await req.user.save();
    await newTransaction.save();

    const rooms = await getRoomList(10, 1, 'All');
    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      total: rooms.count,
      roomList: rooms.rooms,
      pages: Math.ceil(rooms.count / 10)
    });

    res.json({
      success: true,
      message: 'room create',
      newTransaction
    });
  } catch (err) {
    res.json({
      success: false,
      message: 'something went wrong'
    });
  }
});

const getMyRooms = async (user_id, pagination, page, game_type) => {
  const search_condition = {
    creator: new ObjectId(user_id),
    status: 'open'
  };
  if (game_type !== 'All') {
    const gameType = await GameType.findOne({ short_name: game_type });
    search_condition.game_type = gameType._id;
  }
  const rooms = await Room.find(search_condition)
    .populate({ path: 'game_type', model: GameType })
    .sort({ created_at: 'desc' })
    .skip(pagination * page - pagination)
    .limit(pagination);
  const count = await Room.countDocuments(search_condition);

  let result = [];

  for (const room of rooms) {
    try {
      let temp = {
        _id: room['_id'],
        game_type: room['game_type'],
        bet_amount: room['bet_amount'],
        rps_list: room['rps_list'],
        qs_list: room['qs_list'],
        drop_list: room['drop_list'],
        bang_list: room['bang_list'],
        pr: room['host_pr'],
        winnings: '',
        index: room['room_number'],
        endgame_amount: room['endgame_amount'],
        is_private: room['is_private']
      };

      const gameLogCount = await GameLog.countDocuments({
        room: new ObjectId(room._id)
      });

      // my games
      if (gameLogCount === 0) {
        temp.winnings = temp.bet_amount;
      } else if (temp.game_type.game_type_id === 1) {
        // RPS
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 2) {
        // Spleesh!

        temp.bet_amount =
          room['user_bet'] === 0 && room['bet_amount'] === room['pr']
            ? room['pr']
            : room['pr'] + temp.bet_amount;
        temp.winnings = updateDigitToPoint2(
          parseFloat(room['user_bet']) +
            parseFloat(room['host_pr']) +
            temp.bet_amount
        );
      } else if (temp.game_type.game_type_id === 3) {
        // Brain Game
        temp.winnings = updateDigitToPoint2(room['pr']);
      } else if (temp.game_type.game_type_id === 4) {
        //Mytery Box
        temp.winnings =
          parseFloat(room['user_bet']) + parseFloat(room['host_pr']);
      } else if (temp.game_type.game_type_id === 5) {
        // Quick Shoot
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 6) {
        // Drop Game
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      } else if (temp.game_type.game_type_id === 7) {
        // Bang!
        temp.winnings = updateDigitToPoint2(room['user_bet']);
      }

      result.push(temp);
    } catch (e) {
      console.log(e.toString());
    }
  }

  return {
    rooms: result,
    count: count
  };
};

router.get('/my_games', auth, async (req, res) => {
  try {
    const pagination = req.query.pagination
      ? parseInt(req.query.pagination)
      : 8;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const game_type = req.query.game_type ? req.query.game_type : 'All';
    const rooms = await getMyRooms(req.user._id, pagination, page, game_type);

    res.json({
      success: true,
      page: page,
      myGames: rooms.rooms,
      total: rooms.count,
      pages: Math.ceil(rooms.count / pagination)
    });
  } catch (err) {
    res.json({
      success: false,
      message: err
    });
  }
});

router.post('/end_game', auth, async (req, res) => {
  try {
    if (!check_access_time(req.user._id)) {
      res.json({
        success: false,
        message: 'illregular action',
        betResult: -1000
      });

      return;
    }

    const roomInfo = await Room.findOne({ _id: req.body.room_id })
      .populate({ path: 'creator', model: User })
      .populate({ path: 'game_type', model: GameType });

    if (roomInfo.status === 'finished') {
      res.json({
        success: false,
        already_finished: true,
        message: 'THIS GAME HAS ENDED ALREADY'
      });
      return;
    }

    roomInfo.status = 'finished';

    const gameLogCount = await GameLog.countDocuments({
      room: new ObjectId(roomInfo._id)
    });
    let message = new Message({
      from: req.user,
      to: roomInfo['creator'],
      message: '',
      is_anonymous: req.body.is_anonymous,
      is_read: true
    });

    const newTransaction = new Transaction({
      user: roomInfo['creator'],
      amount: 0,
      description:
        'end game ' +
        roomInfo['game_type']['short_name'] +
        '-' +
        roomInfo['room_number']
    });

    if (gameLogCount === 0) {
      newTransaction.amount += roomInfo['bet_amount'];

      message.message =
        'I made ' +
        roomInfo['bet_amount'] +
        ' BUSD from UNSTAKING ' +
        roomInfo['game_type']['short_name'] +
        '-' +
        roomInfo['room_number'];
    } else {
      // set balance
      if (roomInfo['game_type']['game_type_name'] === 'Spleesh!') {
        // Calculate bet_amount
        const bet_amount =
          roomInfo['user_bet'] === 0 &&
          roomInfo['bet_amount'] === roomInfo['pr']
            ? roomInfo['pr']
            : roomInfo['pr'] + roomInfo['bet_amount'];

        // Calculate winnings
        const winnings = updateDigitToPoint2(
          parseFloat(roomInfo['user_bet']) +
            parseFloat(roomInfo['host_pr']) +
            bet_amount
        );

        // Update newTransaction.amount with winnings
        newTransaction.amount += parseFloat(winnings);

        message.message =
          'I made ' +
          parseFloat(roomInfo['host_pr'] + roomInfo['user_bet']) +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'RPS') {
        newTransaction.amount += roomInfo['user_bet'];
        message.message =
          'I made ' +
          roomInfo['user_bet'] +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'Quick Shoot') {
        newTransaction.amount += roomInfo['user_bet'];
        message.message =
          'I made ' +
          roomInfo['user_bet'] +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'Drop Game') {
        newTransaction.amount += roomInfo['user_bet'];
        message.message =
          'I made ' +
          roomInfo['host_pr'] +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'Bang!') {
        newTransaction.amount += roomInfo['user_bet'];
        message.message =
          'I made ' +
          roomInfo['host_pr'] +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'Mystery Box') {
        newTransaction.amount +=
          roomInfo['host_pr'] + parseFloat(roomInfo['user_bet']);
        message.message =
          'I made ' +
          (roomInfo['host_pr'] + parseFloat(roomInfo['user_bet'])) +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      } else if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
        newTransaction.amount += roomInfo['host_pr'];
        message.message =
          'I made ' +
          roomInfo['host_pr'] +
          ' BUSD from UNSTAKING ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'];
      }

      newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo['creator'],
        joined_user: roomInfo['creator'],
        game_type: roomInfo['game_type'],
        bet_amount: roomInfo['host_pr'],
        is_anonymous: roomInfo['is_anonymous'],
        game_result: -100
      });

      await newGameLog.save();
    }

    roomInfo['creator']['balance'] += newTransaction.amount;
    await roomInfo['creator'].save();
    await roomInfo.save();
    await newTransaction.save();

    sendEndedMessageToJoiners(
      roomInfo._id,
      roomInfo['creator']['_id'],
      message.message,
      roomInfo.is_anonymous
    );

    const myRooms = await getMyRooms(req.user._id);

    res.json({
      success: true,
      myGames: myRooms.rooms,
      pages: Math.ceil(myRooms.count / 8),
      newTransaction
    });

    const rooms = await getRoomList(10, 1, 'All');

    req.io.sockets.emit('UPDATED_ROOM_LIST', {
      total: rooms.count,
      roomList: rooms.rooms,
      pages: Math.ceil(rooms.count / 10)
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
    messages1 = await Message.find({
      from: new ObjectId(req.user._id)
    }).populate({ path: 'to', model: User });
    messages2 = await Message.find({
      to: new ObjectId(req.user._id)
    }).populate({ path: 'from', model: User });

    myChat = {};
    for (let message of messages1) {
      if (
        message.to &&
        (!myChat[message.to._id] ||
          myChat[message.to._id]['updated_at'] < message.updated_at)
      ) {
        myChat[message.to._id] = {
          ...myChat[message.to._id],
          _id: message.to._id,
          message: message.message,
          username: message.to.username,
          avatar: message.to.avatar,
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
          myChat[message.from._id]['updated_at'] < message.updated_at)
      ) {
        myChat[message.from._id] = {
          ...myChat[message.from._id],
          _id: message.from._id,
          message: message.message,
          username: message.from.username,
          avatar: message.from.avatar,
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

router.post('/start_brain_game', auth, async (req, res) => {
  try {
    const user = await User.findOne({ _id: new ObjectId(req.user._id) });
    user.balance -= req.body.bet_amount;
    await user.save();

    res.json({
      success: true,
      balance: user.balance
    });
  } catch (err) {
    res.json({
      success: false,
      message: err.toString()
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
        created_at: moment(chatLog.created_at).format('LLL')
      };
      messages.push(message);
    }

    res.json({
      success: true,
      chatRoomInfo: {
        user_id: user._id,
        avatar: user.avatar,
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
    const temp = new Message({
      from: new ObjectId(from),
      to: new ObjectId(log.joined_user),
      message: message,
      is_anonymous: is_anonymous,
      is_read: false
    });
    temp.save();
    socket.sendMessage(log.joined_user, {
      from: from,
      to: log.joined_user,
      message: message,
      created_at: now
    });
  });
}

router.post('/bet', auth, async (req, res) => {
  try {
    const commission = await SystemSetting.findOne({ name: 'commission' });

    const start = new Date();
    if (req.body._id) {
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
          message: `DIS YOUR OWN STAKE CRAZY FOO-!`,
          betResult: -101
        });

        return;
      }

      if (roomInfo['status'] === 'finished') {
        res.json({
          success: false,
          message: 'THIS GAME HAS ENDED ALREADY',
          betResult: -100
        });

        return;
      }

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
          'play game ' +
          roomInfo['game_type']['game_type_name'] +
          ' - ' +
          roomInfo['room_number']
      });
      newTransactionJ = new Transaction({
        user: req.user,
        amount: 0,
        description:
          'play game ' +
          roomInfo['game_type']['game_type_name'] +
          ' - ' +
          roomInfo['room_number']
      });

      // if (req.body.is_anonymous == true) {
      //   req.user['balance'] -= 10;
      //   newTransactionJ.amount -= 10;
      // }

      let message = new Message({
        from: req.user,
        to: roomInfo['creator'],
        message: '',
        is_anonymous: req.body.is_anonymous,
        is_read: false
      });
      if (roomInfo['game_type']['game_type_name'] === 'RPS') {
        if (
          parseFloat(req.body.bet_amount) > parseFloat(roomInfo['user_bet'])
        ) {
          // Return an error or some other response to the user, e.g.:
          return res
            .status(400)
            .json({ error: 'Bet amount exceeds available balance.' });
        }
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        const availableBetItem = await RpsBetItem.findOne({
          _id: req.body.rps_bet_item_id,
          joiner_rps: ''
        });

        let bet_item = availableBetItem;
        if (!bet_item) {
          // Get next available item
          bet_item = await RpsBetItem.findOne({
            room: new ObjectId(req.body._id),
            joiner_rps: ''
          }).sort({ _id: 'asc' });
        }

        if (!bet_item) {
          // Create new RpsBetItem with predicted rps value
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

        newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        newGameLog.selected_rps = req.body.selected_rps;

        if (
          (bet_item.rps === 'R' && req.body.selected_rps == 'P') ||
          (bet_item.rps === 'P' && req.body.selected_rps == 'S') ||
          (bet_item.rps === 'S' && req.body.selected_rps == 'R')
        ) {
          newGameLog.game_result = 1;
          newTransactionJ.amount +=
            parseFloat(req.body.bet_amount) *
            2 *
            ((100 - commission.value) / 100);
          roomInfo['user_bet'] = parseInt(roomInfo['user_bet']);

          roomInfo['host_pr'] -= parseFloat(req.body.bet_amount);
          roomInfo['user_bet'] -= parseFloat(req.body.bet_amount);

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            'I won ' +
            // bet_item.bet_amount * 2 +
            req.body.bet_amount * 2 +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else if (bet_item.rps === req.body.selected_rps) {
          newGameLog.game_result = 0;

          newTransactionJ.amount += parseFloat(req.body.bet_amount);
          message.message =
            'We split ' +
            req.body.bet_amount * 2 +
            ' BUSD in our ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = -1;
          // newTransactionC.amount += parseFloat(req.body.bet_amount) * 2 * ((100 - commission.value) / 100);

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
              parseFloat(
                roomInfo['endgame_amount']
              ); /* ((100 - commission.value) / 100); */

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
            'I lost ' +
            req.body.bet_amount +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }

        bet_item.joiner = req.user;
        bet_item.joiner_rps = req.body.selected_rps;
        await bet_item.save();

        if (!roomInfo.joiners.includes(req.user)) {
          roomInfo.joiners.addToSet(req.user);
          await roomInfo.save();
        }

        if (roomInfo['user_bet'] <= 0) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'I won ' +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Quick Shoot') {
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);
        if (
          parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1) +
            parseFloat(req.body.bet_amount) -
            (roomInfo['qs_game_type'] - 1) * parseFloat(roomInfo['user_bet']) >
          parseFloat(roomInfo['user_bet'])
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
            parseFloat(roomInfo['user_bet']) +
            parseFloat(
              req.body.bet_amount
            ) /* (100 - commission.value) / 100)(parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1)) */;

          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            newTransactionC.amount +=
              parseFloat(roomInfo['user_bet']) -
              parseFloat(
                roomInfo['endgame_amount']
              ); /* ((100 - commission.value) / 100); */

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
              bankroll: roomInfo['user_bet']
            });
          }

          bet_item.joiner = req.user;
          bet_item.joiner_qs = req.body.selected_qs;
          await bet_item.save();

          message.message =
            'The boots suck, I just lost ' +
            req.body.bet_amount +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = 1;

          newTransactionJ.amount +=
            (parseFloat(req.body.bet_amount) +
              parseFloat(req.body.bet_amount) /
                (roomInfo['qs_game_type'] - 1)) *
            ((100 - commission.value) / 100);
          roomInfo['host_pr'] -=
            parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1);
          roomInfo['user_bet'] -=
            parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1);

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL_QS', {
              bankroll: roomInfo['user_bet']
            });
          }

          message.message =
            "You're not the best keeper are you? I just won " +
            (parseFloat(req.body.bet_amount) /
              parseFloat(roomInfo['qs_game_type'] - 1) +
              parseFloat(
                req.body.bet_amount
              )) /** parseFloat(roomInfo['qs_game_type']s) */ +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }

        bet_item.joiner = req.user;
        bet_item.joiner_qs = req.body.selected_qs_position;
        await bet_item.save();

        if (roomInfo['user_bet'] <= 0) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'I won ' +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Drop Game') {
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
          // Create new DropBetItem with predicted bet value
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
            ((100 - commission.value) / 100);
          roomInfo['user_bet'] = parseInt(roomInfo['user_bet']);

          roomInfo['host_pr'] -= bet_item.drop;
          roomInfo['user_bet'] -= bet_item.drop;

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
            'I won ' +
            // bet_item.bet_amount * 2 +
            parseFloat(bet_item.drop) +
            ' BUSD in ' +
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
            'We split ' +
            req.body.bet_amount * 2 +
            ' BUSD in our ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = -1;
          // newTransactionC.amount += parseFloat(req.body.bet_amount) * 2 * ((100 - commission.value) / 100);

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
              parseFloat(
                roomInfo['endgame_amount']
              ); /* ((100 - commission.value) / 100); */
            /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */

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
            'I lost ' +
            req.body.bet_amount +
            ' BUSD in ' +
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

        if (roomInfo['user_bet'] <= 0) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'I won ' +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Bang!') {
        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        const availableBetItem = await BangBetItem.findOne({
          _id: req.body.bang_bet_item_id,
          joiner_bang: ''
        });

        let bet_item = availableBetItem;
        if (bet_item) {
          // Get next available item
          bet_item = await BangBetItem.findOne({
            room: new ObjectId(req.body._id),
            joiner_bang: ''
          }).sort({ _id: 'asc' });
        } else {
          const allBetItems = await BangBetItem.find({
            room: new ObjectId(req.body._id)
          });
          let nextItem = predictNextBang(allBetItems);

          if (nextItem > roomInfo['user_bet']) {
            nextItem = roomInfo['user_bet'];
          }

          bet_item = new BangBetItem({
            room: new ObjectId(req.body._id),
            bang: nextItem
          });

          await bet_item.save();
        }

        newTransactionJ.amount -= parseFloat(req.body.bet_amount);

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        if (bet_item.bang < req.body.bet_amount) {
          newGameLog.selected_bang = bet_item.bang;
          newGameLog.game_result = 1;
          newTransactionJ.amount +=
            (parseFloat(req.body.bet_amount) + bet_item.bang) *
            ((100 - commission.value) / 100);
          roomInfo['user_bet'] = parseInt(roomInfo['user_bet']);

          roomInfo['host_pr'] -= bet_item.bang;
          roomInfo['user_bet'] -= bet_item.bang;

          if (req.io.sockets) {
            req.io.sockets.emit('UPDATED_BANKROLL', {
              bankroll: roomInfo['user_bet']
            });
          }

          const newBangGuess = new BangGuess({
            room: roomInfo._id,
            bet_amount: newGameLog.bet_amount,
            host_bang: bet_item.bang
          });
          await newBangGuess.save();

          newGameLog.room.bet_amount = bet_item.bang;

          const guesses = await BangGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('BANG_GUESSES', guesses);
          }

          message.message =
            'I won ' +
            // bet_item.bet_amount * 2 +
            parseFloat(bet_item.bang) +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else if (bet_item.bang === req.body.bet_amount) {
          newGameLog.game_result = 0;

          newTransactionJ.amount += parseFloat(req.body.bet_amount);
          // Save the new bang guess
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
            'We split ' +
            req.body.bet_amount * 2 +
            ' BUSD in our ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          newGameLog.game_result = -1;
          // newTransactionC.amount += parseFloat(req.body.bet_amount) * 2 * ((100 - commission.value) / 100);

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
              parseFloat(
                roomInfo['endgame_amount']
              ); /* ((100 - commission.value) / 100); */
            /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */

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
            'I lost ' +
            req.body.bet_amount +
            ' BUSD in ' +
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

        if (roomInfo['user_bet'] <= 0) {
          roomInfo.status = 'finished';
          newGameLog.game_result = 1;
          message.message =
            'I won ' +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Spleesh!') {
        // game
        newTransactionJ.amount -= req.body.bet_amount;

        roomInfo['host_pr'] += req.body.bet_amount;
        newGameLog.bet_amount = req.body.bet_amount;
        newGameLog.host_pr = roomInfo['host_pr'];

        if (roomInfo.bet_amount == req.body.bet_amount) {
          newGameLog.game_result = 1;
          const guesses = await SpleeshGuess.find({ room: roomInfo._id }).sort({
            created_at: 'ascending'
          });
          if (req.io.sockets) {
            req.io.sockets.emit('SPLEESH_GUESSES', guesses);
          }

          message.message =
            'I won ' +
            (roomInfo['host_pr'] + roomInfo['bet_amount']) +
            ' BUSD' +
            ' in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
          newTransactionJ.amount +=
            (roomInfo['host_pr'] + roomInfo['bet_amount']) *
            ((100 - commission.value) / 100);

          const originalBetAmount = roomInfo.pr;

          // Randomize the new bet amount
          let newBetAmount;
          if (roomInfo.spleesh_bet_unit === 1) {
            newBetAmount = Math.floor(Math.random() * 10) + 1;
            while (newBetAmount > originalBetAmount) {
              newBetAmount = Math.floor(Math.random() * 10) + 1;
            }
          } else if (roomInfo.spleesh_bet_unit === 10) {
            newBetAmount = (Math.floor(Math.random() * 10) + 1) * 10;
            while (newBetAmount > originalBetAmount) {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) * 10;
            }
          }
          if (newBetAmount <= roomInfo['user_bet']) {
            roomInfo.bet_amount = newBetAmount;
            roomInfo['user_bet'] = parseFloat(
              roomInfo['user_bet'] - parseFloat(roomInfo.bet_amount)
            );
            roomInfo['host_pr'] = 0;

            // Reset the spleesh guess array
            SpleeshGuess.deleteMany({ room: roomInfo._id }, function(err) {
              if (err) {
                console.log(err);
              }
            });

            const guesses = await SpleeshGuess.find({
              room: roomInfo._id
            }).sort({ created_at: 'ascending' });
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
              bet_amount: roomInfo['host_pr'],
              is_anonymous: roomInfo['is_anonymous'],
              game_result: -100
            });
            await newGameLogC.save();
          }
        } else {
          message.message =
            'I lost ' +
            req.body.bet_amount +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newGameLog.game_result = -1;

          // Save the new spleesh guess
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
            roomInfo['endgame_type'] &&
            roomInfo['host_pr'] >= roomInfo['endgame_amount']
          ) {
            const originalBetAmount = roomInfo.host_pr;

            // Randomize the new bet amount
            let newBetAmount;
            if (roomInfo.spleesh_bet_unit === 1) {
              newBetAmount = Math.floor(Math.random() * 10) + 1;
              while (newBetAmount > originalBetAmount) {
                newBetAmount = Math.floor(Math.random() * 10) + 1;
              }
            } else if (roomInfo.spleesh_bet_unit === 10) {
              newBetAmount = (Math.floor(Math.random() * 10) + 1) * 10;
              while (newBetAmount > originalBetAmount) {
                newBetAmount = (Math.floor(Math.random() * 10) + 1) * 10;
              }
            }

            roomInfo.bet_amount = newBetAmount;
            roomInfo['user_bet'] =
              parseFloat(roomInfo['user_bet']) -
              parseFloat(roomInfo.bet_amount);

            // Reset the spleesh guess array
            SpleeshGuess.deleteMany({ room: roomInfo._id }, function(err) {
              if (err) {
                console.log(err);
              }
            });

            // roomInfo.status = 'finished';
            newTransactionC.amount +=
              parseFloat(roomInfo['host_pr']) -
              parseFloat(
                roomInfo['endgame_amount']
              ); /* ((100 - commission.value) / 100); **/

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
            roomInfo['user_bet'] =
              parseFloat(roomInfo['user_bet']) +
              parseFloat(roomInfo['endgame_amount']);
            roomInfo['host_pr'] = 0;
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
            message: 'MAKE A DEPOSIT, BROKIE!'
          });
        }
        newTransactionJ.amount -= selected_box.box_price;
        newTransactionJ.amount +=
          selected_box.box_prize * ((100 - commission.value) / 100);

        if (selected_box.box_prize === 0) {
          message.message =
            'I lost ' +
            selected_box.box_price +
            ' BUSD opening an empty box in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];
        } else {
          message.message =
            'I won ' +
            selected_box.box_prize +
            ' BUSD in ' +
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
                let randomAmount =
                  (Math.random() < 0.5 ? -1 : 1) *
                    Math.floor(Math.random() * 2) +
                  1;
                let newPrice = box.box_price + randomAmount;
                while (newPrice <= 0) {
                  randomAmount =
                    (Math.random() < 0.5 ? -1 : 1) *
                      Math.floor(Math.random() * 2) +
                    1;
                  newPrice = box.box_price + randomAmount;
                }
                let newBox = new RoomBoxPrize({
                  room: roomInfo,
                  box_prize: boxPrizes[index],
                  box_price: newPrice,
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
              console.log('room status finished');
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

            /*lowest_box_price === -1 ? 0 : lowest_box_price; */

            // newTransactionC.amount += new_host_pr * ((100 - commission.value) / 100);

            const messageC =
              'I made ' +
              new_host_pr +
              ' BUSD from UNSTAKING ' +
              roomInfo['game_type']['short_name'] +
              '-' +
              roomInfo['room_number'];
            sendEndedMessageToJoiners(
              roomInfo._id,
              roomInfo['creator']['id'],
              messageC,
              roomInfo.is_anonymous
            );

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
              let randomAmount =
                (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * 2) +
                1;
              let newPrice = box.box_price + randomAmount;
              while (newPrice <= 0) {
                randomAmount =
                  (Math.random() < 0.5 ? -1 : 1) *
                    Math.floor(Math.random() * 2) +
                  1;
                newPrice = box.box_price + randomAmount;
              }
              let newBox = new RoomBoxPrize({
                room: roomInfo,
                box_prize: boxPrizes[index],
                box_price: newPrice,
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
      } else if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
        newGameLog.bet_amount = roomInfo['bet_amount'];
        newGameLog.brain_game_score = req.body.brain_game_score;

        newTransactionJ.amount -= roomInfo['bet_amount'];

        roomInfo['pr'] += roomInfo['bet_amount'];
        roomInfo['host_pr'] += roomInfo['bet_amount'];
        // roomInfo['user_bet'] += roomInfo['bet_amount'];
        if (roomInfo.brain_game_score == req.body.brain_game_score) {
          //draw          Draw, No Winner! PR will be split.
          message.message =
            'We split ' +
            roomInfo['bet_amount'] * 2 +
            ' BUSD in ' +
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
            'I won ' +
            roomInfo['bet_amount'] * 2 +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newTransactionJ.amount +=
            roomInfo['bet_amount'] * 2 * ((100 - commission.value) / 100);
          roomInfo['pr'] -= roomInfo['bet_amount'];
          roomInfo['host_pr'] -= roomInfo['bet_amount'];
          roomInfo['user_bet'] -= roomInfo['bet_amount'];
          if (roomInfo['user_bet'] <= 0 || roomInfo['host_pr'] <= 0) {
            roomInfo.status = 'finished';
          }

          newGameLog.game_result = 1;
          // roomInfo.status = 'finished';
        } else {
          //failed    Oops, back to school for you loser!!
          message.message =
            'I lost ' +
            roomInfo['bet_amount'] +
            ' BUSD in ' +
            roomInfo['game_type']['short_name'] +
            '-' +
            roomInfo['room_number'];

          newGameLog.game_result = -1;
          if (
            roomInfo['endgame_amount'] > 0 &&
            roomInfo['host_pr'] > roomInfo['endgame_amount']
          ) {
            // roomInfo.status = 'finished';

            newTransactionC.amount +=
              roomInfo['bet_amount']; /* ((100 - commission.value) / 100);*/

            const newGameLogC = new GameLog({
              room: roomInfo,
              creator: roomInfo['creator'],
              joined_user: roomInfo['creator'],
              game_type: roomInfo['game_type'],
              bet_amount: roomInfo['bet_amount'],
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
      roomInfo['creator'].save();

      req.user['balance'] += newTransactionJ.amount;

      if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
        req.user['balance'] += roomInfo['bet_amount'];
      }
      await req.user.save();

      newGameLog.save();
      await roomInfo.save();

      if (!roomInfo.joiners.includes(req.user)) {
        roomInfo.joiners.addToSet(req.user);
        await roomInfo.save();
      }

      const rooms = await getRoomList(10, 1, 'All');
      req.io.sockets.emit('UPDATED_ROOM_LIST', {
        _id: roomInfo['_id'],
        total: rooms.count,
        roomList: rooms.rooms,
        pages: Math.ceil(rooms.count / 10)
      });

      if (newTransactionJ.amount !== 0) {
        newTransactionJ.save();
      }
    
      if (newTransactionC.amount !== 0) {
        newTransactionC.save();
        socket.newTransaction(newTransactionC);
      }

      if (message.from._id !== message.to._id) {
        message.save();
        socket.sendMessage(message.to._id, {
          from: message.from._id,
          to: message.to_id,
          message: message.message,
          created_at: moment(new Date()).format('LLL')
        });

        socket.playSound(message.from._id, {
          from: message.from._id,
          to: message.to_id,
          message: message.message,
          created_at: moment(new Date()).format('LLL')
        });

        //   if (message.from._id) {
        //   if (req.io.sockets) {
        //     req.io.sockets.emit('PLAY_SOUND',  { message: message.message })
        //   }
        // }
      }

      res.json({
        success: true,
        message: 'successful bet',
        betResult: newGameLog.game_result,
        newTransaction: newTransactionJ,
        roomStatus: roomInfo.status
      });
    }
    const end = new Date();
  } catch (err) {
    res.json({
      success: false,
      message: err
    });
  }
});

module.exports = router;
