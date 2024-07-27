const tf = require('@tensorflow/tfjs-node');
const { trainModel_qs, predictNextMove_qs } = require('./modelUtils');

const calcWinChanceQs = (gameType, rounds) => {
  let probWin = (100 / gameType).toFixed(2);
  let probLose = (100 - probWin).toFixed(2);

  const freq = {};
  for (let i = 0; i < gameType; i++) {
    freq[i] = 0;
  }

  rounds.forEach((round) => {
    freq[round.qs]++;
  });

  const freqValues = Object.values(freq);
  const range = Math.max(...freqValues) - Math.min(...freqValues);

  const sensitivityFactor = (range / 100) * gameType;
  const adjustmentFactor = (range / gameType) * sensitivityFactor;
  probWin = (+probWin - adjustmentFactor).toFixed(2);
  probLose = (+probLose + adjustmentFactor).toFixed(2);

  return `${probWin}% - ${probLose}%`;
};

const predictNextQs = (qs_list, gameType) => {
  const options = [...Array(gameType).keys()];
  const transitionMatrix = {};
  const randomnessFactor = 0.15;

  // Initialize the transition matrix
  options.forEach((option1) => {
    transitionMatrix[option1] = {};
    options.forEach((option2) => {
      transitionMatrix[option1][option2] = {};
      options.forEach((option3) => {
        transitionMatrix[option1][option2][option3] = {};
        options.forEach((option4) => {
          transitionMatrix[option1][option2][option3][option4] = 0;
        });
      });
    });
  });

  // Populate the transition matrix
  for (let i = 0; i < qs_list.length - 3; i++) {
    if (
      transitionMatrix[qs_list[i].qs] &&
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs] &&
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs]
    ) {
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
    }
  }

  // Normalize the transition matrix
  Object.keys(transitionMatrix).forEach((fromState1) => {
    Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach((fromState3) => {
        const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b, 0);
        if (totalTransitions > 0) {
          Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach((toState) => {
            transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
          });
        }
      });
    });
  });

  // Ensure qs_list has at least 4 elements
  if (qs_list.length < 4) {
    throw new Error('qs_list must contain at least 4 elements.');
  }

  const winChance = calcWinChanceQs(gameType, qs_list); // Assuming this function is defined elsewhere
  const targetProbability = 100 / gameType;
  const deviation = Math.abs(winChance - targetProbability);

  let currentState1 = qs_list[qs_list.length - 3]?.qs;
  let currentState2 = qs_list[qs_list.length - 2]?.qs;
  let currentState3 = qs_list[qs_list.length - 1]?.qs;

  if (currentState1 === undefined || currentState2 === undefined || currentState3 === undefined) {
    throw new Error('Insufficient data in qs_list to determine current states.');
  }

  const weightedOptions = [];
  if (
    transitionMatrix[currentState1] &&
    transitionMatrix[currentState1][currentState2] &&
    transitionMatrix[currentState1][currentState2][currentState3]
  ) {
    Object.entries(transitionMatrix[currentState1][currentState2][currentState3]).forEach(([state, prob]) => {
      for (let i = 0; i < Math.floor(prob * 100); i++) {
        weightedOptions.push(state);
      }
    });
  }

  let nextState;
  if (weightedOptions.length > 0) {
    nextState = weightedOptions[Math.floor(Math.random() * weightedOptions.length)];
  } else {
    nextState = options[Math.floor(Math.random() * options.length)];
  }

  if (Math.random() < randomnessFactor) {
    nextState = options[Math.floor(Math.random() * options.length)];
  }

  return nextState;
};


async function reinforcementAI_qs(data, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  // Return random move if data is empty
  if (data.length === 0) {
    console.log("Data is empty, returning random move");
    return { move: getRandomItem_qs(qs_game_type), risk: 0 };
  }

  // Process the last 20 items from data
  const historicData = data.slice(-30);
  const qsNumeric = historicData.map(entry => parseInt(entry.qs, 10));
  const joinerRPSNumeric = historicData.map(entry => parseInt(entry.joiner_qs, 10));

  // Determine wins and losses
  const results = historicData.map(entry => ({
    qs: entry.qs,
    joiner_qs: entry.joiner_qs,
    win: entry.qs !== entry.joiner_qs
  }));

  const winChanges = [];
  const lossChanges = [];

  for (let i = 0; i < results.length - 1; i++) {
    const current = results[i];
    const next = results[i + 1];
    
    if (current.win) {
      winChanges.push(next.joiner_qs !== current.joiner_qs);
    } else {
      lossChanges.push(next.joiner_qs !== current.joiner_qs);
    }
  }
  // Determine likelihood of change patterns
  const winChangesLikely = winChanges.length > 0 ? winChanges.filter(change => change).length / winChanges.length : 0;
  const lossChangesLikely = lossChanges.length > 0 ? lossChanges.filter(change => change).length / lossChanges.length : 0;

  let model;
  try {
    // Train the model with historical data
    model = await trainModel_qs(qsNumeric, joinerRPSNumeric, qs_game_type);

    let bestCounterMove = {};
    const mostRecentGame = results[results.length - 1];

    // Introduce randomness to avoid overfitting
    const randomnessFactor = 0.4;
    if (Math.random() < randomnessFactor) {

      bestCounterMove.move = getRandomItem_qs(qs_game_type);
    } else if (mostRecentGame.win) {
      // If recent game was a win
      if (winChangesLikely > 0.5) {
        // Predict next move based on the model
        bestCounterMove = await predictNextMove_qs(model, joinerRPSNumeric, qs_game_type);
      } else {
        // Repeat the same move as the most recent game
        bestCounterMove.move = mostRecentGame.joiner_qs;
      }
    } else {
      if (lossChangesLikely > 0.5) {
        bestCounterMove = await predictNextMove_qs(model, joinerRPSNumeric, qs_game_type);
      } else {
        bestCounterMove.move = mostRecentGame.joiner_qs;
      }
    }
    // const predictedMove = bestCounterMove.move;
    // const actualMoveChanged = predictedMove !== mostRecentGame.joiner_qs;
    // console.log("move", bestCounterMove.move)
    // console.log(`Most recent game was a ${mostRecentGame.win ? 'win' : 'loss'}. Prediction: joiner_qs will ${actualMoveChanged ? 'change' : 'repeat'}`);

    return bestCounterMove;
  } finally {
    if (model) {
      model.dispose();
    }
  }
}



function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function patternBasedAI_qs(historicData, qs_game_type) {
  if (historicData.length === 0) {
      return getRandomItem_qs(qs_game_type);
  }
  const opponentMoves = historicData.map(item => item.joiner_qs);
  const moveCounts = Array(qs_game_type).fill(0);
  opponentMoves.slice(-10).forEach(move => {
      moveCounts[move]++;
  });

  const mostFrequentMove = moveCounts.indexOf(Math.max(...moveCounts));

  const nextMove = (mostFrequentMove + 1) % qs_game_type;
  return nextMove;
}

function counterSwitchAI_qs(historicData, qs_game_type) {
  if (historicData.length > 0) {
      const lastGame = historicData[0];

      const lastGameWasWin = lastGame.qs !== lastGame.joiner_qs;
      const lastGameWasLoss = lastGame.qs === lastGame.joiner_qs;

      if (lastGameWasWin) {
          const repeatProbability = 1;
          if (Math.random() < repeatProbability) {
              return parseInt(lastGame.qs, 10);
          }
      } else if (lastGameWasLoss) {
          return (parseInt(lastGame.joiner_qs, 10) + 1) % qs_game_type;
      }
  }
  return getRandomItem_qs(qs_game_type);
}


function counterRandomness_qs(historicData, qs_game_type) {
  // If historicData is empty or undefined, default to a random move
  if (!historicData || historicData.length === 0) {
      return getRandomItem_qs(qs_game_type);
  }

  // Get the last move from the historic data
  const lastOpponentMove = historicData[0].joiner_qs !== undefined ? parseInt(historicData[0].joiner_qs, 10) : getRandomItem_qs(qs_game_type);

  // Return a random move
  return getRandomItem_qs(qs_game_type);
}



function NPC_qs(historicData) {
  const lastMove = historicData.length > 0 ? historicData[0].qs : "0";
  return lastMove;

}


function generatePattern_qs(allBetItems, qs_game_type) {
  // Create patterns based on qs_game_type
  const patterns = [];
  for (let i = 0; i < qs_game_type; i++) {
      for (let j = 0; j < qs_game_type; j++) {
          if (i !== j) {
              patterns.push([i, j]);
          }
      }
  }

  // Get the last two moves from the allBetItems
  const lastTwoMoves = allBetItems.slice(0, 2).map(item => parseInt(item.qs, 10));

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
          if ((parseInt(allBetItems[i - 1].qs, 10) === matchedPattern[0] && parseInt(allBetItems[i].qs, 10) === matchedPattern[1]) ||
              (parseInt(allBetItems[i - 1].qs, 10) === matchedPattern[1] && parseInt(allBetItems[i].qs, 10) === matchedPattern[0])) {
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
          const movesNotInPattern = Array.from({ length: qs_game_type }, (_, i) => i).filter(move => !matchedPattern.includes(move));
          const randomMove = movesNotInPattern[Math.floor(Math.random() * movesNotInPattern.length)];
          return randomMove;
      }

      // Return the next move based on the dynamic index
      return parseInt(allBetItems[1].qs, 10);
  } else {
      // If no matching pattern found, return a random move
      return getRandomItem_qs(qs_game_type);
  }
}

function getCopyCatItem_qs(allBetItems) {
  const copyCatBetItem = allBetItems.find(item => item.joiner_qs);
  return copyCatBetItem ? copyCatBetItem.joiner_qs : getRandomItem();
}


module.exports = {
  predictNextQs,
  calcWinChanceQs,
  reinforcementAI_qs,
  patternBasedAI_qs,
  counterSwitchAI_qs,
  NPC_qs,
  getRandomItem_qs,
  getCopyCatItem_qs,
  counterRandomness_qs,
  generatePattern_qs
};
