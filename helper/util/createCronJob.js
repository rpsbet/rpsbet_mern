// Import the necessary modules and configurations
const cron = require('node-cron');
const ethers = require('ethers');
const { JsonRpcProvider } = require('@ethersproject/providers');
const User = require('../../model/User');
const Transaction = require('../../model/Transaction');
const { setBalance } = require('../../routes/user.routes');

const provider = new JsonRpcProvider('https://mainnet.infura.io/v3/3f535fe3cae1467a92d14001d9754c09');

// Define the confirmation thresholds
const withdrawalConfirmationThreshold = 0;
const depositConfirmationThreshold = 6;

// Define a function to periodically check for confirmations
async function checkConfirmations() {
  try {
    // console.log('Checking for confirmations...');

    const currentBlock = await provider.getBlockNumber();
    const pendingTransactions = await Transaction.find({ status: 'pending' });

    for (const transaction of pendingTransactions) {
      const tx = await provider.getTransaction(transaction.hash);
      if (tx && tx.blockNumber) {
        const confirmations = currentBlock - tx.blockNumber;

        // Determine if it's a deposit or withdrawal
        let isDeposit = transaction.description === 'deposit';
        let isWithdrawal = transaction.description === 'withdraw';

        // console.log(`Transaction hash: ${transaction.hash}`);
        // console.log(`Confirmations: ${confirmations}`);
        // console.log(`Is deposit: ${isDeposit}`);
        // console.log(`Is withdrawal: ${isWithdrawal}`);

        if (isDeposit && confirmations >= depositConfirmationThreshold) {
          console.log('Processing deposit transaction...');

          // Get the user associated with the transaction
          const user = await User.findById(transaction.user);

          if (user) {
            // Update the transaction status to 'completed'
            transaction.status = 'completed';
            await transaction.save();

            // Update the user's balance accordingly
            user.balance += transaction.amount;
            await user.save();
            console.log('Deposit transaction processed successfully.');
          }
        } else if (isWithdrawal && confirmations >= withdrawalConfirmationThreshold) {
          console.log('Processing withdrawal transaction...');

          // Get the user associated with the transaction
          const user = await User.findById(transaction.user);

          if (user) {
            // Update the transaction status to 'completed'
            transaction.status = 'completed';
            await transaction.save();

            // Update the user's balance accordingly
            user.balance -= transaction.amount;
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

// Schedule the task to run every 20 seconds
cron.schedule('*/5 * * * * *', checkConfirmations);

// Export any necessary functions or variables for use in your application
module.exports = {
  checkConfirmations
};