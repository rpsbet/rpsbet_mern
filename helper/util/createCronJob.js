// Import the necessary modules and configurations
const cron = require('node-cron');
const { JsonRpcProvider } = require('@ethersproject/providers');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const { setBalance } = require('../../routes/user.routes');
const axios = require('axios');
const { ethers } = require('ethers');
const walletKey = process.env.wk;
const convertToCurrency = require('./conversion');

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/5fedb9ded8fd4b149026d0140baacf98');
const API_KEY = 'ZBZK3XM-QNHM89H-MKXVFCD-TV6MW1N';

const withdrawalConfirmationThreshold = 2;
const depositConfirmationThreshold = 6;
const socketController = require('../../socketController');

let socketio = null;

async function getWalletBalance(signer) {
  const walletAddress = await signer.getAddress();

  const balance = await signer.provider.getBalance(walletAddress);

  const balanceInEther = ethers.utils.formatEther(balance);

  return balanceInEther;
}

async function checkConfirmations(io) {
  try {
    const currentBlock = await provider.getBlockNumber();
    const pendingTransactions = await Transaction.find({ status: 'pending' });
    const waitingTransactions = await Transaction.find({ status: 'waiting' });
    
    let isDeposit = transaction.description === 'deposit';
    let isWithdrawal = transaction.description === 'withdraw';
    let referralOwner = null;
    if (io) {
      socketio = io;
    }
    // Process web3 transactions
    for (const transaction of pendingTransactions) {
      const tx = await provider.getTransaction(transaction.hash);
      if (tx && tx.blockNumber) {
        const confirmations = currentBlock - tx.blockNumber;


        if (isDeposit && confirmations >= depositConfirmationThreshold) {
          console.log('Processing deposit transaction...');
          const user = await User.findById(transaction.user);
          const message = `Received ${convertToCurrency(transaction.amount)} in referral rewards from ${user.username}.`;

          if (user) {
            transaction.status = 'completed';
            await transaction.save();
            user.balance += transaction.amount;
            await user.save();
            console.log('Deposit transaction processed successfully.');

            if (user.referralCode && user.referralCode.trim() !== "") {
              referralOwner = await User.findOne({ referralCode: user.referralCode });
            }
            // If there is a referral owner, update their balance
            if (referralOwner) {
              referralOwner.balance += (transaction.amount * 0.05);
              referralOwner.rewards += (transaction.amount * 0.05);
              await referralOwner.save();
            }

            const notificationData = {
              _id: user._id,
              message: message,
              username: user.username,
              avatar: user.avatar,
              accessory: user.accessory,
              rank: user.totalWagered,
              created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              created_at_str: moment(new Date()).format('LLL'),
              updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              is_read: false
            };

            socketController.sendNotification(referralOwner._id, notificationData);

          }
        } else if (isWithdrawal && confirmations >= withdrawalConfirmationThreshold) {
          console.log('Processing withdrawal transaction...');
          const user = await User.findById(transaction.user);
          if (user) {
            transaction.status = 'completed';
            await transaction.save();


            const signer = new ethers.Wallet(walletKey, provider);

            try {
              const amountTransfer = ethers.utils.parseUnits(String(req.body.amount), 'ether');

              const block = await provider.getBlock('latest');
              const baseFeeGwei = ethers.utils.formatUnits(block.baseFeePerGas, 'gwei');
              const priorityFeeGwei = '2.5';
              const gasLimit = await provider.estimateGas({
                to: req.body.addressTo,
                value: amountTransfer
              });

              // Calculate gas fee in wei
              const gasPrice = ethers.utils.parseUnits(baseFeeGwei, 'gwei')
                .add(ethers.utils.parseUnits(priorityFeeGwei, 'gwei'));

              const gasFee = gasPrice.mul(gasLimit);

              const balanceInEther = await getWalletBalance(signer);

              const balanceWei = ethers.utils.parseEther(balanceInEther);

              // Subtract gas fee from balance in wei
              const differenceWei = balanceWei.sub(gasFee);

              // console.log("Balance in Wei:", balanceWei.toString());
              // console.log("Gas Fee in Wei:", gasFee.toString());
              // console.log("Difference in Wei:", differenceWei.toString());

              if (differenceWei.lt(0)) {
                console.log("Insufficient funds to cover gas fee");
                return res.json({
                  success: false,
                  message: 'Insufficient funds to cover gas fee'
                });
              }


              const realEth = amountTransfer.sub(gasFee);

              if ((req.user.balance - req.body.amount < 0) || (parseFloat(req.user.dailyWithdrawals) + parseFloat(req.body.amount) > 0.2)) {
                console.log("Insufficient funds");
                return res.json({
                  success: false,
                  message: 'Insufficient funds'
                });
              }
              // Update the user's balance accordingly
              req.user.balance = req.user.balance - parseFloat(req.body.amount);
              req.user.dailyWithdrawals = parseFloat(req.user.dailyWithdrawals) + parseFloat(req.body.amount);
              await req.user.save();

              console.log("Sending transaction...");

              tx = await signer.sendTransaction({
                to: req.body.addressTo,
                value: realEth,
                gasLimit: ethers.utils.hexlify(gasLimit),
                gasPrice: ethers.utils.hexlify(gasPrice)
              });

              console.log("Transaction hash:", tx.hash);

              const receipt = await tx.wait();

              console.log("Transaction mined in block:", receipt.blockNumber);

            } catch (e) {
              console.log(e);
              return res.json({
                success: false,
                message: 'Failed in sending transaction'
              });
            }

            console.log('Withdrawal transaction processed successfully.');
          }
        }
      }
    }

    // Process web2 transactions (deposits)
    for (const transaction of waitingTransactions) {

      const paymentId = transaction.hash;
      console.log(paymentId)
      if (isDeposit && paymentId) {

        const response = await axios.get(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });

        const paymentStatus = response.data.payment_status;
        if (paymentStatus === 'finished') {
          const user = await User.findById(transaction.user);
          if (user) {
            transaction.status = 'completed';
            await transaction.save();
            user.balance += transaction.amount;
            await user.save();
            console.log('Deposit transaction processed successfully.');

            if (user.referralCode && user.referralCode.trim() !== "") {
              referralOwner = await User.findOne({ referralCode: user.referralCode });
            }
            // If there is a referral owner, update their balance
            if (referralOwner) {
              referralOwner.balance += (transaction.amount * 0.05);
              referralOwner.rewards += (transaction.amount * 0.05);
              await referralOwner.save();
            }
            const notificationData = {
              _id: user._id,
              message: message,
              username: user.username,
              avatar: user.avatar,
              accessory: user.accessory,
              rank: user.totalWagered,
              created_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              created_at_str: moment(new Date()).format('LLL'),
              updated_at: moment(new Date()).format('YYYY-MM-DD HH:mm'),
              is_read: false
            };

            socketController.sendNotification(referralOwner._id, notificationData);

          }
        }
      } else if (isWithdrawal) {
        const payload = {
          address: sendAddress,
          currency: currencyTo,
          amount: web2Amount,
          extra_id: extraId,
        };

        const response = await axios.post('https://api.nowpayments.io/v1/payout', payload, {
          headers: {
            'x-api-key': API_KEY,
            'Content-Type': 'application/json',
          },
        });
        const paymentStatus = response.data.payment_status;
        if (paymentStatus === 'finished') {
          const user = await User.findById(transaction.user);
          if (user) {
            transaction.status = 'completed';
            await transaction.save();
            user.balance += transaction.amount;
            await user.save();
            console.log('Withdrawal transaction processed successfully.');
          }
        }
      }
    }

  } catch (error) {
    console.error('Error checking confirmations:', error);
  }
}


cron.schedule('*/5 * * * * *', checkConfirmations);

// Export any necessary functions or variables for use in your application
module.exports = {
  checkConfirmations
};
