const ntpClient = require('ntp-client');
const RollBetItem = require('../../model/RollBetItem');

const roomBets = new Map();
let timeoutIds = new Map();

const emitRollGuesses = (socket, room_Id) => {
  if (socket) {
    const roomBetsForRoom = roomBets.get(room_Id) || [];
    const rolls = roomBetsForRoom.map(bet => bet.roll);
    const socketName = `ROLL_GUESSES_${room_Id}`;
    const elapsedTime = '';
    socket.emit(socketName, { rolls: rolls, elapsedTime });
    // console.log(`Sent data to socket ${socketName}:`, { rolls, elapsedTime });
  }
};

const predictAndEmit = async (roll_list, room, socket, room_Id) => {

  const nextRollPrediction = await predictNextRoll(roll_list);
  const currentTime = await getCurrentTime();
  const newBet = new RollBetItem({
    room: room,
    roll: nextRollPrediction,
    created_at: currentTime
  });
  await newBet.save();

  const roomBetsForRoom = roomBets.get(room_Id) || [];
  roomBetsForRoom.push(newBet);
  roomBets.set(room_Id, roomBetsForRoom);

  emitRollGuesses(socket, room_Id);

  const timeoutId = setTimeout(
    () => predictAndEmit(roll_list, room, socket, room_Id),
    nextRollPrediction * 1000 + 7000
  );
  const timeoutIdsForRoom = timeoutIds.get(room_Id) || [];
  timeoutIdsForRoom.push(timeoutId);
  timeoutIds.set(room_Id, timeoutIdsForRoom);
};

const initializeRollRound = async (roll_list, room, socket, room_Id) => {
  // console.log("di")
  const nextRollPrediction = await predictNextRoll(roll_list);

  const currentTime = await getCurrentTime();
  const newBet = new RollBetItem({
    room: room,
    roll: nextRollPrediction,
    created_at: currentTime
  });
  await newBet.save();

  const roomBetsForRoom = roomBets.get(room_Id) || [];
  roomBetsForRoom.push(newBet);
  roomBets.set(room_Id, roomBetsForRoom);

  emitRollGuesses(socket, room_Id);

  const timeoutId = setTimeout(
    () => predictAndEmit(roll_list, room, socket, room_Id),
    nextRollPrediction * 1000 + 7000
  );
  const timeoutIdsForRoom = timeoutIds.get(room_Id) || [];
  timeoutIdsForRoom.push(timeoutId);
  timeoutIds.set(room_Id, timeoutIdsForRoom);
};

const closeRoomSocket = (socket, room_Id) => {
  if (socket) {
    const socketName = `BANG_GUESSES_${room_Id}`;
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


const predictNextRoll = rollAmounts => {
    // Find the unique values in rollAmounts
    const uniqueValues = [...new Set(rollAmounts.map(roll => roll.roll))];
  
    if (uniqueValues.length === 1) {
      // If there is only one unique value, return that value
      return uniqueValues[0];
    } else {
      // Otherwise, compute the range and generate a random number within that range
      const minValue = Math.min(...uniqueValues);
      const maxValue = Math.max(...uniqueValues);
      const rangeSize = Math.ceil((maxValue - minValue) / 200);
  
      const rangeCounts = {};
      rollAmounts.forEach((roll) => {
        const range = Math.floor((roll.roll - minValue) / rangeSize);
        rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
      });
  
      const totalCounts = rollAmounts.length;
      const rangeProbabilities = {};
      Object.keys(rangeCounts).forEach((range) => {
        const rangeProbability = rangeCounts[range] / totalCounts;
        rangeProbabilities[range] = rangeProbability;
      });
  
      let randomValue = Math.random();
      let chosenRange = null;
      Object.entries(rangeProbabilities).some(([range, probability]) => {
        randomValue -= probability;
        if (randomValue <= 0) {
          chosenRange = range;
          return true;
        }
        return false;
      });
  
      const rangeMinValue = parseInt(chosenRange) * rangeSize + minValue;
      const rangeMaxValue = Math.min(rangeMinValue + rangeSize, maxValue);
  
      const getRandomNumberInRange = (min, max) => {
        return Math.random() * (max - min) + min;
      };
      
      const randomChance = Math.random();
      const newValue = parseFloat(getRandomNumberInRange(1, 1.1).toFixed(2));
      const isChanged = randomChance <= 0.1;
      
      if(isChanged){
        return newValue;
      } else {
        return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue).toFixed(2));
      }
    }
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
