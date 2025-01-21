import React from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import Avatar from './Avatar';
import { convertToCurrency } from '../util/conversion';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBuilding,
  faInfoCircle,
  faWater,
  faDollarSign,
  faDice,
  faBalanceScale,
  faPercentage,
  faHandHoldingUsd,
  faCoins, faUser,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import {
  Stack,
  Tooltip,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';

const PreSummaryPanel = (props) => {
  const {
    status,
    bankroll,
    isLowBankroll,
    cp,
    isHighCommission,
    payoutPercentage,
    roomInfo,
    isDarkMode,
    hostProfit,
    totalStakes,
    isLowProfit,
    handleOpenPlayerModal,
    creator_id,
    creator_avatar,
    username,
    rank,
    accessory,
    isQbot,
    solPrice,
    winChance,
    rps_game_type,
    endgame_type,
    qs_game_type,
    pr,
    bet_amount,
  } = props;

  const calculateQuickShootReturn = () => {
    if (qs_game_type && bet_amount) {
      return (
        (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) *
        (1 - (cp + 2.5) / 100) -
        bet_amount
      );
    }
    return 0;
  };

  const calculateRPSReturn = () => {
    return bet_amount * 2 * ((100 - (cp + 2.5)) / 100) - bet_amount;
  };

  return (
    <Stack direction="row" spacing={2}>
      <Box className="pre-summary-panel title">

        <Box className="data-item">
          <Typography variant="body2" className="label room-name">
            <FontAwesomeIcon icon={faBuilding} style={{ marginRight: 8 }} /> Room Name
          </Typography>
          <Typography variant="body1" className="value">{roomInfo?.name}</Typography>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label room-id">
            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 8 }} />STATUS
          </Typography>
          <Typography variant="body1" className="value">{status}</Typography>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label">
            <FontAwesomeIcon icon={faWater} style={{ marginRight: 8 }} />LIQUIDITY
          </Typography>
          <Tooltip title={
            isLowBankroll
              ? `${parseFloat((Number(bankroll) || 0).toFixed(4))} SOL — LOW BANKROLL CAN CAUSE A BET TO FAIL`
              : `${parseFloat((Number(bankroll) || 0).toFixed(3))} SOL`
          }>
            <div
              className={`value ${isLowBankroll ? 'red-text' : ''}`}
              style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              {convertToCurrency(bankroll, solPrice)}
              {!isLowBankroll ? (
                <InfoIcon fontSize="small" sx={{ ml: 1 }} />
              ) : (
                <WarningIcon fontSize="small" sx={{ ml: 1 }} />
              )}
            </div>
          </Tooltip>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label your-max-return">
            <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: 8 }} />Your Return
          </Typography>
          <Tooltip
            title={
              roomInfo.game_type === 'Quick Shoot' ?
                (<div>
                  <span>EXPLANATION: </span>
                  <p>Quick Shoot logic: (Bet Amount / (qs_game_type - 1) + Bet Amount), minus commission ({cp}%) and platform tax (2.5%).</p>
                  <span>CALCULATION: </span>
                  <div>{convertToCurrency(bet_amount, solPrice)} / ({qs_game_type - 1}) + {convertToCurrency(bet_amount, solPrice)} =
                    {convertToCurrency(bet_amount / (qs_game_type - 1) + bet_amount, solPrice)}</div>
                  <div>-({cp} + 2.5)% = {convertToCurrency(calculateQuickShootReturn(), solPrice)}</div>
                </div>) :
                (<div>
                  <span>EXPLANATION: </span>
                  <p>2x your Bet Amount, then deduct Host(s)'s(') commission, if any, (which is Returned to Bankroll or RTB) and finally deduct 2.5% platform tax.</p>
                  <span>CALCULATION: </span>
                  <div>{convertToCurrency(bet_amount, solPrice)} x 2 = {convertToCurrency(bet_amount * 2, solPrice)}</div>
                  <div>-({cp} + 2.5)% = {convertToCurrency(calculateRPSReturn(), solPrice)}</div>
                </div>)
            }
          >
            <div className="value" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: (roomInfo.game_type === 'Quick Shoot' ? calculateQuickShootReturn() : calculateRPSReturn()) > 0 ? '#00ff3a' : 'red' }}>
              {convertToCurrency(roomInfo.game_type === 'Quick Shoot' ? calculateQuickShootReturn() : calculateRPSReturn(), solPrice)}
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </div>
          </Tooltip>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label chance">
            <FontAwesomeIcon icon={faDice} style={{ marginRight: 8 }} />Win Chance
          </Typography>
          <Typography variant="body1" className="value">{winChance}%</Typography>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label net-profit">
            <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: 8 }} />Room Profit
          </Typography>
          <Tooltip title="Current bankroll + Payouts - Initial bankroll">
            <div
              className="value"
              style={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <span className={`value ${isLowProfit ? 'green-text' : 'red-text'}`}>
                {isNaN(hostProfit - totalStakes)
                  ? 'N/A'
                  : convertToCurrency(hostProfit - totalStakes, solPrice)}
              </span>
              {isLowProfit ? (
                <InfoIcon sx={{ color: '#00ff3a', fontSize: 16, ml: 1 }} />
              ) : (
                <WarningIcon sx={{ color: 'red', fontSize: 16, ml: 1 }} />
              )}
            </div>
          </Tooltip>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label commission">
            <FontAwesomeIcon icon={faPercentage} style={{ marginRight: 8 }} />Tax
          </Typography>
          <Tooltip title="Host's Accessory's Commission Power (CP) - Player's Accessory's Battle Power (BP) (MINIMUM 2.5% TOWARDS PLATFORM)">
            <div
              style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}
            >
              <Typography variant="body1" className={`value ${isHighCommission ? 'red-text' : ''}`} sx={{ display: 'flex', alignItems: 'center' }}>
                {cp < 1 ? '1%' : `${cp}%`}
                {!isHighCommission ? (
                  <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
                ) : (
                  <WarningIcon sx={{ color: 'red', fontSize: 16, ml: 1 }} />
                )}
              </Typography>
            </div>
          </Tooltip>
        </Box>

        {endgame_type && (
          <Box className="data-item">
          <Typography variant="body2" className="label created">
            <FontAwesomeIcon icon={faHandHoldingUsd} style={{ marginRight: 8 }} />Auto-Payout
          </Typography>
          <Tooltip title="Automatic dividends paid out to Hosts & CoHosts upon meeting the set payout threshold">
            <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", marginBottom: '-7.5px', marginRight: '-20px'}}>
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={payoutPercentage}
                  color="secondary"
                  size={35}  // Smaller size
                  thickness={4}  // Adjust thickness if necessary
                />
                <Box
                  top={0}
                  left={0}
                  bottom={0}
                  right={0}
                  position="absolute"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Typography variant="caption" component="div" sx={{ fontSize: '0.6em', fontWeight: 'bold'}}>
                    {`${payoutPercentage}%`}
                  </Typography>
                </Box>
              </Box>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </div>
          </Tooltip>
        </Box>
        )}

        <Box className="data-item">
          <Typography variant="body2" className="label public-interest">
            <FontAwesomeIcon icon={faCoins} style={{ marginRight: 8 }} />Interest Received
          </Typography>
          <Typography variant="body1" className="value">
            <Tooltip title="Paid every 33 minutes, at a rate of 0.00001% of the bankroll. Room must be public.">
              <div style={{ cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center" }}>
                <span style={{ color: "#00fff5" }}>
                  {convertToCurrency(pr, solPrice)}
                </span>
                <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
              </div>
            </Tooltip>
          </Typography>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label host-display-name">
            <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />Creator
          </Typography>
          <div className="value host">
            <a className="player" onClick={() => handleOpenPlayerModal(creator_id)}>
              <Avatar className="avatar" src={creator_avatar} username={username} rank={rank} accessory={accessory} alt="" darkMode={isDarkMode} />
            </a>
            {isQbot && (
              <span style={{ fontSize: "xx-small", position: "absolute", top: "65px", border: "1px solid rgb(255, 208, 0)", background: "linear-gradient(45deg, #7a5958, #a27955)", borderRadius: "4px", color: "rgb(255, 208, 0)", padding: "0px 5px", lineHeight: "20px", marginLeft: "7.5px" }}>
                Q-BOT
              </span>
            )}
          </div>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label public-max-return">
            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 8 }} />Created
          </Typography>
          <Typography variant="body1" className="value">
            {Moment(roomInfo?.created_at).fromNow()}
          </Typography>
        </Box>
      </Box>
    </Stack>
  );
};

export default PreSummaryPanel;