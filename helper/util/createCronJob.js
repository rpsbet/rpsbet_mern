const cron = require('node-cron');
const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL
} = require('@solana/web3.js');

const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const Notification = require('../../model/Notification'); // If needed for your notifications
const axios = require('axios');
const moment = require('moment');

const saveDocumentWithRetry = require('./retrySave');
const socketController = require('../../socketController');

// Replace with your actual environment variables
const provider = new Connection(process.env.PROVIDER_URL, 'confirmed');

const depositConfirmationThreshold = 6; // e.g. 6 confirmations
let isProcessing = false;

/**
 * The function that checks confirmations for pending or in-process transactions.
 */
async function checkConfirmations(io) {
  try {
    if (isProcessing) return; // Prevent overlap
    isProcessing = true;

    const pendingTransactions = await Transaction.find({ status: 'pending' });

    // If you need socket.io, store it
    if (io) {
      socketio = io;
    }

    // -------------- PROCESS PENDING (NATIVE SOL) --------------
    for (const transaction of pendingTransactions) {
      const txSignature = transaction.hash;
      // 1) Fetch transaction details from Solana
      const txInfo = await provider.getTransaction(txSignature, { commitment: 'confirmed' });
      if (!txInfo || !txInfo.slot || !txInfo.meta) {
        // Not found or incomplete; skip this iteration
        continue;
      }

      // 2) Check confirmations
      const currentSlot = await provider.getSlot('confirmed'); 
      const confirmationCount = currentSlot - txInfo.slot;

      if (confirmationCount < depositConfirmationThreshold) {
        // Not enough confirmations yet
        continue;
      }

      console.log('ADMIN_WALLET from env ->', process.env.adminWallet);

      const adminWallet = process.env.adminWallet; // e.g. "A4cwo8Q7rm..."
      const adminPubkey = new PublicKey(adminWallet);

      const adminIndex = txInfo.transaction.message.accountKeys.findIndex((acc) =>
        acc.equals(adminPubkey)
      );
      if (adminIndex === -1) {
        console.error('Admin wallet not found in transaction:', txSignature);
        continue;
      }

      // 4) Get preBalance & postBalance for the admin wallet
      const preBalLamports = txInfo.meta.preBalances[adminIndex];
      const postBalLamports = txInfo.meta.postBalances[adminIndex];

      // 5) The lamports difference => deposit
      const depositLamports = postBalLamports - preBalLamports;
      const depositSOL = depositLamports / LAMPORTS_PER_SOL;

      // 6) Compare depositSOL with transaction.amount (within epsilon)
      const epsilon = 0.00001;
      const amountDiff = Math.abs(depositSOL - transaction.amount);

      if (amountDiff <= epsilon) {
        // The deposit matches => finalize
        const user = await User.findById(transaction.user);
        if (!user) {
          console.error('User not found for transaction:', transaction._id);
          continue;
        }

        // Mark transaction completed
        transaction.status = 'completed';
        // If you want to store the actual deposit amount found on-chain:
        transaction.amount = depositSOL;

        // Update user’s balance
        user.balance += depositSOL;

        // ------------- REFERRAL LOGIC -------------
        let referralOwner = null;
        if (user.referralUsername) {
          referralOwner = await User.findOne({ username: user.referralUsername });
        }

        if (referralOwner) {
          // e.g. 1% referral
          const referralReward = depositSOL * 0.01;
        
          // Upsert the reward record
          const idx = referralOwner.rewards.findIndex((r) => r.user.equals(user._id));
          if (idx !== -1) {
            referralOwner.rewards[idx].amount += referralReward;
          } else {
            referralOwner.rewards.push({ user: user._id, amount: referralReward });
          }
          referralOwner.balance += referralReward;
          user.balance -= referralReward;
        
          // Create a new transaction for the referral owner’s reward
          const referralTx = new Transaction({
            user: referralOwner._id,
            amount: referralReward,
            description: `Referral rewards from ${user.username}.`,
            room: ''
          });
        
          // Prepare referral notification
          const notificationRef = new Notification({
            from: user._id,
            to: referralOwner._id,
            amount: referralReward,
            room: '',
            message: `Received SOL in referral rewards`
          });
        
          const notificationDataRef = {
            message: notificationRef.message,
            username: user.username,
            avatar: user.avatar,
            accessory: user.accessory,
            rank: user.totalWagered,
            amount: referralReward,
            created_at: moment().format('YYYY-MM-DD HH:mm'),
            created_at_str: moment().format('LLL'),
            updated_at: moment().format('YYYY-MM-DD HH:mm'),
            is_read: false
          };
        
          try {
            await saveDocumentWithRetry(referralOwner);
            await saveDocumentWithRetry(referralTx);
            await saveDocumentWithRetry(notificationRef);
            socketController.sendNotification(referralOwner._id, notificationDataRef);
            socketController.newTransaction(referralOwner._id, referralTx);
          } catch (error) {
            console.error('Error saving referral data:', error);
          }
        }

        // ------------- USER NOTIFICATION -------------
        const notification = new Notification({
          from: user._id,
          to: user._id,
          amount: depositSOL,
          room: '',
          message: `Deposit successful, received`
        });

        const notificationData = {
          message: notification.message,
          username: user.username,
          avatar: user.avatar,
          accessory: user.accessory,
          rank: user.totalWagered,
          amount: depositSOL,
          created_at: moment().format('YYYY-MM-DD HH:mm'),
          created_at_str: moment().format('LLL'),
          updated_at: moment().format('YYYY-MM-DD HH:mm'),
          is_read: false
        };

        try {
          await saveDocumentWithRetry(transaction);
          await saveDocumentWithRetry(user);
          await saveDocumentWithRetry(notification);
          socketController.sendNotification(user._id, notificationData);
          socketController.newTransaction(transaction);
        } catch (error) {
          console.log("transaction", transaction)
          console.log("user", user._id)
          console.log("notification", notification)
          console.error('Error saving deposit data:', error);
        }

        
      } else {
        console.log(
          `Deposit mismatch. On-chain deposit: ${depositSOL}, expected: ${transaction.amount}`
        );
      }
    }

  } catch (error) {
    console.error('Error checking confirmations:', error);
  } finally {
    isProcessing = false;
  }
}

// Run every 15 seconds
cron.schedule('*/15 * * * * *', checkConfirmations);

module.exports = {
  checkConfirmations
};
