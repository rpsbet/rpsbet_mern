import React, { useState, useEffect, useRef } from 'react';
import Moment from 'moment';
import { connect } from 'react-redux';
import { renderLottieAvatarAnimation } from '../util/LottieAvatarAnimations';
import PlayerModal from '../game_panel/modal/PlayerModal';
import { Button } from '@material-ui/core';
import ReactDOM from 'react-dom';
import { Skeleton } from "@material-ui/lab";

function customFromNow(date) {
  const now = Moment();
  const duration = Moment.duration(now.diff(date));

  if (duration.asSeconds() < 60) {
    return `${Math.round(duration.asSeconds())}s ago`;
  } else if (duration.asMinutes() < 60) {
    return `${Math.round(duration.asMinutes())}m ago`;
  } else if (duration.asHours() < 24) {
    return `${Math.round(duration.asHours())}h ago`;
  } else {
    return `${Math.round(duration.asDays())}d ago`;
  }
}

const RoomHistory = (props) => {
  const { socket, roomInfo, getRoomInfo, roomId, isLowGraphics, loading, userId } = props;

  const [history, setHistory] = useState(roomInfo?.room_history || []);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [numToShow, setNumToShow] = useState(10000);

  const isComponentMounted = useRef(false);

  useEffect(() => {
    isComponentMounted.current = true;
    setupSocketConnection();

    return () => {
      isComponentMounted.current = false;
      disconnectSocket();
    };
  }, [socket]);

  useEffect(() => {
    setHistory(roomInfo?.room_history || []);
    attachUserLinkListeners();
    attachAccessories();
  }, [roomInfo]);

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

  const handleNewLog = (data) => {
    if (!isComponentMounted.current) return;

    const newLog = data.newLog?.[0];
    if (!newLog) {
      console.warn("No valid log data received.");
      return;
    }

    let newHistoryItem = newLog.history || {
      ...newLog,
    };

    setHistory((prevHistory) => [newHistoryItem, ...prevHistory.slice(0, 29)]);
    attachUserLinkListeners();
    attachAccessories();
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
      } else {
        return;
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

  const handleLoadMore = async () => {
    try {
      const newNumToShow = numToShow + 10;
      await getRoomInfo(roomId, newNumToShow, true);
      setNumToShow(newNumToShow);
    } catch (error) {
      console.error('Error loading more data:', error);
    }
  };

  return (
    <div className="room-history-panel">
      {history && history.length > 0 ? (
        <div className="table main-history-table">
          {showPlayerModal && (
            <PlayerModal
              modalIsOpen={showPlayerModal}
              closeModal={handleClosePlayerModal}
              selectedCreator={selectedCreator}
            />
          )}
          {history.slice(0, numToShow).map((row, key) => (
            <div
              className={`table-row ${row.joined_user === userId ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''}`}
              style={{ animationDelay: `${key * 0.1}s`, padding: '10px' }}
              key={row._id}
            >
              <div className="table-cell">
                <div className="room-id">{row.status}</div>
                {row.ai_mode && (
                  <div id="ai_mode">
                    <span className="room-id ai_mode">{row.ai_mode}</span>
                    {row.qbot && <span className="room-id qbot">Q-BOT</span>}
                  </div>
                )}
                <div
                  className="mobile-only"
                  dangerouslySetInnerHTML={{ __html: row.history }}
                ></div>
                <div
                  className="desktop-only"
                  dangerouslySetInnerHTML={{ __html: row.history }}
                ></div>
              </div>
              <div className="table-cell">{Moment(row.created_at).fromNow()}</div>
            </div>
          ))}
          {roomInfo && numToShow < roomInfo.totalGameLogsCount && (
            <div className="load-more-btn">
              <Button id="load-btn" variant="contained" color="primary" onClick={handleLoadMore}>
                Load More
              </Button>
            </div>
          )}
        </div>
      ) : history && history.length === 0 ? (
        <p style={{ color: 'rgb(153, 153, 153)', textAlign: 'center', fontSize: '16px' }}>
          NO History
        </p>
      ) : (
        <div className="loading-skeleton">
          <Skeleton variant="rect" width="100%" height={60} />
          <Skeleton variant="text" width="80%" height={30} />
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="80%" height={30} />
          <Skeleton variant="text" width="60%" height={20} />
        </div>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  loading: state.logic.isActiveLoadingOverlay,
  userId: state.auth.user._id,
  socket: state.auth.socket,
});

export default connect(mapStateToProps)(RoomHistory);