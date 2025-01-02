const moment = require('moment');
const cron = require('node-cron');
const Loan = require('../../model/Loan');
const User = require('../../model/User');
const socketController = require('../../socketController.js');
const SystemSetting = require('../../model/SystemSetting');
const Notification = require('../../model/Notification.js');
const saveDocumentWithRetry = require('./retrySave');
const senderId = '629685058f368a1838372754';

let socketio = null;
async function checkOutstandingLoans(io) {
  if (io) {
    socketio = io;
  }

  try {
    let system = await User.findOne({ _id: senderId });

    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_loans' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        const users = await User.find();

        for (const user of users) {
          if ('credit_score' in user) {
            const loans = await Loan.find();
            for (const loan of loans) {
              for (const loanerObj of loan.loaners) {
                if (loanerObj.user.equals(user._id)) {
                  if (
                    parseFloat(loanerObj.paidBack) <= loanerObj.amount &&
                    loan.loan_period > 0 &&
                    (Date.now() - loan.created_at.getTime()) / (1000 * 60 * 60 * 24) > loan.loan_period
                  ) {
                    if (user.credit_score > 0) {
                      user.credit_score -= 100;
                      await user.save();

                      const notification = new Notification({
                        from: senderId,
                        to: user._id,
                        room: '',
                        message: `Your credit score has been deducted for outstanding payments.`,
                        is_read: false
                      });

                      const notificationData = {
                        message: notification.message,
                        username: system.username,
                        avatar: system.avatar,
                        accessory: system.accessory,
                        rank: system.totalWagered,
                        created_at: moment().format('YYYY-MM-DD HH:mm'),
                        created_at_str: moment().format('LLL'),
                        updated_at: moment().format('YYYY-MM-DD HH:mm'),
                      };

                      await Promise.all([
                        saveDocumentWithRetry(notification),
                      ]);

                      socketController.sendNotification(senderId, notificationData);
                    }
                  }
                }
              }
            }
          } else {
            user.credit_score = 0;
            await user.save();
          }
        }

        const message = 'Daily debt check complete, credit scores have updated.';
        const messageType = 'text';

        const avatar = system.avatar || '';
        const accessory = system.accessory || '';
        const rank = system.totalWagered || 0;

        const replyTo = null;

        const data = {
          sender: system.username,
          senderId: senderId,
          message: message,
          messageType: messageType,
          avatar: avatar,
          accessory: accessory,
          rank: rank,
          replyTo: replyTo,
        };
        if (io) {
          socketController.globalChatSend(socketio, data);
        }
        systemSetting.updated_at = new Date();
        await systemSetting.save();
      }
    } else {
      console.log("System setting last updated not found.");
    }

  } catch (error) {
    console.error('Error updating credit scores:', error);
  }
}

cron.schedule('00 00 * * *', async () => {
  await checkOutstandingLoans();
});

module.exports = {
  checkOutstandingLoans,
};
