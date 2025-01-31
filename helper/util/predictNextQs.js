const tf = require('@tensorflow/tfjs-node');
const { trainModel_qs, predictNextMove_qs } = require('./modelUtils');

// IMPORTANT: For openai@4.8.0
const { OpenAI } = require('openai');

// Instantiate the OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const calcWinChanceQs = (gameType, rounds) => {
  let probWin = 100 / gameType;
  let probLose = 100 - probWin;

  const freq = {};
  for (let i = 0; i < gameType; i++) {
    freq[i] = 0;
  }

  rounds.forEach((round) => {
    freq[Number(round.qs)]++;
  });

  const freqValues = Object.values(freq);
  const range = Math.max(...freqValues) - Math.min(...freqValues);

  const sensitivityFactor = (range / 100) * gameType;
  const adjustmentFactor = (range / gameType) * sensitivityFactor;
  probWin = (probWin - adjustmentFactor).toFixed(2);
  probLose = (probLose + adjustmentFactor).toFixed(2);

  return `${probWin}% - ${probLose}%`;
};

const predictNextQs = (qs_list, gameType) => {
  if (typeof gameType !== 'number' || gameType <= 0) {
    throw new Error('Invalid gameType. It must be a positive integer.');
  }

  if (qs_list.length < 4) {
    return getRandomItem_qs(gameType);
  }

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
    const fromState1 = Number(qs_list[i].qs);
    const fromState2 = Number(qs_list[i + 1].qs);
    const fromState3 = Number(qs_list[i + 2].qs);
    const toState = Number(qs_list[i + 3].qs);

    transitionMatrix[fromState1][fromState2][fromState3][toState]++;
  }

  Object.keys(transitionMatrix).forEach((fromState1) => {
    Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach(
        (fromState3) => {
          const totalTransitions = Object.values(
            transitionMatrix[fromState1][fromState2][fromState3],
          ).reduce((a, b) => a + b, 0);
          if (totalTransitions > 0) {
            Object.keys(
              transitionMatrix[fromState1][fromState2][fromState3],
            ).forEach((toState) => {
              transitionMatrix[fromState1][fromState2][fromState3][toState] /=
                totalTransitions;
            });
          }
        },
      );
    });
  });

  const winChance = calcWinChanceQs(gameType, qs_list);
  const targetProbability = 100 / gameType;
  const deviation = Math.abs(winChance - targetProbability);

  let currentState1 = Number(qs_list[qs_list.length - 3]?.qs);
  let currentState2 = Number(qs_list[qs_list.length - 2]?.qs);
  let currentState3 = Number(qs_list[qs_list.length - 1]?.qs);

  if (
    currentState1 === undefined ||
    currentState2 === undefined ||
    currentState3 === undefined
  ) {
    throw new Error(
      'Insufficient data in qs_list to determine current states.',
    );
  }

  const weightedOptions = [];
  if (
    transitionMatrix[currentState1] &&
    transitionMatrix[currentState1][currentState2] &&
    transitionMatrix[currentState1][currentState2][currentState3]
  ) {
    Object.entries(
      transitionMatrix[currentState1][currentState2][currentState3],
    ).forEach(([state, prob]) => {
      for (let i = 0; i < Math.floor(prob * 100); i++) {
        weightedOptions.push(Number(state));
      }
    });
  }

  let nextState;
  if (weightedOptions.length > 0) {
    nextState =
      weightedOptions[Math.floor(Math.random() * weightedOptions.length)];
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

  if (data.length <= 3) {
    return { move: getRandomItem_qs(qs_game_type), risk: 0 };
  }

  const historicData = data.slice(-30);
  const qsNumeric = historicData.map((entry) => parseInt(entry.qs, 10));
  const joinerRPSNumeric = historicData.map((entry) =>
    parseInt(entry.joiner_qs, 10),
  );

  const results = historicData.map((entry) => ({
    qs: entry.qs,
    joiner_qs: entry.joiner_qs,
    win: entry.qs !== entry.joiner_qs,
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
  const winChangesLikely =
    winChanges.length > 0
      ? winChanges.filter((change) => change).length / winChanges.length
      : 0;
  const lossChangesLikely =
    lossChanges.length > 0
      ? lossChanges.filter((change) => change).length / lossChanges.length
      : 0;

  let model;
  try {
    // Train the model with historical data
    model = await trainModel_qs(qsNumeric, joinerRPSNumeric, qs_game_type);

    let bestCounterMove = {};
    const mostRecentGame = results[results.length - 1];

    // Introduce randomness to avoid overfitting
    const randomnessFactor = 0.1;
    if (Math.random() < randomnessFactor) {
      bestCounterMove.move = getRandomItem_qs(qs_game_type);
      bestCounterMove.risk = 0;
    } else if (mostRecentGame.win) {
      // If recent game was a win
      if (winChangesLikely > 0.4) {
        // Predict next move based on the model
        bestCounterMove = await predictNextMove_qs(
          model,
          joinerRPSNumeric,
          qs_game_type,
        );
      } else {
        // Repeat the same move as the most recent game
        bestCounterMove.move = mostRecentGame.joiner_qs;
        bestCounterMove.risk = 1;
      }
    } else {
      // If recent game was a loss
      if (lossChangesLikely > 0.4) {
        bestCounterMove = await predictNextMove_qs(
          model,
          joinerRPSNumeric,
          qs_game_type,
        );
      } else {
        bestCounterMove.move = mostRecentGame.joiner_qs;
        bestCounterMove.risk = 1;
      }
    }
    return bestCounterMove;
  } finally {
    if (model) {
      model.dispose();
    }
  }
}

function innovate_qs(historicData, qs_game_type) {
  let nextState = {};
  const firstEntries = historicData.slice(-6);
  const firstJoinerQs = firstEntries.map((entry) => parseInt(entry.qs, 10));

  if (firstJoinerQs.length < 6 || firstJoinerQs.some(isNaN)) {
    nextState.move = getRandomItem_qs(qs_game_type);
    nextState.risk = 1;
    return nextState;
  }

  const allSame = firstJoinerQs.every((qs) => qs === firstJoinerQs[0]);
  if (allSame) {
    const lastMove = firstJoinerQs[0];
    const possibleMoves = Array.from(
      { length: qs_game_type },
      (_, i) => i,
    ).filter((move) => move !== lastMove);
    nextState.move = getRandomItem_qs(qs_game_type, possibleMoves);
    nextState.risk = 3;
  } else {
    const previousMove = parseInt(historicData[historicData.length - 1].qs, 10);
    nextState.move = previousMove;
    nextState.risk = 1;
  }
  return nextState;
}

function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

function patternBasedAI_qs(historicData, qs_game_type) {
  if (historicData.length <= 3) {
    return getRandomItem_qs(qs_game_type);
  }
  const opponentMoves = historicData.map((item) => item.joiner_qs);
  const moveCounts = Array(qs_game_type).fill(0);

  opponentMoves.slice(-10).forEach((move) => {
    moveCounts[move]++;
  });

  const mostFrequentMove = moveCounts.indexOf(Math.max(...moveCounts));
  const nextMove = (mostFrequentMove + 1) % qs_game_type;
  return nextMove;
}

function counterSwitchAI_qs(historicData, qs_game_type) {
  if (historicData.length > 0) {
    const lastGame = historicData[historicData.length - 1];

    const lastGameWasWin = lastGame.qs === lastGame.joiner_qs;
    const lastGameWasLoss = lastGame.qs !== lastGame.joiner_qs;

    if (lastGameWasWin) {
      // Always repeat if win
      const repeatProbability = 1;
      if (Math.random() < repeatProbability) {
        return parseInt(lastGame.qs, 10);
      }
    } else if (lastGameWasLoss) {
      // Switch to the next move if loss
      return (parseInt(lastGame.qs, 10) + 1) % qs_game_type;
    }
  }
  // Fallback
  return getRandomItem_qs(qs_game_type);
}

function counterRandomness_qs(historicData, qs_game_type) {
  if (!historicData || historicData.length === 0) {
    return getRandomItem_qs(qs_game_type);
  }
  return getRandomItem_qs(qs_game_type);
}

function NPC_qs(historicData) {
  const lastMove =
    historicData.length > 0 ? historicData[historicData.length - 1].qs : 0;
  return lastMove;
}

function martingaleStrategy_qs(historicData, qs_game_type) {
  if (historicData.length === 0) {
    const randomMove = getRandomItem_qs(qs_game_type);
    return {
      move: randomMove,
      lastResult: null,
    };
  }

  const lastOpponentMove = historicData[historicData.length - 1].qs;
  const lastAIMove = historicData[historicData.length - 1].joiner_qs;
  const lastResult = getResult(lastAIMove, lastOpponentMove);

  const randomMove = getRandomItem_qs(qs_game_type);
  return {
    move: randomMove,
    lastResult: lastResult,
  };
}

function getResult(aiMove, opponentMove) {
  // Simple logic: if they match, it's a 'loss', else 'win'
  if (aiMove === opponentMove) {
    return 'loss';
  } else {
    return 'win';
  }
}

function generatePattern_qs(allBetItems, qs_game_type) {
  if (allBetItems.length <= 3) {
    return getRandomItem_qs(qs_game_type);
  }
  const patterns = [];
  for (let i = 0; i < qs_game_type; i++) {
    for (let j = 0; j < qs_game_type; j++) {
      if (i !== j) {
        patterns.push([i, j]);
      }
    }
  }
  const lastTwoMoves = allBetItems
    .slice(0, 2)
    .map((item) => parseInt(item.qs, 10));

  let matchedPattern = null;
  for (const pattern of patterns) {
    if (
      (pattern[0] === lastTwoMoves[0] && pattern[1] === lastTwoMoves[1]) ||
      (pattern[1] === lastTwoMoves[0] && pattern[0] === lastTwoMoves[1])
    ) {
      matchedPattern = pattern;
      break;
    }
  }

  if (matchedPattern) {
    let continuationCount = 0;
    for (let i = 2; i < allBetItems.length; i++) {
      if (
        (parseInt(allBetItems[i - 1].qs, 10) === matchedPattern[0] &&
          parseInt(allBetItems[i].qs, 10) === matchedPattern[1]) ||
        (parseInt(allBetItems[i - 1].qs, 10) === matchedPattern[1] &&
          parseInt(allBetItems[i].qs, 10) === matchedPattern[0])
      ) {
        continuationCount++;
      } else {
        break;
      }
    }
    const maxContinuation = Math.floor(Math.random() * 4) + 2;

    if (continuationCount > maxContinuation) {
      const movesNotInPattern = Array.from(
        { length: qs_game_type },
        (_, i) => i,
      ).filter((move) => !matchedPattern.includes(move));
      const randomMove =
        movesNotInPattern[Math.floor(Math.random() * movesNotInPattern.length)];
      return randomMove;
    }
    return parseInt(allBetItems[1].qs, 10);
  } else {
    const eef = getRandomItem_qs(qs_game_type);
    return eef;
  }
}

function getCopyCatItem_qs(allBetItems, qs_game_type) {
  const copyCatBetItem = [...allBetItems]
    .reverse()
    .find((item) => item.joiner_qs !== undefined);
  if (copyCatBetItem) {
    if (copyCatBetItem.qs && copyCatBetItem.qs.trim() !== '') {
      return copyCatBetItem.joiner_qs;
    }
  }
  const randomItem_qs = getRandomItem_qs(qs_game_type);
  return randomItem_qs;
}

function skillissueold_qs(historicData, qs_game_type) {
  const dataLength = qs_game_type + 3;
  if (historicData.length < 3) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  const moveCounts = Array(qs_game_type).fill(0);
  const recentMoves = historicData
    .slice(0, dataLength)
    .map((move) => parseInt(move.qs, 10))
    .filter((move) => !Number.isNaN(move) && move >= 0 && move < qs_game_type);

  if (recentMoves.length < dataLength) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  }

  recentMoves.forEach((move) => {
    moveCounts[move]++;
  });

  const leastPlayedMove = getLeastPlayedMove(moveCounts);
  const lastTwoMoves = getLastMoves(historicData, 4);
  const lastThreeMoves = getLastMoves(historicData, 3);

  const availableMoves = Array.from(
    { length: qs_game_type },
    (_, i) => i,
  ).filter((move) => move !== leastPlayedMove);

  if (Number.isNaN(leastPlayedMove)) {
    return { counterMove: getRandomItem_qs(qs_game_type), risk: 1 };
  } else if (!lastTwoMoves.includes(leastPlayedMove)) {
    return {
      counterMove: getRandomItem_qs(qs_game_type, availableMoves),
      risk: 3,
    };
  } else if (!lastThreeMoves.includes(leastPlayedMove)) {
    return {
      counterMove: getRandomItem_qs(qs_game_type, availableMoves),
      risk: 2,
    };
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
  return historicData
    .slice(0, n)
    .map((move) => parseInt(move.joiner_qs, 10))
    .filter((move) => !Number.isNaN(move));
}

// UPDATED: use the .Chat.Completions.create(...) method
async function openAIPredictionAI_qs(historicData, qs_game_type) {
  if (!historicData || historicData.length === 0) {
    return getRandomItem_qs(qs_game_type);
  }

  const userMoves = historicData.map((item) => item.joiner_qs);
  const userMovesString = userMoves.join(', ');
  const messages = [
    {
      role: 'system',
      content: `You are an expert AI that predicts the user's next Quick Shoot move. Respond only with a single integer between 0 and ${qs_game_type - 1}).`,
    },
    {
      role: 'user',
      content: `The user's past moves are: ${userMovesString}. There are ${qs_game_type} possible moves (0 through ${
        qs_game_type - 1
      }). Predict the user's next move as an integer.`,
    },
  ];

  try {
    // Instead of openai.createChatCompletion, use openai.Chat.Completions.create
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      max_tokens: 10,
      temperature: 0.5,
    });

    // The new library returns { choices: [ { message: { content: '...' } } ] }
    let predictedMoveStr = response.choices?.[0]?.message?.content?.trim();
    let predictedMove = parseInt(predictedMoveStr, 10);

    if (
      isNaN(predictedMove) ||
      predictedMove < 0 ||
      predictedMove >= qs_game_type
    ) {
      predictedMove = getRandomItem_qs(qs_game_type);
    }

    const nextMove = (predictedMove + 1) % qs_game_type;
    return nextMove;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getRandomItem_qs(qs_game_type);
  }
}

module.exports = {
  predictNextQs,
  reinforcementAI_qs,
  getRandomItem_qs,
  openAIPredictionAI_qs,
};
