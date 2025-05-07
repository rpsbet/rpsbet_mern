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

const provider = new Connection(process.env.PROVIDER_URL, 'confirmed');
const depositConfirmationThreshold = 6;
let isProcessing = false;

async function checkConfirmations(io) {
  try {
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
        console.error('Admin wallet not found in transaction:', txSignature);
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
          console.error('User not found for transaction:', transaction._id);
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
          `Deposit mismatch. On-chain deposit: ${depositSOL}, expected: ${transaction.amount}`
        );
      }
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

      const room = await Room.findById(withdrawal.room)
        .populate({
          path: 'game_type',
          model: GameType,
          select: 'game_type_name short_name',
        });
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
      let walletKey = process.env.wk;
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

      // Convert amount to lamports
      const lamports = Math.floor(withdrawal.amount * LAMPORTS_PER_SOL);

      // Get a fresh blockhash
      const { blockhash, lastValidBlockHeight } = await provider.getLatestBlockhash();

      // Build the transaction
      const transaction = new Transaction({
        recentBlockhash: blockhash,
        feePayer: walletKeyPair.publicKey,
      }).add(
        SystemProgram.transfer({
          fromPubkey: walletKeyPair.publicKey,
          toPubkey,
          lamports,
        })
      );

      // Send and confirm the transaction
      let signature;
      try {
        signature = await provider.sendTransaction(transaction, [walletKeyPair]);
        await provider.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight,
        });
      } catch (err) {
        console.error('Error sending withdrawal transaction:', err);
        continue;
      }

      console.log(
        `Withdrawal transaction sent: https://explorer.solana.com/tx/${signature}`
      );

      // Update transaction
      withdrawal.status = 'completed';
      withdrawal.hash = signature;
      await saveDocumentWithRetry(withdrawal);


      // Notify user of withdrawal
      const notification = new Notification({
        from: user._id,
        to: user._id,
        amount: withdrawal.amount,
        room: withdrawal.room,
        message: `Winnings sent to your wallet`,
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

      // Fetch and send updated Solana balance
      let solBalance;
      try {
        const solBalLamports = await provider.getBalance(toPubkey);
        solBalance = solBalLamports / LAMPORTS_PER_SOL;
        socketController.sendBalanceUpdate(user._id, { solanaBalance: solBalance });
      } catch (balanceError) {
        console.error('Failed to fetch Solana balance for withdrawal:', balanceError);
        // Continue even if balance fetch fails
      }

      await saveDocumentWithRetry(notification);
      await saveDocumentWithRetry(withdrawal);
      socketController.sendNotification(user._id, notificationData);
      socketController.newTransaction(withdrawal);
    }
  } catch (error) {
    console.error('Error checking confirmations:', error);
  } finally {
    isProcessing = false;
  }
}

// Run every 10 seconds
cron.schedule('*/10 * * * * *', () => checkConfirmations());

module.exports = {
  checkConfirmations,
};