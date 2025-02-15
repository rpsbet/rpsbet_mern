const tf = require('@tensorflow/tfjs-node');
const { OpenAI } = require('openai');

// Create an instance of OpenAI directly
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const predictNext = (rps_list, markov = false) => {
  const choices = ['R', 'P', 'S'];
  const smoothingFactor = 0.3;

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
    const totalTransitions = Object.values(transitionMatrix[fromState]).reduce(
      (a, b) => a + b,
      0
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

  const deviationThreshold = 0.45; // Adjusted to make randomness more impactful
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

async function trainModel(rpsNumeric, joinerRPSNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 128, inputShape: [1], activation: 'relu' })
  );
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }));

  model.compile({
    optimizer: 'adam',
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
    verbose: 0,
  });

  await model.fit(rpsTensor, joinerRPSTensor, {
    epochs: 30,
    verbose: 0,
    batch_size: 32,
  });

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
  if (
    probabilities[nextJoinerRPSNumeric] > 0.4 &&
    probabilities[nextJoinerRPSNumeric] <= 0.65
  ) {
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
    // 33% chance to pick a random move
    const randomMoveIndex = Math.floor(Math.random() * 3);
    bestCounterMove =
      randomMoveIndex === 0 ? 'R' : randomMoveIndex === 1 ? 'P' : 'S';
  } else {
    // Otherwise, choose a counter move with a 50/50 chance to deviate
    if (nextJoinerRPS === 'R')
      bestCounterMove = Math.random() < 0.5 ? 'P' : 'R';
    else if (nextJoinerRPS === 'P')
      bestCounterMove = Math.random() < 0.5 ? 'P' : 'S';
    else bestCounterMove = Math.random() < 0.5 ? 'R' : 'S';
  }

  return { move: bestCounterMove, risk: risk };
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

async function reinforcementAI(data) {
  if (data.length === 0) {
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }

  const historicData = data.slice(0, 20);
  const rpsNumeric = historicData.map((entry) =>
    entry.rps === 'R' ? 0 : entry.rps === 'P' ? 1 : 2
  );
  const joinerRPSNumeric = historicData.map((entry) =>
    entry.joiner_rps === 'R' ? 0 : entry.joiner_rps === 'P' ? 1 : 2
  );

  const results = historicData.map((entry) => ({
    rps: entry.rps,
    joiner_rps: entry.joiner_rps,
    win:
      (entry.joiner_rps === 'R' && entry.rps === 'P') ||
      (entry.joiner_rps === 'P' && entry.rps === 'S') ||
      (entry.joiner_rps === 'S' && entry.rps === 'R'),
  }));

  const recentGamesAnalysis = results.slice(1).map((current, i) => {
    const previous = results[i];
    return {
      win: previous.win,
      joinerChanged: current.rps !== previous.rps,
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
    { winChanges: [], lossChanges: [] }
  );

  const winChangesCount = winChangePattern.winChanges.filter(
    (change) => change
  ).length;
  const lossChangesCount = winChangePattern.lossChanges.filter(
    (change) => change
  ).length;
  const winCount = winChangePattern.winChanges.length;
  const lossCount = winChangePattern.lossChanges.length;

  const winChangeProbability = winCount > 0 ? winChangesCount / winCount : 0;
  const lossChangeProbability =
    lossCount > 0 ? lossChangesCount / lossCount : 0;

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

  const lastGameWasDraw = lastGame.joiner_rps === lastGame.rps;

  let model;
  try {
    model = await trainModel(rpsNumeric, joinerRPSNumeric);

    let bestCounterMove = await predictNextMove(model, rpsNumeric);

    if (lastGameWasWin || lastGameWasDraw) {
      if (!winChangesLikely) {
        bestCounterMove = {
          move: getBeatingType(lastGame.rps),
          risk: 3,
        };
      }
    } else if (lastGameWasLoss) {
      if (lossChangesLikely) {
        bestCounterMove = {
          move: getRandomMoveExcluding(lastGame.rps),
          risk: 3,
        };
      } else {
        bestCounterMove = {
          move: getBeatingType(lastGame.rps),
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

function getRandomMove() {
  const moves = ['R', 'P', 'S'];
  return moves[Math.floor(Math.random() * moves.length)];
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
    content: `The user's past moves are: ${userMovesString}. Predict their next move. Valid answers: R, P, or S.`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userPrompt],
      max_tokens: 10,
      temperature: 0.5,
    });

    let predictedMove = response.choices[0].message.content.trim().toUpperCase();

    if (!['R', 'P', 'S'].includes(predictedMove)) {
      predictedMove = ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
    }

    return predictedMove;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    // Fallback to random
    return ['R', 'P', 'S'][Math.floor(Math.random() * 3)];
  }
}

module.exports = {
  predictNext,
  predictNextMove,
  getRandomMove,
  reinforcementAI,
  predictNextOpenAI,
};