// withdrawalCron.js
const cron = require('node-cron');
const User = require('../../model/User');
const SystemSetting = require('../../model/SystemSetting');
const Receipts = require('../../model/Receipt');
const Vaults = require('../../model/Vault');

const DEFAULT_THRESHOLD = 4.269;
const ACTIVE_USER_THRESHOLD = 6.369;
const EXCLUDED_USERS = ['Tydrellinbg', 'SYSTEM', 'pimpedpistols', 'Bearbland11'];

async function getUserFinancialData(userId) {
  const [receipts, vault] = await Promise.all([
    Receipts.find({ user_id: userId }),
    Vaults.findOne({ user: userId })
  ]);
  
  return {
    hasDeposits: receipts.some(receipt => receipt.payment_type === 'Deposit'),
    hasWithdrawals: receipts.some(receipt => receipt.payment_type === 'Withdraw'),
    vaultBalance: vault ? vault.balance : 0
  };
}

async function handleSuspiciousUser(user, message) {
  user.balance = user.balance * -1;
  await user.save();
  console.log(message, user.username);
}

function getUserThreshold(user) {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  const isOldAccount = user.created_at <= threeMonthsAgo;
  const isActiveUser = 
    (user.gamesPlayed && user.gamesPlayed > 1000) ||
    (user.totalWagered && user.totalWagered > 100) ||
    (user.totalTraded && user.totalTraded > 100);

  return isOldAccount && isActiveUser ? ACTIVE_USER_THRESHOLD : DEFAULT_THRESHOLD;
}

async function processUser(user) {
  if (EXCLUDED_USERS.includes(user.username)) return;

  const { hasDeposits, hasWithdrawals, vaultBalance } = await getUserFinancialData(user._id);
  const totalBalance = user.balance + vaultBalance;
  const hasDailyWithdrawals = 'dailyWithdrawals' in user;
  const dailyWithdrawals = hasDailyWithdrawals ? user.dailyWithdrawals : 0;
  const threshold = getUserThreshold(user);

  const isWithinThreshold = dailyWithdrawals < threshold && totalBalance < threshold;

  if (isWithinThreshold) {
    user.dailyWithdrawals = 0;
    if (hasWithdrawals && !hasDeposits) {
      await handleSuspiciousUser(user, "NO DEPOSITS DETECTED FOR WITHDRAWALS");
    } else {
      await user.save();
    }
  } else {
    await handleSuspiciousUser(user, "POTENTIAL HACKER ALERT");
  }
}

async function shouldRunReset(lastUpdated) {
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  return lastUpdated <= twentyFourHoursAgo;
}

async function resetWithdrawalLimits() {
  try {
    const systemSetting = await SystemSetting.findOne({ name: 'last_updated_withdrawals' });
    
    if (!systemSetting) {
      console.log("System setting for last updated not found.");
      return;
    }

    if (await shouldRunReset(systemSetting.updated_at)) {
      const users = await User.find();
      await Promise.all(users.map(user => processUser(user)));
      
      systemSetting.updated_at = new Date();
      await systemSetting.save();
    }
  } catch (error) {
    console.error('Error updating withdrawal limits:', error);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', resetWithdrawalLimits);

// Export an object containing the function
module.exports = {
  resetWithdrawalLimits,
};