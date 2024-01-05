predictNextDrop = dropAmounts => {
  const sortedDrops = dropAmounts.map(drop => drop.drop).sort((a, b) => a - b);
  const uniqueValues = [...new Set(sortedDrops)];

  if (uniqueValues.length === 1) {
      return uniqueValues[0];
  } else {
      let finalValue;

      do {
          const minDrop = Math.min(...sortedDrops);
          const maxDrop = Math.max(...sortedDrops);
          const difference = maxDrop - minDrop;
          const segmentSize = difference / 20;

          const segments = Array.from({ length: 20 }, (_, index) => {
              const lowerBound = minDrop + index * segmentSize;
              const upperBound = minDrop + (index + 1) * segmentSize;
              const dropsInSegment = sortedDrops.filter(drop => drop >= lowerBound && (drop < upperBound || (index === 19 && drop === upperBound)));

              return {
                  segment: index + 1,
                  drops: dropsInSegment
              };
          });

          const totalDropsCount = sortedDrops.length;
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

          const switchChance = Math.random();

          if (switchChance <= 0.4) {
              const bottom5PercentIndex = Math.floor(0.25 * totalDropsCount);
              finalValue = sortedDrops[Math.floor(Math.random() * bottom5PercentIndex)];
          } else if (switchChance <= 0.8) {
              const top30PercentIndex = Math.floor(0.6 * totalDropsCount);
              finalValue = sortedDrops[Math.floor(top30PercentIndex + Math.random() * (totalDropsCount - top30PercentIndex))];
          } else {
              const randomAddition = Math.random() * segmentSize;
              finalValue = selectedSegment ? selectedSegment.drops[0] + randomAddition : null;
          }

      } while (finalValue !== null && finalValue < 0.000001);
      return finalValue;
  }
};


module.exports = {
  predictNextDrop
};
