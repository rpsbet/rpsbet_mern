function getBorderByRank(rank) {
  const rankColors = {
      1: '#1E90FF',   // Dodger Blue
      2: '#00C851',   // Bright Green
      3: '#2F4F4F',   // Dark Slate Grey
      4: '#8A2BE2',   // Blue Violet
      5: '#FF8C00',   // Dark Orange
      6: '#D2691E',   // Chocolate
      7: '#00CED1',   // Dark Turquoise
      8: '#B22222',   // Firebrick Red
      9: '#4169E1',   // Royal Blue
      10: '#FF4500',  // Orange Red
      11: '#DC143C',  // Crimson
      12: '#FFD700',  // Gold
      13: '#66CDAA',  // Medium Aquamarine
      14: '#483D8B',  // Dark Slate Blue
      15: '#00BFFF',  // Deep Sky Blue
      16: '#FF1493',  // Deep Pink
      17: '#20B2AA',  // Light Sea Green
      18: '#FF6347',  // Tomato
      19: '#00FF7F',  // Spring Green
      20: '#DAA520',  // Goldenrod
      21: '#1E90FF',  // Vivid Dodger Blue
      22: '#32CD32',  // Lime Green
      23: '#9932CC',  // Dark Orchid
      24: '#D2691E',  // Vibrant Chocolate
      25: '#8B0000',  // Dark Red (changed from Navy Blue)
      26: '#A0522D',  // Sienna
      27: '#7FFFD4',  // Aquamarine
      28: '#6A5ACD',  // Slate Blue
      29: '#CD853F',  // Peru
      30: '#2F4F4F',  // Dark Slate Grey
      31: '#FF69B4',  // Hot Pink (changed from Orange Red)
      32: '#708090',  // Slate Gray (changed from Steel Blue)
      33: '#4B0082',  // Indigo (changed from Gold)
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
