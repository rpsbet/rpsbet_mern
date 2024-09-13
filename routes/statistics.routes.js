const express = require('express');

const router = express.Router();
const auth = require('../middleware/auth');
const mongoose = require('mongoose');
// User Model
const User = require('../model/User');
const Receipt = require('../model/Receipt');
const Transaction = require('../model/Transaction');
const Item = require('../model/Item');
const GameLog = require('../model/GameLog');
const Vault = require('../model/Vault');
const Room = require('../model/Room');
const GameType = require('../model/GameType');
const SystemSetting = require('../model/SystemSetting');
const RoomBoxPrize = require('../model/RoomBoxPrize');

router.get('/get-customer-statistics', async (req, res) => {
  try {

    const { _id, actorType, gameType, timeType, limit } = req.query;
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

    // Define the base query
    let query = GameLog.find(gameLogsQuery)
      .select(
        'creator joined_user selected_drop room game_type bet_amount commission created_at game_result'
      )
      .sort({ created_at: 1 })
      .populate([
        { path: 'creator', model: User, select: '_id username' },
        { path: 'joined_user', model: User, select: '_id username' },
        { path: 'room', model: Room, select: 'room_number qs_game_type' },
        { path: 'game_type', model: GameType, select: 'short_name' }
      ]);

    // Check if limit is defined
    if (limit) {
      // Apply the limit to the query
      query = query.limit(parseInt(limit));
    }

    // Execute the query
    const gameLogs = await query;



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
      } else if (receipt.payment_type === 'Withdrawal') {
        statistics.withdraw += receipt.amount;
      }
    }

    const tax = await SystemSetting.findOne({ name: 'commission' }).select('value');
    const userIds = gameLogs.map(log => log.creator);
    const users = await User.find({ _id: { $in: userIds } }).select(
      'accessory username avatar'
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


      const commission = gameLog.commission;
      if (!room) {
        continue;
      }

      statistics.gamePlayed++;

      const creatorId = creator ? creator._id : null;
      const joinedUserId = joined_user ? joined_user._id : null;

      const isHost = creator && creator._id.toString() === req.query._id;
      const isJoined = joined_user && joined_user._id.toString() === req.query._id;

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
        if (isHost) {
          // As host
          if (game_result === 1) {
            profit = -bet_amount;
            net_profit -= -1 * ((-1 * bet_amount / (room.qs_game_type - 1)) + commission);
            statistics.gameProfit -= bet_amount / (room.qs_game_type - 1);

          } else {
            // loss
            profit = bet_amount;
            net_profit += (bet_amount * (100 - parseFloat(tax.value)) / 100);
            statistics.gameProfit += bet_amount * (100 - parseFloat(tax.value)) / 100;
          }

        } else {

          // As player
          if (game_result === 1) {
            profit = bet_amount + bet_amount / (room.qs_game_type - 1);
            net_profit += ((bet_amount + bet_amount / (room.qs_game_type - 1)) - commission) - gameLog.bet_amount;
            statistics.gameProfit += ((bet_amount + bet_amount / (room.qs_game_type - 1)) - commission) - gameLog.bet_amount;

          } else {
            // loss
            profit = -gameLog.bet_amount;
            net_profit -= gameLog.bet_amount;
            statistics.gameProfit -= gameLog.bet_amount;
          }

        }
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
      // rps
      else {

        if (isHost) {
          // As host
          if (game_result === 0) {
            profit = 0;
            net_profit -= (bet_amount * 2 * (100 - parseFloat(tax.value)) / 100) / 2;
            statistics.gameProfit -= (bet_amount * 2 * (100 - parseFloat(tax.value)) / 100) / 2;

          } else if (game_result === 1) {
            profit = -bet_amount;
            net_profit -= -1 * ((-1 * bet_amount) + commission);
            statistics.gameProfit -= bet_amount + commission;

          } else {
            // loss
            profit = bet_amount;
            net_profit += (bet_amount * (100 - parseFloat(tax.value)) / 100);
            statistics.gameProfit += bet_amount * (100 - parseFloat(tax.value)) / 100;
          }

        } else {

          // As player
          if (game_result === 0) {
            profit = 0;
            net_profit -= (bet_amount * 2 * (100 - parseFloat(tax.value)) / 100) / 2;
            statistics.gameProfit -= (bet_amount * 2 * (100 - parseFloat(tax.value)) / 100) / 2;

          } else if (game_result === 1) {
            profit = bet_amount * 2;
            net_profit += ((bet_amount * 2) - commission) - bet_amount;
            statistics.gameProfit += ((bet_amount * 2) - commission) - bet_amount;

          } else {
            // loss
            profit = -bet_amount;
            net_profit -= bet_amount;
            statistics.gameProfit -= bet_amount;
          }

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
router.post('/get-spending-habit', async (req, res) => {
  try {
    const { _id } = req.body;

    if (!_id) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(_id).select(
      '_id totalWagered profitAllTimeHigh totalProfit gamePlayed'
    );

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const averageWager = user.gamePlayed > 0 ? user.totalWagered / user.gamePlayed : 0;
    const profitAllTimeHigh = parseFloat(user.profitAllTimeHigh);

    // Calculate percentage thresholds
    const tenPercent = profitAllTimeHigh * 0.1;
    const twentyPercent = profitAllTimeHigh * 0.2;
    const thirtyPercent = profitAllTimeHigh * 0.3;
    const fortyPercent = profitAllTimeHigh * 0.4;

    const postProfit = user.totalProfit > 0;
    const profitValue = Number(postProfit);

    const determineStatus = (averageWager, profitAllTimeHigh, profitValue) => {
      let status;

      // If either averageWager or profitAllTimeHigh is 0, return 'very bad'
      if (averageWager === 0 || profitAllTimeHigh === 0) {
        return 'very bad';
      }

      switch (true) {
        // Very good: 10% or less
        case averageWager <= tenPercent && profitValue === 1:
          status = 'very good';
          break;

        // Good: Between 10% and 20%
        case averageWager <= twentyPercent:
          status = 'good';
          break;

        // Average: Between 20% and 30%
        case averageWager <= thirtyPercent:
          status = 'average';
          break;

        // Bad: Between 30% and 40%
        case averageWager <= fortyPercent:
          status = 'bad';
          break;

        // Very bad: More than 40%
        default:
          status = 'very bad';
      }

      return status;
    };

    const status = determineStatus(averageWager, profitAllTimeHigh, profitValue);

    return res.json({
      success: true,
      status: status,
    });
  } catch (error) {
    console.error('Error in /get-spending-habit route:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/get-equity-distribution', async (req, res) => {
  try {
    const ignoredUsernames = [
      'WHALE WATCHERS',
      'OFFICIALRPSGAME',
      'pimpedpistols',
      'KEKW',
      '69',
      'jadeprice1997',
      'smellyfingers',
      'NO BROKIES',
      'lennybeadle',
      'SUPPORT',
      'rrr',
      'twat',
      'SYSTEM',
      'GIGACHAD',
      'SHIBA',
      '🔥 THE DON 🔥 (BOT #1)',
      '🪨 ROCKY 🪨 (BOT #2)',
      '✂️ CAESAR ✂️ (BOT #4)',
      '📃 PAPÎER 📃 (BOT #3)'
    ];

    // Get the date for two months ago
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    // Find all users who have been active in the last 2 months and are not ignored
    const users = await User.find({
      username: { $nin: ignoredUsernames },
      last_seen: { $gte: twoMonthsAgo }
    });

    // Initialize total balance to 0
    let totalBalance = 0;

    // Fetch balances for each user
    const userBalances = await Promise.all(users.map(async (user) => {
      const vault = await Vault.findOne({ user: user._id });

      // Calculate the total balance by adding user balance and vault balance
      const userBalance = user.balance + (vault ? vault.balance : 0);

      // If the user's balance is greater than or equal to 1000, return user info
      if (userBalance >= 1000) {
        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          accessory: user.accessory,
          totalWagered: user.totalWagered,
          totalBalance: userBalance
        };
      }

      // If the user's balance is less than 1000, return null
      return null;
    }));

    // Filter out any null values (i.e., users with balance < 1000)
    const validUserBalances = userBalances.filter(user => user !== null);

    // Calculate the total balance across all valid users
    totalBalance = validUserBalances.reduce((acc, user) => acc + user.totalBalance, 0);

    // If there are no valid users with balance, return an empty equity distribution
    if (totalBalance === 0) {
      return res.json({ success: true, equityDistribution: [] });
    }

    // Map over valid users to calculate their equity percentage
    const equityDistribution = validUserBalances
      .map(user => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        accessory: user.accessory,
        totalWagered: user.totalWagered,
        equityPercentage: (user.totalBalance / totalBalance) * 100
      }))
      .filter(user => user.equityPercentage > 0);

    // Return the equity distribution as a JSON response
    res.json({
      success: true,
      equityDistribution
    });
  } catch (error) {
    // Handle any errors and return a 500 response
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/get-marketing-stat', async (req, res) => {
  try {
    const ignoredUsernames = [
      'WHALE WATCHERS',
      'OFFICIALRPSGAME',
      'pimpedpistols',
      'KEKW',
      '69',
      'jadeprice1997',
      'smellyfingers',
      'NO BROKIES',
      'lennybeadle',
      'SUPPORT',
      'rrr',
      'twat',
      'SYSTEM',
      'GIGACHAD',
      'SHIBA',
      '🔥 THE DON 🔥 (BOT #1)',
      '🪨 ROCKY 🪨 (BOT #2)',
      '✂️ CAESAR ✂️ (BOT #4)',
      '📃 PAPÎER 📃 (BOT #3)'
    ];

    const totalPlayersResult = await User.aggregate([
      {
        $lookup: {
          from: 'vaults',
          localField: '_id',
          foreignField: 'user',
          as: 'vault'
        }
      },
      {
        $unwind: { path: '$vault', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          username: 1,
          totalBalance: {
            $add: ['$balance', { $ifNull: ['$vault.balance', 0] }]
          },
          gamePlayed: 1
        }
      },
      {
        $match: {
          username: { $nin: ignoredUsernames }
        }
      },
      {
        $sort: { totalBalance: -1 }
      },
      {
        $count: 'totalCount'
      }
    ]);

    const totalPlayers = totalPlayersResult.length > 0 ? totalPlayersResult[0].totalCount : 0;

    const top1PercentThreshold = totalPlayers > 0 ? Math.ceil(totalPlayers * 0.005) : 0;

    if (top1PercentThreshold === 0) {
      return res.json({ success: true, message: 'Not enough players to determine top 1%.' });
    }


    const top1PercentPlayers = await User.aggregate([
      {
        $lookup: {
          from: 'vaults',
          localField: '_id',
          foreignField: 'user',
          as: 'vault'
        }
      },
      {
        $unwind: { path: '$vault', preserveNullAndEmptyArrays: true }
      },
      {
        $project: {
          username: 1,
          totalBalance: {
            $add: ['$balance', { $ifNull: ['$vault.balance', 0] }]
          },
          gamePlayed: 1
        }
      },
      {
        $match: {
          username: { $nin: ignoredUsernames }
        }
      },
      {
        $sort: { totalBalance: -1 }
      },
      {
        $limit: top1PercentThreshold
      }
    ]);

    const avgGamePlayed = top1PercentPlayers.length > 0 ? (top1PercentPlayers.reduce((sum, player) => sum + player.gamePlayed, 0) / top1PercentPlayers.length) : 0;
    // console.log("Average gamePlayed for top 1% players:", avgGamePlayed);

    const lastPlayerTotalBalance = top1PercentPlayers.length > 0 ? top1PercentPlayers[top1PercentPlayers.length - 1].totalBalance : 0;
    // console.log("Total balance of the last player in the top 1%:", lastPlayerTotalBalance);

    const top1PercentUsernames = top1PercentPlayers.map(player => player.username);
    // console.log("Top 1% player usernames:", top1PercentUsernames);

    const totalUsersWithGamePlayed = await User.countDocuments({ gamePlayed: { $gt: 0 } });

    if (totalUsersWithGamePlayed === 0) {
      return res.json({ success: true, message: 'No users with game played found.' });
    }
    const chanceOfReachingBalance = avgGamePlayed > 0 ? (lastPlayerTotalBalance / avgGamePlayed) * 100 : 0;

    const message = `New players have a ${chanceOfReachingBalance.toFixed(2)}% chance of reaching the top 0.005% of players after playing an average of ${avgGamePlayed.toFixed(2)} games`;
    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error("An error occurred:", error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

router.get('/get-leaderboards', auth, async (req, res) => {
  try {
    const sortField = req.query.sortField || 'totalProfit';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    const ignoredUsernames = [
      'WHALE WATCHERS',
      'OFFICIALRPSGAME',
      'pimpedpistols',
      'KEKW',
      '69',
      'jadeprice1997',
      'smellyfingers',
      'NO BROKIES',
      'SUPPORT',
      'twat',
      'SYSTEM',
      'GIGACHAD',
      'SHIBA',
      '🔥 THE DON 🔥 (BOT #1)',
      '🪨 ROCKY 🪨 (BOT #2)',
      '✂️ CAESAR ✂️ (BOT #4)',
      '📃 PAPÎER 📃 (BOT #3)'
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
// router.get('/platform-percentages', auth, async (req, res) => {
//   try {
//     // Excluded user_id
//     const excludedUserId = mongoose.Types.ObjectId('63f627662fa1b221f3a06305');

//     // Aggregate total deposits and withdrawals, handling negative values and excluding specific user_id
//     const [totalDeposits, totalWithdrawals] = await Promise.all([
//       Receipt.aggregate([
//         { 
//           $match: { 
//             payment_type: 'Deposit',
//             user_id: { $ne: excludedUserId } // Exclude specific user_id
//           } 
//         },
//         { 
//           $group: { 
//             _id: null, 
//             totalAmount: { $sum: "$amount" } 
//           } 
//         }
//       ]),
//       Receipt.aggregate([
//         { 
//           $match: { 
//             payment_type: { $in: ['Withdraw', 'Withdrawal'] },
//             user_id: { $ne: excludedUserId } // Exclude specific user_id
//           } 
//         },
//         { 
//           $group: { 
//             _id: null, 
//             totalAmount: { $sum: { $abs: "$amount" } } // Sum the absolute values of withdrawals
//           } 
//         }
//       ])
//     ]);

//     // Extract the total amounts (if no data found, default to 0)
//     const totalDepositAmount = totalDeposits[0]?.totalAmount || 0;
//     const totalWithdrawalAmount = totalWithdrawals[0]?.totalAmount || 0;

//     const totalTransactions = totalDepositAmount + totalWithdrawalAmount;

//     // Calculate percentages
//     let depositPercentage = 0;
//     let withdrawalPercentage = 0;

//     if (totalTransactions > 0) {
//       depositPercentage = (totalDepositAmount / totalTransactions) * 100;
//       withdrawalPercentage = (totalWithdrawalAmount / totalTransactions) * 100;
//     }

//     // Return the result
//     res.json({
//       success: true,
//       data: {
//         depositPercentage: depositPercentage.toFixed(2),
//         withdrawalPercentage: withdrawalPercentage.toFixed(2)
//       }
//     });
//   } catch (error) {
//     console.error('Error in /platform-percentages route:', error);
//     res.status(500).json({ success: false, message: 'Internal server error' });
//   }
// });

router.get('/get-room-statistics', async (req, res) => {
  try {
    const room_id = req.query.room_id;
    let limit = parseInt(req.query.limit) || undefined;

    const query = {
      $and: [{ room: { $ne: null } }, { game_result: { $nin: [3, -100] } }],
      room: room_id
    };

    const gameLogsQuery = GameLog.find(query).sort({ created_at: '-1' });
    if (limit !== undefined) {
      gameLogsQuery.limit(limit);
    }

    const gameLogs = await gameLogsQuery;

    const tax = await SystemSetting.findOne({ name: 'commission' });

    const playerStats = {};
    const joinerCounts = {};

    for (const gameLog of gameLogs) {
      const { joined_user, bet_amount, game_type, selected_drop, game_result } = gameLog;

      // Check if the joiner has occurred more than 10 times
      if (joinerCounts[joined_user] && joinerCounts[joined_user] >= 10) {
        continue; // Skip processing this game log
      }

      const joiner = await User.findOne({ _id: joined_user }).select('_id avatar accessory username totalWagered');

      const { _id, avatar, accessory, username, totalWagered } = joiner;

      const commission = accessory ? (await Item.findOne({ image: accessory }).select('CP')).CP : parseFloat(tax.value);

      let net_profit = calculateNetProfit(game_type?.short_name, bet_amount, game_result, selected_drop, commission);

      playerStats[username] = playerStats[username] || {
        avatar,
        accessory,
        _id,
        actor: username,
        wagered: 0,
        rank: totalWagered,
        net_profit: 0,
        bets: 0,
        net_profit_values: [],
        bets_values: []
      };

      playerStats[username].wagered += bet_amount;
      playerStats[username].net_profit += net_profit;
      playerStats[username].bets += [0, -1, 1].includes(game_result) ? 1 : 0;
      playerStats[username].net_profit_values.push(playerStats[username].net_profit);
      playerStats[username].bets_values.push(playerStats[username].bets);

      // Increment joiner count
      joinerCounts[joined_user] = (joinerCounts[joined_user] || 0) + 1;
    }

    const room_info = Object.values(playerStats).map(player => ({
      _id: player._id,
      avatar: player.avatar,
      username: player.username,
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

    const hostNetProfit = calculateHostValues(room_info, 'net_profit_values', -1);
    const hostBetsValue = calculateHostValues(room_info, 'bets_values', 1);

    const response = {
      room_id,
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

function calculateNetProfit(game_type, bet_amount, game_result, selected_drop, commission) {
  switch (game_type) {
    case 'S!':
      return 0 - bet_amount * commission;
    case 'QS':
      return game_result === -1 ? 0 - bet_amount : (bet_amount + bet_amount / (gameLog.room.qs_game_type - 1)) * ((100 - commission) / 100) - bet_amount;
    case 'DG':
      return game_result === -1 ? 0 - bet_amount : ((bet_amount + selected_drop) * (100 - commission)) / 100 - bet_amount;
    case 'MB':
      return game_result - bet_amount;
    default:
      return game_result === 0 ? 0 : game_result === 1 ? bet_amount * 2 * ((100 - commission) / 100) - bet_amount : 0 - bet_amount;
  }
}

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
