const cron = require('node-cron');
const { Connection, clusterApiUrl, PublicKey } = require('@solana/web3.js');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const axios = require('axios');
const moment = require('moment');
const convertToCurrency = require('../../helper/util/conversion');

const saveDocumentWithRetry = require('./retrySave');
const socketController = require('../../socketController');

const provider = new Connection(process.env.PROVIDER_URL, 'confirmed');
const API_KEY = process.env.API_KEY;
const tokenMintAddress = process.env.token;

const depositConfirmationThreshold = 6; // Number of confirmations required
let isProcessing = false;

async function checkConfirmations(io) {
  try {
    const pendingTransactions = await Transaction.find({ status: 'pending' });
    const processingTransactions = await Transaction.find({
      status: { $in: ['processing', 'in_process'] }
    });

    let referralOwner = null;
    if (io) {
      socketio = io;
    }

    if (isProcessing) {
      return;
    }

    isProcessing = true;

    // Token mint address to check
    const epsilon = 0.00001; // Define a small threshold for floating-point comparison

    // Process pending transactions
    for (const transaction of pendingTransactions) {
      const txSignature = transaction.hash;

      // Fetch transaction details from Solana
      const txInfo = await provider.getTransaction(txSignature, { commitment: 'confirmed' });

      if (txInfo && txInfo.slot) {
        const confirmations = await provider.getSlot('confirmed');
        const confirmationCount = confirmations - txInfo.slot;

        // Process only if we have enough confirmations
        if (confirmationCount >= depositConfirmationThreshold) {
          const user = await User.findById(transaction.user);
          if (user) {
            // Find the relevant token account index for the specific token mint
            const preTokenBalances = txInfo.meta.preTokenBalances;
            const postTokenBalances = txInfo.meta.postTokenBalances;

            // Find the index of the user's token account for the specific mint address
            const userTokenAccountIndex = preTokenBalances.findIndex(balance => balance.mint === tokenMintAddress);

            if (userTokenAccountIndex !== -1) {
              const preBalance = preTokenBalances[userTokenAccountIndex].uiTokenAmount.uiAmount || 0;
              const postBalance = postTokenBalances[userTokenAccountIndex].uiTokenAmount.uiAmount || 0;
              const amountRaw = postBalance - preBalance; // Calculate the amount sent


              // Check if the extracted amount matches the pending transaction amount within an epsilon
              if (Math.abs(amountRaw - transaction.amount) < epsilon) {
                // Update transaction with the new amount
                transaction.amount = amountRaw; // Store this amount in your transaction document
                transaction.status = 'completed';
                user.balance += amountRaw;


                if (user.referralId && user.referralId !== "") {
                  referralOwner = await User.findOne({ _id: user.referralId });
                }

                // If there is a referral owner, update their balance and rewards
                if (referralOwner) {
                  const index = referralOwner.rewards.findIndex(reward => reward.user.equals(user._id));
                  if (index !== -1) {
                    referralOwner.rewards[index].amount += amountRaw * 0.05;
                  } else {
                    referralOwner.rewards.push({ user: user._id, amount: amountRaw * 0.05 });
                  }

                  referralOwner.balance += amountRaw * 0.05;

                  const newTransaction = new Transaction({
                    user: referralOwner._id,
                    amount: amountRaw * 0.05,
                    description: `Referral rewards from ${user.username}.`,
                    room: ''
                  });

                  // Prepare notification for referral owner
                  const notificationJ = new Notification({
                    from: user._id,
                    to: referralOwner._id,
                    amount: amountRaw * 0.05,
                    room: '',
                    message: `Received ${convertToCurrency(amountRaw * 0.05)} in referral rewards.`
                  });

                  const notificationDataJ = {
                    message: notificationJ.message,
                    username: user.username,
                    avatar: user.avatar,
                    amount: amountRaw * 0.05,
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

                // Prepare notification for user
                const notification = new Notification({
                  from: user._id,
                  to: user._id,
                  amount: amountRaw,
                  room: '',
                  message: `Deposit successful, received ${convertToCurrency(amountRaw)}`
                });

                const notificationData = {
                  message: notification.message,
                  username: user.username,
                  avatar: user.avatar,
                  accessory: user.accessory,
                  rank: user.totalWagered,
                  created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
                  amount: amountRaw,
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

                console.log('Deposit transaction processed successfully for user:', user.username, 'with amount:', amountRaw);
              }
            } else {
              console.error('User token account not found for the mint address:', tokenMintAddress);
            }
          }
        }
      }
    }
    const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`);
    const tokenPrice = parseFloat(response.data.pairs[0]?.priceUsd);
    if (tokenPrice == null || isNaN(tokenPrice)) {
      return res.status(404).json({
        success: false,
        message: 'Token price not found or invalid.',
      });
    }
    
    const margin = 1000000; // Define the threshold for acceptable price variation (in USD)
    
    // Process web2 transactions (deposits)
    for (const transaction of processingTransactions) {
      const FIVE_SECONDS = 5 * 1000; // 5 seconds in milliseconds
      const now = new Date();
      const updatedAt = new Date(transaction.updated_at);
    
      if (now - updatedAt <= FIVE_SECONDS) {
        console.log(`Transaction ${transaction._id} was updated recently. Skipping...`);
        continue;
      }
    
      if (transaction.status === 'completed') {
        console.log(`Transaction ${transaction._id} is already completed. Skipping...`);
        continue;
      }
    
      const currentTime = new Date();
      const twoHoursAgo = new Date(currentTime.getTime() - (10 * 60 * 60 * 1000)); // 10 hours ago
      let isDeposit = transaction.description === 'deposit';
      let isWithdraw = transaction.description === 'withdraw';
      const paymentId = transaction.hash;
    
      // Ensure the transaction is a deposit with a valid paymentId and created within the last 10 hours
      if (isDeposit && paymentId && new Date(transaction.created_at) >= twoHoursAgo) {
        try {
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
    
            const solResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
            const solPrice = parseFloat(solResponse.data.solana?.usd);
        
            if (solPrice == null || isNaN(solPrice)) {
              return {
                success: false,
                message: 'Solana price not found or invalid.',
              };
            }
        
            // Check if transaction amount is within an acceptable range of the token price
            const expectedAmountInUSD = transaction.amount; // Calculate expected amount based on token price
            const amountInUSD = response.data.pay_amount * solPrice; // This should be the amount received in USD
            const tokenAmount = amountInUSD / tokenPrice;

            // Check if the amount is within the defined epsilon range
            if (Math.abs(tokenAmount - expectedAmountInUSD) < margin) {
              transaction.status = 'completed';
              user.balance +=  transaction.amount - (transaction.amount * 0.008); // Update user balance
    
              let referralOwner = null;
              if (referralId) {
                referralOwner = await User.findOne({ referralId });
              }
    
              if (referralOwner) {
                const index = referralOwner.rewards.findIndex(reward => reward.user.equals(user._id));
                if (index !== -1) {
                  referralOwner.rewards[index].amount += tokenAmount * 0.05;
                } else {
                  referralOwner.rewards.push({ user: user._id, amount: tokenAmount * 0.05 });
                }
    
                referralOwner.balance += tokenAmount * 0.05;
                const newTransaction = new Transaction({
                  user: referralOwner._id,
                  amount: transaction.amount * 0.05,
                  description: `Referral rewards from ${user.username}.`,
                  room: ''
                });
    
                let notificationJ = new Notification({
                  from: user._id,
                  to: referralOwner._id,
                  amount: transaction.amount * 0.05,
                  room: '',
                  message: `Received ${convertToCurrency(transaction.amount * 0.05)} in referral rewards.`
                });
    
                const notificationDataJ = {
                  message: notificationJ.message,
                  amount: transaction.amount,
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
                amount: transaction.amount,
                room: '',
                message: `Deposit successful, received ${convertToCurrency(transaction.amount)}`
              });
    
              const notificationData = {
                message: notification.message,
                username: user.username,
                avatar: user.avatar,
                accessory: user.accessory,
                amount: transaction.amount,
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
            } else {
              console.log(`Transaction amount does not match price expectation. Expected around: ${expectedAmountInUSD}, but received: ${tokenAmount}`);
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


cron.schedule('*/15 * * * * *', checkConfirmations);

// Export any necessary functions or variables for use in your application
module.exports = {
  checkConfirmations
};
