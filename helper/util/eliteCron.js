const cron = require('node-cron');
const Room = require('../../model/Room');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const socketController = require('../../socketController');
const SystemSetting = require('../../model/SystemSetting');
const moment = require('moment');
const Notification = require('../../model/Notification');
const saveDocumentWithRetry = require('./retrySave');
const Loan = require('../../model/Loan'); // Assuming this exists

let socketio = null;

async function checkSubscriptionPayments(io) {
  try {
    if (io) {
      socketio = io;
    }

    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_elite' });

    if (!systemSetting) {
      systemSetting = new SystemSetting({
        name: 'last_updated_elite',
        value: 0,
        updated_at: new Date()
      });
      await systemSetting.save();
    }

    const lastUpdated = systemSetting.updated_at;
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    if (lastUpdated <= twentyFourHoursAgo) {

      const eliteUsers = await User.find({ 
        elite: { $ne: "" },
        last_elite_payment: { $exists: true }
      });


      for (const user of eliteUsers) {
        const currentDate = new Date();
        const lastPaymentDate = new Date(user.last_elite_payment);
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(currentDate.getMonth() - 1);

        if (lastPaymentDate <= oneMonthAgo) {

          const subscriptionAmount = user.elite === 'red' ? 0.1 : 1.0;

          if (user.balance >= subscriptionAmount) {
            user.balance -= subscriptionAmount;
            user.last_elite_payment = new Date();

            const subscriptionTransaction = new Transaction({
              user: user._id,
              amount: -subscriptionAmount,
              description: `${user.elite.charAt(0).toUpperCase() + user.elite.slice(1)} Elite Subscription Payment`,
            });

            const notification = new Notification({
              from: user._id,
              to: user._id,
              room: null,
              message: `Elite subscription payment processed for ${user.elite} tier`,
              amount: -subscriptionAmount,
              is_read: false
            });

            const notificationData = {
              message: notification.message,
              username: user.username,
              avatar: user.avatar,
              accessory: user.accessory,
              elite: user.elite,
              amount: -subscriptionAmount,
              rank: user.totalWagered || 0,
              created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              created_at_str: moment(new Date()).format('LLL'),
              updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            };

            try {
              await saveDocumentWithRetry(notification);
              socketController.sendNotification(user._id, notificationData);
              await saveDocumentWithRetry(subscriptionTransaction);
              await user.save();
              console.log(`✅ Successfully processed subscription payment for ${user.username}`);
            } catch (error) {
              console.error(`Error saving subscription payment data for ${user.username}:`, error);
            }
          } else {
            console.log(`⚠️ Insufficient balance for user ${user.username}, cancelling elite status`);

            const previousElite = user.elite;
            user.elite = "";

            const notification = new Notification({
              from: user._id,
              to: user._id,
              room: null,
              message: `Your ${previousElite} elite subscription has been cancelled due to insufficient funds`,
              is_read: false
            });

            const notificationData = {
              message: notification.message,
              username: user.username,
              avatar: user.avatar,
              accessory: user.accessory,
              elite: "",
              rank: user.totalWagered || 0,
              created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              created_at_str: moment(new Date()).format('LLL'),
              updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
            };

            const userRooms = await Room.find({ 
              creator: user._id,
              status: 'open'
            });

            if (userRooms.length > 0) {
              console.log(`Pausing ${userRooms.length} rooms for user ${user.username}`);
              for (const room of userRooms) {
                room.status = 'paused';
                await room.save();

                const roomNotification = new Notification({
                  from: user._id,
                  to: user._id,
                  room: room._id,
                  message: `Room "${room.name}" has been paused due to expired elite subscription`,
                  is_read: false
                });

                await saveDocumentWithRetry(roomNotification);
              }
            }

            try {
              const activeLoans = await Loan.find({
                user: user._id,
                active: true
              });

              if (activeLoans.length > 0) {
                console.log(`Deactivating ${activeLoans.length} loans for user ${user.username}`);
                for (const loan of activeLoans) {
                  loan.active = false;
                  await loan.save();

                  const loanNotification = new Notification({
                    from: user._id,
                    to: user._id,
                    message: `Loan #${loan._id} has been deactivated due to expired elite subscription`,
                    is_read: false
                  });

                  await saveDocumentWithRetry(loanNotification);
                }
              }
            } catch (error) {
              console.error("Error processing loans:", error);
            }

            try {
              await saveDocumentWithRetry(notification);
              socketController.sendNotification(user._id, notificationData);
              await user.save();
              console.log(`✅ Successfully cancelled elite status for ${user.username}`);
            } catch (error) {
              console.error(`Error saving cancellation data for ${user.username}:`, error);
            }
          }
        } else {
          console.log(`User ${user.username} is within the 30-day elite subscription period. Reactivating rooms and loans if necessary.`);

          const pausedRooms = await Room.find({ 
            creator: user._id,
            status: 'paused'
          });

          if (pausedRooms.length > 0) {
            console.log(`Reactivating ${pausedRooms.length} rooms for user ${user.username}`);
            for (const room of pausedRooms) {
              room.status = 'open';
              await room.save();

              const roomNotification = new Notification({
                from: user._id,
                to: user._id,
                room: room._id,
                message: `Room "${room.name}" has been reactivated due to active elite subscription`,
                is_read: false
              });

              await saveDocumentWithRetry(roomNotification);
            }
          }

          const inactiveLoans = await Loan.find({
            user: user._id,
            active: false
          });

          if (inactiveLoans.length > 0) {
            console.log(`Reactivating ${inactiveLoans.length} loans for user ${user.username}`);
            for (const loan of inactiveLoans) {
              loan.active = true;
              await loan.save();

              const loanNotification = new Notification({
                from: user._id,
                to: user._id,
                message: `Loan #${loan._id} has been reactivated due to active elite subscription`,
                is_read: false
              });

              await saveDocumentWithRetry(loanNotification);
            }
          }
        }
      }

      systemSetting.updated_at = new Date();
      await systemSetting.save();
      console.log('Elite subscription check completed');
    }
  } catch (error) {
    console.error('Error checking elite subscriptions:', error);
  }
}

async function getTokenBalance(wallet, mintPublicKey, connection) {
  try {
    const userPublicKey = new PublicKey(wallet);
    const userATA = await getAssociatedTokenAddress(mintPublicKey, userPublicKey);
    const accountInfo = await getAccount(connection, userATA);
    return Number(accountInfo.amount) / Math.pow(10, 6); // Assuming 6 decimals
  } catch (error) {
    if (error.message.includes('TokenAccountNotFoundError')) {
      return 0; // No tokens
    } else {
      console.error(`Error fetching balance for ${wallet}:`, error.message);
      return 0;
    }
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function distributeHoldersPool() {
  let systemSetting = await SystemSetting.findOne({ name: "last_paid_dividends" });
  if (!systemSetting) return;
  const senderId = '629685058f368a1838372754'; // Replace with the actual sender ID
  const senderUser = await User.findById(senderId);

  const lastUpdated = systemSetting.updated_at;
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  if (lastUpdated <= twentyFourHoursAgo) {
    try {
      const DEFAULT_RPC = clusterApiUrl("mainnet-beta");
      const QUICKNODE_RPC = process.env.PROVIDER_URL || DEFAULT_RPC;
      let connection = new Connection(DEFAULT_RPC, "confirmed");

      const tokenAddress = process.env.token?.trim();
      if (!tokenAddress) throw new Error("Token address is not set in environment variables.");

      const mintPublicKey = new PublicKey(tokenAddress);

      const holdersPoolSetting = await SystemSetting.findOne({ name: "holders_pool" });
      if (!holdersPoolSetting || holdersPoolSetting.value <= 0) {
        console.log("❌ No holders pool available to distribute.");
        return;
      }

      const holdersPool = holdersPoolSetting.value;
      let totalTokensHeld = 0;
      let userBalances = [];

      const users = await User.find({ accounts: { $exists: true, $not: { $size: 0 } } });

      for (const user of users) {
        let userTokenBalance = 0;

        for (const wallet of user.accounts) {
          await delay(1000);

          let balance;
          try {
            balance = await getTokenBalance(wallet, mintPublicKey, connection);
          } catch (error) {
            console.error(`❌ Error fetching balance for ${wallet}: ${error.message}`);

            if (error.message.includes("429 Too Many Requests")) {
              console.log(`🔄 Retrying with QuickNode for ${wallet}...`);
              connection = new Connection(QUICKNODE_RPC, "confirmed");
              balance = await getTokenBalance(wallet, mintPublicKey, connection);
            } else {
              balance = 0;
            }
          }

          console.log(`Wallet: ${wallet} | Balance: ${balance}`);
          userTokenBalance += balance;
        }

        if (userTokenBalance > 0) {
          totalTokensHeld += userTokenBalance;
          userBalances.push({ user, balance: userTokenBalance });
          console.log(`User: ${user.username} | Total Balance: ${userTokenBalance}`);
        }
      }

      if (totalTokensHeld === 0) {
        console.log("❌ No token holders found.");
        return;
      }

      for (const { user, balance } of userBalances) {
        const userShare = (balance / totalTokensHeld) * holdersPool;
        user.balance += userShare;

        const newTransaction = new Transaction({
          user: user,
          amount: userShare,
          description: `Dividend payout from holders pool`,
        });

        let notification = new Notification({
          from: senderUser._id,
          to: user._id,
          room: '',
          message: `Dividend payout from $RPS holders pool`,
          amount: userShare,
          is_read: false
        });

        const notificationData = {
          message: 'Dividend payout from $RPS holders pool',
          username: senderUser.username,
          avatar: senderUser.avatar,
          amount: userShare,
          accessory: senderUser.accessory,
          rank: senderUser.totalWagered,
          created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
          created_at_str: moment(new Date()).format('LLL'),
          updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
        };

        try {
          await saveDocumentWithRetry(notification);
          socketController.sendNotification(user._id, notificationData);
          await saveDocumentWithRetry(newTransaction);
        } catch (error) {
          console.error("❌ Error saving notification or transaction:", error);
        }

        await saveDocumentWithRetry(user);
        console.log(`✅ Distributed ${userShare.toFixed(6)} to ${user.username}`);
      }

      holdersPoolSetting.value = 0;
      await holdersPoolSetting.save();
      console.log("✅ Holders pool distributed and reset.");

      const message = `${holdersPool} SOL 💰 distributed to $RPS holders ✅ 🌐`;
      const messageType = 'text';

      const avatar = senderUser.avatar || '';
      const accessory = senderUser.accessory || '';
      const rank = senderUser.totalWagered || 0;
      const elite = senderUser.elite || '';

      const replyTo = null;

      const data = {
        sender: senderUser.username,
        senderId: senderId,
        message: message,
        messageType: messageType,
        avatar: avatar,
        accessory: accessory,
        elite: elite,
        rank: rank,
        replyTo: replyTo,
      };

      socketController.globalChatSend(socketio, data);
      systemSetting.updated_at = new Date();
      await systemSetting.save();
    } catch (error) {
      console.error("❌ Error distributing holders pool:", error);
    }
  }
}

cron.schedule('0 0 * * *', async () => {
  console.log('Running elite subscription check...');
  await checkSubscriptionPayments();

  if (typeof distributeHoldersPool === 'function') {
    await distributeHoldersPool();
  }
});

module.exports = {
  checkSubscriptionPayments,
  distributeHoldersPool
};