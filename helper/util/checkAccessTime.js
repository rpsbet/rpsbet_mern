// checkAccessTime.js

const MAX_RETRIES = 5;
let user_access_log = {};

async function check_access_time(user_id, retryCount = 0) {
  const check_result =
    user_access_log[user_id] && Date.now() - user_access_log[user_id] < 1500
      ? false
      : true;

  user_access_log[user_id] = Date.now();

  if (!check_result && retryCount < MAX_RETRIES) {
    return new Promise((resolve) => {
      setTimeout(async () => {
        const result = await check_access_time(user_id, retryCount + 1);
        resolve(result);
      }, 1500);
    });
  }

  return check_result;
}

module.exports = check_access_time;
