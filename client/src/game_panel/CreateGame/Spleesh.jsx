import React, { Component } from 'react';

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
          {i * this.props.spleesh_bet_unit} RPS
        </button>
      );
    }
    return panel;
  }

  render() {
    console.log({ step: this.props.step });
    return this.props.step === 1 ? (
      <div className="game-info-panel">
        <h3 className="game-sub-title">Game Type</h3>
        <div className="select-buttons-panel">
          <button
            className={this.props.spleesh_bet_unit === 100000 ? ' active' : ''}
            onClick={() => {
              this.props.onChangeState({
                spleesh_bet_unit: 100000,
                bet_amount: 100000,
                max_return: 5400000,
                endgame_amount: 5400000
              });
            }}
          >
            100000 RPS - 1000000 RPS
          </button>
          <button
            className={this.props.spleesh_bet_unit === 1000000 ? ' active' : ''}
            onClick={() => {
              this.props.onChangeState({
                spleesh_bet_unit: 1000000,
                bet_amount: 1000000,
                max_return: 54000000,
                endgame_amount: 54000000
              });
            }}
          >
            1000000 RPS - 10000000 RPS
          </button>
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
