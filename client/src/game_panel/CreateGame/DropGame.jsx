import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import {
  alertModal
} from '../modal/ConfirmAlerts';
// const calcBetAmount = rps_list => {
//   let bet_amount = 0;
//   rps_list.map((el, i) => {
//     bet_amount += el.bet_amount;
//   });
//   return bet_amount;
// };

const calcWinChance = (prevStates) => {
  let total = prevStates.length;
  let rock = 0;
  let paper = 0;
  let scissors = 0;
  prevStates.map((el) => {
    if (el.rps === "R") {
      rock++;
    } else if (el.rps === "P") {
      paper++;
    } else if (el.rps === "S") {
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
};

const predictNext = (prevStates, rps_list) => {
  // Create a transition matrix to store the probability of transitioning from one state to another
  const transitionMatrix = {
    R: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    P: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    S: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
  };

  // Iterate through the previous states to populate the transition matrix
  for (let i = 0; i < prevStates.length - 3; i++) {
    transitionMatrix[prevStates[i].rps][prevStates[i + 1].rps][prevStates[i + 2].rps][prevStates[i + 3].rps]++;
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
const winChance = calcWinChance(rps_list);
let deviation = 0;
if (winChance !== "33.33%") {
    deviation = (1 - (1 / 3)) / 2;
}
// Use the transition matrix to predict the next state based on the current state
let currentState1 = prevStates[prevStates.length - 3].rps;
let currentState2 = prevStates[prevStates.length - 2].rps;
let currentState3 = prevStates[prevStates.length - 1].rps;
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



class RPS extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_rps: '',
      bet_amount: 5.00,
      winChance: 33,
      // is_other: (this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25 || this.props.bet_amount === 50 || this.props.bet_amount === 100) ? 'hidden' : '',

      transitionMatrix: {
        R: { R: 0, P: 0, S: 0 },
        P: { R: 0, P: 0, S: 0 },
        S: { R: 0, P: 0, S: 0 }
    },
    autoplay: false

    };
    this.onChangeBetAmount = this.onChangeBetAmount.bind(this);

  }

  onAutoPlay = () => {
    
    if(this.props.rps_list.length > 2){
      const prevStates = this.props.rps_list;
      const nextRPS = predictNext(prevStates, this.props.rps_list);
      this.onAddRun(nextRPS);

    }else {
      alertModal(this.props.isDarkMode, 'MINIMUM 3 RUNS, TO MAKE A PREDICTION!!!');
      return;
    }
   
  };


  


  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
    // this.props.onChangeState({ winChance });
  };

 
  

  onRemoveItem = index => {
    const newArray = this.props.rps_list.filter((elem, i) => i != index);
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      // bet_amount: bet_amount,
      // max_return: bet_amount * 2 /* 0.95 */,
      winChance: winChance
    });

  };


  onAddRun = (selected_rps) => {
    this.setState({ selected_rps: selected_rps });
    const newArray = JSON.parse(JSON.stringify(this.props.rps_list));
    newArray.push({
      rps: selected_rps
      // bet_amount: selected_bet_amount,
      // pr: selected_bet_amount * 2
    });
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      // bet_amount: bet_amount,
      // max_return: bet_amount * 2, /* 0.95 */
      winChance: winChance
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
    // this.updateTransitionMatrix();


  };

  componentDidUpdate(prevProps) {
    if (prevProps.rps_list !== this.props.rps_list) {
         //move this line after updating the state and the DOM
         const lastRow = document.querySelector("#runs tr:last-child");
         lastRow.scrollIntoView({block: "end", behavior: "smooth", top: -200});
    }
  }


  handleAutoplayChange = () => {
    this.setState(prevState => ({
      autoplay: !prevState.autoplay
    }));
  };
  onChangeBetAmount = new_state => {
    this.setState({ bet_amount: new_state.selected_bet_amount });
  };
  render() {
    
    const defaultBetAmounts = [5, 10, 25, 50, 100];

    return this.props.step === 1 ? (
      
      <div className="game-info-panel">
        {/* <h3 className="game-sub-title">Bankroll</h3> */}
        <DefaultBetAmountPanel
              bet_amount={this.props.bet_amount}
              onChangeState={this.props.onChangeState}
              game_type="RPS"
              defaultBetAmounts={defaultBetAmounts}
            />
        {/* <div id="rps-game-type-radio">
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
      </div> */}
      </div>
    ) : (
      <div className="game-info-panel">
        <div className="rps-add-run-panel">
        <div className="rps-add-run-form">
           
            <h3 className="game-sub-title">
              Select: Rock - Paper - Scissors!{' '}
            </h3>
            <div id="rps-radio">
              <span
                className={
                  'rock' + (this.state.selected_rps === 'R' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('R');
                  const currentActive = document.querySelector(".active");
                  currentActive.style.animation = "none";
                  void currentActive.offsetWidth;
                  currentActive.style.animation = "pulse 0.2s ease-in-out ";
                }}
              ></span>
              <span
                className={
                  'paper' + (this.state.selected_rps === 'P' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('P');
                  const currentActive = document.querySelector(".active");
                  currentActive.style.animation = "none";
                  void currentActive.offsetWidth;
                  currentActive.style.animation = "pulse 0.2s ease-in-out ";
                }}
              ></span>
              <span
                className={
                  'scissors' +
                  (this.state.selected_rps === 'S' ? ' active' : '')
                }
                onClick={() => {
                  this.onAddRun('S');
                  const currentActive = document.querySelector(".active");
                  currentActive.style.animation = "none";
                  void currentActive.offsetWidth;
                  currentActive.style.animation = "pulse 0.2s ease-in-out ";
                }}
              ></span>
            </div>
            <button onClick={this.onAutoPlay}>Test Autoplay</button>
            <label>AUTOPLAY <input type="checkbox" onChange={()=>this.setState({autoplay: !this.state.autoplay})} />
</label>

          </div>
          <div className="rps-add-run-table">
            <h3 className="game-sub-title">Runs</h3>
            <table>
              <thead>
                <tr>
                  <th>POS</th>
                  <th>RPS</th>
                  {/* <th>BET / PR</th> */}
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
                      {/* <td>{`${rps.bet_amount}/${rps.pr}`}</td> */}
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

const mapStateToProps = state => ({
  
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,

});

export default connect(mapStateToProps)(RPS);
