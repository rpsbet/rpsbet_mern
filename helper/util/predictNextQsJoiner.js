const tf = require('@tensorflow/tfjs-node');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  const filteredQsList = qs_list.filter(
    (item) => item.qs !== null && item.qs !== '',
  );

  if (filteredQsList.length < 3) {
    return options[Math.floor(Math.random() * gameType)];
  }

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

  // Populate transition matrix
  for (let i = 0; i < filteredQsList.length - 3; i++) {
    transitionMatrix[filteredQsList[i].qs][filteredQsList[i + 1].qs][
      filteredQsList[i + 2].qs
    ][filteredQsList[i + 3].qs]++;
  }

  // Normalize transition matrix
  Object.keys(transitionMatrix).forEach((fromState1) => {
    Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach(
        (fromState3) => {
          const totalTransitions = Object.values(
            transitionMatrix[fromState1][fromState2][fromState3],
          ).reduce((a, b) => a + b, 0);
          Object.keys(
            transitionMatrix[fromState1][fromState2][fromState3],
          ).forEach((toState) => {
            if (totalTransitions > 0) {
              transitionMatrix[fromState1][fromState2][fromState3][toState] /=
                totalTransitions;
            }
          });
        },
      );
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

  Object.keys(
    transitionMatrix[currentState1][currentState2][currentState3],
  ).forEach((state) => {
    if (
      transitionMatrix[currentState1][currentState2][currentState3][state] >
      maxProb
    ) {
      maxProb =
        transitionMatrix[currentState1][currentState2][currentState3][state];
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
    callbacks: {
      onEpochEnd: async (epoch, logs) => {},
    },
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
  if (
    predictionData[nextJoinerRPSNumeric] > 0.4 &&
    predictionData[nextJoinerRPSNumeric] <= 0.7
  ) {
    risk = 3;
  } else if (predictionData[nextJoinerRPSNumeric] > 0.7) {
    risk = 4;
  } else if (predictionData[nextJoinerRPSNumeric] > 0.2) {
    risk = 2;
  } else {
    risk = 1;
  }

  return { move: nextJoinerRPSNumeric, risk };
}

async function reinforcementAI_qs(data, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  if (data.length === 0) {
    return { move: getRandomItem_qs(qs_game_type), risk: 0 };
  }

  const historicData = data.reverse().slice(0, 20);
  const qsNumeric = historicData.map((entry) => parseInt(entry.qs, 10));
  const joinerRPSNumeric = historicData.map((entry) =>
    parseInt(entry.joiner_qs, 10),
  );

  const results = historicData.map((entry) => ({
    qs: entry.qs,
    joiner_qs: entry.joiner_qs,
    win: entry.qs !== entry.joiner_qs,
  }));

  const recentGamesAnalysis = results.slice(1).map((current, i) => {
    const previous = results[i];
    return {
      win: previous.win,
      joinerChanged: current.joiner_qs !== previous.joiner_qs,
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

  const winChangesLikely = winChangePattern.winChanges.every((change) => change);
  const lossChangesLikely = winChangePattern.lossChanges.every(
    (change) => change
  );

  let model;
  try {
    model = await trainModel_qs(joinerRPSNumeric, qsNumeric, qs_game_type);

    let bestCounterMove = await predictNextMove_qs(model, qsNumeric, qs_game_type);

    // Introduce some randomness
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

function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}


module.exports = {
  reinforcementAI_qs,
  predictNextMove_qs,
  getRandomItem_qs,
  predictNextQs,
};