// checkAccessTime.js

const MAX_RETRIES = 1;
let user_access_log = {};

async function check_access_time(user_id, betAmount = 0, retryCount = 0) {
  // Dynamic rate limiting based on bet amount
  let cooldownTime = 500; // Default 500ms for small bets
  
  if (betAmount >= 0.01) {
    cooldownTime = 200; // Reduce to 200ms for larger bets (0.01 SOL and above)
  } else if (betAmount >= 0.001) {
    cooldownTime = 300; // 300ms for medium bets
  }
  
  const check_result =
    user_access_log[user_id] && Date.now() - user_access_log[user_id] < cooldownTime
      ? false
      : true;

  user_access_log[user_id] = Date.now();

  if (!check_result && retryCount < MAX_RETRIES) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await check_access_time(user_id, betAmount, retryCount + 1);
        resolve(result);
      }, cooldownTime);
    });
  }

  return check_result;
}

module.exports = check_access_time;
