import * as tf from '@tensorflow/tfjs';
import axios from '../util/Api';
export const predictNext = (rps_list, markov = false) => {
  console.log('calllllled');
  console.log('rps_list', rps_list);

  const choices = ['R', 'P', 'S'];
  const smoothingFactor = 0.1; // Smoothing factor to avoid zero probabilities

  if (rps_list.length <= 1) {
    // Not enough data, return random
    const randomMove = choices[Math.floor(Math.random() * 3)];
    return { move: randomMove, risk: 1 };
  }

  // Randomly select a subset for the transition matrix
  const subsetSize = Math.min(rps_list.length - 1, 10);
  const startIndex = Math.floor(Math.random() * (rps_list.length - subsetSize));
  const subset = rps_list.slice(startIndex, startIndex + subsetSize);

  // Markov model transition matrix
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

  // Convert counts to probabilities with smoothing
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
      // If no transitions, default to uniform
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] = 1 / 3;
      });
    }
  });

  // Predict next state from the last observed state
  const currentState = rps_list[rps_list.length - 1].rps;
  let nextState = currentState;
  let maxProb = 0;

  // find the state with highest probability
  Object.keys(transitionMatrix[currentState]).forEach((possible) => {
    const prob = transitionMatrix[currentState][possible];
    if (prob > maxProb) {
      maxProb = prob;
      nextState = possible;
    }
  });

  // If we passed markov=true => we pick the "beating" move
  if (markov) {
    nextState = getBeatingType(nextState);
  }

  // Introduce random deviation
  const deviationThreshold = 0.05;
  if (Math.random() < deviationThreshold) {
    let randomState;
    do {
      randomState = choices[Math.floor(Math.random() * 3)];
    } while (randomState === currentState);
    nextState = randomState;
    // If we randomize, we should also lower our confidence
    // because we intentionally deviated from the Markov guess
    maxProb = 0.25; // or something low
  }

  // Map maxProb => risk (1..4)
  const risk = mapProbabilityToRisk(maxProb);

  console.log('predictNext =>', { move: nextState, risk });
  return { move: nextState, risk };
};

// function that maps the Markov's best probability => risk 1..4
function mapProbabilityToRisk(prob) {
  /*
    Example mapping:
    prob <= 0.25 => risk = 1
    0.25 < prob <= 0.50 => risk = 2
    0.50 < prob <= 0.75 => risk = 3
    0.75 < prob <= 1.0 => risk = 4
  */
  if (prob <= 0.6) return 1;
  else if (prob <= 0.7) return 2;
  else if (prob <= 0.8) return 3;
  else return 4;
}

// If Markov mode is on => we choose a "beating" move for the nextState
const getBeatingType = (currentState) => {
  const random = Math.random();
  if (currentState === 'R') {
    // 'P' beats 'R' but let's add small chance to pick same
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

  // Define the neural network model
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 128, inputShape: [1], activation: 'relu' }),
  );
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
  await model.fit(rpsTensor, joinerRPSTensor, {
    epochs: 30,
    verbose: 0,
    batch_size: 32,
  });

  // Dispose of tensors
  rpsTensor.dispose();
  joinerRPSTensor.dispose();

  return model;
}

async function predictNextMove(model, rpsNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);
  const probabilities = prediction.dataSync();
  const nextJoinerRPSNumeric = tf.argMax(prediction, 1).dataSync()[0];

  // Dispose of tensors
  rpsTensor.dispose();

  let nextJoinerRPS;
  if (nextJoinerRPSNumeric === 0) nextJoinerRPS = 'R';
  else if (nextJoinerRPSNumeric === 1) nextJoinerRPS = 'P';
  else nextJoinerRPS = 'S';

  let risk;

  risk = mapProbabilityToRisk(probabilities[nextJoinerRPSNumeric]);

  let bestCounterMove;

  // Introduce 33% chance of returning a random move
  if (Math.random() < 0.33) {
    const randomMoveIndex = Math.floor(Math.random() * 3);
    bestCounterMove =
      randomMoveIndex === 0 ? 'R' : randomMoveIndex === 1 ? 'P' : 'S';
  } else {
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

// Main function to handle reinforcement learning with dynamic adaptation mechanism
export async function reinforcementAI(data) {
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

export const predictNextByGPT = async (roomId, user_id) => {
  try {
    const res = await axios.get(
      `/game/predictRPSNextByGPT/${roomId}/${user_id}`,
    );
    if (res.data.success) {
      return { move: res.data.data, risk: 2 };
    } else {
      return { move: 'R', risk: 2 };
    }
  } catch (e) {
    consol.log(e);
    return { move: 'R', risk: 2 };
  }
};
