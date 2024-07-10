// withdrawalCron.js

const cron = require('node-cron');
const User = require('../../model/User');
const SystemSetting = require('../../model/SystemSetting');

async function resetWithdrawalLimits() {

  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_withdrawals' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        // Get all users from the database
        const users = await User.find();

        // Iterate through all users and update credit scores
        for (const user of users) {
          if (
            user.username === 'Tydrellinbg' ||
            user.username === 'SYSTEM' ||
            user.username === 'WHALE WATCHERS' ||
            user.username === 'NO BROKIES' ||
            user.username === 'SUPPORT' ||
            user.username === 'malcho' ||
            user.username === 'OFFICIALRPSGAME' ||
            user.username === 'PimpedPistols' ||
            user.username === 'smellyfingers' ||
            user.username === 'Bearbland11' ||
            user.username === 'annyeong' ||
            user.username === '🔥 THE DON 🔥 (BOT #1)' ||
            user.username === '🪨 ROCKY 🪨 (BOT #2)' ||
            user.username === '✂️ CAESAR ✂️ (BOT #4)' ||
            user.username === '📃 PAPÎER 📃 (BOT #3)'
          ) {
            continue;
          }

          // Check if the user has the credit_score field
          if ('dailyWithdrawals' in user) {
            // Ensure credit score doesn't go below a certain threshold (e.g., 0)
            if (user.balance < 400) {
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
        systemSetting.updated_at = new Date();
        await systemSetting.save();
      } else {
        console.log("Last wd check was less than 24 hours ago. Skipping.");
      }
    } else {
      console.log("System setting for last updated not found.");
    }
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
