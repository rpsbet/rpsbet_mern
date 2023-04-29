import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import { Button, TextField } from '@material-ui/core';

import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import {
  alertModal
} from '../modal/ConfirmAlerts';


const calcWinChance = (prevStates) => {
  let total = prevStates.length;
  let counts = {};
  prevStates.forEach((state) => {
    if (counts[state.roll]) {
      counts[state.roll]++;
    } else {
      counts[state.roll] = 1;
    }
  });
  let lowest = Infinity;
  let highest = -Infinity;
  Object.keys(counts).forEach((key) => {
    const chance = (counts[key] / total) * 100;
    if (chance < lowest) {
      lowest = chance;
    }
    if (chance > highest) {
      highest = chance;
    }
  });
  if (lowest === highest) {
    return lowest.toFixed(2) + "%";
  }
  return lowest.toFixed(2) + "% - " + highest.toFixed(2) + "%";
};

const calcAveMultiplier = (list) => {
  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    sum += parseFloat(list[i].roll);
  }
  const average = sum / list.length;
  return parseFloat(average.toFixed(2));
};



class Roll extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_roll: '',
      bet_amount: 10.00,
      roll: 1.00,
      balance: this.props.balance,
      winChance: 33,
      aveMultiplier: 0
    };
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

  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
  };

  onChangeAveMultiplier = (aveMultiplier) => {
    this.setState({ aveMultiplier });
  };
  
  predictNext = (rollAmounts) => {
    // Find the unique values in rollAmounts
    const uniqueValues = [...new Set(rollAmounts.map(roll => roll.roll))];
  
    if (uniqueValues.length === 1) {
      // If there is only one unique value, return that value
      return uniqueValues[0];
    } else {
      // Otherwise, compute the range and generate a random number within that range
      const minValue = Math.min(...uniqueValues);
      const maxValue = Math.max(...uniqueValues);
      const rangeSize = Math.ceil((maxValue - minValue) / 200);
  
      const rangeCounts = {};
      rollAmounts.forEach((roll) => {
        const range = Math.floor((roll.roll - minValue) / rangeSize);
        rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
      });
  
      const totalCounts = rollAmounts.length;
      const rangeProbabilities = {};
      Object.keys(rangeCounts).forEach((range) => {
        const rangeProbability = rangeCounts[range] / totalCounts;
        rangeProbabilities[range] = rangeProbability;
      });
  
      let randomValue = Math.random();
      let chosenRange = null;
      Object.entries(rangeProbabilities).some(([range, probability]) => {
        randomValue -= probability;
        if (randomValue <= 0) {
          chosenRange = range;
          return true;
        }
        return false;
      });
  
      const rangeMinValue = parseInt(chosenRange) * rangeSize + minValue;
      const rangeMaxValue = Math.min(rangeMinValue + rangeSize, maxValue);
  
      const getRandomNumberInRange = (min, max) => {
        return Math.random() * (max - min) + min;
      };
      
      const randomChance = Math.random();
      const newValue = parseFloat(getRandomNumberInRange(1, 1.1).toFixed(2));
      const isChanged = randomChance <= 0.1;
      
      if(isChanged){
        return newValue;
      } else {
        return parseFloat(getRandomNumberInRange(rangeMinValue, rangeMaxValue).toFixed(2));
      }
    }
  };
  
  
  

  onAutoPlay = () => {
    if (this.props.roll_list.length > 2) {
      const predictedNum = this.predictNext(this.props.roll_list);

      this.onAddRun(predictedNum);
    } else {
      alertModal(this.props.isDarkMode, 'MINIMUM 3 RUNS, TO MAKE A PREDICTION!!!');
    }
  };
  

  
  
  onRemoveItem = index => {
    this.props.playSound('tap');

    const newArray = this.props.roll_list.filter((elem, i) => i != index);
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    const aveMultiplier = calcAveMultiplier(newArray);
    this.props.onChangeState({
      roll_list: newArray,
      winChance: winChance,
      aveMultiplier: aveMultiplier
    });

  };

  onAddRun = (roll) => {
    this.props.playSound('boop');

    // Ensure roll is a number
    const parsedDropAmount = parseFloat(roll);

    roll = parsedDropAmount;
    if (isNaN(roll)) {
      alertModal(this.props.isDarkMode, 'ENTER A VALID NUMBER');
      return;
    }
  
    this.setState({ roll: roll });
    const newArray = JSON.parse(JSON.stringify(this.props.roll_list));

  
    if (roll < 1) {
      roll = 1; 
    }
  
    newArray.push({
      roll: roll.toFixed(2)
    });

    const aveMultiplier = calcAveMultiplier(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      roll_list: newArray,
      winChance: winChance,
      aveMultiplier: aveMultiplier,
      roll: this.state.bet_amount
    });
    this.onChangeWinChance(winChance);

    this.onChangeAveMultiplier(aveMultiplier);
    this.setState({ winChance, aveMultiplier });
  };

  componentDidUpdate(prevProps) {
    // if (prevProps.roll_list.length !== this.props.roll_list.length) {
    //   const table = document.getElementById('runs');
    //   if (table) {
    //     table.scrollTop = table.scrollHeight;
    //   }
    // }
  }


  handlehalfxButtonClick() {
    const multipliedBetAmount = this.state.roll * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState({
    roll: roundedBetAmount
    }, () => {
    document.getElementById("betamount").focus();
    });
    }

  handle2xButtonClick() {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.roll * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount, this.props.bet_amount);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    if (roundedBetAmount < -2330223) {
      alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
    } else {
      this.setState({
        roll: roundedBetAmount
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  }

  
    handleMaxButtonClick() {
      const maxBetAmount = (this.state.balance).toFixed(2);
      this.setState({
        roll: Math.min(maxBetAmount, this.props.bet_amount)
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  onChangeBetAmount = new_state => {
    this.setState({ roll: new_state.selected_bet_amount });
  };
  render() {
    
    const defaultBetAmounts = [10, 25, 50, 100, 250];

    return this.props.step === 1 ? (
      
      <div className="game-info-panel">
        {/* <h3 className="game-sub-title">Bankroll</h3> */}
        <DefaultBetAmountPanel
              bet_amount={this.props.bet_amount}
              onChangeState={this.props.onChangeState}
              game_type="roll"
              defaultBetAmounts={defaultBetAmounts}
            />
     
      </div>
    ) : (
      
      <div className="game-info-panel">
                          <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1>

        <div className="rps-add-run-panel">
        <div className="roll-add-run-form">
           
        <h3 className="game-sub-title">
  Add some rolls!
</h3>
<div id="roll">
  <Button
    className={
      'rock button-2x-r' + (this.state.selected_rps === 'R' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('R');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >2x</Button>
  <Button
    className={
      'paper button-2x-p' + (this.state.selected_rps === 'P' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('P');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >2x</Button>
  <Button
    className={
      'scissors button-2x-s' +
      (this.state.selected_rps === 'S' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('S');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >2x</Button>
  <Button
    className={
      'whale button-14x' +
      (this.state.selected_rps === 'W' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('W');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >14x</Button>
  <Button
    className={
      'bear button-15x' +
      (this.state.selected_rps === 'B' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('B');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >1.5x</Button>
  <Button
    className={
      'bull button-7x' + (this.state.selected_rps === 'Bu' ? ' active' : '')
    }
    variant="contained"
    onClick={() => {
      this.onAddRun('Bu');
      const currentActive = document.querySelector('.active');
      if (currentActive) {
        currentActive.style.animation = 'none';
        void currentActive.offsetWidth;
        currentActive.style.animation = 'pulse 0.2s ease-in-out ';
      }
    }}
  >7x</Button>
</div>

            <Button id="aiplay" onClick={this.onAutoPlay}>Test AI Play</Button>
            {/* <label>AUTOPLAY <input type="checkbox" onChange={()=>this.setState({autoplay: !this.state.autoplay})} />
</label> */}

          </div>
          <div className="rps-add-run-table roll-add-run-table">
            <h3 className="game-sub-title">Training Data</h3>
            <table id="runs">
              <tbody>
                {this.props.roll_list && this.props.roll_list.length > 0 ? (
                  this.props.roll_list.map((roll, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{roll.roll}x</td>
                      <td>
                        <HighlightOffIcon
                          onClick={() => this.onRemoveItem(index)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td id="add-run" colSpan="4">Provide the AI with example outputs</td>
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

export default connect(mapStateToProps)(Roll);
