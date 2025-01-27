// creditScoreCron.js

const cron = require('node-cron');
const Notification = require('../../model/Notification');
const Chat = require('../../model/Chat');
const RpsBetItem = require('../../model/RpsBetItem');
const QsBetItem = require('../../model/QsBetItem');
const SystemSetting = require('../../model/SystemSetting');

async function deleteChat() {
  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_chat' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        const totalMessages = await Chat.countDocuments();
        const messagesToDelete = totalMessages - 50;
        if (messagesToDelete > 0) {
          const messagesToDeleteIds = await Chat.find({})
            .sort({ created_at: 1 })
            .limit(messagesToDelete)
            .select('_id');

          const messageIds = messagesToDeleteIds.map(message => message._id);
          const deletedMessages = await Chat.deleteMany({ _id: { $in: messageIds } });
          console.log(`${deletedMessages.deletedCount} messages deleted.`);

        }
      }
    } else {
      console.log("System setting for chat last updated not found.");
    }
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
}

async function deleteBetItems() {
  try {
    const deleteItems = async (model, settingName, itemType) => {
      let systemSetting = await SystemSetting.findOne({ name: settingName });
      if (systemSetting) {
        const lastUpdated = systemSetting.updated_at;
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        if (lastUpdated <= twentyFourHoursAgo) {
          const totalItems = await model.countDocuments();
          const itemsToDelete = totalItems - 1000;
          if (itemsToDelete > 0) {
            const itemsToDeleteIds = await model.find({})
              .sort({ created_at: 1 })
              .limit(itemsToDelete)
              .select('_id');

            const itemIds = itemsToDeleteIds.map(item => item._id);
            const deletedItems = await model.deleteMany({ _id: { $in: itemIds } });

            console.log(`${deletedItems.deletedCount} ${itemType} deleted.`);
          }
        }
      } else {
        console.log(`System setting for ${itemType} last updated not found.`);
      }
    };

    // Delete RpsBetItems
    await deleteItems(RpsBetItem, 'last_updated_rpsbetitem', 'RpsBetItems');

    // Delete QsBetItems
    await deleteItems(QsBetItem, 'last_updated_qsbetitem', 'QsBetItems');

  } catch (error) {
    console.error('Error deleting BetItems:', error);
  }
}


async function deleteNotifications() {
  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated_notifications' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        const totalNotifications = await Notification.countDocuments();
        const notificationsToDelete = totalNotifications - 500;
        if (notificationsToDelete > 0) {
          const notificationsToDeleteIds = await Notification.find({})
            .sort({ created_at: 1 })
            .limit(notificationsToDelete)
            .select('_id');

          const notificationIds = notificationsToDeleteIds.map(notification => notification._id);

          const deletedNotifications = await Notification.deleteMany({ _id: { $in: notificationIds } });

          console.log(`${deletedNotifications.deletedCount} notifications deleted.`);
        }
        systemSetting.updated_at = new Date();
        await systemSetting.save();
      }
    } else {
      console.log("System setting for last updated not found.");
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
  }
}


// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await deleteChat();
  await deleteBetItems();
});

// Export an object containing the function
module.exports = {
  deleteNotifications,
  deleteChat,
  deleteBetItems

};
