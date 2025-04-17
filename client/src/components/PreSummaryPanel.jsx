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
    elite,
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
        (1 - (roomInfo.tax + 5) / 100) -
        bet_amount
      );
    }
    return 0;
  };

  const calculateRPSReturn = () => {
    return bet_amount * 2 * ((100 - (roomInfo.tax + 5)) / 100) - bet_amount;
  };

  const LikeDislikeBar = ({ likes = 0, dislikes = 0 }) => {
    // Calculate total and percentages
    const total = likes + dislikes;
    const likePercentage = total > 0 ? (likes / total) * 100 : 50; // Default to 50% if no votes
    const dislikePercentage = total > 0 ? (dislikes / total) * 100 : 50;
  
    return (
      <Box className="data-item" >
        {/* Label (unchanged) */}
        <Typography variant="h6" className="label likes-dislikes" sx={{ mb: 1 }}>
          <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: 8 }} />
          Likes / Dislikes
        </Typography>
  
        {/* Like/Dislike Bar with Info Icon and Tooltip */}
        <Tooltip
          title={`Likes: ${likes} | Dislikes: ${dislikes} | Total votes: ${total}`}
        >
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1, // Space between bar and icon
            }}
          >
            {/* Bar Container */}
            <Box
              className="like-dislike-bar"
              sx={{
                width: '100%',
                maxWidth: 300, // Adjust as needed
                height: 10,
                display: 'flex',
                overflow: 'hidden',
                borderRadius: '0.3em',
              }}
            >
              {/* Likes Segment */}
              <Box
                sx={{
                  width: `${likePercentage}%`,
                  background: 'rgba(0, 255, 0, 0.5)', // Green for likes
                  transition: 'width 0.3s ease',
                }}
              />
              {/* Dislikes Segment */}
              <Box
                sx={{
                  width: `${dislikePercentage}%`,
                  background: 'rgba(255, 0, 0, 0.5)', // Red for dislikes
                  transition: 'width 0.3s ease',
                }}
              />
            </Box>
            {/* Info Icon */}
            <InfoIcon sx={{ fontSize: 16 }} />
          </Box>
        </Tooltip>
      </Box>
    );
  };
  

  return (
    <Stack direction="row" spacing={2}>
      <Box
        className="pre-summary-panel title"
        sx={{
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          '@supports not (backdrop-filter: blur(10px))': {
            background: 'rgba(0, 0, 0, 0.4)',
          },
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overflow: 'hidden',
        }}
      >
        {/* ROOM NAME */}
        <Box className="data-item">
          <Typography variant="h6" className="label room-name">
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
          <Typography variant="h6" className="label room-name">
            <FontAwesomeIcon icon={faRobot} style={{ marginRight: 8 }} /> Game-Type
          </Typography>
          {/* Tooltip + info icon for the value */}
          <Tooltip title="This is the Game-Type of the room.">
            <Box
              sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Typography id="ai_mode" variant="body1" className="value">
                {roomInfo?.game_type}
              </Typography>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* LIQUIDITY (already has a tooltip + icon logic) */}
        <Box className="data-item">
          <Typography variant="h6" className="label">
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

        {roomInfo.game_type !== 'Custom' && (

          < Box className="data-item">
            <Typography variant="h6" className="label your-max-return">
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
                      (1%).
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
                      -({roomInfo.tax} + 1)% ={' '}
                      {convertToCurrency(calculateQuickShootReturn(), solPrice)}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span>EXPLANATION: </span>
                    <p>
                      2x your Bet Amount, then deduct Host(s)'s(') commission
                      (RTB), finally 1% platform tax.
                    </p>
                    <span>CALCULATION: </span>
                    <div>
                      {convertToCurrency(bet_amount, solPrice)} x 2 ={' '}
                      {convertToCurrency(bet_amount * 2, solPrice)}
                    </div>
                    <div>
                      -({roomInfo.tax} + 1)% ={' '}
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
        )}

        {/* ROOM PROFIT (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="h6" className="label net-profit">
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
          <Typography variant="h6" className="label commission">
            <FontAwesomeIcon icon={faPercentage} style={{ marginRight: 8 }} />
            Tax
          </Typography>
          <Tooltip title="Host's Room Tax. Minimum 1% goes to the platform.">
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
          <Typography variant="h6" className="label created">
            <FontAwesomeIcon
              icon={faHandHoldingUsd}
              style={{ marginRight: 8 }}
            />
            HEALTH
          </Typography>
          <Tooltip title="WHEN THIS GOES TO 0% THE GAME DIES AND IS CONVERTED TO A TRADEABLE TOKEN">
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
                  value={100 - payoutPercentage}
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
                    {`${100 - payoutPercentage}%`}
                  </Typography>
                </Box>
              </Box>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* BATTLES */}
        <Box className="data-item">
          <Typography variant="h6" className="label room-name">
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

        {/* LIKES / DISLIKES */}
        <LikeDislikeBar
          likes={roomInfo?.likes?.length || 0}
          dislikes={roomInfo?.dislikes?.length || 0}
        />

        {/* WIN CHANCE */}
        {roomInfo.game_type !== 'Custom' && (
          <Box className="data-item">
            <Typography variant="h6" className="label chance">
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
        )}

        {/* INTEREST RECEIVED (already has a tooltip) */}
        <Box className="data-item">
          <Typography variant="h6" className="label public-interest">
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
          <Typography variant="h6" className="label host-display-name">
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
                  elite={elite}
                  alt=""
                  darkMode={isDarkMode}
                />
              </a>
              <InfoIcon sx={{ fontSize: 16, ml: 1 }} />
            </Box>
          </Tooltip>
        </Box>

        {/* STATUS */}
        <Box className="data-item">
          <Typography variant="h6" className="label room-id">
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
          <Typography variant="h6" className="label public-max-return">
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
          <Typography variant="h6" className="label room-name">
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
    </Stack >
  );
};

export default PreSummaryPanel;
