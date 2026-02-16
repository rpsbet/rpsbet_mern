const jwt = require('jsonwebtoken');
const User = require('../model/User');
const { shouldUseDummyData, getUserOrFallback } = require('../helper/util/dummyData');

// eslint-disable-next-line consistent-return
module.exports = async function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  if (shouldUseDummyData()) {
    let userId = 'offline-user';
    if (token) {
      try {
        const decoded = jwt.decode(token) || {};
        userId = decoded.id || decoded._id || userId;
      } catch (err) {
        // Ignore token parsing errors in dummy mode
      }
    }

    const dummyUser = getUserOrFallback(userId);
    req.user = {
      ...dummyUser,
      dailyWithdrawals: 0,
      isWithdrawing: false,
      totalTraded: 0,
      tradingProfit: 0,
      status: 'on',
    };
    return next();
  }
 
  // Check if not token
  if (!token) {
    return res.json({
      success: false,
      // message: 'FURR-SST LOG IN!'
    });
  }
  
  // Verify token
  try {
    const { id, is_admin } = jwt.verify(token, process.env.SECRET_OR_KEY);
    let user;
 
    user = await User.findOne({ _id: id });
    if (!user)
      return res.json({ success: false, error: 'user token not valid' });
    user.status = 'on';
    await user.save();
    req.user = user;
    next();
  } catch (err) {
    res.json({ success: false, message: 'Successful!' });
  }
};
