// betExecutor.js
const ObjectId = require('mongoose').Types.ObjectId;
const { Keypair, PublicKey } = require('@solana/web3.js');
const { BN } = require('bn.js');
const SystemSetting = require('../../model/SystemSetting');
const User = require('../../model/User');
const GameType = require('../../model/GameType');
const Room = require('../../model/Room');
const Notification = require('../../model/Notification');
const RpsBetItem = require('../../model/RpsBetItem');
const QsBetItem = require('../../model/QsBetItem');
const Transaction = require('../../model/Transaction');
const GameLog = require('../../model/GameLog');
const socket = require('../../socketController');
const { setTimeout } = require('timers/promises');
const moment = require('moment');
const {
  convertGameLogToHistoryStyle,
} = require('./convertGameLogToHistoryStyle');
const check_access_time = require('../../helper/util/checkAccessTime');
const {
  predictNext,
  reinforcementAI,
  predictNextOpenAI,
} = require('./predictNext');
const {
  getRandomItem_qs,
  predictNextQs,
  reinforcementAI_qs,
  openAIPredictionAI_qs,
} = require('./predictNextQs');
const saveDocumentWithRetry = require('./retrySave');
const { mintTokenWithMetadata } = require('./mintTokenWithMetadata');
const { wallet, connection } = require('./config');
const { createAmmPool } = require('./createPool');
const { createMarket } = require('./createMarket');
const { addLiquidity } = require('./addLiquidity');
// const { getWalletTokenAccount } = require('./util');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');
const { Market } = require('@project-serum/serum');
const { revokeMintAndFreezeAuthorities } = require('./authority');
const { distributeTokens } = require('./distributeTokens');

const requestQueue = [];

const addToQueue = async (req, bot = false) => {
  try {
    const taxPromise = SystemSetting.findOne({ name: 'commission' });
    const platformPromise = SystemSetting.findOne({ name: 'platform_betting' });
    const [tax, platform] = await Promise.all([taxPromise, platformPromise]);

    let responseData = {};
    let gameLogArray = [];
    let user;
    let game_result;
    let pool_id = '';
    let bet_item;
    let roomInfo;
    let newTransactionAmount = 0;
    let newTransactionJ = new Transaction({
      user: '',
      amount: 0,
      description: '',
      room: req.body._id,
    });
    if (bot) {
      return responseData;
    } else {
      user = req.user;
    }

    if (req.body._id) {
      if (user.dailyWithdrawals > 4.269) {
        responseData = {
          success: false,
          message: 'illregular action',
          betResult: -1000,
        };

        return responseData;
      }

      if (parseFloat(req.body.bet_amount) < 0.0005) {
        responseData = {
          success: false,
          message: 'MEOWNIMUM BET IS 0.0005 SOL',
        };
        return responseData;
      }
      let betAmount = parseFloat(req.body.bet_amount);

      roomInfo = await Room.findOne({ _id: req.body._id })
        .select(
          'name image tax ticker prompt room_number updated_at battles selectedStrategy qs_game_type game_type rps_game_type joiners creator bet_amount user_bet pr host_pr endgame_type endgame_amount is_private room_password status hosts',
        )
        .populate({
          path: 'creator',
          model: User,
          select:
            '_id avatar accessory totalWagered username gameProfit gamePlayed balance ', // Only select the 'username' field from the 'User' document
        })
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'game_type_name short_name',
        });

      if (
        roomInfo['creator'] &&
        roomInfo['creator']._id &&
        user &&
        user._id &&
        roomInfo['creator']._id.toString() === user._id.toString()
      ) {
        responseData = {
          success: false,
          message: `YOU'VE CAT TO BE KITTEN ME! DIS YOUR OWN GAME!`,
          betResult: -101,
        };
        return responseData;
      }

      const tenSecondsAgo = new Date(Date.now() - 500);
      if (roomInfo['updated_at'] > tenSecondsAgo) {
        responseData = {
          success: false,
          message: 'ROOM TOO BUSY, TRY AGAIN LATER',
          betResult: -1200,
        };
        return responseData;
      }

      const accessAllowed = await check_access_time(req.user._id);
      if (!accessAllowed) {
        responseData = {
          success: false,
          message: 'SLOW TF DOWN!!',
          betResult: -100
        };
        return responseData;
      }

      if (roomInfo['status'] === 'finished') {
        responseData = {
          success: false,
          message: 'THIS GAME HAS NOW ENDED',
          betResult: -100,
        };
        return responseData;
      }

      const commission = roomInfo['tax'] + tax.value;

      newGameLog = new GameLog({
        room: roomInfo,
        creator: roomInfo['creator'],
        joined_user: user,
        game_type: roomInfo['game_type'],
        bet_amount: req.body.bet_amount,
      });

      newTransactionC = new Transaction({
        user: roomInfo['creator'],
        amount: 0,
        description:
          'auto-payout in ' +
          roomInfo['game_type']['short_name'] +
          '-' +
          roomInfo['room_number'],
        room: req.body._id,
      });
      newTransactionJ = new Transaction({
        user: user,
        amount: 0,
        description:
          'Joined ' +
          roomInfo['name'],
        room: req.body._id,
      });

      let message = new Notification({
        from: user,
        to: roomInfo['creator'],
        room: req.body._id,
        amount: 0,
        message: '',
        is_read: false,
      });

      if (roomInfo['game_type']['game_type_name'] === 'RPS') {
        if (
          betAmount > roomInfo['user_bet'] ||
          betAmount > parseFloat(user.balance)
        ) {
          if (bot) {
            betAmount =
              betAmount > roomInfo['user_bet']
                ? roomInfo['user_bet']
                : parseFloat(user.balance);
          } else {
            responseData = {
              success: false,
              message: 'Bet amount exceeds available balance.',
            };
            return responseData;
          }
        }

        newGameLog.bet_amount = betAmount;
        const availableBetItem = await RpsBetItem.findOne({
          room: req.body._id,
          // joiner: user._id,
          joiner_rps: '',
        });
        bet_item = availableBetItem;

        const reversedBetItems = await RpsBetItem.find({
          room: new ObjectId(req.body._id),
          joiner: user._id,
          joiner_rps: { $ne: null },
        })
          .sort({ created_at: -1 })
          .limit(50);

        // Create a copy of the array and reverse the copy
        const allBetItems = [...reversedBetItems].reverse();
        const mostRecentItems = reversedBetItems.slice(0, 4);
        // if no more items, create a new one
        if (!bet_item && roomInfo['rps_game_type'] === 0) {
          let nextItem;
          switch (roomInfo['selectedStrategy']) {
            case 'Markov':
              nextItem = await getNextItemUsingMarkov(allBetItems);
              break;
            case 'GPT3':
              nextItem = await predictNextOpenAI(
                allBetItems,
                roomInfo['prompt'] ??
                'You are an expert in Rock Paper Scissors.',
              );
              break;
            default:
              const move = await reinforcementAI(allBetItems);
              nextItem = move.move;
              break;
          }
          bet_item = new RpsBetItem({
            room: new ObjectId(req.body._id),
            rps: nextItem,
            bet_amount: betAmount,
          });
          function getRandomItem() {
            const rpsOptions = ['R', 'P', 'S'];
            return rpsOptions[Math.floor(Math.random() * 3)];
          }

          async function getNextItemUsingMarkov(allBetItems) {
            if (allBetItems.length <= 3) {
              return getRandomItem();
            }

            const transformedItems = allBetItems.map((item) => ({
              rps: item.joiner_rps,
            }));
            const nextItem = await predictNext(transformedItems, true);
            return nextItem;
          }
        }

        newGameLog.selected_rps = req.body.selected_rps;

        if (roomInfo['rps_game_type'] === 0) {
          // deduct the joiner's bet
          newTransactionAmount -= betAmount;

          // if win
          if (
            (bet_item.rps === 'R' && req.body.selected_rps === 'P') ||
            (bet_item.rps === 'P' && req.body.selected_rps === 'S') ||
            (bet_item.rps === 'S' && req.body.selected_rps === 'R')
          ) {
            game_result = 1;
            newTransactionAmount += betAmount * 2 * ((100 - commission) / 100);

            newGameLog.commission = betAmount * 2 * (roomInfo['tax'] / 100);

            // update platform earnings (0.5%)
            platform.value = platform.value + betAmount * 2 * (tax.value / 100);

            // update bankroll
            roomInfo['user_bet'] = roomInfo['user_bet'];

            roomInfo['host_pr'] -= betAmount;
            roomInfo['user_bet'] -= betAmount;
            roomInfo['user_bet'] =
              roomInfo['user_bet'] + betAmount * 2 * (commission / 100);
            roomInfo['host_pr'] =
              roomInfo['host_pr'] + betAmount * 2 * (commission / 100);

            // send notification
            message.message =
              'Won in ' +
              roomInfo['name'];
            message.amount = req.body.bet_amount * 2;

            // if draw
          } else if (bet_item.rps === req.body.selected_rps) {
            game_result = 0;

            roomInfo['user_bet'] =
              roomInfo['user_bet'] - betAmount * (tax.value / 100);
            roomInfo['host_pr'] =
              roomInfo['host_pr'] - betAmount * (tax.value / 100);

            newTransactionAmount += betAmount - betAmount * (tax.value / 100);

            message.message =
              'Split in ' +
              roomInfo['name'];

            message.amount = req.body.bet_amount * 2;
            // update platform stat (0.5%)
            platform.value = platform.value + betAmount * 2 * (tax.value / 100);

            // if loss
          } else {
            game_result = -1;

            // update bankroll & other
            roomInfo['host_pr'] =
              (roomInfo['host_pr'] || 0) +
              betAmount * 2 * ((100 - tax.value) / 100) -
              betAmount;
            roomInfo['user_bet'] =
              (roomInfo['user_bet'] || 0) +
              betAmount * 2 * ((100 - tax.value) / 100) -
              betAmount;

            platform.value =
              parseFloat(platform.value) + betAmount * 2 * (tax.value / 100);

            if (
              roomInfo['endgame_type'] &&
              roomInfo['user_bet'] >= roomInfo['endgame_amount']
            ) {
              try {
                roomInfo.status = 'finished';
                if (req.io.sockets) {
                  req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
                }
                await saveDocumentWithRetry(roomInfo);
                const myMintPk = await mintTokenWithMetadata(roomInfo);
                const realBasePublicKey = new PublicKey(myMintPk);
                // const realBasePublicKey = new PublicKey(
                //   '4F5RbTrB35xMp816kYTazCM1H4ohLSJ2rVtuRyjcRRnz',
                // );
                await setTimeout(15000);

                console.log('----mint publickey:', realBasePublicKey);
                const wsolMintPk = new PublicKey(
                  'So11111111111111111111111111111111111111112',
                );
                console.log('----wsolMintPk publickey:', wsolMintPk);
                await setTimeout(10000);

                const marketId = await createMarket(
                  realBasePublicKey,
                  wsolMintPk,
                );
                // const marketId = new PublicKey(
                //   '33gVpPhJAm4f2p7EWMEMXuHrusTQCbkv2Q1coNrFEYTL',
                // );

                await setTimeout(15000);

                const ammId = await createAmmPool(marketId);
                // const ammId = new PublicKey(
                //   'BNR18d22wYLSaSQ8gKAQxP63XkDkW7WS9rwKinSCUKXs',
                // );
                console.log('Pool creation ammId:', ammId);

                await setTimeout(20000);

                // const addTxids = await addLiquidity(ammId);
                // console.log('Add Liquidity txids:', addTxids);
                // await setTimeout(10000);

                await distributeTokens(realBasePublicKey, roomInfo['hosts']);
                await setTimeout(10000);

                const revokeTx =
                  await revokeMintAndFreezeAuthorities(realBasePublicKey);
                pool_id = ammId.toBase58();
              } catch (e) {
                pool_id = '';
              }

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

              saveDocumentWithRetry(newGameLogC);
            }

            message.message =
              'Lost in ' +
              roomInfo['name'];

            message.amount = req.body.bet_amount;
          }
          newGameLog.winnings = req.body.bet_amount * 2;
        }
        if (roomInfo['rps_game_type'] === 0) {
          winnings = betAmount * 2;
        }

        newGameLog.winnings = winnings;
        newGameLog.game_result = game_result;
        newGameLog.endgame_amount = roomInfo['endgame_amount'];

        bet_item.joiner = user._id;
        bet_item.joiner_rps = req.body.selected_rps;
        bet_item.bet_amount = betAmount;

        await saveDocumentWithRetry(bet_item);

        if (roomInfo['rps_game_type'] === 0) {
          mostRecentItems.reverse();
          mostRecentItems.push(bet_item);
          if (mostRecentItems.length > 0) {
            if (req.io.sockets) {
              const payload = {
                bankroll: roomInfo['user_bet'],
                host_pr: roomInfo['host_pr'],
                rps: mostRecentItems,
                room: roomInfo._id,
                user: user,
              };

              // If pool_id exists (not empty or null), include it in the payload
              if (pool_id) {
                payload.pool_id = pool_id;
              }

              req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, payload);
            }
          } else {
            responseData = {
              success: false,
              message: 'irregular action',
              betResult: -3000,
            };
            return responseData;
          }
        }
        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          if (req.io.sockets) {
            req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
          }
          game_result = 1;
          message.message =
            'Won in ' +
            roomInfo['name'];
          message.amount = roomInfo['host_pr'] + roomInfo['bet_amount'];
        }
      } else if (roomInfo['game_type']['game_type_name'] === 'Quick Shoot') {
        if (
          parseFloat(req.body.bet_amount) / (roomInfo['qs_game_type'] - 1) +
          parseFloat(req.body.bet_amount) -
          (roomInfo['qs_game_type'] - 1) * roomInfo['user_bet'] >
          roomInfo['user_bet'] ||
          parseFloat(req.body.bet_amount) > parseFloat(req.user.balance)
        ) {
          responseData = {
            success: false,
            message: 'Bet amount exceeds available balance.',
            betResult: -1000,
          };

          return responseData;
        }

        newGameLog.bet_amount = parseFloat(req.body.bet_amount);

        const availableBetItem = await QsBetItem.findOne({
          _id: req.body._id,
          joiner_qs: '',
        });
        bet_item = availableBetItem;

        const reversedBetItems = await QsBetItem.find({
          room: new ObjectId(req.body._id),
          joiner: user._id,
          joiner_qs: { $ne: null },
        })
          .sort({ created_at: -1 })
          .limit(50);

        const allBetItems = [...reversedBetItems].reverse();
        const mostRecentItems = reversedBetItems.slice(0, 4);

        if (!bet_item) {
          let nextItem;
          // console.log('---room method---', roomInfo['selectedStrategy']);
          switch (roomInfo['selectedStrategy']) {
            case 'Markov':
              nextItem = await getNextItemUsingMarkov_qs(
                allBetItems,
                roomInfo['qs_game_type'],
              );
              break;
            case 'GPT3':
              nextItem = await openAIPredictionAI_qs(
                allBetItems,
                roomInfo['qs_game_type'],
              );
              break;
            default:
              const move = await reinforcementAI_qs(
                allBetItems,
                roomInfo['qs_game_type'],
              );
              nextItem = move.move;
              break;
          }
          bet_item = new QsBetItem({
            room: new ObjectId(req.body._id),
            qs: nextItem,
            bet_amount: betAmount,
          });

          async function getNextItemUsingMarkov_qs(allBetItems, gameType) {
            if (allBetItems.length <= 3) {
              return getRandomItem_qs(roomInfo['qs_game_type']);
            }

            const transformedItems = allBetItems.map((item) => ({
              qs: item.joiner_qs,
            }));
            const nextItem = await predictNextQs(transformedItems, gameType);
            return nextItem;
          }
        }

        newGameLog.selected_qs_position = req.body.selected_qs_position;

        // deduct the joiner's bet
        newTransactionAmount -= betAmount;
        roomInfo['user_bet'] = roomInfo['user_bet'];
        if (Number(bet_item.qs) === req.body.selected_qs_position) {
          game_result = -1;

          roomInfo['user_bet'] =
            roomInfo['user_bet'] + parseFloat(req.body.bet_amount);
          roomInfo['host_pr'] =
            roomInfo['host_pr'] + parseFloat(req.body.bet_amount);
          if (
            roomInfo['endgame_type'] &&
            roomInfo['user_bet'] >= roomInfo['endgame_amount']
          ) {
            try {
              roomInfo.status = 'finished';
              if (req.io.sockets) {
                req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
              }
              await saveDocumentWithRetry(roomInfo);
              const myMintPk = await mintTokenWithMetadata(roomInfo);
              const realBasePublicKey = new PublicKey(myMintPk);
              // const realBasePublicKey = new PublicKey(
              //   '4F5RbTrB35xMp816kYTazCM1H4ohLSJ2rVtuRyjcRRnz',
              // );
              await setTimeout(15000);

              console.log('----mint publickey:', realBasePublicKey);
              const wsolMintPk = new PublicKey(
                'So11111111111111111111111111111111111111112',
              );
              console.log('----wsolMintPk publickey:', wsolMintPk);
              await setTimeout(10000);

              const marketId = await createMarket(
                realBasePublicKey,
                wsolMintPk,
              );
              // const marketId = new PublicKey(
              //   '33gVpPhJAm4f2p7EWMEMXuHrusTQCbkv2Q1coNrFEYTL',
              // );

              await setTimeout(15000);

              const ammId = await createAmmPool(marketId);
              // const ammId = new PublicKey(
              //   'BNR18d22wYLSaSQ8gKAQxP63XkDkW7WS9rwKinSCUKXs',
              // );
              console.log('Pool creation ammId:', ammId);

              await setTimeout(20000);

              // const addTxids = await addLiquidity(ammId);
              // console.log('Add Liquidity txids:', addTxids);
              // await setTimeout(10000);

              await distributeTokens(realBasePublicKey, roomInfo['hosts']);
              await setTimeout(10000);

              const revokeTx =
                await revokeMintAndFreezeAuthorities(realBasePublicKey);
              pool_id = ammId.toBase58();
            } catch (e) {
              pool_id = '';
            }

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

            saveDocumentWithRetry(newGameLogC);
          }

          bet_item.joiner = req.user._id;
          bet_item.joiner_qs = req.body.selected_qs_position;

          message.message =
            'Lost in ' +
            roomInfo['name'];
          message.amount = req.body.bet_amount;
        } else {
          game_result = 1;
          newTransactionAmount +=
            (betAmount + betAmount / (roomInfo['qs_game_type'] - 1)) *
            ((100 - commission) / 100);
          roomInfo['host_pr'] -=
            (betAmount + betAmount / (roomInfo['qs_game_type'] - 1)) *
            ((100 - commission) / 100) -
            betAmount;
          roomInfo['user_bet'] -=
            (betAmount + betAmount / (roomInfo['qs_game_type'] - 1)) *
            ((100 - commission) / 100) -
            betAmount;
          newGameLog.commission =
            (betAmount + betAmount / (roomInfo['qs_game_type'] - 1)) *
            (roomInfo['tax'] / 100);

          platform.value =
            platform.value +
            (betAmount + betAmount / (roomInfo['qs_game_type'] - 1)) *
            (tax.value / 100);

          message.message =
            'Won in ' +
            roomInfo['name'];

          message.amount = betAmount / parseFloat(roomInfo['qs_game_type'] - 1) +
            betAmount;

        }

        bet_item.joiner = req.user._id;
        bet_item.joiner_qs = req.body.selected_qs_position;
        bet_item.bet_amount = betAmount;
        await saveDocumentWithRetry(bet_item);

        newGameLog.qs_game_type = parseFloat(roomInfo.qs_game_type);
        newGameLog.winnings = newTransactionAmount;
        newGameLog.game_result = game_result;
        newGameLog.endgame_amount = roomInfo['endgame_amount'];

        mostRecentItems.reverse();
        mostRecentItems.push(bet_item);
        if (mostRecentItems.length > 0) {
          if (req.io.sockets) {
            const payload = {
              bankroll: roomInfo['user_bet'],
              host_pr: roomInfo['host_pr'],
              qs: mostRecentItems,
              room: roomInfo._id,
              user: user,
            };

            // If pool_id exists (not empty or null), include it in the payload
            if (pool_id) {
              payload.pool_id = pool_id;
            }

            req.io.sockets.emit(`UPDATED_BANKROLL_${roomInfo._id}`, payload);
          }
        } else {
          responseData = {
            success: false,
            message: 'irregular action',
            betResult: -3000,
          };
          return responseData;
        }

        if (roomInfo['user_bet'] <= 0.0005) {
          roomInfo.status = 'finished';
          if (req.io.sockets) {
            req.io.sockets.emit('ROOM_ENDED', { roomId: roomInfo._id });
          }
          game_result = 1;
          message.message =
            'Won in ' +
            roomInfo['name'];

          message.amount = roomInfo['host_pr'] + roomInfo['bet_amount'];
        }
      }

      const now = new Date();

      const timeBucket = Math.floor(now.getTime() / (60 * 1000));
      const isBuyTransaction = newTransactionAmount < 0;
      const newCandle = {
        _id: timeBucket,
        open: roomInfo.user_bet + newTransactionAmount,
        close: roomInfo.user_bet,
        high: Math.max(
          roomInfo.user_bet,
          roomInfo.user_bet + newTransactionAmount,
        ),
        low: Math.min(
          roomInfo.user_bet,
          roomInfo.user_bet + newTransactionAmount,
        ),
        volume: Math.abs(newTransactionAmount),
        buyVolume: isBuyTransaction ? Math.abs(newTransactionAmount) : 0,
        sellVolume: isBuyTransaction ? 0 : Math.abs(newTransactionAmount),
        startTime: new Date(timeBucket * 60 * 1000),
      };

      if (req.io.sockets) {
        req.io.sockets.emit(`NEW_CANDLE_${roomInfo._id}`, {
          newCandle: newCandle,
        });
      }

      user['balance'] += newTransactionAmount;
      user['gamePlayed']++;
      user['gameProfit'] += newTransactionAmount;
      user['totalWagered'] += Math.abs(bet_item.bet_amount);

      const host = await User.findOne({ _id: roomInfo['creator'] });
      if (host) {
        host.gamePlayed++;
        host.gameProfit += newTransactionAmount * -1;
        host.totalWagered += Math.abs(bet_item.bet_amount);
      }

      if (roomInfo.hosts[0].share === 100) {
        let notification = new Notification({
          from: user._id,
          to: roomInfo['creator'],
          room: req.body._id,
          message: '',
          is_read: false,
        });
        notification.from = roomInfo['creator']._id;
        notification.to = roomInfo['creator']._id;
        notification.message =
          'Hosting ' +
          newTransactionC.amount +
          ' auto-payout in ' +
          roomInfo.game_type.short_name +
          '-' +
          roomInfo.room_number;
        notification.amount = newTransactionC.amount;

        const notificationData = {
          _id: roomInfo['creator']._id,
          message: notification.message,
          username: roomInfo['creator'].username,
          amount: newTransactionC.amount,
          avatar: roomInfo['creator'].avatar,
          accessory: roomInfo['creator'].accessory,
          room: req.body._id,
          rank: roomInfo['creator'].totalWagered,
          created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          created_at_str: moment(new Date()).format('LLL'),
          updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          is_read: false,
        };

        if (notification.message !== '' && newTransactionC.amount !== 0) {
          try {
            await saveDocumentWithRetry(notification);
            socket.sendNotification(roomInfo['creator']._id, notificationData);
          } catch (error) {
            console.error('Error saving notification:', error);
          }
        }

        if (newTransactionC.amount !== 0) {
          try {
            saveDocumentWithRetry(newTransactionC);

            if (host) {
              try {
                host.balance += newTransactionC.amount;
                host.gameProfit += newTransactionC.amount;
              } catch (error) {
                console.error('Error saving host:', error);
              }
            }
          } catch (error) {
            console.error('Error saving newTransactionC', error);
          }
          socket.newTransaction(newTransactionC);
        }
      } else {
        roomInfo.hosts.forEach(async (host) => {
          let notification = new Notification({
            from: user._id,
            to: roomInfo['creator'],
            room: req.body._id,
            message: '',
            is_read: false,
          });

          const amountForHost = (host.share / 100) * newTransactionC.amount;
          const newTransactionForHost = new Transaction({
            user: host.host,
            amount: amountForHost,
            description:
              'Co-Hosting auto-payout in ' +
              roomInfo.game_type.short_name +
              '-' +
              roomInfo.room_number,
            room: req.body._id,
          });
          if (newTransactionForHost.amount !== 0) {
            try {
              saveDocumentWithRetry(newTransactionForHost);
              socket.newTransaction(newTransactionForHost);
            } catch (error) {
              console.error('Error saving new transaction:', error);
            }
          }
          const coHost = await User.findOne({ _id: host.host });

          if (coHost) {
            coHost.balance += amountForHost;
            try {
              saveDocumentWithRetry(coHost);
            } catch (error) {
              console.error('Error saving user:', error);
            }
          }

          notification.from = roomInfo['creator'];
          notification.to = host.host;
          notification.message =
            'Co-Hosting ' +
            amountForHost +
            ' auto-payout in ' +
            roomInfo.game_type.short_name +
            '-' +
            roomInfo.room_number;
          notification.amount = amountForHost;

          const notificationData = {
            _id: roomInfo['creator']._id,
            message: notification.message,
            username: roomInfo['creator'].username,
            avatar: roomInfo['creator'].avatar,
            amount: amountForHost,
            accessory: roomInfo['creator'].accessory,
            room: req.body._id,
            rank: roomInfo['creator'].totalWagered,
            created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            created_at_str: moment(new Date()).format('LLL'),
            updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            is_read: false,
          };

          if (notification.message !== '' && amountForHost !== 0) {
            try {
              await saveDocumentWithRetry(notification);
              socket.sendNotification(host.host, notificationData);
            } catch (error) {
              console.error('Error saving notification:', error);
            }
          }
        });
      }

      const requiredIds = [
        '65eafc72aea25957ac8ea60d',
        '65eafa5caea25957ac8ea60b',
        '62b9ef88a5409449f63f7ccb',
        '65eafb7daea25957ac8ea60c',
      ];

      const shouldSave = roomInfo.joiners.some((joiner) =>
        requiredIds.includes(String(joiner)),
      );

      if (!roomInfo.joiners.includes(user._id)) {
        roomInfo.joiners.push(user._id);
      }
      roomInfo.battles = roomInfo.battles + 1;
      roomInfo.updated_at = moment().format('YYYY-MM-DD HH:mm:ss');
      if (pool_id) {
        roomInfo.pool_id = pool_id;
      }
      if (!shouldSave) {
        try {
          Promise.all([
            saveDocumentWithRetry(platform),
            await saveDocumentWithRetry(user),
            await saveDocumentWithRetry(roomInfo),
            saveDocumentWithRetry(host),
            await saveDocumentWithRetry(newGameLog),
          ]);
        } catch (error) {
          console.error('Error saving', error);
        }
      }

      let gameLogQuery = GameLog.find({ room: roomInfo._id })
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
          select: '_id avatar username accessory totalWagered',
        })
        .populate({
          path: 'joined_user',
          model: User,
          select: '_id avatar username accessory totalWagered',
        });

      const gameLogList = await gameLogQuery;

      const newLog = await convertGameLogToHistoryStyle(gameLogList);
      req.io.sockets.emit('NEW_LOG', { newLog });

      const notificationData = {
        _id: user._id,
        message: message.message,
        username: user.username,
        avatar: user.avatar,
        amount: newTransactionAmount,
        accessory: user.accessory,
        room: req.body._id,
        rank: user.totalWagered,
        created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        created_at_str: moment(new Date()).format('LLL'),
        updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };

      if (message.message !== '' && message.from._id !== message.to._id) {
        try {
          await saveDocumentWithRetry(message);
          socket.sendNotification(message.to._id, notificationData);
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
      user = null;
      bet_item = null;
    }

    if (newTransactionAmount !== 0) {
      try {
        newTransactionJ.amount = newTransactionAmount;
        saveDocumentWithRetry(newTransactionJ);
      } catch (error) {
        console.error('Error saving newTransactionJ', error);
      }
    }
    responseData = {
      success: true,
      message: 'successful bet',
      betResult: game_result,
      newTransaction: newTransactionJ,
      roomStatus: roomInfo.status,
      pool_id: pool_id,
    };

    return responseData;
  } catch (err) {
    console.error(err);
    throw new Error('Error executing bet');
  }
};

const executeBet3 = (req, bot = false) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ req, bot, resolve, reject });
    if (requestQueue.length === 1) {
      processQueue();
    }
  });
};

const processQueue = async () => {
  if (requestQueue.length > 0) {
    const { req, bot, resolve, reject } = requestQueue[0];
    try {
      const result = await addToQueue(req, bot);
      resolve(result);
    } catch (error) {
      reject(error);
    }
    requestQueue.shift();
    processQueue();
  }
};
module.exports = executeBet3;
