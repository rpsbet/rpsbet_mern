import React, { useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import { getHistory } from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import Moment from 'moment';
import { Skeleton } from "@material-ui/lab";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { Tooltip } from '@material-ui/core';
import PlayerModal from '../modal/PlayerModal';

const customFromNow = (date) => {
  const now = Moment();
  const duration = Moment.duration(now.diff(date));
  if (duration.asSeconds() < 60) return `${Math.round(duration.asSeconds())}s ago`;
  if (duration.asMinutes() < 60) return `${Math.round(duration.asMinutes())}m ago`;
  if (duration.asHours() < 24) return `${Math.round(duration.asHours())}h ago`;
  return `${Math.round(duration.asDays())}d ago`;
};

const updateFromNow = (history) =>
  history.map((item) => ({
    ...item,
    from_now: customFromNow(Moment(item.created_at)),
  }));

const HistoryTable = ({
  socket,
  getHistory,
  getSettings,
  history: initialHistory,
  userId,
  isLowGraphics,
  setHighlightedRooms,
}) => {
  const [history, setHistory] = useState(initialHistory);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      // You can use settings here if needed
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  }, [getSettings]);

  const fetchHistory = useCallback(async () => {
    try {
      await getHistory();
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  }, [getHistory]);

  const handleNewLog = (data) => {
    const newLog = data.newLog?.[0];
    if (!newLog) return;

    const { room_id } = newLog;
    if (!room_id) return;

    if (setHighlightedRooms) {
      setHighlightedRooms(new Set([room_id]));
      setTimeout(() => setHighlightedRooms(new Set()), 4000);
    }

    setHistory(updateFromNow([newLog]));
  };

  const setupSocketConnection = useCallback(() => {
    if (socket) {
      socket.on('NEW_LOG', handleNewLog);
    }
  }, [socket]);

  const disconnectSocket = useCallback(() => {
    if (socket) {
      socket.off('NEW_LOG', handleNewLog);
    }
  }, [socket]);

  useEffect(() => {
    fetchSettings();
    fetchHistory();
    setupSocketConnection();

    return () => disconnectSocket();
  }, [fetchSettings, fetchHistory, setupSocketConnection, disconnectSocket]);

  useEffect(() => {
    setHistory(updateFromNow(initialHistory));
  }, [initialHistory]);

  const handleOpenPlayerModal = (creatorId) => {
    setShowPlayerModal(true);
    setSelectedCreator(creatorId);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
    setSelectedCreator(null);
  };

  const copyToClipboard = (rowId) => {
    navigator.clipboard.writeText(rowId).then(() => {
      setCopiedRowId(rowId);
      setTimeout(() => setCopiedRowId(null), 1500);
    });
  };

  const uniqueHistory = history.filter(
    (row, index, self) => index === self.findIndex((t) => t._id === row._id)
  );

  return (
    <div className="overflowX">
      <div className="table main-history-table">
        {history?.length === 0 && (
          <div className="dont-have-game-msg">
            <Skeleton variant="rect" width="100%" height={10} />
          </div>
        )}
        {uniqueHistory.map((row, key) => (
          <div
            key={row._id}
            className={`table-row ${(row.creator?._id === userId || row.joined_user === userId) ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''}`}
            style={{
              animationDelay: `${key * 0.1}s`,
              filter: row.status !== 'open' ? 'opacity(60%)' : 'none',
            }}
          >
            <div>
              <div className="table-cell">
                <div
                  className="desktop-only"
                  dangerouslySetInnerHTML={{ __html: row.history }}
                ></div>
              </div>
              <div className="table-cell row-copy">
                <Tooltip title={copiedRowId === row._id ? "COPIED ID!" : "COPY BET ID"} placement="top">
                  <a
                    style={{ padding: "5px", cursor: "pointer" }}
                    onClick={() => copyToClipboard(row._id)}
                  >
                    <FileCopyIcon style={{ width: "12px" }} />
                  </a>
                </Tooltip>
                &nbsp;
                {row.from_now && row.from_now.split('').map((char, index) => (
                  <span key={index} style={{ fontSize: isNaN(char) ? '0.5em' : '0.8em' }}>{char}</span>
                ))}
                &nbsp;<FontAwesomeIcon icon={faStopwatch} />
              </div>
            </div>
            <div>
              <div
                className="table-cell mobile-only"
                dangerouslySetInnerHTML={{ __html: row.history }}
              ></div>
            </div>
          </div>
        ))}
      </div>
      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  socket: state.auth.socket,
  history: state.logic.history,
  userId: state.auth.user._id,
  isLowGraphics: state.auth.isLowGraphics,
});

const mapDispatchToProps = {
  getHistory,
  getSettings,
};

export default connect(mapStateToProps, mapDispatchToProps)(HistoryTable);