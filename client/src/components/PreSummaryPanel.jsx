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
  faCoins,
  faUser,
  faCalendarAlt,
  faSortNumericUp,
  faRobot,
  faCat,
  faShieldAlt,
} from '@fortawesome/free-solid-svg-icons';
import {
  Stack,
  Tooltip,
  Box,
  Typography,
  CircularProgress,
} from '@mui/material';

const PreSummaryPanel = (props) => {
  const {
    status,
    bankroll,
    isLowBankroll,
    isHighCommission,
    payoutPercentage,
    roomInfo,
    isDarkMode,
    hostProfit,
    battles,
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
          (1 - (roomInfo.tax + 2.5) / 100) -
        bet_amount
      );
    }
    return 0;
  };

  const calculateRPSReturn = () => {
    return bet_amount * 2 * ((100 - (roomInfo.tax + 2.5)) / 100) - bet_amount;
  };

  return (
    <Stack direction="row" spacing={2}>
      <Box
        className="pre-summary-panel title"
        sx={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none', // For Firefox
          msOverflowStyle: 'none', // For IE and Edge
          overflow: 'hidden', // This will prevent content from being scrollable at all
        }}
      >
        {/* ROOM NAME */}
        <Box className="data-item">
          <Typography variant="body2" className="label room-name">
            <FontAwesomeIcon icon={faCat} style={{ marginRight: 8 }} /> Name /
            Ticker
          </Typography>
          {/* Tooltip + info icon for the value */}
          <Tooltip title="This is the name of the room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {roomInfo?.name}{' '}
                <span style={{ fontSize: 'x-small' }}>
                  / ${roomInfo?.ticker}
                </span>
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>
        {/* STRATEGY */}
        <Box className="data-item">
          <Typography variant="body2" className="label room-name">
            <FontAwesomeIcon icon={faRobot} style={{ marginRight: 8 }} /> MODEL
          </Typography>
          {/* Tooltip + info icon for the value */}
          <Tooltip title="This is the AI Model of the room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography id="ai_mode" variant="body1" className="value">
                {roomInfo?.selectedStrategy}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* BATTLES */}
        <Box className="data-item">
          <Typography variant="body2" className="label room-name">
            <FontAwesomeIcon icon={faShieldAlt} style={{ marginRight: 8 }} />{' '}
            BATTLES
          </Typography>
          {/* Tooltip + info icon for the value */}
          <Tooltip title="This is the number of battles of this room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {battles}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* LIQUIDITY (already has a tooltip + icon logic) */}
        <Box className="data-item">
          <Typography variant="body2" className="label">
            <FontAwesomeIcon icon={faWater} style={{ marginRight: 8 }} />
            LIQUIDITY
          </Typography>
          <Tooltip
            title={
              isLowBankroll
                ? `${parseFloat((Number(bankroll) || 0).toFixed(4))} SOL — LOW BANKROLL CAN CAUSE A BET TO FAIL`
                : `${parseFloat((Number(bankroll) || 0).toFixed(3))} SOL`
            }
          >
            <Box
              className={`value ${isLowBankroll ? 'red-text' : ''}`}
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              {convertToCurrency(bankroll, solPrice)}
              {!isLowBankroll ? (
                <InfoIcon fontSize="small" sx={{ ml: 1 }} />
              ) : (
                <WarningIcon fontSize="small" sx={{ ml: 1 }} />
              )}
            </Box>
          </Tooltip>
        </Box>

        {/* YOUR RETURN (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="body2" className="label your-max-return">
            <FontAwesomeIcon icon={faDollarSign} style={{ marginRight: 8 }} />
            Your Return
          </Typography>
          <Tooltip
            title={
              roomInfo.game_type === 'Quick Shoot' ? (
                <div>
                  <span>EXPLANATION: </span>
                  <p>
                    Quick Shoot logic: (Bet Amount / (QS Game Type - 1) + Bet
                    Amount), minus commission ({roomInfo.tax}%) and platform tax
                    (2.5%).
                  </p>
                  <span>CALCULATION: </span>
                  <div>
                    {convertToCurrency(bet_amount, solPrice)} / (
                    {qs_game_type - 1}) +{' '}
                    {convertToCurrency(bet_amount, solPrice)} =
                    {convertToCurrency(
                      bet_amount / (qs_game_type - 1) + bet_amount,
                      solPrice,
                    )}
                  </div>
                  <div>
                    -({roomInfo.tax} + 2.5)% ={' '}
                    {convertToCurrency(calculateQuickShootReturn(), solPrice)}
                  </div>
                </div>
              ) : (
                <div>
                  <span>EXPLANATION: </span>
                  <p>
                    2x your Bet Amount, then deduct Host(s)'s(') commission
                    (RTB), finally 2.5% platform tax.
                  </p>
                  <span>CALCULATION: </span>
                  <div>
                    {convertToCurrency(bet_amount, solPrice)} x 2 ={' '}
                    {convertToCurrency(bet_amount * 2, solPrice)}
                  </div>
                  <div>
                    -({roomInfo.tax} + 2.5)% ={' '}
                    {convertToCurrency(calculateRPSReturn(), solPrice)}
                  </div>
                </div>
              )
            }
          >
            <Box
              className="value"
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color:
                  (roomInfo.game_type === 'Quick Shoot'
                    ? calculateQuickShootReturn()
                    : calculateRPSReturn()) > 0
                    ? '#00ff3a'
                    : 'red',
              }}
            >
              {convertToCurrency(
                roomInfo.game_type === 'Quick Shoot'
                  ? calculateQuickShootReturn()
                  : calculateRPSReturn(),
                solPrice,
              )}
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* ROOM PROFIT (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="body2" className="label net-profit">
            <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: 8 }} />
            Room Profit
          </Typography>
          <Tooltip title="Current bankroll + Payouts - Initial bankroll">
            <Box
              className="value"
              sx={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body1"
                className={`value ${isLowProfit ? 'green-text' : 'red-text'}`}
                sx={{ mr: 1 }}
              >
                {isNaN(hostProfit - totalStakes)
                  ? 'N/A'
                  : convertToCurrency(hostProfit - totalStakes, solPrice)}
              </Typography>
              {isLowProfit ? (
                <InfoIcon sx={{ color: '#00ff3a', fontSize: 16 }} />
              ) : (
                <WarningIcon sx={{ color: 'red', fontSize: 16 }} />
              )}
            </Box>
          </Tooltip>
        </Box>

        {/* TAX (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="body2" className="label commission">
            <FontAwesomeIcon icon={faPercentage} style={{ marginRight: 8 }} />
            Tax
          </Typography>
          <Tooltip title="Host's Room Tax. Minimum 2.5% goes to the platform.">
            <Box
              sx={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Typography
                variant="body1"
                className={`value ${isHighCommission ? 'red-text' : ''}`}
                sx={{ display: 'flex', alignItems: 'center' }}
              >
                {roomInfo.tax < 1 ? '1%' : `${roomInfo.tax}%`}
                {!isHighCommission ? (
                  <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
                ) : (
                  <WarningIcon sx={{ color: 'red', fontSize: 16, ml: 1 }} />
                )}
              </Typography>
            </Box>
          </Tooltip>
        </Box>

        <Box className="data-item">
          <Typography variant="body2" className="label created">
            <FontAwesomeIcon
              icon={faHandHoldingUsd}
              style={{ marginRight: 8 }}
            />
            Hard Cap
          </Typography>
          <Tooltip title="Automatic dividends paid to Hosts & CoHosts upon reaching the payout threshold.">
            <Box
              sx={{
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: '-7.5px',
                mr: '-20px',
              }}
            >
              <Box position="relative" display="inline-flex">
                <CircularProgress
                  variant="determinate"
                  value={payoutPercentage}
                  color="error"
                  size={35}
                  thickness={4}
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
                  <Typography
                    variant="caption"
                    component="div"
                    sx={{ fontSize: '0.6em', fontWeight: 'bold' }}
                  >
                    {`${payoutPercentage}%`}
                  </Typography>
                </Box>
              </Box>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* WIN CHANCE */}
        <Box className="data-item">
          <Typography variant="body2" className="label chance">
            <FontAwesomeIcon icon={faDice} style={{ marginRight: 8 }} />
            Win Chance
          </Typography>
          {/* Add a tooltip + info icon for the value */}
          <Tooltip title="Probability of winning each battle, based on your strategy or random factors.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {winChance}%
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* INTEREST RECEIVED (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="body2" className="label public-interest">
            <FontAwesomeIcon icon={faCoins} style={{ marginRight: 8 }} />
            Staking Rewards
          </Typography>
          <Typography variant="body1" className="value" component="div">
            <Tooltip title="Paid every 3 hours at 0.0001% of the bankroll if the room is public.">
              <Box
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography component="span" sx={{ color: '#00fff5' }}>
                  {convertToCurrency(pr, solPrice)}
                </Typography>
                <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
              </Box>
            </Tooltip>
          </Typography>
        </Box>

        {/* CREATOR */}
        <Box className="data-item">
          <Typography variant="body2" className="label host-display-name">
            <FontAwesomeIcon icon={faUser} style={{ marginRight: 8 }} />
            Dev
          </Typography>
          <Tooltip title="The user who created this room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <a
                className="player"
                onClick={() => handleOpenPlayerModal(creator_id)}
                style={{ textDecoration: 'none' }}
              >
                <Avatar
                  className="avatar"
                  src={creator_avatar}
                  user_id={creator_id}
                  username={username}
                  rank={rank}
                  accessory={accessory}
                  alt=""
                  darkMode={isDarkMode}
                />
              </a>
              {isQbot && (
                <span
                  style={{
                    fontSize: 'xx-small',
                    position: 'absolute',
                    top: '65px',
                    border: '1px solid rgb(255, 208, 0)',
                    background: 'linear-gradient(45deg, #7a5958, #a27955)',
                    borderRadius: '4px',
                    color: 'rgb(255, 208, 0)',
                    padding: '0px 5px',
                    lineHeight: '20px',
                    marginLeft: '7.5px',
                  }}
                >
                  Q-BOT
                </span>
              )}
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* STATUS */}
        <Box className="data-item">
          <Typography variant="body2" className="label room-id">
            <FontAwesomeIcon icon={faInfoCircle} style={{ marginRight: 8 }} />
            STATUS
          </Typography>
          <Tooltip title="The current status of this room (e.g., open, finished, etc.)">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {status}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* CREATED */}
        <Box className="data-item">
          <Typography variant="body2" className="label public-max-return">
            <FontAwesomeIcon icon={faCalendarAlt} style={{ marginRight: 8 }} />
            Created
          </Typography>
          <Tooltip title="When this room was created.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {Moment(roomInfo?.created_at).fromNow()}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* ROOM ID */}
        <Box className="data-item">
          <Typography variant="body2" className="label room-name">
            <FontAwesomeIcon
              icon={faSortNumericUp}
              style={{ marginRight: 8 }}
            />{' '}
            ID
          </Typography>
          {/* Tooltip + info icon for the value */}
          <Tooltip title="This is the ID of the room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography variant="body1" className="value">
                {roomInfo?.room_name}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>
      </Box>
    </Stack>
  );
};

export default PreSummaryPanel;
