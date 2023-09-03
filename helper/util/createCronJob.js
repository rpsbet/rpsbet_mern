// Import the necessary modules and configurations
const cron = require('node-cron');
const ethers = require('ethers');
const { JsonRpcProvider } = require('@ethersproject/providers');
const User = require('../../model/User');

// Import the Transaction model
const Transaction = require('../../model/Transaction');
const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/3f535fe3cae1467a92d14001d9754c09'); // Replace 'YOUR_INFURA_PROJECT_ID' with your actual Infura project ID.

// Initialize your Ethereum provider and other necessary variables here

// Define the confirmation threshold for deposit transactions
const confirmationThreshold = 6; // Adjust as needed

// Define a function to calculate and update the user's balance
async function updateUserBalance(user) {
  try {
    // Calculate the user's balance based on relevant transactions
    const userTransactions = await Transaction.find({ user: user._id, status: 'completed' });
    let userBalance = 0;

    for (const transaction of userTransactions) {
      userBalance += transaction.amount;
    }
    console.log('userTransactions', userTransactions);

    // Update the user's balance in the database
    user.balance = userBalance;
    await user.save();
  } catch (error) {
    console.error('Error updating user balance:', error);
  }
}

// Define a function to periodically check for confirmations
async function checkConfirmations() {
  try {
    // Implement the logic to check for confirmations
    // Query the Ethereum network for pending deposit requests and check their confirmations
    // Update the user's balances as needed
    const currentBlock = await provider.getBlockNumber();

    const pendingDeposits = await Transaction.find({ status: 'pending' });
    // console.log('pending', pendingDeposits);

    for (const deposit of pendingDeposits) {
      const tx = await provider.getTransaction(deposit.hash);
    //   console.log('tx', tx);
      if (tx && tx.blockNumber) {
        const confirmations = currentBlock - tx.blockNumber;
        if (confirmations >= confirmationThreshold) {
          // Update the user's balance and mark the deposit as completed
          deposit.status = 'completed';
          await deposit.save();

          // Get the user associated with the transaction and update their balance
          const user = await User.findById(deposit.user);
          if (user) {
            updateUserBalance(user);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking confirmations:', error);
  }
}

// Schedule the task to run every minute (adjust the cron schedule as needed)
cron.schedule('* * * * *', checkConfirmations);

// Export any necessary functions or variables for use in your application
module.exports = {
  checkConfirmations,
};
