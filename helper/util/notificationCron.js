// creditScoreCron.js

const cron = require('node-cron');
const Notification = require('../../model/Notification');
const Chat = require('../../model/Chat');


async function deleteChat() {
  try {
    // Retrieve the total count of chat messages
    const totalMessages = await Chat.countDocuments();

    // Determine the number of messages to be deleted
    const messagesToDelete = totalMessages - 50;

    // Ensure there are messages to delete
    if (messagesToDelete > 0) {
      // Retrieve the IDs of the messages to be deleted
      const messagesToDeleteIds = await Chat.find({})
        .sort({ created_at: 1 }) // Sort by createdAt in ascending order (oldest first)
        .limit(messagesToDelete) // Limit to the excess messages
        .select('_id');

      // Extract the IDs from the found messages
      const messageIds = messagesToDeleteIds.map(message => message._id);

      // Delete the excess messages
      const deletedMessages = await Chat.deleteMany({ _id: { $in: messageIds } });

      console.log(`${deletedMessages.deletedCount} messages deleted.`);
      
    }
  } catch (error) {
    console.error('Error deleting chat messages:', error);
  }
}


async function deleteNotifications() {
  try {
    // Retrieve the total count of notifications
    const totalNotifications = await Notification.countDocuments();

    // Determine the number of notifications to be deleted
    const notificationsToDelete = totalNotifications - 50;

    // Ensure there are notifications to delete
    if (notificationsToDelete > 0) {
      // Retrieve the IDs of the notifications to be deleted
      const notificationsToDeleteIds = await Notification.find({})
        .sort({ created_at: 1 }) // Sort by createdAt in ascending order (oldest first)
        .limit(notificationsToDelete) // Limit to the excess notifications
        .select('_id');

      // Extract the IDs from the found notifications
      const notificationIds = notificationsToDeleteIds.map(notification => notification._id);

      // Delete the excess notifications
      const deletedNotifications = await Notification.deleteMany({ _id: { $in: notificationIds } });

      console.log(`${deletedNotifications.deletedCount} notifications deleted.`);
      
    
    }
  } catch (error) {
    console.error('Error deleting notifications:', error);
  }
}


// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await deleteNotifications();
  await deleteChat();
});

// Export an object containing the function
module.exports = {
  deleteNotifications,
  deleteChat

};
