const cron = require('node-cron');
const RollBetItem = require('../../model/RollBetItem');
const Room = require('../../model/Room');

const roomBetsMap = new Map();

const rollCron = async () => {

  try {
    // Find open rooms with game_type = 'Roll'
    const openRooms = await Room.find({
      status: 'open',
      game_type: '6536946933e70418b45fbe2f',
    });

    // Define batch size
    const batchSize = 5; // Adjust this according to your needs

    // Iterate through open rooms in batches
    for (let i = 0; i < openRooms.length; i += batchSize) {
      const batch = openRooms.slice(i, i + batchSize);

      // Process each room in the batch
      await Promise.all(batch.map(async (room) => {
        const roomId = room._id;

        const roomBets = await RollBetItem.find({ room: roomId });
        if (roomBets.length > 0) {
          await predictAndSave(roomBets, roomId);
        }
      }));
    }
  } catch (error) {
    console.error('Error in rollCron:', error);
  }
};
const predictAndSave = async (roomBets, roomId) => {
  const allFaces = [];
;

  for (let i = 0; i < 20; i++) {
    const { roll: rollNumber, face: nextStateFace } = await predictNextRoll(roomBets);
    
    // Create a new bet
    const newBet = new RollBetItem({
      room: roomId,
      roll: rollNumber,
      face: nextStateFace,
      created_at: Date.now(),
    });

    // Check the total count of existing bets for the room in the database
    const roomBetsCount = await RollBetItem.countDocuments({ room: roomId });

    if (roomBetsCount >= 100) {
      // If the limit is reached, delete the oldest bet(s) to make room for the new one
      const oldestBets = await RollBetItem.find({ room: roomId }).sort({ created_at: 1 }).limit(roomBetsCount - 99);
      await RollBetItem.deleteMany({ _id: { $in: oldestBets.map(bet => bet._id) } });
    }

    // Save the new bet to the database
    await newBet.save();

    allFaces.push(nextStateFace);
  }
};

const predictNextRoll = (roll_list, maxOrder = 3, initialWeight = 1.5, decayFactor = 0.9, smoothingFactor = 0.1) => {
  const faces = ['R', 'P', 'S', 'W', 'B', 'Bu'];
  const sequence = roll_list.map((roll) => roll.face);

  if (sequence.length < maxOrder + 1) {
    // Insufficient data, fall back to random selection
    const nextStateFace = faces[Math.floor(Math.random() * faces.length)];
    return { roll: '', face: nextStateFace };
  }

  const transitions = {};
  for (let order = 1; order <= maxOrder; order++) {
    for (let i = 0; i < sequence.length - order; i++) {
      const state = sequence.slice(i, i + order).join('_');
      const nextFace = sequence[i + order];
      transitions[state] = transitions[state] || {};
      transitions[state][nextFace] = (transitions[state][nextFace] || initialWeight) * decayFactor + initialWeight;
    }
  }

  const currentState = sequence.slice(-1 - maxOrder, -1).join('_');

  const nextStates = transitions[currentState] || {};
  const totalTransitions = Object.values(nextStates).reduce((sum, weight) => sum + weight, 0);

  let nextStateFace = '';
  if (totalTransitions > 0) {
    const randomNum = Math.random() * totalTransitions;
    let cumulativeWeight = 0;

    for (const face in nextStates) {
      cumulativeWeight += nextStates[face];
      if (randomNum <= cumulativeWeight) {
        nextStateFace = face;
        break;
      }
    }
  } else {
    // No transitions observed, fall back to random selection
    nextStateFace = faces[Math.floor(Math.random() * faces.length)];
  }

  // Smoothing mechanism
  const smoothRandom = Math.random() * smoothingFactor;
  nextStateFace = smoothRandom < smoothingFactor ? faces[Math.floor(Math.random() * faces.length)] : nextStateFace;

  let rollNumber;
  switch (nextStateFace) {
    case 'R':
    case 'P':
    case 'S':
      rollNumber = '2';
      break;
    case 'W':
      rollNumber = '14';
      break;
    case 'B':
      rollNumber = '1.5';
      break;
    case 'Bu':
      rollNumber = '7';
      break;
    default:
      nextStateFace = faces[Math.floor(Math.random() * faces.length)];
      rollNumber = '';
  }

  return { roll: rollNumber, face: nextStateFace };
};


cron.schedule('*/15 * * * * *', () => {
  rollCron();
});


module.exports = {
  predictNextRoll,
  rollCron
};
