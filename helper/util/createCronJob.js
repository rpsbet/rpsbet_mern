// Import the necessary modules and configurations
const cron = require('node-cron');
const { JsonRpcProvider } = require('@ethersproject/providers');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const { setBalance } = require('../../routes/user.routes');
const axios = require('axios');
const moment = require('moment');
const saveDocumentWithRetry = require('./retrySave');

const { ethers } = require('ethers');
const convertToCurrency = require('./conversion');

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/5fedb9ded8fd4b149026d0140baacf98');
const API_KEY = 'ZBZK3XM-QNHM89H-MKXVFCD-TV6MW1N';

const depositConfirmationThreshold = 6;
const socketController = require('../../socketController');

let socketio = null;
let isProcessing = false;


async function checkConfirmations(io) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const pendingTransactions = await Transaction.find({ status: 'pending' }); // web3
    const processingTransactions = await Transaction.find({
      status: { $in: ['processing', 'in_process'] } // Checks for both statuses
    });
    let referralOwner = null;
    if (io) {
      socketio = io;
    }
    if (isProcessing) {
      // console.log('Processing is already in progress');
      return;
    }

    isProcessing = true;

    // Process web3 transactions
    for (const transaction of pendingTransactions) {
      let isDeposit = transaction.description === 'deposit';
      const tx = await provider.getTransaction(transaction.hash);
      if (tx && tx.blockNumber) {
        const confirmations = currentBlock - tx.blockNumber;

        if (isDeposit && confirmations >= depositConfirmationThreshold) {
          // console.log('Processing deposit transaction...');
          const user = await User.findById(transaction.user);

          if (user) {
            transaction.status = 'completed';
            user.balance += transaction.amount;
            // console.log("user.referralId", user.referralId);
            console.log('Deposit transaction processed successfully.');

            if (user.referralId && user.referralId !== "") {
              referralOwner = await User.findOne({ _id: user.referralId });
            }
            // console.log("referralOwner", referralOwner);
            // If there is a referral owner, update their balance and rewards
            if (referralOwner) {
              // Find the index of the user's _id in the referral owner's rewards array
              const index = referralOwner.rewards.findIndex(reward => reward.user.equals(user._id));
              // console.log("index", index);

              // If the user's _id is found in the rewards array, update the amount
              if (index !== -1) {
                referralOwner.rewards[index].amount += transaction.amount * 0.05;
              } else {
                // If the user's _id is not found, add a new entry to the rewards array
                referralOwner.rewards.push({ user: newUser._id, amount: transaction.amount * 0.05 });
              }

              // Update referral owner's balance
              referralOwner.balance += transaction.amount * 0.05;

              const newTransaction = new Transaction({
                user: referralOwner._id,
                amount: transaction.amount * 0.05,
                description: `Referral rewards from ${user.username}.`,
                room: ''
              });

              let notificationJ = new Notification({
                from: user._id,
                to: referralOwner._id,
                room: '',
                message: `Received ${convertToCurrency(transaction.amount * 0.05)} in referral rewards.`
              });

              const notificationDataJ = {
                message: notificationJ.message,
                username: user.username,
                avatar: user.avatar,
                accessory: user.accessory,
                rank: user.totalWagered,
                created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                created_at_str: moment(new Date()).format('LLL'),
                updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                is_read: false
              };

              try {
                await saveDocumentWithRetry(referralOwner);
                await saveDocumentWithRetry(newTransaction);
                await saveDocumentWithRetry(notificationJ);

                socketController.sendNotification(referralOwner._id, notificationDataJ);

              } catch (error) {
                console.error("Error saving:", error);
              }
            }


            let notification = new Notification({
              from: user._id,
              to: user._id,
              room: '',
              message: `Deposit successful, received ${convertToCurrency(transaction.amount)}`
            });


            const notificationData = {
              message: notification.message,
              username: user.username,
              avatar: user.avatar,
              accessory: user.accessory,
              rank: user.totalWagered,
              created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              created_at_str: moment(new Date()).format('LLL'),
              updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              is_read: false
            };

            try {
              await saveDocumentWithRetry(transaction);
              await saveDocumentWithRetry(user);
              await saveDocumentWithRetry(notification);
              socketController.sendNotification(user._id, notificationData);
            } catch (error) {
              console.error("Error saving notification:", error);
            }

            console.log('Deposit transaction processed successfully.', transaction.amount);

          }
        }
      }
    }

    // Process web2 transactions (deposits)
    // Process web2 transactions (deposits)
    for (const transaction of processingTransactions) {
      const FIVE_SECONDS = 5 * 1000; // 5 seconds in milliseconds
      const now = new Date();
      const updatedAt = new Date(transaction.updated_at);

      // Check if the transaction was updated in the past 5 seconds
      if (now - updatedAt <= FIVE_SECONDS) {
        console.log(`Transaction ${transaction._id} was updated recently. Skipping...`);
        continue; // Skip this transaction
      }

      // Ensure the transaction is not already processed
      if (transaction.status === 'completed') {
        console.log(`Transaction ${transaction._id} is already completed. Skipping...`);
        continue;
      }

      let isDeposit = transaction.description === 'deposit';
      let isWithdraw = transaction.description === 'withdraw';

      const paymentId = transaction.hash;
      if (isDeposit && paymentId) {
        try {
          // Mark the transaction as "in process" to avoid duplicates
          transaction.status = 'in_process';
          await saveDocumentWithRetry(transaction);

          const response = await axios.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
            headers: {
              'x-api-key': API_KEY,
              'Content-Type': 'application/json',
            },
          });

          const paymentStatus = response.data.payment_status;
          if (paymentStatus === 'finished') {
            const user = await User.findById(transaction.user);
            const referralId = user.referralId;
            if (user) {
              transaction.status = 'completed';
              user.balance += transaction.amount;

              let referralOwner = null;
              if (referralId) {
                referralOwner = await User.findOne({ referralId });
              }

              if (referralOwner) {
                const index = referralOwner.rewards.findIndex(reward => reward.user.equals(user._id));
                if (index !== -1) {
                  referralOwner.rewards[index].amount += transaction.amount * 0.05;
                } else {
                  referralOwner.rewards.push({ user: user._id, amount: transaction.amount * 0.05 });
                }

                referralOwner.balance += transaction.amount * 0.05;
                const newTransaction = new Transaction({
                  user: referralOwner._id,
                  amount: transaction.amount * 0.05,
                  description: `Referral rewards from ${user.username}.`,
                  room: ''
                });

                let notificationJ = new Notification({
                  from: user._id,
                  to: referralOwner._id,
                  room: '',
                  message: `Received ${convertToCurrency(transaction.amount)} in referral rewards.`
                });

                const notificationDataJ = {
                  message: notificationJ.message,
                  username: user.username,
                  avatar: user.avatar,
                  accessory: user.accessory,
                  rank: user.totalWagered,
                  created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  created_at_str: moment(new Date()).format('LLL'),
                  updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  is_read: false
                };

                try {
                  await saveDocumentWithRetry(referralOwner);
                  await saveDocumentWithRetry(newTransaction);
                  await saveDocumentWithRetry(notificationJ);
                  socketController.sendNotification(referralOwner._id, notificationDataJ);
                } catch (error) {
                  console.error("Error saving referral related documents:", error);
                }
              }

              let notification = new Notification({
                from: user._id,
                to: user._id,
                room: '',
                message: `Deposit successful, received ${convertToCurrency(transaction.amount)}`
              });

              const notificationData = {
                message: notification.message,
                username: user.username,
                avatar: user.avatar,
                accessory: user.accessory,
                rank: user.totalWagered,
                created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                created_at_str: moment(new Date()).format('LLL'),
                updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                is_read: false
              };

              try {
                await saveDocumentWithRetry(transaction);
                await saveDocumentWithRetry(user);
                await saveDocumentWithRetry(notification);
                socketController.sendNotification(user._id, notificationData);
              } catch (error) {
                console.error("Error saving notification:", error);
              }

              console.log('Deposit transaction processed successfully.', transaction.amount);
            }
          }
        } catch (error) {
          console.error("Error processing transaction:", error);
        }

      } else if (isWithdraw && paymentId) {
        const response = await axios.get(`https://api.nowpayments.io/v1/payout/${paymentId}`, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });
        const paymentStatus = response.data.withdrawals[0].status;
        if (paymentStatus === 'FINISHED') {
          transaction.status = 'complete';
          try {
            await saveDocumentWithRetry(transaction);
          } catch (error) {
            console.error("Error saving notification:", error);
          }
        }
      }
    }

  } catch (error) {
    isProcessing = false;
    console.error('Error checking confirmations:', error);
  } finally {
    isProcessing = false;
  }
}


cron.schedule('*/5 * * * * *', checkConfirmations);

// Export any necessary functions or variables for use in your application
module.exports = {
  checkConfirmations
};
