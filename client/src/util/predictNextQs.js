import * as tf from '@tensorflow/tfjs';
import axios from '../util/Api';

// 1) CALCULATE WIN CHANCE (unchanged)
export const calcWinChanceQs = (gameType, rounds) => {
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

// 2) PREDICT NEXT QS (Markov approach)
export async function predictNextQs(qs_list, gameType) {
  // This function now returns an object { move, risk }

  // Our possible QS states = [0, 1, 2, ..., gameType-1]
  const options = [...Array(gameType).keys()];

  // Filter out invalid data
  const filteredQsList = qs_list.filter(
    (item) => item.qs !== null && item.qs !== '',
  );

  // If not enough data, return random
  if (filteredQsList.length < 3) {
    return { move: randomIntExcluding(options), risk: 1 };
  }

  // Build a 4-dimensional Markov transition matrix
  const transitionMatrix = {};
  options.forEach((o1) => {
    transitionMatrix[o1] = {};
    options.forEach((o2) => {
      transitionMatrix[o1][o2] = {};
      options.forEach((o3) => {
        transitionMatrix[o1][o2][o3] = {};
        options.forEach((o4) => {
          transitionMatrix[o1][o2][o3][o4] = 0;
        });
      });
    });
  });

  // Populate from the last 3 states => the next state
  for (let i = 0; i < filteredQsList.length - 3; i++) {
    const s1 = parseInt(filteredQsList[i].qs, 10);
    const s2 = parseInt(filteredQsList[i + 1].qs, 10);
    const s3 = parseInt(filteredQsList[i + 2].qs, 10);
    const s4 = parseInt(filteredQsList[i + 3].qs, 10);

    transitionMatrix[s1][s2][s3][s4]++;
  }

  // Normalize
  options.forEach((o1) => {
    options.forEach((o2) => {
      options.forEach((o3) => {
        const row = transitionMatrix[o1][o2][o3];
        const total = Object.values(row).reduce((a, b) => a + b, 0);
        if (total > 0) {
          Object.keys(row).forEach((o4) => {
            row[o4] = row[o4] / total;
          });
        }
      });
    });
  });

  // Calculate the "win chance" just for minor deviation
  const winChance = calcWinChanceQs(gameType, filteredQsList);
  let deviation = 0;
  if (winChance !== '33.33%') {
    deviation = (1 - 1 / gameType) / 10;
  }

  // We look at the last 3 QS states
  let currentState1 = parseInt(
    filteredQsList[filteredQsList.length - 3].qs,
    10,
  );
  let currentState2 = parseInt(
    filteredQsList[filteredQsList.length - 2].qs,
    10,
  );
  let currentState3 = parseInt(
    filteredQsList[filteredQsList.length - 1].qs,
    10,
  );

  let maxProb = 0;
  let nextState = currentState3;

  // find the best nextState
  Object.keys(
    transitionMatrix[currentState1][currentState2][currentState3],
  ).forEach((s4) => {
    const p = transitionMatrix[currentState1][currentState2][currentState3][s4];
    if (p > maxProb) {
      maxProb = p;
      nextState = parseInt(s4, 10);
    }
  });

  // Possibly deviate randomly
  if (Math.random() < deviation) {
    const possibleMoves = [...options];
    // Exclude the predicted move from random?
    const idx = possibleMoves.indexOf(nextState);
    if (idx !== -1) {
      possibleMoves.splice(idx, 1);
    }
    nextState = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];

    // If we forced a random override, reduce confidence
    maxProb = 0.25;
  }

  // Map maxProb => risk 1..4
  const risk = mapProbabilityToRisk(maxProb);

  return { move: nextState, risk };
}

// Helper function to map probability => risk
function mapProbabilityToRisk(prob) {
  /*
   Example mapping:
   prob <= 0.25 => risk = 1
   0.25 < prob <= 0.5 => risk = 2
   0.5 < prob <= 0.75 => risk = 3
   0.75 < prob <= 1.0 => risk = 4
  */
  if (prob <= 0.6) return 1;
  else if (prob <= 0.7) return 2;
  else if (prob <= 0.8) return 3;
  else return 4;
}

// Return a random integer from an array
function randomIntExcluding(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function trainModel_qs(rpsNumeric, joinerRPSNumeric, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  const model = tf.sequential();
  model.add(
    tf.layers.dense({ units: 32, inputShape: [1], activation: 'relu' }),
  );
  model.add(tf.layers.dense({ units: qs_game_type, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.1),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy'],
  });

  await model.fit(rpsTensor, joinerRPSTensor, {
    epochs: 10,
    verbose: 0,
    batch_size: Math.max(1, rpsNumeric.length),
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

  // Dispose
  rpsTensor.dispose();
  prediction.dispose();

  // Map probability => risk
  const prob = predictionData[nextJoinerRPSNumeric];
  let risk = mapProbabilityToRisk(prob);

  return { move: nextJoinerRPSNumeric, risk };
}

// 3) REINFORCEMENT AI QS
export async function reinforcementAI_qs(data, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  // if no data => random
  if (data.length === 0) {
    return { move: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  // Take the last 20 items
  const historicData = [...data].reverse().slice(0, 20);

  const qsNumeric = historicData.map((entry) => parseInt(entry.qs, 10));
  const joinerRPSNumeric = historicData.map((entry) =>
    parseInt(entry.joiner_qs, 10),
  );

  // Some simple analysis
  const results = historicData.map((entry) => ({
    qs: entry.qs,
    joiner_qs: entry.joiner_qs,
    win: entry.qs !== entry.joiner_qs, // Qs => if they differ, "win"
  }));

  // We'll train a small model
  let model;
  try {
    model = await trainModel_qs(joinerRPSNumeric, qsNumeric, qs_game_type);
    // Predict next move
    let bestCounterMove = await predictNextMove_qs(
      model,
      qsNumeric,
      qs_game_type,
    );

    // small chance to randomize anyway
    const randomnessFactor = 0.1;
    if (Math.random() < randomnessFactor) {
      const possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
      // remove predicted
      const idx = possibleMoves.indexOf(bestCounterMove.move);
      if (idx > -1) {
        possibleMoves.splice(idx, 1);
      }
      bestCounterMove.move = getRandomItem_qs(qs_game_type, possibleMoves);

      // If random override => risk is lower
      bestCounterMove.risk = 1;
    }

    return bestCounterMove;
  } finally {
    if (model) {
      model.dispose();
    }
  }
}

export function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}
export const predictQuickNextByGPT = async (roomId, qs_game_type, user_id) => {
  try {
    const res = await axios.get(
      `/game/predictQuickNextByGPT/${roomId}/${user_id}`,
    );
    if (res.data.success) {
      return { move: res.data.data, risk: 2 };
    } else {
      return { move: getRandomItem_qs(qs_game_type), risk: 2 };
    }
  } catch (e) {
    console.log(e);
    return { move: getRandomItem_qs(qs_game_type), risk: 2 };
  }
};
