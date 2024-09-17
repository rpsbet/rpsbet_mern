// betExecutor.js
const ObjectId = require('mongoose').Types.ObjectId;
const SystemSetting = require('../../model/SystemSetting');
const User = require('../../model/User');
const GameType = require('../../model/GameType');
const Room = require('../../model/Room');
const Notification = require('../../model/Notification');
const RpsBetItem = require('../../model/RpsBetItem');
const QsBetItem = require('../../model/QsBetItem');
const Transaction = require('../../model/Transaction');
const GameLog = require('../../model/GameLog');
const convertToCurrency = require('./conversion');
const socket = require('../../socketController')
const moment = require('moment');
const { convertGameLogToHistoryStyle } = require('./convertGameLogToHistoryStyle');
const check_access_time = require('../../helper/util/checkAccessTime');

const { predictNext, reinforcementAI, innovate, patternBasedAI, counterSwitchAI, counterRandomness, NPC, generatePattern } = require('./predictNext');
const { NPC_qs, patternBasedAI_qs, innovate_qs, getRandomItem_qs, counterSwitchAI_qs, generatePattern_qs, counterRandomness_qs, getCopyCatItem_qs, predictNextQs, reinforcementAI_qs } = require('./predictNextQs');
const saveDocumentWithRetry = require('./retrySave');
const requestQueue = [];
let user_access_log = {};


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
        let bet_item;
        let roomInfo;
        let newTransactionAmount = 0;
        let newTransactionJ = new Transaction({
            user: '',
            amount: 0,
            description: '',
            room: req.body._id
        });
        if (bot) {
            return responseData;

        } else {
            user = req.user;
        }

        if (req.body._id) {
            if (user.dailyWithdrawals > 5000) {
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
                .select('room_number battles selectedStrategy qs_game_type game_type rps_game_type joiners creator bet_amount user_bet pr host_pr endgame_type endgame_amount is_private room_password status hosts')
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
            const accessoryJ = user.accessory;
            let item;
            let commission;

            if (accessory) {
                const item = await Item.findOne({ image: accessory }).select('CP');
                const itemJ = await Item.findOne({ image: accessoryJ }).select('DP');

                // Default CP or DP to 0 if they are null or undefined
                const cp = item ? item.CP || 0 : 0;
                const dp = itemJ ? itemJ.DP || 0 : 0;

                // Calculate commission
                commission = cp - dp + parseFloat(tax.value);
            } else {
                commission = parseFloat(tax.value); // If no accessory, use tax.value directly
            }



            newGameLog = new GameLog({
                room: roomInfo,
                creator: roomInfo['creator'],
                joined_user: user,
                game_type: roomInfo['game_type'],
                bet_amount: req.body.bet_amount,
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
                    betAmount > parseFloat(roomInfo['user_bet']) ||
                    betAmount > parseFloat(user.balance)
                ) {

                    if (bot) {
                        betAmount = betAmount > parseFloat(roomInfo['user_bet']) ? parseFloat(roomInfo['user_bet']) : parseFloat(user.balance);
                    } else {

                        responseData = {
                            success: false,
                            message: 'Bet amount exceeds available balance.'
                        }
                        return responseData;
                    }
                }

                newGameLog.bet_amount = betAmount;

                const availableBetItem = await RpsBetItem.findOne({
                    room: req.body._id,
                    // joiner: user._id,
                    joiner_rps: ''
                });
                bet_item = availableBetItem;

                const reversedBetItems = await RpsBetItem.find({
                    room: new ObjectId(req.body._id),
                    joiner: user._id,
                    joiner_rps: { $ne: null }
                })
                    .sort({ created_at: -1 })
                    .limit(50);

                // Create a copy of the array and reverse the copy
                const allBetItems = [...reversedBetItems].reverse();
                const mostRecentItems = reversedBetItems.slice(0, 4);
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
                        case 'Skill-issue-old':
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
                        case 'Innovate':

                            const nextState = await innovate(allBetItems)
                            nextItem = nextState.counterMove;
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

                    // try {
                    //     await saveDocumentWithRetry(bet_item);
                    // } catch (error) {
                    //     console.error("Error saving bet_item:", error);
                    // }

                    // Define helper functions
                    function getRandomItem() {
                        const rpsOptions = ['R', 'P', 'S'];
                        return rpsOptions[Math.floor(Math.random() * 3)];
                    }

                    function getCopyCatItem(allBetItems) {
                        const copyCatBetItem = allBetItems[allBetItems.length - 1];
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
                            betAmount * 2 * (commission / 100);

                        // update rtb count
                        rain.value =
                            parseFloat(rain.value) +
                            betAmount * 2 * (commission / 100);

                        // update platform earnings (0.5%)
                        platform.value =
                            parseFloat(platform.value) +
                            betAmount * 2 * (parseFloat(tax.value) / 100);

                        // update bankroll
                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);

                        roomInfo['host_pr'] -= betAmount;
                        roomInfo['user_bet'] -= betAmount;
                        roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']) + (betAmount * 2 * (commission / 100));
                        roomInfo['host_pr'] = parseFloat(roomInfo['host_pr']) + (betAmount * 2 * (commission / 100));

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
                        roomInfo['host_pr'] =
                            (parseFloat(roomInfo['host_pr']) || 0) +
                            (betAmount * 2 * ((100 - parseFloat(tax.value)) / 100)) - betAmount;
                        roomInfo['user_bet'] =
                            (parseFloat(roomInfo['user_bet']) || 0) +
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

                            saveDocumentWithRetry(newGameLogC),

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
                    winnings = betAmount * 2;
                }

                // update bet item with joiner's data
                newGameLog.winnings = winnings;
                newGameLog.game_result = game_result;
                newGameLog.endgame_amount = roomInfo['endgame_amount'];

                bet_item.joiner = user._id;
                bet_item.joiner_rps = req.body.selected_rps;
                bet_item.bet_amount = betAmount;

                await saveDocumentWithRetry(bet_item);
                gameLogArray.push(newGameLog);


                const roomIds = gameLogArray.map(gameLog => gameLog.room);
                const creatorIds = gameLogArray.map(gameLog => gameLog.creator);
                const joinedUserIds = gameLogArray.map(gameLog => gameLog.joined_user);
                const gameTypeIds = gameLogArray.map(gameLog => gameLog.game_type);

                // Fetch all rooms, creators, joined users, and game types in parallel
                const [rooms, creators, joinedUsers, gameTypes] = await Promise.all([
                    Room.find({ _id: { $in: roomIds } }).lean().exec(),
                    User.find({ _id: { $in: creatorIds } }).lean().exec(),
                    User.find({ _id: { $in: joinedUserIds } }).lean().exec(),
                    GameType.find({ _id: { $in: gameTypeIds } }).lean().exec()
                ]);

                // Create maps for quick lookup
                const roomMap = new Map(rooms.map(room => [room._id.toString(), room]));
                const creatorMap = new Map(creators.map(creator => [creator._id.toString(), creator]));
                const joinedUserMap = new Map(joinedUsers.map(user => [user._id.toString(), user]));
                const gameTypeMap = new Map(gameTypes.map(type => [type._id.toString(), type]));

                // Map game logs to their updated form
                const updatedGameLogArray = gameLogArray.map(gameLog => ({
                    bet_amount: gameLog.bet_amount,
                    commission: gameLog.commission,
                    game_result: gameLog.game_result,
                    winnings: gameLog.winnings,
                    host_pr: gameLog.host_pr,
                    user_bet: gameLog.user_bet,
                    _id: gameLog._id,
                    room: roomMap.get(gameLog.room.toString()),
                    creator: creatorMap.get(gameLog.creator.toString()),
                    joined_user: joinedUserMap.get(gameLog.joined_user.toString()),
                    game_type: gameTypeMap.get(gameLog.game_type.toString()),
                    created_at: gameLog.created_at,
                    updated_at: gameLog.updated_at,
                    hosts: gameLog.hosts
                }));

                // Assuming convertGameLogToHistoryStyle can be optimized similarly
                const newLog = await convertGameLogToHistoryStyle(updatedGameLogArray);

                // socket for last 5 items
                if (roomInfo['rps_game_type'] === 0) {
                    mostRecentItems.reverse();
                    mostRecentItems.push(bet_item);
                    if (mostRecentItems.length > 0) {
                        if (req.io.sockets) {
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
                        }
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
                if (roomInfo['user_bet'] <= 0.1) {
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
            else if (roomInfo['game_type']['game_type_name'] === 'Quick Shoot') {
                if (
                    parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1) +
                    parseFloat(req.body.bet_amount) -
                    (roomInfo['qs_game_type'] - 1) * parseFloat(roomInfo['user_bet']) >
                    parseFloat(roomInfo['user_bet']) ||
                    parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)
                ) {
                    responseData = {
                        success: false,
                        message: 'Bet amount exceeds available balance.',
                        betResult: -1000
                    }

                    return responseData;
                }

                newGameLog.bet_amount = parseFloat(req.body.bet_amount);

                const availableBetItem = await QsBetItem.findOne({
                    _id: req.body._id,
                    joiner_qs: ''
                });
                bet_item = availableBetItem;

                const reversedBetItems = await QsBetItem.find({
                    room: new ObjectId(req.body._id),
                    joiner: user._id,
                    joiner_qs: { $ne: null }
                })
                    .sort({ created_at: -1 })
                    .limit(50);

                const allBetItems = [...reversedBetItems].reverse();
                const mostRecentItems = reversedBetItems.slice(0, 4);

                if (!bet_item) {

                    let nextItem;

                    switch (roomInfo['selectedStrategy']) {
                        case 'Random':
                            nextItem = await getRandomItem_qs(roomInfo['qs_game_type']);
                            break;
                        case 'Martingale':
                            nextItem = await getRandomItem_qs(roomInfo['qs_game_type']);
                            break;
                        case 'Hertz':
                            nextItem = await patternBasedAI_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Feedback':
                            nextItem = await counterSwitchAI_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Skill-issue-old':
                            nextItem = await counterRandomness_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Skill-issue':
                            nextItem = await counterRandomness_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'NPC':
                            nextItem = await NPC_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Tesla':
                            nextItem = await generatePattern_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'CopyCat':
                            nextItem = await getCopyCatItem_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Markov':
                            nextItem = await getNextItemUsingMarkov_qs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Hidden Markov':
                            nextItem = await predictNextQs(allBetItems, roomInfo['qs_game_type']);
                            break;
                        case 'Innovate':
                            let nextState;
                            nextState = await innovate_qs(allBetItems, roomInfo['qs_game_type']);
                            nextItem = nextState.move;
                            break;

                        default:
                            const move = await reinforcementAI_qs(allBetItems, roomInfo['qs_game_type']);
                            nextItem = move.move;
                            break;
                    }
                    bet_item = new QsBetItem({
                        room: new ObjectId(req.body._id),
                        qs: nextItem,
                        bet_amount: betAmount,
                    });

                    async function getNextItemUsingMarkov_qs(allBetItems, gameType) {
                        if (allBetItems.length <= 3) {
                            return getRandomItem_qs(roomInfo['qs_game_type']);
                        }

                        const transformedItems = allBetItems.map(item => ({ qs: item.joiner_qs }));
                        const nextItem = await predictNextQs(transformedItems, gameType);
                        return nextItem;
                    }
                }

                newGameLog.selected_qs_position = req.body.selected_qs_position;

                // deduct the joiner's bet
                newTransactionAmount -= betAmount;
                roomInfo['user_bet'] = parseFloat(roomInfo['user_bet']);
                if (Number(bet_item.qs) === req.body.selected_qs_position) {
                    game_result = -1;

                    roomInfo['user_bet'] =
                        parseFloat(roomInfo['user_bet']) + parseFloat(req.body.bet_amount);
                    roomInfo['host_pr'] =
                        parseFloat(roomInfo['host_pr']) + parseFloat(req.body.bet_amount);
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
                            endgame_amount: roomInfo['endgame_amount'],
                            hosts: roomInfo.hosts,
                            is_anonymous: roomInfo['is_anonymous'],
                            game_result: 3
                        });
                        saveDocumentWithRetry(newGameLogC);
                        roomInfo['user_bet'] = parseFloat(
                            roomInfo['endgame_amount']
                        ); /* (roomInfo['user_bet'] -  roomInfo['bet_amount']) */
                    }

                    bet_item.joiner = req.user;
                    bet_item.joiner_qs = req.body.selected_qs_position;

                    message.message =
                        'Lost ' +
                        convertToCurrency(req.body.bet_amount) +
                        ' in ' +
                        roomInfo['game_type']['short_name'] +
                        '-' +
                        roomInfo['room_number'];
                } else {    
                    game_result = 1;
                    newTransactionAmount +=
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        ((100 - commission) / 100);
                    roomInfo['host_pr'] -=
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        ((100 - commission) / 100) - betAmount;

                    roomInfo['user_bet'] -=
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        ((100 - commission) / 100) - betAmount;
                    newGameLog.commission =
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        (commission / 100);
                    // update rain
                    rain.value =
                        parseFloat(rain.value) +
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        (commission / 100);
                    // update platform stat (0.5%)
                    platform.value =
                        parseFloat(platform.value) +
                        (betAmount +
                            betAmount /
                            (roomInfo['qs_game_type'] - 1)) *
                        (tax.value / 100);
                    if (req.io.sockets) {
                        req.io.sockets.emit('UPDATE_RAIN', {
                            rain: rain.value
                        });
                    }
                    
                    message.message =
                        'Won ' +
                        convertToCurrency(
                            betAmount /
                            parseFloat(roomInfo['qs_game_type'] - 1) +
                            betAmount
                        ) +
                        ' in ' +
                        roomInfo['game_type']['short_name'] +
                        '-' +
                        roomInfo['room_number'];
                }

                bet_item.joiner = req.user;
                bet_item.joiner_qs = req.body.selected_qs_position;
                bet_item.bet_amount = betAmount;
                await saveDocumentWithRetry(bet_item);

                newGameLog.qs_game_type = parseFloat(roomInfo.qs_game_type);
                newGameLog.winnings = newTransactionAmount;
                newGameLog.game_result = game_result;
                newGameLog.endgame_amount = roomInfo['endgame_amount'];
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
                        qs_game_type: gameLog.qs_game_type,
                        creator: populatedCreator,
                        joined_user: populatedJoinedUser,
                        game_type: populatedGameType,
                        created_at: gameLog.created_at,
                        updated_at: gameLog.updated_at,
                        hosts: gameLog.hosts
                    };

                    return mergedObject;
                }));

                const newLog = await convertGameLogToHistoryStyle(updatedGameLogArray);
                // socket for last 5 items
                mostRecentItems.reverse();
                mostRecentItems.push(bet_item);
                if (mostRecentItems.length > 0) {
                    if (req.io.sockets) {
                        req.io.sockets.emit(`UPDATED_BANKROLL_QS_${roomInfo._id}`, {
                            bankroll: roomInfo['user_bet'],
                            host_pr: roomInfo['host_pr'],
                            qs: mostRecentItems,
                            newLog: newLog,
                            user: user
                        });
                        req.io.sockets.emit('NEW_LOG', {
                            newLog: newLog
                        });
                    }
                } else {
                    responseData = {
                        success: false,
                        message: 'irregular action',
                        betResult: -3000
                    };
                    return responseData;
                }

                // rug game if bankroll too low
                if (roomInfo['user_bet'] <= 0.1) {
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

            if (!roomInfo.joiners.includes(user._id)) {
                roomInfo.joiners.push(user._id);
            }
            roomInfo.battles = roomInfo.battles + 1;
            roomInfo.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
            if (!shouldSave) {
                try {
                    Promise.all([
                        saveDocumentWithRetry(platform),
                        await saveDocumentWithRetry(user),
                        await saveDocumentWithRetry(roomInfo),
                        saveDocumentWithRetry(rain),
                        saveDocumentWithRetry(host),
                        await saveDocumentWithRetry(newGameLog)
                    ]);
                } catch (error) {
                    console.error("Error saving", error);
                }
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

const executeBet3 = (req, bot = false) => {

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
module.exports = executeBet3;