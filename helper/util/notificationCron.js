// creditScoreCron.js

const cron = require('node-cron');
const Notification = require('../../model/Notification');
const Chat = require('../../model/Chat');
const RpsBetItem = require('../../model/RpsBetItem');
const SystemSetting = require('../../model/SystemSetting');

async function deleteChat() {
  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated' });
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
      } else {
        console.log("Last chat deletion was less than 24 hours ago. Skipping deletion.");
      }
    } else {
      console.log("System setting for chat last updated not found.");
    }
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
}

async function deleteRpsBetItems() {
  try {
    let systemSetting = await SystemSetting.findOne({ name: 'last_updated' });
    if (systemSetting) {
      const lastUpdated = systemSetting.updated_at;
      // Check if last_updated is 24 hours ago or more
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      if (lastUpdated <= twentyFourHoursAgo) {
        const totalItems = await RpsBetItem.countDocuments();
        const itemsToDelete = totalItems - 1000;
        if (itemsToDelete > 0) {
          const itemsToDeleteIds = await RpsBetItem.find({})
            .sort({ created_at: 1 })
            .limit(itemsToDelete)
            .select('_id');

          const itemIds = itemsToDeleteIds.map(item => item._id);
          const deletedItems = await RpsBetItem.deleteMany({ _id: { $in: itemIds } });

          console.log(`${deletedItems.deletedCount} RpsBetItems deleted.`);
        }
      } else {
        console.log("Last rpsBetItem deletion was less than 24 hours ago. Skipping deletion.");
      }
    } else {
      console.log("System setting for last updated not found.");
    }
  } catch (error) {
    console.error('Error deleting RpsBetItems:', error);
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
      } else {
        console.log("Last notification deletion was less than 24 hours ago. Skipping deletion.");
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
  await deleteNotifications();
  await deleteChat();
  await deleteRpsBetItems();
});

// Export an object containing the function
module.exports = {
  deleteNotifications,
  deleteChat,
  deleteRpsBetItems

};
