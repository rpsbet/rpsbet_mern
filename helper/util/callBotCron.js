const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User.js');
const RpsBetItem = require('../../model/RpsBetItem.js');
const QsBetItem = require('../../model/QsBetItem.js');
const socketController = require('../../socketController.js');
const executeBet = require('./betExecutor.js');
const executeBet4 = require('./betExecutor4.js');
const saveDocumentWithRetry = require('./retrySave');
const { botAI, botCounterRandomness } = require('./predictNext.js');
const { getRandomItem_qs } = require('./predictNextQs.js');
const os = require('os');
let socketio = null;
let isExecutingBet = false;
let isExecutingBet4 = false;

async function predictNextBetAmount(betArray, penultimateSameAsLast, smoothingFactor = 0.01, randomnessFactor = 0.2, threshold = 0.0005, room) {
  const allStates = Array.from(new Set(betArray)); // Get all unique states
  if (penultimateSameAsLast !== 0) {
    if (penultimateSameAsLast >= 3) {
      // Return the highest value from allStates without 50%
      const maxState = Math.max(...allStates);
      return Math.min(Math.max(maxState, 0.05), parseFloat(room.user_bet));
    } else if (penultimateSameAsLast === 2) {
      // Return the second highest value from allStates
      const sortedStates = allStates.sort((a, b) => b - a);

      if (sortedStates.length >= 2) {
        const secondHighestState = sortedStates[1];
        return Math.min(Math.max(secondHighestState, 0.05), parseFloat(room.user_bet));
      } else {
        // If there is no second state, return the first state from allStates
        const firstState = sortedStates[0];
        return Math.min(Math.max(firstState, 0.05), parseFloat(room.user_bet));
      }
    } else if (penultimateSameAsLast === 1) {
      // Return the lowest value from allStates
      const minState = Math.min(...allStates);
      return Math.min(Math.max(minState, 0.05), parseFloat(room.user_bet));
    }
  } else {
    // If penultimateSameAsLast equals 0, return a random value from betArray > 0.05
    const filteredBetArray = betArray.filter(value => value > 0.05);
    const randomIndex = Math.floor(Math.random() * filteredBetArray.length);
    return filteredBetArray[randomIndex];
  }
}

async function callCronJobs(io) {
  const cronJobs = [
    { userId: '65eafc72aea25957ac8ea60d', betArray: [0.5, 0.1, 25, 0.1, 2, 1, 1, 25, 125, 1, 1.75, 1, 1, 1, 2, 33, 66, 1, 1, 2.5, 10, 25, 50, 180, 1], delay: 0 },
    { userId: '65eafa5caea25957ac8ea60b', betArray: [75, 99, 9.5, 9.5, 2, 9.5, 9.5, 2.5, 20, 25, 50, 40, 9.5], delay: 4000 },
    { userId: '62b9ef88a5409449f63f7ccb', betArray: [1.5, 0.1, 2, 125, 1, 0.05, 2, 33, 66, 1, 1, 2.5, 10, 25, 50, 101], delay: 8000 },
    { userId: '65eafb7daea25957ac8ea60c', betArray: [6.5, 6.5, 6.5, 1.6, 32, 13, 3.5, 9.5, 5, 65, 75, 19, 15, 15, 0.95, 25, 10, 25, 20, 10, 5], delay: 12000 }
  ];

  const cronJobUserIds = cronJobs.map(job => job.userId);

  if (io) {
    socketio = io;
  }

  try {
    for (const cronJob of cronJobs) {
      const user = await User.findOne({ _id: cronJob.userId });
      const result = await executeCronJob(user, cronJob.betArray, cronJobUserIds);
      if (result && result.success) {
        await delay(cronJob.delay);
      }
    }
  } catch (error) {
    console.error('Error executing cron jobs:', error);
    // Handle overall error in cron jobs execution
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let useFirstBetFunction = true;

async function executeCronJob(user, betArray, cronJobUserIds) {

  if (!user.username.includes('BOT')) {
    console.log('User is not a bot. Skipping execution.');
    return;
  }

  try {

    const rooms = await Room.find({
      'joiners': user._id,
      status: 'open',
    });

    for (const room of rooms) {
      const roomId = room._id;
      const gameType = room.game_type;

      let nextState;
      let predictedBetAmount;

      let betItems;
      let penultimateSameAsLast;
      
      if (gameType.toString() === '62a25d2a723b9f15709d1ae7') {
        betItems = await RpsBetItem.find({
          joiner: user._id,
          room: roomId
        }).sort({ created_at: -1 }).limit(3);

        if (betItems && betItems.length > 0) {
          const randomnessResult = await botCounterRandomness(betItems);
          nextState = randomnessResult.counterMove;
          penultimateSameAsLast = randomnessResult.risk;
        } else {
          // No previous moves, choose randomly
          const randomIndex = Math.floor(Math.random() * 3);
          const rpsOptions = ['R', 'P', 'S'];
          nextState = rpsOptions[randomIndex];
          penultimateSameAsLast = 0;
        }
      } else if (gameType.toString() === '62a25d2a723b9f15709d1aeb') {

        nextState = await getRandomItem_qs(room.qs_game_type);

        const randomValue = Math.random();
        if (randomValue <= 0.6) {
          penultimateSameAsLast = 1;
        } else if (randomValue <= 0.9) {
          penultimateSameAsLast = 2;
        } else {
          penultimateSameAsLast = 3;
        }
      }
      predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);

      const req = {
        params: {
          _id: roomId
        },
        user: user,
        io: socketio,
        body: {
          _id: roomId,
          selected_rps: nextState,
          bet_amount: predictedBetAmount
        }
      };

      if (parseFloat(room.user_bet) >= 0.1 && predictedBetAmount >= 0 && predictedBetAmount <= parseFloat(room.user_bet) && cronJobUserIds.some(id => room.joiners.includes(id))) {

        if (useFirstBetFunction && !isExecutingBet) {
          isExecutingBet = true;
          await executeBet(req, true);
          isExecutingBet = false;
        }
        else if (!useFirstBetFunction && !isExecutingBet4) {
          isExecutingBet4 = true;
          await executeBet4(req, true);
          isExecutingBet4 = false;
        }
        useFirstBetFunction = !useFirstBetFunction; // Toggle between bet functions
      }

    }

  } catch (error) {
    console.error('Error finding rooms and executing cron job:', error);
  }
}

cron.schedule('*/14 * * * * *', async () => {
  await callCronJobs(socketio);
});

module.exports = {
  callCronJobs,
};
