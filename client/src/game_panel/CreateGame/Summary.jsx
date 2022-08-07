import React, { Component } from 'react';
import { updateDigitToPoint2 } from '../../util/helper';

class Summary extends Component {
  pre_summery() {
    let public_max_return =
      updateDigitToPoint2(this.props.max_prize /* 0.95 */) + ' RPS';
    let public_bet_amount = this.props.public_bet_amount;

    if (this.props.game_mode === 'Spleesh!') {
      if (this.props.max_return < 100) {
        public_bet_amount = '100000 RPS - 1000000 RPS';
        public_max_return = updateDigitToPoint2(5600000 /* 0.9 */) + ' RPS';
      } else {
        public_bet_amount = '1000000 RPS - 10000000 RPS';
        public_max_return = updateDigitToPoint2(56000000 /* 0.9 */) + ' RPS';
      }
    } else if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = updateDigitToPoint2(this.props.max_return) + ' RPS';
    }

    return (
      <div className="pre-summary-panel">
        <div className="your-bet-amount">
          Your Bet Amount :{' '}
          {updateDigitToPoint2(this.props.bet_amount) + ' RPS'}
        </div>
        {(this.props.game_mode === 'Mystery Box' ||
          this.props.game_mode === 'Spleesh!' ||
          this.props.game_mode === 'Quick Shoot') && (
          <div className="public-bet-amount">
            Public Bet Amount : {public_bet_amount}
          </div>
        )}
        <div className="your-max-return">
          Your Max Return :{' '}
          {`${
            typeof this.props.max_return === 'number'
              ? updateDigitToPoint2(this.props.max_return)
              : this.props.max_return
          } RPS`}
        </div>
        {(this.props.game_mode === 'Mystery Box' ||
          this.props.game_mode === 'Spleesh!' ||
          this.props.game_mode === 'Quick Shoot') && (
          <div className="public-max-return">
            Public Max Return : {public_max_return}
          </div>
        )}
      </div>
    );
  }

  total_summery() {
    let public_bet_amount = this.props.public_bet_amount;
    let public_max_return =
      updateDigitToPoint2(this.props.max_prize /* 0.95 */) + ' RPS';

    if (this.props.game_mode === 'Spleesh!') {
      if (this.props.max_return < 100) {
        public_bet_amount = '100000 RPS - 1000000 RPS';
      } else {
        public_bet_amount = '1000000 RPS - 10000000 RPS';
      }
    } else if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = updateDigitToPoint2(this.props.max_return) + ' RPS';
    }

    return (
      <div className="summary-panel">
        <h3 className="game-sub-title">Stake Summary</h3>
        <div className="summary-info">
          <div className="summary-item">
            <div className="summary-item-name">Bet Amount</div>
            <div className="summary-item-value">
              {updateDigitToPoint2(this.props.bet_amount)} RPS
            </div>
          </div>
          {(this.props.game_mode === 'Spleesh!' ||
            this.props.game_mode === 'Quick Shoot') && (
            <div className="summary-item">
              <div className="summary-item-name">Public Bet Amount</div>
              <div className="summary-item-value">{public_bet_amount}</div>
            </div>
          )}
          {this.props.game_mode === 'Quick Shoot' && (
            <div className="summary-item">
              <div className="summary-item-name">Public Max Return</div>
              <div className="summary-item-value">{public_max_return}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name">Max Return Amount</div>
            <div className="summary-item-value">
              {`${
                typeof this.props.max_return === 'number'
                  ? updateDigitToPoint2(this.props.max_return)
                  : this.props.max_return
              } RPS`}
            </div>
          </div>
          {this.props.endgame_type && (
            <div className="summary-item">
              <div className="summary-item-name">Payout</div>
              <div className="summary-item-value">
                {updateDigitToPoint2(this.props.endgame_amount)} RPS
              </div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name">Privacy</div>
            <div className="summary-item-value">
              {this.props.is_private ? 'Private' : 'Public'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.step === 1) {
      return <></>;
    } else if (this.props.step === 4) {
      return this.total_summery();
    }
    return this.pre_summery();
  }
}

export default Summary;
