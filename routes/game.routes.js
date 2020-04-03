var ObjectId = require('mongoose').Types.ObjectId;
const express = require('express');

const router = express.Router();
const Room = require('../model/Room');
const User = require('../model/User');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
const RoomBoxPrize = require('../model/RoomBoxPrize');
const Question = require('../model/Question');
const Answer = require('../model/Answer');
const BrainGameType = require('../model/BrainGameType');
const Message = require('../model/Message');
const moment = require('moment');
const auth = require('../middleware/auth');

// /api/game_types call
router.get('/game_types', async (req, res) => {
    try {
        const gameTypes = await GameType.find({});
        res.json({
            success: true,
            query: req.query,
            gameTypeList: gameTypes
        });
    } catch (err) {
        res.json({
            success: false,
            err: message
        });
    }
});

// /api/room/:id call
router.get('/room/:id', async (req, res) => {
    try {
        const room = await Room.findOne({_id: req.params.id})
                        .populate({path: 'game_type', model: GameType})
                        .populate({path: 'brain_game_type', model: BrainGameType});
        const gameLogList = await GameLog.find({room: room});
        const boxPrizeList = await RoomBoxPrize.find({room: room}).sort({_id : 'asc'});

        res.json({
            success: true,
            query: req.query,
            roomInfo: {
                _id: room['_id'],
                game_type: room['game_type']['game_type_name'],
                bet_amount: room['bet_amount'],
                spleesh_bet_unit: room['spleesh_bet_unit'],
                brain_game_type: room['brain_game_type'],
                brain_game_score: room['brain_game_score'],
                game_log_list: gameLogList,
                box_list: boxPrizeList
            }
        });
    } catch (err) {
        res.json({
            success: false,
            err: err
        });
    }
});

router.get('/question/:brain_game_type', async (req, res) => {
    try {
        const question = await Question.aggregate([
            {
                $match: {brain_game_type: new ObjectId(req.params.brain_game_type)}
            }, {
                $sample: {size: 1}
            }
        ]);
        // const question = await Question.findOne({_id: new ObjectId('5e6407de9457394254bd8a01')});

        const correctAnswer = await Answer.aggregate([
            {
                $match: {question: new ObjectId(question[0]._id), is_correct_answer: true}
            }, {
                $sample: {size: 1}
            }
        ]);

        const wrongAnswers = await Answer.aggregate([
            {
                $match: {question: new ObjectId(question[0]._id), is_correct_answer: false}
            }, {
                $sample: {size: 3}
            }
        ]);

        let answers = [{_id: correctAnswer[0]._id, answer: correctAnswer[0].answer}];

        wrongAnswers.forEach(answer => {
            answers.push({
                _id: answer._id,
                answer: answer.answer
            });
        });

        answers.sort(() => Math.random() - 0.5);

        res.json({
            success: true,
            question: {_id: question[0]._id, question: question[0].question},
            // question: {_id: question._id, question: question.question},
            answers
        });
    } catch (err) {
        res.json({
            success: false,
            err: err
        });
    }
});

router.post('/answer', async (req, res) => {
    try {
        const count = await Answer.countDocuments({
            _id: req.body.answer_id,
            question: new ObjectId(req.body.question_id),
            is_correct_answer: true
        });
        res.json({
            success: true,
            answer_result: count > 0 ? 1 : -1
        });
    } catch (err) {
        res.json({
            success: false,
            err: err
        });
    }
});

getRoomList = async (pagination, page) => {
    const rooms = await Room.find({})
        .populate({path: 'creator', model: User})
        .populate({path: 'game_type', model: GameType})
        .populate({path: 'brain_game_type', model: BrainGameType})
        .sort({created_at: 'desc'})
        .skip(pagination * page - pagination)
        .limit(pagination);
    const count = await Room.countDocuments({});
    let result = [];
    for (const room of rooms) {
        let temp = {
            _id : room['_id'],
            creator : room['is_anonymous'] === true ? 'Anonymous' : (room['creator'] ? room['creator']['username'] : ''),
            game_type : room['game_type'],
            bet_amount : room['bet_amount'],
            pr : room['pr'], 
            winnings : '',
            spleesh_bet_unit: room['spleesh_bet_unit'],
            is_anonymous : room['is_anonymous'],
            is_private : room['is_private'],
            box_price: room['box_price'], 
            brain_game_type: room['brain_game_type'],
            brain_game_score: room['brain_game_score'],
            status: room['status'],
            index: room['room_number'],
            created_at : moment(room['created_at']).format('YYYY-MM-DD HH:mm'),
        };

        if (temp.game_type.game_type_id === 1) {
            temp.winnings = "£" + (room['bet_amount'] * 2) + " * 0.95";
        } else if (temp.game_type.game_type_id === 2) {
            temp.bet_amount = '??';
            temp.winnings = "(£" + room['pr'] + " + £??) * 0.9";
        } else if (temp.game_type.game_type_id === 3) {
            temp.winnings = "(£" + room['pr'] + " + £" + room['bet_amount'] + ") * 0.9";
        } else if (temp.game_type.game_type_id === 4) {
            temp.winnings = "£" + room['pr'] + " * 0.95";
            const box_list = await RoomBoxPrize.find({room: room, status: 'init'});

            if (box_list.length > 0) {
                temp.bet_amount = box_list[0].box_price;
                temp.pr = box_list[0].box_prize;

                for (const box of box_list) {
                    if (temp.bet_amount > box.box_price) {
                        temp.bet_amount = box.box_price;
                    }
    
                    if (temp.pr < box.box_prize) {
                        temp.pr = box.box_prize;
                    }
                }
            } else {
                temp.status = 'finished';
            }
        }

        result.push(temp);
    }

    return {
        rooms: result,
        count: count
    }
}

// /api/rooms call
router.get('/rooms', async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;

    try {
        const rooms = await getRoomList(pagination, page);
        res.json({
            success: true,
            query: req.query,
            total: rooms.count,
            roomList: rooms.rooms,
            pages: Math.ceil(rooms.count / pagination)
        });
    } catch (err) {
        res.json({
            success: false,
            err: err
        });
    }
});

router.post('/rooms', auth, async (req, res) => {
    try {
        gameType = await GameType.findOne({game_type_id: parseInt(req.body.game_type)});

        pr = 0;
        if (req.body.game_type === 1) {
            pr = req.body.bet_amount * 2;
        } else if (req.body.game_type == 4) {
            pr = req.body.pr;
        }

        const roomCount = await Room.countDocuments({});
        
        newRoom = new Room({ ...req.body, creator: req.user, game_type: gameType, pr: pr, room_number: roomCount + 1, status: 'open' });
        await newRoom.save();

        if (gameType.game_type_name === "Mystery Box") {
            req.body.box_list.forEach(box => {
                newBox = new RoomBoxPrize({
                    room: newRoom,
                    box_prize: box.box_prize,
                    box_price: box.box_price,
                    status: 'init'
                });
                newBox.save();
            });
        }

        if (req.body.is_anonymous === true) {
            req.user['balance'] -= 10;
        }

        req.user['balance'] -= req.body.bet_amount * 100;
        await req.user.save();

        const rooms = await getRoomList(10, 1);
        req.io.sockets.emit('UPDATED_ROOM_LIST', {
            total: rooms.count,
            roomList: rooms.rooms,
            pages: Math.ceil(rooms.count / 10)
        });

        res.json({
            success: true,
            message: 'room create'
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

getMyRooms = async (user_id) => {
    const rooms = await Room.find({creator: new ObjectId(user_id), status: 'open'})
        .populate({path: 'game_type', model: GameType})
        .populate({path: 'brain_game_type', model: BrainGameType})
        .sort({created_at: 'desc'});
    let result = [];
    for (const room of rooms) {
        let temp = {
            _id : room['_id'],
            game_type : room['game_type'],
            bet_amount : room['bet_amount'],
            pr : room['pr'], 
            winnings : '',
            index: room['room_number'],
            end_game_amount: room['end_game_amount'],
        };

        if (temp.game_type.game_type_id === 1) {
            temp.winnings = "£" + (room['bet_amount'] * 2) + " * 0.95";
        } else if (temp.game_type.game_type_id === 2) {
            temp.bet_amount = '??';
            temp.winnings = "(£" + room['pr'] + " + £??) * 0.9";
        } else if (temp.game_type.game_type_id === 3) {
            temp.winnings = "(£" + room['pr'] + " + £" + room['bet_amount'] + ") * 0.9";
        } else if (temp.game_type.game_type_id === 4) {
            temp.winnings = "£" + room['pr'] + " * 0.95";
            const box_list = await RoomBoxPrize.find({room: room, status: 'init'});

            if (box_list.length > 0) {
                temp.bet_amount = box_list[0].box_price;
                temp.pr = box_list[0].box_prize;

                for (const box of box_list) {
                    if (temp.bet_amount > box.box_price) {
                        temp.bet_amount = box.box_price;
                    }
    
                    if (temp.pr < box.box_prize) {
                        temp.pr = box.box_prize;
                    }
                }
            } else {
                temp.status = 'finished';
            }
        }

        result.push(temp);
    }

    return result;
}

router.get('/my_games', auth, async (req, res) => {
    try {
        // Question.update(
        //     {"brain_game_type": new ObjectId('5e8496ddd1e76819fcb875fb')}, 
        //     {"$set":{"brain_game_type": new ObjectId('5e86207c7e53873644fba8da')}}, 
        //     {"multi": true}, 
        //     (err, writeResult) => {
        //         console.log(err, writeResult);
        //     });

        const rooms = await getMyRooms(req.user._id);
        res.json({
            success: true,
            myGames: rooms,
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.post('/end_game', auth, async (req, res) => {
    try {
        const room = await Room.findOne({_id: req.body.room_id});
        room.status = "finished";
        await room.save();
        const rooms = await getMyRooms(req.user._id);
        res.json({
            success: true,
            myGames: rooms,
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.get('/my_history', auth, async (req, res) => {
    try {
        const messages = await Message.aggregate([
            {$lookup:
                {
                   from: "rps_users",
                   localField: "from",
                   foreignField: "_id",
                   as: 'user'
                }
            },
            {$match: {
                to: new ObjectId(req.user._id)
            }},
            {$group: {
                _id: "$from",
                message: {$last:"$message"},
                from: {$last: '$from'},
                to: {$last: '$to'},
                created_at: {$last: '$created_at'},
            }},
            {$project: {
                _id: "$_id",
                message: "$message",
                from: "$from",
                to: "$to",
                created_at: "$created_at"
            }},
            {$sort: {
                created_at: -1
            }}
        ]);

        for (let message of messages) {
            const user = await User.findOne({_id: message.from});
            message.from = {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
            };
            message.created_at = moment(message.created_at).format('LLL')
        }

        res.json({
            success: true,
            myHistory: messages,
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.post('/get_chat_room_info', auth, async (req, res) => {
    try {
        const user = await User.findOne({_id: new ObjectId(req.body.user_id)});
        const chatLogs = await Message.find(
            {$or:[
                {from: new ObjectId(req.body.user_id), to: req.user._id},
                {from: req.user._id, to: new ObjectId(req.body.user_id)},
            ]}
        ).sort({created_at : 'asc'});

        let messages = [];
        for (const chatLog of chatLogs) {
            const message = {
                from: chatLog.from,
                to: chatLog.to,
                message: chatLog.message,
                created_at: moment(chatLog.created_at).format('LLL')
            }
            messages.push(message);
        }

        res.json({
            success: true,
            chatRoomInfo: {
                user_id: user._id,
                avatar: user.avatar,
                username: user.username,
                chatLogs: messages
            },
        });
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});

router.post('/bet', auth, async (req, res) => {
    try {
        if (req.body._id) {
            roomInfo = await Room.findOne({_id: req.body._id})
                        .populate({path: 'creator', model: User})
                        .populate({path: 'game_type', model: GameType});

            newGameLog = new GameLog({
                room: roomInfo,
                creator: roomInfo['creator'],
                joined_user: req.user,
                game_type: roomInfo['game_type'],
                bet_amount: roomInfo['bet_amount'],
                is_anonymous: req.body.is_anonymous
            });

            if (req.body.is_anonymous == true) {
                req.user['balance'] -= 10;
            }

            let message = new Message({
                from: req.user,
                to: roomInfo['creator'],
                message: '',
                is_anonymous: req.body.is_anonymous,
                is_read: false
            });

            if (roomInfo['game_type']['game_type_name'] === 'Classic RPS') {
                req.user['balance'] -= roomInfo['bet_amount'] * 100;

                newGameLog.selected_rps = req.body.selected_rps;

                if (roomInfo.selected_rps % 3 === req.body.selected_rps - 1) {
                    newGameLog.game_result = 1;
                    req.user['balance'] += roomInfo['bet_amount'] * 200 * 0.95
                    message.message = "I won £" + (roomInfo['bet_amount'] * 2) + " * 0.95 in ClassicRPS" + roomInfo['room_number'];
                } else if (roomInfo.selected_rps === req.body.selected_rps) {
                    newGameLog.game_result = 0;
                    req.user['balance'] += roomInfo['bet_amount'] * 100 * 0.95
                    roomInfo['creator']['balance'] += roomInfo['bet_amount'] * 100 * 0.95
                    message.message = "We split £" + (roomInfo['bet_amount'] * 2) + " * 0.95 in our ClassicRPS" + roomInfo['room_number'];
                } else {
                    newGameLog.game_result = -1;
                    roomInfo['creator']['balance'] += roomInfo['bet_amount'] * 200 * 0.95
                    message.message = "I lost £" + (roomInfo['bet_amount'] * 2) + " in ClassicRPS" + roomInfo['room_number'];
                }

                roomInfo.status = 'finished';
            } else if (roomInfo['game_type']['game_type_name'] === 'Spleesh!') {
                newGameLog.bet_amount = req.body.bet_amount;

                req.user['balance'] -= req.body.bet_amount * 100;
                roomInfo['pr'] += req.body.bet_amount;

                if (roomInfo.bet_amount == req.body.bet_amount) {
                    req.user['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 90;
                    roomInfo.status = 'finished';
                    newGameLog.game_result = 1;
                    message.message = "I won £" + (roomInfo['pr'] + roomInfo['bet_amount']) + " * 0.9 in Spleesh" + roomInfo['room_number'];
                } else {
                    message.message = "I lost £" + (req.body.bet_amount) + " * 0.9 in Spleesh" + roomInfo['room_number'];
                    
                    newGameLog.game_result = -1;
                    if (roomInfo['end_game_type'] && roomInfo['pr'] >= roomInfo['end_game_amount']) {
                        roomInfo.status = 'finished';
                        roomInfo['creator']['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 90;
                    }
                }
            } else if (roomInfo['game_type']['game_type_name'] === 'Mystery Box') {
                newGameLog.bet_amount = req.body.bet_amount;

                let selected_box = await RoomBoxPrize.findOne({_id: new ObjectId(req.body.selected_id)})
                    .populate({path: 'room', model: Room})
                    .populate({path: 'joiner', model: User});
                selected_box.status = 'opened';
                selected_box.joiner = req.user;
                await selected_box.save();

                newGameLog.game_result = selected_box.box_prize;

                req.user['balance'] -= selected_box.box_price * 100;
                req.user['balance'] += selected_box.box_prize * 95;
                roomInfo['creator']['balance'] += selected_box.box_price * 95;

                if (selected_box.boox_prize === 0) {
                    message.message = "I won NOTHING in MysteryBox" + roomInfo['room_number'];
                } else {
                    message.message = "I won £" + (req.body.bet_amount) + " * 0.95 in MysteryBox" + roomInfo['room_number'];
                }

                opened_amount = 0;
                box_list = await RoomBoxPrize.find({room: roomInfo});
                newPR = 0;

                box_list.forEach(box => {
                    if (box.status === 'opened') {
                        opened_amount += (box.box_prize >= box.box_price ? box.box_prize : roomInfo.box_price - box.box_prize);
                    } else {
                        if (newPR < box.box_prize) {
                            newPR = box.box_prize;
                        }
                    }
                });

                if (roomInfo['end_game_type'] && opened_amount >= roomInfo.end_game_amount) {
                    roomInfo.status = 'finished';
                }

                roomInfo.pr = newPR;
                newGameLog.selected_box = selected_box;
            } else if (roomInfo['game_type']['game_type_name'] === 'Brain Game') {
                newGameLog.bet_amount = roomInfo['bet_amount'];
                newGameLog.brain_game_score = req.body.brain_game_score;

                req.user['balance'] -= roomInfo['bet_amount'] * 100;
                
                if (roomInfo.brain_game_score == req.body.brain_game_score) {   //draw          Draw, No Winner! PR will be split.
                    message.message = "We split £" + (roomInfo['pr'] + roomInfo['bet_amount']) + " * 0.9 in BrainGame" + roomInfo['room_number'];

                    req.user['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 45;
                    roomInfo['creator']['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 45;
                    roomInfo.status = 'finished';
                    newGameLog.game_result = 0;
                } else if (roomInfo.brain_game_score < req.body.brain_game_score) { //win       WOW, What a BRAIN BOX - You WIN!
                    message.message = "I won £" + (roomInfo['pr'] + roomInfo['bet_amount']) + " * 0.9 in BrainGame" + roomInfo['room_number'];

                    req.user['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 90;
                    newGameLog.game_result = 1;
                    roomInfo.status = 'finished';
                } else {    //failed    Oops, back to school for you loser!!
                    message.message = "I lost £" + (roomInfo['bet_amount']) + " in BrainGame" + roomInfo['room_number'];

                    roomInfo['pr'] += roomInfo['bet_amount'];
                    newGameLog.game_result = -1;
                    if (roomInfo['end_game_type'] && roomInfo['pr'] >= roomInfo['end_game_amount']) {
                        roomInfo.status = 'finished';
                        roomInfo['creator']['balance'] += roomInfo['pr'] * 90;
                    }
                }
            }

            await roomInfo['creator'].save();
            await req.user.save();
            await newGameLog.save();
            await roomInfo.save();
            await message.save();

            const rooms = await getRoomList(10, 1);
            req.io.sockets.emit('UPDATED_ROOM_LIST', {
                total: rooms.count,
                roomList: rooms.rooms,
                pages: Math.ceil(rooms.count / 10)
            });
    
            res.json({
                success: true,
                message: 'successful bet',
                betResult: newGameLog.game_result
            });
        }
    } catch (err) {
        res.json({
            success: false,
            message: err
        });
    }
});
  
module.exports = router;
