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
    } else if (gameType === '6536a82933e70418b45fbe32') {
      transactionConditions.$and.push({ description: /B!/i });
    } else if (gameType === '6536946933e70418b45fbe2f') {
      transactionConditions.$and.push({ description: /R/i });
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

   
  

    for (const gameLog of gameLogs) {
      const tax = await SystemSetting.findOne({ name: 'commission' });
      const creatorUser = await User.findOne({ _id: gameLog.creator }).select('accessory');
      const accessory = creatorUser ? creatorUser.accessory : null;
      let item;
      if (accessory) {
        item = await Item.findOne({ image: accessory }).select('CP');
      } else {
        item = { CP: tax.value };
      }
    
      const commission = item.CP;
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
        profit =
            isHost && gameLog.game_result === -1
              ? gameLog.bet_amount * 2
              : isJoined && gameLog.game_result === 1
              ? (gameLog.bet_amount +
                gameLog.bet_amount / (gameLog.room.qs_game_type - 1))
              : 0 - gameLog.bet_amount / (gameLog.room.qs_game_type - 1);
          net_profit =
            isHost && gameLog.game_result === -1
              ? gameLog.bet_amount * 2
              : isJoined && gameLog.game_result === 1
              ? (gameLog.bet_amount +
                gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) *
                ((100 - commission) / 100) -
              gameLog.bet_amount
              : isJoined && gameLog.game_result === -1
              ? 0 - gameLog.bet_amount
              : (0 - gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) + ((gameLog.bet_amount + gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) * ((commission - 0.5) / 100));
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
        if (gameLog.game_result === 0) {
          profit = 0;
          net_profit = 0;
        } else {
          profit =
            isHost && gameLog.game_result === -1
            ? gameLog.bet_amount + gameLog.selected_drop
            : isJoined && gameLog.game_result === 1
            ? (gameLog.bet_amount + gameLog.selected_drop)
            : isJoined && gameLog.game_result === -1
            ? 0 - gameLog.bet_amount
            : 0 - gameLog.selected_drop;
          net_profit =
            isHost && gameLog.game_result === -1
              ? gameLog.bet_amount + gameLog.selected_drop
              : isJoined && gameLog.game_result === 1
              ? (gameLog.bet_amount + gameLog.selected_drop) * ((100 - commission) / 100) -
                gameLog.bet_amount
              : isJoined && gameLog.game_result === -1
              ? 0 - gameLog.bet_amount
              : 0 -
                gameLog.selected_drop  +
                (gameLog.selected_drop + gameLog.bet_amount) * ((commission - 0.5) / 100);
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
            isHost && gameLog.game_result === -1
              ? gameLog.bet_amount * 2
              : isJoined && gameLog.game_result === 1
              ? gameLog.bet_amount * 2
              : 0 - gameLog.bet_amount;
          net_profit =
            isHost && gameLog.game_result === -1
              ? gameLog.bet_amount * 2
              : isJoined && gameLog.game_result === 1
              ? gameLog.bet_amount * 2 * ((100 - commission) / 100) -
                gameLog.bet_amount
              : isJoined && gameLog.game_result === -1
              ? 0 - gameLog.bet_amount
              : 0 -
                gameLog.bet_amount +
                2 * gameLog.bet_amount * ((commission - 0.5) / 100);
        }
      }
      const roomCounts = {};

      const roomId = gameLog.room._id.toString();
      if (roomCounts[roomId]) {
        roomCounts[roomId]++;
      } else {
        roomCounts[roomId] = 1;
      }

      // Calculate the average count for all rooms
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

    //   const users = await User.find({}); // Query all users

    // for (const user of users) {
    //   const userStatistics = await calculateUserStatistics(user._id);

    // // Update the user's profile with the calculated statistics
    // // const user = await User.findById(_id);
    // user.totalWagered = userStatistics.totalWagered;
    // user.totalProfit = userStatistics.gameProfit;
    // user.profitAllTimeHigh = userStatistics.profitAllTimeHigh;
    // user.profitAllTimeLow = userStatistics.profitAllTimeLow;
    // user.gamePlayed = userStatistics.gamePlayed;

    // await user.save();
    // }
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


// async function calculateUserStatistics(userId) {
//   let _id = userId;
//   let transactionConditions = {};
//   let actorType = '';
//   let gameType = 'All';
//   let timeType = '';
//     const gameLogsQuery = {
//       $and: [
//         { $or: [{ creator: _id }, { joined_user: _id }] },
//         { room: { $ne: null } },
//         { game_result: { $nin: [3, -100] } }
//       ]
//     };

//     if (actorType === 'As Host') {
//       transactionConditions.$and = [{ description: { $not: /joined/i } }];
//     } else if (actorType === 'As Player') {
//       transactionConditions.$and = [{ description: /joined/i }];
//     } else {
//       transactionConditions.$and = [{ description: /-/i }];
//     }

//     // Apply additional filtering based on gameType for transactions
//     if (gameType === '62a25d2a723b9f15709d1ae7') {
//       transactionConditions.$and.push({ description: /RPS/i });
//     } else if (gameType === '62a25d2a723b9f15709d1ae8') {
//       transactionConditions.$and.push({ description: /S!/i });
//     } else if (gameType === '62a25d2a723b9f15709d1ae9') {
//       transactionConditions.$and.push({ description: /BG/i });
//     } else if (gameType === '62a25d2a723b9f15709d1aea') {
//       transactionConditions.$and.push({ description: /MB/i });
//     } else if (gameType === '62a25d2a723b9f15709d1aeb') {
//       transactionConditions.$and.push({ description: /QS/i });
//     } else if (gameType === '63dac60ba1316a1e70a468ab') {
//       transactionConditions.$and.push({ description: /DG/i });
//     } else if (gameType === '6536a82933e70418b45fbe32') {
//       transactionConditions.$and.push({ description: /B!/i });
//     } else if (gameType === '6536946933e70418b45fbe2f') {
//       transactionConditions.$and.push({ description: /R/i });
//     }

//     if (actorType === 'As Host') {
//       gameLogsQuery.$and.push({ joined_user: { $ne: _id } });
//     } else if (actorType === 'As Player') {
//       gameLogsQuery.$and.push({ creator: { $ne: _id } });
//     }

//     // Modify the query to filter based on gameType
//     if (gameType !== 'All') {
//       gameLogsQuery.$and.push({ game_type: gameType });
//     }

//     let startDate;
//     if (timeType === '24') {
//       startDate = new Date(new Date().setDate(new Date().getDate() - 1));
//     } else if (timeType === '7') {
//       startDate = new Date(new Date().setDate(new Date().getDate() - 7));
//     } else if (timeType === '30') {
//       startDate = new Date(new Date().setDate(new Date().getDate() - 30));
//     } else if (timeType === '1') {
//       // Adding condition for 1 hour
//       startDate = new Date(new Date().setHours(new Date().getHours() - 1));
//     }

//     if (startDate) {
//       transactionConditions.$and.push({ created_at: { $gte: startDate } });
//       gameLogsQuery.$and.push({ created_at: { $gte: startDate } });
//     }

//     const receipts = await Receipt.find({ user_id: _id }).select(
//       'payment_type amount'
//     );

//     const transactions = await Transaction.find({
//       user: _id,
//       ...transactionConditions
//     });

//     const gameLogs = await GameLog.find(gameLogsQuery)
//       .select(
//         'creator joined_user selected_drop room game_type bet_amount created_at game_result'
//       )
//       .sort({ created_at: 'asc' })
//       .populate([
//         { path: 'creator', model: User, select: '_id username' },
//         { path: 'joined_user', model: User, select: '_id username' },
//         { path: 'room', model: Room, select: 'room_number qs_game_type' },
//         { path: 'game_type', model: GameType, select: 'short_name' }
//       ]);

//     let statistics = {
//       deposit: 0,
//       withdraw: 0,
//       gameProfit: 0,
//       averageProfit: 0,
//       averageWager: 0,
//       averageGamesPlayedPerRoom: 0,
//       profitAllTimeHigh: 0,
//       profitAllTimeLow: 0,
//       gamePlayed: 0,
//       gameHosted: 0,
//       gameJoined: 0,
//       totalWagered: 0,
//       gameLogList: []
//     };

//     for (const receipt of receipts) {
//       if (receipt.payment_type === 'Deposit') {
//         statistics.deposit += receipt.amount;
//       } else if (receipt.payment_type === 'Withdraw') {
//         statistics.withdraw += receipt.amount;
//       }
//     }

//     for (const transaction of transactions) {
//       if (
//         transaction.description !== 'deposit' &&
//         transaction.description !== 'withdraw'
//       ) {
//         statistics.gameProfit += transaction.amount;
//       }
//     }

//     const commission = await getCommission();

//     for (const gameLog of gameLogs) {
//       if (!gameLog.room) {
//         continue; // Skip gameLogs with null room property
//       }

//       statistics.gamePlayed++;

//       const creatorId = gameLog.creator ? gameLog.creator._id : null;
//       const joinedUserId = gameLog.joined_user ? gameLog.joined_user._id : null;

//       const isHost = gameLog.creator && gameLog.creator._id.toString() === _id;
//       const isJoined =
//         gameLog.joined_user && gameLog.joined_user._id.toString() === _id;

//       if (isHost) {
//         statistics.gameHosted++;
//       } else if (isJoined) {
//         statistics.gameJoined++;
//       }

//       const opponentId = isHost ? joinedUserId : creatorId;
//       const opponentUsername = opponentId
//         ? isHost
//           ? gameLog.joined_user.username
//           : gameLog.creator.username
//         : null;

//       let profit = 0;
//       let net_profit = 0;

//       if (gameLog.game_type && gameLog.game_type.short_name === 'S!') {
//         profit = isHost
//           ? 0 - gameLog.bet_amount
//           : gameLog.bet_amount * 2 - gameLog.bet_amount;
//         net_profit = 0 - gameLog.bet_amount * commission;
//       } else if (gameLog.game_type && gameLog.game_type.short_name === 'QS') {
//         profit =
//             isHost && gameLog.game_result === -1
//               ? gameLog.bet_amount * 2
//               : isJoined && gameLog.game_result === 1
//               ? (gameLog.bet_amount +
//                 gameLog.bet_amount / (gameLog.room.qs_game_type - 1))
//               : 0 - gameLog.bet_amount / (gameLog.room.qs_game_type - 1);
//           net_profit =
//             isHost && gameLog.game_result === -1
//               ? gameLog.bet_amount * 2
//               : isJoined && gameLog.game_result === 1
//               ? (gameLog.bet_amount +
//                 gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) *
//                 ((100 - commission) / 100) -
//               gameLog.bet_amount
//               : isJoined && gameLog.game_result === -1
//               ? 0 - gameLog.bet_amount
//               : (0 - gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) + ((gameLog.bet_amount + gameLog.bet_amount / (gameLog.room.qs_game_type - 1)) * ((commission - 0.5) / 100));
//       } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
//         if (gameLog.game_result === 0) {
//           profit = 0;
//           net_profit = 0;
//         } else {
//           profit =
//             isHost && gameLog.game_result === -1
//             ? gameLog.bet_amount + gameLog.selected_drop
//             : isJoined && gameLog.game_result === 1
//             ? (gameLog.bet_amount + gameLog.selected_drop)
//             : isJoined && gameLog.game_result === -1
//             ? 0 - gameLog.bet_amount
//             : 0 - gameLog.selected_drop;
//           net_profit =
//             isHost && gameLog.game_result === -1
//               ? gameLog.bet_amount + gameLog.selected_drop
//               : isJoined && gameLog.game_result === 1
//               ? (gameLog.bet_amount + gameLog.selected_drop) * ((100 - commission) / 100) -
//                 gameLog.bet_amount
//               : isJoined && gameLog.game_result === -1
//               ? 0 - gameLog.bet_amount
//               : 0 -
//                 gameLog.selected_drop  +
//                 (gameLog.selected_drop + gameLog.bet_amount) * ((commission - 0.5) / 100);
//         }
//       } else if (gameLog.game_type && gameLog.game_type.short_name === 'MB') {
//         profit = isHost
//           ? gameLog.bet_amount - gameLog.game_result
//           : gameLog.game_result - gameLog.bet_amount;

//         net_profit = isHost
//           ? gameLog.bet_amount - gameLog.game_result
//           : gameLog.game_result - gameLog.bet_amount;
//       }
//       // rps & bg
//       else {
//         if (gameLog.game_result === 0) {
//           profit = 0;
//           net_profit = 0;
//         } else {
//           profit =
//             isHost && gameLog.game_result === -1
//               ? gameLog.bet_amount * 2
//               : isJoined && gameLog.game_result === 1
//               ? gameLog.bet_amount * 2
//               : 0 - gameLog.bet_amount;
//           net_profit =
//             isHost && gameLog.game_result === -1
//               ? gameLog.bet_amount * 2
//               : isJoined && gameLog.game_result === 1
//               ? gameLog.bet_amount * 2 * ((100 - commission) / 100) -
//                 gameLog.bet_amount
//               : isJoined && gameLog.game_result === -1
//               ? 0 - gameLog.bet_amount
//               : 0 -
//                 gameLog.bet_amount +
//                 2 * gameLog.bet_amount * ((commission - 0.5) / 100);
//         }
//       }
//       const roomCounts = {};

//       const roomId = gameLog.room._id.toString();
//       if (roomCounts[roomId]) {
//         roomCounts[roomId]++;
//       } else {
//         roomCounts[roomId] = 1;
//       }

//       // Calculate the average count for all rooms
//       const roomIds = Object.keys(roomCounts);
//       if (roomIds.length > 0) {
//         const totalRoomCount = roomIds.reduce(
//           (total, roomId) => total + roomCounts[roomId],
//           0
//         );
//         statistics.averageGamesPlayedPerRoom = totalRoomCount / roomIds.length;
//       }

//       if (statistics.profitAllTimeHigh < profit) {
//         statistics.profitAllTimeHigh = profit;
//       }

//       if (statistics.profitAllTimeLow > profit) {
//         statistics.profitAllTimeLow = profit;
//       }

//       statistics.totalWagered += gameLog.bet_amount;
//       const averageWager =
//         statistics.gamePlayed > 0
//           ? statistics.totalWagered / statistics.gamePlayed
//           : 0;
//       const averageProfit =
//         statistics.gamePlayed > 0
//           ? statistics.gameProfit / statistics.gamePlayed
//           : 0;
//       statistics.averageWager = averageWager;
//       statistics.averageProfit = averageProfit;

//       if (!gameLog.room) {
//         return { error: 'Room object is null or undefined' };
//       }

//       let gameTypeShortName = '';
//       if (gameLog.game_type) {
//         gameTypeShortName = gameLog.game_type.short_name || '';
//       }
//     }
// console.log( "totalWagered", statistics.totalWagered,
//   "gameProfit:", statistics.gameProfit,
//   "profitAllTimeHigh: ", statistics.profitAllTimeHigh,
//  " profitAllTimeLow: ", statistics.profitAllTimeLow);


// return {
//     totalWagered: statistics.totalWagered,
//     gameProfit: statistics.gameProfit,
//     profitAllTimeHigh: statistics.profitAllTimeHigh,
//     profitAllTimeLow: statistics.profitAllTimeLow,
//     gamePlayed: statistics.gamePlayed
//   };
// }


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
  const game_types = ['RPS', 'S!', 'BG', 'MB', 'QS', 'DG', 'R', 'B!', 'BJ', 'C'];
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
      username: { $nin: ignoredUsernames } // Ignore specific usernames
    })
      .sort({ [sortField]: sortOrder })
      .select('_id username avatar totalWagered totalProfit profitAllTimeHigh profitAllTimeLow gamePlayed')
      .limit(100);

    const response = {
      success: true,
      leaderboards: leaderboardData,
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
      .populate({ path: 'game_type', model: GameType, select: 'short_name' })
      .populate({ path: 'room', model: Room, select: 'qs_game_type' })
      .populate({
        path: 'joined_user',
        model: User,
        select: '_id username avatar accessory totalWagered'
      });
      
      const playerStats = {};
      
      for (const gameLog of gameLogs) {
        const tax = await SystemSetting.findOne({ name: 'commission' });
        const creatorUser = await User.findOne({ _id: gameLog.creator }).select('accessory');
      let accessory = creatorUser ? creatorUser.accessory : null;
      let item;
      if (accessory) {
        item = await Item.findOne({ image: accessory }).select('CP');
      } else {
        item = { CP: tax.value };
      }
      
      const commission = item.CP;
      const _id = gameLog.joined_user._id;
      const avatar = gameLog.joined_user.avatar;
      accessory = gameLog.joined_user.accessory;
      const rank = gameLog.joined_user.totalWagered;

      const actor = gameLog.joined_user.username;
      const wagered = gameLog.bet_amount;
      let net_profit = 0;

      // Calculate net profit based on game type
      if (gameLog.game_type && gameLog.game_type.short_name === 'S!') {
        net_profit = 0 - wagered * commission;
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'QS') {
        if (gameLog.game_result === -1) {
          net_profit = 0 - wagered;
        } else {
          net_profit =
            (wagered + wagered /
              (gameLog.room.qs_game_type - 1)) *
              ((100 - commission) / 100) -
            wagered;
        }
      } else if (gameLog.game_type && gameLog.game_type.short_name === 'DG') {
        if (gameLog.game_result === -1) {
          net_profit = 0 - wagered;
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
        } else if (gameLog.game_result === 1) {
          net_profit = wagered * 2 * ((100 - commission) / 100) - wagered;
        } else {
          net_profit = 0 - wagered;
        }
      }

      // Accumulate net profit for each player
      if (playerStats[actor]) {
        playerStats[actor].avatar = avatar;
        playerStats[actor].accessory = accessory;
        playerStats[actor].rank = wagered;
        playerStats[actor]._id = _id;
        playerStats[actor].wagered += wagered;
        playerStats[actor].net_profit += net_profit;
        playerStats[actor].bets +=
          gameLog.game_result === 0 ||
          gameLog.game_result === -1 ||
          gameLog.game_result === 1
            ? 1
            : 0;

        playerStats[actor].net_profit_values.push(
          playerStats[actor].net_profit
        );
        playerStats[actor].bets_values.push(playerStats[actor].bets);
      } else {
        playerStats[actor] = {
          avatar,
          _id,
          actor,
          wagered,
          rank,
          net_profit,
          bets:
            gameLog.game_result === 0 ||
            gameLog.game_result === -1 ||
            gameLog.game_result === 1
              ? 1
              : 0
        };
        playerStats[actor].net_profit_values = [net_profit];
        playerStats[actor].bets_values = [
          gameLog.game_result === 0 ||
          gameLog.game_result === -1 ||
          gameLog.game_result === 1
            ? 1
            : 0
        ];
      }
    }

    const room_info = Object.values(playerStats).map(player => ({
      _id: player._id,
      avatar: player.avatar,
      accessory: player.accessory,
      rank: player.wagered,
      actor: player.actor,
      wagered: player.wagered,
      net_profit: player.net_profit,
      bets: player.bets,
      net_profit_values: player.net_profit_values,
      bets_values: player.bets_values
    }));

    room_info.sort((a, b) => b.net_profit - a.net_profit);

    // Calculate hostNetProfit
    const hostNetProfit = [];
    for (const player of room_info) {
      const netProfitValues = player.net_profit_values;
      while (hostNetProfit.length < netProfitValues.length) {
        hostNetProfit.push(0);
      }

      for (let i = 0; i < netProfitValues.length; i++) {
        hostNetProfit[i] += -1 * netProfitValues[i];
      }
    }

    // Calculate hostBetsValue
    const hostBetsValue = [];
    for (const player of room_info) {
      const betsValues = player.bets_values;
      while (hostBetsValue.length < betsValues.length) {
        hostBetsValue.push(0);
      }

      for (let i = 0; i < betsValues.length; i++) {
        hostBetsValue[i] += 1;
      }
    }

    for (let i = 1; i < hostBetsValue.length; i++) {
      hostBetsValue[i] += hostBetsValue[i - 1];
    }

    const response = {
      success: true,
      room_info: room_info,
      hostNetProfit,
      hostBetsValue
    };

    res.json(response);
  } catch (error) {
    console.log('error***', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
