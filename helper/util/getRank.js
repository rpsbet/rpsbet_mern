function getBorderByRank(rank) {
  const rankColors = {
    1: '#1E90FF',  // Dodger Blue
    2: '#00C851',  // Bright Green
    3: '#FF1493',  // Deep Pink
    4: '#FF4500',  // Orange Red
    5: '#8A2BE2',  // Blue Violet
    6: '#DC143C',  // Crimson
    7: '#7FFF00',  // Chartreuse
    8: '#FF6347',  // Tomato
    9: '#40E0D0',  // Turquoise
    10: '#FFD700', // Gold
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
