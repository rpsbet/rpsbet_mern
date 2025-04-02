

function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}


module.exports = {
  getRandomItem_qs,
};
