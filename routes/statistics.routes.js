const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');

// User Model
const User = require('../model/User');
const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const Item = require('../model/Item');
const GameLog = require('../model/GameLog');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const SystemSetting = require('../model/SystemSetting');
const RoomBoxPrize = require('../model/RoomBoxPrize');

router.get('/get-customer-statistics', auth, async (req, res) => {
  try {


    const { _id, actorType, gameType, timeType } = req.query;
    let transactionConditions = {};
    const gameLogsQuery = {
      $and: [
        { $or: [{ creator: _id }, { joined_user: _id }] },
        { room: { $ne: null } },
        { game_result: { $nin: [3, -100] } }
      ]
    };

    if (actorType === 'As Host') {
      transactionConditions.$and = [{ description: { $not: /joined/i } }];
    } else if (actorType === 'As Player') {
      transactionConditions.$and = [{ description: /joined/i }];
    } else {
      transactionConditions.$and = [{ description: /-/i }];
    }

    if (gameType === '62a25d2a723b9f15709d1ae7') {
      transactionConditions.$and.push({ description: /RPS/i });
    } else if (gameType === '62a25d2a723b9f15709d1ae8') {
      transactionConditions.$and.push({ description: /S!/i });
    } else if (gameType === '62a25d2a723b9f15709d1ae9') {
      transactionConditions.$and.push({ description: /BG/i });
    } else if (gameType === '62a25d2a723b9f15709d1aea') {
      transactionConditions.$and.push({ description: /MB/i });
    } else if (gameType === '62a25d2a723b9f15709d1aeb') {
      transactionConditions.$and.push({ description: /QS/i });
    } else if (gameType === '63dac60ba1316a1e70a468ab') {
      transactionConditions.$and.push({ description: /DG/i });
    } else if (gameType === '6536a82933e70418b45fbe32') {
      transactionConditions.$and.push({ description: /B!/i });
    } else if (gameType === '6536946933e70418b45fbe2f') {
      transactionConditions.$and.push({ description: /R/i });
    }else if (gameType === '656cd55bb2c2d9dfb59a4bfa') {
      transactionConditions.$and.push({ description: /BJ/i });
    }

    if (actorType === 'As Host') {
      gameLogsQuery.$and.push({ joined_user: { $ne: _id } });
    } else if (actorType === 'As Player') {
      gameLogsQuery.$and.push({ creator: { $ne: _id } });
    }

    if (gameType !== 'All') {
      gameLogsQuery.$and.push({ game_type: gameType });
    }

    let startDate;
    if (timeType === '24') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 1));
    } else if (timeType === '7') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 7));
    } else if (timeType === '30') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30));
    } else if (timeType === '1') {
      // Adding condition for 1 hour
      startDate = new Date(new Date().setHours(new Date().getHours() - 1));
    }


    if (startDate) {
      transactionConditions.$and.push({ created_at: { $gte: startDate } });
      gameLogsQuery.$and.push({ created_at: { $gte: startDate } });
    }

    const receipts = await Receipt.find({ user_id: _id }).select(
      'payment_type amount'
    );
    const transactions = await Transaction.find({
      user: _id,
      ...transactionConditions
    });

    const gameLogs = await GameLog.find(gameLogsQuery)
      .select(
        'creator joined_user selected_drop room game_type bet_amount created_at game_result'
      )
      .sort({ created_at: 'asc' })
      .populate([
        { path: 'creator', model: User, select: '_id username' },
        { path: 'joined_user', model: User, select: '_id username' },
        { path: 'room', model: Room, select: 'room_number qs_game_type' },
        { path: 'game_type', model: GameType, select: 'short_name' }
      ]);


    let statistics = {
      deposit: 0,
      withdraw: 0,
      gameProfit: 0,
      averageProfit: 0,
      averageWager: 0,
      averageGamesPlayedPerRoom: 0,
      profitAllTimeHigh: 0,
      profitAllTimeLow: 0,
      gamePlayed: 0,
      gameHosted: 0,
      gameJoined: 0,
      totalWagered: 0,
      gameLogList: []
    };

    for (const receipt of receipts) {
      if (receipt.payment_type === 'Deposit') {
        statistics.deposit += receipt.amount;
      } else if (receipt.payment_type === 'Withdraw') {
        statistics.withdraw += receipt.amount;
      }
    }

    for (const transaction of transactions) {
      if (
        transaction.description !== 'deposit' &&
        transaction.description !== 'withdraw'
      ) {
        statistics.gameProfit += transaction.amount;
      }
    }

    const tax = await SystemSetting.findOne({ name: 'commission' });
    const userIds = gameLogs.map(log => log.creator);
    const users = await User.find({ _id: { $in: userIds } }).select(
      'accessory avatar'
    );
    const accessoryMap = new Map(
      users.map(user => [user._id.toString(), user.accessory])
    );

    const roomCounts = {};

    for (const gameLog of gameLogs) {
      const {
        creator,
        joined_user,
        room,
        bet_amount,
        game_type,
        selected_drop,
        game_result,
        created_at,
        _id
      } = gameLog;
      const userId = creator._id.toString();
      const creatorUser = accessoryMap.get(userId);
      const accessory = creatorUser ? creatorUser.accessory : null;
      const item = accessory
        ? await Item.findOne({ image: accessory }).select('CP')
        : { CP: tax.value };
      const commission = item.CP;

      if (!room) {
        continue;
      }

      statistics.gamePlayed++;

      const creatorId = creator ? creator._id : null;
      const joinedUserId = joined_user ? joined_user._id : null;

      const isHost = creator && creator._id.toString() === _id;
      const isJoined = joined_user && joined_user._id.toString() === _id;

      if (isHost) {
        statistics.gameHosted++;
      } else if (isJoined) {
        statistics.gameJoined++;
      }

      const opponentId = isHost ? joinedUserId : creatorId;
      const opponentUsername = opponentId
        ? isHost
          ? joined_user.username
          : creator.username
        : null;

      let profit = 0;
      let net_profit = 0;

      if (game_type && game_type.short_name === 'S!') {
        profit = isHost ? 0 - bet_amount : bet_amount * 2 - bet_amount;
        net_profit = 0 - bet_amount * commission;
      } else if (game_type && game_type.short_name === 'QS') {
        profit =
          isHost && game_result === -1
            ? bet_amount * 2
            : isJoined && game_result === 1
            ? bet_amount + bet_amount / (room.qs_game_type - 1)
            : 0 - bet_amount / (room.qs_game_type - 1);
        net_profit =
          isHost && game_result === -1
            ? bet_amount * 2
            : isJoined && game_result === 1
            ? (bet_amount + bet_amount / (room.qs_game_type - 1)) *
                ((100 - commission) / 100) -
              bet_amount
            : isJoined && game_result === -1
            ? 0 - bet_amount
            : 0 -
              bet_amount / (room.qs_game_type - 1) +
              (bet_amount + bet_amount / (room.qs_game_type - 1)) *
                ((commission - 0.5) / 100);
      } else if (game_type && game_type.short_name === 'DG') {
        if (game_result === 0) {
          profit = 0;
          net_profit = 0;
        } else {
          profit =
            isHost && game_result === -1
              ? bet_amount + selected_drop
              : isJoined && game_result === 1
              ? bet_amount + selected_drop
              : isJoined && game_result === -1
              ? 0 - bet_amount
              : 0 - selected_drop;
          net_profit =
            isHost && game_result === -1
              ? bet_amount + selected_drop
              : isJoined && game_result === 1
              ? (bet_amount + selected_drop) * ((100 - commission) / 100) -
                bet_amount
              : isJoined && game_result === -1
              ? 0 - bet_amount
              : 0 -
                selected_drop +
                (selected_drop + bet_amount) * ((commission - 0.5) / 100);
        }
      } else if (game_type && game_type.short_name === 'MB') {
        profit = isHost ? bet_amount - game_result : game_result - bet_amount;

        net_profit = isHost
          ? bet_amount - game_result
          : game_result - bet_amount;
      }
      // rps & bg
      else {
        if (game_result === 0) {
          profit = 0;
          net_profit = 0;
        } else {
          profit =
            isHost && game_result === -1
              ? bet_amount * 2
              : isJoined && game_result === 1
              ? bet_amount * 2
              : 0 - bet_amount;
          net_profit =
            isHost && game_result === -1
              ? bet_amount * 2
              : isJoined && game_result === 1
              ? bet_amount * 2 * ((100 - commission) / 100) - bet_amount
              : isJoined && game_result === -1
              ? 0 - bet_amount
              : 0 - bet_amount + 2 * bet_amount * ((commission - 0.5) / 100);
        }
      }
      const roomId = room._id.toString();
      roomCounts[roomId] = (roomCounts[roomId] || 0) + 1;

      const roomIds = Object.keys(roomCounts);
      if (roomIds.length > 0) {
        const totalRoomCount = roomIds.reduce(
          (total, roomId) => total + roomCounts[roomId],
          0
        );
        statistics.averageGamesPlayedPerRoom = totalRoomCount / roomIds.length;
      }

      if (statistics.profitAllTimeHigh < profit) {
        statistics.profitAllTimeHigh = profit;
      }

      if (statistics.profitAllTimeLow > profit) {
        statistics.profitAllTimeLow = profit;
      }

      statistics.totalWagered += bet_amount;
      const averageWager =
        statistics.gamePlayed > 0
          ? statistics.totalWagered / statistics.gamePlayed
          : 0;
      const averageProfit =
        statistics.gamePlayed > 0
          ? statistics.gameProfit / statistics.gamePlayed
          : 0;
      statistics.averageWager = averageWager;
      statistics.averageProfit = averageProfit;

      if (!room) {
        return { error: 'Room object is null or undefined' };
      }

      let gameTypeShortName = '';
      if (game_type) {
        gameTypeShortName = game_type.short_name || '';
      }

      statistics.gameLogList.push({
        game_id: `${gameTypeShortName}-${room.room_number}`,
        room_id: room._id,
        played: created_at,
        bet: bet_amount,
        bet_id: _id.toString().slice(-6),
        opponent: { _id: opponentId, username: opponentUsername },
        profit,
        net_profit
      });
    }


    // console.log(statistics.gameLogList)

    const response = {
      success: true,
      statistics
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.json({
      success: false,
      error: error.message
    });
  }
});

getBetType = bet_amount => {
  if (bet_amount >= 1 && bet_amount < 10) {
    return 1;
  } else if (bet_amount >= 10 && bet_amount < 20) {
    return 2;
  } else if (bet_amount >= 20 && bet_amount < 30) {
    return 3;
  } else if (bet_amount >= 30 && bet_amount < 40) {
    return 4;
  } else if (bet_amount >= 40 && bet_amount < 50) {
    return 5;
  } else if (bet_amount >= 50 && bet_amount < 60) {
    return 6;
  } else if (bet_amount >= 60 && bet_amount < 70) {
    return 7;
  } else if (bet_amount >= 70 && bet_amount < 80) {
    return 8;
  } else if (bet_amount >= 80 && bet_amount < 90) {
    return 9;
  } else if (bet_amount >= 90 && bet_amount < 100) {
    return 10;
  } else if (bet_amount >= 100) {
    return 11;
  }

  return 0;
};

getIndexByGameType = game_type => {
  const game_types = [
    'RPS',
    'S!',
    'BG',
    'MB',
    'QS',
    'DG',
    'R',
    'B!',
    'BJ',
    'C'
  ];
  return game_types.indexOf(game_type);
};

router.get('/get-total-statistics', auth, async (req, res) => {
  try {
    const statistics = {
      totalGameCreated: 0,
      totalGameJoined: 0,
      totalWagered: 0,
      totalDeposited: 0,
      totalWithdrawn: 0,
      volumeOfBets: [
        { name: 'RPS', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Spleesh', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Mystery Box', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Brain Game', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Quick Shoot', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Drop Game', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Bang!', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
        { name: 'Roll', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
      ]
    };

    const receipts = await Receipt.find({});
    const rooms = await Room.find({}).populate({
      path: 'game_type',
      model: GameType
    });
    const gameLogs = await GameLog.find({}).populate({
      path: 'game_type',
      model: GameType
    });

    for (r of receipts) {
      if (r.payment_type === 'Deposit') {
        statistics['totalDeposited'] += r.amount;
      } else if (r.payment_type === 'Withdraw') {
        statistics['totalWithdrawn'] += r.amount;
      }
    }

    statistics['totalGameCreated'] = rooms.length;

    for (room of rooms) {
      statistics['totalWagered'] += room.bet_amount;
      statistics['volumeOfBets'][
        getIndexByGameType(room.game_type?.short_name)
      ].data[getBetType(room.bet_amount)] += room.bet_amount;
    }

    for (log of gameLogs) {
      if (log.game_result == -100) {
        //end_game
        continue;
      }
      statistics['totalGameJoined']++;
      statistics['totalWagered'] += log.bet_amount;
      statistics['volumeOfBets'][
        getIndexByGameType(log.game_type.short_name)
      ].data[getBetType(log.bet_amount)] += log.bet_amount;
    }

    res.json({
      success: true,
      statistics
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      err: message
    });
  }
});

router.get('/get-leaderboards', auth, async (req, res) => {
  try {
    const sortField = req.query.sortField || 'totalProfit';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const ignoredUsernames = [
      'WHALE WATCHERS',
      'OFFICIALRPSGAME',
      'PimpedPistols',
      'NO BROKIES',
      'twat',
      'SHIBA'
    ];

    const leaderboardData = await User.find({
      gamePlayed: { $ne: 0 },
      username: { $nin: ignoredUsernames }
    })
      .sort({ [sortField]: sortOrder })
      .select(
        '_id username avatar accessory totalWagered totalProfit profitAllTimeHigh profitAllTimeLow gamePlayed'
      )
      .limit(100);

    const response = {
      success: true,
      leaderboards: leaderboardData
    };

    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
router.get('/get-room-statistics', async (req, res) => {
  try {
    const room_id = req.query.room_id;

    const gameLogs = await GameLog.find({
      $and: [{ room: { $ne: null } }, { game_result: { $nin: [3, -100] } }],
      room: room_id
    })
      .sort({ created_at: 'asc' })
      .limit(100); // Adjust the limit based on your requirements

    const tax = await SystemSetting.findOne({ name: 'commission' });

    // const userIds = gameLogs.map(log => log.creator);
    // const usersPromises = userIds.map(async userId => {
    //   const user = await User.findById(userId).select('accessory');
    //   return { userId, user };
    // });

    // const usersResults = await Promise.all(usersPromises);
    // const accessoryMap = new Map(usersResults.map(({ userId, user }) => [userId.toString(), user.accessory]));

    const playerStats = {};

    for (const gameLog of gameLogs) {
      const {
        joined_user,
        bet_amount,
        game_type,
        selected_drop,
        game_result
      } = gameLog;
      const joiner = await User.findOne({ _id: joined_user }).select('_id avatar accessory username totalWagered');
      
      const { _id, avatar, accessory, username, totalWagered } = joiner;

      const commission = accessory ? (await Item.findOne({ image: accessory }).select('CP')).CP : tax.value;

      let net_profit = 0;

      switch (game_type?.short_name) {
        case 'S!':
          net_profit = 0 - bet_amount * commission;
          break;
        case 'QS':
          net_profit = game_result === -1 ? 0 - bet_amount : (bet_amount + bet_amount / (gameLog.room.qs_game_type - 1)) * ((100 - commission) / 100) - bet_amount;
          break;
        case 'DG':
          net_profit = game_result === -1 ? 0 - bet_amount : ((bet_amount + selected_drop) * (100 - commission)) / 100 - bet_amount;
          break;
        case 'MB':
          net_profit = game_result - bet_amount;
          break;
        default:
          net_profit = game_result === 0 ? 0 : game_result === 1 ? bet_amount * 2 * ((100 - commission) / 100) - bet_amount : 0 - bet_amount;
      }

      if (playerStats[username]) {
        playerStats[username].avatar = avatar;
        playerStats[username].accessory = accessory;
        playerStats[username].rank = totalWagered;
        playerStats[username]._id = _id;
        playerStats[username].wagered += bet_amount;
        playerStats[username].net_profit += net_profit;
        playerStats[username].bets += [0, -1, 1].includes(game_result) ? 1 : 0;

        playerStats[username].net_profit_values.push(playerStats[username].net_profit);
        playerStats[username].bets_values.push(playerStats[username].bets);
      } else {
        playerStats[username] = {
          avatar,
          accessory,
          _id,
          actor: username,
          wagered: bet_amount,
          rank: totalWagered,
          net_profit,
          bets: [0, -1, 1].includes(game_result) ? 1 : 0
        };
        playerStats[username].net_profit_values = [net_profit];
        playerStats[username].bets_values = [playerStats[username].bets];
      }
    }

    const room_info = Object.values(playerStats).map(player => ({
      _id: player._id,
      avatar: player.avatar,
      accessory: player.accessory,
      rank: player.rank,
      actor: player.actor,
      wagered: player.wagered,
      net_profit: player.net_profit,
      bets: player.bets,
      net_profit_values: player.net_profit_values,
      bets_values: player.bets_values
    }));

    room_info.sort((a, b) => b.net_profit - a.net_profit);

    // Calculate hostNetProfit
    const hostNetProfit = calculateHostValues(room_info, 'net_profit_values', -1);

    // Calculate hostBetsValue
    const hostBetsValue = calculateHostValues(room_info, 'bets_values', 1);

    const response = {
      success: true,
      room_info,
      hostNetProfit,
      hostBetsValue
    };

    res.json(response);
  } catch (error) {
    console.log('error***', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

function calculateHostValues(room_info, property, multiplier) {
  const hostValues = [];
  for (const player of room_info) {
    const values = player[property];
    while (hostValues.length < values.length) {
      hostValues.push(0);
    }

    for (let i = 0; i < values.length; i++) {
      hostValues[i] += multiplier * values[i];
    }
  }
  return hostValues;
}

module.exports = router;
