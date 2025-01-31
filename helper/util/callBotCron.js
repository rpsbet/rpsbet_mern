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

async function predictNextBetAmount(
  betArray,
  penultimateSameAsLast,
  room,
) {
  const allStates = Array.from(new Set(betArray));
  if (penultimateSameAsLast !== 0) {
    if (penultimateSameAsLast >= 3) {
      const maxState = Math.max(...allStates);
      return Math.min(Math.max(maxState, 0.05), parseFloat(room.user_bet));
    } else if (penultimateSameAsLast === 2) {
      const sortedStates = allStates.sort((a, b) => b - a);

      if (sortedStates.length >= 2) {
        const secondHighestState = sortedStates[1];
        return Math.min(
          Math.max(secondHighestState, 0.05),
          parseFloat(room.user_bet),
        );
      } else {
        const firstState = sortedStates[0];
        return Math.min(Math.max(firstState, 0.05), parseFloat(room.user_bet));
      }
    } else if ((penultimateSameAsLast = 1)) {
      const minState = Math.min(...allStates);
      return Math.min(Math.max(minState, 0.05), parseFloat(room.user_bet));
    }
  } else {
    const filteredBetArray = betArray.filter((value) => value > 0.05);
    const randomIndex = Math.floor(Math.random() * filteredBetArray.length);
    return filteredBetArray[randomIndex];
  }
}

// List of valid strategy names in JoiningStrategySchema
const validJoiningStrategies = [
  'markov',
  'adam',
  'gpt3'
];

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
          if (typeof value === 'number' && value > 0) {
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
        0.04022, 0.000818, 0.000998, 0.0879, 0.0001, 0.0362, 0.0001, 0.00526, 0.0368,
        0.0001, 0.0839, 0.000725, 0.0001, 0.0001, 0.0002, 0.0058, 0.0239, 0.0269,
        0.012, 0.0813, 0.0985, 0.0664, 0.0149, 0.0022, 0.0216,
      ],
      delay: 0,
    },
    {
      userId: '65eafa5caea25957ac8ea60b',
      betArray: [
        0.000593, 0.075, 0.0118, 0.0494, 0.0092, 0.00465, 0.00087, 0.0742, 0.0694,
        0.0492, 0.009, 0.0765, 0.00382,
      ],
      delay: 4000,
    },
    {
      userId: '62b9ef88a5409449f63f7ccb',
      betArray: [
        0.061, 0.0866, 0.00388, 0.00543, 0.0001, 0.000906, 0.0665, 0.0223, 0.0177,
        0.093, 0.0688, 0.0004, 0.0336, 0.0021, 0.00617, 0.0021,
      ],
      delay: 8000,
    },
    {
      userId: '65eafb7daea25957ac8ea60c',
      betArray: [
        0.00614, 0.00126, 0.00739, 0.0798, 0.0383, 0.00338, 0.00401, 0.0473, 0.0005,
        0.00878, 0.00492, 0.00763, 0.00061, 0.054, 0.00456, 0.00852, 0.0906, 0.043,
        0.00025, 0.00989, 0.00532,
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

        const numElements = 6;
        let remainingBalance = user.balance;
        const qbot_bet_amounts = [];

        for (let i = 0; i < numElements; i++) {
          const maxBet = remainingBalance - (numElements - i - 1);
          const bet = Math.floor(Math.random() * maxBet) + 1;

          qbot_bet_amounts.push(bet);
          remainingBalance -= bet;

          if (remainingBalance <= numElements - i - 1) {
            while (qbot_bet_amounts.length < numElements) {
              qbot_bet_amounts.push(1);
              remainingBalance--;
            }
            break;
          }
        }

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
  } 
//   finally {
//     try {
//       let updatedRooms = await Room.find({ status: 'open' })
//         .sort({ updated_at: -1 })
//         .populate('joiners', 'avatar totalWagered username accessory') // only these fields
//         .lean();
//       updatedRooms = updatedRooms.map((room) => {
//         const joiner_avatars = (room.joiners || []).map((joiner) => ({
//           avatar: joiner.avatar,
//           rank: joiner.totalWagered,
//           username: joiner.username,
//           accessory: joiner.accessory,
//         }));
//         return {
//           ...room,
//           joiner_avatars,
//         };
//       });

// console.log(updatedRooms.length)
//       if (socketio) {
//         socketio.emit('UPDATED_ROOM_LIST', updatedRooms);
//       }

//     } catch (err) {
//       console.error('Error fetching or emitting updated room list:', err);
//     }
//   }
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
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              0,
              room,
            );
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
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              0,
              room,
            );
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
          } if (ai_mode === 'Markov') {
            nextState = await predictNextQs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              0,
              room,
            );
          } else if (ai_mode === 'GPT3') {
            nextState = await openAIPredictionAI_qs(
              qsBetItems,
              room.qs_game_type,
            );
            predictedBetAmount = await predictNextBetAmount(
              betArray,
              0,
              room,
            );
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
    if (
      parseFloat(room.user_bet) >= 0.1 &&
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
