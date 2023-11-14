function getBorderByRank(rank) {
  const rankColors = {
    1: 'steelblue',
    2: 'forestgreen',
    3: 'slategray',
    4: 'indigo',
    5: 'darkorange',
    6: 'saddlebrown',
    7: 'teal',
    8: 'maroon',
    9: 'navy',
    10: 'firebrick'
  };

  if (rank !== null) {
    rank = getRank(rank);
    if (rank in rankColors) {
      return `1px solid ${rankColors[rank]}`;
    } else {
      return '1px solid red';
    }
  }
  return '1px solid transparent'; // Default if no rank is not provided
}

function getRank(totalWagered) {
  // Calculate the level using a logarithmic function with base 2.
  const level = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
  return level;
}

module.exports = {
  getBorderByRank,
  getRank
};
