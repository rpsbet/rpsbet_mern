import React, { useState, useEffect, useRef, useCallback } from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import PlayerModal from '../game_panel/modal/PlayerModal';
import ReactDOM from 'react-dom';
import {
  Box,
  Skeleton,
  CircularProgress,
  Typography
} from '@mui/material';

const INITIAL_LIMIT = 10;       // 1) fetch 30 on first load
const INFINITE_SCROLL_OFFSET = 50; // px from bottom to trigger next load

const RoomHistory = (props) => {
  const {
    socket,
    roomInfo,
    getRoomInfo,
    roomId,
    isLowGraphics,
    loading,
    userId,
  } = props;

  const [history, setHistory] = useState(roomInfo?.room_history || []);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  const [numToShow, setNumToShow] = useState(INITIAL_LIMIT); 
  const [loadingMore, setLoadingMore] = useState(false);

  const isComponentMounted = useRef(false);
  const containerRef = useRef(null);

  // --- LIFECYCLE / MOUNT ---
  useEffect(() => {
    isComponentMounted.current = true;
    setupSocketConnection();

    // On mount, fetch the initial logs (limit=30)
    fetchInitialLogs();

    return () => {
      isComponentMounted.current = false;
      disconnectSocket();
    };
  }, [socket]); 

  console.log("roomInfo?.room_history", roomInfo)
  // This updates whenever roomInfo changes in Redux => set local history
  useEffect(() => {
    setHistory(roomInfo?.room_history || []);
    attachUserLinkListeners();
    attachAccessories();
  }, [roomInfo, isLowGraphics]);

  // --- SOCKET SETUP ---
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

  // --- INITIAL FETCH ---
  const fetchInitialLogs = async () => {
    try {
      setLoadingMore(true);
    } catch (err) {
      console.error('Error fetching initial logs:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // --- INFINITE SCROLL HANDLER ---
  const handleScroll = useCallback(async (e) => {
    if (loadingMore) return; // already fetching
    if (!roomInfo || !roomInfo.totalGameLogsCount) return;

    const container = e.target;
    const scrollPosition = container.scrollTop + container.clientHeight;
    const scrollHeight = container.scrollHeight;

    // If near the bottom:
    if (scrollHeight - scrollPosition <= INFINITE_SCROLL_OFFSET) {
      // Check if we have more logs to load:
      if (history.length < roomInfo.totalGameLogsCount) {
        await loadMoreLogs();
      }
    }
  }, [
    loadingMore,
    roomInfo,
    history.length
  ]);

  // --- LOAD MORE LOGS ---
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

  // --- SOCKET: NEW_LOG EVENT ---
  const handleNewLog = (data) => {
    if (!isComponentMounted.current) return;

    const newLog = data?.newLog?.[0];
    if (!newLog) {
      console.warn("No valid log data received.");
      return;
    }

    const newHistoryItem = { ...newLog };
    // Prepend new item & keep only last 30 in local state
    setHistory((prev) => [newHistoryItem, ...prev.slice(0, 29)]);

    attachUserLinkListeners();
    attachAccessories();
  };

  // --- UTILS: ACCESSORIES & LINKS ---
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

  // --- RENDER ---
  return (
    <Box className="room-history-panel">
      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}

      {/** 
       * Container with fixed height, scroll, and infinite loading
       * On scroll => handleScroll checks if near bottom => loadMore
       */}
      <Box
        ref={containerRef}
        sx={{
          maxHeight: 400,          // or pick a height suitable for your layout
          overflowY: 'auto',
        }}
        onScroll={handleScroll}
      >
        {/* If we have logs, render them */}
        {history && history.length > 0 ? (
          <div className="table main-history-table">
            {history.map((row, key) => (
              <div
                key={row._id || key}
                className={`table-row ${
                  row.joined_user === userId ? 'history-background' : ''
                } ${key < 50 ? 'slide-in' : ''}`}
                style={{ 
                  animationDelay: `${key * 0.1}s`, 
                  padding: '10px' 
                }}
              >
                <div className="table-cell">
                  <div className="room-id">{row.status}</div>
                  {row.ai_mode && (
                    <div>
                      <span className="room-id" id="ai_mode">{row.ai_mode}</span>
                      {row.qbot && <span className="room-id qbot">Q-BOT</span>}
                    </div>
                  )}
                  <div
                    className="mobile-only"
                    dangerouslySetInnerHTML={{ __html: row.history }}
                  />
                  <div
                    className="desktop-only"
                    dangerouslySetInnerHTML={{ __html: row.history }}
                  />
                </div>
                <div className="table-cell">
                  {Moment(row.created_at).fromNow()}
                </div>
              </div>
            ))}
            {/* Show a loader at the bottom if we are currently fetching more */}
            {loadingMore && (
              <Box sx={{ textAlign: 'center', py: 1 }}>
                <CircularProgress size={24} color="error" />
              </Box>
            )}
          </div>
        ) : history && history.length === 0 ? (
          <Typography 
            variant="body1"
            sx={{ color: 'rgb(153, 153, 153)', textAlign: 'center', fontSize: '16px' }}
          >
            NO History
          </Typography>
        ) : (
          // Fallback skeleton if still loading initial data
          <Box 
            className="loading-skeleton"
            sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Skeleton variant="rectangular" sx={{ width: '100%', height: 60 }} />
            <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
            <Skeleton variant="text" sx={{ width: '60%', height: 20 }} />
            <Skeleton variant="text" sx={{ width: '80%', height: 30 }} />
            <Skeleton variant="text" sx={{ width: '60%', height: 20 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  loading: state.logic.isActiveLoadingOverlay,
  userId: state.auth.user?._id,
  socket: state.auth.socket,
});

const mapDispatchToProps = {
};

export default connect(mapStateToProps, mapDispatchToProps)(RoomHistory);