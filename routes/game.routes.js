const express = require('express');

const router = express.Router();
const Room = require('../model/Room');
const User = require('../model/User');
const GameType = require('../model/GameType');
const GameLog = require('../model/GameLog');
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
                        .populate({path: 'game_type', model: GameType});
        res.json({
            success: true,
            query: req.query,
            roomInfo: {
                _id: room['_id'],
                game_type: room['game_type']['game_type_name'],
                bet_amount: room['bet_amount']
            }
        });
    } catch (err) {
        res.json({
            success: false,
            err: err
        });
    }
});

// /api/rooms call
router.get('/rooms', async (req, res) => {
    const pagination = req.query.pagination ? parseInt(req.query.pagination) : 10;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    try {
        const rooms = await Room.find({})
            .populate({path: 'creator', model: User})
            .populate({path: 'game_type', model: GameType})
            .sort({created_at: 'desc'})
            .skip(pagination * page - pagination)
            .limit(pagination);
        const count = await Room.countDocuments({});
        let result = [];
        let index = count - (page - 1) * pagination;
        rooms.forEach(room => {
            let temp = {
                _id : room['_id'],
                creator : room['is_anonymous'] === true ? 'Anonymous' : room['creator']['username'],
                game_type : room['game_type'],
                bet_amount : room['bet_amount'],
                pr : "£" + (room['bet_amount'] * 2), 
                winnings : "£" + (room['bet_amount'] * 2) + " * 0.95",
                is_anonymous : room['is_anonymous'],
                is_private : room['is_private'],
                status: room['status'],
                index: index,
                created_at : moment(room['created_at']).format('YYYY-MM-DD HH:mm'),
            };
            index--;
            result.push(temp);
        });
        res.json({
            success: true,
            query: req.query,
            total: count,
            roomList: result,
            pages: Math.ceil(count / pagination)
        });
    } catch (err) {
        res.json({
            success: false,
            err: message
        });
    }
});

router.post('/rooms', auth, async (req, res) => {
    try {
        if (!req.body._id) {
            gameType = await GameType.findOne({game_type_id: parseInt(req.body.game_type)});
            newRoom = new Room({ ...req.body, creator: req.user, game_type: gameType, status: 'open' });
            await newRoom.save();
            res.json({
                success: true,
                message: 'room create'
            });
        }
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
            });

            if (roomInfo['game_type']['game_type_name'] === 'Classic RPS') {
                newGameLog.selected_rps = req.body.selected_rps;
                newGameLog.is_anonymous = req.body.is_anonymous;

                if (roomInfo.selected_rps % 3 === req.body.selected_rps - 1) {
                    newGameLog.game_result = 1;
                } else if (roomInfo.selected_rps === req.body.selected_rps) {
                    newGameLog.game_result = 0;
                } else {
                    newGameLog.game_result = -1;
                }

                roomInfo.status = 'finished';
            }

            await newGameLog.save();
            await roomInfo.save();

            res.json({
                success: true,
                message: 'room create',
                betResult: newGameLog.game_result
            });
        }
    } catch (err) {
        console.log(err);
        res.json({
            success: false,
            message: err
        });
    }
});
  
module.exports = router;
  