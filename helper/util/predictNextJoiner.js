const tf = require('@tensorflow/tfjs-node');

const getBeatingType2 = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return 'S';
  } else if (currentState === 'P') {
    return 'R';
  } else {
    return 'P';
  }
}


function innovate(historicData) {
  const firstEntries = historicData.slice(0, 8);
  const firstJoinerQs = firstEntries.map(entry => entry.joiner_rps);

  if (firstJoinerQs.length < 8 || firstJoinerQs.some(entry => !['R', 'P', 'S'].includes(entry))) {
    return { counterMove: getRandomMove(), risk: 1 };
  }
  const allSame = firstJoinerQs.every(rps => rps === firstJoinerQs[0]);
  if (allSame) {
    const lastMove = firstJoinerQs[0];
    return { counterMove: getBeatingType2(lastMove), risk: 3 };
  } else {
    const previousMove = historicData[0].joiner_rps;
    return { counterMove: previousMove, risk: 1 };
  }
}


const predictNext = (rps_list, markov = false) => {
  const choices = ['R', 'P', 'S'];
  const smoothingFactor = 0.1;

  if (rps_list.length <= 1) {
    return choices[Math.floor(Math.random() * 3)];
  }

  const subsetSize = Math.min(rps_list.length - 1, 10); // Adjust subset size if needed
  const startIndex = Math.floor(Math.random() * (rps_list.length - subsetSize));
  const subset = rps_list.slice(startIndex, startIndex + subsetSize);

  const transitionMatrix = {
    R: { R: 0, P: 0, S: 0 },
    P: { R: 0, P: 0, S: 0 },
    S: { R: 0, P: 0, S: 0 },
  };

  for (let i = 0; i < subset.length - 1; i++) {
    const currentState = subset[i].rps;
    const nextState = subset[i + 1].rps;
    transitionMatrix[currentState][nextState]++;
  }

  Object.keys(transitionMatrix).forEach((fromState) => {
    const totalTransitions = Object.values(transitionMatrix[fromState]).reduce((a, b) => a + b, 0);
    if (totalTransitions > 0) {
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] = (transitionMatrix[fromState][toState] + smoothingFactor) / (totalTransitions + smoothingFactor * 3);
      });
    } else {
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] = 1 / 3;
      });
    }
  });

  const currentState = rps_list[rps_list.length - 1].rps;
  let nextState = currentState;
  let maxProb = 0;

  Object.keys(transitionMatrix[currentState]).forEach((state) => {
    if (transitionMatrix[currentState][state] > maxProb) {
      maxProb = transitionMatrix[currentState][state];
      nextState = state;
    }
  });

  if (markov) {
    nextState = getBeatingType(nextState);
  }

  const deviationThreshold = 0.05; // Adjusted to make randomness more impactful
  if (Math.random() < deviationThreshold) {
    let randomState;
    do {
      randomState = choices[Math.floor(Math.random() * 3)];
    } while (randomState === currentState);
    nextState = randomState;
  }

  return nextState;
}


const getBeatingType = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return random < 0.95 ? 'P' : 'R';
  } else if (currentState === 'P') {
    return random < 0.95 ? 'S' : 'P';
  } else {
    return random < 0.95 ? 'R' : 'S';
  }
}

async function trainModel(rpsNumeric, joinerRPSNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 128, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
    verbose: 0,
  });

  await model.fit(rpsTensor, joinerRPSTensor, { epochs: 30, verbose: 0, batch_size: 32 });

  rpsTensor.dispose();
  joinerRPSTensor.dispose();

  return model;
}

async function predictNextMove(model, rpsNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);
  const probabilities = prediction.dataSync();
  const nextJoinerRPSNumeric = tf.argMax(prediction, 1).dataSync()[0];

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

async function reinforcementAI(data) {
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
    } else if (lastGameWasLoss) {
      if (lossChangesLikely) {
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


function patternBasedAI(historicData) {
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

  const mostFrequentMove = Object.keys(moveCounts).reduce((a, b) => moveCounts[a] > moveCounts[b] ? a : b);
  switch (mostFrequentMove) {
    case 'R':
      return 'P';
    case 'P':
      return 'S';
    case 'S':
      return 'R';
    default:

      return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

}

function counterSwitchAI(historicData) {
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

function getRandomMove() {
  const moves = ['R', 'P', 'S'];
  return moves[Math.floor(Math.random() * moves.length)];
}


function counterRandomness(historicData) {
  if (historicData.length < 3) {
    return { counterMove: getRandomMove(), risk: 1 };
  }

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

function NPC(historicData) {
  const lastMove = historicData[0].joiner_rps;
  return lastMove;
}

function generatePattern(allBetItems) {
  const patterns = [
    ['R', 'P'],
    ['P', 'S'],
    ['S', 'R']
  ];

  if (allBetItems.length < 2) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const lastTwoMoves = allBetItems.slice(0, 2).map(item => item.joiner_rps);
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
      const previousMove = allBetItems[i - 1].joiner_rps;
      const currentMove = allBetItems[i].joiner_rps;
      if ((previousMove === matchedPattern[0] && currentMove === matchedPattern[1]) ||
        (previousMove === matchedPattern[1] && currentMove === matchedPattern[0])) {
        continuationCount++;
      } else {
        break;
      }
    }

    const maxContinuation = 8;

    if (continuationCount >= maxContinuation) {
      const movesNotInPattern = ['R', 'P', 'S'].filter(move => !matchedPattern.includes(move));
      return movesNotInPattern[0];
    }

    return matchedPattern[1];
  } else {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomMove;
  }
}


function martingaleStrategy(historicData) {
  if (historicData.length === 0) {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return {
      move: randomMove,
      lastResult: null
    };
  }

  const lastOpponentMove = historicData[0].joiner_rps;
  const lastAIMove = historicData[0].rps;
  const lastResult = getResult(lastAIMove, lastOpponentMove);

  const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  return {
    move: randomMove,
    lastResult: lastResult
  };
}

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


module.exports = {
  innovate,
  generatePattern,
  martingaleStrategy,
  NPC,
  counterRandomness,
  predictNext,
  predictNextMove,
  counterSwitchAI,
  patternBasedAI,
  reinforcementAI
};
