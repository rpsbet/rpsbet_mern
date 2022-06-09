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

class RPS extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected_rps: 'R',
      selected_bet_amount: 5
    };
  }

  onChangeBetAmount = new_state => {
    this.setState({ selected_bet_amount: new_state.bet_amount });
  };

  onRemoveItem = index => {
    const newArray = this.props.rps_list.filter((elem, i) => i != index);
    const bet_amount = calcBetAmount(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      bet_amount: bet_amount,
      max_return: bet_amount * 2 * 0.95
    });
  };

  onAddRun = e => {
    const newArray = JSON.parse(JSON.stringify(this.props.rps_list));
    newArray.push({
      rps: this.state.selected_rps,
      bet_amount: this.state.selected_bet_amount,
      pr: this.state.selected_bet_amount * 2
    });
    const bet_amount = calcBetAmount(newArray);
    this.props.onChangeState({
      rps_list: newArray,
      bet_amount: bet_amount,
      max_return: bet_amount * 2 * 0.95
    });
    this.setState({
      selected_rps: 'R',
      selected_bet_amount: 5
    });
  };

  render() {
    const defaultBetAmounts = [5, 10, 25, 50];
    console.log(this.props.step);

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
          {/* <span className={(this.props.rps_game_type === 1 ? " active" : "")} onClick={() => { this.props.onChangeState({rps_game_type: 1}); }}>Freeplay</span> */}
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
              <button
                id="btn-add-run"
                className="other"
                onClick={this.onAddRun}
              >
                + Add Run
              </button>
            </h3>
            <div id="rps-radio">
              <span
                className={
                  'rock' + (this.state.selected_rps === 'R' ? ' active' : '')
                }
                onClick={() => {
                  this.setState({ selected_rps: 'R' });
                }}
              ></span>
              <span
                className={
                  'paper' + (this.state.selected_rps === 'P' ? ' active' : '')
                }
                onClick={() => {
                  this.setState({ selected_rps: 'P' });
                }}
              ></span>
              <span
                className={
                  'scissors' +
                  (this.state.selected_rps === 'S' ? ' active' : '')
                }
                onClick={() => {
                  this.setState({ selected_rps: 'S' });
                }}
              ></span>
            </div>
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
                    <td colSpan="4">Please add a run.</td>
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
