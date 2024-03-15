import React, { Component } from 'react';
import DefaultBetAmountPanel from './DefaultBetAmountPanel';
import { connect } from 'react-redux';
import { Button, IconButton } from '@material-ui/core';
import BetAmountInput from '../../components/BetAmountInput';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import HighlightOffIcon from '@material-ui/icons/HighlightOff';
import { alertModal } from '../modal/ConfirmAlerts';

const calcWinChance = prevStates => {
  let total = prevStates.length;
  let counts = {};
  prevStates.forEach(state => {
    if (counts[state.bang]) {
      counts[state.bang]++;
    } else {
      counts[state.bang] = 1;
    }
  });
  let lowest = Infinity;
  let highest = -Infinity;
  Object.keys(counts).forEach(key => {
    const chance = (counts[key] / total) * 100;
    if (chance < lowest) {
      lowest = chance;
    }
    if (chance > highest) {
      highest = chance;
    }
  });
  if (lowest === highest) {
    return lowest.toFixed(2) + '%';
  }
  return lowest.toFixed(2) + '% - ' + highest.toFixed(2) + '%';
};

const calcAveMultiplier = list => {
  let sum = 0;
  for (let i = 0; i < list.length; i++) {
    sum += parseFloat(list[i].bang);
  }
  const average = sum / list.length;
  return parseFloat(average.toFixed(2));
};

class Bang extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_bang: '',
      bet_amount: 1.01,
      bang: 1.0,
      balance: this.props.balance,
      winChance: 33,
      aveMultiplier: 0
    };
    this.onChangeState = this.onChangeState.bind(this);
    // this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleReset = this.handleReset.bind(this);
  }

  static getDerivedStateFromProps(props, current_state) {
    if (current_state.balance !== props.balance) {
      return {
        ...current_state,
        balance: props.balance
      };
    }
    return null;
  }

  onChangeWinChance = winChance => {
    this.setState({ winChance });
  };

  onChangeState(e) {
    this.setState({ bang: e.target.value });
  }

  onChangeAveMultiplier = aveMultiplier => {
    this.setState({ aveMultiplier });
  };

  handleReset() {
    this.props.onChangeState({
      bang_list: [],
      winChance: 0,
      aveMultiplier: 0
    });
  }


  predictNext = bangAmounts => {
    // Find the unique values in bangAmounts
    const uniqueValues = [...new Set(bangAmounts.map(bang => bang.bang))];

    if (uniqueValues.length === 1) {
      // If there is only one unique value, return that value
      return uniqueValues[0];
    } else {
      // Otherwise, compute the range and generate a random number within that range
      const minValue = Math.min(...uniqueValues);
      const maxValue = Math.max(...uniqueValues);
      const rangeSize = Math.ceil((maxValue - minValue) / 200);

      const rangeCounts = {};
      bangAmounts.forEach(bang => {
        const range = Math.floor((bang.bang - minValue) / rangeSize);
        rangeCounts[range] = rangeCounts[range] ? rangeCounts[range] + 1 : 1;
      });

      const totalCounts = bangAmounts.length;
      const rangeProbabilities = {};
      Object.keys(rangeCounts).forEach(range => {
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
      const newValue = getRandomNumberInRange(1, 1.06);
      const isChanged = randomChance <= 0.51;

      if (isChanged) {
        return newValue;
      } else {
        return getRandomNumberInRange(rangeMinValue, rangeMaxValue);
      }
    }
  };

  onAutoPlay = () => {
    if (this.props.bang_list.length > 2) {
      const predictedNum = this.predictNext(this.props.bang_list);

      this.onAddRun((predictedNum).toFixed(2));
    } else {
      alertModal(
        this.props.isDarkMode,
        'MINIMUM 3 RUNS, TO MAKE A PREDICTION!!!'
      );
    }
  };

  onRemoveItem = index => {
    this.props.playSound('tap');

    const newArray = this.props.bang_list.filter((elem, i) => i != index);
    // const bet_amount = calcBetAmount(newArray);
    const winChance = calcWinChance(newArray);
    const aveMultiplier = calcAveMultiplier(newArray);
    this.props.onChangeState({
      bang_list: newArray,
      winChance: winChance,
      aveMultiplier: aveMultiplier
    });
  };

  onAddRun = bang => {
    this.props.playSound('boop');

    // Ensure bang is a number
    const parsedDropAmount = parseFloat(bang);

    bang = parsedDropAmount;
    if (isNaN(bang)) {
      alertModal(this.props.isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!');
      return;
    }

    this.setState({ bang: bang });
    const newArray = JSON.parse(JSON.stringify(this.props.bang_list));

    if (bang < 1) {
      bang = 1;
    }

    newArray.push({
      bang: bang
    });

    const aveMultiplier = calcAveMultiplier(newArray);
    const winChance = calcWinChance(newArray);
    this.props.onChangeState({
      bang_list: newArray,
      winChance: winChance,
      aveMultiplier: aveMultiplier,
      bang: this.state.bet_amount
    });
    this.onChangeWinChance(winChance);

    this.onChangeAveMultiplier(aveMultiplier);
    this.setState({ winChance, aveMultiplier });
  };

  componentDidUpdate(prevProps) {
    if (prevProps.bang_list.length !== this.props.bang_list.length) {
      const table = document.getElementById('runs');
      if (table) {
        table.scrollTop = table.scrollHeight;
      }
    }
  }

  handleHalfXButtonClick = () => {
    const multipliedBetAmount = this.state.bang * 0.5;
    const roundedBetAmount = Math.floor(multipliedBetAmount * 100) / 100;
    this.setState(
      {
        bang: roundedBetAmount
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };


  handle2xButtonClick = () => {
    const maxBetAmount = this.state.balance;
    const multipliedBetAmount = this.state.bang * 2;
    const limitedBetAmount = Math.min(
      multipliedBetAmount,
      maxBetAmount,
      this.props.bet_amount
    );
    const roundedBetAmount = Math.floor(limitedBetAmount * 100) / 100;
    if (roundedBetAmount < -2330223) {
      alertModal(
        this.props.isDarkMode,
        "NOW, THAT'S GETTING A BIT CRAZY NOW ISN'T IT?"
      );
    } else {
      this.setState(
        {
          bang: roundedBetAmount
        },
        () => {
          document.getElementById('betamount').focus();
        }
      );
    }
  };

  handleMaxButtonClick = () => {
    const maxBetAmount = Math.floor(this.state.balance * 100) / 100;
    this.setState(
      {
        bang: Math.min(maxBetAmount, this.props.bet_amount)
      },
      () => {
        document.getElementById('betamount').focus();
      }
    );
  };

  render() {
    const defaultBetAmounts = [0.001, 0.002, 0.005, 0.01, 0.1];
    const generateRandomMultiplier = () => {
      const isBetweenOneAndTwo = Math.random() <= 0.8;
      if (isBetweenOneAndTwo) {
        return Math.random() + 1; // Random value between 1 and 2
      } else {
        return Math.random() * 49 + 2; // Random value between 2 and 50
      }
    };
    const suggestedMultipliers = Array.from({ length: 8 }, (_, index) => generateRandomMultiplier());

    return this.props.step === 1 ? (
      <div className="game-info-panel">
        {/* <h3 className="game-sub-title">Bankroll</h3> */}
        <DefaultBetAmountPanel
          bet_amount={this.props.bet_amount}
          onChangeState={this.props.onChangeState}
          game_type="Bang"
          defaultBetAmounts={defaultBetAmounts}
        />
      </div>
    ) : (
      <div className="game-info-panel">
        {/* <h1> DEMO ONLY, GAME UNDER DEVELOPMENT 🚧</h1> */}

        <div className="rps-add-run-panel">
          <div className="bang-add-run-form">
            <h3 className="game-sub-title">Add some Bangs! </h3>
            <div className="bet-amount">
              <BetAmountInput
                betAmount={this.state.bang}
                handle2xButtonClick={this.handle2xButtonClick}
                handleHalfXButtonClick={this.handleHalfXButtonClick}
                handleMaxButtonClick={this.handleMaxButtonClick}
                onChangeState={this.onChangeState}
                isDarkMode={this.props.isDarkMode}
                bangGame={true}
              />

              <div className="suggested-multipliers">
                {suggestedMultipliers.map((multiplier, index) => (
                  <Button
                    key={index}
                    onClick={() => {
                      this.onAddRun(multiplier.toFixed(2));
                      this.setState({ bang: multiplier.toFixed(2) })
                    }
                    }
                  >
                    {multiplier.toFixed(2)}x
                  </Button>
                ))}
              </div>
              <div className="bang addRun">
                <Button
                  id="bang-button"
                  onClick={() => {
                    this.onAddRun(this.state.bang);
                  }}
                >
                  Add Run
                </Button>
              </div>
            </div>
            <Button id="aiplay" onClick={this.onAutoPlay}>
              Test AI Play&nbsp;<span className="roll-tag">[space]</span>
            </Button>

          </div>
          <div className="rps-add-run-table bang-add-run-table">
            <h3 className="game-sub-title">Training Data</h3>
            <table id="runs">
              <tbody>
                {this.props.bang_list && this.props.bang_list.length > 0 ? (
                  this.props.bang_list.map((bang, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{(bang.bang).toFixed(2)}x</td>
                      <td>
                        <HighlightOffIcon
                          onClick={() => this.onRemoveItem(index)}
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td id="add-run" colSpan="4">
                      Your pattern will be displayed here
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <IconButton style={{ background: "transparent", boxShadow: "none" }} color="secondary" onClick={this.handleReset}>
              <FontAwesomeIcon icon={faTrash} /> {/* Use the faRedo icon */}
            </IconButton>
          </div>
        </div>
      </div>
    );
  }
}

const mapStateToProps = state => ({
  balance: state.auth.balance,
  auth: state.auth.isAuthenticated,
  isDarkMode: state.auth.isDarkMode
});

export default connect(mapStateToProps)(Bang);
