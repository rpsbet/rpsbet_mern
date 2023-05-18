const predictNextBj = (bj_list) => {
    // Create a transition matrix to store the probability of transitioning from one state to another
  const transitionMatrix = {
    R: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    P: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    S: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
  };

  // Iterate through the previous states to populate the transition matrix
  for (let i = 0; i < bj_list.length - 3; i++) {
    transitionMatrix[bj_list[i].bj][bj_list[i + 1].bj][bj_list[i + 2].bj][bj_list[i + 3].bj]++;
  }

  // Normalize the transition matrix
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

// Check for consistency
const winChance = calcWinChance(bj_list);
let deviation = 0;
if (winChance !== "33.33%") {
    deviation = (1 - (1 / 3)) / 2;
}
// Use the transition matrix to predict the next state based on the current state
let currentState1 = bj_list[bj_list.length - 3].bj;
let currentState2 = bj_list[bj_list.length - 2].bj;
let currentState3 = bj_list[bj_list.length - 1].bj;
let nextState = currentState3;
let maxProb = 0;
Object.keys(transitionMatrix[currentState1][currentState2][currentState3]).forEach((state) => {
  if (transitionMatrix[currentState1][currentState2][currentState3][state] > maxProb) {
    maxProb = transitionMatrix[currentState1][currentState2][currentState3][state];
    nextState = state;
  }
});

// Add randomness
let randomNum = Math.random();
if (randomNum < deviation) {
  let randomState = '';
  do {
      randomNum = Math.random();
      if (randomNum < (1 / 3)) {
          randomState = 'R';
      } else if (randomNum < (2 / 3)) {
          randomState = 'P';
      } else {
          randomState = 'S';
      }
  } while (randomState === currentState3);
  nextState = randomState;
}
return nextState;
  }
  
  const calcWinChance = (bj_list) => {
    let total = bj_list.length;
    let rock = 0;
    let paper = 0;
    let scissors = 0;
    bj_list.map((el) => {
      if (el.bj === "R") {
        rock++;
      } else if (el.bj === "P") {
        paper++;
      } else if (el.bj === "S") {
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
      return lowest.toFixed(2) + "%";
    }
    return lowest.toFixed(2) + "% - " + highest.toFixed(2) + "%";
  }
  
  module.exports = {
    predictNextBj,
    calcWinChance
  }
  