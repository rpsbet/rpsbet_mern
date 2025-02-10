import React, { useState, useEffect, useRef, useCallback } from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import ReactDOM from 'react-dom';
import {
  Box,
  Skeleton,
  CircularProgress,
  Typography
} from '@mui/material';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import { convertToCurrency } from '../util/conversion';

// Import your Avatar component, for instance:
import Avatar from './Avatar';

const INITIAL_LIMIT = 10;           // how many logs to fetch initially
const INFINITE_SCROLL_OFFSET = 50; // px from bottom to trigger next load

// Helper function: time-ago style
const customFromNow = (date) => {
  const now = Moment();
  const duration = Moment.duration(now.diff(date));
  if (duration.asSeconds() < 60) return `${Math.round(duration.asSeconds())}s ago`;
  if (duration.asMinutes() < 60) return `${Math.round(duration.asMinutes())}m ago`;
  if (duration.asHours() < 24) return `${Math.round(duration.asHours())}h ago`;
  return `${Math.round(duration.asDays())}d ago`;
};

function RoomHistory({
  socket,
  roomInfo,
  getRoomInfo,
  roomId,
  isLowGraphics,
  loading,
  userId,
  solPrice // used for convertToCurrency
}) {
  // 1. Store the raw logs from the server
  const [rawHistory, setRawHistory] = useState(roomInfo?.room_history || []);

  // 2. Store the "display" logs we build on the client
  const [displayHistory, setDisplayHistory] = useState([]);

  // Additional states
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [numToShow, setNumToShow] = useState(INITIAL_LIMIT);
  const [loadingMore, setLoadingMore] = useState(false);

  const isComponentMounted = useRef(false);
  const containerRef = useRef(null);

  // ----------------------------
  // Lifecycle & Effects
  // ----------------------------
  useEffect(() => {
    isComponentMounted.current = true;
    setupSocketConnection();

    // On mount, fetch the initial logs.
    fetchInitialLogs();

    return () => {
      isComponentMounted.current = false;
      disconnectSocket();
    };
  }, [socket]);

  // Update rawHistory when roomInfo changes in Redux
  useEffect(() => {
    setRawHistory(roomInfo?.room_history || []);
  }, [roomInfo]);

  // Build the displayed logs whenever rawHistory or solPrice changes
  useEffect(() => {
    if (!rawHistory || rawHistory.length === 0) {
      setDisplayHistory([]);
      return;
    }

    // Build final text (JSX) for each log
    const updated = rawHistory.map((log) => {
      const finalMsg = buildRoomHistoryMessage(log, solPrice);
      return {
        ...log,
        finalMsg,
        from_now: customFromNow(Moment(log.created_at)),
      };
    });

    setDisplayHistory(updated);
  }, [rawHistory, solPrice]);

  // ----------------------------
  // Socket Setup
  // ----------------------------
  const setupSocketConnection = () => {
    if (socket) {
      socket.on('NEW_LOG', handleNewLog);
    } else {
      retrySocketConnection();
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      socket.off('NEW_LOG', handleNewLog);
    }
  };

  const retrySocketConnection = () => {
    setTimeout(() => {
      if (socket) {
        socket.on('NEW_LOG', handleNewLog);
      } else {
        retrySocketConnection();
      }
    }, 1000);
  };

  // ----------------------------
  // Initial & Infinite Scroll
  // ----------------------------
  const fetchInitialLogs = async () => {
    try {
      setLoadingMore(true);
      await getRoomInfo(roomId, INITIAL_LIMIT);
    } catch (err) {
      console.error('Error fetching initial logs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleScroll = useCallback(async (e) => {
    if (loadingMore) return;
    if (!roomInfo || !roomInfo.totalGameLogsCount) return;

    const container = e.target;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // If near the bottom, load more
    if (scrollHeight - scrollPosition <= INFINITE_SCROLL_OFFSET) {
      if (rawHistory.length < roomInfo.totalGameLogsCount) {
        await loadMoreLogs();
      }
    }
  }, [loadingMore, roomInfo, rawHistory.length]);

  const loadMoreLogs = async () => {
    try {
      setLoadingMore(true);
      const newNumToShow = numToShow + 10;
      await getRoomInfo(roomId, newNumToShow);
      setNumToShow(newNumToShow);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // ----------------------------
  // Socket "NEW_LOG" Handler
  // ----------------------------
  const handleNewLog = (data) => {
    if (!isComponentMounted.current) return;

    const newLogArray = data?.newLog;
    if (!Array.isArray(newLogArray) || newLogArray.length === 0) return;

    // Filter logs by the current roomId
    const filteredLogs = newLogArray.filter((log) => {
      const thisLogRoomId = log.room?._id;
      return thisLogRoomId === roomId;
    });

    if (filteredLogs.length === 0) {
      return;
    }

    // Prepend logs for this room & keep only last 30
    setRawHistory((prev) => {
      const updated = [...filteredLogs, ...prev];
      return updated.slice(0, 30);
    });
  };

  // ----------------------------
  // Build the Final Message with JSX
  // ----------------------------
  const buildRoomHistoryMessage = (row, solPrice) => {
    if (!solPrice) {
      return 'Loading price...';
    }
    if (!row) return null;

    // Convert numeric fields
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

    // Grab references to joined_user or creator
    const joinedUser = row.joined_user || {};
    const creator = row.creator || {};

    const renderRoomInfo = (roomObj) => {
      if (!roomObj._id) return null;
      return (
        <Box
          component="a"
          href={`/join/${roomObj._id}`}
          sx={{ cursor: 'pointer', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          className='room'
        >
          <img
            src={roomObj.image}
            alt={roomObj.image}
            className='game-type-icon'
            style={{ display: 'inline-block', marginLeft: 6, marginRight: 4 }}
          />
          <Typography variant='body2' sx={{mr: 0.5}}>{displayRoom}</Typography>
        </Box>
      );
    };

    const renderUserAvatar = (userObj) => {
      if (!userObj._id) return null;
      return (
        <Box
          component="a"
          onClick={() => handleOpenPlayerModal(userObj._id)}
          sx={{ cursor: 'pointer' }}
          className='player'
        >
          <Avatar
            src={userObj.avatar}
            username={userObj.username}
            rank={userObj.totalWagered}
            user_id={userObj._id}
            accessory={userObj.accessory}
            alt=""
            className="avatar"
            style={{ display: 'inline-block', marginRight: 6 }}
          />
        </Box>
      );
    };

    switch (row.action) {
      case 'won': {
        const totalWinStr = convertToCurrency(winnings + betAmt, solPrice);
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(joinedUser)} won {totalWinStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      }

      case 'lost':
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(joinedUser)} lost {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );

      case 'rugged':
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(creator)} rugged {userBetStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      case 'created':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(creator)} created {renderRoomInfo(row.room)} with {betAmtStr}
          </Box>
        );
      case 'split': {
        const splitStr = convertToCurrency(betAmt * 2, solPrice);
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(joinedUser)} split {splitStr} in {renderRoomInfo(row.room)}
          </Box>
        );
      }

      case 'receivedAutoPayout': {
        const payout = convertToCurrency(userBet - endgame, solPrice);
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            Hosts received auto-payout of {payout} in {renderRoomInfo(row.room)}
          </Box>
        );
      }

      case 'jeet':
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(creator)} Jeeted {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );

      case 'pumped':
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(creator)} Pumped {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );

      case 'withdrew':
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderUserAvatar(creator)} withdrew {betAmtStr}
          </Box>
        );

      default:
        return (
          <Box sx={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            Action: {row.action || 'None'}, Amount: {betAmtStr} in {renderRoomInfo(row.room)}
          </Box>
        );
    }
  };

  // ----------------------------
  // Accessory & User Link Logic
  // ----------------------------
  useEffect(() => {
    attachUserLinkListeners();
    attachAccessories();
  }, [displayHistory, isLowGraphics]);

  const attachUserLinkListeners = () => {
    const userLinks = document.querySelectorAll('.user-link');
    userLinks.forEach((link) => {
      link.addEventListener('click', (event) => {
        const userId = event.target.getAttribute('data-userid');
        handleOpenPlayerModal(userId);
      });
    });
  };


  const attachAccessories = () => {
    const userLinks = document.querySelectorAll('.user-link');
    let counter = 0;
    userLinks.forEach((element) => {
      if (counter < 3) {
        const userId = element.getAttribute('data-userid');
        const accessory = element.getAttribute('accessory');
        const lottieAnimation = renderLottieAvatarAnimation(accessory, isLowGraphics);
        const portalContainer = document.createElement('div');
        ReactDOM.render(lottieAnimation, portalContainer);
        element.parentNode.insertBefore(portalContainer, element);

        portalContainer.addEventListener('click', () => {
          handleOpenPlayerModal(userId);
        });
        portalContainer.style.cursor = 'pointer';
        counter++;
      }
    });
  };

  const handleOpenPlayerModal = (creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // ----------------------------
  // Render
  // ----------------------------
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
                row.joined_user?._id === userId || row.creator?._id === userId;

              return (
                <div
                  key={row._id || key}
                  className={`table-row ${isUserInvolved ? 'history-background' : ''
                    } ${key < 50 ? 'slide-in' : ''}`}
                  style={{
                    animationDelay: `${key * 0.1}s`,
                    padding: '10px'
                  }}
                >
                  <div className="table-cell">
                    <div className="room-id">{row.room?.status}</div>
                    {row.ai_mode && (
                      <div>
                        <span className="room-id" id="ai_mode">
                          {row.ai_mode}
                        </span>
                        {row.qbot && <span className="room-id qbot">Q-BOT</span>}
                      </div>
                    )}

                    {/* The finalMsg is now a JSX element */}
                    <div className="desktop-only" style={{ marginTop: '5px' }}>
                      {row.finalMsg}
                    </div>
                    <div className="mobile-only" style={{ marginTop: '5px' }}>
                      {row.finalMsg}
                    </div>
                  </div>

                  <div className="table-cell" style={{ whiteSpace: 'nowrap' }}>
                    {row.from_now}
                  </div>
                </div>
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

const mapStateToProps = (state) => ({
  loading: state.logic.isActiveLoadingOverlay,
  userId: state.auth.user?._id,
  socket: state.auth.socket,
  solPrice: state.logic.solPrice // used for convertToCurrency
});

const mapDispatchToProps = {
  // e.g., getRoomInfo, if needed
};

export default connect(mapStateToProps, mapDispatchToProps)(RoomHistory);
