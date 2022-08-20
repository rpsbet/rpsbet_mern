import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { updateDigitToPoint2 } from '../../util/helper';

class Summary extends Component {
  pre_summery() {
    console.log({ props: this.props });
    let public_max_return = convertToCurrency(
      updateDigitToPoint2(this.props.max_prize /* 0.95 */)
    );
    let public_bet_amount = this.props.public_bet_amount;

    if (this.props.game_mode === 'Spleesh!') {
      public_bet_amount = `${convertToCurrency(
        this.props.spleesh_bet_unit
      )} - ${convertToCurrency(this.props.spleesh_bet_unit * 10)}`;
      public_max_return = convertToCurrency(
        updateDigitToPoint2(
          this.props.spleesh_bet_unit * 55 + this.props.bet_amount /* 0.9 */
        )
      );
    } else if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(
        updateDigitToPoint2(this.props.max_return)
      );
    }

    return (
      <div className="pre-summary-panel">
        <div className="your-bet-amount">
          Your Bet Amount :{' '}
          {convertToCurrency(updateDigitToPoint2(this.props.bet_amount))}
        </div>
        {['Mystery Bpx', 'Spleesh!', 'Quick Shoot'].includes(
          this.props.game_mode
        ) && (
          <div className="public-bet-amount">
            Public Bet Amount : {public_bet_amount}
          </div>
        )}
        {this.props.game_mode === 'Brain Game' ? (
          <div
            className="your-max-return"
            style={{ display: 'inline-flex', justifyContent: 'center' }}
          >
            Your Max Return :{' '}
            <span
              style={{
                fontSize: '2em',
                padding: '0 .125em'
              }}
            >
              ∞
            </span>{' '}
            RPS
          </div>
        ) : (
          <div className="your-max-return">
            Your Max Return :{' '}
            {convertToCurrency(updateDigitToPoint2(this.props.max_return))}
          </div>
        )}
        {['Mystery Box', 'Spleesh!', 'Quick Shoot'].includes(
          this.props.game_mode
        ) && (
          <div className="public-max-return">
            Public Max Return : {public_max_return}
          </div>
        )}
      </div>
    );
  }

  total_summery() {
    let public_bet_amount = this.props.public_bet_amount;
    let public_max_return = convertToCurrency(
      updateDigitToPoint2(this.props.max_prize /* 0.95 */)
    );

    if (this.props.game_mode === 'Spleesh!') {
      public_bet_amount = `${convertToCurrency(
        this.props.spleesh_bet_unit
      )} - ${convertToCurrency(this.props.spleesh_bet_unit * 10)}`;
    } else if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(
        updateDigitToPoint2(this.props.max_return)
      );
    }

    return (
      <div className="summary-panel">
        <h3 className="game-sub-title">Stake Summary</h3>
        <div className="summary-info">
          <div className="summary-item">
            <div className="summary-item-name">Bet Amount</div>
            <div className="summary-item-value">
              {convertToCurrency(updateDigitToPoint2(this.props.bet_amount))}
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
              {convertToCurrency(updateDigitToPoint2(this.props.max_return))}
            </div>
          </div>
          {this.props.endgame_type && (
            <div className="summary-item">
              <div className="summary-item-name">Payout</div>
              <div className="summary-item-value">
                {convertToCurrency(
                  updateDigitToPoint2(this.props.endgame_amount)
                )}
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
