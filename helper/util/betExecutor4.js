// betExecutor4.js
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
const { convertGameLogToHistoryStyle } = require('./convertGameLogToHistoryStyle');

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

        const taxPromise = SystemSetting.findOne({ name: 'commission' });
        const rainPromise = SystemSetting.findOne({ name: 'rain' });
        const platformPromise = SystemSetting.findOne({ name: 'platform' });
        const [
            tax,
            rain,
            platform
        ] = await Promise.all([taxPromise, rainPromise, platformPromise]);

        let responseData = {};
        let gameLogArray = [];
        let user;
        let game_result;
        let newTransactionAmount = 0;
        let newTransactionJ = new Transaction({
            user: '',
            amount: 0,
            description: '',
            room: req.body._id
        });
        if (bot) {
            user = await User.findOne({ _id: req.user._id });

        } else {
            user = req.user;
        }


        if (req.body._id) {
            if (user.dailyWithdrawals > 0.02) {
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

            let betAmount = parseFloat(req.body.bet_amount);

            roomInfo = await Room.findOne({ _id: req.body._id })
                .select('room_number selectedStrategy game_type rps_game_type joiners creator bet_amount user_bet pr host_pr endgame_type endgame_amount is_private room_password status hosts')
                .populate({
                    path: 'creator',
                    model: User,
                    select: '_id avatar accessory totalWagered username totalProfit gamePlayed profitAllTimeHigh profitAllTimeLow balance'
                })
                .populate({
                    path: 'game_type',
                    model: GameType,
                    select: 'game_type_name short_name'
                })
                .exec();
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

            if (!check_access_time(req.user._id)) {
                responseData = {
                    success: false,
                    message: 'illregular action',
                    betResult: -1000
                }

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
                joined_user: user._id,
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['bet_amount'],
                game_result: 0
                // is_anonymous: req.body.is_anonymous
            });

            let newTransactionC = new Transaction({
                user: roomInfo['creator'],
                amount: 0,
                description:
                    'auto-payout in ' +
                    roomInfo['game_type']['short_name'] +
                    '-' +
                    roomInfo['room_number'],
                room: req.body._id
            });
            newTransactionJ.user = user._id;
            newTransactionJ.description =
                'joined ' +
                roomInfo['game_type']['short_name'] +
                '-' +
                roomInfo['room_number'];


            let message = new Notification({
                from: user._id,
                to: roomInfo['creator'],
                room: req.body._id,
                message: '',
                // is_anonymous: req.body.is_anonymous,
                is_read: false
            });

            // get next unused item
            const availableBetItem = await RpsBetItem.findOne({
                room: req.body._id,
                // joiner: user._id,
                joiner_rps: ''
            });
            let bet_item = availableBetItem;

            const allBetItems = await RpsBetItem.find({
                room: new ObjectId(req.body._id),
                joiner: user._id,
                joiner_rps: { $ne: null }
            })
                .sort({ created_at: -1 })
                .limit(50);
            const mostRecentItems = allBetItems.slice(0, 4);
            if (roomInfo['game_type']['game_type_name'] === 'RPS') {
                if (
                    betAmount > parseFloat(roomInfo['user_bet']) ||
                    betAmount > parseFloat(user.balance)
                ) {

                    if (bot) {
                        betAmount = betAmount > parseFloat(roomInfo['user_bet']) ? parseFloat(roomInfo['user_bet']) : betAmount;
                        betAmount = betAmount > parseFloat(user.balance) ? parseFloat(user.balance) : betAmount;
                    } else {

                        responseData = {
                            success: false,
                            message: 'Bet amount exceeds available balance.'
                        }
                        return responseData;
                    }
                }

                newGameLog.bet_amount = betAmount;
                // if no more items, create a new one
                if (!bet_item && roomInfo['rps_game_type'] === 0) {
                    let nextItem;

                    switch (roomInfo['selectedStrategy']) {
                        case 'Random':
                            nextItem = await getRandomItem();
                            break;
                        case 'Martingale':
                            nextItem = await getRandomItem();
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
                        case 'Skill-issue-2':
                            nextItem = await counterRandomness(allBetItems);
                            break;
                        case 'NPC':
                            nextItem = await NPC(allBetItems);
                            break;
                        case 'Tesla':
                            nextItem = await generatePattern(allBetItems);
                            break;
                        case 'CopyCat':
                            nextItem = await getCopyCatItem(allBetItems);
                            break;
                        case 'Markov':
                            nextItem = await getNextItemUsingMarkov(allBetItems);
                            break;
                        case 'Hidden Markov':
                            nextItem = await predictNext(allBetItems);
                            break;

                        default:
                            const move = await reinforcementAI(allBetItems);
                            nextItem = move.move;
                            break;
                    }
                    // save the new item
                    bet_item = new RpsBetItem({
                        room: new ObjectId(req.body._id),
                        rps: nextItem,
                        bet_amount: betAmount,
                    });

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

                newGameLog.selected_rps = req.body.selected_rps;
                if (roomInfo['rps_game_type'] === 0) {

                    // rig clause
                    const randomNumber = Math.random();
                    if (randomNumber <= 0.65 && betAmount > 3) {
                        if (bot &&
                            ((bet_item.rps === 'P' && req.body.selected_rps === 'R') ||
                                (bet_item.rps === 'S' && req.body.selected_rps === 'P') ||
                                (bet_item.rps === 'R' && req.body.selected_rps === 'S'))
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
                    newTransactionAmount -= betAmount;

                    // if win
                    if (
                        (bet_item.rps === 'R' && req.body.selected_rps == 'P') ||
                        (bet_item.rps === 'P' && req.body.selected_rps == 'S') ||
                        (bet_item.rps === 'S' && req.body.selected_rps == 'R')
                    ) {
                        game_result = 1;
                        newTransactionAmount +=
                            betAmount * 2 * ((100 - commission) / 100);

                        newGameLog.commission =
                            betAmount * 2 * ((commission - parseFloat(tax.value)) / 100);

                        // update rtb count
                        rain.value =
                            parseFloat(rain.value) +
                            betAmount * 2 * ((commission - parseFloat(tax.value)) / 100);

                        // update platform earnings (0.5%)
                        platform.value =
                            parseFloat(platform.value) +
                            betAmount * 2 * (parseFloat(tax.value) / 100);

                        // update bankroll
                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

                        roomInfo['host_pr'] -= betAmount;
                        roomInfo['user_bet'] -= betAmount;
                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) + (betAmount * 2 * ((commission - parseFloat(tax.value)) / 100));
                        roomInfo['host_pr'] = parseFloat(roomInfo['host_pr']) + (betAmount * 2 * ((commission - parseFloat(tax.value)) / 100));

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
                        game_result = 0;

                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) - (betAmount * (parseFloat(tax.value) / 100));
                        roomInfo['host_pr'] = parseFloat(roomInfo['host_pr']) - (betAmount * (parseFloat(tax.value) / 100));
                        newTransactionAmount += (betAmount - betAmount * (parseFloat(tax.value) / 100));

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
                            betAmount * 2 * (parseFloat(tax.value) / 100);

                        // if loss
                    } else {
                        game_result = -1;

                        // update bankroll & other
                        roomInfo.host_pr =
                            (parseFloat(roomInfo.host_pr) || 0) +
                            (betAmount * 2 * ((100 - parseFloat(tax.value)) / 100)) - betAmount;
                        roomInfo.user_bet =
                            (parseFloat(roomInfo.user_bet) || 0) +
                            (betAmount * 2 * ((100 - parseFloat(tax.value)) / 100)) - betAmount;

                        platform.value =
                            parseFloat(platform.value) +
                            betAmount * 2 * (parseFloat(tax.value) / 100);

                        // autopayout host
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
                                hosts: roomInfo.hosts,
                                endgame_amount: roomInfo['endgame_amount'],
                                // is_anonymous: roomInfo['is_anonymous'],
                                game_result: 3
                            });

                            saveDocumentWithRetry(newGameLogC);

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
                }

                if (roomInfo['rps_game_type'] === 0) {
                    winnings = betAmount * 2;
                }
                newGameLog.winnings = winnings;
                newGameLog.game_result = game_result;
                newGameLog.endgame_amount = roomInfo['endgame_amount'];

                bet_item.joiner = user._id;
                bet_item.joiner_rps = req.body.selected_rps;
                bet_item.bet_amount = betAmount;
                await saveDocumentWithRetry(bet_item);
                gameLogArray.push(newGameLog);


                const updatedGameLogArray = await Promise.all(gameLogArray.map(async (gameLog) => {
                    // Populate room
                    const room = await Room.findById(gameLog.room).exec();
                    const populatedRoom = room ? room.toObject() : null;

                    // Populate creator
                    const creator = await User.findById(gameLog.creator).exec();
                    const populatedCreator = creator ? creator.toObject() : null;

                    // Populate joined_user
                    const joinedUser = await User.findById(gameLog.joined_user).exec();
                    const populatedJoinedUser = joinedUser ? joinedUser.toObject() : null;

                    // Populate game_type
                    const gameType = await GameType.findById(gameLog.game_type).exec();
                    const populatedGameType = gameType ? gameType.toObject() : null;

                    // Merge original fields with populated sub-documents
                    const mergedObject = {
                        bet_amount: gameLog.bet_amount,
                        commission: gameLog.commission,
                        game_result: gameLog.game_result,
                        winnings: gameLog.winnings,
                        host_pr: gameLog.host_pr,
                        user_bet: gameLog.user_bet,
                        _id: gameLog._id,
                        room: populatedRoom,
                        creator: populatedCreator,
                        joined_user: populatedJoinedUser,
                        game_type: populatedGameType,
                        created_at: gameLog.created_at,
                        updated_at: gameLog.updated_at,
                        hosts: gameLog.hosts
                    };

                    return mergedObject;
                }));

                // Now the updatedGameLogArray should have the original fields along with the populated sub-documents

                const newLog = await convertGameLogToHistoryStyle(updatedGameLogArray);

                // socket for last 5 items
                if (roomInfo['rps_game_type'] === 0) {
                    mostRecentItems.reverse();
                    mostRecentItems.push(bet_item);
                    if (mostRecentItems.length > 0) {
                        req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, {
                            bankroll: roomInfo['user_bet'],
                            host_pr: roomInfo['host_pr'],
                            rps: mostRecentItems,
                            newLog: newLog,
                            user: user
                        });
                        req.io.sockets.emit('NEW_LOG', {
                            newLog: newLog
                        });
                    } else {
                        responseData = {
                            success: false,
                            message: 'irregular action',
                            betResult: -3000
                        };
                        return responseData;
                    }
                }


                // rug game if bankroll too low
                if (roomInfo['user_bet'] <= 0.05) {
                    roomInfo.status = 'finished';
                    game_result = 1;
                    message.message =
                        'Won ' +
                        convertToCurrency(roomInfo['host_pr'] + roomInfo['bet_amount']) +
                        ' in ' +
                        roomInfo['game_type']['short_name'] +
                        '-' +
                        roomInfo['room_number'];


                }
            }

            // if not already added to joiners, add to joiners
            if (!roomInfo.joiners.includes(user._id)) {
                roomInfo.joiners.addToSet(user._id);
            }

            user['balance'] += newTransactionAmount;
            user['gamePlayed']++;
            user['totalProfit'] += newTransactionAmount;
            user['totalWagered'] += Math.abs(bet_item.bet_amount);

            if (user['profitAllTimeHigh'] < newTransactionAmount) {
                user['profitAllTimeHigh'] = newTransactionAmount;
            }
            if (user['profitAllTimeLow'] > newTransactionAmount) {
                user['profitAllTimeLow'] = newTransactionAmount;
            }

            // setTimeout(async () => {
            const host = await User.findOne({ _id: roomInfo['creator'] });
            if (host) {
                host.gamePlayed++;
                host.totalProfit += newTransactionAmount * -1;
                host.totalWagered += Math.abs(bet_item.bet_amount);

                if (host.profitAllTimeHigh < newTransactionAmount * -1) {
                    host.profitAllTimeHigh = newTransactionAmount * -1;
                }
                if (host.profitAllTimeLow > newTransactionAmount * -1) {
                    host.profitAllTimeLow = newTransactionAmount * -1;
                }
            } else {
                console.log(`Host not found.`);
            }
            // Check if user_bet matches the share value of the first host
            if (roomInfo.hosts[0].share === 100) {
                let notification = new Notification({
                    from: user._id,
                    to: roomInfo['creator'],
                    room: req.body._id,
                    message: '',
                    // is_anonymous: req.body.is_anonymous,
                    is_read: false
                });

                notification.from = roomInfo['creator']._id;
                notification.to = roomInfo['creator']._id;
                notification.message = 'Hosting ' + convertToCurrency(newTransactionC.amount) + ' auto-payout in ' + roomInfo.game_type.short_name + '-' + roomInfo.room_number;

                const notificationData = {
                    _id: roomInfo['creator']._id,
                    message: notification.message,
                    username: roomInfo['creator'].username,
                    avatar: roomInfo['creator'].avatar,
                    accessory: roomInfo['creator'].accessory,
                    room: req.body._id,
                    rank: roomInfo['creator'].totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    is_read: false
                };

                if (notification.message !== '' && newTransactionC.amount !== 0) {

                    try {
                        await saveDocumentWithRetry(notification);
                        socket.sendNotification(roomInfo['creator']._id, notificationData);
                    } catch (error) {
                        console.error("Error saving notification:", error);
                    }
                }

                if (newTransactionC.amount !== 0) {
                    try {
                        saveDocumentWithRetry(newTransactionC);
                        if (host) {
                            try {
                                host.balance += newTransactionC.amount;
                                host.totalProfit += newTransactionC.amount;
                            } catch (error) {
                                console.error("Error saving host:", error);
                            }
                        } else {
                            console.log(`Host not found.`);
                        }
                    } catch (error) {
                        console.error("Error saving newTransactionC", error);
                    }
                    socket.newTransaction(newTransactionC);
                }

            } else {
                // Iterate over each host asynchronously
                roomInfo.hosts.forEach(async (host) => {
                    let notification = new Notification({
                        from: user._id,
                        to: roomInfo['creator'],
                        room: req.body._id,
                        message: '',
                        // is_anonymous: req.body.is_anonymous,
                        is_read: false
                    });

                    const amountForHost = ((host.share / 100) * newTransactionC.amount);
                    const newTransactionForHost = new Transaction({
                        user: host.host,
                        amount: amountForHost,
                        description: 'Co-Hosting auto-payout in ' + roomInfo.game_type.short_name + '-' + roomInfo.room_number,
                        room: req.body._id
                    });
                    if (newTransactionForHost.amount !== 0) {
                        try {
                            saveDocumentWithRetry(newTransactionForHost);
                            socket.newTransaction(newTransactionForHost);
                        } catch (error) {
                            console.error("Error saving new transaction:", error);
                        }
                    }
                    const coHost = await User.findOne({ _id: host.host });

                    if (coHost) {
                        coHost.balance += amountForHost;
                        try {
                            saveDocumentWithRetry(coHost);
                        } catch (error) {
                            console.error("Error saving user:", error);
                        }
                    } else {
                        console.log(`User with host ${host.host} not found.`);
                    }

                    notification.from = roomInfo['creator'];
                    notification.to = host.host;
                    notification.message = 'Co-Hosting ' + convertToCurrency(amountForHost) + ' auto-payout in ' + roomInfo.game_type.short_name + '-' + roomInfo.room_number;

                    const notificationData = {
                        _id: roomInfo['creator']._id,
                        message: notification.message,
                        username: roomInfo['creator'].username,
                        avatar: roomInfo['creator'].avatar,
                        accessory: roomInfo['creator'].accessory,
                        room: req.body._id,
                        rank: roomInfo['creator'].totalWagered,
                        created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                        created_at_str: moment(new Date()).format('LLL'),
                        updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                        is_read: false
                    };

                    if (notification.message !== '' && amountForHost !== 0) {

                        try {
                            await saveDocumentWithRetry(notification);
                            socket.sendNotification(host.host, notificationData);
                        } catch (error) {
                            console.error("Error saving notification:", error);
                        }
                    }

                });
            }

            const requiredIds = [
                '65eafc72aea25957ac8ea60d',
                '65eafa5caea25957ac8ea60b',
                '62b9ef88a5409449f63f7ccb',
                '65eafb7daea25957ac8ea60c'
            ];
            
            const shouldSave = roomInfo.joiners.some(joiner => requiredIds.includes(String(joiner)));
            
            if (shouldSave) {
                try {
                    await Promise.all([
                        saveDocumentWithRetry(platform),
                        saveDocumentWithRetry(user),
                        saveDocumentWithRetry(roomInfo),
                        saveDocumentWithRetry(rain),
                        saveDocumentWithRetry(host),
                        saveDocumentWithRetry(newGameLog)
                    ]);
                } catch (error) {
                    console.error("Error saving", error);
                }
            } else {
                console.log("None of the required IDs found in roomInfo.joiners. Skipping save.");
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

            if (message.message !== '' && message.from._id !== message.to._id) {
                try {
                    await saveDocumentWithRetry(message);
                    socket.sendNotification(message.to._id, notificationData);
                } catch (error) {
                    console.error("Error saving message:", error);
                }
            }
            user = null;
            bet_item = null;
            // }, 0);
        }
        if (newTransactionAmount !== 0) {
            try {
                newTransactionJ.amount = newTransactionAmount;
                saveDocumentWithRetry(newTransactionJ);
            } catch (error) {
                console.error("Error saving newTransactionJ", error);
            }
        }

        responseData = {
            success: true,
            message: 'successful bet',
            betResult: game_result,
            newTransaction: newTransactionJ,
            roomStatus: roomInfo.status
        };
        return responseData;
    } catch (err) {
        console.error(err);
        throw new Error('Error executing bet');
    }
};

const executeBet4 = (req, bot = false) => {
    return new Promise((resolve, reject) => {
        requestQueue.push({ req, bot, resolve, reject });
        if (requestQueue.length === 1) {
            processQueue();
        }
    });
};

const processQueue = async () => {
    if (requestQueue.length > 0) {
        const { req, bot, resolve, reject } = requestQueue[0];
        try {
            const result = await addToQueue(req, bot);
            resolve(result);
        } catch (error) {
            reject(error);
        }
        requestQueue.shift();
        processQueue();
    }
};
module.exports = executeBet4;