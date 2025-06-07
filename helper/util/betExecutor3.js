// betExecutor.js
const ObjectId = require('mongoose').Types.ObjectId;
const { Connection, Keypair, PublicKey, SystemProgram, Transaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const { LAMPORTS_PER_SOL } = require('@solana/web3.js');
const SystemSetting = require('../../model/SystemSetting');
const User = require('../../model/User');
const GameType = require('../../model/GameType');
const Room = require('../../model/Room');
const Notification = require('../../model/Notification');
const CustomBetItem = require('../../model/CustomBetItem');
const GameTransaction = require('../../model/Transaction');
const GameLog = require('../../model/GameLog');
const socket = require('../../socketController');
const { setTimeout } = require('timers/promises');
const moment = require('moment');
const {
  convertGameLogToHistoryStyle,
} = require('./convertGameLogToHistoryStyle');
const check_access_time = require('../../helper/util/checkAccessTime');

const saveDocumentWithRetry = require('./retrySave');
const { mintTokenWithMetadata } = require('./mintTokenWithMetadata');
const { wallet, connection } = require('./config');
const { createAmmPool } = require('./createPool');
const { createMarket } = require('./createMarket');
const { addLiquidity } = require('./addLiquidity');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');
const { Market } = require('@project-serum/serum');
const { revokeMintAndFreezeAuthorities } = require('./authority');
const { distributeTokens } = require('./distributeTokens');

const requestQueue = [];

// Utility function to wait for transaction confirmation
const waitForBlockchainOperation = async (operationPromise, waitTime = 10000) => {
  try {
    const result = await operationPromise;
    await setTimeout(waitTime);
    return result;
  } catch (error) {
    console.error('Blockchain operation failed:', error);
    return null;
  }
};

// Function to create a token and pool
const createTokenAndPool = async (roomInfo) => {
  try {
    // Set room status to finished first to prevent race conditions
    roomInfo.status = 'finished';
    await saveDocumentWithRetry(roomInfo);

    // Start minting token
    const myMintPk = await waitForBlockchainOperation(
      mintTokenWithMetadata(roomInfo),
      15000
    );

    if (!myMintPk) return '';

    const realBasePublicKey = new PublicKey(myMintPk);
    const wsolMintPk = new PublicKey('So11111111111111111111111111111111111111112');

    // Create market
    const marketId = await waitForBlockchainOperation(
      createMarket(realBasePublicKey, wsolMintPk),
      15000
    );

    if (!marketId) return '';

    // Create AMM pool
    const ammId = await waitForBlockchainOperation(
      createAmmPool(marketId),
      20000
    );

    if (!ammId) return '';

    // Distribute tokens to hosts
    await waitForBlockchainOperation(
      distributeTokens(realBasePublicKey, roomInfo['hosts']),
      10000
    );

    // Revoke authorities
    await waitForBlockchainOperation(
      revokeMintAndFreezeAuthorities(realBasePublicKey),
      5000
    );

    return ammId.toBase58();
  } catch (error) {
    console.error('Error creating token and pool:', error);
    return '';
  }
};

// Function to process game end if needed
const processGameEndIfNeeded = async (roomInfo, req, user) => {
  if (
    roomInfo['endgame_type'] &&
    roomInfo['user_bet'] >= roomInfo['endgame_amount'] &&
    roomInfo.status !== 'finished'
  ) {
    // Notify clients that room has ended
    if (req.io && req.io.sockets) {
      req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
    }

    // Create pool and get pool ID
    const pool_id = await createTokenAndPool(roomInfo);

    // Create game log for end event
    const newGameLogC = new GameLog({
      room: roomInfo,
      creator: roomInfo['creator'],
      joined_user: roomInfo['creator'],
      game_type: roomInfo['game_type'],
      bet_amount: roomInfo['host_pr'],
      user_bet: roomInfo['user_bet'],
      hosts: roomInfo.hosts,
      endgame_amount: roomInfo['endgame_amount'],
      game_result: 3,
    });

    await saveDocumentWithRetry(newGameLogC);
    return pool_id;
  }
  return '';
};

// Function to handle notifications and transactions
const handleNotificationsAndTransactions = async (user, roomInfo, newTransactionAmount, message, req) => {
  // Create notification data
  const notificationData = {
    _id: user._id,
    message: message.message,
    username: user.username,
    avatar: user.avatar,
    amount: newTransactionAmount,
    accessory: user.accessory,
    elite: user.elite,
    room: req.body._id,
    rank: user.totalWagered,
    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    created_at_str: moment(new Date()).format('LLL'),
    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    is_read: false,
  };

  // Save notification if needed
  if (message.message !== '' && message.from._id.toString() !== message.to._id.toString()) {
    try {
      await saveDocumentWithRetry(message);
      socket.sendNotification(message.to._id, notificationData);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  }

  return notificationData;
};

// Handle host payouts
const processHostPayouts = async (roomInfo, newTransactionC, user, req) => {
  if (roomInfo.hosts[0].share === 100) {
    // Single host case
    await processSingleHostPayout(roomInfo, newTransactionC, req);
  } else {
    // Multiple hosts case
    await processMultipleHostsPayout(roomInfo, newTransactionC, user, req);
  }
};

// Process payout for a single host
const processSingleHostPayout = async (roomInfo, newTransactionC, req) => {
  if (newTransactionC.amount === 0) return;

  const host = await User.findOne({ _id: roomInfo['creator'] });

  let notification = new Notification({
    from: roomInfo['creator']._id,
    to: roomInfo['creator']._id,
    room: req.body._id,
    message: `Hosting ${newTransactionC.amount} auto-payout in ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
    amount: newTransactionC.amount,
    is_read: false,
  });

  const notificationData = {
    _id: roomInfo['creator']._id,
    message: notification.message,
    username: roomInfo['creator'].username,
    amount: newTransactionC.amount,
    avatar: roomInfo['creator'].avatar,
    accessory: roomInfo['creator'].accessory,
    elite: roomInfo['creator'].elite,
    room: req.body._id,
    rank: roomInfo['creator'].totalWagered,
    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    created_at_str: moment(new Date()).format('LLL'),
    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
    is_read: false,
  };

  try {
    // Save notification and transaction in parallel
    await Promise.all([
      saveDocumentWithRetry(notification),
      saveDocumentWithRetry(newTransactionC)
    ]);

    if (host) {
      host.balance += newTransactionC.amount;
      host.tradeProfit += newTransactionC.amount;
      await saveDocumentWithRetry(host);
    }

    socket.sendNotification(roomInfo['creator']._id, notificationData);
    socket.newTransaction(newTransactionC);
  } catch (error) {
    console.error('Error processing host payout:', error);
  }
};

// Process payouts for multiple hosts
const processMultipleHostsPayout = async (roomInfo, newTransactionC, user, req) => {
  const hostPromises = roomInfo.hosts.map(async (host) => {
    const amountForHost = (host.share / 100) * newTransactionC.amount;
    if (amountForHost === 0) return;

    const newTransactionForHost = new GameTransaction({
      user: host.host,
      amount: amountForHost,
      description: `Co-Hosting auto-payout in ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      room: req.body._id,
    });

    const notification = new Notification({
      from: roomInfo['creator'],
      to: host.host,
      message: `Co-Hosting ${amountForHost} auto-payout in ${roomInfo.game_type.short_name}-${roomInfo.room_number}`,
      amount: amountForHost,
      room: req.body._id,
      is_read: false,
    });

    const notificationData = {
      _id: roomInfo['creator']._id,
      message: notification.message,
      username: roomInfo['creator'].username,
      avatar: roomInfo['creator'].avatar,
      amount: amountForHost,
      accessory: roomInfo['creator'].accessory,
      elite: roomInfo['creator'].elite,
      room: req.body._id,
      rank: roomInfo['creator'].totalWagered,
      created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      created_at_str: moment(new Date()).format('LLL'),
      updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
      is_read: false,
    };

    try {
      const coHost = await User.findOne({ _id: host.host });

      await Promise.all([
        saveDocumentWithRetry(newTransactionForHost),
        saveDocumentWithRetry(notification)
      ]);

      if (coHost) {
        coHost.balance += amountForHost;
        await saveDocumentWithRetry(coHost);
      }

      socket.sendNotification(host.host, notificationData);
      socket.newTransaction(newTransactionForHost);
    } catch (error) {
      console.error('Error processing co-host payout:', error);
    }
  });

  await Promise.all(hostPromises);
};

// Update room and emit candle data
const updateRoomAndEmitData = async (roomInfo, user, newTransactionAmount, req) => {
  const now = new Date();
  const timeBucket = Math.floor(now.getTime() / (60 * 1000));
  const isBuyTransaction = newTransactionAmount < 0;

  const newCandle = {
    _id: timeBucket,
    open: roomInfo.user_bet + newTransactionAmount,
    close: roomInfo.user_bet,
    high: Math.max(roomInfo.user_bet, roomInfo.user_bet + newTransactionAmount),
    low: Math.min(roomInfo.user_bet, roomInfo.user_bet + newTransactionAmount),
    volume: Math.abs(newTransactionAmount),
    buyVolume: isBuyTransaction ? Math.abs(newTransactionAmount) : 0,
    sellVolume: isBuyTransaction ? 0 : Math.abs(newTransactionAmount),
    startTime: new Date(timeBucket * 60 * 1000),
  };

  if (req.io && req.io.sockets) {
    req.io.sockets.emit(`NEW_CANDLE_${roomInfo._id}`, { newCandle });
  }

  if (!roomInfo.joiners.includes(user._id)) {
    roomInfo.joiners.push(user._id);
  }

  roomInfo.battles = roomInfo.battles + 1;
  roomInfo.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');

  return newCandle;
};

// Process Custom game
const processCustomGame = async (req, user, roomInfo, bet_amount, tax, newTransactionJ, newGameLog) => {
  const { result, multiplier } = req.body;
  let game_result = 0;
  let newTransactionAmount = 0;
  let commission = roomInfo['tax'] + (user.elite === 'black' ? tax.value / 2 : tax.value);
  let pool_id = '';
  let message;

  // Create new bet item
  let bet_item = new CustomBetItem({
    room: new ObjectId(req.body._id),
    joiner: req.user._id,
    result: result,
    multiplier: multiplier,
    bet_amount: bet_amount,
  });

  newGameLog.bet_amount = bet_amount;

  // Determine game result
  if (result === 'win' && multiplier) {
    // Win
    game_result = 1;
    newTransactionAmount += bet_amount * multiplier * ((100 - commission) / 100);
    newGameLog.commission = bet_amount * multiplier * (roomInfo['tax'] / 100);

    // Update room values
    roomInfo['host_pr'] -= bet_amount * (multiplier - 1);
    roomInfo['user_bet'] -= bet_amount * (multiplier - 1);

    // Set message
    message = new Notification({
      from: user,
      to: roomInfo['creator'],
      room: req.body._id,
      message: 'Won in ' + roomInfo['name'],
      amount: bet_amount * multiplier * ((100 - commission) / 100),
      is_read: false,
    });

  } else {
    // Loss
    game_result = -1;

    roomInfo['user_bet'] += bet_amount * ((100 - tax.value) / 100);
    roomInfo['host_pr'] += bet_amount * ((100 - tax.value) / 100);

    // Process game end if needed
    pool_id = await processGameEndIfNeeded(roomInfo, req, user);

    newTransactionAmount -= bet_amount;
    
    // Set message
    message = new Notification({
      from: user,
      to: roomInfo['creator'],
      room: req.body._id,
      message: 'Lost in ' + roomInfo['name'],
      amount: bet_amount,
      is_read: false,
    });
  }

  // Update game log
  newGameLog.winnings = newTransactionAmount;
  newGameLog.game_result = game_result;
  newGameLog.endgame_amount = roomInfo['endgame_amount'];

  // Save bet item
  await saveDocumentWithRetry(bet_item);

  // Emit updated bankroll data
  if (req.io && req.io.sockets) {
    const payload = {
      bankroll: roomInfo['user_bet'],
      host_pr: roomInfo['host_pr'],
      custom: bet_item,
      room: roomInfo._id,
      user: user,
    };

    if (pool_id) {
      payload.pool_id = pool_id;
    }

    req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, payload);
  }

  // Handle room end case
  if (roomInfo['user_bet'] <= 0.001) {
    roomInfo.status = 'finished';
    if (req.io && req.io.sockets) {
      req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
    }
    game_result = 1;
    message.message = 'Won in ' + roomInfo['name'];
    message.amount = roomInfo['host_pr'] + roomInfo['bet_amount'];
    roomInfo['user_bet'] -= roomInfo['user_bet'];
    newTransactionAmount += roomInfo['user_bet'];
  }

  return {
    game_result,
    newTransactionAmount,
    bet_item,
    pool_id,
    message
  };
};

// Validation functions for better organization
const validateBetRequest = (req, user, roomInfo) => {
  // Early validations
  if (user.dailyWithdrawals > 4.269) {
    return {
      success: false,
      message: 'Irregular action detected',
      betResult: -1000,
    };
  }

  if (user.isWithdrawing) {
    return {
      success: false,
      message: 'Withdrawal in progress. Please wait until it completes.',
      betResult: -1000,
    };
  }

  if (parseFloat(req.body.bet_amount) < 0.001) {
    return {
      success: false,
      message: 'Minimum bet is 0.001 SOL',
    };
  }

  // Check if user is the creator
  if (
    roomInfo['creator'] &&
    roomInfo['creator']._id &&
    user &&
    user._id &&
    roomInfo['creator']._id.toString() === user._id.toString()
  ) {
    return {
      success: false,
      message: 'Cannot bet on your own game!',
      betResult: -101,
    };
  }

  // Check if room was updated recently (anti-spam)
  const tenSecondsAgo = new Date(Date.now() - 500);
  if (roomInfo['updated_at'] > tenSecondsAgo) {
    return {
      success: false,
      message: 'Room too busy, try again later',
      betResult: -1200,
    };
  }

  // Check if room is finished
  if (roomInfo['status'] === 'finished') {
    return {
      success: false,
      message: 'This game has ended',
      betResult: -100,
    };
  }

  return { success: true };
};

const addToQueue = async (req, bot = false) => {
  try {
    // Fetch system settings (only tax)
    const tax = await SystemSetting.findOne({ name: 'commission' });

    let responseData = {};
    let game_result;
    let pool_id = '';
    let bet_item;
    let roomInfo;
    let message;
    let newTransactionAmount = 0;
    let user;

    // Create transaction objects
    let newTransactionC = new GameTransaction({
      user: '',
      amount: 0,
      description: '',
      room: req.body._id,
    });

    let newTransactionJ = new GameTransaction({
      user: '',
      amount: 0,
      description: '',
      room: req.body._id,
    });

    // Handle bot or user
    if (bot) {
      return responseData;
    } else {
      user = req.user;
    }

    // Process bet if room ID exists
    if (req.body._id) {
      const { bet_amount } = req.body;

      // Get room information with populated relations
      roomInfo = await Room.findOne({ _id: req.body._id })
        .select(
          'name image tax ticker prompt room_number updated_at battles selectedStrategy game_type joiners creator bet_amount user_bet pr host_pr endgame_type endgame_amount is_private room_password status hosts',
        )
        .populate({
          path: 'creator',
          model: User,
          select:
            '_id avatar accessory elite totalWagered username gameProfit gamePlayed balance ',
        })
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'game_type_name short_name',
        });

      // Validate bet request
      const validation = validateBetRequest(req, user, roomInfo);
      if (!validation.success) {
        return validation;
      }

      // Check access time
      const accessAllowed = await check_access_time(req.user._id);
      if (!accessAllowed) {
        return {
          success: false,
          message: 'Too many requests. Please slow down!',
          betResult: -100,
        };
      }

      // Setup for game processing
      const commission = roomInfo['tax'] + tax.value;

      // Create game log
      const newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo['creator'],
        joined_user: user,
        game_type: roomInfo['game_type'],
        bet_amount: req.body.bet_amount,
      });

      // Setup transactions
      newTransactionC = new GameTransaction({
        user: roomInfo['creator'],
        amount: 0,
        description: 'Exit liquidity received in ' + roomInfo['name'],
        room: req.body._id,
      });

      newTransactionJ = new GameTransaction({
        user: user,
        amount: 0,
        description: 'Joined ' + roomInfo['name'],
        room: req.body._id,
      });

      // Create notification template
      message = new Notification({
        from: user,
        to: roomInfo['creator'],
        room: req.body._id,
        amount: 0,
        message: '',
        is_read: false,
      });

      // Process Custom game (only game type supported now)
      if (roomInfo['game_type']['game_type_name'] === 'Custom') {
        // Validate bet amount for Custom game
        if (
          bet_amount > roomInfo['user_bet'] ||
          bet_amount > parseFloat(user.balance)
        ) {
          return {
            success: false,
            message: 'Bet amount exceeds available balance.',
          };
        }

        const customResult = await processCustomGame(
          req,
          user,
          roomInfo,
          bet_amount,
          tax,
          newTransactionJ,
          newGameLog
        );

        game_result = customResult.game_result;
        newTransactionAmount = customResult.newTransactionAmount;
        bet_item = customResult.bet_item;
        pool_id = customResult.pool_id;
        message = customResult.message;
      } else {
        // Unsupported game type
        return {
          success: false,
          message: 'Unsupported game type',
          betResult: -100,
        };
      }

      // Update room and emit candle data
      await updateRoomAndEmitData(roomInfo, user, newTransactionAmount, req);

      // Update user stats
      user.gamePlayed++;
      user.gameProfit += newTransactionAmount;
      user.totalWagered += Math.abs(bet_item.bet_amount);

console.log(`User winning`, newTransactionAmount, req.body.connectedAccount);
      if (newTransactionAmount > 0 && req.body.connectedAccount) {
        // Validate deposit transaction (check both pending and completed)
        const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
        const depositTransaction = await GameTransaction.findOne({
          user: user._id,
          room: req.body._id,
          status: { $in: ['pending', 'completed'] },
          description: { $regex: '^(Joined)', $options: 'i' },
          created_at: { $gte: fifteenMinutesAgo },
        });

        if (!depositTransaction) {
          console.warn(
            `No valid deposit (pending or completed) for user ${user._id}, room ${req.body._id}`
          );
          return {
            success: false,
            message:
              'No valid SOL deposit found within the last 15 minutes for this room. Please wait for your deposit to process and try again.',
            betResult: -1000,
          };
        }

        // Validate connectedAccount as a Solana address
        try {
          new PublicKey(req.body.connectedAccount);
        } catch (error) {
          throw new Error('Invalid Solana wallet address');
        }
console.log(`Processing winnings for user ${user._id} in room ${req.body._id} with amount ${newTransactionAmount}`);
        // Create a pending GameTransaction for the winnings
        const newGameTransaction = new GameTransaction({
          user: user._id,
          amount: newTransactionAmount,
          description: `Winnings in ${roomInfo.name}`,
          room: req.body._id,
          status: 'pending',
          connectedAccount: req.body.connectedAccount,
        });
        await saveDocumentWithRetry(newGameTransaction);
      }

      // Update host stats
      const host = await User.findOne({ _id: roomInfo['creator'] });
      if (host) {
        host.gamePlayed++;
        host.gameProfit += newTransactionAmount * -1;
        host.totalWagered += Math.abs(bet_item.bet_amount);
      }

      // Process host payouts
      await processHostPayouts(roomInfo, newTransactionC, user, req);

      // Handle notifications
      await handleNotificationsAndTransactions(
        user,
        roomInfo,
        newTransactionAmount,
        message,
        req
      );

      // Save updated documents
      const requiredIds = [
        '65eafc72aea25957ac8ea60d',
        '65eafa5caea25957ac8ea60b',
        '62b9ef88a5409449f63f7ccb',
        '65eafb7daea25957ac8ea60c',
      ];

      const shouldSave = roomInfo.joiners.some((joiner) =>
        requiredIds.includes(String(joiner))
      );

      if (!shouldSave) {
        await Promise.all([
          saveDocumentWithRetry(user),
          saveDocumentWithRetry(roomInfo),
          host ? saveDocumentWithRetry(host) : Promise.resolve(),
          saveDocumentWithRetry(newGameLog),
        ]);
      }

      // Get and emit game log
      const gameLogList = await GameLog.find({ room: roomInfo._id })
        .sort({ created_at: 'desc' })
        .limit(1)
        .populate({
          path: 'room',
          model: Room,
          select:
            '_id winnings ticker image commission username creator status hosts room_number game_type bet_amount user_bet host_pr created_at',
        })
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'short_name game_type_name',
        })
        .populate({
          path: 'creator',
          model: User,
          select: '_id avatar username accessory elite totalWagered',
        })
        .populate({
          path: 'joined_user',
          model: User,
          select: '_id avatar username accessory elite totalWagered',
        });

      const newLog = await convertGameLogToHistoryStyle(gameLogList);
      if (req.io && req.io.sockets) {
        req.io.sockets.emit('NEW_LOG', { newLog });
      }

      // Save joiner transaction
      if (newTransactionAmount !== 0) {
        newTransactionJ.amount = newTransactionAmount;
        // await saveDocumentWithRetry(newTransactionJ);
      }

      // Return response data
      responseData = {
        success: true,
        message: newTransactionAmount > 0
          ? 'Successful bet! Winnings transfer is queued and will be processed shortly.'
          : 'Successful bet!',
        betResult: game_result,
        newTransaction: newTransactionJ,
        roomStatus: roomInfo.status,
        pool_id: pool_id,
      };
      return responseData;
    }
  } catch (err) {
    console.error('Error executing bet:', err);
    return {
      success: false,
      message: err.message || 'Error executing bet',
      betResult: -1000,
    };
  }
};

// Queue processing function
const executeBet3 = (req, bot = false) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ req, bot, resolve, reject });
    if (requestQueue.length === 1) {
      processQueue();
    }
  });
};

// Process queue with concurrency control
const processQueue = async () => {
  const BATCH_SIZE = 1; // Process one at a time to maintain original behavior

  while (requestQueue.length > 0) {
    const batch = requestQueue.splice(0, BATCH_SIZE);

    await Promise.all(batch.map(async ({ req, bot, resolve, reject }) => {
      try {
        const result = await addToQueue(req, bot);
        resolve(result);
      } catch (error) {
        console.error('Queue processing error:', error);
        reject(error);
      }
    }));
  }
};

module.exports = executeBet3;