import React, { Component } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { Warning, Info, CheckCircle } from '@material-ui/icons';
import { Tooltip } from '@material-ui/core';

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
    }
  }

  pre_summery() {
    let public_max_return = convertToCurrency(this.props.max_prize);
    if (this.props.game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(this.props.max_return);
    } else if (this.props.game_mode === 'RPS') {
      public_max_return = convertToCurrency(this.props.bet_amount);
    }

    return (
      <div className="pre-summary-panel title">
        <div className="data-item">
          <div className="label your-bet-amount">YOUR BET</div>
          <div className="value">
            {convertToCurrency(this.props.bet_amount)}
          </div>
        </div>
        <div className="data-item">
          <div className="label your-max-return">TARGET ROI</div>
          <div className="value">
            {convertToCurrency(this.props.max_return)}
          </div>
        </div>

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
      } else if (this.props.game_mode === 'Quick Shoot') {
        this.setState({ winChance: 15 });
      }
    }
  }

  total_summery() {
    const {
      rps_game_type,
      qs_game_type,
      name,
      ticker,
      x_link,
      image,
      website_link,
      telegram_link,
      bet_amount,
      winChance,
      max_return,
      public_bet_amount,
      max_prize,
      game_mode,
      is_private,
      endgame_amount,
      endgame_type,
      selectedStrategy,
      description
    } = this.props;
    let public_max_return = <> {convertToCurrency(max_prize)} </>;

    const isNegative = winChance < 0;
    const isPositive = winChance > 0;

    let valueColor = 'default';
    let backgroundColor = 'default';
    let icon = <Info style={{ width: "10pt", cursor: "pointer", marginLeft: "5px" }} />;
    let tooltipText = 'Zero (Neutral Fairness)';

    if (isNegative) {
      valueColor = '#ff0000';
      backgroundColor = '#ff000033';
      icon = <Warning style={{ width: "10pt", cursor: "pointer", marginLeft: "5px" }} />;
      tooltipText = 'High Risk Game';
    } else if (isPositive) {
      valueColor = 'rgb(40, 167, 69)';
      backgroundColor = 'rgba(40, 167, 69, 0.3)';
      icon = <CheckCircle style={{ width: "10pt", cursor: "pointer", marginLeft: "5px" }} />;
      tooltipText = 'Low Risk Game';
    }
    if (game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(this.props.max_return);
    }

    return (
      <div className="summary-panel glass-container">
        <h3 className="game-sub-title">Room Summary</h3>
        <div className="summary-info">
          <div className="summary-item">
            <div className="summary-item-name title">Expected Value</div>
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
            <div className="summary-item-name title">Bet Amount</div>
            <div className="summary-item-value">
              {convertToCurrency(bet_amount)}
            </div>
          </div>

          {game_mode === 'Quick Shoot' && (
            <div className="summary-item">
              <div className="summary-item-name title">Game Mode</div>
              <div className="summary-item-value">{qs_game_type}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name title">AI Play Strategy</div>
            <div className="summary-item-value">
              {selectedStrategy}
            </div>
          </div>
          {(game_mode === 'Quick Shoot') && (
            <div className="summary-item">
              <div className="summary-item-name title">Public Bet Amount</div>
              <div className="summary-item-value">
                {convertToCurrency(public_bet_amount)}
              </div>
            </div>
          )}

          {game_mode === 'Quick Shoot' && (
            <div className="summary-item">
              <div className="summary-item-name title">Public Max Return</div>
              <div className="summary-item-value">{public_max_return}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name title">TARGET ROI</div>
            <div className="summary-item-value">
              {convertToCurrency(max_return)}
            </div>
          </div>
          {endgame_type && (
            <div className="summary-item">
              <div className="summary-item-name title">Payout</div>
              <div className="summary-item-value">
                {convertToCurrency(endgame_amount)}
              </div>
            </div>
          )}

          <div className="summary-item">
            <div className="summary-item-name title">Description</div>
            <div className="summary-item-value">
              {description ? description : 'No Description'}
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name title">Privacy</div>
            <div className="summary-item-value">
              {is_private ? 'Private' : 'Public'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  render() {
    if (this.props.step === 2) {
      return <></>;
    } else if (this.props.step === 3) {
      return this.total_summery();
    }
    return this.pre_summery();
  }
}

export default Summary;
