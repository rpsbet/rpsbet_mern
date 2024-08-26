const tf = require('@tensorflow/tfjs-node');

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

async function predictNextQs(qs_list, gameType) {
  const options = [...Array(gameType).keys()];
  const transitionMatrix = {};

  const filteredQsList = qs_list.filter(item => item.qs !== null && item.qs !== '');

  if (filteredQsList.length < 3) {
    return options[Math.floor(Math.random() * gameType)];
  }

  options.forEach(option1 => {
    transitionMatrix[option1] = {};
    options.forEach(option2 => {
      transitionMatrix[option1][option2] = {};
      options.forEach(option3 => {
        transitionMatrix[option1][option2][option3] = {};
        options.forEach(option4 => {
          transitionMatrix[option1][option2][option3][option4] = 0;
        });
      });
    });
  });

  // Populate transition matrix
  for (let i = 0; i < filteredQsList.length - 3; i++) {
    transitionMatrix[filteredQsList[i].qs][filteredQsList[i + 1].qs][filteredQsList[i + 2].qs][filteredQsList[i + 3].qs]++;
  }

  // Normalize transition matrix
  Object.keys(transitionMatrix).forEach(fromState1 => {
    Object.keys(transitionMatrix[fromState1]).forEach(fromState2 => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach(fromState3 => {
        const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b, 0);
        Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach(toState => {
          if (totalTransitions > 0) {
            transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
          }
        });
      });
    });
  });

  // Calculate win chance
  const winChance = calcWinChanceQs(gameType, filteredQsList);
  let deviation = 0;
  if (winChance !== '33.33%') {
    deviation = (1 - 1 / gameType) / 10; // Reduced deviation factor
  }

  let currentState1 = filteredQsList[filteredQsList.length - 3].qs;
  let currentState2 = filteredQsList[filteredQsList.length - 2].qs;
  let currentState3 = filteredQsList[filteredQsList.length - 1].qs;
  let nextState = currentState3;
  let maxProb = 0;

  Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach(state => {
    if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
      maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
      nextState = state;
    }
  });

  let randomNum = Math.random();
  if (randomNum < deviation) {
    let randomState = '';
    do {
      randomState = options[Math.floor(Math.random() * gameType)];
    } while (randomState === nextState);
    nextState = randomState;
  }

  return nextState;
}

function martingaleStrategy_qs(historicData, qs_game_type) {
  if (historicData.length === 0) {
    const randomMove = getRandomItem_qs(qs_game_type);
    return {
      move: randomMove,
      lastResult: null
    };
  }

  const lastOpponentMove = historicData[0].joiner_qs;
  const lastAIMove = historicData[0].qs;
  const lastResult = getResult(lastAIMove, lastOpponentMove);

  const randomMove = getRandomItem_qs(qs_game_type);

  return {
    move: randomMove,
    lastResult: lastResult
  };
}

function getResult(aiMove, opponentMove) {
  if (aiMove === opponentMove) {
    return 'loss';
  } else {
    return 'win';
  }
}

async function trainModel_qs(rpsNumeric, joinerRPSNumeric, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: qs_game_type, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.1),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  await model.fit(rpsTensor, joinerRPSTensor, {
    epochs: 10,
    verbose: 0,
    batch_size: Math.max(1, rpsNumeric.length),
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
      }
    }
  });

  rpsTensor.dispose();
  joinerRPSTensor.dispose();

  return model;
}

async function predictNextMove_qs(model, rpsNumeric, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);

  const predictionData = prediction.dataSync();

  const nextJoinerRPSNumeric = tf.argMax(prediction, 1).dataSync()[0];

  // Dispose of tensors
  rpsTensor.dispose();
  let risk;
  if (predictionData[nextJoinerRPSNumeric] > 0.4 && predictionData[nextJoinerRPSNumeric] <= 0.7) {
    risk = 3;
  } else if (predictionData[nextJoinerRPSNumeric] > 0.7) {
    risk = 4;
  } else if (predictionData[nextJoinerRPSNumeric] > 0.2) {
    risk = 2;
  } else {
    risk = 1;
  }

  return { move: nextJoinerRPSNumeric, risk: risk };
}


async function reinforcementAI_qs(data, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  if (data.length === 0) {
    return { move: getRandomItem_qs(qs_game_type), risk: 0 };
  }

  const historicData = data.reverse().slice(0, 20);
  const qsNumeric = historicData.map(entry => parseInt(entry.qs, 10));
  const joinerRPSNumeric = historicData.map(entry => parseInt(entry.joiner_qs, 10));

  const results = historicData.map((entry, index) => ({
    qs: entry.qs,
    joiner_qs: entry.joiner_qs,
    win: entry.qs !== entry.joiner_qs
  }));

  const recentGamesAnalysis = results.slice(1).map((current, i) => {
    const previous = results[i];
    return {
      win: previous.win,
      joinerChanged: current.joiner_qs !== previous.joiner_qs
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

  const winChangesLikely = winChangePattern.winChanges.every(change => change);
  const lossChangesLikely = winChangePattern.lossChanges.every(change => change);

  let model;
  try {
    model = await trainModel_qs(joinerRPSNumeric, qsNumeric, qs_game_type);

    let bestCounterMove = await predictNextMove_qs(model, qsNumeric, qs_game_type);

    const randomnessFactor = 0.1;
    if (Math.random() < randomnessFactor) {
      const possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
      possibleMoves.splice(bestCounterMove.move, 1);
      bestCounterMove.move = getRandomItem_qs(qs_game_type, possibleMoves);
    } else if (winChangesLikely || lossChangesLikely) {
      bestCounterMove = await predictNextMove_qs(model, qsNumeric, qs_game_type);
    } else {
      const possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
      possibleMoves.splice(bestCounterMove.move, 1);
      bestCounterMove.move = getRandomItem_qs(qs_game_type, possibleMoves);
    }

    return bestCounterMove;
  } finally {
    if (model) {
      model.dispose();
    }
  }
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

    const lastGameWasWin = lastGame.joiner_qs !== lastGame.qs;
    const lastGameWasLoss = lastGame.joiner_qs === lastGame.qs;

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

function innovate_qs(historicData, qs_game_type) {
  const firstEntries = historicData.slice(0, 6);
  const firstJoinerQs = firstEntries.map(entry => parseInt(entry.joiner_qs, 10));

  if (firstJoinerQs.length < 6 || firstJoinerQs.some(isNaN)) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  const allSame = firstJoinerQs.every(qs => qs === firstJoinerQs[0]);
  if (allSame) {
    const lastMove = firstJoinerQs[0];
    const possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i).filter(move => move !== lastMove);
    return { counterMove: getRandomItem_qs(qs_game_type, possibleMoves), risk: 3 };
  } else {
    const previousMove = parseInt(historicData[0].joiner_qs, 6);
    return { counterMove: previousMove, risk: 1 };
  }
}

function counterRandomness_qs(historicData, qs_game_type) {
  const dataLength = qs_game_type + 3;
  if (historicData.length < 3) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  const moveCounts = Array(qs_game_type).fill(0);
  const recentMoves = historicData.slice(0, dataLength)
    .map(move => parseInt(move.qs, 10))
    .filter(move => !Number.isNaN(move) && move >= 0 && move < qs_game_type);

  if (recentMoves.length < dataLength) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  recentMoves.forEach(move => {
    moveCounts[move]++;
  });

  const leastPlayedMove = getLeastPlayedMove(moveCounts);
  const lastTwoMoves = getLastMoves(historicData, 4);
  const lastThreeMoves = getLastMoves(historicData, 3);

  const availableMoves = Array.from({ length: qs_game_type }, (_, i) => i).filter(move => move !== leastPlayedMove);


  if (Number.isNaN(leastPlayedMove)) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  } else if (!lastTwoMoves.includes(leastPlayedMove)) {
    return { counterMove: getRandomItem_qs(qs_game_type, availableMoves), risk: 3 };
  } else if (!lastThreeMoves.includes(leastPlayedMove)) {
    return { counterMove: getRandomItem_qs(qs_game_type, availableMoves), risk: 2 };
  } else {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }
}

function getLeastPlayedMove(moveCounts) {
  const minCount = Math.min(...moveCounts);
  const leastPlayedMoves = moveCounts
    .map((count, move) => ({ move, count }))
    .filter(({ count }) => count === minCount)
    .map(({ move }) => move);

  return leastPlayedMoves.length > 0 ? leastPlayedMoves[0] : NaN;
}

function getLastMoves(historicData, n) {
  return historicData.slice(0, n)
    .map(move => parseInt(move.qs, 10))
    .filter(move => !Number.isNaN(move));
}

function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}


function NPC_qs(historicData) {
  const lastMove = historicData.length > 0 ? historicData[0].joiner_qs : 0;
  return lastMove;
}

function generatePattern_qs(allBetItems, qs_game_type) {
  const patterns = [];
  for (let i = 0; i < qs_game_type; i++) {
    for (let j = 0; j < qs_game_type; j++) {
      if (i !== j) {
        patterns.push([i, j]);
      }
    }
  }

  const lastTwoMoves = allBetItems.slice(0, 2).map(item => parseInt(item.qs, 10));

  let matchedPattern = null;
  for (const pattern of patterns) {
    if ((pattern[0] === lastTwoMoves[0] && pattern[1] === lastTwoMoves[1]) ||
      (pattern[1] === lastTwoMoves[0] && pattern[0] === lastTwoMoves[1])) {
      matchedPattern = pattern;
      break;
    }
  }

  if (matchedPattern) {
    let continuationCount = 0;

    for (let i = 2; i < allBetItems.length; i++) {
      if ((parseInt(allBetItems[i - 1].joiner_qs, 10) === matchedPattern[0] && parseInt(allBetItems[i].joiner_qs, 10) === matchedPattern[1]) ||
        (parseInt(allBetItems[i - 1].joiner_qs, 10) === matchedPattern[1] && parseInt(allBetItems[i].joiner_qs, 10) === matchedPattern[0])) {
        continuationCount++;
      } else {
        break;
      }
    }

    const maxContinuation = Math.floor(Math.random() * 4) + 2;
    if (continuationCount > maxContinuation) {
      const movesNotInPattern = Array.from({ length: qs_game_type }, (_, i) => i).filter(move => !matchedPattern.includes(move));
      const randomMove = movesNotInPattern[Math.floor(Math.random() * movesNotInPattern.length)];
      return randomMove;
    }
    return parseInt(allBetItems[1].joiner_qs, 10);
  } else {
    return getRandomItem_qs(qs_game_type);
  }
}

function getCopyCatItem_qs(allBetItems) {
  const copyCatBetItem = allBetItems.find(item => item.qs);
  return copyCatBetItem ? copyCatBetItem.qs : getRandomItem_qs();
}

module.exports = {
  getCopyCatItem_qs,
  reinforcementAI_qs,
  patternBasedAI_qs,
  counterRandomness_qs,
  counterSwitchAI_qs,
  patternBasedAI_qs,
  NPC_qs,
  predictNextMove_qs,
  getRandomItem_qs,
  generatePattern_qs,
  innovate_qs,
  martingaleStrategy_qs,
  predictNextQs
};
