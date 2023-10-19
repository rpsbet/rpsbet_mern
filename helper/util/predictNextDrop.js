const predictNextDrop = dropAmounts => {
  
  const uniqueValues = [...new Set(dropAmounts.map(drop => drop.drop))];

  if (uniqueValues.length === 1) {
    
    return uniqueValues[0];
  } else {
    const allDrops = dropAmounts.map(drop => drop.drop);
    
    const minDrop = Math.min(...allDrops);
    const maxDrop = Math.max(...allDrops);
    const difference = maxDrop - minDrop;
    const segmentSize = difference / 20;

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

    
    const totalDropsCount = allDrops.length;
    const weights = segments.map(segment => segment.drops.length / totalDropsCount);

    const randomValue = Math.random();
    let cumulativeWeight = 0;
    let selectedSegment;

    for (let i = 0; i < segments.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        selectedSegment = segments[i];
        
        break;
      }
    }

    const randomAddition = Math.random() * segmentSize;
    const newNumber = selectedSegment ? selectedSegment.drops[0] + randomAddition : null;
    
    return newNumber;
  }
};

module.exports = {
  predictNextDrop
};
