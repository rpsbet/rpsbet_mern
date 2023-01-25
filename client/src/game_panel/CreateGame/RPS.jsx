import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';

const calcBetAmount = rps_list => {
  let bet_amount = 0;
  rps_list.map((el, i) => {
    bet_amount += el.bet_amount;
  });
  return bet_amount;
};

const calcWinChance = (rps_list) => {
  let total = 0;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  rps_list.map((el, i) => {
  total ++;
  if(el.rps === 'R'){
  rock ++;
  } else if(el.rps === 'P'){
  paper ++;
  } else if(el.rps === 'S'){
  scissors ++;
  }
  });
  const rockWinChance = (rock / total) * 100;
  const paperWinChance = (paper / total) * 100;
  const scissorsWinChance = (scissors / total) * 100;
  let lowest = rockWinChance;
  let highest = rockWinChance;
  if(paperWinChance < lowest){
  lowest = paperWinChance;
  }
  if(scissorsWinChance < lowest){
  lowest = scissorsWinChance;
  }
  if(paperWinChance > highest){
  highest = paperWinChance;
  }
  if(scissorsWinChance > highest){
  highest = scissorsWinChance;
  }
  if(lowest === highest) {
  return (lowest.toFixed(2) + '%');
  }
  return (lowest.toFixed(2) + '% - ' + highest.toFixed(2) + '%');
  }

  const predictNext = (prevStates, randomness = 0.5, deviationThreshold = 5) => {
    // Create a transition matrix to store the probability of transitioning from one state to another
    const transitionMatrix = {
      R: { R: 0, P: 0, S: 0 },
      P: { R: 0, P: 0, S: 0 },
      S: { R: 0, P: 0, S: 0 },
    };
  
    // Iterate through the previous states to populate the transition matrix
    for (let i = 0; i < prevStates.length - 1; i++) {
      transitionMatrix[prevStates[i].rps][prevStates[i + 1].rps]++;
    }
  
    // Normalize the transition matrix
    Object.keys(transitionMatrix).forEach((fromState) => {
      const totalTransitions = Object.values(transitionMatrix[fromState]).reduce((a, b) => a + b);
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] /= totalTransitions;
      });
    });
  
    // Use the transition matrix to predict the next state based on the current state
    let currentState = prevStates[prevStates.length - 1].rps;
    let nextState = currentState;
  
    // Calculate the average win chance of the predictions
    let totalPredictions = 0;
    let totalWinChance = 0;
    Object.keys(transitionMatrix[currentState]).forEach((state) => {
      totalPredictions++;
      totalWinChance += transitionMatrix[currentState][state];
    });
    const averageWinChance = totalWinChance / totalPredictions;
  
    // Generate a random number between 0 and 1
    let randomNum = Math.random();
    if (randomNum < randomness) {
      // Randomly select a state from all possible states
      nextState = Object.keys(transitionMatrix)[Math.floor(Math.random() * 3)];
    } else {
      // Get the probabilities of transitioning to each state
      const probabilities = transitionMatrix[currentState];
      // Check if there is a state with a probability of 0 or 100%
      const isCertain = Object.values(probabilities).some((p) => p === 0 || p === 1);
      if (isCertain) {
        // If there is a state with a probability of 0 or 100%, calculate the count for each R, P and S in the rps_list
        let total = 0;
        let rock = 0;
        let paper = 0;
        let scissors = 0;
        prevStates.map((el, i) => {
          total++;
          if (el.rps === "R") {
            rock++;
          } else if (el.rps === "P") {
            paper++;
          } else if (el.rps === "S") {
            scissors++;
          }
        });
        // Calculate the probability of each occurring next
        const rockProbability = rock / total;
        const paperProbability = paper / total;
        const scissorsProbability = scissors / total;
      // Generate a random number between 0 and 1
      const randomProb = Math.random();
      if (randomProb < rockProbability) {
        nextState = "R";
      } else if (randomProb < rockProbability + paperProbability) {
        nextState = "P";
      } else {
        nextState = "S";
      }
    } else {
      // Check if the deviation of the average win chance from the predictions is too high
      const deviation = Math.abs(averageWinChance - (1 / totalPredictions));
      if (deviation > deviationThreshold) {
        // Increase the probability of the other selections to balance the average win chance
        const adjustment = (1 / totalPredictions - averageWinChance) / (totalPredictions - 1);
        Object.keys(probabilities).forEach((state) => {
          if (state !== currentState) {
            probabilities[state] += adjustment;
          }
        });
      }
      // Randomly select a state based on the probabilities in the transition matrix
      const randomProb = Math.random();
      let probSum = 0;
      Object.keys(probabilities).forEach((state) => {
        probSum += probabilities[state];
        if (randomProb <= probSum) {
          nextState = state;
          return;
        }
      });
    }
  }
  return nextState;
};
  



class RPS extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_rps: 'R',
      selected_bet_amount: 5,
      winChance: 33,
      transitionMatrix: {
        R: { R: 0, P: 0, S: 0 },
        P: { R: 0, P: 0, S: 0 },
        S: { R: 0, P: 0, S: 0 }
    }

    };
  }

  onAutoPlay = () => {
    
    const prevStates = this.props.rps_list;
    const nextRPS = predictNext(prevStates);
    const { winChance } = this.state;
    const averageWinChance = {
      R: winChance.substring(0, winChance.indexOf('%')) / 100,
      P: winChance.substring(winChance.indexOf('-') + 1, winChance.lastIndexOf('%')) / 100,
      S: winChance.substring(winChance.lastIndexOf('-') + 1, winChance.length - 1) / 100,
    };
    let transitionMatrix = {
      R: { R: 0, P: 0, S: 0 },
      P: { R: 0, P: 0, S: 0 },
      S: { R: 0, P: 0, S: 0 },
    };
    let threshold = 0.99; // the threshold value, can be adjusted
    let maxChance = Math.max(...Object.values(averageWinChance));
    // Normalize the transition matrix
    Object.keys(transitionMatrix).forEach((fromState) => {
      const totalTransitions = Object.values(transitionMatrix[fromState]).reduce((a, b) => a + b);
      Object.keys(transitionMatrix[fromState]).forEach((toState) => {
        transitionMatrix[fromState][toState] /= totalTransitions;
      });
    });
    this.setState({transitionMatrix});
    if (Math.abs(averageWinChance[nextRPS] - maxChance) > threshold) {
      maxChance = 0;
      Object.keys(averageWinChance).forEach((key) => {
        if (Math.abs(averageWinChance[nextRPS] - maxChance) > threshold) {
          // Randomize the next move
          nextRPS = Object.keys(averageWinChance)[Math.floor(Math.random() * Object.keys(averageWinChance).length)];
        }
      });
    }
    this.onAddRun(nextRPS, this.state.selected_bet_amount);
    this.updateTransitionMatrix();

  };


  


  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
    // this.props.onChangeState({ winChance });
    // console.log('New Win Chance...', this.state.winChance)
  };

  onChangeBetAmount = new_state => {
    this.setState({ selected_bet_amount: new_state.bet_amount });
  };
  

  onRemoveItem = index => {
    const newArray = this.props.rps_list.filter((elem, i) => i != index);
    const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      bet_amount: bet_amount,
      max_return: bet_amount * 2 /* 0.95 */,
      winChance: winChance
    });
    this.updateTransitionMatrix();

  };

  updateTransitionMatrix = () => {
    // Count the number of transitions between each state
    const rps_list = this.props.rps_list;
    for (let i = 0; i < rps_list.length - 1; i++) {
        const current = rps_list[i].rps;
        const next = rps_list[i + 1].rps;
        this.state.transitionMatrix[current][next]++;
    }
    // Calculate the transition probabilities
    let totalTransitions = rps_list.length - 1;
    Object.keys(this.state.transitionMatrix).forEach((key) => {
        Object.keys(this.state.transitionMatrix[key]).forEach((subKey) => {
            this.state.transitionMatrix[key][subKey] /= totalTransitions;
        });
    });
};

  onAddRun = (selected_rps, selected_bet_amount) => {
    this.setState({ selected_rps: selected_rps, selected_bet_amount: selected_bet_amount });
    const newArray = JSON.parse(JSON.stringify(this.props.rps_list));
    newArray.push({
      rps: selected_rps,
      bet_amount: selected_bet_amount,
      pr: selected_bet_amount * 2
    });
    const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      bet_amount: bet_amount,
      max_return: bet_amount * 2, /* 0.95 */
      winChance: winChance
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
    this.updateTransitionMatrix();


  };

  componentDidUpdate(prevProps) {
    if (prevProps.rps_list !== this.props.rps_list) {
         //move this line after updating the state and the DOM
         const lastRow = document.querySelector("#runs tr:last-child");
         lastRow.scrollIntoView({block: "end", behavior: "smooth", top: -200});
    }
  }



  render() {
    
    const defaultBetAmounts = [5, 10];
    const defaultBankrollAmounts = [300, 400, 500];

    return this.props.step === 1 ? (
      
      <div className="game-info-panel">
        <h3 className="game-sub-title">Game type</h3>
        <div id="rps-game-type-radio">
        <span
          className={this.props.rps_game_type === 0 ? ' active' : ''}
          onClick={() => {
            this.props.onChangeState({ rps_game_type: 0 });
          }}
        >
          Fixed
        </span>
        <span 
          className={(this.props.rps_game_type === 1 ? 'disabled' : '')}
          onClick={() => {
            if(this.props.rps_game_type !== 1) {
              this.props.onChangeState({rps_game_type: 1});
            }
          }}>
          Freeplay
        </span>
      </div>
      </div>
    ) : (
      <div className="game-info-panel">
        <div className="rps-add-run-panel">
        <div className="rps-add-run-form">
            <DefaultBetAmountPanel
              bet_amount={this.state.selected_bet_amount}
              onChangeState={this.onChangeBetAmount}
              game_type="RPS"
              defaultBetAmounts={defaultBetAmounts}
            />
            <h3 className="game-sub-title">
              Select: Rock - Paper - Scissors!{' '}
            </h3>
            <div id="rps-radio">
              <span
                className={
                  'rock' + (this.state.selected_rps === 'R' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('R', this.state.selected_bet_amount);
                }}
              ></span>
              <span
                className={
                  'paper' + (this.state.selected_rps === 'P' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('P', this.state.selected_bet_amount);
                }}
              ></span>
              <span
                className={
                  'scissors' +
                  (this.state.selected_rps === 'S' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('S', this.state.selected_bet_amount);
                }}
              ></span>
            </div>
            <button onClick={this.onAutoPlay}> Autoplay</button>

          </div>
          <div className="rps-add-run-table">
            <h3 className="game-sub-title">Runs</h3>
            <table>
              <thead>
                <tr>
                  <th>POS</th>
                  <th>RPS</th>
                  <th>BET / PR</th>
                  <th></th>
                </tr>
              </thead>
              </table>
            <table id="runs">
              <tbody>
                {this.props.rps_list && this.props.rps_list.length > 0 ? (
                  this.props.rps_list.map((rps, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{rps.rps}</td>
                      <td>{`${rps.bet_amount}/${rps.pr}`}</td>
                      <td>
                        <HighlightOffIcon
                          onClick={() => this.onRemoveItem(index)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td id="add-run" colSpan="4">Please add a run</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default RPS;