import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import moment from 'moment';
import './style.css';
import {
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { convertToCurrency } from '../../../../util/conversion';
import { updateDigitToPoint2 } from '../../../../util/helper';

/**
 * Functional component version of StatisticsForm without chart and filters.
 */
const StatisticsForm = (props) => {
  const {
    creditScore: initialCreditScore = 0,
    gamePlayed,
    totalWagered,
    totalTraded,
    dateJoined,
    last_seen,
    gameProfit,
    tradingProfit,
    message,
    title,
    barStyle,
    color,
    solPrice,
    rank // user rank (if passed as props)
  } = props;

  // ----- State -----
  const [creditScore, setCreditScore] = useState(initialCreditScore);
  const [hexagon, setHexagon] = useState(null);

  // ----- Side Effects -----
  // Equivalent to componentDidMount & update when `props.creditScore` changes
  useEffect(() => {
    if (typeof initialCreditScore === 'number') {
      updateHexagon(initialCreditScore);
    }
  }, [initialCreditScore]);

  useEffect(() => {
    if (typeof props.creditScore === 'number') {
      updateHexagon(props.creditScore);
    }
  }, [props.creditScore]);

  // ----- Helper Functions -----
  /**
   * Returns dash offset for the hexagon stroke based on creditScore range.
   */
  const calculateDashOffset = (score) => {
    if (typeof score !== 'number') return NaN;
    // For creditScore 900..2000 => offset 390..0
    const scalingFactor = 390 / (2000 - 900);
    const invertedScore = 2000 - score;
    return invertedScore * scalingFactor;
  };

  const getHexagonColor = (score) => {
    if (score < 1000) return 'red';
    if (score === 1000) return 'white';
    return 'green';
  };

  /**
   * Renders a polygon that visually indicates creditScore progress.
   */
  const renderProgressHexagon = (score) => {
    if (typeof score !== 'number') return null;
    const dashOffset = calculateDashOffset(score);
    return (
      <polygon
        points="60,15 105,40 105,80 60,105 15,80 15,40"
        className={`progress-hexagon ${getHexagonColor(score)}`}
        style={{ strokeDashoffset: dashOffset }}
      />
    );
  };

  /**
   * Sets credit score and hexagon in state.
   */
  const updateHexagon = (score) => {
    setCreditScore(score);
    setHexagon(renderProgressHexagon(score));
  };

  /**
   * Log-scale rank calculation based on totalWagered.
   */
  const getRank = (amount) => {
    // 1) Calculate raw rank (0-based)
    const raw = Math.log2(amount + 1) / 1.2;
    const rankFloor = Math.floor(raw) + 1; // Add +1 to match the pure function
    const nextRank = rankFloor + 1;

    // 2) Thresholds for linear progress
    const thresholdForThisRank =
      rankFloor > 1 ? Math.pow(2, 1.2 * (rankFloor - 1)) - 1 : 0;
    const thresholdForNextRank = Math.pow(2, 1.2 * rankFloor) - 1;

    // 3) fraction => portion between [rankFloor .. nextRank]
    let fraction =
      (amount - thresholdForThisRank) /
      (thresholdForNextRank - thresholdForThisRank);
    fraction = Math.max(0, Math.min(1, fraction));

    // 4) Convert fraction => percentage
    const percent = (fraction * 100).toFixed(2);

    return (
      <div style={{ margin: '10px 0' }}>
        {/* Progress bar outer container */}
        <div className="custom-progress-bar-outer">
          {/* Filled portion */}
          <div
            className="custom-progress-bar-filled"
            style={{ width: `${percent}%` }}
          />
          {/* Single centered label */}
          <div className="custom-progress-bar-label">
            {percent}%
          </div>
        </div>

        {/* Ranks below the bar */}
        <div className="custom-rank-row">
          <span className="custom-rank-left">{rankFloor}</span>
          <span className="custom-rank-right">{nextRank}</span>
        </div>
      </div>
    );
};

  // ----- Computed Values -----
  const date_joined = moment(dateJoined);
  const lastSeen = moment(last_seen);
  const joinedAgo = date_joined.fromNow();
  const lastSeenAgo = lastSeen.fromNow();
  const roundedCreditScore = Math.ceil(creditScore);

  // ----- Render -----
  return (
    <ChartDivEl>
      {/* BREAKDOWN Section */}
      <div className="rank-badge">
      <Typography sx={{textAlign: 'center'}}>BREAKDOWN</Typography>
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <b style={{ opacity: '0.6', fontSize: '0.9em', fontWeight: '500' }}>
                  LAST SEEN
                </b>
              </TableCell>
              <TableCell align="right" sx={{ color: '#ff8500' }}>
                {lastSeenAgo}
              </TableCell>
            </TableRow>
            <TableRow>
              {/* <TableCell>
                <b style={{ opacity: '0.6', fontSize: '0.9em', fontWeight: '500' }}>
                  JOINED
                </b>
              </TableCell>
              <TableCell align="right" sx={{ color: '#ff8500' }}>
                {joinedAgo}
              </TableCell> */}
            </TableRow>
            <TableRow>
              <TableCell>
                <b style={{ opacity: '0.6', fontSize: '0.9em', fontWeight: '500' }}>
                  RANK
                </b>
              </TableCell>
              <TableCell sx={{ display: 'flex', justifyContent: 'end' }}>
                <div>{getRank(rank)}</div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <b style={{ opacity: '0.6', fontSize: '0.9em', fontWeight: '500' }}>
                  SPENDING
                </b>
              </TableCell>
              <TableCell>
                <div className="hexagon">
                  <div className="hex-content">
                    <h2 style={{ color }}>{title}</h2>
                    <div className="payout-bar">
                      <div className="value" style={barStyle}></div>
                    </div>
                    <div className="message">
                      {message}{' '}
                      <Tooltip
                        title="Calculated using your average wager and All-Time-High"
                        placement="top"
                      >
                        <span style={{ padding: '5px', cursor: 'pointer' }}>
                          <InfoIcon style={{ width: '12px' }} />
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <b style={{ opacity: '0.6', fontSize: '0.9em', fontWeight: '500' }}>
                  CREDIT SCORE
                </b>
              </TableCell>
              <TableCell>
                <div className="creditScore">
                  <svg className="dial" width="120" height="120">
                    <svg width="120" height="120">{hexagon}</svg>
                    <text
                      x="50%"
                      y="40%"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="creditScoreStatus"
                      style={{ fill: '#ff8500' }}
                    >
                      {roundedCreditScore >= 1000 && roundedCreditScore <= 1500 && 'OK'}
                      {roundedCreditScore > 1500 && roundedCreditScore <= 2000 && 'HIGH'}
                      {roundedCreditScore < 1000 && 'BAD'}
                    </text>
                    <text
                      x="50%"
                      y="60%"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                      className="creditScoreValue"
                      style={{ fill: '#ff8500' }}
                    >
                      {roundedCreditScore} / 2000
                    </text>
                  </svg>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* PERFORMANCE Table (no filters, no chart) */}
      <div className="statistics-container">
        <div>
          <div className="statistics-panel">
            <Typography sx={{textAlign: 'center'}}>PERFORMANCE</Typography>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="label">Games Played</TableCell>
                  <TableCell className="value" align="right">
                    {gamePlayed}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="label">Total Wagered</TableCell>
                  <TableCell className="value" align="right">
                    {convertToCurrency(totalWagered, solPrice)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="label">Total Traded</TableCell>
                  <TableCell className="value" align="right">
                    {convertToCurrency(totalTraded, solPrice)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="label">Game Profit</TableCell>
                  <TableCell className="value" align="right">
                    {convertToCurrency(gameProfit, solPrice)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="label">Trading Profit</TableCell>
                  <TableCell className="value" align="right">
                    {convertToCurrency(tradingProfit, solPrice)}
                  </TableCell>
                </TableRow>
                
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </ChartDivEl>
  );
};

export default StatisticsForm;

/* ---- STYLES ---- */
const ChartDivEl = styled.div`
  grid-area: Charts;
  justify-self: center;
  width: 100%;
  align-items: center;
`;
