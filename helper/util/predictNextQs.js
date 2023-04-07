

const predictNextQs = (qs_list, gameType) => {
  const options = [...Array(gameType).keys()];
  const transitionMatrix = {};
  const randomnessFactor = 0.15; // Adjust this value to control the level of randomness

  options.forEach(option1 => {
    transitionMatrix[option1] = {};
    options.forEach(option2 => {
      transitionMatrix[option1][option2] = {};
      options.forEach(option3 => {
        transitionMatrix[option1][option2][option3] = {};
        options.forEach(option4 => {
          transitionMatrix[option1][option2][option3][option4] = 0;
        });
      });
    });
  });

  // Count transitions
  for (let i = 0; i < qs_list.length - 3; i++) {
    transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
  }

  // Normalize transition probabilities
  Object.keys(transitionMatrix).forEach(fromState1 => {
    Object.keys(transitionMatrix[fromState1]).forEach(fromState2 => {
      Object.keys(transitionMatrix[fromState1][fromState2]).forEach(fromState3 => {
        const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
        Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach(toState => {
          transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
        });
      });
    });
  });

  // Calculate winChance and deviation
  const winChance = this.calcWinChance(gameType, qs_list);
  const targetProbability = 100 / gameType;
  const deviation = Math.abs(winChance - targetProbability);

  // Choose next state based on transition probabilities and deviation
  let currentState1 = qs_list[qs_list.length - 3].qs;
  let currentState2 = qs_list[qs_list.length - 2].qs;
  let currentState3 = qs_list[qs_list.length - 1].qs;

  // Weighted random choice based on transition probabilities
  const weightedOptions = [];
  Object.entries(transitionMatrix[currentState1][currentState2][currentState3]).forEach(([state, prob]) => {
    for (let i = 0; i < Math.floor(prob * 100); i++) {
      weightedOptions.push(state);
    }
  });

  let nextState;
  if (weightedOptions.length > 0) {
    nextState = weightedOptions[Math.floor(Math.random() * weightedOptions.length)];
  } else {
    nextState = options[Math.floor(Math.random() * options.length)];
  }

  // Introduce randomness based on the randomnessFactor
  if (Math.random() < randomnessFactor) {
    nextState = options[Math.floor(Math.random() * options.length)];
  }

  return nextState;
};

  const  calcWinChanceQs = (gametype, rounds) => {
  let positionCounts = new Array(gametype + 1).fill(0);
  for (let i = 0; i < rounds.length; i++) {
    positionCounts[rounds[i].qs]++;

  }
  // console.log('position counts', positionCounts)
  let entropy = 0;
  for (let i = 0; i < gametype; i++) {
    if (positionCounts[i] === 0) {
      continue;
    }
    let probability = positionCounts[i] / rounds.length;
    entropy -= probability * Math.log2(probability);
  }
  // console.log('entropy', entropy)
  let winChanceMin = Math.max(0, (1 - entropy / Math.log2(gametype)) / gametype);
  let winChanceMax = Math.min(1, (1 - entropy / Math.log2(gametype)));
  winChanceMin *= 100;
  winChanceMax *= 100;
  return winChanceMin.toFixed(2) + '% - ' + winChanceMax.toFixed(2) + '%';
}

  
  module.exports = {
    predictNextQs,
    calcWinChanceQs
  }
  