const tf = require('@tensorflow/tfjs-node');
const { trainModel, predictNextMove } = require('./modelUtils');
const { Configuration, OpenAIApi } = require('openai');

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const predictNext = (rps_list, markov = false) => {
  const choices = ['R', 'P', 'S'];
  const smoothingFactor = 0.1;

  if (rps_list.length <= 1) {
    const randomChoice = choices[Math.floor(Math.random() * 3)];
    return randomChoice;
  }

  const subsetSize = Math.min(rps_list.length - 1, 10);
  const startIndex = Math.floor(Math.random() * (rps_list.length - subsetSize));
  const subset = rps_list.slice(startIndex, startIndex + subsetSize);

  const transitionMatrix = {
    R: { R: 0, P: 0, S: 0 },
    P: { R: 0, P: 0, S: 0 },
    S: { R: 0, P: 0, S: 0 },
  };

  // Populate transition matrix
  for (let i = 0; i < subset.length - 1; i++) {
    let currentState = subset[i].rps;
    let nextState = subset[i + 1].rps;

    // Validate states, default to random if invalid
    if (!choices.includes(currentState)) {
      currentState = choices[Math.floor(Math.random() * 3)];
    }
    if (!choices.includes(nextState)) {
      nextState = choices[Math.floor(Math.random() * 3)];
    }

    transitionMatrix[currentState][nextState]++;
  }

  // Normalize transition matrix with smoothing
  Object.keys(transitionMatrix).forEach((fromState) => {
    const totalTransitions = Object.values(transitionMatrix[fromState]).reduce(
      (a, b) => a + b,
      0,
    );
    if (totalTransitions > 0) {
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] =
          (transitionMatrix[fromState][toState] + smoothingFactor) /
          (totalTransitions + smoothingFactor * 3);
      });
    } else {
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] = 1 / 3;
      });
    }
  });

  // Predict next state based on the last observed state
  let currentState = rps_list[rps_list.length - 1].rps;

  // Validate the last observed state
  if (!choices.includes(currentState)) {
    currentState = choices[Math.floor(Math.random() * 3)];
  }

  let nextState = currentState;
  let maxProb = 0;

  if (transitionMatrix[currentState]) {
    Object.keys(transitionMatrix[currentState]).forEach((state) => {
      const prob = transitionMatrix[currentState][state];
      if (prob > maxProb) {
        maxProb = prob;
        nextState = state;
      }
    });
  } else {
    console.warn(
      `Warning: No transition data available for state ${currentState}`,
    );
    nextState =
      Object.keys(transitionMatrix)[0] ||
      choices[Math.floor(Math.random() * 3)];
  }

  if (markov) {
    nextState = getBeatingType(nextState);
  }

  // Add a random deviation
  const deviationThreshold = 0.05;
  if (Math.random() < deviationThreshold) {
    let randomState;
    do {
      randomState = choices[Math.floor(Math.random() * 3)];
    } while (randomState === currentState);
    nextState = randomState;
  }

  return nextState;
};

const getBeatingType = (currentState) => {
  const random = Math.random();

  if (currentState === 'R') {
    return random < 0.95 ? 'P' : 'R';
  } else if (currentState === 'P') {
    return random < 0.95 ? 'S' : 'P';
  } else {
    return random < 0.95 ? 'R' : 'S';
  }
};

const calcWinChance = (rps_list) => {
  let total = rps_list.length;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  rps_list.forEach((el) => {
    if (el.rps === 'R') {
      rock++;
    } else if (el.rps === 'P') {
      paper++;
    } else if (el.rps === 'S') {
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
    return lowest.toFixed(2) + '%';
  }
  return lowest.toFixed(2) + '% - ' + highest.toFixed(2) + '%';
};

async function reinforcementAI(data) {
  if (data.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const historicData = data.slice(0, 20);
  const rpsNumeric = historicData.map((entry) =>
    entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2,
  );
  const joinerRPSNumeric = historicData.map((entry) =>
    entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2,
  );

  const results = historicData.map((entry, index) => ({
    rps: entry.rps,
    joiner_rps: entry.rps,
    win:
      (entry.rps === 'R' && entry.joiner_rps === 'P') ||
      (entry.rps === 'P' && entry.joiner_rps === 'S') ||
      (entry.rps === 'S' && entry.joiner_rps === 'R'),
  }));

  const recentGamesAnalysis = results.slice(1).map((current, i) => {
    const previous = results[i];
    return {
      win: previous.win,
      joinerChanged: current.joiner_rps !== previous.joiner_rps,
    };
  });

  const winChangePattern = recentGamesAnalysis.reduce(
    (acc, game) => {
      if (game.win) {
        acc.winChanges.push(game.joinerChanged);
      } else {
        acc.lossChanges.push(game.joinerChanged);
      }
      return acc;
    },
    { winChanges: [], lossChanges: [] },
  );

  const winChangesCount = winChangePattern.winChanges.filter(
    (change) => change,
  ).length;
  const lossChangesCount = winChangePattern.lossChanges.filter(
    (change) => change,
  ).length;
  const winCount = winChangePattern.winChanges.length;
  const lossCount = winChangePattern.lossChanges.length;

  const winChangeProbability = winCount > 0 ? winChangesCount / winCount : 0;
  const lossChangeProbability =
    lossCount > 0 ? lossChangesCount / lossCount : 0;

  const winChangesLikely = winChangeProbability > 0.3;
  const lossChangesLikely = lossChangeProbability > 0.3;

  const lastGame = historicData[historicData.length - 1];
  const lastGameWasWin =
    (lastGame.rps === 'R' && lastGame.joiner_rps === 'S') ||
    (lastGame.rps === 'S' && lastGame.joiner_rps === 'P') ||
    (lastGame.rps === 'P' && lastGame.joiner_rps === 'R');

  const lastGameWasLoss =
    (lastGame.rps === 'R' && lastGame.joiner_rps === 'P') ||
    (lastGame.rps === 'S' && lastGame.joiner_rps === 'R') ||
    (lastGame.rps === 'P' && lastGame.joiner_rps === 'S');

  const lastGameWasDraw = lastGame.rps === lastGame.joiner_rps;

  let model;
  try {
    model = await trainModel(joinerRPSNumeric, rpsNumeric);

    let bestCounterMove = await predictNextMove(model, joinerRPSNumeric);

    if (lastGameWasWin || lastGameWasDraw) {
      if (!winChangesLikely) {
        bestCounterMove = {
          move: getBeatingType(lastGame.joiner_rps),
          risk: 3,
        };
      }
    } else if (lastGameWasLoss) {
      if (lossChangesLikely) {
        bestCounterMove = {
          move: getRandomMoveExcluding(lastGame.joiner_rps),
          risk: 3,
        };
      } else {
        bestCounterMove = {
          move: getBeatingType(lastGame.joiner_rps),
          risk: 3,
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

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function innovate(historicData) {
  const firstEntries = historicData.slice(-6);
  const firstJoinerQs = firstEntries.map((entry) => entry.rps);

  if (
    firstJoinerQs.length < 6 ||
    firstJoinerQs.some((entry) => !['R', 'P', 'S'].includes(entry))
  ) {
    return { counterMove: getRandomMove(), risk: 1 };
  }

  const allSame = firstJoinerQs.every((rps) => rps === firstJoinerQs[0]);
  if (allSame) {
    const lastMove = firstJoinerQs[firstJoinerQs.length - 1];
    const possibleMoves = ['R', 'P', 'S'].filter((move) => move !== lastMove);
    return {
      counterMove:
        possibleMoves[Math.floor(Math.random() * possibleMoves.length)],
      risk: 3,
    };
  } else {
    const previousMove = historicData[historicData.length - 1].rps;
    return { counterMove: previousMove, risk: 1 };
  }
}

function martingaleStrategy(historicData) {
  if (historicData.length === 0) {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return {
      move: randomMove,
      lastResult: randomMove,
    };
  }

  const lastOpponentMove = historicData[historicData.length - 1].rps;
  const lastAIMove = historicData[historicData.length - 1].joiner_rps;
  const lastResult = getResult(lastAIMove, lastOpponentMove);

  const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  return {
    move: randomMove,
    lastResult: lastResult,
  };
}

function getResult(aiMove, opponentMove) {
  if (aiMove === opponentMove) {
    return 'draw';
  } else if (
    (aiMove === 'R' && opponentMove === 'P') ||
    (aiMove === 'P' && opponentMove === 'S') ||
    (aiMove === 'S' && opponentMove === 'R')
  ) {
    return 'win';
  } else {
    return 'loss';
  }
}

function getRandomMove() {
  const moves = ['R', 'P', 'S'];
  return moves[Math.floor(Math.random() * moves.length)];
}

function patternBasedAI(historicData) {
  if (historicData.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const opponentMoves = historicData.map((item) => item.joiner_rps);
  const moveCounts = {
    R: 0,
    P: 0,
    S: 0,
  };

  opponentMoves.slice(-10).forEach((move) => {
    moveCounts[move]++;
  });

  const mostFrequentMove = Object.keys(moveCounts).reduce((a, b) =>
    moveCounts[a] > moveCounts[b] ? a : b,
  );

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
  if (historicData.length > 0) {
    const lastGame = historicData[historicData.length - 1];

    const lastGameWasWin =
      (lastGame.rps === 'R' && lastGame.joiner_rps === 'S') ||
      (lastGame.rps === 'S' && lastGame.joiner_rps === 'P') ||
      (lastGame.rps === 'P' && lastGame.joiner_rps === 'R');

    const lastGameWasLoss =
      (lastGame.rps === 'R' && lastGame.joiner_rps === 'P') ||
      (lastGame.rps === 'S' && lastGame.joiner_rps === 'R') ||
      (lastGame.rps === 'P' && lastGame.joiner_rps === 'S');

    if (lastGameWasWin) {
      const repeatProbability = 1;
      if (Math.random() < repeatProbability) {
        return lastGame.rps;
      }
    } else if (lastGameWasLoss) {
      if (lastGame.rps === 'R') return 'P';
      else if (lastGame.rps === 'P') return 'S';
      else {
        return 'R';
      }
    } else {
      return lastGame.rps;
    }
  }
}

function getRandomMoveExcluding(excludeMove) {
  if (excludeMove === 'R') {
    return 'S';
  } else if (excludeMove === 'P') {
    return 'R';
  } else {
    return 'P';
  }
}

function counterRandomness(historicData) {
  if (!historicData || historicData.length === 0) {
    return getRandomMove();
  }
  return getRandomMove();
}

function skillissueold(historicData) {
  if (historicData.length < 3) {
    return { counterMove: getRandomMove(), risk: 1 };
  }
  const lastFiveMoves = historicData.slice(0, 5).map((move) => move.joiner_rps);
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
    const lastFourMoves = historicData
      .slice(0, 4)
      .map((move) => move.joiner_rps);
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
  if (historicData.length <= 3) {
    return 'R';
  }
  const lastMove = historicData[historicData.length - 1].rps || 'R';
  return lastMove;
}

function generatePattern(allBetItems) {
  const patterns = [
    ['R', 'P', 'R'],
    ['P', 'S', 'P'],
    ['S', 'R', 'S'],
    ['P', 'P', 'S'],
    ['P', 'P', 'R'],
    ['S', 'S', 'R'],
    ['R', 'R', 'S'],
    ['R', 'R', 'P'],
    ['S', 'P', 'P'],
    ['S', 'R', 'R'],
    ['S', 'P', 'S'],
    ['R', 'S', 'R'],
    ['P', 'R', 'P'],
  ];

  if (allBetItems.length < 3) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const lastThreeMoves = allBetItems.slice(-3).map((item) => item.rps);
  let matchedPattern = null;
  let matchedPatternIndex = -1;

  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    if (
      pattern.length >= lastThreeMoves.length &&
      pattern
        .slice(0, lastThreeMoves.length)
        .every((move, index) => move === lastThreeMoves[index])
    ) {
      matchedPattern = pattern;
      matchedPatternIndex = i;
      break;
    }
  }

  if (matchedPattern) {
    let continuationCount = 0;
    const patternLength = matchedPattern.length;

    for (let i = allBetItems.length - patternLength; i >= 0; i--) {
      const previousMoves = allBetItems
        .slice(i, i + patternLength)
        .map((item) => item.rps);
      if (
        previousMoves.length === patternLength &&
        previousMoves.every((move, index) => move === matchedPattern[index])
      ) {
        continuationCount++;
      }
    }

    const maxContinuation = 4;

    if (continuationCount >= maxContinuation) {
      const movesNotInPattern = ['R', 'P', 'S'].filter(
        (move) => !matchedPattern.includes(move),
      );
      return movesNotInPattern[
        Math.floor(Math.random() * movesNotInPattern.length)
      ];
    }

    const nextMoveIndex = lastThreeMoves.length % patternLength;
    return matchedPattern[nextMoveIndex];
  } else {
    const randomMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomMove;
  }
}

async function predictNextOpenAI(rps_list) {
  if (!rps_list || rps_list.length === 0) {
    const randomChoice = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomChoice;
  }

  const userMovesString = rps_list.map((item) => item.rps).join(' ');

  const systemMessage = {
    role: 'system',
    content:
      'You are an expert at predicting Rock-Paper-Scissors moves. Respond only with R, P, or S.',
  };

  const userPrompt = {
    role: 'user',
    content: `The user's past moves are: ${userMovesString}. c their next move. Valid answers: R, P, or S.`,
  };

  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userPrompt],
      max_tokens: 10,
      temperature: 0.5,
    });

    let predictedMove = response.data.choices[0].message.content
      .trim()
      .toUpperCase();

    if (!['R', 'P', 'S'].includes(predictedMove)) {
      predictedMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    }

    return predictedMove;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);

    const randomChoice = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomChoice;
  }
}

module.exports = {
  predictNext,
  calcWinChance,
  reinforcementAI,
  patternBasedAI,
  counterSwitchAI,
  NPC,
  skillissueold,
  innovate,
  counterRandomness,
  martingaleStrategy,
  generatePattern,
  getRandomMove,
  predictNextOpenAI,
};
