// creditScoreCron.js

const cron = require('node-cron');
const Chat = require('../../model/Chat');
const Loan = require('../../model/Loan');
const User = require('../../model/User');
const socketController = require('../../socketController.js');

let socketio = null;
async function checkOutstandingLoans(io) {
  if (io) {
    socketio = io;
  }

  try {
    // Get all users from the database
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

    const senderId = '629685058f368a1838372754'; // Replace with the actual sender ID
    const message = 'Daily debt check complete, credit scores have updated depending on outstanding balances.';
    const messageType = 'text';

    // Fetch user information from the User model using the senderId
    const senderUser = await User.findById(senderId);

    // Extract relevant user information
    const avatar = senderUser.avatar || ''; // Replace with the actual avatar URL
    const accessory = senderUser.accessory || ''; // Replace with the actual accessory URL
    const rank = senderUser.totalWagered || 0; // Replace with the actual rank

    const replyTo = null; // No need for a reply in this case

    const data = {
      sender: senderUser.username, // Assuming there's a 'username' field in the User model
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
  } catch (error) {
    console.error('Error updating credit scores:', error);
  }
}

// Schedule the cron job to run every day at midnight (00:00)
cron.schedule('0 0 * * *', async () => {
  await checkOutstandingLoans();
});

// Export an object containing the function
module.exports = {
  checkOutstandingLoans,
};
