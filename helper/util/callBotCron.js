const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User.js');
const RpsBetItem = require('../../model/RpsBetItem.js');
const socketController = require('../../socketController.js');
const executeBet = require('./betExecutor.js');
const executeBet4 = require('./betExecutor4.js');
const { botAI, botCounterRandomness } = require('./predictNext.js');
const os = require('os');
let socketio = null;

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
    { userId: '65eafa5caea25957ac8ea60b', betArray: [75, 99, 9.5, 9.5, 2, 9.5, 9.5, 2.5, 20, 25, 50, 40, 9.5], delay: 2000 },
    { userId: '62b9ef88a5409449f63f7ccb', betArray: [1.5, 0.1, 2, 125, 1, 0.05, 2, 33, 66, 1, 1, 2.5, 10, 25, 50, 101], delay: 4000 },
    { userId: '65eafb7daea25957ac8ea60c', betArray: [6.5, 6.5, 6.5, 1.6, 32, 13, 3.5, 9.5, 5, 65, 75, 19, 15, 15, 0.95, 25, 10, 25, 20, 10, 5], delay: 6000 }
  ];

  if (io) {
    socketio = io;
  }

  try {
    for (const cronJob of cronJobs) {
      const user = await User.findOne({ _id: cronJob.userId });
      await executeCronJob(user, cronJob.betArray);
      await delay(cronJob.delay);
    }
  } catch (error) {
    console.error('Error executing cron jobs:', error);
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
let useFirstBetFunction = true; 
async function executeCronJob(user, betArray) {
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
      let nextState;
      let predictedBetAmount;

      const rpsBetItems = await RpsBetItem.find({
        joiner: user._id,
        room: roomId
      }).sort({ created_at: -1 }).limit(3);
      const rpsBetItems2 = await RpsBetItem.find({
        joiner: user._id,
        room: roomId
      }).sort({ created_at: -1 });

      if (rpsBetItems && rpsBetItems.length > 0) {
        // Determine nextState and predictedBetAmount based on strategy
        if (room.selectedStrategy === 'Random' || room.selectedStrategy === 'Martingale' || room.selectedStrategy === 'Adam' || room.selectedStrategy === 'Markov') {
          // Skill-issue strategy
          const randomnessResult = await botCounterRandomness(rpsBetItems);
          nextState = randomnessResult.counterMove;
          const penultimateSameAsLast = randomnessResult.risk;
          predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
        } else {
          // Other strategies
          const nextMove = await botAI(rpsBetItems2);
          nextState = nextMove.move;
          let penultimateSameAsLast;
          if (nextMove.risk >= 0.9) {
            penultimateSameAsLast = 3
          } else if (nextMove.risk >= 0.5) {
            penultimateSameAsLast = 2
          } else {
            penultimateSameAsLast = 1
          }
          predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
        }
      } else {
        // No previous moves, choose randomly
        const randomIndex = Math.floor(Math.random() * 3);
        const rpsOptions = ['R', 'P', 'S'];
        nextState = rpsOptions[randomIndex];
        predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
      }

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

      if (parseFloat(room.user_bet) >= 0.05 && predictedBetAmount >= 0 && predictedBetAmount <= parseFloat(room.user_bet)) {

        if (useFirstBetFunction) {
          await executeBet(req, true);
        } else {
          await executeBet4(req, true);
        }
        useFirstBetFunction = !useFirstBetFunction; // Toggle between bet functions
      }
    }
  } catch (error) {
    console.error('Error finding rooms and executing cron job:', error);
  }
}

cron.schedule('*/12 * * * * *', async () => {
  await callCronJobs(socketio);
});


module.exports = {
  callCronJobs,
};
