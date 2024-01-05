import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import { Button, TextField } from '@material-ui/core';
import { convertToCurrency } from '../../util/conversion';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import {
  alertModal
} from '../modal/ConfirmAlerts';
import BetAmountInput from '../../components/BetAmountInput';


const calcWinChance = (prevStates) => {
  let total = prevStates.length;
  let counts = {};
  prevStates.forEach((state) => {
    if (counts[state.drop]) {
      counts[state.drop]++;
    } else {
      counts[state.drop] = 1;
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

class DropGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_drop: '',
      bet_amount: 0.1,
      drop: 0.001,
      balance: this.props.balance,
      winChance: 33,
      // is_other: (this.props.bet_amount === 5 || this.props.bet_amount === 10 || this.props.bet_amount === 25 || this.props.bet_amount === 50 || this.props.bet_amount === 100) ? 'hidden' : '',
    };
    // this.onChangeBetAmount = this.onChangeBetAmount.bind(this);
    this.onChangeState = this.onChangeState.bind(this);

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

  onChangeState(e) {
    this.setState({ drop: e.target.value });
  }


  onChangeWinChance = (winChance) => {
    this.setState({ winChance });
    // this.props.onChangeState({ winChance });
  };
  predictNext = dropAmounts => {
    const sortedDrops = dropAmounts.map(drop => drop.drop).sort((a, b) => a - b);
    const uniqueValues = [...new Set(sortedDrops)];

    if (uniqueValues.length === 1) {
        return uniqueValues[0];
    } else {
        let finalValue;

        do {
            const minDrop = Math.min(...sortedDrops);
            const maxDrop = Math.max(...sortedDrops);
            const difference = maxDrop - minDrop;
            const segmentSize = difference / 20;

            const segments = Array.from({ length: 20 }, (_, index) => {
                const lowerBound = minDrop + index * segmentSize;
                const upperBound = minDrop + (index + 1) * segmentSize;
                const dropsInSegment = sortedDrops.filter(drop => drop >= lowerBound && (drop < upperBound || (index === 19 && drop === upperBound)));

                return {
                    segment: index + 1,
                    drops: dropsInSegment
                };
            });

            const totalDropsCount = sortedDrops.length;
            const weights = segments.map(segment => segment.drops.length / totalDropsCount);

            const randomValue = Math.random();
            let cumulativeWeight = 0;
            let selectedSegment;

            for (let i = 0; i < segments.length; i++) {
                cumulativeWeight += weights[i];
                if (randomValue <= cumulativeWeight) {
                    selectedSegment = segments[i];
                    break;
                }
            }

            const switchChance = Math.random();

            if (switchChance <= 0.4) {
                const bottom5PercentIndex = Math.floor(0.25 * totalDropsCount);
                finalValue = sortedDrops[Math.floor(Math.random() * bottom5PercentIndex)];
            } else if (switchChance <= 0.8) {
                const top30PercentIndex = Math.floor(0.6 * totalDropsCount);
                finalValue = sortedDrops[Math.floor(top30PercentIndex + Math.random() * (totalDropsCount - top30PercentIndex))];
            } else {
                const randomAddition = Math.random() * segmentSize;
                finalValue = selectedSegment ? selectedSegment.drops[0] + randomAddition : null;
            }

        } while (finalValue !== null && finalValue < 0.000001);
        console.log("finalValue", finalValue)

        return finalValue;
    }
};


  onAutoPlay = () => {
    if (this.props.drop_list.length > 2) {
      const predictedNum = this.predictNext(this.props.drop_list);

      this.onAddRun(predictedNum);
    } else {
      alertModal(this.props.isDarkMode, 'MINIMUM 3 RUNS, TO MAKE A PREDICTION!!!');
    }
  };
  

  
  
  onRemoveItem = index => {
    this.props.playSound('tap');

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

  onAddRun = (drop) => {
    this.props.playSound('boop');

    // Ensure drop is a number
    const parsedDropAmount = parseFloat(drop);

    drop = parsedDropAmount;
    if (isNaN(drop)) {
      alertModal(this.props.isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!');
      return;
    }
  
    this.setState({ drop: drop });
    const newArray = JSON.parse(JSON.stringify(this.props.drop_list));

  
    // // Check if the drop_list is empty and if the drop value exceeds this.props.bet_amount
    // if (newArray.length === 0 && drop > this.props.bet_amount) {
    //   drop = this.props.bet_amount; // Set the drop value to this.props.bet_amount
    // }
  
    newArray.push({
      drop: drop
    });


    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      drop_list: newArray,
      winChance: winChance,
      drop: this.state.bet_amount
    });
    this.onChangeWinChance(winChance);
    this.setState({ winChance });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.drop_list.length !== this.props.drop_list.length) {
      const table = document.getElementById('runs');
      if (table) {
        table.scrollTop = table.scrollHeight;
      }
    }
  }


  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.drop * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState({
    drop: roundedBetAmount
    }, () => {
    document.getElementById("betamount").focus();
    });
    }

  handle2xButtonClick = () => {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.drop * 2;
    const limitedBetAmount = Math.min(multipliedBetAmount, maxBetAmount, this.props.bet_amount);
    const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    if (roundedBetAmount < -2330223) {
      alertModal(this.props.isDarkMode, "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?");
    } else {
      this.setState({
        drop: roundedBetAmount
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  }

  
    handleMaxButtonClick = () => {
      const maxBetAmount = (this.state.balance);
      this.setState({
        drop: Math.min(maxBetAmount, this.props.bet_amount)
      }, () => {
      document.getElementById("betamount").focus();
      });
    }
  onChangeBetAmount = new_state => {
    this.setState({ drop: new_state.selected_bet_amount });
  };
  render() {
    
    const defaultBetAmounts = [0.001, 0.002, 0.005, 0.01, 0.1];

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
                          {/* <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1> */}

        <div className="rps-add-run-panel">
        <div className="drop-add-run-form">
           
            <h3 className="game-sub-title">
              Drop some amounts!{' '}
            </h3>
            <div className="your-bet-amount">
            <BetAmountInput
              betAmount={this.state.drop}
              handle2xButtonClick={this.handle2xButtonClick}
              handleHalfXButtonClick={this.handleHalfXButtonClick}
              handleMaxButtonClick={this.handleMaxButtonClick}
              onChangeState={this.onChangeState}
              isDarkMode={this.props.isDarkMode}
            />
              {/* <TextField
                type="text"
                pattern="[0-9]*"
                name="betamount"
                variant="outlined"
                id="betamount"
                maxLength="9"
                value={this.state.drop}
                onChange={(event) => this.setState({ drop: event.target.value })}
                placeholder="BET AMOUNT"
                InputProps={{
                  endAdornment: "ETH",
                }}
              /> */}
              <div>
              <div className='max'>
            {/* <Button variant="contained" color="primary" onClick={() => this.handleHalfXButtonClick()}>0.5x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handle2xButtonClick()}>2x</Button>
            <Button variant="contained" color="primary" onClick={() => this.handleMaxButtonClick()}>Max</Button> */}
          </div>
              </div>
              <div className='drop addRun'>
              <Button 
              id="drop-button"
                  onClick={() => {
                    this.onAddRun(this.state.drop);

                  }}>
                    Add Run
              </Button>
              </div>
            </div>
            <Button id="aiplay" onClick={this.onAutoPlay}>Test AI Play</Button>
            {/* <label>AUTOPLAY <input type="checkbox" onChange={()=>this.setState({autoplay: !this.state.autoplay})} />
</label> */}

          </div>
          <div className="rps-add-run-table drop-add-run-table">
            <h3 className="game-sub-title">Training Data</h3>
            <table id="runs">
              <tbody>
                {this.props.drop_list && this.props.drop_list.length > 0 ? (
                  this.props.drop_list.map((drop, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{convertToCurrency(drop.drop)}</td>
                      <td>
                        <HighlightOffIcon id="delete"
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

export default connect(mapStateToProps)(DropGame);
