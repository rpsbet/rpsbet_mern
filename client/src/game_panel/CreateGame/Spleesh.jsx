import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';

class Spleesh extends Component {
  createNumberPanel() {
    let panel = [];
    for (let i = 1; i <= 10; i++) {
      panel.push(
        <button
          className={
            this.props.bet_amount / this.props.spleesh_bet_unit === i
              ? ' active'
              : ''
          }
          onClick={() => {
            this.props.onChangeState({
              bet_amount: i * this.props.spleesh_bet_unit,
              endgame_amount: this.props.spleesh_bet_unit * (55 - i),
              max_return: this.props.spleesh_bet_unit * (55 - i)
            });
          }}
          key={i}
        >
          {convertToCurrency(i * this.props.spleesh_bet_unit)}
        </button>
      );
    }
    return panel;
  }

  render() {
    return this.props.step === 1 ? (
      <div className="game-info-panel">
        <h3 className="game-sub-title">Game Type</h3>
        <div className="select-buttons-panel">
          {[100000, 1000000].map(item => (
            <button
              className={this.props.spleesh_bet_unit === item ? 'active' : ''}
              onClick={() => {
                this.props.onChangeState({
                  spleesh_bet_unit: convertToCurrency(item),
                  bet_amount: convertToCurrency(item),
                  max_return: convertToCurrency(54 * item),
                  endgame_amount: convertToCurrency(54 * item)
                });
              }}
            >
              {convertToCurrency(item)} - {convertToCurrency(item * 10)}
            </button>
          ))}
        </div>
      </div>
    ) : (
      <div className="game-info-panel">
        <h3 className="game-sub-title">Your Number</h3>
        <div className="select-buttons-panel">{this.createNumberPanel()}</div>
        <p className="tip">
          Pick a number for players to guess (Your Bet Amount)
        </p>
      </div>
    );
  }
}

export default Spleesh;
