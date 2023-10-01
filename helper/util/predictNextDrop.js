const predictNextDrop = dropAmounts => {
  // Find the unique values in dropAmounts
  const uniqueValues = [...new Set(dropAmounts.map(drop => drop.drop))];

  if (uniqueValues.length === 1) {
    // If there is only one unique value, return that value
    return uniqueValues[0];
  } else {
    // Log all the drops
    const allDrops = dropAmounts.map(drop => drop.drop);
    // console.log('All drops:', allDrops.join(', '));

    // Calculate the segment size
    const minDrop = Math.min(...allDrops);
    const maxDrop = Math.max(...allDrops);
    const difference = maxDrop - minDrop;
    const segmentSize = difference / 20;

    // Sort drops into segments
    const segments = Array.from({ length: 20 }, (_, index) => {
      const lowerBound = minDrop + index * segmentSize;
      const upperBound = minDrop + (index + 1) * segmentSize;
      const dropsInSegment = allDrops.filter(drop => {
        return drop >= lowerBound && (drop < upperBound || (index === 19 && drop === upperBound));
      });

      return {
        segment: index + 1,
        drops: dropsInSegment
      };
    });

    // Calculate the weights for each segment based on segment length
    const totalDropsCount = allDrops.length;
    const weights = segments.map(segment => segment.drops.length / totalDropsCount);

    // Generate a random number to select a segment
    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedSegment;

    for (let i = 0; i < segments.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        selectedSegment = segments[i];
        // console.log('Randomly selected segment:', selectedSegment);
        break;
      }
    }

    // Generate a random number to add to the selected segment range
    const randomAddition = Math.random() * segmentSize; // Random value between 0 and segmentSize
    const newNumber = selectedSegment ? selectedSegment.drops[0] + randomAddition : null;
    // console.log('Randomly generated new number:', newNumber);
    return newNumber;
  }
};

module.exports = {
  predictNextDrop
};
