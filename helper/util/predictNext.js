const tf = require('@tensorflow/tfjs-node');
const { trainModel, predictNextMove } = require('./modelUtils');

const predictNext = (rps_list, markov = false) => {
  if (rps_list.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }
  const transitionMatrix = {
    R: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    P: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    S: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
  };  

  for (let i = 0; i < rps_list.length - 3; i++) {
    const currentState1 = rps_list[i].rps;
    const currentState2 = rps_list[i + 1].rps;
    const currentState3 = rps_list[i + 2].rps;
    const nextState = rps_list[i + 3].rps;
    transitionMatrix[currentState1][currentState2][currentState3][nextState]++;
  }

  Object.keys(transitionMatrix).forEach((fromState1) => {
    Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach((fromState3) => {
        const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
        Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach((toState) => {
          transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
        });
      });
    });
  });

  const winChance = calcWinChance(rps_list);
  let deviation = 0;
  if (winChance !== "33.33%") {
    deviation = 0.03;
  }

  let currentState1 = rps_list[2].rps;
  let currentState2 = rps_list[1].rps;
  let currentState3 = rps_list[0].rps;
  let nextState = currentState3;
  let maxProb = 0;
  Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
    if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
      maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
      nextState = state;
    }
  });

  if (markov) {
    // Convert nextState to its beating type
    nextState = getBeatingType(nextState);
  }

  let randomNum = Math.random();
  if (randomNum < deviation) {
    let randomState = '';
    do {
      randomNum = Math.random();
      if (randomNum < (1 / 3)) {
        randomState = 'R';
      } else if (randomNum < (2 / 3)) {
        randomState = 'P';
      } else {
        randomState = 'S';
      }
    } while (randomState === currentState3);
    nextState = randomState;
  }

  return nextState;

}

// Function to get the beating type
const getBeatingType = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return random < 0.5 ? 'P' : 'R'; // 50% chance to return P or R
  } else if (currentState === 'P') {
    return random < 0.5 ? 'S' : 'P'; // 50% chance to return S or P
  } else {
    return random < 0.5 ? 'R' : 'S'; // 50% chance to return R or S
  }
}


const calcWinChance = (rps_list) => {
  let total = rps_list.length;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  rps_list.forEach((el) => {
    if (el.rps === "R") {
      rock++;
    } else if (el.rps === "P") {
      paper++;
    } else if (el.rps === "S") {
      scissors++;
    }
  });
  const rockWinChance = (rock / total) * 100;
  const paperWinChance = (paper / total) * 100;
  const scissorsWinChance = (scissors / total) * 100;
  let lowest = rockWinChance;
  let highest = rockWinChance;
  if (paperWinChance < lowest) {
    lowest = paperWinChance;
  }
  if (scissorsWinChance < lowest) {
    lowest = scissorsWinChance;
  }
  if (paperWinChance > highest) {
    highest = paperWinChance;
  }
  if (scissorsWinChance > highest) {
    highest = scissorsWinChance;
  }
  if (lowest === highest) {
    return lowest.toFixed(2) + "%";
  }
  return lowest.toFixed(2) + "% - " + highest.toFixed(2) + "%";
}

// Main function to handle reinforcement learning with dynamic adaptation mechanism
async function reinforcementAI(data) {
  if (data.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const historicData = data.reverse();
  const rpsNumeric = historicData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
  const joinerRPSNumeric = historicData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

  let model;
  try {
    // Train the model with the existing data
    model = await trainModel(rpsNumeric, joinerRPSNumeric);

    // Predict the next joiner_rps
    let bestCounterMove = await predictNextMove(model, joinerRPSNumeric);

    // Check if recent games were wins, if not, adapt
    const recentGames = historicData.slice(-5); // Consider the last 5 games
    const recentWins = recentGames.filter(game => {
      return (game.joiner_rps === 'R' && game.rps === 'P') ||
        (game.joiner_rps === 'P' && game.rps === 'S') ||
        (game.joiner_rps === 'S' && game.rps === 'R');
    });

    if (recentWins.length === 0) {
      console.log("No recent wins, adapting...");
      // Adapt the model based on recent losses
      const newData = historicData.slice(-1); // Consider the last 1 game for adaptation
      const newRpsNumeric = newData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
      const newJoinerRPSNumeric = newData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

      // Retrain the model with the recent data
      const updatedModel = await trainModel(newRpsNumeric, newJoinerRPSNumeric);

      try {
        // Predict the next joiner_rps again after adaptation
        bestCounterMove = await predictNextMove(updatedModel, joinerRPSNumeric);
      } finally {
        // Dispose of the updated model
        updatedModel.dispose();
      }
    }

    return bestCounterMove;
  } finally {
    // Dispose of the model
    if (model) {
      model.dispose();
    }
  }
}

// Main function to handle reinforcement learning with dynamic adaptation mechanism
async function botAI(data) {
  const historicData = data.reverse();

  // Convert historic data to numerical values
  const rpsNumeric = historicData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
  const joinerRPSNumeric = historicData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

  // Train the model with the existing data
  const model = await trainModel(joinerRPSNumeric, rpsNumeric);

  // Predict the rps and get the risk level
  let prediction = await predictNextMove(model, rpsNumeric);
  let bestCounterMove = prediction.move;
  let risk = prediction.risk;

  // Check if recent games were wins, if not, adapt
  const recentGames = historicData.slice(-5); // Consider the last 5 games
  const recentWins = recentGames.filter(game => {
    return (game.joiner_rps === 'R' && game.rps === 'S') ||
      (game.joiner_rps === 'P' && game.rps === 'R') ||
      (game.joiner_rps === 'S' && game.rps === 'P');
  });

  if (recentWins.length === 0) {
    console.log("No recent wins, adapting...", recentWins);
    // Adapt the model based on recent losses
    const newData = historicData.slice(-1); // Consider the last 1 game for adaptation
    const newRpsNumeric = newData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
    const newJoinerRPSNumeric = newData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

    // Retrain the model with the recent data
    const updatedModel = await trainModel(newJoinerRPSNumeric, newRpsNumeric);

    try {
      // Predict the next rps again after adaptation
      prediction = await predictNextMove(updatedModel, rpsNumeric);
      bestCounterMove = prediction.move;
      risk = prediction.risk;
    } finally {
      // Dispose of updated model
      updatedModel.dispose();
    }
  }

  // Dispose of the original model
  model.dispose();

  return { move: bestCounterMove, risk: risk };
}

function patternBasedAI(historicData) {
  // If there's no historic data, start with a random move
  if (historicData.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  // Analyze opponent's moves
  const opponentMoves = historicData.map(item => item.joiner_rps);

  // Count occurrences of each move in opponent's recent moves
  const moveCounts = {
    'R': 0,
    'P': 0,
    'S': 0
  };

  opponentMoves.slice(-10).forEach(move => {
    moveCounts[move]++;
  });

  // Determine the most frequent move by the opponent
  const mostFrequentMove = Object.keys(moveCounts).reduce((a, b) => moveCounts[a] > moveCounts[b] ? a : b);

  // Choose the move that beats the opponent's most frequent move
  switch (mostFrequentMove) {
    case 'R':
      return 'P'; // Beat Rock with Paper
    case 'P':
      return 'S'; // Beat Paper with Scissors
    case 'S':
      return 'R'; // Beat Scissors with Rock
    default:
      // In case of unexpected input, play randomly
      return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

}

function counterSwitchAI(historicData) {
  const moves = ['R', 'P', 'S']; // Rock, Paper, Scissors

  // Check if historic data is available
  if (historicData.length > 0) {
    // Retrieve the most recent game
    const lastGame = historicData[0];

    // Check if the last game was a win
    const lastGameWasWin =
      (lastGame.rps === 'R' && lastGame.joiner_rps === 'S') ||
      (lastGame.rps === 'S' && lastGame.joiner_rps === 'P') ||
      (lastGame.rps === 'P' && lastGame.joiner_rps === 'R');

    // Check if the last game was a loss
    const lastGameWasLoss =
      (lastGame.rps === 'R' && lastGame.joiner_rps === 'P') ||
      (lastGame.rps === 'S' && lastGame.joiner_rps === 'R') ||
      (lastGame.rps === 'P' && lastGame.joiner_rps === 'S');

    if (lastGameWasWin) {
      // Calculate the probability of repeating the last move if it was a win
      const repeatProbability = 1;
      // Check if the last move was a win and the repeat probability
      if (Math.random() < repeatProbability) {
        return lastGame.rps; // Play the same move with the calculated probability
      }
    } else if (lastGameWasLoss) {
      // Switch to the counter move
      if (lastGame.joiner_rps === 'R') return 'P';
      else if (lastGame.joiner_rps === 'P') return 'S';
      else return 'R';
    }
  }

  // Otherwise, choose a random move
  const randomIndex = Math.floor(Math.random() * 3);
  return moves[randomIndex];
}



function botCounterRandomness(historicData) {
  if (historicData.length < 3) {
    const randomIndex = Math.floor(Math.random() * 3);
    const rpsOptions = ['R', 'P', 'S'];
    nextState = rpsOptions[randomIndex];
    // If historicData has less than 3 moves, return false
    return { counterMove: nextState, risk: 1 };
  }

  // Get the AI's most recent move
  const lastMove = historicData[0].rps;
  // Get the penultimate move
  const penultimateMove = historicData[1].rps;
  // Get the third-to-last move
  const thirdToLastMove = historicData[2].rps;
  // Check if the penultimate move is the same as the last move
  const penultimateSameAsLast = penultimateMove === lastMove;
  // Check if the third-to-last move is the same as the last move
  const thirdToLastSameAsLast = thirdToLastMove === penultimateMove && penultimateSameAsLast;

  let counterMove;
  switch (lastMove) {
    case 'R':
      counterMove = 'S';
      break;
    case 'P':
      counterMove = 'R';
      break;
    case 'S':
      counterMove = 'P';
      break;
    default:
      counterMove = getRandomMove(); // Handle unexpected cases
  }

  let risk;

  if (penultimateSameAsLast && !thirdToLastSameAsLast) {
    risk = 2;
  } else if (penultimateSameAsLast && thirdToLastSameAsLast) {
    risk = 3;
  } else {
    risk = 1;
  }
  return { counterMove, risk };
}

function counterRandomness(historicData) {
  // If historicData is empty or undefined, default to 'R'
  if (!historicData || historicData.length === 0) {
    return 'R';
  }

  // Get the last move from the historic data
  const lastOpponentMove = historicData[0].joiner_rps || 'R'; // Default to 'R' if no last move
  // console.log(lastOpponentMove)


  return lastOpponentMove;

}


function NPC(historicData) {
  const lastMove = historicData[0].rps || 'R'; // Default to 'R' if no last move
  return lastMove;

}


function generatePattern(allBetItems) {

  const patterns = [
    ['R', 'P'],
    ['P', 'S'],
    ['S', 'R']
    // Add more patterns as needed
  ];

  // Get the last two moves from the allBetItems
  const lastTwoMoves = allBetItems.slice(0, 2).map(item => item.rps);

  // Find matching pattern or its reverse
  let matchedPattern = null;
  for (const pattern of patterns) {
    if ((pattern[0] === lastTwoMoves[0] && pattern[1] === lastTwoMoves[1]) ||
      (pattern[1] === lastTwoMoves[0] && pattern[0] === lastTwoMoves[1])) {
      matchedPattern = pattern;
      break;
    }
  }

  if (matchedPattern) {
    // Count how many times the pattern has been continued
    let continuationCount = 0;

    // Iterate over recent items to find continuation of the pattern
    for (let i = 2; i < allBetItems.length; i++) {
      if ((allBetItems[i - 1].rps === matchedPattern[0] && allBetItems[i].rps === matchedPattern[1]) ||
        (allBetItems[i - 1].rps === matchedPattern[1] && allBetItems[i].rps === matchedPattern[0])) {
        continuationCount++;
      } else {
        // If there is a break in the pattern, reset the count
        break;
      }
    }

    // Generate a random number between 2 and 5 for the maximum continuation count
    const maxContinuation = Math.floor(Math.random() * 4) + 2;

    if (continuationCount > maxContinuation) {
      // Reset the continuation count and switch to a random move not in the pattern
      const movesNotInPattern = ['R', 'P', 'S'].filter(move => !matchedPattern.includes(move));
      const randomMove = movesNotInPattern[Math.floor(Math.random() * movesNotInPattern.length)];
      return randomMove;
    }

    // Return the next move based on the dynamic index
    return allBetItems[1].rps;
  } else {
    // If no matching pattern found, return a random move
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)]; // Generate a random move
    return randomMove;
  }
}


module.exports = {
  predictNext,
  calcWinChance,
  reinforcementAI,
  botAI,
  patternBasedAI,
  counterSwitchAI,
  NPC,
  counterRandomness,
  botCounterRandomness,
  generatePattern
};
