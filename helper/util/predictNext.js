const tf = require('@tensorflow/tfjs-node');
// Model utilities
const { trainModel, predictNextMove } = require('./modelUtils');

// NOTE: This import matches the structure of the package you have installed (4.8.0).
//       It exposes a class called OpenAI that extends APIClient, with Chat, etc.
const { OpenAI } = require('openai');

// Instead of Configuration/OpenAIApi, we create an instance of OpenAI directly:
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

function getBeatingType(currentState) {
  const random = Math.random();

  if (currentState === 'R') {
    return random < 0.95 ? 'P' : 'R';
  } else if (currentState === 'P') {
    return random < 0.95 ? 'S' : 'P';
  } else {
    return random < 0.95 ? 'R' : 'S';
  }
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

// UPDATED: use the .Chat.Completions.create(...) method instead of createChatCompletion(...)
async function predictNextOpenAI(rps_list, user_prompt = '') {
  if (!rps_list || rps_list.length === 0) {
    const randomChoice = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    return randomChoice;
  }

  console.log('----userprompt----', user_prompt);
  const userMovesString = rps_list.map((item) => item.rps).join(' ');

  const systemMessage = {
    role: 'system',
    content:
      'You are an expert at predicting Rock-Paper-Scissors moves. Respond only with R, P, or S.',
  };

  const userPrompt = {
    role: 'user',
    content: `${user_prompt}. The user's past moves are: ${userMovesString}. Predict their next move. Valid answers: R, P, or S.`,
  };

  try {
    // Here is the key difference: openai.Chat.Completions.create(...)
    // instead of openai.createChatCompletion(...)
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userPrompt],
      max_tokens: 10,
      temperature: 0.5,
    });
    let predictedMove = response.choices?.[0]?.message?.content
      ?.trim()
      ?.toUpperCase();

    console.log('------------openai: ', predictedMove);

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
  counterRandomness,
  predictNextOpenAI,
};
