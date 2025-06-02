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
      // Check initial position
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

  // Memoized LikeDislikeBar component
  const LikeDislikeBar = React.memo(({ likes = 0, dislikes = 0 }) => {
    const total = likes + dislikes;
    const likePercentage = total > 0 ? (likes / total) * 100 : 50;
    const dislikePercentage = total > 0 ? (dislikes / total) * 100 : 50;

    return (
      <Box
        className="data-item"
        sx={{
          minWidth: '200px',
          px: 3,
          py: 2.5,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          '&:last-child': {
            borderRight: 'none',
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={faBalanceScale} style={{ fontSize: '12px' }} />
          Community Sentiment
        </Typography>
        {total === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.6)',
                fontStyle: 'italic',
              }}
            >
              No votes yet
            </Typography>
            <InfoIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.4)' }} />
          </Box>
        ) : (
          <Tooltip title={`${likes} likes, ${dislikes} dislikes (Total: ${total} votes)`} arrow>
            <Box
              sx={{
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: 1.5,
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600, fontSize: '0.85rem' }}>
                  {likes} 👍
                </Typography>
                <Typography variant="body2" sx={{ color: '#f44336', fontWeight: 600, fontSize: '0.85rem' }}>
                  👎 {dislikes}
                </Typography>
              </Box>
              <Box
                sx={{
                  width: '100%',
                  height: 8,
                  display: 'flex',
                  overflow: 'hidden',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                <Box
                  sx={{
                    width: `${likePercentage}%`,
                    background: 'linear-gradient(90deg, #4caf50, #66bb6a)',
                    transition: 'width 0.3s ease',
                    height: '100%',
                    boxShadow: '0 0 8px rgba(76, 175, 80, 0.4)',
                  }}
                />
                <Box
                  sx={{
                    width: `${dislikePercentage}%`,
                    background: 'linear-gradient(90deg, #f44336, #ef5350)',
                    transition: 'width 0.3s ease',
                    height: '100%',
                    boxShadow: '0 0 8px rgba(244, 67, 54, 0.4)',
                  }}
                />
              </Box>
            </Box>
          </Tooltip>
        )}
      </Box>
    );
  });

  // Memoized DataCard component
  const DataCard = React.memo(({ icon, label, value, tooltip, warning = false, color = null, width = 180, children = null }) => {
    return (
      <Box
        className="data-item"
        sx={{
          minWidth: `${width}px`,
          px: 3,
          py: 2.5,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'all 0.2s ease',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
          },
          '&:last-child': {
            borderRight: 'none',
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'rgba(255, 255, 255, 0.7)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <FontAwesomeIcon icon={icon} style={{ fontSize: '12px' }} />
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
                sx={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  // color: color || '#ffffff',
                  letterSpacing: '0.3px',
                }}
              >
                {value}
              </Typography>
            )}
            {warning ? (
              <WarningIcon sx={{ fontSize: 18, color: '#ff9800' }} />
            ) : (
              <InfoIcon sx={{ fontSize: 16, color: 'rgba(255, 255, 255, 0.4)' }} />
            )}
          </Box>
        </Tooltip>
      </Box>
    );
  });

  // Memoized scroll indicator calculation
  const scrollIndicatorStyle = useMemo(() => {
    if (!scrollContainerRef.current) return { width: '10%', transform: 'translateX(0%)' };
    
    const container = scrollContainerRef.current;
    const widthPercentage = (container.clientWidth / container.scrollWidth) * 100;
    const transformPercentage = (scrollPosition / container.scrollWidth) * 100 * (container.scrollWidth / container.clientWidth);
    
    return {
      width: `${widthPercentage}%`,
      transform: `translateX(${transformPercentage}%)`,
    };
  }, [scrollPosition]);

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
          mb: 3,
          overflow: 'hidden',
        }}
      >
        {/* Left scroll button */}
        {showLeftArrow && (
          <IconButton
            onClick={() => handleScroll('left')}
            sx={{
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                transform: 'translateY(-50%) scale(1.05)',
              },
              width: 44,
              height: 44,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ fontSize: '16px' }} />
          </IconButton>
        )}

        {/* Right scroll button */}
        {showRightArrow && (
          <IconButton
            onClick={() => handleScroll('right')}
            sx={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 20,
              bgcolor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.9)',
                transform: 'translateY(-50%) scale(1.05)',
              },
              width: 44,
              height: 44,
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            <FontAwesomeIcon icon={faChevronRight} style={{ fontSize: '16px' }} />
          </IconButton>
        )}

        {/* Scroll indicator */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            bgcolor: 'rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            zIndex: 10,
          }}
        >
          <Box
            sx={{
              height: '100%',
              bgcolor: '#f44336',
              transition: 'transform 0.1s ease-out',
              boxShadow: '0 0 8px rgba(244, 67, 54, 0.6)',
              ...scrollIndicatorStyle,
            }}
          />
        </Box>

        {/* Main scroll container */}
        <Paper
          elevation={0}
          sx={{
            background: 'rgba(0, 0, 0, 0.15)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            '@supports not (backdrop-filter: blur(20px))': {
              background: 'rgba(0, 0, 0, 0.35)',
            },
          }}
        >
          <Box
            ref={scrollContainerRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              '&::-webkit-scrollbar': {
                height: '6px',
              },
             
            }}
          >
            {/* ROOM NAME */}
            <DataCard
              icon={faCat}
              label="Token Details"
              tooltip="Room name and associated ticker symbol"
              width={220}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                  {roomInfo?.name}
                </Typography>
                <Chip
                  label={`$${roomInfo?.ticker}`}
                  size="small"
                  sx={{
                    backgroundColor: '#f44336',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 20,
                    alignSelf: 'flex-start',
                  }}
                />
              </Box>
            </DataCard>

            {/* LIQUIDITY */}
            <DataCard
              icon={faWater}
              label="Liquidity Pool"
              value={memoizedValues.liquidityValue}
              tooltip={memoizedValues.liquidityTooltip}
              warning={isLowBankroll}
              color={isLowBankroll ? '#f44336' : '#2196f3'}
              width={180}
            />

            {/* HOST PROFIT */}
            <DataCard
              icon={faBalanceScale}
              label="Host Performance"
              value={memoizedValues.netProfit}
              tooltip="Net profit: Current bankroll - Initial bankroll"
              warning={!isLowProfit}
              color={isLowProfit ? '#4caf50' : '#f44336'}
              width={200}
            />

            {/* TAX */}
            <DataCard
              icon={faPercentage}
              label="Fee Structure"
              tooltip="Host's fees on winnings"
              warning={isHighCommission}
              width={160}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  variant="body1"
                  sx={{
                    fontSize: '1rem',
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
                      backgroundColor: '#ff9800',
                      color: '#000',
                      fontWeight: 700,
                      fontSize: '0.6rem',
                      height: 18,
                    }}
                  />
                )}
              </Box>
            </DataCard>

            {/* HEALTH */}
            <DataCard
              icon={faHandHoldingUsd}
              label="Token Health"
              tooltip="Room health percentage. At 0%, the game ends and converts to a tradeable token"
              width={180}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                    size={40}
                    thickness={5}
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
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: '#ffffff',
                      }}
                    >
                      {`${memoizedValues.healthPercentage}%`}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={
                    memoizedValues.healthPercentage > 70 
                      ? 'Excellent' 
                      : memoizedValues.healthPercentage > 40 
                        ? 'Moderate' 
                        : 'Critical'
                  }
                  size="small"
                  sx={{
                    backgroundColor: memoizedValues.healthPercentage > 70 
                      ? '#4caf50' 
                      : memoizedValues.healthPercentage > 40 
                        ? '#ff9800' 
                        : '#f44336',
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </DataCard>

            {/* BATTLES */}
            <DataCard
              icon={faShieldAlt}
              label="Battle Count"
              value={battles}
              tooltip="Total number of battles conducted in this room"
              color="#9c27b0"
              width={160}
            />

            {/* LIKES / DISLIKES */}
            <LikeDislikeBar likes={roomInfo?.likes?.length || 0} dislikes={roomInfo?.dislikes?.length || 0} />

            {/* STAKING REWARDS */}
            <DataCard
              icon={faCoins}
              label="Staking Rewards"
              value={memoizedValues.stakingRewards}
              tooltip="Rewards distributed every 3 hours at 0.0001% of bankroll for public rooms"
              color="#00bcd4"
              width={200}
            />

            {/* CREATOR */}
            <DataCard
              icon={faUser}
              label="Room Creator"
              tooltip="Profile of the user who created this room"
              width={180}
            >
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
                  src={creator_avatar}
                  user_id={creator_id}
                  username={username}
                  rank={rank}
                  accessory={accessory}
                  elite={elite}
                  alt=""
                  darkMode={isDarkMode}
                  sx={{
                    width: 44,
                    height: 44,
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                  }}
                />
              </Box>
            </DataCard>

            {/* STATUS */}
            <DataCard
              icon={faInfoCircle}
              label="Room Status"
              tooltip="Current operational status of the room"
              width={160}
            >
              <Chip
                label={status}
                size="small"
                sx={{
                  backgroundColor: getStatusColor(status),
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              />
            </DataCard>

            {/* CREATED */}
            <DataCard
              icon={faCalendarAlt}
              label="Created Date"
              value={memoizedValues.createdDate}
              tooltip="Timestamp of when the room was created"
              color="#795548"
              width={180}
            />

            {/* GAME TYPE */}
            <DataCard
              icon={faRobot}
              label="Game Mode"
              value={roomInfo?.game_type}
              tooltip="Type of game mechanism used in this room"
              color="#673ab7"
              width={160}
            />

            {/* ROOM ID */}
            <DataCard
              icon={faSortNumericUp}
              label="Room ID"
              value={roomInfo?.room_name}
              tooltip="Unique identifier for this room"
              color="#607d8b"
              width={160}
            />
          </Box>
        </Paper>
      </Box>
    </ThemeProvider>
  );
});

PreSummaryPanel.displayName = 'PreSummaryPanel';

export default PreSummaryPanel;