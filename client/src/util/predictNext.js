import * as tf from '@tensorflow/tfjs';
export const predictNext = (rps_list, hiddenMarkov = false) => {

  // Transition probabilities between hidden states
  const hiddenTransitionMatrix = {
    H: { H: 0, T: 0, S: 0 },
    T: { H: 0, T: 0, S: 0 },
    S: { H: 0, T: 0, S: 0 }
  };

  // Emission probabilities from hidden states to observable states
  const emissionMatrix = {
    H: { R: 0, P: 0, S: 0 },
    T: { R: 0, P: 0, S: 0 },
    S: { R: 0, P: 0, S: 0 }
  };

  // Initialize count matrices
  for (let i = 0; i < rps_list.length - 1; i++) {
    const currentState = rps_list[i].rps;
    const nextState = rps_list[i + 1].rps;

    hiddenTransitionMatrix[currentState][nextState]++;
    emissionMatrix[currentState][nextState]++;
  }

  // Normalize transition probabilities
  Object.keys(hiddenTransitionMatrix).forEach((fromState) => {
    const totalTransitions = Object.values(hiddenTransitionMatrix[fromState]).reduce((a, b) => a + b, 0);
    Object.keys(hiddenTransitionMatrix[fromState]).forEach((toState) => {
      hiddenTransitionMatrix[fromState][toState] /= totalTransitions;
    });
  });

  // Normalize emission probabilities
  Object.keys(emissionMatrix).forEach((hiddenState) => {
    const totalEmissions = Object.values(emissionMatrix[hiddenState]).reduce((a, b) => a + b, 0);
    Object.keys(emissionMatrix[hiddenState]).forEach((observedState) => {
      emissionMatrix[hiddenState][observedState] /= totalEmissions;
    });
  });

  // Hidden states
  const hiddenStates = ['H', 'T', 'S'];

  // Determine the current hidden state based on the last observed sequence
  const currentState = rps_list[rps_list.length - 1].rps;

  // Viterbi algorithm to predict the next hidden state and observed state
  let maxProb = 0;
  let predictedHiddenState = currentState;

  hiddenStates.forEach(hiddenState => {
    const prob = hiddenTransitionMatrix[currentState][hiddenState] * emissionMatrix[hiddenState][currentState];
    if (prob > maxProb) {
      maxProb = prob;
      predictedHiddenState = hiddenState;
    }
  });

  let nextState = 'R';
  maxProb = 0;
  Object.keys(emissionMatrix[predictedHiddenState]).forEach(observedState => {
    const prob = emissionMatrix[predictedHiddenState][observedState];
    if (prob > maxProb) {
      maxProb = prob;
      nextState = observedState;
    }
  });

  // Adjust prediction for beating type if hiddenMarkov flag is true
  if (hiddenMarkov) {
    nextState = getBeatingType(nextState);
  }

  return nextState;
}


// Function to get the beating type
const getBeatingType = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return random < 0.7 ? 'P' : 'R';
  } else if (currentState === 'P') {
    return random < 0.7 ? 'S' : 'P';
  } else {
    return random < 0.7 ? 'R' : 'S';
  }
}

// Function to get the beating type
const getBeatingType2 = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return  'S';
  } else if (currentState === 'P') {
    return 'R';
  } else {
    return 'P';
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
// Function to preprocess data and train the model
async function trainModel(rpsNumeric, joinerRPSNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  // Define the neural network model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

  // Compile the model with Adam optimizer and sparse categorical crossentropy loss
  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
    verbose: 0,
  });

  // Train the model
  await model.fit(rpsTensor, joinerRPSTensor, { epochs: 30, verbose: 0, batch_size: 32 });

  // Dispose of tensors
  rpsTensor.dispose();
  joinerRPSTensor.dispose();

  return model;
}

// Function to make predictions using the trained model
async function predictNextMove(model, rpsNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);
  const probabilities = prediction.dataSync(); // Get the array of probabilities
  const nextJoinerRPSNumeric = tf.argMax(prediction, 1).dataSync()[0]; // Specify axis as 1

  // Dispose of tensors
  rpsTensor.dispose();

  let nextJoinerRPS;
  if (nextJoinerRPSNumeric === 0) nextJoinerRPS = 'R';
  else if (nextJoinerRPSNumeric === 1) nextJoinerRPS = 'P';
  else nextJoinerRPS = 'S';

  let risk;

  if (probabilities[nextJoinerRPSNumeric] > 0.4 && probabilities[nextJoinerRPSNumeric] <= 0.65) {
    risk = 3;
  } else if (probabilities[nextJoinerRPSNumeric] > 0.65) {
    risk = 4;
  } else if (probabilities[nextJoinerRPSNumeric] > 0.2) {
    risk = 2;
  } else {
    risk = 1;
  }
  let bestCounterMove;

  // Introduce 33% chance of returning a random move
  if (Math.random() < 0.33) {
    const randomMoveIndex = Math.floor(Math.random() * 3);
    bestCounterMove = randomMoveIndex === 0 ? 'R' : randomMoveIndex === 1 ? 'P' : 'S';
  } else {
    if (nextJoinerRPS === 'R') bestCounterMove = Math.random() < 0.5 ? 'P' : 'R';
    else if (nextJoinerRPS === 'P') bestCounterMove = Math.random() < 0.5 ? 'P' : 'S';
    else bestCounterMove = Math.random() < 0.5 ? 'R' : 'S';
  }

  return { move: bestCounterMove, risk: risk };
}


function getRandomMoveExcluding(excludeMove) {
  if (excludeMove === 'R') {
    return 'S'
  } else if (excludeMove === 'P') {
    return 'R'
  } else {
    return 'P'
  }
 
}

// Main function to handle reinforcement learning with dynamic adaptation mechanism
export async function reinforcementAI(data) {
  if (data.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const historicData = data.slice(0, 20);
  const rpsNumeric = historicData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
  const joinerRPSNumeric = historicData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

  const results = historicData.map((entry, index) => ({
    rps: entry.rps,
    joiner_rps: entry.joiner_rps,
    win: (entry.joiner_rps === 'R' && entry.rps === 'P') ||
      (entry.joiner_rps === 'P' && entry.rps === 'S') ||
      (entry.joiner_rps === 'S' && entry.rps === 'R')
  }));

  const recentGamesAnalysis = results.slice(1).map((current, i) => {
    const previous = results[i];
    return {
      win: previous.win,
      joinerChanged: current.rps !== previous.rps
    };
  });

  const winChangePattern = recentGamesAnalysis.reduce((acc, game) => {
    if (game.win) {
      acc.winChanges.push(game.joinerChanged);
    } else {
      acc.lossChanges.push(game.joinerChanged);
    }
    return acc;
  }, { winChanges: [], lossChanges: [] });

  const winChangesCount = winChangePattern.winChanges.filter(change => change).length;
  const lossChangesCount = winChangePattern.lossChanges.filter(change => change).length;
  const winCount = winChangePattern.winChanges.length;
  const lossCount = winChangePattern.lossChanges.length;

  const winChangeProbability = winCount > 0 ? winChangesCount / winCount : 0;
  const lossChangeProbability = lossCount > 0 ? lossChangesCount / lossCount : 0;

  const winChangesLikely = winChangeProbability > 0.3;
  const lossChangesLikely = lossChangeProbability > 0.3;

  const lastGame = historicData[0];

  const lastGameWasLoss =
    (lastGame.joiner_rps === 'R' && lastGame.rps === 'S') ||
    (lastGame.joiner_rps === 'S' && lastGame.rps === 'P') ||
    (lastGame.joiner_rps === 'P' && lastGame.rps === 'R');

  const lastGameWasWin =
    (lastGame.joiner_rps === 'R' && lastGame.rps === 'P') ||
    (lastGame.joiner_rps === 'S' && lastGame.rps === 'R') ||
    (lastGame.joiner_rps === 'P' && lastGame.rps === 'S');
    
    const lastGameWasDraw =
    (lastGame.joiner_rps === lastGame.rps);
    
  let model;
  try {
    model = await trainModel(rpsNumeric, joinerRPSNumeric);

    let bestCounterMove = await predictNextMove(model, rpsNumeric);

   if (lastGameWasWin || lastGameWasDraw) {
      if (!winChangesLikely) {
        bestCounterMove = {
          move: getBeatingType(lastGame.rps),
          risk: 3
        };
      } 
    } else if (lastGameWasLoss){
      if(lossChangesLikely){
        bestCounterMove = {
          move: getRandomMoveExcluding(lastGame.rps),
          risk: 3
        };
      } else {
        bestCounterMove = {
          move: getBeatingType(lastGame.rps),
          risk: 3
        };
      }

    }
    return bestCounterMove;
  } finally {
    if (model) {
      model.dispose();
    }
  }
}


export function patternBasedAI(historicData) {
  // If there's no historic data, start with a random move
  if (historicData.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const opponentMoves = historicData.map(item => item.joiner_rps);

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

export function counterSwitchAI(historicData) {
  const moves = ['R', 'P', 'S'];

  if (historicData.length > 0) {
    const lastGame = historicData[0];

    const lastGameWasWin =
      (lastGame.joiner_rps === 'R' && lastGame.rps === 'S') ||
      (lastGame.joiner_rps === 'S' && lastGame.rps === 'P') ||
      (lastGame.joiner_rps === 'P' && lastGame.rps === 'R');

    const lastGameWasLoss =
      (lastGame.joiner_rps === 'R' && lastGame.rps === 'P') ||
      (lastGame.joiner_rps === 'S' && lastGame.rps === 'R') ||
      (lastGame.joiner_rps === 'P' && lastGame.rps === 'S');

      if (lastGameWasWin) {
        const repeatProbability = 1;
        if (Math.random() < repeatProbability) {
          return lastGame.joiner_rps;
        }
      } else if (lastGameWasLoss) {
        if (lastGame.joiner_rps === 'R') return 'P';
        else if (lastGame.joiner_rps === 'P') return 'S';
        else {
          return 'R';
        } 
      } else {
        return lastGame.joiner_rps;
      }
  }
}

export function innovate(historicData) {
  // Get the first 6 entries of joiner_rps from the historic data
  const firstEntries = historicData.slice(0, 6);
  const firstJoinerQs = firstEntries.map(entry => entry.joiner_rps);

  // Ensure we have valid entries for comparison
  if (firstJoinerQs.length < 6 || firstJoinerQs.some(entry => !['R', 'P', 'S'].includes(entry))) {
    // Not enough data or invalid data, return a random move with risk 1
    return { counterMove: getRandomMove(), risk: 1 };
  }

  // Check if all the first 6 joiner_qs are the same
  const allSame = firstJoinerQs.every(rps => rps === firstJoinerQs[0]);
  if (allSame) {
    // Generate a list of possible moves excluding the last joiner_rps value
    const lastMove = firstJoinerQs[0];
    // const possibleMoves = ['R', 'P', 'S'].filter(move => move !== lastMove);
    return { counterMove: getBeatingType2(lastMove), risk: 3};
  } else {
    // Return the same move as the first joiner_qs
    const previousMove = historicData[0].joiner_rps;
    return { counterMove: previousMove, risk: 1 };
  }
}

function getRandomMove() {
  const moves = ['R', 'P', 'S'];
  return moves[Math.floor(Math.random() * moves.length)];
}


export function counterRandomness(historicData) {
  if (historicData.length < 3) {
    // If historicData has less than 3 moves, return a random move and risk 1
    return { counterMove: getRandomMove(), risk: 1 };
  }

  // Check for missing value in the last 5 moves
  const lastFiveMoves = historicData.slice(0, 5).map(move => move.rps);
  const movesSetLastFive = new Set(lastFiveMoves);
  let missingValue = null;

  if (!movesSetLastFive.has('R')) {
    missingValue = 'R';
  } else if (!movesSetLastFive.has('P')) {
    missingValue = 'P';
  } else if (!movesSetLastFive.has('S')) {
    missingValue = 'S';
  }

  let counterMove;
  let risk;

  if (missingValue) {
    switch (missingValue) {
      case 'R':
        counterMove = 'P';
        break;
      case 'P':
        counterMove = 'S';
        break;
      case 'S':
        counterMove = 'R';
        break;
    }
    risk = 3;
  } else {
    // Check for missing value in the last 4 moves
    const lastFourMoves = historicData.slice(0, 4).map(move => move.rps);
    const movesSetLastFour = new Set(lastFourMoves);

    if (!movesSetLastFour.has('R')) {
      missingValue = 'R';
    } else if (!movesSetLastFour.has('P')) {
      missingValue = 'P';
    } else if (!movesSetLastFour.has('S')) {
      missingValue = 'S';
    }

    if (missingValue) {
      switch (missingValue) {
        case 'R':
          counterMove = 'P';
          break;
        case 'P':
          counterMove = 'S';
          break;
        case 'S':
          counterMove = 'R';
          break;
      }
      risk = 2;
    } else {
      counterMove = getRandomMove();
      risk = 1;
    }
  }

  return { counterMove, risk };
}

export function NPC(historicData) {
  const lastMove = historicData[0].joiner_rps;
  return lastMove;
}

export function generatePattern(allBetItems) {
  const patterns = [
    ['R', 'P'],
    ['P', 'S'],
    ['S', 'R']
    // Add more patterns as needed
  ];

  if (allBetItems.length < 2) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const lastTwoMoves = allBetItems.slice(0, 2).map(item => item.joiner_rps);
  let matchedPattern = null;

  // Identify the initial matched pattern from the first two moves
  for (const pattern of patterns) {
    if ((pattern[0] === lastTwoMoves[0] && pattern[1] === lastTwoMoves[1]) ||
        (pattern[1] === lastTwoMoves[0] && pattern[0] === lastTwoMoves[1])) {
      matchedPattern = pattern;
      break;
    }
  }

  if (matchedPattern) {
    let continuationCount = 0;

    // Check for continuation of the matched pattern
    for (let i = 2; i < allBetItems.length; i++) {
      const previousMove = allBetItems[i - 1].joiner_rps;
      const currentMove = allBetItems[i].joiner_rps;
      if ((previousMove === matchedPattern[0] && currentMove === matchedPattern[1]) ||
          (previousMove === matchedPattern[1] && currentMove === matchedPattern[0])) {
        continuationCount++;
      } else {
        break;
      }
    }

    // Decide the next move based on continuation count
    const maxContinuation = 8; // Fixed maximum continuation for reduced randomness

    if (continuationCount >= maxContinuation) {
      const movesNotInPattern = ['R', 'P', 'S'].filter(move => !matchedPattern.includes(move));
      return movesNotInPattern[0]; // Deterministic choice to break the pattern
    }

    return matchedPattern[1]; // Continue the pattern deterministically
  } else {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomMove;
  }
}


export function martingaleStrategy(historicData) {
  // If there's no historic data or it's the first round, play randomly
  if (historicData.length === 0) {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return {
      move: randomMove,
      lastResult: null // No previous result
    };
  }

  // Get the result of the previous game
  const lastOpponentMove = historicData[0].joiner_rps;
  const lastAIMove = historicData[0].rps;
  const lastResult = getResult(lastAIMove, lastOpponentMove);

  // Play randomly
  const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];

  // Return the random move along with the result of the previous game
  return {
    move: randomMove,
    lastResult: lastResult // Return the result of the previous game
  };
}

// Function to determine the result of the game based on AI's move and opponent's move
function getResult(aiMove, opponentMove) {
  if (aiMove === opponentMove) {
    return 'draw';
  } else if ((aiMove === 'R' && opponentMove === 'P') ||
    (aiMove === 'P' && opponentMove === 'S') ||
    (aiMove === 'S' && opponentMove === 'R')) {
    return 'win';
  } else {
    return 'loss';
  }
}
