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
                box_list: boxPrizeList,
                box_price: room['box_price']
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

        const answerList = await Answer.find({question: question});
        let answers = [];

        answerList.forEach(answer => {
            answers.push({
                _id: answer._id,
                answer: answer.answer
            });
        });

        answers.sort(() => Math.random() - 0.5);

        res.json({
            success: true,
            question: {_id: question[0]._id, question: question[0].question},
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
    let index = count - (page - 1) * pagination;
    rooms.forEach(room => {
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
            index: index,
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
            temp.bet_amount = room['box_price'];
        }

        index--;
        result.push(temp);
    });

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
        
        newRoom = new Room({ ...req.body, creator: req.user, game_type: gameType, pr: pr, status: 'open' });
        await newRoom.save();

        if (gameType.game_type_name === "Mystery Box") {
            req.body.box_list.forEach(box => {
                newBox = new RoomBoxPrize({
                    room: newRoom,
                    box_prize: box,
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

            if (roomInfo['game_type']['game_type_name'] === 'Classic RPS') {
                req.user['balance'] -= roomInfo['bet_amount'] * 100;

                newGameLog.selected_rps = req.body.selected_rps;

                if (roomInfo.selected_rps % 3 === req.body.selected_rps - 1) {
                    newGameLog.game_result = 1;
                    req.user['balance'] += roomInfo['bet_amount'] * 200 * 0.95
                } else if (roomInfo.selected_rps === req.body.selected_rps) {
                    newGameLog.game_result = 0;
                    req.user['balance'] += roomInfo['bet_amount'] * 100 * 0.95
                    roomInfo['creator']['balance'] += roomInfo['bet_amount'] * 100 * 0.95
                } else {
                    newGameLog.game_result = -1;
                    roomInfo['creator']['balance'] += roomInfo['bet_amount'] * 200 * 0.95
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
                } else {
                    newGameLog.game_result = -1;
                    if (roomInfo['end_game_type'] && roomInfo['pr'] >= roomInfo['end_game_amount']) {
                        roomInfo.status = 'finished';
                        roomInfo['creator']['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 90;
                    }
                }
            } else if (roomInfo['game_type']['game_type_name'] === 'Mystery Box') {
                newGameLog.bet_amount = req.body.bet_amount;
                req.user['balance'] -= req.body.bet_amount * 100;

                let selected_box = await RoomBoxPrize.findOne({_id: new ObjectId(req.body.selected_id)})
                    .populate({path: 'room', model: Room})
                    .populate({path: 'joiner', model: User});
                selected_box.status = 'opened';
                selected_box.joiner = req.user;
                await selected_box.save();

                newGameLog.game_result = selected_box.box_prize;

                req.user['balance'] += selected_box.box_prize * 95;
                roomInfo['creator']['balance'] += req.body.bet_amount * 95;

                opened_amount = 0;
                box_list = await RoomBoxPrize.find({room: roomInfo});
                newPR = 0;

                box_list.forEach(box => {
                    if (box.status === 'opened') {
                        opened_amount += (box.box_prize >= roomInfo.box_price ? box.box_prize : roomInfo.box_price - box.box_prize);
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
                    req.user['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 45;
                    roomInfo['creator']['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 45;
                    roomInfo.status = 'finished';
                    newGameLog.game_result = 0;
                } else if (roomInfo.brain_game_score < req.body.brain_game_score) { //win       WOW, What a BRAIN BOX - You WIN!
                    req.user['balance'] += (roomInfo['pr'] + roomInfo['bet_amount']) * 90;
                    newGameLog.game_result = 1;
                    roomInfo.status = 'finished';
                } else {    //failed    Oops, back to school for you loser!!
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
