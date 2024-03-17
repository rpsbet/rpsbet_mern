// betExecutor.js
const ObjectId = require('mongoose').Types.ObjectId;
const SystemSetting = require('../../model/SystemSetting');
const User = require('../../model/User');
const GameType = require('../../model/GameType');
const Room = require('../../model/Room');
const Notification = require('../../model/Notification');
const RpsBetItem = require('../../model/RpsBetItem');
const Transaction = require('../../model/Transaction');
const GameLog = require('../../model/GameLog');
const convertToCurrency = require('./conversion');
const socket = require('../../socketController')
const moment = require('moment');
const { predictNext, reinforcementAI, patternBasedAI, counterSwitchAI, counterRandomness, NPC, generatePattern } = require('./predictNext');

let user_access_log = {};

function check_access_time(user_id) {
    const check_result =
        user_access_log[user_id] && Date.now() - user_access_log[user_id] < 1000
            ? false
            : true;
    user_access_log[user_id] = Date.now();
    return check_result;
}

const executeBet = async (req, bot = false) => {
    try {
        const tax = await SystemSetting.findOne({ name: 'commission' });
        const rain = await SystemSetting.findOne({ name: 'rain' });
        const platform = await SystemSetting.findOne({ name: 'platform' });
        let responseData = {};
        let user = req.user;
        if (bot) {

            user = await User.findOne({ username: { $regex: 'BOT', $options: 'i' } });
        }
        // const RockType = ['Rock', 'MoonRock', 'QuickBall'];
        // const PaperType = [
        //   'Paper',
        //   'MoonPaper',
        //   'Microwave',
        //   'Tumbledryer',
        //   'Brain'
        // ];
        // const ScissorsType = ['Scissors', 'Knife', 'Blender', 'MoonScissors'];
        // const BearType = ['Bear', 'MoonBear', 'Gorilla'];
        // const BullType = ['Bull', 'MoonBull'];
        // const WhaleType = ['Whale', 'MoonWhale', 'Snowman', 'Sledge'];
        // function determineGameResult(userSelection, systemSelection) {
        //   // console.log("userSelection, systemSelection", userSelection, systemSelection)
        //   const key = {
        //     win: [
        //       [RockType, ScissorsType],
        //       [RockType, BearType],
        //       [RockType, BullType],
        //       [PaperType, RockType],
        //       [PaperType, BearType],
        //       [ScissorsType, PaperType],
        //       [ScissorsType, BullType],
        //       [ScissorsType, WhaleType],
        //       [BearType, ScissorsType],
        //       [BullType, BearType],
        //       [WhaleType, RockType],
        //       [WhaleType, BullType],
        //       [WhaleType, BearType]
        //     ],
        //     draw: [
        //       [RockType, RockType],
        //       [PaperType, PaperType],
        //       [PaperType, BullType],
        //       [PaperType, WhaleType],
        //       [ScissorsType, ScissorsType],
        //       [BearType, BearType],
        //       [BullType, BullType],
        //       [BullType, PaperType],
        //       [WhaleType, PaperType],
        //       [WhaleType, WhaleType]
        //     ],
        //     lose: [
        //       [RockType, PaperType],
        //       [RockType, WhaleType],
        //       [PaperType, ScissorsType],
        //       [ScissorsType, RockType],
        //       [ScissorsType, BearType],
        //       [BearType, BullType],
        //       [BearType, PaperType],
        //       [BearType, RockType],
        //       [BearType, WhaleType],
        //       [BullType, RockType],
        //       [BullType, ScissorsType],
        //       [BullType, WhaleType],
        //       [WhaleType, ScissorsType]
        //     ]
        //   };

        //   for (const [userType, systemType] of key.win) {
        //     if (
        //       userType.includes(userSelection) &&
        //       systemType.includes(systemSelection)
        //     ) {
        //       return 1; // User wins
        //     }
        //   }

        //   for (const [userType, systemType] of key.draw) {
        //     if (
        //       userType.includes(userSelection) &&
        //       systemType.includes(systemSelection)
        //     ) {
        //       return 0; // Draw
        //     }
        //   }

        //   for (const [userType, systemType] of key.lose) {
        //     if (
        //       userType.includes(userSelection) &&
        //       systemType.includes(systemSelection)
        //     ) {
        //       return -1; // User loses
        //     }
        //   }

        //   return 0; // Default
        // }

        // const determineWinnings = async (betAmount, userSelection, systemSelection) => {
        //   // console.log(betAmount, userSelection, systemSelection)
        //   const validUserSelections = [
        //     'Rock',
        //     'MoonRock',
        //     'QuickBall',
        //     'Paper',
        //     'MoonPaper',
        //     'Microwave',
        //     'Tumbledryer',
        //     'Brain',
        //     'Scissors',
        //     'Knife',
        //     'Blender',
        //     'MoonScissors',
        //     'Bear',
        //     'MoonBear',
        //     'Gorilla',
        //     'Bull',
        //     'MoonBull',
        //     'Whale',
        //     'MoonWhale',
        //     'Snowman',
        //     'Sledge'
        //   ];

        //   if (!validUserSelections.includes(userSelection)) {
        //     throw new Error('Invalid user selection');
        //   }

        //   let multiplier = 1;
        //   let winnings = betAmount;

        //   switch (userSelection) {
        //     case 'Rock':
        //       if (systemSelection === 'Scissors') {
        //         multiplier = 4;
        //       }
        //       break;

        //     case 'MoonRock':
        //       multiplier = 2;
        //       break;

        //     case 'Paper':
        //       break;

        //     case 'MoonPaper':
        //       break;

        //     case 'Scissors':
        //       break;
        //     case 'MoonScissors':
        //       break;
        //     case 'Bear':
        //       // console.log("D");

        //       // Find all items that match the conditions and sort them by updated_at in descending order
        //       const items = await RpsBetItem.find({
        //         joiner_rps: { $ne: null },
        //         room: user._id,
        //         joiner: user._id
        //       }).sort({ updated_at: -1 });

        //       // let multiplier = 1.0; // Initialize multiplier

        //       // Iterate through the sorted items
        //       for (const item of items) {
        //         const prevResult = determineGameResult(item.joiner_rps, item.rps);

        //         // console.log("Result:", prevResult);

        //         if (prevResult === 1) {
        //           multiplier += 0.1;
        //           // console.log("Multiplier:", multiplier);
        //         } else {
        //           // Break the loop if the result is not 1
        //           break;
        //         }
        //       }

        //       break;

        //     case 'MoonBear':
        //       // console.log("DWD");

        //       // Find all items that match the conditions and sort them by updated_at in descending order
        //       const moonBearItems = await RpsBetItem.find({
        //         joiner_rps: { $ne: null },
        //         room: req.body._id,
        //         joiner: user._id
        //       }).sort({ updated_at: -1 });

        //       let moonBearMultiplier = 1.0; // Initialize multiplier

        //       // Iterate through the sorted items
        //       for (const moonBearItem of moonBearItems) {
        //         const lastResult = determineGameResult(moonBearItem.joiner_rps, moonBearItem.rps);

        //         // console.log("Result:", lastResult);

        //         if (lastResult === 1) {
        //           moonBearMultiplier += 0.2;
        //           // console.log("Multiplier:", moonBearMultiplier);
        //         } else {
        //           // Break the loop if the result is not 1
        //           break;
        //         }
        //       }

        //       break;

        //     case 'Bull':
        //       if (Math.random() < 0.3) {
        //         multiplier = 1.5;
        //       }
        //       break;
        //     case 'MoonBull':
        //       if (Math.random() < 0.45) {
        //         multiplier = 1.5;
        //       }
        //       break;
        //     case 'Whale':
        //       break;
        //     case 'MoonWhale':
        //       multiplier = 2;

        //       break;
        //     case 'Microwave':
        //       const microwaveItems = await RpsBetItem.countDocuments({
        //         room: req.body._id,
        //         joiner_rps: { $ne: null },
        //         joiner: user._id
        //       });

        //       multiplier = microwaveItems * 0.1;
        //       break;


        //     case 'Blender':
        //       if (Math.random() < 0.05) {
        //         multiplier = 14;
        //       } else {
        //         multiplier = 0.1;

        //       }
        //       break;
        //     case 'QuickBall':
        //       const lastQuickBallItem = await RpsBetItem.findOne({
        //         joiner_rps: { $ne: null },
        //         room: req.body._id,
        //         joiner:user._id
        //       }).sort({ updated_at: -1 });
        //       if (lastQuickBallItem.joiner_rps === "QuickBall") {
        //         multiplier = 2;
        //       }
        //       break;
        //     case 'Knife':
        //       const knifeUsers = await RpsBetItem.find({
        //         room: req.body._id,
        //         joiner_rps: 'Knife',
        //         joiner: user._id
        //       });

        //       if (knifeUsers.length === 0) {
        //         multiplier = 3;
        //       }
        //       break;
        //     case 'Tumbledryer':
        //       break;
        //     case 'Brain':
        //       if (systemSelection === 'Bear' || systemSelection === 'MoonBear') {
        //         multiplier = 2;
        //       } else {
        //         multiplier = 0.5;
        //       }
        //       break;
        //     case 'Gorilla':
        //       const gorillaItems = await RpsBetItem.find({
        //         room: req.body._id,
        //         joiner_rps: { $ne: null },
        //         joiner: user._id
        //       }).limit(10);

        //       if (gorillaItems.length <= 10) {
        //         // Check if any of the rps values are Gorilla
        //         const hasGorilla = gorillaItems.some(item => item.rps === 'Gorilla');

        //         // If none of the rps values are Gorilla, set multiplier to 4
        //         if (!hasGorilla) {
        //           multiplier = 4;
        //         }
        //       }
        //       break;
        //     case 'Snowman':
        //       const snowmanItems = await RpsBetItem.find({
        //         room: req.body._id,
        //         joiner_rps: { $ne: null },
        //         joiner: user._id
        //       });

        //       if (snowmanItems.length === 0) {
        //         multiplier = 7;
        //       } else {
        //         multiplier = 0.25;
        //       }
        //       break;
        //     case 'Sledge':
        //       multiplier = betAmount + 1;
        //       break;
        //     default:
        //       // Default case if userSelection doesn't match any specific case
        //       break;
        //   }
        //   // console.log("betAmount / multiplier: ", betAmount, multiplier);
        //   winnings = betAmount * multiplier;

        //   return winnings;
        // };

        // const suits = ['♠', '♣', '♥', '♦'];
        // const deck = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

        // // Function to generate a random card from the deck
        // function getRandomCard() {
        //   const randomSuitIndex = Math.floor(Math.random() * suits.length);
        //   const randomCardIndex = Math.floor(Math.random() * deck.length);
        //   return {
        //     suit: suits[randomSuitIndex],
        //     card_host: deck[randomCardIndex],
        //   };
        // }

        // // Function to calculate the value of a card
        // function getCardValue(card, currentScore) {
        //   if (card.card_host === 'A') {
        //     // Handle Ace as 11 or 1 based on the current score
        //     return currentScore + 11 <= 21 ? 11 : 1;
        //   } else if (['K', 'Q', 'J'].includes(card.card_host)) {
        //     // Face cards are worth 10 points
        //     return 10;
        //   } else {
        //     // Numeric cards are worth their face value
        //     return parseInt(card.card_host);
        //   }
        // }

        // // Function to update host's score and return the updated score
        // function updateHostScore(currentScoreHost, currentScore) {
        //   const card = getRandomCard();
        //   const cardValue = getCardValue(card, currentScoreHost);

        //   // Update the score_host and add the card to an array
        //   currentScoreHost += cardValue;

        //   return {
        //     newScoreHost: currentScoreHost,
        //     card: { ...card, value: cardValue }, // Include the card along with its value
        //   };
        // }

        const start = new Date();
        if (req.body._id) {
            if (user.dailyWithdrawals > 0.02) {
                responseData = {
                    success: false,
                    message: 'illregular action',
                    betResult: -1000
                }

                return responseData;
            }
            if (!check_access_time(user._id)) {
                responseData = {
                    success: false,
                    message: 'illregular action',
                    betResult: -1000
                }

                return responseData;
            }

            roomInfo = await Room.findOne({ _id: req.body._id })
                .populate({ path: 'creator', model: User })
                .populate({ path: 'game_type', model: GameType });
            // console.log("asdfghj");
            // console.log("spp        ", roomInfo['creator']._id, user._id);

            if (
                roomInfo['creator'] &&
                roomInfo['creator']._id &&
                user &&
                user._id &&
                roomInfo['creator']._id.toString() === user._id.toString()
            ) {
                responseData = {
                    success: false,
                    message: `YOU'VE CAT TO BE KITTEN ME! DIS YOUR OWN GAME!`,
                    betResult: -101
                };
                return responseData;
            }

            if (roomInfo['status'] === 'finished') {
                responseData = {
                    success: false,
                    message: 'THIS BATTLE HAS NOW ENDED',
                    betResult: -100
                };

                return responseData;
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
                joined_user: user,
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['bet_amount'],
                // is_anonymous: req.body.is_anonymous
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
                user: user,
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
                from: user,
                to: roomInfo['creator'],
                room: req.body._id,
                message: '',
                // is_anonymous: req.body.is_anonymous,
                is_read: false
            });

            if (roomInfo['game_type']['game_type_name'] === 'RPS') {
                if (
                    parseFloat(req.body.bet_amount) > parseFloat(roomInfo['user_bet']) ||
                    parseFloat(req.body.bet_amount) > parseFloat(user.balance)
                ) {

                    responseData = {
                        success: false,
                        message: 'Bet amount exceeds available balance.'
                    }
                    // Return an error or some other response to the user, e.g.:
                    return responseData;
                }
                newGameLog.bet_amount = parseFloat(req.body.bet_amount);

                const availableBetItem = await RpsBetItem.findOne({
                    room: req.body._id,
                    joiner_rps: ''
                }); 
                let bet_item = availableBetItem;

                if (!bet_item && roomInfo['rps_game_type'] === 0) {
                    let nextItem;

                    const allBetItems = await RpsBetItem.find({
                        room: new ObjectId(req.body._id),
                        joiner_rps: { $ne: null }
                    })
                    .sort({ created_at: -1 })
                    .limit(50);
                    

                    switch (roomInfo['selectedStrategy']) {
                        case 'Random':
                            nextItem = getRandomItem();
                            break;
                        case 'Martingale':
                            nextItem = getRandomItem();
                            break;
                        case 'Adam':
                            nextItem = await reinforcementAI(allBetItems);
                            break;
                        case 'Hertz':
                            nextItem = await patternBasedAI(allBetItems);
                            break;
                        case 'Feedback':
                            nextItem = await counterSwitchAI(allBetItems);
                            break;
                        case 'Skill-issue':
                            nextItem = await counterRandomness(allBetItems);
                            break;
                        case 'NPC':
                            nextItem = await NPC(allBetItems);
                            break;
                        case 'Tesla':
                            nextItem = await generatePattern(allBetItems);
                            break;
                        case 'CopyCat':
                            nextItem = getCopyCatItem(allBetItems);
                            break;
                        case 'Markov':
                            nextItem = await getNextItemUsingMarkov(allBetItems);
                            break;
                        case 'Hidden Markov':
                            nextItem = await predictNext(allBetItems);
                            break;
                        default:
                            // Handle unknown strategy
                            break;
                    }

                    bet_item = new RpsBetItem({
                        room: new ObjectId(req.body._id),
                        rps: nextItem,
                        bet_amount: parseFloat(req.body.bet_amount),
                    });

                    await bet_item.save();

                    // Define helper functions
                    function getRandomItem() {
                        const rpsOptions = ['R', 'P', 'S'];
                        return rpsOptions[Math.floor(Math.random() * 3)];
                    }

                    function getCopyCatItem(allBetItems) {
                        const copyCatBetItem = allBetItems.find(item => item.joiner_rps);
                        return copyCatBetItem ? copyCatBetItem.joiner_rps : getRandomItem();
                    }

                    async function getNextItemUsingMarkov(allBetItems) {
                        if (allBetItems.length <= 3) {
                            return getRandomItem();
                        }
                        
                        const transformedItems = allBetItems.map(item => ({ rps: item.joiner_rps }));
                        const nextItem = await predictNext(transformedItems, true);
                        return nextItem;
                    }
                    

                }

                newGameLog.bet_amount = parseFloat(req.body.bet_amount);
                newGameLog.selected_rps = req.body.selected_rps;
                if (roomInfo['rps_game_type'] === 0) {

                    newTransactionJ.amount -= parseFloat(req.body.bet_amount);
                    if (
                        (bet_item.rps === 'R' && req.body.selected_rps == 'P') ||
                        (bet_item.rps === 'P' && req.body.selected_rps == 'S') ||
                        (bet_item.rps === 'S' && req.body.selected_rps == 'R')
                    ) {
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
                }
                else {
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
                        joiner: user._id,
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
                            joiner: user._id
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
                        if (user.balance - winnings < 0) {

                            newTransactionJ.amount -= user.balance
                            roomInfo.host_pr =
                                (parseFloat(roomInfo.host_pr) || 0) +
                                parseFloat(user.balance);
                            roomInfo.user_bet =
                                (parseFloat(roomInfo.user_bet) || 0) +
                                parseFloat(user.balance);

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
                bet_item.joiner = user;
                bet_item.joiner_rps = req.body.selected_rps;
                bet_item.bet_amount = parseFloat(req.body.bet_amount);
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
                            rps: reversedLastFiveBetItems,
                            user: user
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

                if (!roomInfo.joiners.includes(user)) {
                    roomInfo.joiners.addToSet(user);
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
                    parseFloat(req.body.bet_amount) > parseFloat(user.balance)
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
                        qs: nextItem,
                        bet_item: parseFloat(req.body.bet_amount),
                    });

                    await bet_item.save();
                }
                if (!roomInfo.joiners.includes(user)) {
                    roomInfo.joiners.addToSet(user);
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
                        );
                    }

                    if (req.io.sockets) {
                        req.io.sockets.emit('UPDATED_BANKROLL_QS', {
                            bankroll: roomInfo['user_bet'],
                            qs: bet_item.qs
                        });
                    }

                    bet_item.joiner = user;
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

                bet_item.joiner = user;
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
            }
            // else if (roomInfo['game_type']['game_type_name'] === 'Drop Game') {
            //   if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
            //     return res
            //       .status(400)
            //       .json({ error: 'Bet amount exceeds available balance.' });
            //   }
            //   newGameLog.bet_amount = parseFloat(req.body.bet_amount);

            //   const availableBetItem = await DropBetItem.findOne({
            //     _id: req.body.drop_bet_item_id,
            //     joiner_drop: ''
            //   });

            //   let bet_item = availableBetItem;
            //   if (bet_item) {

            //     bet_item = await DropBetItem.findOne({
            //       room: new ObjectId(req.body._id),
            //       joiner_drop: ''
            //     }).sort({ _id: 'asc' });
            //   } else {
            //     const allBetItems = await DropBetItem.find({
            //       room: new ObjectId(req.body._id)
            //     });
            //     let nextItem = predictNextDrop(allBetItems);

            //     if (nextItem > roomInfo['user_bet']) {
            //       nextItem = roomInfo['user_bet'];
            //     }

            //     bet_item = new DropBetItem({
            //       room: new ObjectId(req.body._id),
            //       drop: nextItem
            //     });

            //     await bet_item.save();
            //   }

            //   newTransactionJ.amount -= parseFloat(req.body.bet_amount);

            //   newGameLog.bet_amount = parseFloat(req.body.bet_amount);

            //   if (bet_item.drop < req.body.bet_amount) {
            //     newGameLog.selected_drop = bet_item.drop;
            //     newGameLog.game_result = 1;
            //     newTransactionJ.amount +=
            //       (parseFloat(req.body.bet_amount) + bet_item.drop) *
            //       ((100 - commission) / 100);
            //     newGameLog.commission =
            //       (parseFloat(req.body.bet_amount) + bet_item.drop) *
            //       ((commission - 0.5) / 100);

            //     // update rain
            //     rain.value =
            //       parseFloat(rain.value) +
            //       (parseFloat(req.body.bet_amount) + bet_item.drop) *
            //       ((commission - 0.5) / 100);

            //     rain.save();

            //     // update platform stat (0.5%)
            //     platform.value =
            //       parseFloat(platform.value) +
            //       (parseFloat(req.body.bet_amount) + bet_item.drop) *
            //       (tax.value / 100);
            //     platform.save();

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATE_RAIN', {
            //         rain: rain.value
            //       });
            //     }

            //     roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

            //     roomInfo['host_pr'] -= bet_item.drop;
            //     roomInfo['user_bet'] -= bet_item.drop;
            //     // update bankroll
            //     if (roomInfo['user_bet'] != 0) {
            //       roomInfo['user_bet'] =
            //         parseFloat(roomInfo['user_bet']) +
            //         (parseFloat(req.body.bet_amount) + bet_item.drop) *
            //         ((commission - 0.5) / 100);
            //     }

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //     // Save the new drop guess
            //     const newDropGuess = new DropGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_drop: bet_item.drop
            //     });
            //     await newDropGuess.save();

            //     newGameLog.room.bet_amount = bet_item.drop;

            //     const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
            //       created_at: 'ascending'
            //     });
            //     if (req.io.sockets) {
            //       req.io.sockets.emit('DROP_GUESSES', guesses);
            //     }

            //     message.message =
            //       'Won ' +
            //       // bet_item.bet_amount * 2 +
            //       convertToCurrency(bet_item.drop) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];
            //   } else if (bet_item.drop === req.body.bet_amount) {
            //     newGameLog.game_result = 0;

            //     newTransactionJ.amount += parseFloat(req.body.bet_amount);
            //     // Save the new drop guess
            //     const newDropGuess = new DropGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_drop: bet_item.drop
            //     });
            //     await newDropGuess.save();
            //     const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
            //       created_at: 'ascending'
            //     });
            //     if (req.io.sockets) {
            //       req.io.sockets.emit('DROP_GUESSES', guesses);
            //     }

            //     message.message =
            //       'Split ' +
            //       convertToCurrency(req.body.bet_amount * 2) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];
            //   } else {
            //     newGameLog.game_result = -1;

            //     roomInfo.host_pr =
            //       (parseFloat(roomInfo.host_pr) || 0) +
            //       parseFloat(req.body.bet_amount);
            //     roomInfo.user_bet =
            //       (parseFloat(roomInfo.user_bet) || 0) +
            //       parseFloat(req.body.bet_amount);

            //     if (
            //       roomInfo['endgame_type'] &&
            //       roomInfo['user_bet'] >= roomInfo['endgame_amount']
            //     ) {
            //       newTransactionC.amount +=
            //         parseFloat(roomInfo['user_bet']) -
            //         parseFloat(roomInfo['endgame_amount']);

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();
            //       roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
            //     }

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(req.body.bet_amount) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     // Save the new drop guess
            //     const newDropGuess = new DropGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_drop: bet_item.drop
            //     });
            //     await newDropGuess.save();
            //   }
            //   const guesses = await DropGuess.find({ room: roomInfo._id }).sort({
            //     created_at: 'ascending'
            //   });
            //   if (req.io.sockets) {
            //     req.io.sockets.emit('DROP_GUESSES', guesses);
            //   }

            //   bet_item.joiner = req.user;
            //   bet_item.joiner_drop = req.body.bet_amount;
            //   await bet_item.save();

            //   if (!roomInfo.joiners.includes(req.user)) {
            //     roomInfo.joiners.addToSet(req.user);
            //     await roomInfo.save();
            //   }

            //   if (roomInfo['user_bet'] <= 0.0005) {
            //     roomInfo.status = 'finished';
            //     newGameLog.game_result = 1;
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     const newGameLogC = new GameLog({
            //       room: roomInfo,
            //       creator: roomInfo['creator'],
            //       joined_user: roomInfo['creator'],
            //       game_type: roomInfo['game_type'],
            //       bet_amount: roomInfo['host_pr'],
            //       user_bet: roomInfo['user_bet'],
            //       is_anonymous: roomInfo['is_anonymous'],
            //       game_result: -100
            //     });
            //     await newGameLogC.save();
            //   }
            // } else if (roomInfo['game_type']['game_type_name'] === 'Bang!') {
            //   if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
            //     // Return an error or some other response to the user, e.g.:
            //     return res
            //       .status(400)
            //       .json({ error: 'Bet amount exceeds available balance.' });
            //   }
            //   const cashoutAmount = req.body.multiplier * req.body.bet_amount;

            //   newGameLog.bet_amount = parseFloat(req.body.bet_amount);
            //   newGameLog.cashoutAmount = cashoutAmount;

            //   newTransactionJ.amount -= parseFloat(req.body.bet_amount);

            //   const bet_item = await BangBetItem.findOne({
            //     room: roomInfo,
            //     bang: { $ne: '' }
            //   })
            //     .sort({ _id: 'desc' })
            //     .limit(1);
            //   console.log("bet_item", bet_item);
            //   console.log("bet_amount", req.body.bet_amount);
            //   console.log("crashed", req.body.crashed)
            //   console.log("multiplier", req.body.multiplier)

            //   console.log("cashoutAmount", cashoutAmount)

            //   if (!req.body.crashed && req.body.multiplier <= bet_item.bang) {

            //     newGameLog.game_result = 1;
            //     if (
            //       parseFloat(roomInfo['user_bet']) -
            //       cashoutAmount >
            //       0
            //     ) {
            //       console.log("win1 bankroll enough")
            //       newTransactionJ.amount +=
            //         cashoutAmount *
            //         ((100 - commission) / 100);


            //       roomInfo['host_pr'] -=
            //         cashoutAmount;
            //       roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - 
            //         cashoutAmount;


            //       message.message =
            //         'Won ' +
            //         convertToCurrency(cashoutAmount
            //         ) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];
            //     } else {
            //       // console.log("win1 end")

            //       newTransactionJ.amount +=
            //         parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       roomInfo.status = 'finished';

            //       roomInfo['user_bet'] = 0;
            //       roomInfo['host_pr'] = 0;

            //       const newBangGuess = new BangGuess({
            //         room: roomInfo._id,
            //         bet_amount: newGameLog.bet_amount,
            //         host_bang: bet_item.bang
            //       });
            //       await newBangGuess.save();


            //       const guesses = await BangGuess.find({ room: roomInfo._id }).sort({
            //         created_at: 'ascending'
            //       });
            //       if (req.io.sockets) {
            //         req.io.sockets.emit('BANG_GUESSES', guesses);
            //       }
            //       message.message =
            //         'Won ' +
            //         convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['host_pr'],
            //         user_bet: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: -100
            //       });
            //       await newGameLogC.save();
            //     }
            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //   } else {
            //     newGameLog.game_result = -1;
            //     console.log("crashed / loss")

            //     roomInfo.host_pr =
            //       (parseFloat(roomInfo.host_pr) || 0) +
            //       parseFloat(req.body.bet_amount);
            //     roomInfo.user_bet =
            //       (parseFloat(roomInfo.user_bet) || 0) +
            //       parseFloat(req.body.bet_amount);

            //     if (
            //       roomInfo['endgame_type'] &&
            //       roomInfo['user_bet'] >= roomInfo['endgame_amount']
            //     ) {
            //       newTransactionC.amount +=
            //         parseFloat(roomInfo['user_bet']) -
            //         parseFloat(roomInfo['endgame_amount']);

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();
            //       roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
            //     }

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(req.body.bet_amount) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     const newBangGuess = new BangGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_bang: bet_item.bang
            //     });
            //     await newBangGuess.save();
            //   }
            //   const guesses = await BangGuess.find({ room: roomInfo._id }).sort({
            //     created_at: 'ascending'
            //   });
            //   if (req.io.sockets) {
            //     req.io.sockets.emit('BANG_GUESSES', guesses);
            //   }

            //   bet_item.joiner = req.user;
            //   bet_item.joiner_bang = req.body.bet_amount;
            //   await bet_item.save();

            //   if (!roomInfo.joiners.includes(req.user)) {
            //     roomInfo.joiners.addToSet(req.user);
            //     await roomInfo.save();
            //   }


            // } else if (roomInfo['game_type']['game_type_name'] === 'Roll') {
            //   if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {

            //     return res
            //       .status(400)
            //       .json({ error: 'Bet amount exceeds available balance.' });
            //   }
            //   newGameLog.bet_amount = parseFloat(req.body.bet_amount);
            //   // newTransactionJ.amount -= parseFloat(req.body.bet_amount);

            //   const recentItems = await RollBetItem.find({ room: roomInfo._id, status: 'FOUND' })
            //     .sort({ created_at: -1 }) // Sort in descending order based on created_at
            //     .limit(20);


            //   const reversedRecentItems = recentItems.slice().reverse();

            //   const faces = recentItems.map((item) => item.face);
            //   // console.log(faces)
            //   const bet_item = recentItems[14];

            //   if (bet_item.face === req.body.selected_roll) {
            //     newGameLog.multiplier = bet_item.roll;
            //     newGameLog.game_result = 1;

            //     if (
            //       roomInfo['user_bet'] -
            //       parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll) >
            //       0
            //     ) {
            //       newTransactionJ.amount +=
            //         parseFloat(req.body.bet_amount) *
            //         parseFloat(bet_item.roll) *
            //         ((100 - commission) / 100);

            //       roomInfo['user_bet'] -= (parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll));

            //       roomInfo['host_pr'] -=
            //         (parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll));

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       message.message =
            //         'Won ' +
            //         convertToCurrency(
            //           parseFloat(req.body.bet_amount) * parseFloat(bet_item.roll)
            //         ) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];
            //     } else {
            //       newTransactionJ.amount +=
            //         parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       roomInfo.status = 'finished';
            //       message.message =
            //         'Won ' +
            //         convertToCurrency(parseFloat(roomInfo['user_bet'])) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];

            //       roomInfo['user_bet'] = 0;
            //       roomInfo['host_pr'] = 0;
            //     }
            //     const newRollGuess = new RollGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_roll: bet_item.roll
            //     });
            //     await newRollGuess.save();

            //     newGameLog.multiplier = bet_item.roll;

            //     const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
            //       created_at: 'ascending'
            //     });
            //     if (req.io.sockets) {
            //       req.io.sockets.emit('ROLL_GUESSES', guesses);
            //     }
            //   } else if (
            //     (bet_item.face === 'R' && req.body.selected_roll == 'P') ||
            //     (bet_item.face === 'P' && req.body.selected_roll == 'S') ||
            //     (bet_item.face === 'S' && req.body.selected_roll == 'R')
            //   ) {
            //     newGameLog.multiplier = 4;
            //     newGameLog.game_result = 1;

            //     if (roomInfo['user_bet'] - parseFloat(req.body.bet_amount) * 4 > 0) {
            //       newTransactionJ.amount +=
            //         parseFloat(req.body.bet_amount) *
            //         4 *
            //         ((100 - commission) / 100);

            //       roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

            //       roomInfo['host_pr'] -= (parseFloat(req.body.bet_amount) * 4);
            //       roomInfo['user_bet'] -= (parseFloat(req.body.bet_amount) * 4);

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       message.message =
            //         'Won ' +
            //         convertToCurrency(parseFloat(req.body.bet_amount) * 4) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];
            //     } else {
            //       newTransactionJ.amount +=
            //         parseFloat(roomInfo['user_bet']) * ((100 - commission) / 100);

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       roomInfo.status = 'finished';
            //       message.message =
            //         'Won ' +
            //         // bet_item.bet_amount * 2 +
            //         convertToCurrency(parseFloat(roomInfo['user_bet'])) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];

            //       roomInfo['user_bet'] = 0;
            //       roomInfo['host_pr'] = 0;
            //     }
            //     const newRollGuess = new RollGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_roll: 4
            //     });
            //     await newRollGuess.save();

            //     newGameLog.multiplier = 4;

            //     const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
            //       created_at: 'ascending'
            //     });
            //     if (req.io.sockets) {
            //       req.io.sockets.emit('ROLL_GUESSES', guesses);
            //     }
            //   } else {
            //     newGameLog.game_result = -1;

            //     roomInfo.host_pr =
            //       (parseFloat(roomInfo.host_pr) || 0) +
            //       parseFloat(req.body.bet_amount);
            //     roomInfo.user_bet =
            //       (parseFloat(roomInfo.user_bet) || 0) +
            //       parseFloat(req.body.bet_amount);



            //     if (
            //       roomInfo['endgame_type'] &&
            //       roomInfo['user_bet'] >= roomInfo['endgame_amount']
            //     ) {
            //       newTransactionC.amount +=
            //         parseFloat(roomInfo['user_bet']) -
            //         parseFloat(roomInfo['endgame_amount']);

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();
            //       roomInfo['user_bet'] = parseFloat(roomInfo['endgame_amount']);
            //     }

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(req.body.bet_amount) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     const newRollGuess = new RollGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount,
            //       host_roll: bet_item.roll
            //     });
            //     await newRollGuess.save();
            //   }
            //   const guesses = await RollGuess.find({ room: roomInfo._id }).sort({
            //     created_at: 'ascending'
            //   });
            //   if (req.io.sockets) {
            //     req.io.sockets.emit('ROLL_GUESSES', guesses);
            //   }

            //   bet_item.joiner = req.user;
            //   bet_item.joiner_roll = req.body.bet_amount;
            //   await bet_item.save();

            //   if (!roomInfo.joiners.includes(req.user)) {
            //     roomInfo.joiners.addToSet(req.user);
            //     await roomInfo.save();
            //   }

            //   if (roomInfo['user_bet'] <= 0.0005) {
            //     roomInfo.status = 'finished';
            //     newGameLog.game_result = 1;
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     const newGameLogC = new GameLog({
            //       room: roomInfo,
            //       creator: roomInfo['creator'],
            //       joined_user: roomInfo['creator'],
            //       game_type: roomInfo['game_type'],
            //       bet_amount: roomInfo['host_pr'],
            //       user_bet: roomInfo['user_bet'],
            //       is_anonymous: roomInfo['is_anonymous'],
            //       game_result: -100
            //     });
            //     await newGameLogC.save();
            //   }
            // } else if (roomInfo['game_type']['game_type_name'] === 'Spleesh!') {
            //   if (parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)) {
            //     // Return an error or some other response to the user, e.g.:
            //     return res
            //       .status(400)
            //       .json({ error: 'Bet amount exceeds available balance.' });
            //   }

            //   newTransactionJ.amount -= req.body.bet_amount;
            //   newGameLog.bet_amount = req.body.bet_amount;
            //   newGameLog.host_pr = roomInfo['host_pr'];

            //   if (roomInfo.pr === req.body.bet_amount) {
            //     newGameLog.game_result = 1;
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(parseFloat(roomInfo['user_bet'])) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     newGameLog.commission =
            //       (parseFloat(roomInfo['user_bet']) + roomInfo['bet_amount']) *
            //       ((commission - 0.5) / 100);

            //     rain.value =
            //       parseFloat(rain.value) +
            //       (parseFloat(roomInfo['user_bet']) + roomInfo['bet_amount']) *
            //       ((commission - 0.5) / 100);

            //     rain.save();

            //     // update platform stat (0.5%)
            //     platform.value =
            //       parseFloat(platform.value) +
            //       (roomInfo['host_pr'] + roomInfo['bet_amount']) * (tax.value / 100);
            //     platform.save();

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATE_RAIN', {
            //         rain: rain.value
            //       });
            //     }


            //     // console.log("wirth", (roomInfo['host_pr'] + (2 * roomInfo['bet_amount'])) *
            //     // ((100 - commission) / 100))
            //     // console.log("wirthout", (roomInfo['host_pr'] + roomInfo['bet_amount']))

            //     // joiner winnings
            //     newTransactionJ.amount +=
            //       (roomInfo['host_pr'] + (2 * roomInfo.pr)) *
            //       ((100 - commission) / 100);

            //     // update bankroll
            //     if (parseFloat(roomInfo['user_bet']) !== 0) {
            //       roomInfo['user_bet'] =
            //         parseFloat(roomInfo['user_bet']) -
            //         (roomInfo['host_pr'] + roomInfo.pr);
            //     }


            //     // update host_pr
            //     if (parseFloat(roomInfo['host_pr']) !== 0) {
            //       roomInfo['host_pr'] = 0;
            //     }


            //     let newBetAmount;
            //     let attemptCount = 0;

            //     if (roomInfo.spleesh_bet_unit === 0.01) {
            //       do {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
            //         attemptCount++;
            //       } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
            //     } else if (roomInfo.spleesh_bet_unit === 0.1) {
            //       do {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
            //         attemptCount++;
            //       } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
            //     } else {
            //       do {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
            //         attemptCount++;
            //       } while (newBetAmount > parseFloat(roomInfo['user_bet']) && attemptCount < 10);
            //     }

            //     if (newBetAmount <= parseFloat(roomInfo['user_bet'])) {

            //       // restart game
            //       roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - newBetAmount;
            //       roomInfo.pr = newBetAmount;
            //       roomInfo['host_pr'] = 0;

            //       // Reset the spleesh guess array
            //       SpleeshGuess.deleteMany({ room: roomInfo._id }, function (err) {
            //         if (err) {
            //           console.log(err);
            //         }
            //       });
            //       const guesses = await SpleeshGuess.find({ room: roomInfo._id }).sort({
            //         created_at: 'ascending'
            //       });
            //       if (req.io.sockets) {
            //         req.io.sockets.emit('SPLEESH_GUESSES', guesses);
            //       }

            //     } else {
            //       newTransactionC.amount += parseFloat(roomInfo['user_bet']);
            //       roomInfo.status = 'finished';

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['bet_amount'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: -100
            //       });
            //       await newGameLogC.save();
            //     }
            //   } else {
            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(req.body.bet_amount) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     newGameLog.game_result = -1;

            //     roomInfo['host_pr'] += req.body.bet_amount;
            //     roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) + req.body.bet_amount;

            //     const newSpleeshGuess = new SpleeshGuess({
            //       room: roomInfo._id,
            //       bet_amount: newGameLog.bet_amount
            //     });
            //     await newSpleeshGuess.save();

            //     if (!roomInfo.joiners.includes(req.user)) {
            //       roomInfo.joiners.addToSet(req.user);
            //       await roomInfo.save();
            //     }

            //     if (
            //       (roomInfo['endgame_type'] &&
            //         (roomInfo['host_pr'] + roomInfo.pr)) >= roomInfo['endgame_amount']
            //     ) {
            //       // console.log("endgame exec", roomInfo['host_pr']);

            //       newTransactionC.amount +=
            //         (parseFloat(roomInfo['user_bet']) -
            //           parseFloat(roomInfo['endgame_amount']));
            //       roomInfo['user_bet'] =
            //         parseFloat(roomInfo['endgame_amount']);

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['host_pr'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();

            //       // Randomize the new bet amount
            //       let newBetAmount;

            //       if (roomInfo.spleesh_bet_unit === 0.01) {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
            //         while (newBetAmount > roomInfo['user_bet']) {
            //           newBetAmount = (Math.floor(Math.random() * 10) + 1) / 100;
            //         }
            //       } else if (roomInfo.spleesh_bet_unit === 0.1) {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
            //         while (newBetAmount > roomInfo['user_bet']) {
            //           newBetAmount = (Math.floor(Math.random() * 10) + 1) / 10;
            //         }
            //       } else {
            //         newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
            //         while (newBetAmount > roomInfo['user_bet']) {
            //           newBetAmount = (Math.floor(Math.random() * 10) + 1) / 1000;
            //         }
            //       }

            //       roomInfo.pr = newBetAmount;
            //       roomInfo['host_pr'] = 0;
            //       roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - newBetAmount;

            //       SpleeshGuess.deleteMany({ room: roomInfo._id }, function (err) {
            //         if (err) {
            //           console.log(err);
            //         }
            //       });
            //     }
            //   }

            //   const guesses = await SpleeshGuess.find({ room: roomInfo._id }).sort({
            //     created_at: 'ascending'
            //   });
            //   if (req.io.sockets) {
            //     req.io.sockets.emit('SPLEESH_GUESSES', guesses);
            //   }

            // } else if (roomInfo['game_type']['game_type_name'] === 'Mystery Box') {
            //   let selected_box = await RoomBoxPrize.findOne({
            //     _id: new ObjectId(req.body.selected_id)
            //   }).populate({ path: 'joiner', model: User });
            //   selected_box.status = 'opened';
            //   selected_box.joiner = req.user;
            //   await selected_box.save();

            //   newGameLog.game_result = selected_box.box_prize;
            //   newGameLog.bet_amount = req.body.bet_amount;

            //   if (selected_box.box_price > req.user.balance) {
            //     return res.json({
            //       success: false,
            //       message: "NOT ENUFF FUNDS AT THIS MEOWMENT"
            //     });
            //   }
            //   newTransactionJ.amount -= selected_box.box_price;
            //   newTransactionJ.amount +=
            //     selected_box.box_prize * ((100 - commission) / 100);

            //   newGameLog.commission =
            //     selected_box.box_prize * ((commission - 0.5) / 100);

            //   // update rain
            //   rain.value =
            //     parseFloat(rain.value) +
            //     selected_box.box_prize * ((commission - 0.5) / 100);

            //   rain.save();

            //   // update platform stat (0.5%)
            //   platform.value =
            //     parseFloat(platform.value) +
            //     selected_box.box_prize * (tax.value / 100);
            //   platform.save();

            //   if (req.io.sockets) {
            //     req.io.sockets.emit('UPDATE_RAIN', {
            //       rain: rain.value
            //     });
            //   }

            //   // update bankroll
            //   roomInfo['user_bet'] =
            //     parseFloat(roomInfo['user_bet']) +
            //     selected_box.box_prize * ((commission - 0.5) / 100);

            //   if (selected_box.box_prize === 0) {
            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(selected_box.box_price) +
            //       ' opening an empty box in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];
            //   } else {
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(selected_box.box_prize) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];
            //   }

            //   opened_amount = 0;
            //   box_list = await RoomBoxPrize.find({ room: roomInfo });
            //   max_prize = 0;
            //   lowest_box_price = -1;
            //   new_host_pr = 0;

            //   box_list.forEach(box => {
            //     if (box.status === 'opened') {
            //       new_host_pr += box.box_price;
            //     } else {
            //       new_host_pr += box.box_prize;

            //       if (lowest_box_price === -1 || lowest_box_price > box.box_price) {
            //         lowest_box_price = box.box_price;
            //       }

            //       if (max_prize < box.box_prize) {
            //         max_prize = box.box_prize;
            //       }
            //     }
            //   });

            //   // Retrieve the updated box list data from the database
            //   const updatedBoxList = await RoomBoxPrize.find({ room: roomInfo });

            //   // Emit the updated box list data to the connected clients
            //   if (req.io.sockets) {
            //     req.io.sockets.emit('UPDATED_BOX_LIST', {
            //       box_list: updatedBoxList
            //     });
            //   }

            //   if (!roomInfo.joiners.includes(req.user)) {
            //     roomInfo.joiners.addToSet(req.user);
            //     await roomInfo.save();
            //   }

            //   if (
            //     (roomInfo['endgame_type'] &&
            //       new_host_pr >= roomInfo.endgame_amount) ||
            //     max_prize === 0
            //   ) {
            //     if (max_prize === 0) {
            //       if (parseFloat(roomInfo.user_bet) - roomInfo.bet_amount >= 0) {
            //         roomInfo.user_bet =
            //           parseFloat(roomInfo.user_bet) - roomInfo.bet_amount;
            //         const originalBoxList = await RoomBoxPrize.find({
            //           room: roomInfo
            //         }).select('box_prize box_price');

            //         let originalHasZero = originalBoxList.some(
            //           box => box.box_price === 0
            //         );
            //         await RoomBoxPrize.deleteMany({ room: roomInfo });

            //         let boxPrizes = originalBoxList.map(box => box.box_prize);

            //         // shuffle the box prizes
            //         for (let i = boxPrizes.length - 1; i > 0; i--) {
            //           let j = Math.floor(Math.random() * (i + 1));
            //           [boxPrizes[i], boxPrizes[j]] = [boxPrizes[j], boxPrizes[i]];
            //         }

            //         let updatedBoxList = originalBoxList.map((box, index) => {
            //           // Pick a random box_price from the originalBoxList
            //           let randomIndex = Math.floor(Math.random() * originalBoxList.length);
            //           let randomBoxPrice = originalBoxList[randomIndex].box_price;

            //           // Use the randomly picked box_price for the new box
            //           let newBox = new RoomBoxPrize({
            //             room: roomInfo,
            //             box_prize: boxPrizes[index],
            //             box_price: randomBoxPrice,
            //             status: 'init'
            //           });

            //           newBox.save();
            //           return newBox;
            //         });


            //         if (req.io.sockets) {
            //           req.io.sockets.emit('UPDATED_BOX_LIST', {
            //             box_list: updatedBoxList
            //           });
            //         }
            //       } else if (
            //         roomInfo.endgame_amount &&
            //         new_host_pr - roomInfo.endgame_amount <= 0
            //       ) {
            //         newTransactionC.amount +=
            //           parseFloat(roomInfo.user_bet) + parseFloat(new_host_pr);

            //         roomInfo.status = 'finished';

            //         const newGameLogC = new GameLog({
            //           room: roomInfo,
            //           creator: roomInfo['creator'],
            //           joined_user: roomInfo['creator'],
            //           game_type: roomInfo['game_type'],
            //           bet_amount: roomInfo['host_pr'],
            //           is_anonymous: roomInfo['is_anonymous'],
            //           game_result: -100
            //         });
            //         await newGameLogC.save();
            //       }
            //     } else {
            //       newTransactionC.amount += new_host_pr - roomInfo.endgame_amount;

            //       const messageC =
            //         'I received ' +
            //         new_host_pr +
            //         ' ETH ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];
            //       sendEndedMessageToJoiners(
            //         roomInfo._id,
            //         roomInfo['creator']['id'],
            //         messageC,
            //         roomInfo.is_anonymous
            //       );
            //       // newGameLog.game_result = 3;

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: new_host_pr,
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();
            //       roomInfo.user_bet =
            //         parseFloat(roomInfo.user_bet) +
            //         roomInfo.endgame_amount -
            //         roomInfo.bet_amount;
            //       newGameLog.new_host_pr = new_host_pr;
            //       new_host_pr = roomInfo.bet_amount;

            //       const originalBoxList = await RoomBoxPrize.find({
            //         room: roomInfo
            //       }).select('box_prize box_price');

            //       await RoomBoxPrize.deleteMany({ room: roomInfo });

            //       let boxPrizes = originalBoxList.map(box => box.box_prize);

            //       // shuffle the box prizes
            //       for (let i = boxPrizes.length - 1; i > 0; i--) {
            //         let j = Math.floor(Math.random() * (i + 1));
            //         [boxPrizes[i], boxPrizes[j]] = [boxPrizes[j], boxPrizes[i]];
            //       }

            //       let updatedBoxList = originalBoxList.map((box, index) => {
            //         // Pick a random box_price from the originalBoxList
            //         let randomIndex = Math.floor(Math.random() * originalBoxList.length);
            //         let randomBoxPrice = originalBoxList[randomIndex].box_price;

            //         // Use the randomly picked box_price for the new box
            //         let newBox = new RoomBoxPrize({
            //           room: roomInfo,
            //           box_prize: boxPrizes[index],
            //           box_price: randomBoxPrice,
            //           status: 'init'
            //         });

            //         newBox.save();
            //         return newBox;
            //       });

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BOX_LIST', {
            //           box_list: updatedBoxList
            //         });
            //       }
            //     }
            //   }

            //   roomInfo.new_host_pr = new_host_pr;
            //   // new_host_pr -= roomInfo.endgame_amount;
            //   roomInfo.host_pr = new_host_pr;
            //   roomInfo.pr = max_prize;
            //   newGameLog.selected_box = selected_box;
            // } else if (roomInfo['game_type']['game_type_name'] === 'Blackjack') {

            //   // console.log("****NEW BET******")
            //   newGameLog.bet_amount = parseFloat(req.body.bet_amount);
            //   const score = parseInt(req.body.score);
            //   let score_host = parseInt(req.body.score_host);
            //   // console.log("score: ", score);
            //   // console.log("score_host: ", score_host);
            //   let cardsArray = [];
            //   if (score === 6198) {
            //     const result = updateHostScore(score_host, score);
            //     // console.log("result: ", result);
            //     score_host = result.newScoreHost;
            //     // console.log("currentScoreHost: ", score_host);
            //     cardsArray.push({ card: result.card, score: score_host });
            //     if (score === 6198 && score_host === 21) {
            //       // console.log("split", score, score_host)

            //       newGameLog.game_result = 0;

            //       newTransactionJ.amount += parseFloat(req.body.bet_amount);
            //       message.message =
            //         'Split ' +
            //         convertToCurrency(req.body.bet_amount * 2) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];
            //       if (req.io.sockets) {
            //         req.io.sockets.emit('CARDS_ARRAY', {
            //           cardsArray: cardsArray
            //         });
            //       }
            //     } else {
            //       newGameLog.game_result = 1;
            //       // console.log("blackjack", score)

            //       newTransactionJ.amount += (((parseFloat(req.body.bet_amount * 2) + (parseFloat(req.body.bet_amount) * 0.5))) * ((100 - commission) / 100));
            //       message.message =
            //         'Win ' +
            //         convertToCurrency(parseFloat(req.body.bet_amount + (parseFloat(req.body.bet_amount) * 0.5))) +
            //         ' in ' +
            //         roomInfo['game_type']['short_name'] +
            //         '-' +
            //         roomInfo['room_number'];

            //       roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - ((parseFloat(req.body.bet_amount) + (parseFloat(req.body.bet_amount) * 0.5)));

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATED_BANKROLL', {
            //           bankroll: roomInfo['user_bet']
            //         });
            //       }

            //       // update rain
            //       rain.value =
            //         parseFloat(rain.value) +
            //         roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

            //       rain.save();

            //       // update platform stat (0.5%)
            //       platform.value =
            //         parseFloat(platform.value) +
            //         roomInfo['bet_amount'] * 2 * (tax.value / 100);
            //       platform.save();

            //       if (req.io.sockets) {
            //         req.io.sockets.emit('UPDATE_RAIN', {
            //           rain: rain.value
            //         });
            //       }
            //       if (req.io.sockets) {
            //         req.io.sockets.emit('CARDS_ARRAY', {
            //           cardsArray: cardsArray
            //         });
            //       }

            //     }
            //   } else if (score <= 21) {

            //     const allBetItems = await BjBetItem.find({
            //       room: new ObjectId(req.body._id)
            //     });
            //     const host_bj = predictNextBj(allBetItems, score_host);
            //     if (host_bj === 'hit') {
            //       let currentScoreHost = score_host;


            //       // Loop to continue hitting until the host busts or stands
            //       while (currentScoreHost < 21 && predictNextBj(allBetItems, currentScoreHost) === 'hit') {

            //         const result = updateHostScore(currentScoreHost, score);
            //         currentScoreHost = result.newScoreHost;
            //         cardsArray.push({ card: result.card, score: currentScoreHost });
            //         if (currentScoreHost >= score) {
            //           break;
            //         }
            //       }

            //       if ((score > currentScoreHost) || currentScoreHost > 21) {
            //         newGameLog.game_result = 1;
            //         // console.log("win", score, currentScoreHost)

            //         newTransactionJ.amount += (parseFloat(req.body.bet_amount * 2) * ((100 - commission) / 100));
            //         message.message =
            //           'Win ' +
            //           convertToCurrency(req.body.bet_amount * 2) +
            //           ' in ' +
            //           roomInfo['game_type']['short_name'] +
            //           '-' +
            //           roomInfo['room_number'];

            //         roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - parseFloat(req.body.bet_amount);

            //         if (req.io.sockets) {
            //           req.io.sockets.emit('UPDATED_BANKROLL', {
            //             bankroll: roomInfo['user_bet']
            //           });
            //         }


            //         // update rain
            //         rain.value =
            //           parseFloat(rain.value) +
            //           roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

            //         rain.save();

            //         // update platform stat (0.5%)
            //         platform.value =
            //           parseFloat(platform.value) +
            //           roomInfo['bet_amount'] * 2 * (tax.value / 100);
            //         platform.save();

            //         if (req.io.sockets) {
            //           req.io.sockets.emit('UPDATE_RAIN', {
            //             rain: rain.value
            //           });
            //         }

            //         if (req.io.sockets) {
            //           req.io.sockets.emit('CARDS_ARRAY', {
            //             cardsArray: cardsArray
            //           });
            //         }

            //       } else if ((score === currentScoreHost)) {

            //         newGameLog.game_result = 0;

            //         newTransactionJ.amount += parseFloat(req.body.bet_amount);
            //         message.message =
            //           'Split ' +
            //           convertToCurrency(req.body.bet_amount * 2) +
            //           ' in ' +
            //           roomInfo['game_type']['short_name'] +
            //           '-' +
            //           roomInfo['room_number'];
            //         if (req.io.sockets) {
            //           req.io.sockets.emit('CARDS_ARRAY', {
            //             cardsArray: cardsArray
            //           });
            //         }
            //       } else {

            //         newGameLog.game_result = -1;
            //         // lost bj
            //         roomInfo.host_pr =
            //           (parseFloat(roomInfo.host_pr) || 0) +
            //           parseFloat(req.body.bet_amount);
            //         roomInfo.user_bet =
            //           (parseFloat(roomInfo.user_bet) || 0) +
            //           parseFloat(req.body.bet_amount);

            //         if (
            //           roomInfo['endgame_type'] &&
            //           roomInfo['user_bet'] >= roomInfo['endgame_amount']
            //         ) {

            //           newTransactionC.amount +=
            //             parseFloat(roomInfo['user_bet']) -
            //             parseFloat(roomInfo['endgame_amount']);

            //           const newGameLogC = new GameLog({
            //             room: roomInfo,
            //             creator: roomInfo['creator'],
            //             joined_user: roomInfo['creator'],
            //             game_type: roomInfo['game_type'],
            //             bet_amount: roomInfo['host_pr'],
            //             user_bet: roomInfo['user_bet'],
            //             is_anonymous: roomInfo['is_anonymous'],
            //             game_result: 3
            //           });
            //           await newGameLogC.save();
            //           roomInfo['user_bet'] = parseFloat(
            //             roomInfo['endgame_amount']
            //           ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
            //         }

            //         if (req.io.sockets) {
            //           req.io.sockets.emit('UPDATED_BANKROLL', {
            //             bankroll: roomInfo['user_bet']
            //           });
            //         }

            //         message.message =
            //           'Lost ' +
            //           convertToCurrency(req.body.bet_amount) +
            //           ' in ' +
            //           roomInfo['game_type']['short_name'] +
            //           '-' +
            //           roomInfo['room_number'];
            //         if (req.io.sockets) {
            //           req.io.sockets.emit('CARDS_ARRAY', {
            //             cardsArray: cardsArray
            //           });
            //         }
            //       }
            //     }

            //   } else {

            //     newGameLog.game_result = -1;
            //     // lost bj
            //     roomInfo.host_pr =
            //       (parseFloat(roomInfo.host_pr) || 0) +
            //       parseFloat(req.body.bet_amount);
            //     roomInfo.user_bet =
            //       (parseFloat(roomInfo.user_bet) || 0) +
            //       parseFloat(req.body.bet_amount);

            //     if (
            //       roomInfo['endgame_type'] &&
            //       roomInfo['user_bet'] >= roomInfo['endgame_amount']
            //     ) {
            //       newTransactionC.amount +=
            //         parseFloat(roomInfo['user_bet']) -
            //         parseFloat(roomInfo['endgame_amount']);

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['host_pr'],
            //         user_bet: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();
            //       roomInfo['user_bet'] = parseFloat(
            //         roomInfo['endgame_amount']
            //       ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
            //     }

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATED_BANKROLL', {
            //         bankroll: roomInfo['user_bet']
            //       });
            //     }

            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(req.body.bet_amount) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('CARDS_ARRAY', {
            //         cardsArray: cardsArray
            //       });
            //     }
            //   }

            //   // bet_item.joiner = req.user;
            //   // bet_item.joiner_bj = req.body.selected_bj;
            //   // await bet_item.save();

            //   if (!roomInfo.joiners.includes(req.user)) {
            //     roomInfo.joiners.addToSet(req.user);
            //     await roomInfo.save();
            //   }

            //   if (roomInfo['user_bet'] <= 0.0005) {
            //     roomInfo.status = 'finished';
            //     newGameLog.game_result = 1;
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     const newGameLogC = new GameLog({
            //       room: roomInfo,
            //       creator: roomInfo['creator'],
            //       joined_user: roomInfo['creator'],
            //       game_type: roomInfo['game_type'],
            //       bet_amount: roomInfo['host_pr'],
            //       user_bet: roomInfo['user_bet'],
            //       is_anonymous: roomInfo['is_anonymous'],
            //       game_result: -100
            //     });
            //     await newGameLogC.save();
            //   }
            // } else if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
            //   newGameLog.bet_amount = roomInfo['bet_amount'];
            //   newGameLog.brain_game_score = req.body.brain_game_score;

            //   newTransactionJ.amount -= roomInfo['bet_amount'];

            //   // roomInfo['user_bet'] += roomInfo['bet_amount'];
            //   if (roomInfo.brain_game_score == req.body.brain_game_score) {
            //     //draw          Draw, No Winner! PR will be split.
            //     message.message =
            //       'Split ' +
            //       convertToCurrency(roomInfo['bet_amount'] * 2) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     newTransactionJ.amount += roomInfo['bet_amount'];
            //     // newTransactionC.amount += roomInfo['bet_amount'];

            //     // roomInfo.status = 'finished';
            //     newGameLog.game_result = 0;
            //   } else if (roomInfo.brain_game_score < req.body.brain_game_score) {
            //     //win       WOW, What a BRAIN BOX - You WIN!
            //     message.message =
            //       'Won ' +
            //       convertToCurrency(roomInfo['bet_amount'] * 2) +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];

            //     newTransactionJ.amount +=
            //       roomInfo['bet_amount'] * 2 * ((100 - commission) / 100);

            //     newGameLog.commission =
            //       roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

            //     // update rain
            //     rain.value =
            //       parseFloat(rain.value) +
            //       roomInfo['bet_amount'] * 2 * ((commission - 0.5) / 100);

            //     rain.save();

            //     // update platform stat (0.5%)
            //     platform.value =
            //       parseFloat(platform.value) +
            //       roomInfo['bet_amount'] * 2 * (tax.value / 100);
            //     platform.save();

            //     if (req.io.sockets) {
            //       req.io.sockets.emit('UPDATE_RAIN', {
            //         rain: rain.value
            //       });
            //     }

            //     roomInfo['pr'] -= roomInfo['bet_amount'];
            //     roomInfo['host_pr'] -= roomInfo['bet_amount'];
            //     // update bankroll

            //     roomInfo['host_pr'] =
            //       parseFloat(roomInfo['host_pr']) +
            //       parseFloat(roomInfo['bet_amount']) * 2 * ((commission - 0.5) / 100);
            //     roomInfo['pr'] =
            //       parseFloat(roomInfo['pr']) +
            //       parseFloat(roomInfo['bet_amount']) * 2 * ((commission - 0.5) / 100);

            //     if (roomInfo['host_pr'] <= parseFloat(roomInfo['user_bet'])) {
            //       roomInfo.status = 'finished';
            //       newTransactionC.amount += parseFloat(roomInfo['host_pr']);
            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['host_pr'],
            //         user_bet: roomInfo['user_bet'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: -100
            //       });
            //       await newGameLogC.save();
            //     }

            //     newGameLog.game_result = 1;
            //     // roomInfo.status = 'finished';
            //   } else {
            //     //failed    Oops, back to school for you loser!!
            //     message.message =
            //       'Lost ' +
            //       convertToCurrency(roomInfo['bet_amount']) +
            //       ' in ' +
            //       roomInfo['game_type']['short_name'] +
            //       '-' +
            //       roomInfo['room_number'];
            //     roomInfo['pr'] += roomInfo['bet_amount'];
            //     roomInfo['host_pr'] += roomInfo['bet_amount'];
            //     newGameLog.game_result = -1;
            //     if (
            //       roomInfo['endgame_amount'] > 0 &&
            //       roomInfo['host_pr'] > roomInfo['endgame_amount']
            //     ) {
            //       // roomInfo.status = 'finished';

            //       newTransactionC.amount +=
            //         roomInfo['host_pr'] - roomInfo['endgame_amount'];

            //       const newGameLogC = new GameLog({
            //         room: roomInfo,
            //         creator: roomInfo['creator'],
            //         joined_user: roomInfo['creator'],
            //         game_type: roomInfo['game_type'],
            //         bet_amount: roomInfo['bet_amount'],
            //         host_pr: roomInfo['host_pr'],
            //         is_anonymous: roomInfo['is_anonymous'],
            //         game_result: 3
            //       });
            //       await newGameLogC.save();

            //       roomInfo['host_pr'] = parseFloat(roomInfo['endgame_amount']);
            //       roomInfo['pr'] = parseFloat(roomInfo['endgame_amount']);
            //     }
            //   }
            // }
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

            user['balance'] += newTransactionJ.amount;
            user['gamePlayed']++;
            user['totalProfit'] += Math.abs(newTransactionJ.amount);
            user['totalWagered'] += Math.abs(newTransactionJ.amount);

            if (user['profitAllTimeHigh'] < newTransactionJ.amount) {
                user['profitAllTimeHigh'] = newTransactionJ.amount;
            }
            if (user['profitAllTimeLow'] > newTransactionJ.amount) {
                user['profitAllTimeLow'] = newTransactionJ.amount;
            }

            // if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
            //   req.user['balance'] += roomInfo['bet_amount'];

            //   const brain_game_type = await BrainGameType.findOne({ _id: roomInfo.brain_game_type });

            //   if (brain_game_type) {
            //     brain_game_type.plays++;
            //     await brain_game_type.save(); // Save the changes to the document
            //   }
            // }

            // Save the changes to the user document
            await user.save();

            newGameLog.save();
            await roomInfo.save();

            if (!roomInfo.joiners.includes(user)) {
                roomInfo.joiners.addToSet(user);
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
                if (roomInfo.hosts[0].share === 100) {

                    if (newTransactionC.amount !== 0) {
                        newTransactionC.save();
                        socket.newTransaction(newTransactionC);
                    }
                } else {

                    // Iterate over each host asynchronously
                    roomInfo.hosts.forEach(async (host) => {
                        const amountForHost = ((host.share / 100) * newTransactionC.amount);
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
                        const coHost = await User.findOne({ _id: host.host });

                        if (coHost) {
                            coHost.balance += amountForHost;
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

                    // if (newGameLog.game_result === 1) {

                    //   const chanceOfExecution = 0.05;
                    //   const randomValue = Math.random();

                    //   if (randomValue < chanceOfExecution) {
                    //     const items = await Item.find({
                    //       item_type: '653ee7ac17c9f5ee21245649',
                    //       'owners.user': '629685058f368a1838372754'
                    //     });

                    //     // Check if there are any matching items
                    //     if (items.length === 0) {
                    //       console.log('No matching items found');
                    //     }

                    //     const gameTypeConditions = [
                    //       {
                    //         name: 'Brain Game',
                    //         id: '654e25cb98cb749b169756d5',
                    //         chance: 0.8
                    //       },
                    //       {
                    //         name: 'Quick Shoot',
                    //         id: '654ce2591190b95f119a9904',
                    //         chance: 0.8
                    //       },
                    //       {
                    //         name: 'RPS',
                    //         ids: [
                    //           '653fa125fcff1e90ab8b742f',
                    //           '653fa43dfcff1e90ab8b7431',
                    //           '653fb118fcff1e90ab8b7434',
                    //           '653fa42efcff1e90ab8b7430',
                    //           '653faf7afcff1e90ab8b7432',
                    //           '653fb106fcff1e90ab8b7433'
                    //         ],
                    //         chances: [0.25, 0.25, 0.25, 0.05, 0.05, 0.05]
                    //       },
                    //       {
                    //         name: 'Roll',
                    //         ids: [
                    //           '653fa125fcff1e90ab8b742f',
                    //           '653fa43dfcff1e90ab8b7431',
                    //           '653fb118fcff1e90ab8b7434',
                    //           '653f617717c9f5ee2124565d',
                    //           '653f769417c9f5ee21245665',
                    //           '653f793017c9f5ee21245666'
                    //         ],
                    //         chances: [0.2, 0.2, 0.2, 0.2, 0.1, 0.05]
                    //       }
                    //     ];

                    //     const selectedGameType = roomInfo['game_type']['game_type_name'];
                    //     const matchingGameType = gameTypeConditions.find(
                    //       condition => condition.name === selectedGameType
                    //     );

                    //     if (matchingGameType) {
                    //       if (
                    //         Array.isArray(matchingGameType.ids) &&
                    //         Array.isArray(matchingGameType.chances)
                    //       ) {
                    //         const totalChances = matchingGameType.chances.reduce(
                    //           (acc, chance) => acc + chance,
                    //           0
                    //         );
                    //         const randomValueForSpecialItem = Math.random();

                    //         let cumulativeProbability = 0;
                    //         for (let i = 0; i < matchingGameType.ids.length; i++) {
                    //           cumulativeProbability +=
                    //             matchingGameType.chances[i] / totalChances;

                    //           if (randomValueForSpecialItem < cumulativeProbability) {
                    //             // Use the specific item with the corresponding ID
                    //             const specialItem = await Item.findById(
                    //               matchingGameType.ids[i]
                    //             );

                    //             if (specialItem) {
                    //               // Update logic for the special item
                    //               const ownerIndexSpecialItem = specialItem.owners.findIndex(
                    //                 owner =>
                    //                   owner.user.toString() === '629685058f368a1838372754'
                    //               );

                    //               if (ownerIndexSpecialItem !== -1) {
                    //                 specialItem.owners[ownerIndexSpecialItem].count -= 1;
                    //                 specialItem.owners[ownerIndexSpecialItem].onSale -= 1;
                    //               }

                    //               const userExistsSpecialItem = specialItem.owners.some(
                    //                 owner => owner.user.toString() === req.user.id
                    //               );

                    //               if (userExistsSpecialItem) {
                    //                 specialItem.owners.find(
                    //                   owner => owner.user.toString() === req.user.id
                    //                 ).count += 1;
                    //               } else {
                    //                 specialItem.owners.push({
                    //                   user: req.user.id,
                    //                   count: 1
                    //                 });
                    //               }

                    //               await specialItem.save();

                    //               if (req.io.sockets) {
                    //                 req.io.sockets.emit('CARD_PRIZE', {
                    //                   image: specialItem.image,
                    //                   productName: specialItem.productName
                    //                 });
                    //               }

                    //               return; // Exit the function after processing the special item
                    //             }
                    //           }
                    //         }
                    //       } else {
                    //         const chanceOfSpecialItem = matchingGameType.chance;
                    //         const randomValueForSpecialItem = Math.random();

                    //         if (randomValueForSpecialItem < chanceOfSpecialItem) {
                    //           const specialItem = await Item.findById(matchingGameType.id);

                    //           if (specialItem) {
                    //             // Update logic for the special item
                    //             const ownerIndexSpecialItem = specialItem.owners.findIndex(
                    //               owner =>
                    //                 owner.user.toString() === '629685058f368a1838372754'
                    //             );

                    //             if (ownerIndexSpecialItem !== -1) {
                    //               specialItem.owners[ownerIndexSpecialItem].count -= 1;
                    //               specialItem.owners[ownerIndexSpecialItem].onSale -= 1;
                    //             }

                    //             const userExistsSpecialItem = specialItem.owners.some(
                    //               owner => owner.user.toString() === req.user.id
                    //             );

                    //             if (userExistsSpecialItem) {
                    //               specialItem.owners.find(
                    //                 owner => owner.user.toString() === req.user.id
                    //               ).count += 1;
                    //             } else {
                    //               specialItem.owners.push({
                    //                 user: req.user.id,
                    //                 count: 1
                    //               });
                    //             }

                    //             await specialItem.save();

                    //             if (req.io.sockets) {
                    //               req.io.sockets.emit('CARD_PRIZE', {
                    //                 image: specialItem.image,
                    //                 productName: specialItem.productName
                    //               });
                    //             }

                    //             return; // Exit the function after processing the special item
                    //           }
                    //         }
                    //       }
                    //     }

                    //     // If not a matching game type or the random chance didn't select the special item, continue with the existing logic
                    //     const randomIndex = Math.floor(Math.random() * items.length);
                    //     const selectedItem = items[randomIndex];

                    //     const ownerIndex = selectedItem.owners.findIndex(
                    //       owner => owner.user.toString() === '629685058f368a1838372754'
                    //     );

                    //     if (ownerIndex !== -1) {
                    //       selectedItem.owners[ownerIndex].count -= 1;
                    //       selectedItem.owners[ownerIndex].onSale -= 1;
                    //     }

                    //     const userExists = selectedItem.owners.some(
                    //       owner => owner.user.toString() === req.user.id
                    //     );

                    //     if (userExists) {
                    //       selectedItem.owners.find(
                    //         owner => owner.user.toString() === req.user.id
                    //       ).count += 1;
                    //     } else {
                    //       selectedItem.owners.push({
                    //         user: req.user.id,
                    //         count: 1
                    //       });
                    //     }

                    //     await selectedItem.save();

                    //     if (req.io.sockets) {
                    //       req.io.sockets.emit('CARD_PRIZE', {
                    //         image: selectedItem.image,
                    //         productName: selectedItem.productName
                    //       });
                    //     }
                    //   }
                    // }
                }
            }, 0);
        }

        responseData = {
            success: true,
            message: 'successful bet',
            betResult: newGameLog.game_result,
            newTransaction: newTransactionJ,
            roomStatus: roomInfo.status
        };
        return responseData;
    } catch (err) {
        console.error(err);
        throw new Error('Error executing bet');
    }
};

module.exports = executeBet;
