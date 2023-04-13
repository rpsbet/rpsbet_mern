const predictNextBang = (bangAmounts) => {
  const uniqueValues = [...new Set(bangAmounts.map(bang => bang.bang))];
  
  if (uniqueValues.length === 1) {
    // If there is only one unique value, return that value
    return uniqueValues[0];
  } else {
    // Otherwise, compute the range and generate a random number within that range
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
    return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue).toFixed(2));
  }
};

  
  module.exports = {
    predictNextBang
  }
  