const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User.js');
const RpsBetItem = require('../../model/RpsBetItem.js');
const QsBetItem = require('../../model/QsBetItem.js');
const AttachedPlayer = require('../../model/AttachedPlayer.js');
const QBot = require('../../model/QBot.js');
const executeBet1 = require('./betExecutor.js');
const executeBet4 = require('./betExecutor4.js');
const SystemSetting = require('../../model/SystemSetting.js');
const {
  predictNext,
  reinforcementAI,
  predictNextOpenAI,
} = require('./predictNextJoiner');
const {
  getRandomItem_qs,
  predictNextQs,
  reinforcementAI_qs,
  openAIPredictionAI_qs,
} = require('./predictNextQsJoiner');

const os = require('os');
let socketio = null;
let isExecutingBet1 = false;
let isExecutingBet4 = false;

async function getRpsBetItems(roomId, user) {
  try {
    const rpsBetItems = await RpsBetItem.find({
      room: roomId,
      joiner: user._id,
    });

    // Reverse the order of the getped array
    return rpsBetItems;
  } catch (error) {
    console.error('Error getping RPS values:', error);
    return [];
  }
}

async function getQsBetItems(roomId, user) {
  try {
    const qsBetItems = await QsBetItem.find({
      room: roomId,
      joiner: user._id,
    })
      .sort({ created_at: -1 })
      .limit(50);

    return qsBetItems;
  } catch (error) {
    console.error('Error getping QS values:', error);
    return [];
  }
}

/**
 * Imitates the logic of the original predictNextBetAmount function.
 *
 * @param {number[]} betArray - array representing the user's bet range [minBet, maxBet].
 * @param {number} penultimateSameAsLast - the "risk" value (1,2,3,4).
 * @param {object} room - object containing at least { user_bet } field (equivalent to bankroll).
 * @returns {number} - A randomly chosen bet amount within the calculated range.
 */
async function predictNextBetAmount(betArray, penultimateSameAsLast, room) {
  // 1) If risk = 1, pick random bet in [0.0005..0.001]
  if (penultimateSameAsLast === 1) {
    const minFixed = 0.0005;
    const maxFixed = 0.001;
    const randomBet = minFixed + Math.random() * (maxFixed - minFixed);
    return parseFloat(randomBet.toFixed(6));
  }

  // 2) Determine the absolute lower & upper bound
  //    minBet is the larger of betArray[0] and 0.0005
  //    maxBet is the smaller of betArray[1] and room.user_bet
  const minVal = Math.max(betArray[0] || 0, 0.0005);
  const maxVal = Math.min(betArray[1] || 0, parseFloat(room.user_bet));

  // If invalid or max < min, fall back to minVal
  if (isNaN(minVal) || isNaN(maxVal) || maxVal < minVal) {
    return minVal;
  }

  // 3) Decide the portion of [minVal..maxVal] based on risk
  //    risk=2 => a lower fraction, risk=3 => moderate fraction, risk=4 => upper fraction
  let lowerFrac, upperFrac;
  switch (penultimateSameAsLast) {
    case 2:
      // e.g. lower fraction: ~2.5% .. 20% of the range
      lowerFrac = 0.025;
      upperFrac = 0.2;
      break;
    case 3:
      // e.g. moderate fraction: 20% .. 40% of the range
      lowerFrac = 0.2;
      upperFrac = 0.4;
      break;
    case 4:
      // e.g. upper fraction: 40% .. 100% of the range
      lowerFrac = 0.4;
      upperFrac = 1.0;
      break;
    default:
      // If penultimateSameAsLast = 0 or any unexpected value => full range
      lowerFrac = 0;
      upperFrac = 1.0;
      break;
  }

  // 4) Calculate numeric bounds within [minVal..maxVal]
  const totalRange = maxVal - minVal;
  const chosenMin = minVal + totalRange * lowerFrac;
  const chosenMax = minVal + totalRange * upperFrac;

  // 5) Choose a random amount in [chosenMin..chosenMax]
  const randomBet = chosenMin + Math.random() * (chosenMax - chosenMin);

  // 6) Round to 6 decimal places (or modify as needed)
  return parseFloat(randomBet.toFixed(6));
}

// List of valid strategy names in JoiningStrategySchema
const validJoiningStrategies = ['markov', 'adam', 'gpt3'];

// Function to pick a sub-strategy based on probabilities
const pickSubStrategy = (joiningObj) => {
  const subStrategyValues = [];

  // Collect sub-strategies and their values
  for (const strategy in joiningObj) {
    if (validJoiningStrategies.includes(strategy)) {
      const subStrategies = joiningObj[strategy];

      if (typeof subStrategies === 'object') {
        for (const subStrategy in subStrategies) {
          const value = subStrategies[subStrategy];
          if (typeof value === 'number' && value >= 0) {
            subStrategyValues.push({
              parentStrategy: strategy,
              name: subStrategy,
              value: value,
            });
          }
        }
      }
    }
  }

  // Calculate probabilities for each sub-strategy
  const total = subStrategyValues.reduce((sum, sub) => sum + sub.value, 0);

  if (total === 0 && subStrategyValues.length > 0) {
    // If total is 0, pick a random sub-strategy
    const randomIndex = Math.floor(Math.random() * subStrategyValues.length);
    return {
      parentStrategy: subStrategyValues[randomIndex].parentStrategy,
      name: subStrategyValues[randomIndex].name,
      probability: 1 / subStrategyValues.length, // Since all have equal probability
    };
  } else if (total > 0) {
    const probabilities = subStrategyValues.map((sub) => ({
      parentStrategy: sub.parentStrategy,
      name: sub.name,
      probability: sub.value / total,
    }));

    const random = Math.random();
    let cumulativeProbability = 0;
    for (const sub of probabilities) {
      cumulativeProbability += sub.probability;
      if (random < cumulativeProbability) {
        return sub;
      }
    }
  }

  // If no valid sub-strategy was found or if there's some edge case
  return null;
};

const formatStrategyName = (strategy) => {
  return strategy.charAt(0).toUpperCase() + strategy.slice(1);
};

async function callCronJobs(io) {
  const cronJobs = [
    {
      userId: '65eafc72aea25957ac8ea60d',
      betArray: [
        0.14022, 0.1818, 0.10998, 0.1879, 0.101, 0.0362, 0.41, 0.1526, 0.1368,
        0.1, 2.0839, 0.0725, 0.401, 0.21, 0.3002, 0.4058, 0.439, 0.1269, 0.412,
        0.1813, 0.1985, 0.2664, 0.149, 0.42, 0.0216,
      ],
      delay: 0,
    },
    {
      userId: '65eafa5caea25957ac8ea60b',
      betArray: [
        0.593, 0.75, 0.118, 1.0494, 0.192, 0.1465, 0.10087, 0.2742, 0.1694,
        0.4492, 0.09, 0.0765, 0.1382,
      ],
      delay: 4000,
    },
    {
      userId: '62b9ef88a5409449f63f7ccb',
      betArray: [
        0.161, 0.0866, 0.3388, 0.31543, 0.31, 0.1906, 0.0665, 0.223, 0.477,
        0.193, 0.5688, 0.504, 0.0336, 0.221, 0.20617, 0.121,
      ],
      delay: 8000,
    },
    {
      userId: '65eafb7daea25957ac8ea60c',
      betArray: [
        0.1614, 0.1126, 0.0739, 0.598, 0.2383, 0.0338, 0.21401, 0.4473, 0.3005,
        0.1878, 0.0892, 0.0763, 0.161, 0.254, 0.0456, 0.1852, 0.1906, 0.443,
        0.25, 0.3989, 0.0832,
      ],
      delay: null,
    },
  ];

  const cronJobUserIds = cronJobs.map((job) => job.userId);

  if (io) {
    socketio = io;
  }

  try {
    for (const cronJob of cronJobs) {
      // call bot
      const user = await User.findOne({ _id: cronJob.userId });
      const room = await Room.findOne({
        joiners: cronJob.userId,
        status: 'open',
        is_private: false,
      });
      if (user && room) {
        const result = await executeCronJob(
          user,
          cronJob.betArray,
          cronJobUserIds,
          true,
          room,
          'Markov',
        );
        if (result && result.success) {
          await delay(cronJob.delay);
        }
      }
    }
    // attached players
    const attachedPlayers = await AttachedPlayer.find({});
    for (const player of attachedPlayers) {
      const user = await User.findOne({ _id: player.user });
      const room = await Room.findOne({
        _id: player.room,
        status: 'open',
        is_private: false,
      });
      if (user && room) {
        const result = await executeCronJob(
          user,
          player.bet_amounts,
          [player.user.toString()],
          false,
          room,
          player.selected_strategy,
        );
        if (result && result.success) {
          await delay(4000);
        }
      }
    }

    // qbot joining
    const qBots = await QBot.find({ active: true });
    for (const bot of qBots) {
      const chosenSubStrategy = pickSubStrategy(bot.joining);
      if (chosenSubStrategy) {
        const formattedStrategyName = formatStrategyName(
          chosenSubStrategy.parentStrategy,
        );
        const formattedSubStrategyName = formatStrategyName(
          chosenSubStrategy.name,
        );
        const user = await User.findOne({ _id: bot.user });
        const room = await Room.findOne({
          status: 'open',
          selectedStrategy: formattedStrategyName,
          creator: { $ne: bot.user },
          is_private: false,
        });

        const qbot_bet_amounts = user.range;

        qbot_bet_amounts.sort((a, b) => a - b);
        if (user && room) {
          const result = await executeCronJob(
            user,
            qbot_bet_amounts,
            [bot.user.toString()],
            false,
            room,
            formattedSubStrategyName,
            true,
          );

          if (result && result.success) {
            await delay(4000);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error executing cron jobs:', error);
  } finally {
    try {
      let updatedRooms = await Room.find({ status: 'open' })
        .sort({ updated_at: -1 })
        .populate('creator', 'avatar username accessory status totalWagered')
        .populate('joiners', 'avatar _id totalWagered username accessory') // only these fields
        .populate('game_type', 'short_name description')
        .lean();
      updatedRooms = updatedRooms.map((room) => {
        const joiners = (room.joiners || []).map((joiner) => ({
          avatar: joiner.avatar,
          rank: joiner.totalWagered,
          username: joiner.username,
          accessory: joiner.accessory,
          user_id: joiner._id,
        }));

        const creator = room.creator?._id || '';
        const creator_avatar = room.creator?.avatar || '';
        const creator_username = room.creator?.username || '';
        const creator_rank = room.creator?.totalWagered || 0;
        const creator_accessory = room.creator?.accessory || '';
        const creator_status = room.creator?.status || '';

        let gameTypeData = null;
        if (Array.isArray(room.game_type)) {
          // If game_type is an array of references:
          gameTypeData = room.game_type.map((gt) => ({
            _id: gt._id,
            short_name: gt.short_name,
            description: gt.description,
          }));
        } else if (room.game_type) {
          // If it's a single reference:
          gameTypeData = {
            _id: room.game_type._id,
            short_name: room.game_type.short_name,
            description: room.game_type.description,
          };
        }
        return {
          ...room,
          creator,
          creator_avatar,
          creator_status,
          username: creator_username,
          rank: creator_rank,
          accessory: creator_accessory,
          joiners,
          game_type: gameTypeData,
        };
      });
      if (socketio) {
        socketio.emit('UPDATED_ROOM_LIST', updatedRooms);
      }
    } catch (err) {
      console.error('Error fetching or emitting updated room list:', err);
    }
  }
}

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function executeCronJob(
  user,
  betArray,
  userIds,
  useFirstBetFunction,
  room = null,
  ai_mode = null,
  qbot = false,
) {
  if (!room) {
    return;
  }
  try {
    const rooms = room
      ? [room]
      : await Room.find({
          status: 'open',
          is_private: false,
          creator: { $ne: user._id },
        });

    const randomRoom = room
      ? room
      : rooms[Math.floor(Math.random() * rooms.length)];
    const roomId = randomRoom._id;
    const gameType = randomRoom.game_type;
    let nextState;
    let predictedBetAmount;
    let penultimateSameAsLast;
    if (gameType.toString() === '62a25d2a723b9f15709d1ae7') {
      // rps BOT
      if (useFirstBetFunction) {
        const randomIndex = Math.floor(Math.random() * 3);
        const rpsOptions = ['R', 'P', 'S'];
        nextState = rpsOptions[randomIndex];

        const randomValue = Math.random();
        if (randomValue <= 0.6) {
          penultimateSameAsLast = 1;
        } else if (randomValue <= 0.9) {
          penultimateSameAsLast = 2;
        } else {
          penultimateSameAsLast = 3;
        }

        predictedBetAmount = await predictNextBetAmount(
          betArray,
          penultimateSameAsLast,
          room,
        );
      } else {
        // attached RPS (PLAYER)
        const rpsBetItems = await getRpsBetItems(roomId, user);

        if (betArray && betArray.length > 0) {
          if (ai_mode === 'Markov') {
            nextState = await predictNext(rpsBetItems, true);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, room);
          } else if (ai_mode === 'Adam') {
            const nextMove = await reinforcementAI(rpsBetItems);
            nextState = nextMove.move;
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              nextMove.risk,
              room,
            );
          } else if (ai_mode === 'GPT3') {
            nextState = await predictNextOpenAI(rpsBetItems, true);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, room);
          }
        }
        if (predictedBetAmount > parseFloat(user.balance)) {
          try {
            await AttachedPlayer.deleteOne({ user: user._id, room: room._id });
            return;
          } catch (error) {
            console.error('Error deleting AttachedPlayer document:', error);
          }
        }
        if (predictedBetAmount > parseFloat(room.user_bet)) {
          predictedBetAmount = parseFloat(room.user_bet);
        }
      }
    } else if (gameType.toString() === '62a25d2a723b9f15709d1aeb') {
      // QS BOT
      if (useFirstBetFunction) {
        nextState = await getRandomItem_qs(room.qs_game_type);
        const randomValue = Math.random();
        if (randomValue <= 0.6) {
          penultimateSameAsLast = 1;
        } else if (randomValue <= 0.9) {
          penultimateSameAsLast = 2;
        } else {
          penultimateSameAsLast = 3;
        }
        predictedBetAmount = await predictNextBetAmount(
          betArray,
          penultimateSameAsLast,
          room,
        );
      } else {
        // attached / q-bot qs (PLAYER)
        const qsBetItems = await getQsBetItems(roomId, user);

        if (betArray && betArray.length > 0) {
          if (ai_mode === 'Adam') {
            const nextMove = await reinforcementAI_qs(
              qsBetItems,
              room.qs_game_type,
            );
            nextState = nextMove.move;
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              nextMove.risk,
              room,
            );
          }
          if (ai_mode === 'Markov') {
            nextState = await predictNextQs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, room);
          } else if (ai_mode === 'GPT3') {
            nextState = await openAIPredictionAI_qs(
              qsBetItems,
              room.qs_game_type,
            );
            predictedBetAmount = await predictNextBetAmount(betArray, 0, room);
          }
        }

        if (
          predictedBetAmount / (room.qs_game_type - 1) +
            predictedBetAmount -
            (room.qs_game_type - 1) * parseFloat(room.user_bet) >
            parseFloat(room.user_bet) ||
          predictedBetAmount > user.balance
        ) {
          try {
            await AttachedPlayer.deleteOne({ user: user._id, room: room._id });
          } catch (error) {
            console.error('Error deleting AttachedPlayer document:', error);
          }
        }

        if (
          predictedBetAmount / (room.qs_game_type - 1) +
            predictedBetAmount -
            (room.qs_game_type - 1) * parseFloat(room.user_bet) >
            parseFloat(room.user_bet) ||
          predictedBetAmount > parseFloat(room.user_bet)
        ) {
          predictedBetAmount = parseFloat(room.user_bet);
        }
      }
    } else {
      console.log('Game type does not match, skipping this room.');

      return;
    }

    const req = {
      params: {
        _id: roomId,
      },
      user: user,
      io: socketio,
      body: {
        _id: roomId,
        bet_amount: predictedBetAmount,
        selected_qs_position: nextState,
        selected_rps: nextState,
        ai_mode: ai_mode,
      },
    };

    // Cap predictedBetAmount to room.user_bet if it's higher
    if (predictedBetAmount > parseFloat(room.user_bet)) {
      predictedBetAmount = parseFloat(room.user_bet);
    }

    if (
      parseFloat(room.user_bet) >= 0.0005 &&
      predictedBetAmount >= 0 &&
      predictedBetAmount <= parseFloat(room.user_bet)
    ) {
      if (
        useFirstBetFunction &&
        !isExecutingBet1 &&
        userIds.some((id) => room.joiners.includes(id))
      ) {
        // BOT
        isExecutingBet1 = true;
        await executeBet1(req, true);
        isExecutingBet1 = false;
        await SystemSetting.updateOne(
          { name: 'last_updated_bot' },
          { updated_at: new Date() },
        );
      } else if (!useFirstBetFunction && !isExecutingBet4) {
        // attached || qbot
        isExecutingBet4 = true;
        await executeBet4(req, true, qbot);
        isExecutingBet4 = false;
        await SystemSetting.updateOne(
          { name: 'last_updated_bot' },
          { updated_at: new Date() },
        );
      }
    }
  } catch (error) {
    console.error('Error finding rooms and executing cron job:', error);
  }
}

cron.schedule('*/10 * * * * *', async () => {
  await callCronJobs(socketio);
});
module.exports = {
  callCronJobs,
};
