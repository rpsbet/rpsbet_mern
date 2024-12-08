const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User.js');
const GameType = require('../../model/GameType.js');
const RpsBetItem = require('../../model/RpsBetItem.js');
const QsBetItem = require('../../model/QsBetItem.js')
const AttachedPlayer = require('../../model/AttachedPlayer.js');
const QBot = require('../../model/QBot.js');
const executeBet1 = require('./betExecutor.js');
const executeBet4 = require('./betExecutor4.js');
const SystemSetting = require('../../model/SystemSetting.js');
const { predictNext, reinforcementAI, innovate, patternBasedAI, counterSwitchAI, NPC, generatePattern, counterRandomness, getRandomMove, martingaleStrategy } = require('./predictNextJoiner');
const { NPC_qs, patternBasedAI_qs, innovate_qs, getRandomItem_qs, counterSwitchAI_qs, generatePattern_qs, getCopyCatItem_qs, predictNextQs, reinforcementAI_qs, counterRandomness_qs, martingaleStrategy_qs } = require('./predictNextQsJoiner');
const saveDocumentWithRetry = require('./retrySave');

const os = require('os');
let socketio = null;
let isExecutingBet1 = false;
let isExecutingBet4 = false;

async function getRpsBetItems(roomId, user) {
  try {
    const rpsBetItems = await RpsBetItem.find({
      room: roomId,
      joiner: user._id
    })

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
      joiner: user._id
    })
      .sort({ created_at: -1 })
      .limit(50);

    return qsBetItems;
  } catch (error) {
    console.error('Error getping QS values:', error);
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
  'martingale', 'adam', 'tesla', 'npc', 'sniper', 'skillissueold', 'skillissue'
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
    case 'skillissueold':
      return 'Skill-issue-old';
    case 'skillissue':
      return 'Skill-issue';
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
    { 
      userId: '65eafc72aea25957ac8ea60d', 
      betArray: [
        40000, 10000, 2500, 120000, 2, 100000, 1, 250000, 
        125000, 1, 175000, 100000, 1, 1, 2, 3300, 660000, 
        15500, 15500, 250000, 10000, 244500, 5000, 18000, 100000
      ], 
      delay: 0 
    },
    { 
      userId: '65eafa5caea25957ac8ea60b', 
      betArray: [
        733500, 9900, 950000, 950000, 222200, 950000, 
        99500, 25000, 2000, 2500, 500000, 4000, 950000
      ], 
      delay: 4000 
    },
    { 
      userId: '62b9ef88a5409449f63f7ccb', 
      betArray: [
        150000, 100000, 255500, 12500, 1, 50000, 
        20000, 3300, 660000, 10000, 55100, 252200, 
        1000, 2500, 5000, 10100
      ], 
      delay: 8000 
    },
    { 
      userId: '65eafb7daea25957ac8ea60c', 
      betArray: [
        500000, 650000, 650000, 1600000, 323300, 
        1300, 350000, 950000, 55500, 6500, 57500, 
        1900, 1500, 1500, 953300, 2500, 105500, 
        250000, 200000, 100000, 55500
      ], 
      delay: 12000 
    }
  ];

  const cronJobUserIds = cronJobs.map(job => job.userId);

  if (io) {
    socketio = io;
  }

  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_bot' });

    if (systemSetting) {
      const lastUpdated = new Date(systemSetting.updated_at);
      const nineSecondsAgo = new Date();
      nineSecondsAgo.setSeconds(nineSecondsAgo.getSeconds() - 8);

      if (lastUpdated < nineSecondsAgo) {

        for (const cronJob of cronJobs) {

          const user = await User.findOne({ _id: cronJob.userId });
          const room = await Room.findOne({ joiners: cronJob.userId, status: "open" });
          if (user && room) {
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
              await delay(4000);
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
              const user = await User.findOne({ _id: bot.user });
              const room = await Room.findOne({
                status: 'open',
                selectedStrategy: formattedStrategyName,
                creator: { $ne: bot.user }
              });
              const numElements = 6;
              let remainingBalance = user.balance;
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
              }
            }
          } else if (result.chosenType === 'hosting') {
            try {
              const description = '';
              const endgame_type = false;
              const rps_list = [];
              const qs_list = [];
              const rps_game_type = 0;
              const user = await User.findOne({ _id: bot.user });
              const rooms = await Room.find({
                status: 'open',
                creator: { $in: [bot.user] }
              });


              let room = null;
              let ai_mode;
              if (rooms.length > 0) {
                // Filter the rooms based on condition
                const filteredRooms = rooms.filter(room => room.host_pr <= room.bet_amount);

                if (filteredRooms.length > 0) {
                  // Pick a random room from the filtered list
                  const randomRoom = filteredRooms[Math.floor(Math.random() * filteredRooms.length)];

                  // Set the selected random room
                  room = randomRoom;
                }
              }

              const hostingStrategies = bot.hosting;
              const plainHostingStrategies = hostingStrategies.toObject ? hostingStrategies.toObject() : hostingStrategies;
              const validStrategies = Object.keys(plainHostingStrategies).filter(key =>
                key !== '_id' &&
                key !== 'created_at' &&
                key !== 'updated_at' &&
                typeof plainHostingStrategies[key] === 'number' &&
                plainHostingStrategies[key] > 0
              );
              if (rooms.length >= 2) {
                for (const room of rooms) {

                  if (room) {
                    // Check if the room was updated within the last 0.25 minutes (15 seconds)
                    // if (timeDifferenceInMinutes > 0.2) {
                    let attempts = 0;
                    const maxAttempts = 10;

                    while (attempts < maxAttempts) {
                      let newStrategy;

                      if (validStrategies.length > 0) {
                        const randomIndex = Math.floor(Math.random() * validStrategies.length);
                        newStrategy = formatStrategyName(validStrategies[randomIndex]);
                      } else {
                        const allStrategies = Object.keys(hostingStrategies);
                        newStrategy = formatStrategyName(allStrategies[Math.floor(Math.random() * allStrategies.length)]);
                      }

                      room.newStrategy = newStrategy;
                      attempts++;
                      if (room.selectedStrategy !== newStrategy) {
                        room.selectedStrategy = newStrategy;

                        // Save the updated room to the database
                        try {
                          await room.save();
                        } catch (error) {
                          console.error(`Failed to save room ${room.room_number}:`, error);
                        }
                        break; // Exit the loop if strategy is updated successfully
                      }

                      attempts++;

                      // Log when attempts exceed maximum tries
                      if (attempts >= maxAttempts) {
                        break;
                      }
                    }
                    // }
                  }
                }
                continue;
                // Return after all rooms have been processed
              }

              const randomIndex = Math.floor(Math.random() * validStrategies.length);
              ai_mode = formatStrategyName(validStrategies[randomIndex]);
              const numElements = 2;
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
              let bet_amount;
              const maxAttempts = 6;
              let attempts = 0;

              do {
                bet_amount = await predictNextBetAmount(qbot_bet_amounts, 0, 0, 0.01, 0.2, room);
                attempts++;

                if (bet_amount >= 500) {
                  break;
                }

                if (attempts >= maxAttempts) {
                  break;
                }


              } while (attempts < maxAttempts);

              if (bet_amount < 500) {
                bet_amount = 500;
              }

              if (user.username.includes('BOT')) {
                continue;
              }

              if (bet_amount > user.balance) {
                continue;
              }

              if (user.dailyWithdrawals > 100000000) {
                continue;
              }
              const game_types = [
                1,
                5
              ];

              const game_type = game_types[Math.floor(Math.random() * game_types.length)];

              const gameType = await GameType.findOne({
                game_type_id: (game_type)
              });

              const roomCount = await Room.countDocuments({});
              const newRoom = new Room({
                creator: user,
                joiners: [],
                bet_amount: parseFloat(bet_amount),
                rps_list: rps_list,
                description: description,
                selectedStrategy: ai_mode,
                qs_list: qs_list,
                hosts: [{ host: user._id, avatar: user.avatar, username: user.username, accessory: user.accessory, rank: user.totalWagered, share: 100, stake: parseFloat(bet_amount) }],
                game_type: gameType,
                user_bet: parseFloat(bet_amount),
                pr: 0,
                endgame_amount: endgame_type ? endgame_amount : parseFloat(bet_amount),
                endgame_type: endgame_type,
                host_pr: parseFloat(bet_amount),
                room_number: roomCount + 1,
                status: 'open',
                description,
              });
              try {
                await saveDocumentWithRetry(newRoom);
              } catch (error) {
                console.error("Error saving newRoom:", error);
              }

              if (game_type === '1') {
                for (const rps of rps_list) {
                  const newRps = new RpsBetItem({
                    room: newRoom,
                    rps: rps.rps
                  });
                  try {
                    await saveDocumentWithRetry(newRps);
                  } catch (error) {
                    console.error("Error saving newRps:", error);
                  }

                  if (rps_game_type === 1) {

                    const item = await Item.findOne({ productName: rps.rps });
                    if (item) {
                      const owner = item.owners.find(owner => owner.user.toString() === user._id.toString());

                      if (owner && owner.count >= 1) {
                        owner.count -= 1;
                        try {
                          await saveDocumentWithRetry(item);
                        } catch (error) {
                          console.error("Error saving item:", error);
                        }
                      } else {
                        console.log("You do not own enough items for the RRPS gametype.");
                        return;
                      }
                    } else {
                      console.log("Item not found for the RRPS gametype.");
                      return;
                    }
                  }
                }
              } else if (game_type === '5') {
                for (const qs of qs_list) {
                  const newQs = new QsBetItem({
                    room: newRoom,
                    qs: qs.qs
                  });
                  try {
                    await saveDocumentWithRetry(newQs);
                  } catch (error) {
                    console.error("Error saving newRps:", error);
                  }
                }
              }


              const newTransaction = new Transaction({
                user: user,
                amount: 0,
                description: 'created ' + gameType.short_name + '-' + newRoom.room_number,
                room: newRoom._id
              });


              user.balance -= bet_amount;
              newTransaction.amount -= bet_amount;

              try {
                await saveDocumentWithRetry(user);
                await saveDocumentWithRetry(newTransaction);
              } catch (error) {
                console.error("Error saving:", error);
              }
              // const rooms = await getRoomList(7, 'All');
              // req.io.sockets.emit('UPDATED_ROOM_LIST', {
              //   pageSize: rooms.pageSize,
              //   roomList: rooms.rooms,
              //   total: rooms.count
              // });

            } catch (err) {
              console.error('Error saving room:', err);

            }

          }
        }

      }
    }
  } catch (error) {
    console.error('Error executing cron jobs:', error);
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
      status: 'open',
      creator: { $ne: user._id }
    });


    const randomRoom = room ? room : rooms[Math.floor(Math.random() * rooms.length)];
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
        predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);

      } else {
        // attached RPS (PLAYER)
        const rpsBetItems = await getRpsBetItems(roomId, user);

        if (betArray && betArray.length > 0) {
          if (ai_mode === 'Random') {
            nextState = getRandomMove();
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
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
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Feedback') {
            nextState = await counterSwitchAI(rpsBetItems);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Skill-issue-old' || ai_mode === 'Skill-issue') {
            const randomnessResult = await counterRandomness(rpsBetItems);
            nextState = randomnessResult.counterMove;
            const penultimateSameAsLast = randomnessResult.risk;
            if (ai_mode === 'Skill-issue-old') {
              predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2, room);
            } else if (ai_mode === 'Skill-issue') {
              const outcome = await martingaleStrategy(rpsBetItems);
              if (penultimateSameAsLast === 3) {
                predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw' ? betArray[0].bet_amount * 1.4 : Math.min(...betArray);
              } else {
                predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0.01, 0.2, room);
              }
              if (predictedBetAmount > user.balance / 2) {
                predictedBetAmount = user.balance / 4;
              }
            }
          } else if (ai_mode === 'NPC') {
            nextState = await NPC(rpsBetItems);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Tesla') {
            nextState = await generatePattern(rpsBetItems);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'CopyCat') {
            const copyCatBetItem = rpsBetItems[0];
            if (copyCatBetItem) {
              nextState = copyCatBetItem.rps;
            } else {
              const randomIndex = Math.floor(Math.random() * 3);
              const rpsOptions = ['R', 'P', 'S'];
              nextState = rpsOptions[randomIndex];
            }
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Hidden Markov') {

            if (rpsBetItems.length > 0) {
              const transformedItems = rpsBetItems.map(item => ({ rps: item.joiner_rps }));
              nextState = await predictNext(transformedItems);
            }
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);

          } else if (ai_mode === 'Markov') {
            nextState = await predictNext(rpsBetItems, true);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Martingale') {
            const outcome = await martingaleStrategy(rpsBetItems);
            nextState = outcome.move;
            predictedBetAmount = outcome.lastResult === 'loss' || outcome.lastResult === 'draw'
              ? (betArray[0].bet_amount ? betArray[0].bet_amount * 2 : betArray[0] * 2)
              : Math.min(...betArray);
          } else if (ai_mode === 'Innovate') {
            const randomnessResult = await innovate(rpsBetItems, true);
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

        const qsBetItems = await getQsBetItems(roomId, user);

        if (betArray && betArray.length > 0) {
          if (ai_mode === 'Random') {
            nextState = await getRandomItem_qs(room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
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
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Feedback') {
            nextState = await counterSwitchAI_qs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Skill-issue-old' || ai_mode === 'Skill-issue') {
            const randomnessResult = await counterRandomness_qs(qsBetItems, room.qs_game_type);
            nextState = randomnessResult.counterMove;
            const penultimateSameAsLast = randomnessResult.risk;
            if (ai_mode === 'Skill-issue-old') {
              predictedBetAmount = await predictNextBetAmount(betArray, penultimateSameAsLast, 0, 0.01, 0.2, room);
            } else if (ai_mode === 'Skill-issue') {
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
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Tesla') {
            nextState = await generatePattern_qs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'CopyCat') {
            nextState = await getCopyCatItem_qs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
          } else if (ai_mode === 'Hidden Markov') {
            if (qsBetItems.length > 0) {
              const transformedItems = qsBetItems.map(item => ({ qs: item.joiner_qs }));
              nextState = await predictNextQs(transformedItems, room.qs_game_type);
            }
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);

          } else if (ai_mode === 'Markov') {
            nextState = await predictNextQs(qsBetItems, room.qs_game_type);
            predictedBetAmount = await predictNextBetAmount(betArray, 0, 0, 0.01, 0.2, room);
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
    } else {
      console.log('Game type does not match, skipping this room.');

      return;
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
        await SystemSetting.updateOne({ name: 'last_updated_bot' }, { updated_at: new Date() });

      } else if (!useFirstBetFunction && !isExecutingBet4) {

        // attached || qbot
        isExecutingBet4 = true;
        await executeBet4(req, true, qbot);
        isExecutingBet4 = false;
        await SystemSetting.updateOne({ name: 'last_updated_bot' }, { updated_at: new Date() });

      }

    }
  } catch (error) {
    console.error('Error finding rooms and executing cron job:', error);
  }
}

cron.schedule('*/7 * * * * *', async () => {
  await callCronJobs(socketio);
});
module.exports = {
  callCronJobs,
};
