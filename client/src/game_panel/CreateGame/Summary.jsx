import React, { useState, useEffect } from 'react';
import { convertToCurrency } from '../../util/conversion';
import { Warning, Info, CheckCircle } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

const Summary = (props) => {
  const [winChance, setWinChance] = useState(props.game_mode === 'RPS' ? 33 : 0);

  useEffect(() => {
    if (props.game_mode === 'RPS') {
      setWinChance(33);
    } else if (props.game_mode === 'Quick Shoot') {
      setWinChance(15);
    }
  }, [props.game_mode]);

  const preSummary = () => {
    const { solPrice, max_prize, max_return, bet_amount, game_mode } = props;
    let public_max_return = convertToCurrency(max_prize, solPrice);

    if (game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(max_return, solPrice);
    } else if (game_mode === 'RPS') {
      public_max_return = convertToCurrency(bet_amount, solPrice);
    }

    return (
      <div className="pre-summary-panel title">
        <div className="data-item">
          <div className="label your-bet-amount">YOUR BET</div>
          <div className="value">{convertToCurrency(bet_amount, solPrice)}</div>
        </div>
        <div className="data-item">
          <div className="label your-max-return">TARGET ROI</div>
          <div className="value">{convertToCurrency(max_return, solPrice)}</div>
        </div>
        <div className="data-item">
          <div className="label win-chance">Expected Value</div>
          <div className="value">
            {convertToCurrency(props.winChance, solPrice) === -0
              ? convertToCurrency(0.0).toFixed(2)
              : convertToCurrency(props.winChance, solPrice)}
          </div>
        </div>
      </div>
    );
  };

  const totalSummary = () => {
    const {
      qs_game_type,
      solPrice,
      bet_amount,
      max_return,
      max_prize,
      public_bet_amount,
      game_mode,
      is_private,
      ticker,
      endgame_amount,
      endgame_type,
      selectedStrategy,
      description,
      winChance,
    } = props;

    const isNegative = winChance < 0;
    const isPositive = winChance > 0;

    const valueColor = isNegative ? '#ff0000' : isPositive ? 'rgb(40, 167, 69)' : 'default';
    const backgroundColor = isNegative
      ? '#ff000033'
      : isPositive
      ? 'rgba(40, 167, 69, 0.3)'
      : 'default';

    const icon = isNegative ? (
      <Warning style={{ width: '10pt', cursor: 'pointer', marginLeft: '5px' }} />
    ) : isPositive ? (
      <CheckCircle style={{ width: '10pt', cursor: 'pointer', marginLeft: '5px' }} />
    ) : (
      <Info style={{ width: '10pt', cursor: 'pointer', marginLeft: '5px' }} />
    );

    const tooltipText = isNegative
      ? 'High Risk Game'
      : isPositive
      ? 'Low Risk Game'
      : 'Zero (Neutral Fairness)';

    let public_max_return = convertToCurrency(max_prize, solPrice);

    if (game_mode === 'Quick Shoot') {
      public_max_return = convertToCurrency(props.max_return, solPrice);
    }

    return (
      <div className="summary-panel ">
        <h3 className="game-sub-title">Room Summary</h3>
        <div className="summary-info">
          <div className="summary-item">
            <div className="summary-item-name title">Expected Value</div>
            <div className="summary-item-value" style={{ color: valueColor, background: backgroundColor }}>
              {winChance === -0 ? (0.0).toFixed(2) : winChance}
              <Tooltip title={tooltipText}>{icon}</Tooltip>
            </div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name title">Bet Amount</div>
            <div className="summary-item-value">{convertToCurrency(bet_amount, solPrice)}</div>
          </div>
          {game_mode === 'Quick Shoot' && (
            <>
              <div className="summary-item">
                <div className="summary-item-name title">Game Mode</div>
                <div className="summary-item-value">{qs_game_type}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-name title">Public Bet Amount</div>
                <div className="summary-item-value">{convertToCurrency(public_bet_amount, solPrice)}</div>
              </div>
              <div className="summary-item">
                <div className="summary-item-name title">Public Max Return</div>
                <div className="summary-item-value">{convertToCurrency(public_max_return, solPrice)}</div>
              </div>
            </>
          )}
          <div className="summary-item">
            <div className="summary-item-name title">TARGET ROI</div>
            <div className="summary-item-value">{convertToCurrency(max_return, solPrice)}</div>
          </div>
          {endgame_type && (
            <div className="summary-item">
              <div className="summary-item-name title">Payout</div>
              <div className="summary-item-value">{convertToCurrency(endgame_amount, solPrice)}</div>
            </div>
          )}
          <div className="summary-item">
            <div className="summary-item-name title">AI Play Strategy</div>
            <div className="summary-item-value">{selectedStrategy}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name title">Description</div>
            <div className="summary-item-value">{description || 'No Description'}</div>
          </div>
          <div className="summary-item">
            <div className="summary-item-name title">Privacy</div>
            <div className="summary-item-value">{is_private ? 'Private' : 'Public'}</div>
          </div>
        </div>
      </div>
    );
  };

  if (props.step === 2) {
    return <></>;
  } else if (props.step === 3) {
    return totalSummary();
  }
  return preSummary();
};

export default Summary;