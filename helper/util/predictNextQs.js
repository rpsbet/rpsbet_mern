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
  const randomnessFactor = 0.3;

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
    const randomnessFactor = 0.3;
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


function getRandomItem_qs(qs_game_type, possibleMoves = null) {
  if (!possibleMoves) {
    possibleMoves = Array.from({ length: qs_game_type }, (_, i) => i);
  }
  return possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
}

async function openAIPredictionAI_qs(
  historicData,
  qs_game_type,
  user_prompt = '',
  isUser = false
) {
  // Helper: get a random move (an integer between 0 and qs_game_type-1)
  function getRandomItem_qs(count) {
    return Math.floor(Math.random() * count);
  }

  // Helper: do a weighted random pick from an array of frequencies.
  // freq[i] = weight for move i.
  function weightedRandom(freq) {
    const sum = freq.reduce((a, b) => a + b, 0);
    if (sum === 0) return getRandomItem_qs(freq.length);
    let r = Math.random() * sum;
    for (let i = 0; i < freq.length; i++) {
      if (r < freq[i]) return i;
      r -= freq[i];
    }
    return freq.length - 1; // fallback if numerical error
  }

  // Early bailout if no historic data
  if (!historicData || historicData.length === 0) {
    return getRandomItem_qs(qs_game_type);
  }

  // Reverse the order so that the most recent move is at index 0.
  const userMoves = (
    isUser
      ? historicData.map((item) => item.joiner_qs)
      : historicData.map((item) => item.qs)
  ).reverse();
  const opMoves = (
    isUser
      ? historicData.map((item) => item.qs)
      : historicData.map((item) => item.joiner_qs)
  ).reverse();

  const userMovesString = userMoves.join(', ');
  const opMovesString = opMoves.join(', ');

  // We'll use the raw prompt (with regex /i flag) for matching.
  const prompt = user_prompt;

  // Define a prioritized list of strategies.
  const strategies = [
    // 1) "play randomly" – catches phrases like "play randomly", "return randomly", etc.
    {
      pattern: /random/i,
      action: () => {
        return getRandomItem_qs(qs_game_type);
      }
    },
    // 2) "play the same move over and over" (or "repeat the same move")
    {
      pattern: /(play|repeat).*same move/i,
      action: () => {
        let lastAIMove = isUser ? opMoves[0] : userMoves[0];
        lastAIMove = parseInt(lastAIMove, 10);
        if (isNaN(lastAIMove)) {
          return getRandomItem_qs(qs_game_type);
        }
        return lastAIMove;
      }
    },
    // 3) "alternate between 0 and 1"
    {
      pattern: /alternate\s+between\s+0\s+and\s+1/i,
      action: () => {
        let lastAIMove = isUser ? opMoves[0] : userMoves[0];
        lastAIMove = parseInt(lastAIMove, 10);
        if (isNaN(lastAIMove)) lastAIMove = 0;
        return lastAIMove === 0 ? 1 : 0;
      }
    },
    // 4) "play move X" – e.g. "play move 2"
    {
      pattern: /play\s+move\s+(\d+)/i,
      action: (match) => {
        const moveNum = parseInt(match[1], 10);
        if (!isNaN(moveNum) && moveNum >= 0 && moveNum < qs_game_type) {
          return moveNum;
        }
        return getRandomItem_qs(qs_game_type);
      }
    },
    // 5) "rotate through all moves"
    {
      pattern: /rotate.*moves/i,
      action: () => {
        let lastAIMove = isUser ? opMoves[0] : userMoves[0];
        lastAIMove = parseInt(lastAIMove, 10);
        if (isNaN(lastAIMove)) lastAIMove = -1;
        return (lastAIMove + 1) % qs_game_type;
      }
    },
    // 6) "mirror the last opponent move"
    {
      pattern: /mirror.*last.*opponent.*move/i,
      action: () => {
        let lastOppMove = parseInt(opMoves[0], 10);
        if (isNaN(lastOppMove)) return getRandomItem_qs(qs_game_type);
        return lastOppMove;
      }
    },
    // 7) "mirror the last ai move" (or "mirror the last your move")
    {
      pattern: /mirror.*last.*(ai|your).*move/i,
      action: () => {
        let lastAIMove = isUser ? opMoves[0] : userMoves[0];
        lastAIMove = parseInt(lastAIMove, 10);
        if (isNaN(lastAIMove)) return getRandomItem_qs(qs_game_type);
        return lastAIMove;
      }
    },
    // 8) "play the most frequent opponent move"
    {
      pattern: /most\s+frequent.*opponent.*move/i,
      action: () => {
        const freq = new Array(qs_game_type).fill(0);
        opMoves.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num >= 0 && num < qs_game_type) {
            freq[num]++;
          }
        });
        let bestMove = 0, maxCount = -1;
        for (let i = 0; i < qs_game_type; i++) {
          if (freq[i] > maxCount) {
            maxCount = freq[i];
            bestMove = i;
          }
        }
        return bestMove;
      }
    },
    // 9) "play the least frequent opponent move"
    {
      pattern: /least\s+frequent.*opponent.*move/i,
      action: () => {
        const freq = new Array(qs_game_type).fill(0);
        opMoves.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num >= 0 && num < qs_game_type) {
            freq[num]++;
          }
        });
        let leastMove = 0, minCount = Infinity;
        for (let i = 0; i < qs_game_type; i++) {
          if (freq[i] < minCount) {
            minCount = freq[i];
            leastMove = i;
          }
        }
        return leastMove;
      }
    },
    // 10) "always beat the last opponent move"
    {
      pattern: /always\s+beat.*last.*opponent.*move/i,
      action: () => {
        let lastOppMove = parseInt(opMoves[0], 10);
        if (isNaN(lastOppMove)) return getRandomItem_qs(qs_game_type);
        return (lastOppMove + 1) % qs_game_type;
      }
    },
    // 11) "always lose to the last opponent move"
    {
      pattern: /always\s+lose.*last.*opponent.*move/i,
      action: () => {
        let lastOppMove = parseInt(opMoves[0], 10);
        if (isNaN(lastOppMove)) return getRandomItem_qs(qs_game_type);
        return (lastOppMove - 1 + qs_game_type) % qs_game_type;
      }
    },
    // 12) "play in proportion to the frequency of the opponent's moves"
    {
      pattern: /play.*in\s+proportion.*opponent/i,
      action: () => {
        const freq = new Array(qs_game_type).fill(0);
        opMoves.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num >= 0 && num < qs_game_type) {
            freq[num]++;
          }
        });
        return weightedRandom(freq);
      }
    },
    // 13) "play the second most frequent opponent move"
    {
      pattern: /second\s+most\s+frequent/i,
      action: () => {
        const freq = new Array(qs_game_type).fill(0);
        opMoves.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num >= 0 && num < qs_game_type) {
            freq[num]++;
          }
        });
        const sorted = freq
          .map((count, idx) => ({ move: idx, count }))
          .sort((a, b) => b.count - a.count);
        if (sorted.length < 2) return sorted[0]?.move || getRandomItem_qs(qs_game_type);
        return sorted[1].move;
      }
    },
    // 14) "play the second least frequent opponent move"
    {
      pattern: /second\s+least\s+frequent/i,
      action: () => {
        const freq = new Array(qs_game_type).fill(0);
        opMoves.forEach((m) => {
          const num = parseInt(m, 10);
          if (!isNaN(num) && num >= 0 && num < qs_game_type) {
            freq[num]++;
          }
        });
        const sorted = freq
          .map((count, idx) => ({ move: idx, count }))
          .sort((a, b) => a.count - b.count);
        if (sorted.length < 2) return sorted[0]?.move || getRandomItem_qs(qs_game_type);
        return sorted[1].move;
      }
    }
  ];

  // Iterate over strategies and use the first one that matches.
  for (const { pattern, action } of strategies) {
    const match = prompt.match(pattern);
    if (match) {
      return action(match);
    }
  }

  // If no custom strategy matched, fall back to calling OpenAI.
  console.log('No custom strategy matched. Falling back to OpenAI API.');

  const messages = [
    {
      role: 'system',
      content: `Respond only with a single integer between 0 and ${qs_game_type - 1}.`
    },
    {
      role: 'user',
      content: `${user_prompt}. Your past moves are: ${userMovesString} whilst your opponent's past moves are: ${opMovesString}. There are ${qs_game_type} possible moves (0 through ${qs_game_type - 1}).`
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: messages,
      temperature: 1.0,
      max_tokens: 5,
      top_p: 1.0,
      n: 1,
      stop: ['\n'],
    });

    const predictedMoveStr = response.choices?.[0]?.message?.content?.trim();
    let predictedMove = parseInt(predictedMoveStr, 10);
    if (isNaN(predictedMove) || predictedMove < 0 || predictedMove >= qs_game_type) {
      predictedMove = getRandomItem_qs(qs_game_type);
    }
    return predictedMove;
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
