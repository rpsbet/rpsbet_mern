const cron = require('node-cron');
const Room = require('../../model/Room');
const User = require('../../model/User');
const RpsBetItem = require('../../model/RpsBetItem');
const socketController = require('../../socketController.js');
const executeBet = require('../../helper/util/betExecutor.js');
const predictNext = require('./predictNext.js');

let socketio = null;

async function callBotBet(io) {
  if (io) {
    socketio = io;
  }
  
  try {
    // Find rooms matching the criteria
    const rooms = await Room.find({
      'joiners': '62b9ef88a5409449f63f7ccb',
      status: 'open',
      user_bet: { $gt: 0 } // Match rooms with user_bet greater than 0
    });
    const user = await User.findOne({
      _id: '62b9ef88a5409449f63f7ccb', // Match the specific user ID
      balance: { $gt: 0 } // Match rooms with user_bet greater than 0
    });

    

    // Call the route /bot_bet for each matching room
    for (const room of rooms) {
      const roomId = room._id;
      const req = {
        params: {
          _id: roomId
        },
        user: user,
        io: io,
        body: {
          _id: roomId,
          selected_rps: 'R', // Example values for selected_rps and bet_amount
          bet_amount: 1
          // Add other properties as needed
        }
      };

      if (user.balance >= parseFloat(room.user_bet)) {
        await executeBet(req, true); // Pass true for bot parameter
      }
    }
  } catch (error) {
    console.error('Error finding rooms and calling /bot_bet:', error);
  }
}

// Schedule the cron job to run your task
cron.schedule('*/6 * * * * *', async () => {
  await callBotBet(socketio);
});

// Export an object containing the function
module.exports = {
  callBotBet,
};
