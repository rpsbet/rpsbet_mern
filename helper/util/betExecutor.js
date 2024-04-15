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
const saveDocumentWithRetry = require('./retrySave');
const requestQueue = [];


let user_access_log = {};

function check_access_time(user_id) {
    const check_result =
        user_access_log[user_id] && Date.now() - user_access_log[user_id] < 1000
            ? false
            : true;
    user_access_log[user_id] = Date.now();
    return check_result;
}

const addToQueue = async (req, bot = false) => {
    try {
        const tax = await SystemSetting.findOne({ name: 'commission' });
        const rain = await SystemSetting.findOne({ name: 'rain' });
        const platform = await SystemSetting.findOne({ name: 'platform' });
        let responseData = {};
        let user;
        if (bot) {
            user = await User.findOne({ _id: req.user._id });

        } else {
            user = req.user;
        }

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

            if (
                parseFloat(req.body.bet_amount) < 0.05
            ) {

                responseData = {
                    success: false,
                    message: 'MEOWNIMUM BET IS 0.05 RPS'
                }
                return responseData;
            }

            roomInfo = await Room.findOne({ _id: req.body._id })
                .select('room_number selectedStrategy game_type rps_game_type joiners creator bet_amount user_bet pr host_pr endgame_type endgame_amount is_private room_password status hosts')
                .populate({
                    path: 'creator',
                    model: User,
                    select: '_id avatar accessory totalWagered username totalProfit gamePlayed profitAllTimeHigh profitAllTimeLow balance ' // Only select the 'username' field from the 'User' document
                })
                .populate({
                    path: 'game_type',
                    model: GameType,
                    select: 'game_type_name short_name'
                })

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
            let commission;

            if (accessory) {
                item = await Item.findOne({ image: accessory }).select('CP');
                if (item) {
                    commission = item.CP + parseFloat(tax.value);
                } else {
                    commission = parseFloat(tax.value); // If no item found, use tax.value directly
                }
            } else {
                commission = parseFloat(tax.value); // If no accessory, use tax.value directly
            }

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
                    return responseData;
                }

                newGameLog.bet_amount = parseFloat(req.body.bet_amount);

                // get next unused item
                const availableBetItem = await RpsBetItem.findOne({
                    room: req.body._id,
                    // joiner: user._id,
                    joiner_rps: ''
                });
                let bet_item = availableBetItem;

                // if no more items, create a new one
                if (!bet_item && roomInfo['rps_game_type'] === 0) {
                    let nextItem;

                    const allBetItems = await RpsBetItem.find({
                        room: new ObjectId(req.body._id),
                        joiner: user._id,
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
                            // no unknown strategies
                            break;
                    }

                    // save the new item
                    bet_item = new RpsBetItem({
                        room: new ObjectId(req.body._id),
                        rps: nextItem,
                        bet_amount: parseFloat(req.body.bet_amount),
                    });

                    try {
                        await saveDocumentWithRetry(bet_item);
                    } catch (error) {
                        console.error("Error saving bet_item:", error);
                    }

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

                    // rig clause
                    const randomNumber = Math.random();
                    if (randomNumber <= 0.12) {
                        if (bot &&
                            ((bet_item.rps === 'R' && req.body.selected_rps === 'S') ||
                                (bet_item.rps === 'P' && req.body.selected_rps === 'R') ||
                                (bet_item.rps === 'S' && req.body.selected_rps === 'P'))
                        ) {
                            // Logic to change req.body.selected_rps based on bot's choice
                            if (bet_item.rps === 'R') {
                                req.body.selected_rps = 'P';
                            } else if (bet_item.rps === 'P') {
                                req.body.selected_rps = 'S';
                            } else {
                                req.body.selected_rps = 'R';
                            }
                        }
                    }

                    // deduct the joiner's bet
                    newTransactionJ.amount -= parseFloat(req.body.bet_amount);

                    // if win
                    if (
                        (bet_item.rps === 'R' && req.body.selected_rps == 'P') ||
                        (bet_item.rps === 'P' && req.body.selected_rps == 'S') ||
                        (bet_item.rps === 'S' && req.body.selected_rps == 'R')
                    ) {
                        newGameLog.game_result = 1;
                        newTransactionJ.amount +=
                            parseFloat(req.body.bet_amount) * 2 * ((100 - commission) / 100);

                        newGameLog.commission =
                            parseFloat(req.body.bet_amount) * 2 * ((commission - parseFloat(tax.value)) / 100);

                        // update rtb count
                        rain.value =
                            parseFloat(rain.value) +
                            parseFloat(req.body.bet_amount) * 2 * ((commission - parseFloat(tax.value)) / 100);

                        try {
                            await saveDocumentWithRetry(rain);
                        } catch (error) {
                            console.error("Error saving rain:", error);
                        }

                        // update platform earnings (0.5%)
                        platform.value =
                            parseFloat(platform.value) +
                            parseFloat(req.body.bet_amount) * 2 * (parseFloat(tax.value) / 100);
                        try {
                            await saveDocumentWithRetry(platform);
                        } catch (error) {
                            console.error("Error saving platform:", error);
                        }

                        // update bankroll
                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

                        roomInfo['host_pr'] -= parseFloat(req.body.bet_amount);
                        roomInfo['user_bet'] -= parseFloat(req.body.bet_amount);


                        // send notification
                        message.message =
                            'Won ' +
                            convertToCurrency(req.body.bet_amount * 2) +
                            ' in ' +
                            roomInfo['game_type']['short_name'] +
                            '-' +
                            roomInfo['room_number'];


                        // if draw
                    } else if (bet_item.rps === req.body.selected_rps) {

                        newGameLog.game_result = 0;

                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - (parseFloat(req.body.bet_amount) * (parseFloat(tax.value) / 100));

                        newTransactionJ.amount += (parseFloat(req.body.bet_amount) - parseFloat(req.body.bet_amount) * (parseFloat(tax.value) / 100));

                        message.message =
                            'Split ' +
                            convertToCurrency(req.body.bet_amount * 2) +
                            ' in ' +
                            roomInfo['game_type']['short_name'] +
                            '-' +
                            roomInfo['room_number'];

                        // update platform stat (0.5%)
                        platform.value =
                            parseFloat(platform.value) +
                            parseFloat(req.body.bet_amount) * 2 * (parseFloat(tax.value) / 100);
                        try {
                            await saveDocumentWithRetry(platform);
                        } catch (error) {
                            console.error("Error saving platform:", error);
                        }

                        // if loss
                    } else {

                        newGameLog.game_result = -1;

                        // update bankroll & other
                        roomInfo.host_pr =
                            (parseFloat(roomInfo.host_pr) || 0) +
                            (parseFloat(req.body.bet_amount) * 2 * ((100 - parseFloat(tax.value)) / 100)) - parseFloat(req.body.bet_amount);
                        roomInfo.user_bet =
                            (parseFloat(roomInfo.user_bet) || 0) +
                            (parseFloat(req.body.bet_amount) * 2 * ((100 - parseFloat(tax.value)) / 100)) - parseFloat(req.body.bet_amount);

                        platform.value =
                            parseFloat(platform.value) +
                            parseFloat(req.body.bet_amount) * 2 * (parseFloat(tax.value) / 100);
                        try {
                            await saveDocumentWithRetry(platform);
                        } catch (error) {
                            console.error("Error saving platform:", error);
                        }

                        // if autopayout settings have been satisfied, payout host
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
                                // is_anonymous: roomInfo['is_anonymous'],
                                game_result: 3
                            });

                            try {
                                await saveDocumentWithRetry(newGameLogC);
                            } catch (error) {
                                console.error("Error saving newGameLogC:", error);
                            }
                            roomInfo['user_bet'] = parseFloat(
                                roomInfo['endgame_amount']
                            );
                        }

                        // send notification
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

                if (roomInfo['rps_game_type'] === 0) {
                    winnings = parseFloat(req.body.bet_amount) * 2;
                }

                // update bet item with joiner's data
                newGameLog.winnings = winnings;
                bet_item.joiner = user;
                bet_item.joiner_rps = req.body.selected_rps;
                bet_item.bet_amount = parseFloat(req.body.bet_amount);
                try {
                    await saveDocumentWithRetry(bet_item);
                } catch (error) {
                    console.error("Error saving bet_item:", error);
                }

                // socket for last 5 items
                if (roomInfo['rps_game_type'] === 0) {
                    const lastFiveBetItems = await RpsBetItem.find({
                        room: req.body._id,
                        joiner: user,
                        joiner_rps: { $exists: true, $ne: '' }
                    })
                        .sort({ created_at: 'desc' })
                        .limit(5);

                    const reversedLastFiveBetItems = lastFiveBetItems.slice().reverse();

                    if (req.io.sockets && reversedLastFiveBetItems.length > 0) {
                        req.io.sockets.emit(`UPDATED_BANKROLL_${req.body._id}`, {
                            bankroll: roomInfo['user_bet'],
                            rps: reversedLastFiveBetItems,
                            user: user
                        });
                    }
                } else {
                    // if not spectating, show only current user
                    const lastFiveBetItems = await RpsBetItem.find({
                        room: req.body._id
                    });
                    const rps = lastFiveBetItems
                        .filter(item => item.joiner_rps !== '')
                        .slice(-5);
                    if (rps.length > 0 && req.io) {
                        req.io.emit(`UPDATED_BANKROLL_${req.body._id}`, {
                            bankroll: roomInfo['user_bet'],
                            rps: rps
                        });
                    }
                    const nextItem = await RpsBetItem.findOne({
                        room: req.body._id,
                        joiner_rps: ''
                    });
                    if (nextItem) {
                        try {
                            await saveDocumentWithRetry(nextItem);
                        } catch (error) {
                            console.error("Error saving nextItem:", error);
                        }
                    } else {
                        roomInfo.status = 'finished';
                    }
                }

                // if not already added to joiners, add to joiners
                if (!roomInfo.joiners.includes(user)) {
                    roomInfo.joiners.addToSet(user);
                    try {
                        await saveDocumentWithRetry(roomInfo);
                    } catch (error) {
                        console.error("Error saving roomInfo:", error);
                    }
                }

                // rug game if bankroll too low
                if (roomInfo['user_bet'] <= 0.05) {
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
                        // is_anonymous: roomInfo['is_anonymous'],
                        game_result: -100
                    });
                    try {
                        await saveDocumentWithRetry(newGameLogC);
                    } catch (error) {
                        console.error("Error saving newGameLogC:", error);
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
            try {
                await saveDocumentWithRetry(roomInfo['creator']);
            } catch (error) {
                console.error("Error saving roomInfo['creator']:", error);
            }

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

            try {
                await saveDocumentWithRetry(user);
                await saveDocumentWithRetry(newGameLog);
                await saveDocumentWithRetry(roomInfo);
            } catch (error) {
                console.error("Error saving", error);
            }

            if (!roomInfo.joiners.includes(user)) {
                roomInfo.joiners.addToSet(user);
                try {
                    await saveDocumentWithRetry(roomInfo);
                } catch (error) {
                    console.error("Error saving roomInfo", error);
                }
            }
            setTimeout(async () => {

                if (newTransactionJ.amount !== 0) {
                    try {
                        await saveDocumentWithRetry(newTransactionJ);
                    } catch (error) {
                        console.error("Error saving newTransactionJ", error);
                    }
                }

                // Check if user_bet matches the share value of the first host
                if (roomInfo.hosts[0].share === 100) {

                    if (newTransactionC.amount !== 0) {
                        try {
                            await saveDocumentWithRetry(newTransactionC);
                        } catch (error) {
                            console.error("Error saving newTransactionC", error);
                        }
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
                            try {
                                await saveDocumentWithRetry(newTransactionForHost);
                                socket.newTransaction(newTransactionForHost);
                            } catch (error) {
                                console.error("Error saving new transaction:", error);
                            }
                        }
                        const coHost = await User.findOne({ _id: host.host });

                        if (coHost) {
                            coHost.balance += amountForHost;
                            try {
                                await saveDocumentWithRetry(coHost);
                            } catch (error) {
                                console.error("Error saving user:", error);
                            }
                        } else {
                            console.log(`User with host ${host.host} not found.`);
                        }

                    });
                }

                const notificationData = {
                    _id: user._id,
                    message: message.message,
                    username: user.username,
                    avatar: user.avatar,
                    accessory: user.accessory,
                    room: req.body._id,
                    rank: user.totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    is_read: false
                };

                if (message.from._id !== message.to._id) {
                    try {
                        await saveDocumentWithRetry(message);
                        socket.sendNotification(message.to._id, notificationData);
                    } catch (error) {
                        console.error("Error saving message:", error);
                    }
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

const executeBet = (req, bot = false) => {
    return new Promise((resolve, reject) => {
        requestQueue.push({ req, bot, resolve, reject });
        if (requestQueue.length === 1) {
            processQueue();
        }
    });
};

// const executeBet = async (req, bot = false) => {
//     try {
//         const result = await addToQueue(req, bot);
//         return result;
//     } catch (error) {
//         throw new Error('Error executing bet');
//     }
// };

const processQueue = async () => {
    if (requestQueue.length > 0) {
        const { req, bot, resolve, reject } = requestQueue[0];
        try {
            const result = await addToQueue(req, bot);
            resolve(result);
        } catch (error) {
            reject(error);
        }
        // Wait for a very short duration before processing the next item
        setTimeout(() => {
            requestQueue.shift();
            processQueue();
        }, 10); // Adjust the delay here, for example, 10 milliseconds (1/100th of a second)
    }
};


module.exports = executeBet;