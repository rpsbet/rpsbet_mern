const cron = require('node-cron');
const Room = require('../../model/Room');
const BangBetItem = require('../../model/BangBetItem');

const roomBetsMap = new Map();
let nextBangPrediction = null;
let isProcessing = false;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const bangCron = async () => {
  while (true) {
    if (!isProcessing) {
      isProcessing = true;

      try {
        await processOpenRooms();
      } catch (error) {
        console.error('Error in bangCron:', error);
      } finally {
        isProcessing = false;
      }

      // Calculate the next interval based on the current prediction
      const interval = (nextBangPrediction * 1000) + 7000;

      // Schedule the next execution after the interval
      await delay(interval);
    }
  }
};

const processOpenRooms = async () => {
  // Find open rooms with game_type = 'Bang'
  const openRooms = await Room.find({
    status: 'open',
    game_type: '6536a82933e70418b45fbe32',
  });

  // Iterate through open rooms
  for (const room of openRooms) {
    const roomId = room._id;

    const roomBets = await BangBetItem.find({ room: roomId });
    if (roomBets.length > 0) {
      await predictAndSave(roomBets, roomId);
    }
  }
};

const predictAndSave = async (roomBets, roomId) => {
  try {
    const allBangs = [];

    nextBangPrediction = await predictNextBang(roomBets);
console.log(nextBangPrediction)
    const roomBetsCount = await BangBetItem.countDocuments({ room: roomId });

    // Check if the count exceeds the limit
    if (roomBetsCount >= 100) {
      // If the count exceeds 100, remove the oldest item
      await BangBetItem.findOneAndDelete({ room: roomId  });
    }

    const newBet = new BangBetItem({
      room: roomId,
      bang: nextBangPrediction,
      created_at: Date.now(),
    });
    await newBet.save();

    allBangs.push(nextBangPrediction);

  } catch (error) {
    console.error('Error in predictAndSave:', error);
  }
};

const predictNextBang = bangAmounts => {

  const uniqueValues = [...new Set(bangAmounts.map(bang => bang.bang))];

  if (uniqueValues.length === 1) {
    return uniqueValues[0];
  } else {
    const minValue = Math.min(...uniqueValues);
    const maxValue = Math.max(...uniqueValues);
    const rangeSize = Math.ceil((maxValue - minValue) / 200);

    const rangeCounts = {};
    bangAmounts.forEach((bang) => {
      const range = Math.floor((bang.bang - minValue) / rangeSize);
      rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
    });

    const totalCounts = bangAmounts.length;
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

  
      return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue));

  }

};

// bangCron();


module.exports = {
  predictNextBang,
  bangCron
};
