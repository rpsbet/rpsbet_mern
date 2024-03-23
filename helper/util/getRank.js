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
    9: 'royalblue',
    10: 'firebrick',
    11: 'crimson',
    12: 'goldenrod',
    13: 'mediumaquamarine',
    14: 'darkslateblue',
    15: 'olivedrab',
    16: 'mediumvioletred',
    17: 'darkcyan',
    18: 'orangered',
    19: 'mediumspringgreen',
    20: 'darkgoldenrod'
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
