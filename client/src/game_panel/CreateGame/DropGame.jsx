import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import { Button, TextField } from '@material-ui/core';

import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import {
  alertModal
} from '../modal/ConfirmAlerts';
// const calcBetAmount = drop_list => {
//   let bet_amount = 0;
//   drop_list.map((el, i) => {
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
    if (el.drop === "R") {
      rock++;
    } else if (el.drop === "P") {
      paper++;
    } else if (el.drop === "S") {
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

const predictNext = (drop_list) => {
  // console.log(drop_list);
  // Create a transition matrix to store the probability of transitioning from one state to another
  const transitionMatrix = {
    R: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    P: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
    S: { R: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, P: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } }, S: { R: { R: 0, P: 0, S: 0 }, P: { R: 0, P: 0, S: 0 }, S: { R: 0, P: 0, S: 0 } } },
  };

  // Iterate through the previous states to populate the transition matrix
  for (let i = 0; i < drop_list.length - 3; i++) {
    transitionMatrix[drop_list[i].drop][drop_list[i + 1].drop][drop_list[i + 2].drop][drop_list[i + 3].drop]++;
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
const winChance = calcWinChance(drop_list);
let deviation = 0;
if (winChance !== "33.33%") {
    deviation = (1 - (1 / 3)) / 2;
}
// Use the transition matrix to predict the next state based on the current state
let currentState1 = drop_list[drop_list.length - 3].drop;
let currentState2 = drop_list[drop_list.length - 2].drop;
let currentState3 = drop_list[drop_list.length - 1].drop;
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



class DropGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_drop: '',
      drop_amount: 10.00,
      balance: this.props.balance,
      winChance: 33,
      // is_other: (this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25 || this.props.bet_amount === 50 || this.props.bet_amount === 100) ? 'hidden' : '',

      transitionMatrix: {
        R: { R: 0, P: 0, S: 0 },
        P: { R: 0, P: 0, S: 0 },
        S: { R: 0, P: 0, S: 0 }
    },

    };
    // this.onChangeBetAmount = this.onChangeBetAmount.bind(this);

  }

    
  static getDerivedStateFromProps(props, current_state) {
    if (
      current_state.balance !== props.balance
    ) {
      return {
        ...current_state,
        balance: props.balance
      };
    }
    return null;
  }

  onAutoPlay = () => {
    
    if(this.props.drop_list.length > 2){
      const prevStates = this.props.drop_list;

      // console.log(this.props.drop_list)
      const nextDrop = predictNext(prevStates, this.props.drop_list);
      this.onAddRun(nextDrop);

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
    const newArray = this.props.drop_list.filter((elem, i) => i != index);
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      drop_list: newArray,
      // bet_amount: bet_amount,
      // max_return: bet_amount * 2 /* 0.95 */,
      winChance: winChance
    });

  };

  onAddRun = (drop_amount) => {
    this.setState({ drop_amount: drop_amount });
    const newArray = JSON.parse(JSON.stringify(this.props.drop_list));

    // Check if the drop_list is empty and if the drop_amount value exceeds this.props.bet_amount
    if (newArray.length === 0 && drop_amount > this.props.bet_amount) {
      drop_amount = this.props.bet_amount; // Set the drop_amount value to this.props.bet_amount
    }

    newArray.push({
      drop_amount: drop_amount
    });

    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      drop_list: newArray,
      winChance: winChance,
      drop_amount: this.state.drop_amount
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.drop_list !== this.props.drop_list) {
         //move this line after updating the state and the DOM
         const lastRow = document.querySelector("#runs tr:last-child");
         lastRow.scrollIntoView({block: "end", behavior: "smooth", top: -200});
    }
  }


  handlehalfxButtonClick() {
    const multipliedBetAmount = this.state.drop_amount * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState({
    drop_amount: roundedBetAmount
    }, () => {
    document.getElementById("betamount").focus();
    });
    }

  handle2xButtonClick() {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.drop_amount * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount, this.props.bet_amount);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    if (roundedBetAmount < -2330223) {
      alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
    } else {
      this.setState({
        drop_amount: roundedBetAmount
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  }

  
    handleMaxButtonClick() {
      const maxBetAmount = (this.state.balance).toFixed(2);
      this.setState({
        drop_amount: Math.min(maxBetAmount, this.props.bet_amount)
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  onChangeBetAmount = new_state => {
    this.setState({ drop_amount: new_state.selected_bet_amount });
  };
  render() {
    
    const defaultBetAmounts = [10, 25, 50, 100, 250];

    return this.props.step === 1 ? (
      
      <div className="game-info-panel">
        {/* <h3 className="game-sub-title">Bankroll</h3> */}
        <DefaultBetAmountPanel
              bet_amount={this.props.bet_amount}
              onChangeState={this.props.onChangeState}
              game_type="DropGame"
              defaultBetAmounts={defaultBetAmounts}
            />
     
      </div>
    ) : (
      <div className="game-info-panel">
        <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1>
        <div className="rps-add-run-panel">
        <div className="drop-add-run-form">
           
            <h3 className="game-sub-title">
              Drop some amounts!{' '}
            </h3>
            <div className="your-bet-amount">
              <TextField
                type="text"
                pattern="[0-9]*"
                name="betamount"
                variant="outlined"
                id="betamount"
                maxLength="9"
                value={this.state.drop_amount}
                onChange={(event) => this.setState({ drop_amount: event.target.value })}
                placeholder="BET AMOUNT"
                InputProps={{
                  endAdornment: "BUSD",
                }}
              />
              <div>
              <div className='max'>
            <Button variant="contained" color="primary" onClick={() => this.handlehalfxButtonClick()}>0.5x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handle2xButtonClick()}>2x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handleMaxButtonClick()}>Max</Button>
          </div>
              </div>
              <div className='addRun'>
              <Button 
                  onClick={() => {
                    this.onAddRun(this.state.drop_amount);

                  }}>
                    Add Run
              </Button>
              </div>
            </div>
            <Button id="aiplay" onClick={this.onAutoPlay}>Test AI Play</Button>
            {/* <label>AUTOPLAY <input type="checkbox" onChange={()=>this.setState({autoplay: !this.state.autoplay})} />
</label> */}

          </div>
          <div className="rps-add-run-table">
            <h3 className="game-sub-title">Training Data</h3>
            <table id="runs">
              <tbody>
                {this.props.drop_list && this.props.drop_list.length > 0 ? (
                  this.props.drop_list.map((drop, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{drop.drop_amount}</td>
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
  balance: state.auth.balance,
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode,

});

export default connect(mapStateToProps)(DropGame);
