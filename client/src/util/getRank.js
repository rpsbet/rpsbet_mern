export function getRank(totalWagered) {
  // Calculate the level using a logarithmic function with base 2.
  const level = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
  return level;
}
