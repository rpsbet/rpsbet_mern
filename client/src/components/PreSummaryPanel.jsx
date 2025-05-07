import React, { useRef, useState, useEffect } from 'react';
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
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  Tooltip,
  Box,
  Typography,
  CircularProgress,
  IconButton,
  useTheme,
  useMediaQuery,
  Paper,
  ThemeProvider,
} from '@mui/material';
import { getCustomTheme } from '../config/theme';

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

  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Use custom theme
  const customTheme = getCustomTheme(isDarkMode);

  // Check scroll position to determine arrow visibility
  const checkScrollPosition = () => {
    const { current } = scrollContainerRef;
    if (current) {
      setShowLeftArrow(current.scrollLeft > 0);
      setShowRightArrow(current.scrollLeft < current.scrollWidth - current.clientWidth - 10);
      setScrollPosition(current.scrollLeft);
    }
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollPosition);
      checkScrollPosition();
    }
    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, []);

  // Handle scroll buttons
  const handleScroll = (direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const newPosition =
        direction === 'left' ? container.scrollLeft - scrollAmount : container.scrollLeft + scrollAmount;
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }
  };

  // Calculate returns for different game types
  const calculateQuickShootReturn = () => {
    if (qs_game_type && bet_amount) {
      return (bet_amount / (qs_game_type - 1) + parseFloat(bet_amount)) * (1 - (roomInfo.tax + 5) / 100);
    }
    return 0;
  };

  const calculateRPSReturn = () => {
    return bet_amount * 2 * ((100 - (roomInfo.tax + 5)) / 100);
  };

  // LikeDislikeBar component
  const LikeDislikeBar = ({ likes = 0, dislikes = 0 }) => {
    const total = likes + dislikes;
    const likePercentage = total > 0 ? (likes / total) * 100 : 50;
    const dislikePercentage = total > 0 ? (dislikes / total) * 100 : 50;

    return (
      <Box className="data-item" sx={{ minWidth: '180px' }}>
        <Typography
          variant="h6"
          className="label likes-dislikes"
          sx={{
            mb: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.secondary', // #CCCCCC
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={faBalanceScale} style={{ marginRight: 8 }} />
          Likes / Dislikes
        </Typography>
        {total === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontSize: '1rem',
              color: 'text.primary', // #ffffff
            }}
          >
            No votes yet
          </Typography>
        ) : (
          <Tooltip title={`${likes} likes, ${dislikes} dislikes (Total: ${total} votes)`}>
            <Box
              sx={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                className="like-dislike-bar"
                sx={{
                  width: '100%',
                  minWidth: 100,
                  maxWidth: 300,
                  height: 8,
                  display: 'flex',
                  overflow: 'hidden',
                  borderRadius: '4px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Box
                  sx={{
                    width: `${likePercentage}%`,
                    background: 'linear-gradient(to right, rgba(0, 255, 58, 0.7), rgba(0, 255, 58, 0.9))',
                    transition: 'width 0.3s ease',
                    height: '100%',
                  }}
                />
                <Box
                  sx={{
                    width: `${dislikePercentage}%`,
                    background: 'linear-gradient(to right, rgba(255, 0, 0, 0.7), rgba(255, 0, 0, 0.9))',
                    transition: 'width 0.3s ease',
                    height: '100%',
                  }}
                />
              </Box>
              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  };

  // DataCard component
  const DataCard = ({ icon, label, value, tooltip, warning = false, color = null, width = 180, children = null }) => {
    return (
      <Box
        className="data-item"
        sx={{
          minWidth: `${width}px`,
          borderRight: '1px solid rgba(255, 255, 255, 0.12)',
          px: 2,
          '&:last-child': {
            borderRight: 'none',
          },
        }}
      >
        <Typography
          variant="h6"
          className={`label ${label.toLowerCase().replace(/\s+/g, '-')}`}
          sx={{
            mb: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: 'text.secondary',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={icon} />
          {label}
        </Typography>
        <Tooltip title={tooltip} placement="top" arrow>
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {children || (
              <Typography
                variant="body1"
                className="value"
                sx={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: color || 'text.primary',
                }}
              >
                {value}
              </Typography>
            )}
            {warning ? (
              <WarningIcon sx={{ fontSize: 16, color: 'error.main' }} />
            ) : (
              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', opacity: 0.7 }} />
            )}
          </Box>
        </Tooltip>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          mb: 2,
          overflow: 'hidden', // Prevent outer scrollbar
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#ff0000',
            borderRadius: '4px',
            '&:hover': {
              background: '#cc0000',
            },
          },
          scrollbarColor: '#ff0000 rgba(255, 255, 255, 0.1)',
          scrollbarWidth: 'thin',
        }}
      >
        {/* Left scroll button */}
        {showLeftArrow && (
          <IconButton
            onClick={() => handleScroll('left')}
            sx={{
              position: 'absolute',
              left: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.85)',
              },
              width: 40,
              height: 40,
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </IconButton>
        )}

        {/* Right scroll button */}
        {showRightArrow && (
          <IconButton
            onClick={() => handleScroll('right')}
            sx={{
              position: 'absolute',
              right: 0,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              bgcolor: '_RGBA(0, 0, 0, 0.7)',
              backdropFilter: 'blur(5px)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.85)',
              },
              width: 40,
              height: 40,
              boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </IconButton>
        )}

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -8,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 1,
            overflow: 'hidden',
            mx: 2,
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: scrollContainerRef.current
                ? `${(scrollContainerRef.current.clientWidth / scrollContainerRef.current.scrollWidth) * 100}%`
                : '10%',
              bgcolor: 'primary.main',
              borderRadius: 1,
              transition: 'transform 0.1s ease-out',
              transform: scrollContainerRef.current
                ? `translateX(${(scrollPosition / scrollContainerRef.current.scrollWidth) * 100 * (scrollContainerRef.current.scrollWidth / scrollContainerRef.current.clientWidth)}%)`
                : 'translateX(0%)',
            }}
          />
        </Box>

        {/* Main scroll container */}
        <Paper
          elevation={3}
          sx={{
            bgcolor: 'rgb(17, 18, 19)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '16px 16px 0 0',
            overflow: 'hidden',
            '@supports not (backdrop-filter: blur(10px))': {
              bgcolor: 'rgba(30, 30, 30, 0.5)',
            },
          }}
        >
          <Box
            ref={scrollContainerRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              py: 2,
              '&::-webkit-scrollbar': {
                width: '8px',
                height: '8px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#ff0000',
                borderRadius: '4px',
                '&:hover': {
                  background: '#cc0000',
                },
              },
              scrollbarColor: '#ff0000 rgba(255, 255, 255, 0.1)',
              scrollbarWidth: 'thin',
            }}
          >
            {/* ROOM NAME */}
            <DataCard
              icon={faCat}
              label="Name / Ticker"
              value={`${roomInfo?.name} `}
              tooltip="Room name and associated ticker symbol"
              width={200}
            >
              <Typography sx={{ fontSize: '1rem', fontWeight: 500, color: 'text.primary' }}>
                {roomInfo?.name}{' '}
                <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'text.secondary' }}>
                  / ${roomInfo?.ticker}
                </span>
              </Typography>
            </DataCard>

            {/* LIQUIDITY */}
            <DataCard
              icon={faWater}
              label="Liquidity"
              value={`${parseFloat(bankroll).toFixed(3)} SOL`}
              tooltip={
                isLowBankroll
                  ? `Available liquidity: ${convertToCurrency(Number(bankroll), solPrice)} - Low liquidity may prevent bet execution`
                  : `Available liquidity: ${convertToCurrency(Number(bankroll), solPrice)}`
              }
              warning={isLowBankroll}
              color={isLowBankroll ? '#ff4444' : 'text.primary'}
            />

            {/* RETURN */}
            {roomInfo.game_type !== 'Custom' && (
              <DataCard
                icon={faDollarSign}
                label="Return"
                value={`${(roomInfo.game_type === 'Quick Shoot' ? calculateQuickShootReturn() : calculateRPSReturn()).toFixed(4)} SOL`}
                tooltip={
                  roomInfo.game_type === 'Quick Shoot'
                    ? 'Quick Shoot Return: (Bet / (Game Type - 1) + Bet) × (1 - Fees)'
                    : 'RPS Return: (Bet × 2) × (1 - Fees)'
                }
                color={
                  (roomInfo.game_type === 'Quick Shoot' ? calculateQuickShootReturn() : calculateRPSReturn()) > 0
                    ? '#03ff3b'
                    : '#ff0000'
                }
              />
            )}

            {/* HOST PROFIT */}
            <DataCard
              icon={faBalanceScale}
              label="Host Profit"
              value={isNaN(hostProfit - totalStakes) ? 'N/A' : convertToCurrency(hostProfit - totalStakes, solPrice)}
              tooltip="Net profit: Current bankroll - Initial bankroll"
              warning={!isLowProfit}
              color={isLowProfit ? '#03ff3b' : '#ff0000'}
            />

            {/* TAX */}
            <DataCard
              icon={faPercentage}
              label="Tax"
              value={roomInfo.tax < 1 ? '1%' : `${roomInfo.tax}%`}
              tooltip="Host's fees on winnings"
              warning={isHighCommission}
              color="text.primary"
            />

            {/* HEALTH */}
            <DataCard
              icon={faHandHoldingUsd}
              label="Health"
              tooltip="Room health percentage or Hard Cap value. At 0%, the game ends and converts to a tradeable token"
              width={150}
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
                    sx={{
                      fontSize: '0.6rem',
                      fontWeight: 'bold',
                      color: 'text.primary',
                    }}
                  >
                    {`${Math.round(100 - payoutPercentage)}%`}
                  </Typography>
                </Box>
              </Box>
            </DataCard>

            {/* BATTLES */}
            <DataCard
              icon={faShieldAlt}
              label="Battles"
              value={battles}
              tooltip="Total number of battles conducted in this room"
              color="text.primary"
            />

            {/* LIKES / DISLIKES */}
            <LikeDislikeBar likes={roomInfo?.likes?.length || 0} dislikes={roomInfo?.dislikes?.length || 0} />

            {/* WIN CHANCE */}
            {roomInfo.game_type !== 'Custom' && (
              <DataCard
                icon={faDice}
                label="Win Chance"
                value={`${winChance}%`}
                tooltip="Estimated probability of winning based on game mechanics"
                color="text.primary"
              />
            )}

            {/* STAKING REWARDS */}
            <DataCard
              icon={faCoins}
              label="Staking Rewards"
              value={convertToCurrency(pr, solPrice)}
              tooltip="Rewards distributed every 3 hours at 0.0001% of bankroll for public rooms"
              color="#00fff5"
            />

            {/* CREATOR */}
            <DataCard
              icon={faUser}
              label="Creator"
              tooltip="Profile of the user who created this room"
              width={150}
            >
              <Box onClick={() => handleOpenPlayerModal(creator_id)} sx={{ cursor: 'pointer' }}>
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
              </Box>
            </DataCard>

            {/* STATUS */}
            <DataCard
              icon={faInfoCircle}
              label="Status"
              value={status}
              tooltip="Current operational status of the room (e.g., Open, Paused, Finished)"
              color="text.primary"
            />

            {/* CREATED */}
            <DataCard
              icon={faCalendarAlt}
              label="Created"
              value={Moment(roomInfo?.created_at).fromNow()}
              tooltip="Timestamp of when the room was created"
              color="text.primary"
            />

            {/* GAME TYPE */}
            <DataCard
              icon={faRobot}
              label="Game Type"
              value={roomInfo?.game_type}
              tooltip="Type of game"
              color="text.primary"
            />

            {/* ROOM ID */}
            <DataCard
              icon={faSortNumericUp}
              label="ID"
              value={roomInfo?.room_name}
              tooltip="Unique identifier for this room"
              color="text.primary"
            />
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
};

export default PreSummaryPanel;