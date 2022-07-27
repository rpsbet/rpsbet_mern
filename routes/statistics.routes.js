const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');

// User Model
const User = require('../model/User');
const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const GameLog = require('../model/GameLog');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const SystemSetting = require('../model/SystemSetting');
const RoomBoxPrize = require('../model/RoomBoxPrize');

getCommission = async () => {
	const commission = await SystemSetting.findOne({name: 'commission'});
	if (commission.value) {
		return parseFloat(commission.value);
	}

	return 0;
}

router.get('/get-customer-statistics', auth, async (req, res) => {
  try {
    const _id = req.query._id;
    const statistics = {
      deposit: 0,
      withdraw: 0,
      gameProfit: 0,
      profitAllTimeHigh: 0,
      profitAllTimeLow: 0,
      gamePlayed: 0,
      totalWagered: 0,
      gameLogList: []
    };

    const receipts = await Receipt.find({user_id: _id});
    const transactions = await Transaction.find({user:_id});
    const gameLogs = await GameLog.find({
      $or: [{creator: _id}, {joined_user: _id}]
    })
    .sort({created_at: 'asc'})
    .populate({path: 'creator', model: User})
    .populate({path: 'joined_user', model: User})
    .populate({path: 'room', model: Room})
    .populate({path: 'game_type', model: GameType});
    const rooms = await Room.find({creator: _id});

    for (r of receipts) {
      if (r.payment_type === 'Deposit') {
        statistics['deposit'] += r.amount / 100.0;
      } else if (r.payment_type === 'Withdraw') {
        statistics['withdraw'] += r.amount / 100.0;
      }
    }

    for (t of transactions) {
      if (t.description != 'deposit' && t.description != 'withdraw') {
          statistics['gameProfit'] += t.amount / 100.0;
      }
    }

    for (room of rooms) {
      statistics['totalWagered'] += room.bet_amount;
    }

    const commission = await getCommission();

    for (log of gameLogs) {
      if (log.game_result == -100) { //end_game
        continue;
      }
      statistics['gamePlayed'] ++;
      
      const creator_id = log.creator ? log.creator._id : null;
      const joiner_id = log.joined_user ? log.joined_user._id : null;
      const opponent = (creator_id == _id) ? {_id: joiner_id, username: (joiner_id ? log.joined_user.username : null)} : {_id: creator_id, username: creator_id ? log.creator.username : null};
      let profit = 0;

      if (log.game_type.short_name == 'S!') {
        if (log.game_result == 1) {
          if (creator_id == _id) {
            profit = 0 - log.bet_amount;
          } else {
            profit = log.bet_amount * 2 * (100 - commission) / 100.0 - log.bet_amount;
          }
        } else {
          if (creator_id == _id) {
            profit = log.bet_amount * (100 - commission) / 100.0;
          } else {
            profit = 0 - log.bet_amount;
          }
        }
      } else if (log.game_type.short_name == 'QS') {
        if (log.game_result == 1) {
          if (creator_id == _id) {
            profit = 0 - log.bet_amount;
          } else {
            profit = log.bet_amount * log.room.qs_game_type * (100 - commission) / 100.0 - log.bet_amount;
          }
        } else {
          if (creator_id == _id) {
            profit = log.bet_amount * (100 - commission) / 100.0;
          } else {
            profit = 0 - log.bet_amount;
          }
        }
      } else if (log.game_type.short_name == 'MB') {
        if (creator_id == _id) {
          profit = log.bet_amount * (100 - commission) / 100.0 - log.game_result;
        } else {
          profit = log.game_result * (100 - commission) / 100.0 - log.bet_amount;
        }
      } else {
        if (log.game_result == 0) {
          profit = 0 - (log.bet_amount * commission / 100.0);
        } else {
          if ((creator_id == _id && log.game_result == 1) || (joiner_id == _id && log.game_result == -1)) {
            profit = 0 - log.bet_amount;
          } else {
            profit = log.bet_amount * 2 * (100 - commission) / 100.0 - log.bet_amount;
          }
        }
      }

      if (statistics['profitAllTimeHigh'] < profit) {
        statistics['profitAllTimeHigh'] = profit;
      }

      if (statistics['profitAllTimeLow'] > profit) {
        statistics['profitAllTimeLow'] = profit;
      }

      if (log.joined_user && log.joined_user._id == _id) {
        statistics['totalWagered'] += log.bet_amount;
      }

      statistics['gameLogList'].push({
        game_id: log.game_type.short_name + '-' + log.room.room_number,
        room_id: log.room._id,
        played: log.created_at,
        bet: log.bet_amount,
        opponent: opponent,
        profit: profit,
        net_profit: 0
      });
    }

    res.json({
      success: true,
      statistics,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

getBetType = (bet_amount) => {
  if (bet_amount >= 1 && bet_amount < 10) { return 1; } 
  else if (bet_amount >= 10 && bet_amount < 20) { return 2; }
  else if (bet_amount >= 20 && bet_amount < 30) { return 3; }
  else if (bet_amount >= 30 && bet_amount < 40) { return 4; }
  else if (bet_amount >= 40 && bet_amount < 50) { return 5; }
  else if (bet_amount >= 50 && bet_amount < 60) { return 6; }
  else if (bet_amount >= 60 && bet_amount < 70) { return 7; }
  else if (bet_amount >= 70 && bet_amount < 80) { return 8; }
  else if (bet_amount >= 80 && bet_amount < 90) { return 9; }
  else if (bet_amount >= 90 && bet_amount < 100) { return 10;}
  else if (bet_amount >= 100) { return 11; }

  return 0;
}

getIndexByGameType = (game_type) => {
  const game_types = ['RPS', 'S!', 'BG', 'MB', 'QS'];
  return game_types.indexOf(game_type);
}

router.get('/get-total-statistics', auth, async (req, res) => {
  try {
    const statistics = {
      totalGameCreated: 0,
      totalGameJoined: 0,
      totalWagered: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      volumeOfBets: [
        {name : 'RPS', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
        {name : 'Spleesh', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
        {name : 'Mystery Box', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
        {name : 'Brain Game', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
        {name : 'Quick Shoot', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]},
      ]
    };

    const receipts = await Receipt.find({});
    const rooms = await Room.find({}).populate({path: 'game_type', model: GameType});
    const gameLogs = await GameLog.find({}).populate({path: 'game_type', model: GameType});

    for (r of receipts) {
      if (r.payment_type === 'Deposit') {
        statistics['totalDeposited'] += r.amount / 100.0;
      } else if (r.payment_type === 'Withdraw') {
        statistics['totalWithdrawn'] += r.amount / 100.0;
      }
    }

    statistics['totalGameCreated'] = rooms.length;

    for (room of rooms) {
      statistics['totalWagered'] += room.bet_amount;
      statistics['volumeOfBets'][getIndexByGameType(room.game_type.short_name)].data[getBetType(room.bet_amount)] += room.bet_amount;
    }

    for (log of gameLogs) {
      if (log.game_result == -100) { //end_game
        continue;
      }
      statistics['totalGameJoined'] ++;
      statistics['totalWagered'] += log.bet_amount;
      statistics['volumeOfBets'][getIndexByGameType(log.game_type.short_name)].data[getBetType(log.bet_amount)] += log.bet_amount;
    }

    res.json({
      success: true,
      statistics,
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

router.get('/get-room-statistics', auth, async (req, res) => {
  try {
    const room_id = req.query.room_id;

    const room = await Room.findOne({_id: room_id})
      .populate({path: 'creator', model: User})
      .populate({path: 'game_type', model: GameType});

    const gameLogs = await GameLog.find({room: room_id})
      .sort({created_at: 'asc'})
      .populate({path: 'game_type', model: GameType})
      .populate({path: 'joined_user', model: User});

    const room_info = [];

    if (room.game_type.short_name == 'MB') {
      const boxList = await RoomBoxPrize.find({room: room_id});
      const boxPrices = [];

      for (box of boxList) {
        boxPrices.push(`[RPS ${box.box_price}, RPS ${box.box_prize}]`);
      }

      room_info.push({_id: room._id, created_at: room.created_at, actor: room.creator.username, action: 'Create boxes. ' + boxPrices.join(', ')});

      for (log of gameLogs) {
        if (log.game_result == -100) {
          room_info.push({_id: log._id, created_at: log.created_at, actor: log.joined_user.username, action: `End Game by Creator`})
        } else {
          room_info.push({_id: log._id, created_at: log.created_at, actor: log.joined_user.username, action: `Open a box. [RPS ${log.bet_amount}, RPS ${log.game_result}]`})
        }
      }
    } else {
      room_info.push({_id: room._id, created_at: room.created_at, actor: room.creator.username, bet_amount: 'RPS ' + room.bet_amount, action: 'Create Room'});

      for (log of gameLogs) {
        if (log.game_result == -100) {
          room_info.push({_id: log._id, created_at: log.created_at, actor: log.joined_user.username, action: `End Game by Creator`})
        } else {
          room_info.push({_id: log._id, created_at: log.created_at, actor: log.joined_user.username, action: `Bet RPS ${log.bet_amount} and ${log.game_result == 1 ? 'Win' : (log.game_result == -1 ? 'Lose' : 'Draw')}`});
        }
      }
    }

    res.json({
      success: true,
      room_info: room_info
    })
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

module.exports = router;
