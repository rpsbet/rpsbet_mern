// Import the necessary modules and configurations
const cron = require('node-cron');
const ethers = require('ethers');
const { JsonRpcProvider } = require('@ethersproject/providers');
const User = require('../../model/User');

// Import the Transaction model
const Transaction = require('../../model/Transaction');
const { setBalance } = require('../../routes/user.routes');

const provider = new JsonRpcProvider(
  'https://mainnet.infura.io/v3/3f535fe3cae1467a92d14001d9754c09'
);

// Initialize your Ethereum provider and other necessary variables here

// Define the confirmation threshold for deposit transactions
const confirmationThreshold = 6; // Adjust as needed

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
      if (tx && tx.blockNumber) {
          console.log('tx', tx);
        const confirmations = currentBlock - tx.blockNumber;
        if (confirmations >= confirmationThreshold) {
            // console.log('balance');
            // Get the user associated with the transaction
            const user = await User.findById(deposit.user);
            // console.log('balance1', user);
          if (user) {
            // console.log('balaneww');

            // Update the deposit status to 'completed'
            deposit.status = 'completed';
            await deposit.save();

            // Update the user's balance
            user.balance += deposit.amount; // Assuming deposit.amount is the deposited amount
            await user.save();
                        // console.log('balance2');

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
  checkConfirmations
};
