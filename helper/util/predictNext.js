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
  const smoothingFactor = 0.3;

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
  const deviationThreshold = 0.45;
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

async function predictNextOpenAI(rps_list, user_prompt = '') {
  function getRandomRPS() {
    const moves = ['R', 'P', 'S'];
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // If there's no history, return random.
  if (!rps_list || rps_list.length === 0) {
    console.log('No historic data. Returning a random R/P/S.');
    return getRandomRPS();
  }

  // Assume rps_list is in chronological order (earliest → latest).
  const opMoves = rps_list.map(item => item.joiner_rps);
  const userMoves = rps_list.map(item => item.rps);
  const lastUserMove = userMoves[userMoves.length - 1];
  const lastOppMove = opMoves[opMoves.length - 1];

  // Define a list of strategies with regex patterns and corresponding actions.
  const strategies = [
    {
      // Explicit move: e.g. "play move R"
      pattern: /play\s+move\s+([rps])/i,
      action: (match) => {
        const move = match[1].toUpperCase();
        console.log('User prompt: "play move X". Parsed move:', move);
        return move;
      }
    },
    {
      // Mirror the last opponent move.
      pattern: /mirror.*opponent/i,
      action: () => {
        console.log('User prompt: "mirror the last opponent move".');
        return ['R', 'P', 'S'].includes(lastOppMove) ? lastOppMove : getRandomRPS();
      }
    },
    {
      // Beat the last opponent move.
      pattern: /beat.*opponent/i,
      action: () => {
        console.log('User prompt: "beat the last opponent move".');
        if (!['R', 'P', 'S'].includes(lastOppMove)) return getRandomRPS();
        return lastOppMove === 'R' ? 'P'
             : lastOppMove === 'P' ? 'S'
             : 'R';
      }
    },
    {
      // Lose to the last opponent move.
      pattern: /lose.*opponent/i,
      action: () => {
        console.log('User prompt: "lose to the last opponent move".');
        if (!['R', 'P', 'S'].includes(lastOppMove)) return getRandomRPS();
        return lastOppMove === 'R' ? 'S'
             : lastOppMove === 'P' ? 'R'
             : 'P';
      }
    },
    {
      // Rotate moves: e.g., R → P → S → R.
      pattern: /rotate.*moves/i,
      action: () => {
        console.log('User prompt: "rotate moves R->P->S".');
        if (!['R', 'P', 'S'].includes(lastUserMove)) return 'R';
        return lastUserMove === 'R' ? 'P'
             : lastUserMove === 'P' ? 'S'
             : 'R';
      }
    },
    {
      // Alternate between R and P.
      pattern: /alternate.*(?:r).*?(?:p)|alternate.*(?:p).*?(?:r)/i,
      action: () => {
        console.log('User prompt: "alternate between R and P".');
        if (lastUserMove === 'R') return 'P';
        if (lastUserMove === 'P') return 'R';
        return 'R'; // Fallback if last move is S or undefined.
      }
    },
    {
      // Repeat the same move (e.g., "play/repeat the same move").
      pattern: /(play|repeat).*same move/i,
      action: () => {
        console.log('User prompt: "repeat the same move".');
        if (!['R', 'P', 'S'].includes(lastUserMove)) return getRandomRPS();
        console.log('Repeating last move:', lastUserMove);
        return lastUserMove;
      }
    },
    {
      // Play the most frequent opponent move.
      pattern: /most\s+frequent.*opponent/i,
      action: () => {
        console.log('User prompt: "play the most frequent opponent move".');
        const freq = { R: 0, P: 0, S: 0 };
        opMoves.forEach(move => { if (freq.hasOwnProperty(move)) freq[move]++; });
        let bestMove = 'R';
        let maxCount = freq['R'];
        ['P', 'S'].forEach(m => {
          if (freq[m] > maxCount) {
            bestMove = m;
            maxCount = freq[m];
          }
        });
        console.log(`Opponent frequencies: R=${freq.R}, P=${freq.P}, S=${freq.S}. Using ${bestMove}.`);
        return bestMove;
      }
    },
    {
      // Play the least frequent opponent move.
      pattern: /least\s+frequent.*opponent/i,
      action: () => {
        console.log('User prompt: "play the least frequent opponent move".');
        const freq = { R: 0, P: 0, S: 0 };
        opMoves.forEach(move => { if (freq.hasOwnProperty(move)) freq[move]++; });
        let worstMove = 'R';
        let minCount = freq['R'];
        ['P', 'S'].forEach(m => {
          if (freq[m] < minCount) {
            worstMove = m;
            minCount = freq[m];
          }
        });
        console.log(`Opponent frequencies: R=${freq.R}, P=${freq.P}, S=${freq.S}. Using ${worstMove}.`);
        return worstMove;
      }
    },
    {
      // Play in proportion to how often the opponent has used each move.
      pattern: /in\s+proportion/i,
      action: () => {
        console.log('User prompt: "play in proportion to opponent frequencies".');
        const freq = { R: 0, P: 0, S: 0 };
        opMoves.forEach(move => { if (freq.hasOwnProperty(move)) freq[move]++; });
        const sum = freq.R + freq.P + freq.S;
        if (sum === 0) return getRandomRPS();
        const r = Math.random() * sum;
        if (r < freq.R) return 'R';
        if (r < freq.R + freq.P) return 'P';
        return 'S';
      }
    },
    {
      // Play the second most frequent opponent move.
      pattern: /second\s+most\s+frequent/i,
      action: () => {
        console.log('User prompt: "play the second most frequent opponent move".');
        const freq = { R: 0, P: 0, S: 0 };
        opMoves.forEach(move => { if (freq.hasOwnProperty(move)) freq[move]++; });
        const sorted = Object.entries(freq)
          .map(([move, count]) => ({ move, count }))
          .sort((a, b) => b.count - a.count);
        if (sorted.length < 2) return sorted[0]?.move || getRandomRPS();
        return sorted[1].move;
      }
    },
    {
      // Catch-all: if the prompt contains "random" anywhere.
      pattern: /random/i,
      action: () => {
        console.log('User prompt: "random" detected. Returning random R/P/S.');
        return getRandomRPS();
      }
    }
  ];

  // Iterate over the strategies (in order) and use the first one that matches.
  for (const { pattern, action } of strategies) {
    const match = user_prompt.match(pattern);
    if (match) {
      return action(match);
    }
  }

  // If no strategy matched, fall back to calling the OpenAI API.
  console.log('No custom strategy matched. Falling back to OpenAI GPT.');

  const opMovesString = opMoves.join(' ');
  const userMovesString = userMoves.join(' ');
  const systemMessage = {
    role: 'system',
    content:
      `You are playing Rock-Paper-Scissors. The opponent's past moves are: ${opMovesString}, while your previous moves are: ${userMovesString}. Respond only with R, P, or S.`,
  };

  const userMessage = {
    role: 'user',
    content: `Don't remember previous interactions. ${user_prompt}.`,
  };

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      max_tokens: 10,
      temperature: 1.0,
      n: 3,
    });

    let predictedMove = response.choices?.[0]?.message?.content?.trim()?.toUpperCase();
    console.log('OpenAI raw response:', predictedMove);

    if (!['R', 'P', 'S'].includes(predictedMove)) {
      predictedMove = getRandomRPS();
    }

    return predictedMove;
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getRandomRPS();
  }
}


module.exports = {
  predictNext,
  calcWinChance,
  reinforcementAI,
  predictNextOpenAI,
};
