// creditScoreCron.js
const moment = require('moment');
const cron = require('node-cron');
const Chat = require('../../model/Chat');
const Loan = require('../../model/Loan');
const User = require('../../model/User');
const socketController = require('../../socketController.js');
const SystemSetting = require('../../model/SystemSetting');
const Room = require('../../model/Room.js');
const Notification = require('../../model/Notification.js');
const saveDocumentWithRetry = require('./retrySave');
const senderId = '629685058f368a1838372754';
const convertToCurrency = require('../../helper/util/conversion');

let socketio = null;
async function checkOutstandingLoans(io) {
  if (io) {
    socketio = io;
  }

  try {
    let system = await User.findOne({ _id: senderId });

    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_loans' });
    let interestSetting = await SystemSetting.findOne({ name: 'last_updated_interest' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
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
            // If the credit_score field doesn't exist, you can skip or initialize it
            // For example, you can initialize it to a default value
            user.credit_score = 0;
            await user.save();
          }
        }

        const message = 'Daily debt check complete, credit scores have updated.';
        const messageType = 'text';

        // Extract relevant user information
        const avatar = system.avatar || '';
        const accessory = system.accessory || '';
        const rank = system.totalWagered || 0;

        const replyTo = null; // No need for a reply in this case

        const data = {
          sender: system.username, // Assuming there's a 'username' field in the User model
          senderId: senderId,
          message: message,
          messageType: messageType,
          avatar: avatar,
          accessory: accessory,
          rank: rank,
          replyTo: replyTo,
        };

        // await processingMessage.save();
        socketController.globalChatSend(socketio, data);
        systemSetting.updated_at = new Date();
        await systemSetting.save();
      } else {
        console.log("Last credit score scheck was less than 24 hours ago. Skipping.");
      }
    } else {
      console.log("System setting last updated not found.");
    }
    if (interestSetting) {
      const lastUpdated = interestSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        // update room interests
        const bonusRooms = await Room.find({
          status: 'open',
        });
        for (const bonusRoom of bonusRooms) {
          const req = {
            params: {
              _id: bonusRoom._id
            },
            io: socketio,
            body: {
              _id: bonusRoom._id,
              user_bet: bonusRoom.user_bet,
            }
          };
          let userBet = parseFloat(bonusRoom.user_bet); // Changed to let
          const interest = userBet * 1.004;
          userBet = (userBet + interest).toString();
          bonusRoom.user_bet = userBet;
          bonusRoom.pr = bonusRoom.pr + (userBet * 0.004);
          await saveDocumentWithRetry(bonusRoom);
          if (req.io.sockets) {
            req.io.sockets.emit(`UPDATED_BANKROLL2_${bonusRoom._id}`, {
              bankroll: bonusRoom.user_bet,
            });
          }

          const notification = new Notification({
            from: senderId,
            to: bonusRoom.creator,
            room: bonusRoom._id,
            message: `Interest earned (${convertToCurrency(userBet * 0.004)})`,
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

          socketController.sendNotification(bonusRoom.creator, notificationData);
        }
        const message = 'Daily dividends dispersed to all live games at an interest rate of 0.004%';
        const messageType = 'text';

        // Extract relevant user information
        const avatar = system.avatar || '';
        const accessory = system.accessory || '';
        const rank = system.totalWagered || 0;

        const replyTo = null; // No need for a reply in this case

        const data = {
          sender: system.username, // Assuming there's a 'username' field in the User model
          senderId: senderId,
          message: message,
          messageType: messageType,
          avatar: avatar,
          accessory: accessory,
          rank: rank,
          replyTo: replyTo,
        };
        interestSetting.updated_at = new Date();
        await interestSetting.save();
        // await processingMessage.save();
        socketController.globalChatSend(socketio, data);
      }
    }

  } catch (error) {
    console.error('Error updating credit scores:', error);
  }
}

// Schedule the cron job to run every day at 00:30 (12:30 AM)
cron.schedule('36 0 * * *', async () => {
  await checkOutstandingLoans();
});

// Export an object containing the function
module.exports = {
  checkOutstandingLoans,
};
