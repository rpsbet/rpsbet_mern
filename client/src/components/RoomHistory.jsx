import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';


import {
  Box,
  CircularProgress,
  Typography,
} from '@mui/material';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { convertToCurrency } from '../util/conversion';
import Avatar from './Avatar';

const INITIAL_LIMIT = 10;           // how many logs to fetch initially
const INFINITE_SCROLL_OFFSET = 50; // px from bottom to trigger next load

const customFromNow = (date) => {
  const now = new Date();
  const dateObj = new Date(date);

  if (!isValid(dateObj)) return 'Invalid Date';

  const seconds = differenceInSeconds(now, dateObj);
  if (seconds < 60) return `${Math.round(seconds)}s ago`;

  const minutes = differenceInMinutes(now, dateObj);
  if (minutes < 60) return `${Math.round(minutes)}m ago`;

  const hours = differenceInHours(now, dateObj);
  if (hours < 24) return `${Math.round(hours)}h ago`;

  const days = differenceInDays(now, dateObj);
  return `${Math.round(days)}d ago`;
};

function RoomHistory({
  socket: propSocket,
  roomInfo: propRoomInfo,
  getRoomInfo,
  roomId,
  isLowGraphics: propIsLowGraphics,
  loading: propLoading,
  userId: propUserId,
  solPrice: propSolPrice,
}) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const {
    socket,
    roomInfo,
    isLowGraphics,
    loading,
    userId,
    solPrice,
  } = useSelector((state) => ({
    socket: state.auth.socket,
    roomInfo: state.logic.curRoomInfo, // Assuming this is where roomInfo is stored; adjust if different
    isLowGraphics: state.auth.isLowGraphics,
    loading: state.logic.isActiveLoadingOverlay,
    userId: state.auth.user?._id,
    solPrice: state.logic.solPrice,
  }));

  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveSocket = propSocket !== undefined ? propSocket : socket;
  const effectiveRoomInfo = propRoomInfo !== undefined ? propRoomInfo : roomInfo;
  const effectiveIsLowGraphics = propIsLowGraphics !== undefined ? propIsLowGraphics : isLowGraphics;
  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveUserId = propUserId !== undefined ? propUserId : userId;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  // Local State
  const [rawHistory, setRawHistory] = useState(effectiveRoomInfo?.room_history || []);
  const [displayHistory, setDisplayHistory] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [numToShow, setNumToShow] = useState(INITIAL_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);

  const isComponentMounted = useRef(false);
  const containerRef = useRef(null);

  // Lifecycle & Effects
  useEffect(() => {
    isComponentMounted.current = true;
    setupSocketConnection();
    fetchInitialLogs();

    return () => {
      isComponentMounted.current = false;
      disconnectSocket();
    };
  }, [effectiveSocket, roomId, getRoomInfo]); // Dependencies updated

  useEffect(() => {
    setRawHistory(effectiveRoomInfo?.room_history || []);
  }, [effectiveRoomInfo]);

  useEffect(() => {
    if (!rawHistory || rawHistory.length === 0) {
      setDisplayHistory([]);
      return;
    }

    const updated = rawHistory.map((log) => {
      const finalMsg = buildRoomHistoryMessage(log, effectiveSolPrice);
      return {
        ...log,
        finalMsg,
        from_now: customFromNow(log.created_at),
      };
    });

    setDisplayHistory(updated);
  }, [rawHistory, effectiveSolPrice]);

  // Socket Setup
  const setupSocketConnection = () => {
    if (effectiveSocket) {
      effectiveSocket.on('NEW_LOG', handleNewLog);
    } else {
      retrySocketConnection();
    }
  };

  const disconnectSocket = () => {
    if (effectiveSocket) {
      effectiveSocket.off('NEW_LOG', handleNewLog);
    }
  };

  const retrySocketConnection = () => {
    setTimeout(() => {
      if (effectiveSocket) {
        effectiveSocket.on('NEW_LOG', handleNewLog);
      } else {
        retrySocketConnection();
      }
    }, 1000);
  };

  // Initial & Infinite Scroll
  const fetchInitialLogs = async () => {
    try {
      setLoadingMore(true);
      await dispatch(getRoomInfo(roomId, INITIAL_LIMIT)); // Dispatch if action creator
    } catch (err) {
      console.error('Error fetching initial logs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(
    async (e) => {
      if (loadingMore) return;
      if (!effectiveRoomInfo || !effectiveRoomInfo.totalGameLogsCount) return;

      const container = e.target;
      const scrollPosition = container.scrollTop + container.clientHeight;
      const scrollHeight = container.scrollHeight;

      if (scrollHeight - scrollPosition <= INFINITE_SCROLL_OFFSET) {
        if (rawHistory.length < effectiveRoomInfo.totalGameLogsCount) {
          await loadMoreLogs();
        }
      }
    },
    [loadingMore, effectiveRoomInfo, rawHistory.length, roomId, getRoomInfo],
  );

  const loadMoreLogs = async () => {
    try {
      setLoadingMore(true);
      const newNumToShow = numToShow + 10;
      await dispatch(getRoomInfo(roomId, newNumToShow));
      setNumToShow(newNumToShow);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // Socket "NEW_LOG" Handler
  const handleNewLog = (data) => {
    if (!isComponentMounted.current) return;

    const newLogArray = data?.newLog;
    if (!Array.isArray(newLogArray) || newLogArray.length === 0) return;

    const filteredLogs = newLogArray.filter((log) => {
      const thisLogRoomId = log.room?._id;
      return thisLogRoomId === roomId;
    });

    if (filteredLogs.length === 0) {
      return;
    }

    setRawHistory((prev) => {
      const updated = [...filteredLogs, ...prev];
      return updated.slice(0, 30);
    });
  };

  // Build the Final Message with JSX
  const buildRoomHistoryMessage = (row, solPrice) => {
    if (!solPrice) {
      return 'Loading price...';
    }
    if (!row) return null;

    const betAmt = row.bet_amount ?? 0;
    const winnings = row.winnings ?? 0;
    const userBet = row.user_bet ?? 0;
    const endgame = row.endgame_amount ?? 0;

    const betAmtStr = convertToCurrency(betAmt, solPrice);
    const winningsStr = convertToCurrency(winnings, solPrice);
    const userBetStr = convertToCurrency(userBet, solPrice);

    const shortName = row.room?.short_name || '???';
    const roomNumber = row.room?.room_number || '???';
    const displayRoom = `(${row.room?.ticker})`;

    const joinedUser = row.joined_user || {};
    const creator = row.creator || {};

    const renderRoomInfo = (roomObj) => {
      if (!roomObj._id) return null;
      return (
        <Box
          component="a"
          href={`/join/${roomObj._id}`}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            textDecoration: 'none',
            padding: '4px 8px',
            borderRadius: 1,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
          className="room"
        >
          <img
            src={roomObj.image}
            alt={roomObj.image}
            className="game-type-icon"
            style={{ 
              width: '16px',
              height: '16px',
              borderRadius: '2px',
            }}
          />
          <Typography variant="body2" sx={{ color: '#ccc', fontSize: '0.8rem' }}>
            {displayRoom}
          </Typography>
        </Box>
      );
    };

    const renderUserAvatar = (userObj) => {
      if (!userObj._id) return null;
      return (
        <Box
          component="a"
          onClick={() => handleOpenPlayerModal(userObj._id)}
          sx={{ 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            '&:hover': {
              opacity: 0.8,
            },
          }}
          className="player"
        >
          <Avatar
            src={userObj.avatar}
            username={userObj.username}
            rank={userObj.totalWagered}
            user_id={userObj._id}
            accessory={userObj.accessory}
            elite={userObj.elite}
            alt=""
            className="avatar"
            style={{ 
              display: 'inline-block',
              width: '28px',
              height: '28px',
            }}
          />
        </Box>
      );
    };

    switch (row.action) {
      case 'won': {
        const totalWinStr = convertToCurrency(winnings, solPrice);
        const betAmountStr = convertToCurrency(betAmt, solPrice);
        const multiplier = (row.multiplier || 1.0).toFixed(2);
        
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: 1,
              backgroundColor: 'rgba(0, 255, 58, 0.05)',
              border: '1px solid rgba(0, 255, 58, 0.15)',
              borderRadius: 1,
              borderLeft: '3px solid #00ff3a',
            }}
          >
            {renderUserAvatar(joinedUser)}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: '#00ff3a', fontWeight: 'bold' }}>won</Typography>
              <Typography sx={{ color: '#00ff3a' }}>{totalWinStr}</Typography>
              <Typography sx={{ color: '#ffeb3b', fontSize: '0.8rem' }}>({multiplier}x)</Typography>
              <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>from {betAmountStr}</Typography>
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>{renderRoomInfo(row.room)}</Box>
          </Box>
        );
      }
      case 'lost':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: 1,
              backgroundColor: 'rgba(255, 0, 0, 0.05)',
              border: '1px solid rgba(255, 0, 0, 0.15)',
              borderRadius: 1,
              borderLeft: '3px solid #ff0000',
            }}
          >
            {renderUserAvatar(joinedUser)}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: '#ff0000', fontWeight: 'bold' }}>lost</Typography>
              <Typography sx={{ color: '#ff0000' }}>{betAmtStr}</Typography>
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>{renderRoomInfo(row.room)}</Box>
          </Box>
        );
      case 'rugged':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderUserAvatar(creator)} rugged {userBetStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      case 'created':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: 1,
              backgroundColor: 'rgba(255, 235, 59, 0.05)',
              border: '1px solid rgba(255, 235, 59, 0.15)',
              borderRadius: 1,
              borderLeft: '3px solid #ffeb3b',
            }}
          >
            {renderUserAvatar(creator)}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: '#ffeb3b', fontWeight: 'bold' }}>created</Typography>
              <Typography sx={{ color: '#fff' }}>{betAmtStr}</Typography>
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>{renderRoomInfo(row.room)}</Box>
          </Box>
        );
      case 'split': {
        const splitStr = convertToCurrency(betAmt * 2, solPrice);
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              padding: 1,
              backgroundColor: 'rgba(255, 152, 0, 0.05)',
              border: '1px solid rgba(255, 152, 0, 0.15)',
              borderRadius: 1,
              borderLeft: '3px solid #ff9800',
            }}
          >
            {renderUserAvatar(joinedUser)}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ color: '#ff9800', fontWeight: 'bold' }}>split</Typography>
              <Typography sx={{ color: '#ff9800' }}>{splitStr}</Typography>
            </Box>
            <Box sx={{ marginLeft: 'auto' }}>{renderRoomInfo(row.room)}</Box>
          </Box>
        );
      }
      case 'receivedAutoPayout': {
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Raydium Pool seeded for {renderRoomInfo(row.room)}
          </Box>
        );
      }
      case 'jeet':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderUserAvatar(creator)} Jeeted {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      case 'pumped':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderUserAvatar(creator)} Pumped {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      case 'withdrew':
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderUserAvatar(creator)} withdrew {betAmtStr}
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Action: {row.action || 'None'}, Amount: {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );
    }
  };

  // Accessory & User Link Logic
  useEffect(() => {
    attachUserLinkListeners();
  }, [displayHistory, effectiveIsLowGraphics]);

  const attachUserLinkListeners = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-userid');
        handleOpenPlayerModal(userId);
      });
    });
  };


  const handleOpenPlayerModal = (creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // Render
  return (
    <Box className="room-history-panel">
      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}

      <Box
        ref={containerRef}
        sx={{
          maxHeight: 400,
          overflowY: 'auto',
          mt: 1,
        }}
        onScroll={handleScroll}
      >
        {displayHistory.length === 0 ? (
          <Typography
            variant="body1"
            sx={{ color: 'rgb(153, 153, 153)', textAlign: 'center', fontSize: '16px' }}
          >
            NO History
          </Typography>
        ) : (
          <div className="table main-history-table">
            {displayHistory.map((row, key) => {
              const isUserInvolved =
                row.joined_user?._id === effectiveUserId || row.creator?._id === effectiveUserId;

              return (
                <Box
                  key={row._id || key}
                  className={`table-row ${isUserInvolved ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''
                    }`}
                  sx={{
                    animationDelay: `${key * 0.05}s`,
                    mb: 1,
                    position: 'relative',
                  }}
                >
                  {/* Time and status indicators */}
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1, 
                    mb: 0.5,
                    justifyContent: 'space-between',
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#666', 
                          fontSize: '0.7rem',
                          fontWeight: 500,
                        }}
                      >
                        {row.from_now}
                      </Typography>
                      {row.ai_mode && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: '#ffeb3b', 
                            fontSize: '0.7rem',
                            backgroundColor: 'rgba(255, 235, 59, 0.1)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            border: '1px solid rgba(255, 235, 59, 0.2)',
                          }}
                        >
                          {row.ai_mode}
                        </Typography>
                      )}
                    </Box>
                    
                    {/* Room status */}
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: '#888', 
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.room?.status}
                    </Typography>
                  </Box>
                  
                  {/* Main content */}
                  <Box>
                    {row.finalMsg}
                  </Box>
                </Box>
              );
            })}

            {loadingMore && (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <CircularProgress size={24} color="error" />
              </Box>
            )}
          </div>
        )}
      </Box>
    </Box>
  );
}

export default RoomHistory;