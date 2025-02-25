const cron = require('node-cron');
const Item = require('../../model/Item');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const socketController = require('../../socketController');
const SystemSetting = require('../../model/SystemSetting');
const moment = require('moment');
const Notification = require('../../model/Notification');
const saveDocumentWithRetry = require('./retrySave');
const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const { getAccount, getAssociatedTokenAddress } = require('@solana/spl-token');

let socketio = null;

async function checkRentalPayments(io) {
  try {
    if (io) {
      socketio = io;
    }
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_rent' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {

        const items = await Item.find();

        // Iterate through each item
        for (const item of items) {
          // Iterate through each owner in the item's owners array
          for (const owner of item.owners) {
            if (
              owner.count === 1 &&
              owner.onSale === 0 &&
              owner.rentOption === true &&
              owner.originalOwner &&
              owner.lastPayment
            ) {
              const currentDate = new Date();
              const lastPaymentDate = new Date(owner.lastPayment);
              const oneMonthAgo = new Date();
              oneMonthAgo.setMonth(currentDate.getMonth() - 1);

              // Check if it's been more than 1 month since the last payment
              if (lastPaymentDate <= oneMonthAgo) {

                const currentUser = await User.findOne({ _id: owner.user });

                // Calculate the amount to deduct (minimum of the balance or the price)
                let amountToDeduct = parseFloat(owner.price);

                // Check if deducting the amount will result in a negative balance
                if (amountToDeduct > currentUser.balance) {

                  const originalOwnerIndex = item.owners.findIndex((ownerObj) => ownerObj.user.equals(owner.originalOwner));

                  if (originalOwnerIndex !== -1) {
                    // If the original owner already exists, increment their count
                    item.owners[originalOwnerIndex].count += 1;
                    item.owners[originalOwnerIndex].rentOption = true;
                  } else {
                    // If the original owner doesn't exist, add them to the owners array
                    item.owners.push({
                      user: owner.originalOwner,
                      count: 1,
                      price: owner.price,
                      rentOption: true
                    });
                  }

                  // Set the count to 0 for the current owner
                  owner.count -= 1;
                  owner.rentOption = false;

                  let notification = new Notification({
                    from: currentUser,
                    to: owner.originalOwner,
                    room: '',
                    message: `Received back ${item.productName}.`,
                    amount: 0,
                    is_read: false
                  })

                  const notificationData = {
                    message: notification.message,
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                    accessory: currentUser.accessory,
                    rank: currentUser.totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  };

                  let notificationJ = new Notification({
                    from: currentUser,
                    to: currentUser,
                    room: '',
                    message: `No more funds. Returned ${item.productName}`,
                    amount: 0,
                    is_read: false
                  })

                  const notificationDataJ = {
                    message: notificationJ.message,
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                    amount: 0,
                    accessory: currentUser.accessory,
                    rank: currentUser.totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  };

                  try {
                    await saveDocumentWithRetry(notification);
                    await saveDocumentWithRetry(notificationJ);
                    socketController.sendNotification(currentUser._id, notificationDataJ);
                    socketController.sendNotification(owner.originalOwner, notificationData);
                  } catch (error) {
                    console.error("Error saving notification:", error);
                  }

                } else {

                  // Deduct the amount from the user's balance
                  currentUser.balance -= amountToDeduct;

                  // Find the original owner
                  const originalOwner = await User.findOne({ _id: owner.originalOwner });

                  // Increase the balance for the original owner
                  originalOwner.balance += amountToDeduct;

                  // Create new transaction records
                  const newTransactionC = new Transaction({
                    user: currentUser,
                    amount: -amountToDeduct,
                    description: `Rental payment for ${item.productName}`,
                  });

                  const newTransactionJ = new Transaction({
                    user: originalOwner,
                    amount: amountToDeduct,
                    description: `Rental income from ${item.productName}`,
                  });

                  let notification = new Notification({
                    from: currentUser,
                    to: originalOwner,
                    room: '',
                    message: `Received ${(amountToDeduct)} Rental Payment from ${item.productName}`,
                    is_read: false
                  })

                  const notificationData = {
                    message: notification.message,
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                    accessory: currentUser.accessory,
                    rank: currentUser.totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  };

                  let notificationJ = new Notification({
                    from: currentUser,
                    to: currentUser,
                    room: '',
                    amount: -amountToDeduct,
                    message: `Paid Rental Payment for ${item.productName}`,
                    is_read: false
                  })

                  const notificationDataJ = {
                    message: notificationJ.message,
                    username: currentUser.username,
                    avatar: currentUser.avatar,
                    accessory: currentUser.accessory,
                    amount: -amountToDeduct,
                    rank: currentUser.totalWagered,
                    created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                    created_at_str: moment(new Date()).format('LLL'),
                    updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  };

                  try {
                    await saveDocumentWithRetry(notification);
                    await saveDocumentWithRetry(notificationJ);
                    socketController.sendNotification(currentUser._id, notificationDataJ);
                    socketController.sendNotification(originalOwner, notificationData);
                  } catch (error) {
                    console.error("Error saving notification:", error);
                  }

                  // Save changes and transactions
                  await Promise.all([
                    currentUser.save(),
                    originalOwner.save(),
                    newTransactionC.save(),
                    newTransactionJ.save(),
                  ]);
                }
                await item.save();
                console.log(`Rental payment processed for item ${item.productName}`);
              }
            }
          }
        }
        const senderId = '629685058f368a1838372754'; // Replace with the actual sender ID
        const message = 'Daily checks complete ✅, outstanding debt 💸 and arrears 📉 have been processed. 🎉';
        const messageType = 'text';

        // Fetch user information from the User model using the senderId
        const senderUser = await User.findById(senderId);

        // Extract relevant user information
        const avatar = senderUser.avatar || ''; // Replace with the actual avatar URL
        const accessory = senderUser.accessory || ''; // Replace with the actual accessory URL
        const rank = senderUser.totalWagered || 0; // Replace with the actual rank

        const replyTo = null; // No need for a reply in this case

        const data = {
          sender: senderUser.username, // Assuming there's a 'username' field in the User model
          senderId: senderId,
          message: message,
          messageType: messageType,
          avatar: avatar,
          accessory: accessory,
          rank: rank,
          replyTo: replyTo,
        };

        // Emit the GLOBAL_CHAT_SEND event
        socketController.globalChatSend(socketio, data);
        systemSetting.updated_at = new Date();
        await systemSetting.save();
      }
    } else {
      console.log("System setting for last updated not found.");
    }
  } catch (error) {
    console.error('Error taking rental payments', error);
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
      // Set up RPC connections
      const DEFAULT_RPC = clusterApiUrl("mainnet-beta");
      const QUICKNODE_RPC = process.env.PROVIDER_URL || DEFAULT_RPC;
      let connection = new Connection(DEFAULT_RPC, "confirmed");

      const tokenAddress = process.env.token?.trim();
      if (!tokenAddress) throw new Error("Token address is not set in environment variables.");

      const mintPublicKey = new PublicKey(tokenAddress);

      // Fetch holders pool value
      const holdersPoolSetting = await SystemSetting.findOne({ name: "holders_pool" });
      if (!holdersPoolSetting || holdersPoolSetting.value <= 0) {
        console.log("❌ No holders pool available to distribute.");
        return;
      }

      const holdersPool = holdersPoolSetting.value;
      let totalTokensHeld = 0;
      let userBalances = [];

      // Fetch all users
      const users = await User.find({ accounts: { $exists: true, $not: { $size: 0 } } });

      // Step 1: Gather all user balances
      for (const user of users) {
        let userTokenBalance = 0;

        for (const wallet of user.accounts) {
          await delay(1000); // Increase delay to avoid rate limits

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

      // Step 2: Ensure we have valid token holders
      if (totalTokensHeld === 0) {
        console.log("❌ No token holders found.");
        return;
      }

      // Step 3: Distribute holders pool based on proportion
      for (const { user, balance } of userBalances) {
        const userShare = (balance / totalTokensHeld) * holdersPool;
        user.balance += userShare;

        // Create transaction record
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
        })

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

      // Step 4: Reset holders pool after distribution
      holdersPoolSetting.value = 0;
      await holdersPoolSetting.save();
      console.log("✅ Holders pool distributed and reset.");

      const message = `${holdersPool} SOL 💰 has been distributed to all $RPS holders ✅ 🌐. Register to earn.`;
      const messageType = 'text';

      // Extract relevant user information
      const avatar = senderUser.avatar || ''; // Replace with the actual avatar URL
      const accessory = senderUser.accessory || ''; // Replace with the actual accessory URL
      const rank = senderUser.totalWagered || 0; // Replace with the actual rank

      const replyTo = null; // No need for a reply in this case

      const data = {
        sender: senderUser.username, // Assuming there's a 'username' field in the User model
        senderId: senderId,
        message: message,
        messageType: messageType,
        avatar: avatar,
        accessory: accessory,
        rank: rank,
        replyTo: replyTo,
      };

      // Emit the GLOBAL_CHAT_SEND event
      socketController.globalChatSend(socketio, data);
      systemSetting.updated_at = new Date();
      await systemSetting.save();
    } catch (error) {
      console.error("❌ Error distributing holders pool:", error);
    }
  }
}

cron.schedule('0 0 * * *', async () => {
  await checkRentalPayments();
  await distributeHoldersPool();
});

// Export an object containing the function
module.exports = {
  checkRentalPayments,
};
