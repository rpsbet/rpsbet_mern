// creditScoreCron.js

const cron = require('node-cron');

const Loan = require('../../model/Loan');
const User = require('../../model/User');

async function checkOutstandingLoans() {
  try {
    // Get all users from the database
    const users = await User.find();

    // Iterate through all users and update credit scores
    for (const user of users) {
      // Check if the user has the credit_score field
      if ('credit_score' in user) {
        // Loop through all loans
        const loans = await Loan.find();
        for (const loan of loans) {
          // Loop through loaners array in each loan
          for (const loanerObj of loan.loaners) {
            // Check if the loaner matches the current user
            if (loanerObj.user.equals(user._id)) {
              // Check conditions for scoring
              if (
                loanerObj.paidBack <= loanerObj.amount &&
                loan.loan_period > 0 &&
                (Date.now() - loan.created_at.getTime()) / (1000 * 60 * 60 * 24) > loan.loan_period
              ) {
                // Ensure credit score doesn't go below a certain threshold (e.g., 0)
                if (user.credit_score > 0) {
                  user.credit_score -= 100;
                  await user.save();
                }
              }
            }
          }
        }
      } else {
        // If the credit_score field doesn't exist, you can skip or initialize it
        // For example, you can initialize it to a default value
        user.credit_score = 0;
        await user.save();
      }
    }

    console.log('Credit scores updated successfully.');
  } catch (error) {
    console.error('Error updating credit scores:', error);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await checkOutstandingLoans();
});

// Export an object containing the function
module.exports = {
  checkOutstandingLoans,
};
