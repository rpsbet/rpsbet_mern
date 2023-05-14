const ntpClient = require('ntp-client');
const RollBetItem = require('../../model/RollBetItem');

const roomBets = new Map();
let timeoutIds = new Map();

const emitRollGuesses = (socket, room_Id) => {
  if (socket) {
    const roomBetsForRoom = roomBets.get(room_Id) || [];
    const rolls = roomBetsForRoom.map(bet => bet.roll);
    const faces = roomBetsForRoom.map(bet => bet.face); // get face values
    const socketName = `ROLL_GUESSES_${room_Id}`;
    const elapsedTime = '';
    socket.emit(socketName, { rolls: rolls, faces: faces, elapsedTime }); // include faces in the emitted data
    console.log(`Sent data to socket ${socketName}:`, { rolls, faces, elapsedTime });
  }
};

const predictAndEmit = async (roll_list, room, socket, room_Id, numRolls) => {
  const rolls = [];

  for (let i = 0; i < numRolls; i++) {
    const { roll: rollNumber, face: nextStateFace } = await predictNextRoll(roll_list);
    const currentTime = await getCurrentRollTime();
    const newBet = new RollBetItem({
      room: room,
      roll: rollNumber,
      face: nextStateFace,
      created_at: currentTime
    });

    const roomBetsForRoom = roomBets.get(room_Id) || [];

    // remove oldest item if max limit reached
    if (roomBetsForRoom.length >= 1000) {
      roomBetsForRoom.shift();
    }

    roomBetsForRoom.push(newBet);
    roomBets.set(room_Id, roomBetsForRoom);

    rolls.push(rollNumber);
  }

  emitRollGuesses(socket, room_Id);

  const timeoutId = setTimeout(
    () => predictAndEmit(roll_list, room, socket, room_Id, numRolls),
    15000
  );
  const timeoutIdsForRoom = timeoutIds.get(room_Id) || [];
  timeoutIdsForRoom.push(timeoutId);
  timeoutIds.set(room_Id, timeoutIdsForRoom);
};


const initializeRollRound = async (roll_list, room, socket, room_Id) => {
  const numRolls = 20;
  const timeoutIdsForRoom = timeoutIds.get(room_Id) || [];
  timeoutIdsForRoom.forEach((timeoutId) => {
    clearTimeout(timeoutId);
  });
  timeoutIdsForRoom.length = 0;

  predictAndEmit(roll_list, room, socket, room_Id, numRolls);

  const timeoutId = setTimeout(
    () => initializeRollRound(roll_list, room, socket, room_Id),
    15000
  );
  timeoutIdsForRoom.push(timeoutId);
  timeoutIds.set(room_Id, timeoutIdsForRoom);
};



const closeRoomSocket = (socket, room_Id) => {
  if (socket) {
    const socketName = `ROLL_GUESSES_${room_Id}`;
    // socket.emit(socketName, { rolls: [], elapsedTime: '' });
    socket.disconnect(true);
    console.log(`Closed socket ${socketName}`);
  }
};

const stopRollGame = (room_Id, socket) => {
  const timeoutIdsForRoom = timeoutIds.get(room_Id) || [];
  timeoutIdsForRoom.forEach(timeoutId => clearTimeout(timeoutId));
  timeoutIds.set(room_Id, []);
  roomBets.delete(room_Id);
  closeRoomSocket(socket, room_Id);
};


const predictNextRoll = roll_list => {
    const faces = ['R', 'P', 'S', 'W', 'B', 'Bu'];
    const sequence = roll_list.map(roll => roll.face); // New array to store sequence of faces
    const nextStates = {};
  
    // Determine the probability of each face occurring next based on the previous sequence of faces
    faces.forEach((face) => {
      const count = sequence.filter((f, i) => i > 0 && sequence[i-1] === face).length;
      nextStates[face] = count / Math.max(1, sequence.length - 1);
    });
  
    // Check if all probabilities are either 0 or 1
    const allProbabilitiesOneOrZero = Object.values(nextStates).every(probability => probability === 0 || probability === 1);
  
    // Use the original method of predicting if all probabilities are either 0 or 1
    if (allProbabilitiesOneOrZero) {
      const occurrences = {};
      roll_list.forEach((roll) => {
        occurrences[roll.face] = (occurrences[roll.face] || 0) + 1;
      });
      let randomIndex = Math.floor(Math.random() * roll_list.length);
      let nextState = roll_list[randomIndex];
      return { roll: nextState.roll, face: nextState.face };
    }
  
    // Randomly select the next face based on probabilities
    let nextStateFace = '';
    let randomNum = Math.random();
    let cumulativeProbability = 0;
    for (const face in nextStates) {
      cumulativeProbability += nextStates[face];
      if (randomNum <= cumulativeProbability) {
        nextStateFace = face;
        break;
      }
    }
  
    // Use the switch statement to determine the rollNumber for the predicted face
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
        rollNumber = '2';
    }
  
    return { roll: rollNumber, face: nextStateFace };
  };
  
const getCurrentRollTime = async () => {
  // console.log("time" );
  return new Promise((resolve, reject) => {
    ntpClient.getNetworkTime('time.google.com', 123, function(err, date) {
      if (err) {
        reject(err);
      } else {
        resolve(date);
      }
    });
  });
};

module.exports = {
  predictNextRoll,
  getCurrentRollTime,
  emitRollGuesses,
  initializeRollRound,
  predictAndEmit,
  stopRollGame
};
