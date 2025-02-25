// modelUtils.js

const tf = require('@tensorflow/tfjs-node');

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
  await model.fit(rpsTensor, joinerRPSTensor, { epochs: 30, verbose: 0, batch_size: 32 });

  // Dispose of tensors
  rpsTensor.dispose();
  joinerRPSTensor.dispose();

  return model;
}

// Function to make predictions using the trained model
async function predictNextMove(model, rpsNumeric) {
  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const prediction = model.predict(rpsTensor);
  const probabilities = prediction.dataSync(); // Get the array of probabilities
  const nextJoinerRPSNumeric = tf.argMax(prediction, 1).dataSync()[0]; // Specify axis as 1

  // Dispose of tensors
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

  // Introduce 33% chance of returning a random move
  if (Math.random() < 0.43) {
    const randomMoveIndex = Math.floor(Math.random() * 3);
    bestCounterMove = randomMoveIndex === 0 ? 'R' : randomMoveIndex === 1 ? 'P' : 'S';
  } else {
    // Redefine bestCounterMove based on joiner_rps
    if (nextJoinerRPS === 'R') bestCounterMove = Math.random() < 0.5 ? 'P' : 'R';
    else if (nextJoinerRPS === 'P') bestCounterMove = Math.random() < 0.5 ? 'P' : 'S';
    else bestCounterMove = Math.random() < 0.5 ? 'R' : 'S';
  }

  return { move: bestCounterMove, risk: risk };
}


async function trainModel_qs(rpsNumeric, joinerRPSNumeric, qs_game_type) {
  if (!qs_game_type || typeof qs_game_type !== 'number' || qs_game_type <= 0) {
    throw new Error(`Invalid qs_game_type: ${qs_game_type}`);
  }

  const rpsTensor = tf.tensor2d(rpsNumeric, [rpsNumeric.length, 1]);
  const joinerRPSTensor = tf.tensor1d(joinerRPSNumeric);

  // Define a smaller neural network model
  const model = tf.sequential();
  model.add(tf.layers.dense({ units: 32, inputShape: [1], activation: 'relu' }));
  model.add(tf.layers.dense({ units: qs_game_type, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.1), // Higher learning rate for quicker adaptation
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  // Train the model with the recent data
  await model.fit(rpsTensor, joinerRPSTensor, {
    epochs: 10,
    verbose: 0,
    batch_size: Math.max(1, rpsNumeric.length), // Handle small batch sizes
    callbacks: {
      onEpochEnd: async (epoch, logs) => {
        // console.log(`Epoch ${epoch}: loss = ${logs.loss}, accuracy = ${logs.acc}`);
      }
    }
  });

  // Dispose of tensors
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

  let risk;
  if (predictionData[nextJoinerRPSNumeric] > 0.55) {
    risk = 3;
  } else if (predictionData[nextJoinerRPSNumeric] > 0.5) {
    risk = 2;
  } else {
    risk = 1;
  }

  rpsTensor.dispose();

  return { move: nextJoinerRPSNumeric, risk: risk };
}


module.exports = {
  trainModel,
  predictNextMove,
  predictNextMove_qs,
  trainModel_qs,

};