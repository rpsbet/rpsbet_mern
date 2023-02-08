

const predictNextQs = (qs_list, gameType) => {
    const options = [...Array(gameType).keys()];
    const transitionMatrix = {};
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
  
    for (let i = 0; i < qs_list.length - 3; i++) {
      transitionMatrix[qs_list[i].qs][qs_list[i + 1].qs][qs_list[i + 2].qs][qs_list[i + 3].qs]++;
    }
  
    Object.keys(transitionMatrix).forEach((fromState1) => {
      Object.keys(transitionMatrix[fromState1]).forEach((fromState2) => {
        Object.keys(transitionMatrix[fromState1][fromState2]).forEach((fromState3) => {
          const totalTransitions = Object.values(transitionMatrix[fromState1][fromState2][fromState3]).reduce((a, b) => a + b);
          Object.keys(transitionMatrix[fromState1][fromState2][fromState3]).forEach((toState) => {
            transitionMatrix[fromState1][fromState2][fromState3][toState] /= totalTransitions;
          });
        });
      });
    });
  
    const winChance = calcWinChanceQs(gameType, qs_list);
    let deviation = 0;
    if (winChance !== "33.33%") {
        deviation = (1 - (1 / gameType)) / 2;
    }
  
    let currentState1 = qs_list[qs_list.length - 3].qs;
    let currentState2 = qs_list[qs_list.length - 2].qs;
    let currentState3 = qs_list[qs_list.length - 1].qs;
    let nextState = currentState3;
    let maxProb = 0;
    Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
      if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
        maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
        nextState = state;
      }
    });
  
    let randomNum = Math.random();
    if (randomNum < deviation) {
      let randomState = '';
      do {
          randomNum = Math.random();
          randomState = options[Math.floor(randomNum * gameType)];
      } while (randomState === nextState);
      nextState = randomState;
    }
  
    return nextState;
  }
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
  