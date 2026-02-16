const cron = require('node-cron');
const {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Transaction,
  Keypair,
} = require('@solana/web3.js');
const bs58 = require('bs58');

const User = require('../../model/User');
const GameTransaction = require('../../model/Transaction');
const Notification = require('../../model/Notification');
const Room = require('../../model/Room');
const GameType = require('../../model/GameType');
const moment = require('moment');

const saveDocumentWithRetry = require('./retrySave');
const socketController = require('../../socketController');
const { shouldUseDummyData } = require('./dummyData');

const provider = new Connection(process.env.PROVIDER_URL, 'confirmed');
const depositConfirmationThreshold = 6;
let isProcessing = false;

async function checkConfirmations(redisClient, io) {
  try {
    if (shouldUseDummyData()) {
      return;
    }

    if (isProcessing) return;
    isProcessing = true;

    // --- Process Pending Deposits ---
    const pendingDeposits = await GameTransaction.find({
      status: 'pending',
      description: { $regex: '^(Joined|Pumped|Created)', $options: 'i' }
    });

    for (const transaction of pendingDeposits) {
      const txSignature = transaction.hash;
      const txInfo = await provider.getTransaction(txSignature, { commitment: 'confirmed' });
      if (!txInfo || !txInfo.slot || !txInfo.meta) {
        continue;
      }

      const currentSlot = await provider.getSlot('confirmed');
      const confirmationCount = currentSlot - txInfo.slot;

      if (confirmationCount < depositConfirmationThreshold) {
        continue;
      }

      const adminWallet = process.env.adminWallet;
      const adminPubkey = new PublicKey(adminWallet);

      const adminIndex = txInfo.transaction.message.accountKeys.findIndex((acc) =>
        acc.equals(adminPubkey)
      );
      if (adminIndex === -1) {
        console.log('Admin wallet not found in transaction:', txSignature);
        continue;
      }

      const preBalLamports = txInfo.meta.preBalances[adminIndex];
      const postBalLamports = txInfo.meta.postBalances[adminIndex];
      const depositLamports = postBalLamports - preBalLamports;
      const depositSOL = depositLamports / LAMPORTS_PER_SOL;

      const epsilon = 0.00001;
      const amountDiff = Math.abs(depositSOL - Math.abs(transaction.amount));

      if (amountDiff <= epsilon) {
        const user = await User.findById(transaction.user);
        if (!user) {
          console.log('User not found for transaction:', transaction._id);
          continue;
        }

        transaction.status = 'completed';
        transaction.amount = -  depositSOL;
        // user.balance += depositSOL;

        // Referral Logic
        let referralOwner = null;
        if (user.referralUsername) {
          referralOwner = await User.findOne({ username: user.referralUsername });
        }

        if (referralOwner) {
          const referralReward = depositSOL * 0.01;
          const idx = referralOwner.rewards.findIndex((r) => r.user.equals(user._id));
          if (idx !== -1) {
            referralOwner.rewards[idx].amount += referralReward;
          } else {
            referralOwner.rewards.push({ user: user._id, amount: referralReward });
          }
          referralOwner.balance += referralReward;
          // user.balance -= referralReward;

          const referralTx = new GameTransaction({
            user: referralOwner._id,
            amount: referralReward,
            description: `Referral rewards from ${user.username}.`,
            room: '',
          });

          const notificationRef = new Notification({
            from: user._id,
            to: referralOwner._id,
            amount: referralReward,
            room: '',
            message: `Received SOL in referral rewards`,
          });

          const notificationDataRef = {
            message: notificationRef.message,
            username: user.username,
            avatar: user.avatar,
            accessory: user.accessory,
            elite: user.elite,
            rank: user.totalWagered,
            amount: referralReward,
            created_at: moment().format('YYYY-MM-DD HH:mm'),
            created_at_str: moment().format('LLL'),
            updated_at: moment().format('YYYY-MM-DD HH:mm'),
            is_read: false,
          };

          await saveDocumentWithRetry(referralOwner);
          await saveDocumentWithRetry(referralTx);
          await saveDocumentWithRetry(notificationRef);
          socketController.sendNotification(referralOwner._id, notificationDataRef);
          socketController.newTransaction(referralTx);
        }

        // User Notification for Deposit
        // const notification = new Notification({
        //   from: user._id,
        //   to: user._id,
        //   amount: depositSOL,
        //   room: '',
        //   message: `Deposit successful, received`,
        // });

        // const notificationData = {
        //   message: notification.message,
        //   username: user.username,
        //   avatar: user.avatar,
        //   accessory: user.accessory,
        //   elite: user.elite,
        //   rank: user.totalWagered,
        //   amount: depositSOL,
        //   created_at: moment().format('YYYY-MM-DD HH:mm'),
        //   created_at_str: moment().format('LLL'),
        //   updated_at: moment().format('YYYY-MM-DD HH:mm'),
        //   is_read: false,
        // };

        await saveDocumentWithRetry(transaction);
        await saveDocumentWithRetry(user);
        // await saveDocumentWithRetry(notification);
        // socketController.sendNotification(user._id, notificationData);
        socketController.newTransaction(transaction);
      } else {
        console.log(
          `Deposit mismatch. On-chain deposit: ${depositSOL}, expected: ${transaction.hash}`
        );
      }
    }

    const pendingEliteSubscriptions = await GameTransaction.find({
      status: 'pending',
      $or: [
        { description: { $regex: 'Elite Subscription', $options: 'i' } },
        { type: 'elite_subscription' }
      ]
    });

    for (const transaction of pendingEliteSubscriptions) {
      const txSignature = transaction.txtHash || transaction.hash;
      if (!txSignature) {
        console.log('No transaction signature found for elite subscription:', transaction._id);
        continue;
      }

      // Get transaction info from blockchain
      const txInfo = await provider.getTransaction(txSignature, { commitment: 'confirmed' });
      if (!txInfo || !txInfo.slot || !txInfo.meta) {
        console.log('Elite subscription transaction not yet confirmed:', txSignature);
        continue;
      }

      // Check confirmations
      const currentSlot = await provider.getSlot('confirmed');
      const confirmationCount = currentSlot - txInfo.slot;

      if (confirmationCount < depositConfirmationThreshold) {
        log(`Elite subscription needs more confirmations: ${confirmationCount}/${depositConfirmationThreshold}`);
        continue;
      }

      // Verify transaction was successful
      if (txInfo.meta.err) {
        console.log('Elite subscription transaction failed on blockchain:', txSignature, txInfo.meta.err);
        transaction.status = 'failed';
        await saveDocumentWithRetry(transaction);
        continue;
      }

      // Get admin wallet and verify payment
      const adminWallet = process.env.adminWallet;
      const adminPubkey = new PublicKey(adminWallet);

      const adminIndex = txInfo.transaction.message.accountKeys.findIndex((acc) =>
        acc.equals(adminPubkey)
      );

      if (adminIndex === -1) {
        console.log('Admin wallet not found in elite subscription transaction:', txSignature);
        continue;
      }

      // Calculate the actual deposit amount
      const preBalLamports = txInfo.meta.preBalances[adminIndex];
      const postBalLamports = txInfo.meta.postBalances[adminIndex];
      const depositLamports = postBalLamports - preBalLamports;
      const depositSOL = depositLamports / LAMPORTS_PER_SOL;

      // Verify amount matches expected subscription cost
      const expectedAmount = Math.abs(transaction.amount);
      const epsilon = 0.00001;
      const amountDiff = Math.abs(depositSOL - expectedAmount);

      if (amountDiff > epsilon) {
        console.error(`Elite subscription amount mismatch. On-chain: ${depositSOL}, expected: ${expectedAmount}`);
        continue;
      }

      // Find user and update elite status
      const user = await User.findById(transaction.user);
      if (!user) {
        console.error('User not found for elite subscription:', transaction._id);
        continue;
      }

      // Determine subscription type from transaction
      let subscriptionType = transaction.subscriptionType;
      if (!subscriptionType) {
        // Fallback: determine from amount
        if (Math.abs(expectedAmount - 0.1) < epsilon) {
          subscriptionType = 'red';
        } else if (Math.abs(expectedAmount - 0.4) < epsilon) {
          subscriptionType = 'black';
        } else {
          console.error('Cannot determine subscription type for transaction:', transaction._id);
          continue;
        }
      }

      console.log(`Processing elite subscription: ${subscriptionType} for user ${user.username}`);

      // Update user's elite status
      const previousElite = user.elite;
      user.elite = subscriptionType;
      user.last_elite_payment = new Date();

      // Add to subscription history if field exists
      if (user.subscriptionHistory !== undefined) {
        if (!Array.isArray(user.subscriptionHistory)) {
          user.subscriptionHistory = [];
        }

        user.subscriptionHistory.push({
          type: subscriptionType,
          transactionSignature: txSignature,
          amount: expectedAmount,
          date: new Date(),
          previousType: previousElite
        });
      }

      // Mark transaction as completed
      transaction.status = 'completed';
      transaction.amount = -depositSOL; // Update with actual amount

      // Save everything
      await saveDocumentWithRetry(user);
      await saveDocumentWithRetry(transaction);

      // Clear user Redis cache to ensure updated elite status is fetched from DB
      if (redisClient) {
        try {
          // Clear Privy-based cache if user has Privy ID
          if (user.privyId) {
            const privyKey = `user:privy:${user.privyId}`;
            await redisClient.del(privyKey);
            console.log(`✅ Cleared Privy cache for user ${user.username}: ${privyKey}`);
          }
          
          // Clear user ID-based cache
          const userIdKey = `user_${user._id}`;
          await redisClient.del(userIdKey);
          console.log(`✅ Cleared user cache for user ${user.username}: ${userIdKey}`);
          
          // Clear any session-based cache (if exists)
          const sessionKey = `session:${user._id}`;
          await redisClient.del(sessionKey);
          console.log(`✅ Cleared session cache for user ${user.username}: ${sessionKey}`);
          
        } catch (cacheError) {
          console.error('Failed to clear user cache after elite subscription:', cacheError);
          // Don't throw - cache clearing failure shouldn't block the subscription process
        }
      }

      // Create success notification
      const notification = new Notification({
        from: user._id,
        to: user._id,
        message: `Successfully upgraded to ${subscriptionType.charAt(0).toUpperCase() + subscriptionType.slice(1)} Elite`,
        amount: depositSOL,
        is_read: false,
      });

      const notificationData = {
        message: notification.message,
        username: user.username,
        avatar: user.avatar,
        accessory: user.accessory,
        elite: subscriptionType, // Send updated elite status
        rank: user.totalWagered,
        amount: depositSOL,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };

      await saveDocumentWithRetry(notification);

      // Send real-time updates
      socketController.sendNotification(user._id, notificationData);
      socketController.newTransaction(transaction);

      // Note: User elite status will be updated when they refresh or through other mechanisms
      // You could add a custom socket event here if needed

      console.log(`Elite subscription completed: ${subscriptionType} for user ${user.username}`);
    }

    // --- Process Pending Withdrawals (Winnings) ---
    const pendingWithdrawals = await GameTransaction.find({
      status: 'pending',
      $or: [
        { description: { $regex: '^winnings', $options: 'i' } },
        { description: { $regex: '^jeeted', $options: 'i' } },
        { description: { $regex: '^rugged', $options: 'i' } },
      ],
    });

    for (const withdrawal of pendingWithdrawals) {
      const user = await User.findById(withdrawal.user);
      if (!user) {
        console.error('User not found for withdrawal:', withdrawal._id);
        continue;
      }

      // Fetch room without trying to populate game_type
      const room = await Room.findById(withdrawal.room).lean();
      if (!room) {
        console.error('Room not found for withdrawal:', withdrawal.room);
        continue;
      }

      // Validate connectedAccount
      let toPubkey;
      try {
        toPubkey = new PublicKey(withdrawal.connectedAccount);
      } catch (error) {
        console.error('Invalid connectedAccount for withdrawal:', withdrawal._id, error);
        continue;
      }

      // Load admin wallet secret
      const walletKey = process.env.wk;
      if (!walletKey) {
        console.error('Admin wallet secret not set in env');
        continue;
      }

      let secretKey;
      try {
        secretKey = bs58.decode(walletKey);
      } catch (error) {
        console.error('Failed to decode walletKey:', error);
        continue;
      }
      if (secretKey.length !== 64) {
        console.error('Invalid secret key size. Must be 64 bytes.');
        continue;
      }

      const walletKeyPair = Keypair.fromSecretKey(secretKey);
      const lamports = Math.floor(withdrawal.amount * LAMPORTS_PER_SOL);

      const { blockhash, lastValidBlockHeight } = await provider.getLatestBlockhash();
      const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletKeyPair.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: walletKeyPair.publicKey,
          toPubkey,
          lamports,
        })
      );

      let signature;
      try {
        signature = await provider.sendTransaction(tx, [walletKeyPair]);
        await provider.confirmTransaction({ signature, blockhash, lastValidBlockHeight });
      } catch (err) {
        console.error('Error sending withdrawal transaction:', err);
        continue;
      }

      console.log(`Withdrawal sent: https://explorer.solana.com/tx/${signature}`);

      withdrawal.status = 'completed';
      withdrawal.hash = signature;
      await saveDocumentWithRetry(withdrawal);

      // Notify user
      const notification = new Notification({
        from: user._id,
        to: user._id,
        amount: withdrawal.amount,
        room: withdrawal.room,
        message: 'Winnings sent to your wallet',
      });
      const notificationData = {
        message: notification.message,
        username: user.username,
        avatar: user.avatar,
        accessory: user.accessory,
        elite: user.elite,
        rank: user.totalWagered,
        amount: withdrawal.amount,
        created_at: moment().format('YYYY-MM-DD HH:mm'),
        created_at_str: moment().format('LLL'),
        updated_at: moment().format('YYYY-MM-DD HH:mm'),
        is_read: false,
      };

      // Send updated balance
      try {
        const solBalLamports = await provider.getBalance(toPubkey);
        const solBalance = solBalLamports / LAMPORTS_PER_SOL;
        socketController.sendBalanceUpdate(user._id, { solanaBalance: solBalance });
      } catch (balanceErr) {
        console.error('Failed to fetch Solana balance:', balanceErr);
      }

      await saveDocumentWithRetry(notification);
      socketController.sendNotification(user._id, notificationData);
      socketController.newTransaction(withdrawal);
    }
  } catch (error) {
    console.error('Error checking confirmations:', error);
  } finally {
    isProcessing = false;
  }
}

// Initialize cron with redis client
function initializeCron(redisClient) {
  // Run every 10 seconds
  cron.schedule('*/10 * * * * *', () => checkConfirmations(redisClient));
}

module.exports = {
  checkConfirmations,
  initializeCron,
};
