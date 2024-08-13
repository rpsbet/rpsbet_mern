const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User.js');
const RpsBetItem = require('../../model/RpsBetItem.js');
const QsBetItem = require('../../model/QsBetItem.js')
const AttachedPlayer = require('../../model/AttachedPlayer.js');
const QBot = require('../../model/QBot.js');
const executeBet1 = require('./betExecutor.js');
const executeBet4 = require('./betExecutor4.js');
const { predictNext, reinforcementAI, innovate, patternBasedAI, counterSwitchAI, NPC, generatePattern, skillIssue, getRandomMove, martingaleStrategy } = require('./predictNext');
const { NPC_qs, patternBasedAI_qs, innovate_qs, getRandomItem_qs, counterSwitchAI_qs, generatePattern_qs, getCopyCatItem_qs, predictNextQs, reinforcementAI_qs, skillIssue_qs, martingaleStrategy_qs } = require('./predictNextQs');

const os = require('os');
let socketio = null;
let isExecutingBet1 = false;
let isExecutingBet4 = false;
async function swapRpsBetItems(roomId, user) {
  try {
    const rpsBetItems = await RpsBetItem.find({
      room: roomId,
      joiner: user._id
    })
      .sort({ created_at: -1 })
      .limit(50);

    const swappedRpsBetItems = rpsBetItems.map(item => ({
      ...item.toObject(),
      rps: item.joiner_rps,
      joiner_rps: item.rps,
    }));

    const rpsArray = swappedRpsBetItems.map(item => item.rps);
    const joinerRpsArray = swappedRpsBetItems.map(item => item.joiner_rps);


    return swappedRpsBetItems;
  } catch (error) {
    console.error('Error swapping RPS values:', error);
    return [];
  }
}


async function swapQsBetItems(roomId, user) {
  try {
    const qsBetItems = await QsBetItem.find({
      room: roomId,
      joiner: user._id
    })
      .sort({ created_at: -1 })
      .limit(50);
    const swappedQsBetItems = qsBetItems.map(item => ({
      ...item.toObject(),
      qs: item.joiner_qs,
      joiner_qs: item.qs
    }));

    return swappedQsBetItems;
  } catch (error) {
    console.error('Error swapping QS values:', error);
    return [];
  }
}


async function predictNextBetAmount(betArray, penultimateSameAsLast, smoothingFactor = 0.01, randomnessFactor = 0.2, threshold = 0.0005, room) {
  const allStates = Array.from(new Set(betArray));
  if (penultimateSameAsLast !== 0) {
    if (penultimateSameAsLast >= 3) {
      const maxState = Math.max(...allStates);
      return Math.min(Math.max(maxState, 0.05), parseFloat(room.user_bet));
    } else if (penultimateSameAsLast === 2) {
      const sortedStates = allStates.sort((a, b) => b - a);

      if (sortedStates.length >= 2) {
        const secondHighestState = sortedStates[1];
        return Math.min(Math.max(secondHighestState, 0.05), parseFloat(room.user_bet));
      } else {
        const firstState = sortedStates[0];
        return Math.min(Math.max(firstState, 0.05), parseFloat(room.user_bet));
      }
    } else if (penultimateSameAsLast = 1) {
      const minState = Math.min(...allStates);
      return Math.min(Math.max(minState, 0.05), parseFloat(room.user_bet));
    }
  } else {
    const filteredBetArray = betArray.filter(value => value > 0.05);
    const randomIndex = Math.floor(Math.random() * filteredBetArray.length);
    return filteredBetArray[randomIndex];
  }
}

// List of valid strategy names in JoiningStrategySchema
const validJoiningStrategies = [
  'copycat', 'hiddenmarkov', 'markov', 'random', 'feedback', 'innovate', 'hertz',
  'martingale', 'adam', 'tesla', 'npc', 'sniper', 'skillissue', 'skillissue2'
];

// Function to sum all numeric values in nested joining strategies
const sumJoiningStrategies = (joiningObj) => {
  let total = 0;
  for (const strategy in joiningObj) {
    if (validJoiningStrategies.includes(strategy)) {
      const subStrategies = joiningObj[strategy];
      if (typeof subStrategies === 'object') {
        for (const subStrategy in subStrategies) {
          const value = subStrategies[subStrategy];
          if (typeof value === 'number') {
            total += value;
          }
        }
      }
    }
  }
  return total;
};

// Function to sum all numeric values in flat hosting strategies
const sumHostingStrategies = (hostingObj) => {
  let total = 0;
  for (const strategy in hostingObj) {
    const value = hostingObj[strategy];
    if (typeof value === 'number') {
      total += value;
    }
  }
  return total;
};

// Function to choose one of the totals based on their probabilities
const chooseBasedOnProbability = (joiningTotal, hostingTotal) => {
  // Calculate probabilities
  const totalSum = joiningTotal + hostingTotal;
  const joiningProbability = totalSum > 0 ? joiningTotal / totalSum : 0;
  const hostingProbability = totalSum > 0 ? hostingTotal / totalSum : 0;

  // Generate a random number between 0 and 1
  const randomValue = Math.random();

  // Determine which total is chosen based on probability
  const chosenTotal = randomValue < joiningProbability ? joiningTotal : hostingTotal;
  const chosenType = randomValue < joiningProbability ? 'joining' : 'hosting';

  return {
    chosenTotal,
    chosenType,
    joiningProbability,
    hostingProbability,
    randomValue
  };
};

// Function to pick a sub-strategy based on probabilities
const pickSubStrategy = (joiningObj, joiningTotal) => {
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
              value: value
            });
          }
        }
      }
    }
  }


  // Calculate probabilities for each sub-strategy
  const total = subStrategyValues.reduce((sum, sub) => sum + sub.value, 0);
  const probabilities = subStrategyValues.map(sub => ({
    parentStrategy: sub.parentStrategy,
    name: sub.name,
    probability: sub.value / total
  }));

  // Generate a random number and pick a sub-strategy based on probabilities
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
  switch (strategy) {
    case 'skillissue':
      return 'Skill-issue';
    case 'skillissue2':
      return 'Skill-issue-2';
    case 'copycat':
      return 'CopyCat';
    case 'hiddenmarkov':
      return 'Hidden Markov';
    case 'npc':
      return 'NPC';
    default:
      return strategy.charAt(0).toUpperCase() + strategy.slice(1);
  }
};


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
      const room = await Room.findOne({ joiners: cronJob.userId, status: "open" });
      if (user && room) {  // Only proceed if a room is found
        const result = await executeCronJob(user, cronJob.betArray, cronJobUserIds, true, room, 'Random');
        if (result && result.success) {
          await delay(cronJob.delay);
        }
      }
    }

    const attachedPlayers = await AttachedPlayer.find({});
    for (const player of attachedPlayers) {
      const user = await User.findOne({ _id: player.user });
      const room = await Room.findOne({ _id: player.room, status: 'open' });
      if (user && room) {
        const result = await executeCronJob(user, player.bet_amounts, [player.user.toString()], false, room, player.selected_strategy);
        if (result && result.success) {
          await delay(4000); // Adjust delay as needed
        }
      }
    }

    const qBots = await QBot.find({ active: true });

    for (const bot of qBots) {

      const joiningTotal = sumJoiningStrategies(bot.joining);
      const hostingTotal = sumHostingStrategies(bot.hosting);
      const result = chooseBasedOnProbability(joiningTotal, hostingTotal);

      if (result.chosenType === 'joining') {
        const chosenSubStrategy = pickSubStrategy(bot.joining, joiningTotal);
        if (chosenSubStrategy) {
          const formattedStrategyName = formatStrategyName(chosenSubStrategy.parentStrategy);
          const formattedSubStrategyName = formatStrategyName(chosenSubStrategy.name);
          console.log("room strat", formattedStrategyName)
          console.log("joining strat", formattedSubStrategyName)
          const user = await User.findOne({ _id: bot.user });
          const room = await Room.findOne({
            status: 'open',
            selectedStrategy: formattedStrategyName,
            creator: { $ne: bot.user }
          });

          const numElements = 6;

          let remainingBalance = user.balance / 10;
          const qbot_bet_amounts = [];

          for (let i = 0; i < numElements; i++) {
            const maxBet = remainingBalance - (numElements - i - 1);
            const bet = Math.floor(Math.random() * (maxBet)) + 1;

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
            const result = await executeCronJob(user, qbot_bet_amounts, [bot.user.toString()], false, room, formattedSubStrategyName, true);

            if (result && result.success) {
              await delay(4000);
            }
          } else {
            console.log("non room.")
          }
        } else {
          console.log('No valid sub-strategy found.');
        }
      } else if (result.chosenType === 'hosting') {
        console.log(`Chosen total is from hosting strategies: ${result.chosenTotal}`);
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

async function executeCronJob(user, betArray, userIds, useFirstBetFunction, room = null, ai_mode = null, qbot = false) {
  if (!room) {
    return;
  }
  try {
    const rooms = room ? [room] : await Room.find({
      'joiners': user._id,
      status: 'open',
    });

    for (const room of rooms) {
      const roomId = room._id;
      const gameType = room.game_type;
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
          predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);

        } else {
          // attached RPS (PLAYER)
          const rpsBetItems = await swapRpsBetItems(roomId, user);

          if (betArray && betArray.length > 0) {
            if (ai_mode === 'Random') {
              nextState = getRandomMove();
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Adam') {
              const nextMove = await reinforcementAI(rpsBetItems);
              nextState = nextMove.move;
              predictedBetAmount = await predictNextBetAmount(betArray, nextMove.risk, 0, 0.01, 0.2, room);
            } else if (ai_mode === 'Sniper') {
              const nextMove = await reinforcementAI(rpsBetItems);
              nextState = nextMove.move;
              predictedBetAmount = nextMove.risk === 4 ? (user.balance < parseFloat(room.user_bet) ? user.balance : parseFloat(room.user_bet)) : Math.min(...betArray);
            } else if (ai_mode === 'Hertz') {
              nextState = await patternBasedAI(rpsBetItems);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Feedback') {
              nextState = await counterSwitchAI(rpsBetItems);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Skill-issue' || ai_mode === 'Skill-issue-2') {
              const randomnessResult = await skillIssue(rpsBetItems);
              nextState = randomnessResult.counterMove;
              const penultimateSameAsLast = randomnessResult.risk;
              if (ai_mode === 'Skill-issue') {
                predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
              } else if (ai_mode === 'Skill-issue-2') {
                const outcome = await martingaleStrategy(rpsBetItems);
                if (penultimateSameAsLast === 3) {
                  predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? betArray[0].bet_amount * 1.4 : Math.min(...betArray);
                } else {
                  predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2);
                }
                if (predictedBetAmount > user.balance / 2) {
                  predictedBetAmount = user.balance / 4;
                }
              }
            } else if (ai_mode === 'NPC') {
              nextState = await NPC(rpsBetItems);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Tesla') {
              nextState = await generatePattern(rpsBetItems);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'CopyCat') {
              const copyCatBetItem = rpsBetItems[0];
              if (copyCatBetItem) {
                nextState = copyCatBetItem.rps;
              } else {
                const randomIndex = Math.floor(Math.random() * 3);
                const rpsOptions = ['R', 'P', 'S'];
                nextState = rpsOptions[randomIndex];
              }
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Hidden Markov') {

              if (rpsBetItems.length > 0) {
                const transformedItems = rpsBetItems.map(item => ({ rps: item.joiner_rps }));
                nextState = await predictNext(transformedItems);
              }
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);

            } else if (ai_mode === 'Markov') {
              nextState = await predictNext(rpsBetItems, true);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Martingale') {
              const outcome = await martingaleStrategy(rpsBetItems);
              nextState = outcome.move;
              predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw'
                ? (betArray[0].bet_amount ? betArray[0].bet_amount * 2 : betArray[0] * 2)
                : Math.min(...betArray);
            } else if (ai_mode === 'Innovate') {
              const randomnessResult = await innovate(rpsBetItems);
              nextState = randomnessResult.counterMove;
              const penultimateSameAsLast = randomnessResult.risk;
              const predictedBet = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
              predictedBetAmount = penultimateSameAsLast === 1
                ? Math.max(predictedBet / 5, 0.1)
                : predictedBet;
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
          predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);

        } else {
          // attached / q-bot qs (PLAYER)
          const qsBetItems = await swapQsBetItems(roomId, user);

          if (betArray && betArray.length > 0) {

            if (ai_mode === 'Random') {
              nextState = await getRandomItem_qs(room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Adam') {
              const nextMove = await reinforcementAI_qs(qsBetItems, room.qs_game_type);
              nextState = nextMove.move;
              predictedBetAmount = await predictNextBetAmount(betArray, nextMove.risk, 0, 0.01, 0.2, room);

            } else if (ai_mode === 'Sniper') {
              const nextMove = await reinforcementAI_qs(qsBetItems, room.qs_game_type);
              nextState = nextMove.move;
              predictedBetAmount = nextMove.risk === 4 ? (user.balance < parseFloat(room.user_bet) ? user.balance : parseFloat(room.user_bet)) : Math.min(...betArray);
            } else if (ai_mode === 'Hertz') {
              nextState = await patternBasedAI_qs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Feedback') {
              nextState = await counterSwitchAI_qs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Skill-issue' || ai_mode === 'Skill-issue-2') {
              const randomnessResult = await skillIssue_qs(qsBetItems, room.qs_game_type);
              nextState = randomnessResult.counterMove;
              const penultimateSameAsLast = randomnessResult.risk;
              if (ai_mode === 'Skill-issue') {
                predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
              } else if (ai_mode === 'Skill-issue-2') {

                if (penultimateSameAsLast !== 3) {
                  const outcome = await martingaleStrategy_qs(qsBetItems, room.qs_game_type);
                  predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? betArray[0].bet_amount * 1.4 : Math.min(...betArray);
                } else {
                  predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
                }
                if (predictedBetAmount > user.balance / 2) {
                  predictedBetAmount = user.balance / 4;
                }
              }

            } else if (ai_mode === 'NPC') {
              nextState = await NPC_qs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Tesla') {
              nextState = await generatePattern_qs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'CopyCat') {
              nextState = await getCopyCatItem_qs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Hidden Markov') {
              console.log("caxwled")
              if (qsBetItems.length > 0) {
                const transformedItems = qsBetItems.map(item => ({ qs: item.joiner_qs }));
                nextState = await predictNextQs(transformedItems, room.qs_game_type);
              }
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);

            } else if (ai_mode === 'Markov') {
              nextState = await predictNextQs(qsBetItems, room.qs_game_type);
              predictedBetAmount = await predictNextBetAmount(betArray, 0, 0.01, 0.2);
            } else if (ai_mode === 'Martingale') {
              const outcome = await martingaleStrategy_qs(qsBetItems, room.qs_game_type);
              nextState = outcome.move;
              predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? betArray[0].bet_amount * 2 : Math.min(...betArray);
            } else if (ai_mode === 'Innovate') {
              const randomnessResult = await innovate_qs(qsBetItems, room.qs_game_type);
              nextState = randomnessResult.counterMove;
              const penultimateSameAsLast = randomnessResult.risk;
              const predictedBet = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
              predictedBetAmount = penultimateSameAsLast === 1
                ? Math.max(predictedBet / 5, 0.1)
                : predictedBet;
              }
          }

          if ((predictedBetAmount) / (room.qs_game_type - 1) +
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
          
          if ((predictedBetAmount) / (room.qs_game_type - 1) +
            predictedBetAmount -
            (room.qs_game_type - 1) * parseFloat(room.user_bet) >
            parseFloat(room.user_bet) ||
            predictedBetAmount > parseFloat(room.user_bet)
          ) {
            predictedBetAmount = parseFloat(room.user_bet)
          }

        }
      }

      const req = {
        params: {
          _id: roomId
        },
        user: user,
        io: socketio,
        body: {
          _id: roomId,
          bet_amount: predictedBetAmount,
          selected_qs_position: nextState,
          selected_rps: nextState,
          ai_mode: ai_mode
        }
      };
      if (parseFloat(room.user_bet) >= 0.1 && predictedBetAmount >= 0 && predictedBetAmount <= parseFloat(room.user_bet)) {
        if (useFirstBetFunction && !isExecutingBet1 && userIds.some(id => room.joiners.includes(id))) {
          // BOT
          isExecutingBet1 = true;
          await executeBet1(req, true);
          isExecutingBet1 = false;
        } else if (!useFirstBetFunction && !isExecutingBet4) {
          // attached || qbot
          isExecutingBet4 = true;
          await executeBet4(req, true, qbot);
          isExecutingBet4 = false;
        }
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
