import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { Warning, Info, CheckCircle } from '@material-ui/icons';
import { Tooltip } from '@material-ui/core';
// import { updateDigitToPoint2 } from '../../util/helper';

class Summary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      winChance: 0,
      aveMultiplier: 0,
      public_bet_amount: 0
    };
    if (this.props.game_mode === 'RPS') {
      this.state.winChance = 33;
    } else if (this.props.game_mode === 'Spleesh!') {
      this.state.winChance = 69;
    } else if (this.props.game_mode === 'Mystery Box') {
      this.state.winChance = 10;
    } else if (this.props.game_mode === 'Quick Shoot') {
      this.state.winChance = 15;
    } else if (this.props.game_mode === 'Brain Game') {
      this.state.winChance = '0 - 100';
    } else if (this.props.game_mode === 'Drop Game') {
      this.state.winChance = 42;
    } else if (this.props.game_mode === 'Bang!') {
      this.state.winChance = 42;
    } else if (this.props.game_mode === 'Roll') {
      this.state.winChance = 42;
    } else if (this.props.game_mode === 'Blackjack') {
      this.state.winChance = 42;
    }
  }
  pre_summery() {
    // console.log({ props: this.props });
    let public_max_return = convertToCurrency(this.props.max_prize /* 0.95 */);
    let public_bet_amount = this.props.public_bet_amount;

    if (this.props.game_mode === 'Spleesh!') {
      public_bet_amount = (
        <>
          {convertToCurrency(this.props.spleesh_bet_unit)}{' '}-
          {convertToCurrency(this.props.spleesh_bet_unit * 10)}
        </>
      );
      public_max_return = convertToCurrency(
        this.props.spleesh_bet_unit * 5.5 + this.props.bet_amount /* 0.9 */
      );
    } else if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(this.props.max_return);
    } else if (this.props.game_mode === 'RPS') {
      public_max_return = convertToCurrency(this.props.bet_amount);
    }

    return (
      <div className="pre-summary-panel">
        <div className="data-item">
          <div className="label your-bet-amount">YOUR BET</div>
          <div className="value">
            {convertToCurrency(this.props.bet_amount)}
          </div>
        </div>
        {/* {['Mystery Box', 'Spleesh!', 'Quick Shoot'].includes(
          this.props.game_mode
        ) && (
          <div className="data-item">
            <div className="label public-bet-amount">THEIR BET</div>
            <div className="value">{public_bet_amount}</div>
          </div>
        )} */}
        <div className="data-item">
          <div className="label your-max-return">TARGET ROI</div>
          <div className="value">
            {this.props.game_mode === 'Brain Game' ? (
              <>
                <span style={{ fontSize: '2em' }}>∞</span>
              </>
            ) : (
              convertToCurrency(this.props.max_return)
            )}
          </div>
        </div>
        {['Bang!', 'Roll'].includes(this.props.game_mode) && (
          <div className="data-item">
            <div className="label public-max-return">Average Multiplier</div>
            <div className="value">{this.props.aveMultiplier}x</div>
          </div>
        )}

        <div className="data-item">
          <div className="label win-chance">Expected Value</div>
          <div className="value">
            {convertToCurrency(this.props.winChance) === -0
              ? convertToCurrency(0.0).toFixed(2)
              : convertToCurrency(this.props.winChance)}
          </div>
        </div>
      </div>
    );
  }

  componentDidUpdate(prevProps) {
    if (prevProps.game_mode !== this.props.game_mode) {
      if (this.props.game_mode === 'RPS') {
        this.setState({ winChance: 33 });
      } else if (this.props.game_mode === 'Spleesh!') {
        this.setState({ winChance: 69 });
      } else if (this.props.game_mode === 'Mystery Box') {
        this.setState({ winChance: 10 });
      } else if (this.props.game_mode === 'Quick Shoot') {
        this.setState({ winChance: 15 });
      } else if (this.props.game_mode === 'Brain Game') {
        this.setState({ winChance: '0 - 100' });
      } else if (this.props.game_mode === 'Drop Game') {
        this.setState({ winChance: 42 });
      } else if (this.props.game_mode === 'Bang!') {
        this.setState({ winChance: 42 });
      }
    }
  }

  total_summery() {
    const {
      rps_game_type,
      qs_game_type,
      bet_amount,
      winChance,
      max_return,
      aveMultiplier,
      public_bet_amount,
      max_prize,
      game_mode,
      spleesh_bet_unit,
      gameBackground,
      is_private,
      youtubeUrl,
      endgame_amount,
      endgame_type,
      selectedStrategy,
      description
    } = this.props;
    let public_max_return = <> {convertToCurrency(max_prize)} </>;
    let spleesh_public_bet_amount = public_bet_amount

    const isNegative = winChance < 0;
    const isPositive = winChance > 0;
    const isZero = winChance === 0;

    let valueColor = 'default';
    let backgroundColor = 'default';
    let icon = <Info style={{width: "10pt", cursor: "pointer", marginLeft: "5px"}}/>;
    let tooltipText = 'Zero (Neutral Fairness)';

    if (isNegative) {
      valueColor = '#ff0000';
      backgroundColor = '#ff000033';
      icon = <Warning  style={{width: "10pt", cursor: "pointer", marginLeft: "5px"}}/>;
      tooltipText = 'High Risk Game';
    } else if (isPositive) {
      valueColor = 'rgb(40, 167, 69)';
      backgroundColor = 'rgba(40, 167, 69, 0.3)';
      icon = <CheckCircle  style={{width: "10pt", cursor: "pointer", marginLeft: "5px"}}/>;
      tooltipText = 'Low Risk Game';
    }
    if (game_mode === 'Spleesh!') {
      spleesh_public_bet_amount = (
        <>
          {convertToCurrency(spleesh_bet_unit)} -{' '}
          {convertToCurrency(spleesh_bet_unit * 10)}
        </>
      );
    } else if (game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(this.props.max_return);
    }

    return (
      <div className="summary-panel">
        <h3 className="game-sub-title">AI Summary</h3>
        <div className="summary-info">
          <div className="summary-item">
            <div className="summary-item-name">Expected Value</div>
            <div className="summary-item-value" style={{ color: valueColor, background: backgroundColor }}>
              {convertToCurrency(winChance) === -0
                ? convertToCurrency(0.0).toFixed(2)
                : convertToCurrency(winChance)}
              <Tooltip title={tooltipText}>
                {icon}
              </Tooltip>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name">Bet Amount</div>
            <div className="summary-item-value">
              {convertToCurrency(bet_amount)}
            </div>
          </div>
          
          {game_mode === 'RPS' && (
            <div className="summary-item">
              <div className="summary-item-name">Game Mode</div>
              <div className="summary-item-value">
                {rps_game_type === 0
                  ? 'Classic'
                  : rps_game_type === 1
                    ? 'RRPS'
                    : 'Other'}
              </div>
            </div>
          )}
           

          {game_mode === 'Quick Shoot' && (
            <div className="summary-item">
              <div className="summary-item-name">Game Mode</div>
              <div className="summary-item-value">{qs_game_type}</div>
            </div>
          )}
          <div className="summary-item">
              <div className="summary-item-name">Autoplay Strategy</div>
              <div className="summary-item-value">
                {selectedStrategy}
            </div>
            </div>
          {(game_mode === 'Quick Shoot') && (
            <div className="summary-item">
              <div className="summary-item-name">Public Bet Amount</div>
              <div className="summary-item-value">
                {convertToCurrency(public_bet_amount)}
              </div>
            </div>
          )}
          {(game_mode === 'Spleesh!') && (
            <div className="summary-item">
              <div className="summary-item-name">Public Bet Amount</div>
              <div className="summary-item-value">
                {convertToCurrency(spleesh_public_bet_amount)}
              </div>
            </div>
          )}
          {game_mode === 'Quick Shoot' && (
            <div className="summary-item">
              <div className="summary-item-name">Public Max Return</div>
              <div className="summary-item-value">{public_max_return}</div>
            </div>
          )}
          {game_mode === 'Bang!' ||
            (game_mode === 'Roll' && (
              <div className="summary-item">
                <div className="summary-item-name">Average Multiplier</div>
                <div className="summary-item-value">{aveMultiplier}x</div>
              </div>
            ))}
            
          <div className="summary-item">
            <div className="summary-item-name">TARGET ROI</div>
            <div className="summary-item-value">
              {convertToCurrency(max_return)}
            </div>
          </div>
          {endgame_type && (
            <div className="summary-item">
              <div className="summary-item-name">Payout</div>
              <div className="summary-item-value">
                {convertToCurrency(endgame_amount)}
              </div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name">Music</div>
            <div className="summary-item-value">
              {youtubeUrl ? youtubeUrl : 'No Music'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name">Background</div>
            <div className="summary-item-value">
              {gameBackground ? gameBackground : 'No Background'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name">Description</div>
            <div className="summary-item-value">
              {description ? description : 'No Description'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name">Privacy</div>
            <div className="summary-item-value">
              {is_private ? 'Private' : 'Public'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.step === 1) {
      return <></>;
    } else if (this.props.step === 5) {
      return this.total_summery();
    }
    return this.pre_summery();
  }
}

export default Summary;
