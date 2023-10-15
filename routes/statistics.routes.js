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
  const commission = await SystemSetting.findOne({ name: 'commission' });
  if (commission?.value) {
    return parseFloat(commission.value);
  }

  return 0;
};

router.get('/get-customer-statistics', auth, async (req, res) => {
  try {
    const { _id, actorType, gameType, timeType } = req.query;
    let transactionConditions = {};
    const gameLogsQuery = {
      $and: [
        { $or: [{ creator: _id }, { joined_user: _id }] },
        { room: { $ne: null } },
        { game_result: { $nin: [3, -100] } } // Exclude gameLogs with game_result 3 or -100
      ]
    };

    

    if (actorType === 'As Host') {
      transactionConditions.$and = [
        { description: { $not: /joined/i } },
      ];
    } else if (actorType === 'As Player') {
      transactionConditions.$and = [
        { description: /joined/i },
      ];
    } else {
      transactionConditions.$and = [
        { description: /-/i }
      ];
    }

    // Apply additional filtering based on gameType for transactions
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
    }

    if (actorType === 'As Host') {
      gameLogsQuery.$and.push({ joined_user: { $ne: _id } });
    } else if (actorType === 'As Player') {
      gameLogsQuery.$and.push({ creator: { $ne: _id } });
    }

    // Modify the query to filter based on gameType
    if (gameType !== 'All') {
      gameLogsQuery.$and.push({ game_type: gameType });
    }

    let startDate;
    if (timeType === '1') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 1));
    } else if (timeType === '7') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 7));
    } else if (timeType === '30') {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30));
    }

    if (startDate) {
      transactionConditions.$and.push({ created_at: { $gte: startDate } });
      gameLogsQuery.$and.push({ created_at: { $gte: startDate } });
    }

    const [receipts, transactions, gameLogs] = await Promise.all([
      Receipt.find({ user_id: _id }).select('payment_type amount'),
      Transaction.find({ user: _id, ...transactionConditions }),
      GameLog.find(gameLogsQuery) // Use the updated query for gameLogs
        .sort({ created_at: 'asc' })
        .populate([
          { path: 'creator', model: User },
          { path: 'joined_user', model: User },
          { path: 'room', model: Room },
          { path: 'game_type', model: GameType }
        ])
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

    const commission = await getCommission();

    for (const gameLog of gameLogs) {
      if (!gameLog.room) {
        continue; // Skip gameLogs with null room property
      }

      statistics.gamePlayed++;

      const creatorId = gameLog.creator ? gameLog.creator._id : null;
      const joinedUserId = gameLog.joined_user ? gameLog.joined_user._id : null;

      const isHost = gameLog.creator && gameLog.creator._id.toString() === _id;
      const isJoined =
        gameLog.joined_user && gameLog.joined_user._id.toString() === _id;

      if (isHost) {
        statistics.gameHosted++;
      } else if (isJoined) {
        statistics.gameJoined++;
      }

      const opponentId = isHost ? joinedUserId : creatorId;
      const opponentUsername = opponentId
        ? isHost
          ? gameLog.joined_user.username
          : gameLog.creator.username
        : null;

      let profit = 0;
      let net_profit = 0;

      if (gameLog.game_type && gameLog.game_type.short_name === 'S!') {
        profit = isHost
          ? 0 - gameLog.bet_amount
          : gameLog.bet_amount * 2 - gameLog.bet_amount;
        net_profit = 0 - gameLog.bet_amount * commission;
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'QS') {
        if (gameLog.game_result === -1) {
          profit = 0 - gameLog.bet_amount;
          net_profit = 0 - gameLog.bet_amount * commission;
        } else {
          profit = isHost
            ? 0 - gameLog.bet_amount
            : gameLog.bet_amount * gameLog.room.qs_game_type;
          net_profit = isHost
            ? 0 -
              gameLog.bet_amount +
              ((commission - 0.5) / 100) *
                gameLog.bet_amount *
                gameLog.room.qs_game_type
            : gameLog.bet_amount *
                gameLog.room.qs_game_type *
                ((100 - commission) / 100) -
              gameLog.bet_amount;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
        if (gameLog.game_result === -1) {
          profit = 0 - gameLog.bet_amount;
          net_profit = 0 - gameLog.bet_amount * commission;
        } else {
          profit =
            (isHost && gameLog.game_result === 1) ||
            (isJoined && gameLog.game_result === -1)
              ? 0 - gameLog.selected_drop
              : gameLog.bet_amount + gameLog.selected_drop;
          net_profit =
            (isHost && gameLog.game_result === 1) ||
            (isJoined && gameLog.game_result === -1)
              ? 0 -
                gameLog.selected_drop +
                ((commission - 0.5) / 100) *
                  (gameLog.bet_amount + gameLog.selected_drop)
              : ((gameLog.bet_amount + gameLog.selected_drop) *
                  (100 - commission)) /
                  100 -
                gameLog.bet_amount;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'MB') {
        profit = isHost
          ? gameLog.bet_amount - gameLog.game_result
          : gameLog.game_result - gameLog.bet_amount;

        net_profit = isHost
          ? gameLog.bet_amount - gameLog.game_result
          : gameLog.game_result - gameLog.bet_amount;
      }
      // rps & bg
      else {
        if (gameLog.game_result === 0) {
          profit = 0;
          net_profit = 0;
        } else {
          profit =
            (isHost && gameLog.game_result === 1) ||
            (isJoined && gameLog.game_result === -1)
              ? 0 - gameLog.bet_amount
              : gameLog.bet_amount * 2;
          net_profit =
            (isHost && gameLog.game_result === 1) ||
            (isJoined && gameLog.game_result === -1)
              ? 0 -
                gameLog.bet_amount +
                ((commission - 0.5) / 100) * gameLog.bet_amount * 2
              : (gameLog.bet_amount * 2 * (100 - commission)) / 100 -
                gameLog.bet_amount;
        }
      }

        // Group game logs by room and calculate the count for each room
    const roomCounts = {};
    for (const gameLog of gameLogs) {
      if (!gameLog.room) {
        continue; // Skip gameLogs with null room property
      }

      const roomId = gameLog.room._id.toString();
      if (roomCounts[roomId]) {
        roomCounts[roomId]++;
      } else {
        roomCounts[roomId] = 1;
      }
    }

    // Calculate the average count for all rooms
    const roomIds = Object.keys(roomCounts);
    if (roomIds.length > 0) {
      const totalRoomCount = roomIds.reduce((total, roomId) => total + roomCounts[roomId], 0);
      statistics.averageGamesPlayedPerRoom = totalRoomCount / roomIds.length;
    }

      if (statistics.profitAllTimeHigh < profit) {
        statistics.profitAllTimeHigh = profit;
      }

      if (statistics.profitAllTimeLow > profit) {
        statistics.profitAllTimeLow = profit;
      }

      statistics.totalWagered += gameLog.bet_amount;
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

      if (!gameLog.room) {
        return { error: 'Room object is null or undefined' };
      }

      let gameTypeShortName = '';
      if (gameLog.game_type) {
        gameTypeShortName = gameLog.game_type.short_name || '';
      }

      statistics.gameLogList.push({
        game_id: `${gameTypeShortName}-${gameLog.room.room_number}`,
        room_id: gameLog.room._id,
        played: gameLog.created_at,
        bet: gameLog.bet_amount,
        bet_id: gameLog._id.toString().slice(-6),
        opponent: { _id: opponentId, username: opponentUsername },
        profit,
        net_profit
      });
    }

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
  const game_types = ['RPS', 'S!', 'BG', 'MB', 'QS', 'DG'];
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
        { name: 'Drop Game', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] }
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
router.get('/get-room-statistics', async (req, res) => {
  try {
    const room_id = req.query.room_id;
    const commission = await getCommission();

    const gameLogs = await GameLog.find({ room: room_id })
      .sort({ created_at: 'asc' })
      .populate({ path: 'game_type', model: GameType })
      .populate({ path: 'joined_user', model: User });

    const playerStats = {};

    for (const gameLog of gameLogs) {
      const actor = gameLog.joined_user.username;
      const wagered = gameLog.bet_amount;
      let net_profit = 0;

      // Calculate net profit based on game type
      if (gameLog.game_type && gameLog.game_type.short_name === 'S!') {
        net_profit = 0 - wagered * commission;
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'QS') {
        if (gameLog.game_result === -1) {
          net_profit = 0 - wagered * commission;
        } else {
          net_profit =
            wagered *
              gameLog.game_type.game_type_id *
              ((100 - commission) / 100) -
            wagered;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
        if (gameLog.game_result === -1) {
          net_profit = 0 - wagered * commission;
        } else {
          net_profit =
            ((wagered + gameLog.selected_drop) * (100 - commission)) / 100 -
            wagered;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'MB') {
        net_profit = gameLog.game_result - wagered;
      } else {
        if (gameLog.game_result === 0) {
          net_profit = 0;
        } else {
          net_profit = (wagered * 2 * (100 - commission)) / 100 - wagered;
        }
      }

      // Accumulate net profit for each player
      if (playerStats[actor]) {
        playerStats[actor].wagered += wagered;
        playerStats[actor].net_profit += net_profit;
        playerStats[actor].bets += gameLog.game_result === 0 ? 0 : 1;
      } else {
        playerStats[actor] = {
          actor,
          wagered,
          net_profit,
          bets: gameLog.game_result === 0 ? 0 : 1
        };
      }
    }

    // Convert playerStats object to an array and sort by net profit (highest first)
    const room_info = Object.values(playerStats);
    room_info.sort((a, b) => b.net_profit - a.net_profit);

    res.json({ success: true, room_info });
  } catch (error) {
    console.log('error***', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
