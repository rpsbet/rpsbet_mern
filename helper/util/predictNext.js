const tf = require('@tensorflow/tfjs-node');

const predictNext = (rps_list, markov = false) => {
  // console.log("S")
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

  let currentState1 = rps_list[rps_list.length - 3].rps;
  let currentState2 = rps_list[rps_list.length - 2].rps;
  let currentState3 = rps_list[rps_list.length - 1].rps;
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
  // console.log("Sxs")

  return nextState;

}

// Function to get the beating type
const getBeatingType = (currentState) => {
  if (currentState === 'R') {
    return 'P'; // Rock beats Scissors
  } else if (currentState === 'P') {
    return 'S'; // Paper beats Rock
  } else {
    return 'R'; // Scissors beats Paper
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
  // Convert data to TensorFlow tensors
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
      metrics: ['accuracy']
  });

  // Train the model
  await model.fit(rpsTensor, joinerRPSTensor, { epochs: 50, batch_size: 32 });

  return model;
}
// Function to make predictions using the trained model
async function predictNextMove(model, rpsNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);
  const nextJoinerRPSNumeric = tf.argMax(prediction, axis=1).dataSync()[0];

  let nextJoinerRPS;
  if (nextJoinerRPSNumeric === 0) nextJoinerRPS = 'R';
  else if (nextJoinerRPSNumeric === 1) nextJoinerRPS = 'P';
  else nextJoinerRPS = 'S';

  console.log("Predicted next joiner_rps:", nextJoinerRPS);

  let bestCounterMove;

  // Introduce 33% chance of returning a random move
  if (Math.random() < 0.33) {
    const randomMoveIndex = Math.floor(Math.random() * 3);
    bestCounterMove = randomMoveIndex === 0 ? 'R' : randomMoveIndex === 1 ? 'P' : 'S';
  } else {
    // Redefine bestCounterMove based on joiner_rps
    if (nextJoinerRPS === 'R') bestCounterMove = Math.random() < 0.5 ? 'P' : 'R';
    else if (nextJoinerRPS === 'P') bestCounterMove = Math.random() < 0.5 ? 'P' : 'S';
    else bestCounterMove = Math.random() < 0.5 ? 'R' : 'S';
  }

  return bestCounterMove;
}


// Main function to handle reinforcement learning with dynamic adaptation mechanism
async function reinforcementAI(data) {
  const historicData = data.reverse();
  // Convert historic data to numerical values
  const rpsNumeric = historicData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
  const joinerRPSNumeric = historicData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

  // Train the model with the existing data
  const model = await trainModel(rpsNumeric, joinerRPSNumeric);

  // Predict the next joiner_rps
  let bestCounterMove = await predictNextMove(model, joinerRPSNumeric);

  // Check if recent games were wins, if not, adapt
  const recentGames = historicData.slice(-5); // Consider the last 5 games
  const recentWins = recentGames.filter(game => {
      return (game.joiner_rps === 'R' && game.rps === 'P') ||
             (game.joiner_rps === 'P' && game.rps === 'S') ||
             (game.joiner_rps === 'S' && game.rps === 'R');
  });

  if (recentWins.length !== 5) {
      console.log("No recent wins, adapting...");
      // Adapt the model based on recent losses
      const newData = historicData.slice(-1); // Consider the last 1 game for adaptation
      const newRpsNumeric = newData.map(entry => (entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2));
      const newJoinerRPSNumeric = newData.map(entry => (entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2));

      // Retrain the model with the recent data
      const updatedModel = await trainModel(newRpsNumeric, newJoinerRPSNumeric);

      // Predict the next joiner_rps again after adaptation
      bestCounterMove = await predictNextMove(updatedModel, joinerRPSNumeric);
  }

  return bestCounterMove;
}


function patternBasedAI(historicData) {
  // Count the number of losses
  const totalGames = historicData.length;
  const losses = historicData.filter(item => {
      return (item.rps === 'R' && item.joiner_rps === 'S') || 
             (item.rps === 'S' && item.joiner_rps === 'P') || 
             (item.rps === 'P' && item.joiner_rps === 'R');
  }).length;

  // Check if the percentage of losses exceeds 50%
  if (losses / totalGames > 0.5) {
      // If the AI is losing more than 50% of the time, switch to a random move
      const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
      return randomMove;
  }

  // Analyze opponent's moves and identify patterns
  const opponentMoves = historicData.map(item => item.joiner_rps);

  // Look for repeated patterns in the opponent's moves
  const patternLength = 6; // Adjust the pattern length as needed
  const uniquePatterns = new Set(opponentMoves.join('|'));

  let bestMove;

  if (uniquePatterns.size === 1 && uniquePatterns.has('R')) {
      // If the opponent always plays Rock, counter with Paper
      bestMove = 'P';
  } else if (uniquePatterns.size === 1 && uniquePatterns.has('P')) {
      // If the opponent always plays Paper, counter with Scissors
      bestMove = 'S';
  } else if (uniquePatterns.size === 1 && uniquePatterns.has('S')) {
      // If the opponent always plays Scissors, counter with Rock
      bestMove = 'R';
  } else {
      // Otherwise, play a random move
      bestMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  return bestMove;
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
  patternBasedAI,
  counterSwitchAI,
  NPC,
  counterRandomness,
  generatePattern
};
