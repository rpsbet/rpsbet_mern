import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import Avatar from './Avatar';
import { convertToCurrency } from '../util/conversion';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { formatDistanceToNow, isValid } from 'date-fns';

import {
  faInfoCircle,
  faWater,
  faDollarSign,
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
  Chip,
} from '@mui/material';
import { getCustomTheme } from '../config/theme';

const PreSummaryPanel = React.memo((props) => {
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
    pr,
    bet_amount,
  } = props;

  const scrollContainerRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Memoize custom theme to prevent unnecessary re-creation
  const customTheme = useMemo(() => getCustomTheme(isDarkMode), [isDarkMode]);

  // Memoize calculated values
  const memoizedValues = useMemo(() => {
    const netProfit = isNaN(hostProfit - totalStakes) ? 'N/A' : convertToCurrency(hostProfit - totalStakes, solPrice);
    const liquidityValue = `${parseFloat(bankroll).toFixed(3)} SOL`;
    const liquidityTooltip = isLowBankroll
      ? `Available liquidity: ${convertToCurrency(Number(bankroll), solPrice)} - Low liquidity may prevent bet execution`
      : `Available liquidity: ${convertToCurrency(Number(bankroll), solPrice)}`;
    const taxDisplay = roomInfo.tax < 1 ? '1%' : `${roomInfo.tax}%`;
    const healthPercentage = Math.round(100 - payoutPercentage);
    const createdDate = roomInfo?.created_at && isValid(new Date(roomInfo.created_at))
      ? formatDistanceToNow(new Date(roomInfo.created_at), { addSuffix: true })
      : 'Invalid Date';
    const stakingRewards = convertToCurrency(pr, solPrice);

    return {
      netProfit,
      liquidityValue,
      liquidityTooltip,
      taxDisplay,
      healthPercentage,
      createdDate,
      stakingRewards,
    };
  }, [hostProfit, totalStakes, solPrice, bankroll, isLowBankroll, roomInfo.tax, payoutPercentage, roomInfo?.created_at, pr]);

  // Memoized scroll position check
  const checkScrollPosition = useCallback(() => {
    const { current } = scrollContainerRef;
    if (current) {
      const isAtStart = current.scrollLeft <= 0;
      const isAtEnd = current.scrollLeft >= current.scrollWidth - current.clientWidth - 10;
      
      setShowLeftArrow(!isAtStart);
      setShowRightArrow(!isAtEnd);
      setScrollPosition(current.scrollLeft);
    }
  }, []);

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
  }, [checkScrollPosition]);

  // Optimized scroll handler
  const handleScroll = useCallback((direction) => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.75;
      const newPosition = direction === 'left' 
        ? container.scrollLeft - scrollAmount 
        : container.scrollLeft + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  // Clean DataCard component
  const DataCard = React.memo(({ icon, label, value, tooltip, warning = false, children = null }) => {
    return (
      <Box
        sx={{
          minWidth: '140px',
          padding: '8px 12px',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          '&:last-child': {
            borderRight: 'none',
          },
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            mb: 0.5,
          }}
        >
          {label}
        </Typography>
        <Tooltip title={tooltip} arrow>
          <Box
            sx={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            {children || (
              <Typography
                variant="body2"
                sx={{
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: warning ? '#ff9800' : '#fff',
                  letterSpacing: '0.3px',
                }}
              >
                {value}
              </Typography>
            )}
            {warning && (
              <WarningIcon sx={{ fontSize: 12, color: '#ff9800' }} />
            )}
          </Box>
        </Tooltip>
      </Box>
    );
  });

  // Clean Sentiment component
  const SentimentCard = React.memo(() => {
    const likes = roomInfo?.likes?.length || 0;
    const dislikes = roomInfo?.dislikes?.length || 0;
    const total = likes + dislikes;
    const likePercentage = total > 0 ? (likes / total) * 100 : 50;

    return (
      <Box
        sx={{
          minWidth: '160px',
          padding: '8px 12px',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'block',
            mb: 0.5,
          }}
        >
          Sentiment
        </Typography>
        {total === 0 ? (
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.8rem',
              color: 'rgba(255, 255, 255, 0.5)',
              fontStyle: 'italic',
            }}
          >
            No votes
          </Typography>
        ) : (
          <Tooltip title={`${likes} likes, ${dislikes} dislikes`} arrow>
            <Box sx={{ cursor: 'pointer' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 600, fontSize: '0.7rem' }}>
                  {likes} 👍
                </Typography>
                <Typography variant="caption" sx={{ color: '#f44336', fontWeight: 600, fontSize: '0.7rem' }}>
                  👎 {dislikes}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 4,
                  display: 'flex',
                  overflow: 'hidden',
                  borderRadius: '2px',
                  background: 'rgba(255, 255, 255, 0.1)',
                }}
              >
                <Box
                  sx={{
                    width: `${likePercentage}%`,
                    background: '#4caf50',
                    transition: 'width 0.3s ease',
                    height: '100%',
                  }}
                />
                <Box
                  sx={{
                    width: `${100 - likePercentage}%`,
                    background: '#f44336',
                    transition: 'width 0.3s ease',
                    height: '100%',
                  }}
                />
              </Box>
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  });

  const handleCreatorClick = useCallback(() => {
    handleOpenPlayerModal(creator_id);
  }, [handleOpenPlayerModal, creator_id]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'active':
        return '#4caf50';
      case 'paused':
        return '#ff9800';
      case 'finished':
      case 'ended':
        return '#f44336';
      default:
        return '#2196f3';
    }
  };

  return (
    <ThemeProvider theme={customTheme}>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          mb: 2,
          overflow: 'hidden',
        }}
      >
        {/* Scroll buttons */}
        {showLeftArrow && (
          <IconButton
            onClick={() => handleScroll('left')}
            sx={{
              position: 'absolute',
              left: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 28,
              height: 28,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '12px' }} />
          </IconButton>
        )}

        {showRightArrow && (
          <IconButton
            onClick={() => handleScroll('right')}
            sx={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              width: 28,
              height: 28,
              bgcolor: 'rgba(0, 0, 0, 0.6)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.8)',
              },
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '12px' }} />
          </IconButton>
        )}

        {/* Main container */}
        <Box
          sx={{
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            overflow: 'hidden',
          }}
        >
          <Box
            ref={scrollContainerRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '4px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '2px',
              },
            }}
          >
            {/* Token Details */}
            <Box
              sx={{
                minWidth: '180px',
                padding: '8px 12px',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Token
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: '#ffffff' }}>
                  {roomInfo?.name}
                </Typography>
                <Chip
                  label={`$${roomInfo?.ticker}`}
                  size="small"
                  sx={{
                    backgroundColor: 'rgba(255, 0, 0, 0.2)',
                    color: '#ff0000',
                    fontWeight: 600,
                    fontSize: '0.6rem',
                    height: 16,
                    alignSelf: 'flex-start',
                    border: '1px solid rgba(255, 0, 0, 0.3)',
                    '& .MuiChip-label': {
                      padding: '0 4px',
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Liquidity */}
            <DataCard
              label="Liquidity"
              value={memoizedValues.liquidityValue}
              tooltip={memoizedValues.liquidityTooltip}
              warning={isLowBankroll}
            />

            {/* Tax */}
            <Box
              sx={{
                minWidth: '120px',
                padding: '8px 12px',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Fee
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: isHighCommission ? '#ff9800' : '#ffffff',
                  }}
                >
                  {memoizedValues.taxDisplay}
                </Typography>
                {isHighCommission && (
                  <Chip
                    label="HIGH"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 152, 0, 0.2)',
                      color: '#ff9800',
                      fontWeight: 600,
                      fontSize: '0.55rem',
                      height: 14,
                      border: '1px solid rgba(255, 152, 0, 0.3)',
                      '& .MuiChip-label': {
                        padding: '0 3px',
                      },
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Health */}
            <Box
              sx={{
                minWidth: '140px',
                padding: '8px 12px',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Health
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box position="relative" display="inline-flex">
                  <CircularProgress
                    variant="determinate"
                    value={100 - payoutPercentage}
                    sx={{
                      color: memoizedValues.healthPercentage > 70 
                        ? '#4caf50' 
                        : memoizedValues.healthPercentage > 40 
                          ? '#ff9800' 
                          : '#f44336',
                    }}
                    size={24}
                    thickness={6}
                  />
                  <Box
                    sx={{
                      top: 0,
                      left: 0,
                      bottom: 0,
                      right: 0,
                      position: 'absolute',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.55rem',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {`${memoizedValues.healthPercentage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: memoizedValues.healthPercentage > 70 
                      ? '#4caf50' 
                      : memoizedValues.healthPercentage > 40 
                        ? '#ff9800' 
                        : '#f44336',
                  }}
                >
                  {memoizedValues.healthPercentage > 70 
                    ? 'Good' 
                    : memoizedValues.healthPercentage > 40 
                      ? 'OK' 
                      : 'Low'}
                </Typography>
              </Box>
            </Box>

            {/* Battles */}
            <DataCard
              label="Battles"
              value={battles}
              tooltip="Total number of battles conducted in this room"
            />

            {/* Sentiment */}
            <SentimentCard />

            {/* Staking Rewards */}
            <DataCard
              label="Rewards"
              value={memoizedValues.stakingRewards}
              tooltip="Rewards distributed every 3 hours at 0.0001% of bankroll for public rooms"
            />

            {/* Creator */}
            <Box
              sx={{
                minWidth: '120px',
                padding: '8px 12px',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Creator
              </Typography>
              <Box 
                onClick={handleCreatorClick} 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'scale(1.05)',
                  }
                }}
              >
                <Avatar
                  src={roomInfo.hosts[0]?.avatar || creator_avatar}
                  user_id={creator_id}
                  username={username}
                  rank={roomInfo.hosts[0]?.rank}
                  accessory={accessory}
                  elite={roomInfo.hosts[0]?.elite}
                  alt=""
                  darkMode={isDarkMode}
                  sx={{
                    width: 28,
                    height: 28,
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              </Box>
            </Box>

            {/* Status */}
            <Box
              sx={{
                minWidth: '100px',
                padding: '8px 12px',
                borderRight: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.6)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  mb: 0.5,
                }}
              >
                Status
              </Typography>
              <Chip
                label={status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(status),
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.6rem',
                  height: 16,
                  textTransform: 'uppercase',
                  '& .MuiChip-label': {
                    padding: '0 4px',
                  },
                }}
              />
            </Box>

            {/* Created */}
            <DataCard
              label="Created"
              value={memoizedValues.createdDate}
              tooltip="Timestamp of when the room was created"
            />

            {/* Game Type */}
            <DataCard
              label="Type"
              value={roomInfo?.game_type}
              tooltip="Type of game mechanism used in this room"
            />

            {/* Room ID */}
            <DataCard
              label="ID"
              value={roomInfo?.room_name}
              tooltip="Unique identifier for this room"
            />
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
});

PreSummaryPanel.displayName = 'PreSummaryPanel';

export default PreSummaryPanel;