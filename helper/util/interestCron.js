const moment = require('moment');
const cron = require('node-cron');
const Room = require('../../model/Room.js');
const User = require('../../model/User');
const Notification = require('../../model/Notification.js');
const SystemSetting = require('../../model/SystemSetting');
const saveDocumentWithRetry = require('./retrySave');
const socketController = require('../../socketController.js');
const convertToCurrency = require('../../helper/util/conversion');
const senderId = '629685058f368a1838372754';

let socketio = null;
async function updateRoomInterests(io) {
  if (io) {
    socketio = io;
  }

  try {
    let system = await User.findOne({ _id: senderId });

    let interestSetting = await SystemSetting.findOne({ name: 'last_updated_interest' });
    if (interestSetting) {
      const lastUpdated = interestSetting.updated_at;
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 33);
      

      if (lastUpdated <= fiveMinutesAgo) {
        const bonusRooms = await Room.find({ status: 'open', is_private: 'false' });
        for (const bonusRoom of bonusRooms) {
          const req = {
            params: { _id: bonusRoom._id },
            io: socketio,
            body: {
              _id: bonusRoom._id,
              user_bet: bonusRoom.user_bet,
            }
          };
          let userBet = parseFloat(bonusRoom.user_bet);
          const newInterest = userBet * 1.0000001;  // 10x the original interest calculation
          const interestAdded = newInterest - userBet;  // Calculate the actual interest added
          
          bonusRoom.user_bet = newInterest.toString();  // Update the user_bet with the new interest
          bonusRoom.pr = bonusRoom.pr + interestAdded;  // Increase the pr by the actual interest added
          
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
            amount: userBet * 0.0000001,
            message: `Interest earned (${convertToCurrency(userBet * 0.0000001)})`,
            is_read: false
          });

          const notificationData = {
            message: notification.message,
            username: system.username,
            avatar: system.avatar,
            accessory: system.accessory,
            amount: userBet * 0.0000001,
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
        // const message = 'Daily dividends dispersed to all live games at an interest rate of 0.004%';
        // const messageType = 'text';

        // const avatar = system.avatar || '';
        // const accessory = system.accessory || '';
        // const rank = system.totalWagered || 0;

        // const replyTo = null;

        // const data = {
        //   sender: system.username,
        //   senderId: senderId,
        //   message: message,
        //   messageType: messageType,
        //   avatar: avatar,
        //   accessory: accessory,
        //   rank: rank,
        //   replyTo: replyTo,
        // };
        interestSetting.updated_at = new Date();
        await interestSetting.save();
        // socketController.globalChatSend(socketio, data);
      }
    }
  } catch (error) {
    console.error('Error updating room interests:', error);
  }
}

cron.schedule('*/99 * * * *', async () => {
  await updateRoomInterests();
});


module.exports = {
  updateRoomInterests,
};
