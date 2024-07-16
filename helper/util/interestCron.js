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
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 9);
      

      if (lastUpdated <= fiveMinutesAgo) {
        const bonusRooms = await Room.find({ status: 'open' });
        for (const bonusRoom of bonusRooms) {
          console.log( " bonusRoom._id", bonusRoom._id);
          const req = {
            params: { _id: bonusRoom._id },
            io: socketio,
            body: {
              _id: bonusRoom._id,
              user_bet: bonusRoom.user_bet,
            }
          };
          let userBet = parseFloat(bonusRoom.user_bet);
          const interest = userBet * 1.0004;
          bonusRoom.user_bet = interest.toString();
          bonusRoom.pr = bonusRoom.pr + (userBet * 0.0004);
          await saveDocumentWithRetry(bonusRoom);
          console.log( " saved._id", bonusRoom._id);

          if (req.io.sockets) {
            req.io.sockets.emit(`UPDATED_BANKROLL2_${bonusRoom._id}`, {
              bankroll: bonusRoom.user_bet,
            });
          }

          const notification = new Notification({
            from: senderId,
            to: bonusRoom.creator,
            room: bonusRoom._id,
            message: `Interest earned (${convertToCurrency(userBet * 0.0004)})`,
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
          console.log("send socke")
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

cron.schedule('*/9 * * * *', async () => {
  console.log("called interest")
  await updateRoomInterests();
});


module.exports = {
  updateRoomInterests,
};
