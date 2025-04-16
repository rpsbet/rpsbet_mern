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

    if (actorType === 'As Dev') {
      transactionConditions.$and = [{ description: { $not: /joined/i } }];
    } else if (actorType === 'As Player') {
      transactionConditions.$and = [{ description: /joined/i }];
    } else {
      transactionConditions.$and = [{ description: /-/i }];
    }

    if (gameType === '62a25d2a723b9f15709d1ae7') {
      transactionConditions.$and.push({ description: /RPS/i });
    }
    if (actorType === 'As Dev') {
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
        'creator joined_user room game_type bet_amount commission created_at game_result'
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
      'accessory elite username avatar'
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
        { name: 'Quick Shoot', data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
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
      return res.status(400).json({
        success: false,
        message: 'User ID is required.'
      });
    }

    // Fetch user from DB with relevant fields
    const user = await User.findById(_id).select(
      '_id totalWagered totalTraded gameProfit gamePlayed'
    );

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: 'User not found.' });
    }

    let { totalWagered, totalTraded, gameProfit, gamePlayed } = user;

    // Fallback handling: if any of these are null/undefined, set them to 0
    totalWagered = totalWagered || 0;
    totalTraded = totalTraded || 0;
    gameProfit = gameProfit || 0;
    gamePlayed = gamePlayed || 0;

    // 1) If overall profit is negative => "very bad"
    if (gameProfit < 0) {
      return res.json({
        success: true,
        status: 'very bad',
        reason: 'User is overall in negative profit.'
      });
    }

    // 2) If no games => "very bad"
    if (gamePlayed === 0) {
      return res.json({
        success: true,
        status: 'very bad',
        reason: 'Insufficient data to analyze spending habit.'
      });
    }

    // 3) Calculate average wager
    const averageWager = totalWagered / gamePlayed;

    /**
     * 4) Determine "base" value to use for threshold checks:
     *    - If totalWagered is empty (0) => use totalTraded.
     *    - If totalTraded is empty (0) => use totalWagered.
     *    - If both are non-zero => use the sum of both.
     */
    let thresholdBasis = 0;
    const hasWagered = totalWagered > 0;
    const hasTraded = totalTraded > 0;

    if (hasWagered && hasTraded) {
      // both valid => combine
      thresholdBasis = totalWagered + totalTraded;
    } else if (hasWagered && !hasTraded) {
      // only totalWagered
      thresholdBasis = totalWagered;
    } else if (!hasWagered && hasTraded) {
      // only totalTraded
      thresholdBasis = totalTraded;
    } else {
      // neither => insufficient data
      return res.json({
        success: true,
        status: 'very bad',
        reason: 'No wagering or trading data available.'
      });
    }

    /**
     * 5) Define thresholds based on thresholdBasis
     */
    const threePercent = thresholdBasis * 0.03;
    const tenPercent = thresholdBasis * 0.10;
    const twentyPercent = thresholdBasis * 0.20;
    const thirtyFivePct = thresholdBasis * 0.35;
    const fiftyPercent = thresholdBasis * 0.50;

    let baseStatus;
    switch (true) {
      case averageWager <= threePercent:
        baseStatus = 'very good';
        break;
      case averageWager <= tenPercent:
        baseStatus = 'good';
        break;
      case averageWager <= twentyPercent:
        baseStatus = 'average';
        break;
      case averageWager <= thirtyFivePct:
        baseStatus = 'bad';
        break;
      case averageWager <= fiftyPercent:
        baseStatus = 'very bad';
        break;
      default:
        baseStatus = 'very bad';
        break;
    }

    // 6) Return final
    return res.json({
      success: true,
      status: baseStatus,
      baseStatus,
      averageWager,
      totalWagered,
      totalTraded,
      gameProfit,
      gamePlayed
    });
  } catch (error) {
    console.error('Error in /get-spending-habit route:', error);
    return res
      .status(500)
      .json({ success: false, message: 'Internal server error.' });
  }
});



function degradeStatus(original) {
  switch (original) {
    case 'very good': return 'very good';
    case 'good': return 'good';
    case 'average': return 'average';
    case 'bad': return 'bad';
    case 'very bad': return 'very bad';
    default: return 'very bad';
  }
}

router.get('/get-receipt-statistics', async (req, res) => {
  try {
    // Example array of user IDs to ignore
    const ignoredUsers = [
      '638f9033d5d0760d7b956eb1',
      '6302a5207195346428fa9d9b',
      // etc.
    ];

    const receipts = await Receipt.find();

    // Group receipts by user_id and calculate the withdraws and deposits
    const userTransactions = {};

    receipts.forEach((receipt) => {
      const userId = receipt.user_id;

      // If the user is in the ignore list, skip
      if (ignoredUsers.includes(userId.toString())) {
        return; 
      }

      if (!userTransactions[userId]) {
        userTransactions[userId] = { withdraws: 0, deposits: 0 };
      }

      const amount = Math.abs(receipt.amount); // Make the amount positive

      if (receipt.payment_type.includes('Withdraw')) {
        userTransactions[userId].withdraws += amount;
      } else if (receipt.payment_type.includes('Deposit')) {
        userTransactions[userId].deposits += amount;
      }
    });

    // Calculate the net difference for each user
    const userSums = Object.values(userTransactions).map((transaction) => {
      return transaction.withdraws - transaction.deposits;
    });

    // Categorize the users based on their sums
    const categories = {
      overTenMillion: 0,
      betweenOneAndTenMillion: 0,
      betweenZeroAndOneMillion: 0,
      lessThanZero: 0,
    };

    userSums.forEach((sum) => {
      if (sum > 10_000_000) {
        categories.overTenMillion += 1;
      } else if (sum > 1_000_000) {
        categories.betweenOneAndTenMillion += 1;
      } else if (sum >= 0) {
        categories.betweenZeroAndOneMillion += 1;
      } else {
        categories.lessThanZero += 1;
      }
    });

    // Calculate the percentages
    const totalUsers = userSums.length;
    const receiptChart = {
      overTenMillion: (categories.overTenMillion / totalUsers) * 100,
      betweenOneAndTenMillion: (categories.betweenOneAndTenMillion / totalUsers) * 100,
      betweenZeroAndOneMillion: (categories.betweenZeroAndOneMillion / totalUsers) * 100,
      lessThanZero: (categories.lessThanZero / totalUsers) * 100,
    };

    res.json({ success: true, receiptChart });
  } catch (error) {
    console.error('Error fetching receipt statistics:', error);
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

    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    const users = await User.find({
      username: { $nin: ignoredUsernames },
      last_seen: { $gte: twoMonthsAgo }
    });

    let totalBalance = 0;

    const userBalances = await Promise.all(users.map(async (user) => {
      const vault = await Vault.findOne({ user: user._id });
      const userBalance = user.balance + (vault ? vault.balance : 0);
      // If the user's balance is greater than or equal to 10, return user info
      if (userBalance >= 0.005) {
        return {
          _id: user._id,
          username: user.username,
          avatar: user.avatar,
          accessory: user.accessory,
          elite: user.elite,
          totalWagered: user.totalWagered,
          totalBalance: userBalance
        };
      }

      return null;
    }));

    const validUserBalances = userBalances.filter(user => user !== null);

    totalBalance = validUserBalances.reduce((acc, user) => acc + user.totalBalance, 0);
    if (totalBalance === 0) {
      return res.json({ success: true, equityDistribution: [] });
    }

    const equityDistribution = validUserBalances
      .map(user => ({
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
        accessory: user.accessory,
        elite: user.elite,
        totalWagered: user.totalWagered,
        equityPercentage: (user.totalBalance / totalBalance) * 100
      }))
      .filter(user => user.equityPercentage > 0);

    res.json({
      success: true,
      equityDistribution
    });
  } catch (error) {
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
    const lastPlayerTotalBalance = top1PercentPlayers.length > 0 ? top1PercentPlayers[top1PercentPlayers.length - 1].totalBalance : 0;
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
    const sortField = req.query.sortField || 'gameProfit';
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
        '_id username avatar accessory totalWagered gameProfit totalTraded tradingProfit gamePlayed'
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
    console.log(req.query)
    const room_id = req.query.room_id;
    let limit = parseInt(req.query.limit) || undefined;

    const query = {
      $and: [{ room: { $ne: null } }, { game_result: { $nin: [3, -100] } }],
      room: room_id
    };

    const gameLogsQuery = GameLog.find(query).sort({ created_at: -1 });
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

      // Fetch the joiner user data
      const joiner = await User.findOne({ _id: joined_user }).select('_id avatar accessory elite username totalWagered');

      // Skip if the joiner does not exist
      if (!joiner) {
        continue;
      }

      const { _id, avatar, accessory, elite, username, totalWagered } = joiner;

      const commission = accessory
        ? (await Item.findOne({ image: accessory }).select('CP')).CP
        : parseFloat(tax.value);

      let net_profit = calculateNetProfit(game_type?.short_name, bet_amount, game_result, selected_drop, commission);

      playerStats[username] = playerStats[username] || {
        avatar,
        accessory,
        elite,
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
      elite: player.elite,
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
