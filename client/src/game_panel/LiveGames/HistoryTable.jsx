import React, { useEffect, useState, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import { getHistory, setHighlightedRooms, clearHighlightedRooms } from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHeartBroken, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Tooltip, Skeleton, Box } from '@mui/material';
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
  const dispatch = useDispatch();
  const [history, setHistory] = useState(initialHistory);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getSettings();
      // handle settings if needed
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
    const newLog = data?.newLog?.[0];
    if (!newLog) return;

    const { room_id } = newLog;
    if (!room_id) return;

    // 1) highlight the new room
    dispatch(setHighlightedRooms([room_id]));

    // 2) Clear highlight after 200ms
    setTimeout(() => {
      dispatch(clearHighlightedRooms());
    }, 200);

    // 3) Replace history with just this new log
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
    <Box className="overflowX">
      <Box className="table main-history-table">
        {history?.length === 0 && (
          <Box className="dont-have-game-msg" sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" sx={{ width: '100%', height: 10 }} />
          </Box>
        )}

        {uniqueHistory.map((row, key) => {
          const isUserInvolved = (row.creator?._id === userId || row.joined_user === userId);
          return (
            <Box
              key={row._id}
              className={`table-row ${isUserInvolved ? 'history-background' : ''} ${key < 50 ? 'slide-in' : ''
                }`}
              sx={{
                animationDelay: `${key * 0.1}s`,
                filter: row.status !== 'open' ? 'opacity(60%)' : 'none',
              }}
            >
              <Box>
                <Box className="table-cell">
                  <Box
                    className="desktop-only"
                    sx={{ p: '10px', display: 'flex', alignItems: 'center', justifyItems: 'center' }}
                    dangerouslySetInnerHTML={{ __html: row.history }}
                  />
                </Box>

                <Box
                  className="table-cell row-copy"
                  sx={{ p: '10px' }}
                >
                  <Tooltip
                    title={copiedRowId === row._id ? 'COPIED ID!' : 'COPY BET ID'}
                    placement="top"
                  >
                    <Box
                      component="a"
                      sx={{ padding: '5px', cursor: 'pointer' }}
                      onClick={() => copyToClipboard(row._id)}
                    >
                      <FileCopyIcon sx={{ width: 12 }} />
                    </Box>
                  </Tooltip>
                  &nbsp;
                  {row.from_now &&
                    row.from_now.split('').map((char, index) => (
                      <Box
                        component="span"
                        key={index}
                        sx={{ fontSize: isNaN(char) ? '0.5em' : '0.8em' }}
                      >
                        {char}
                      </Box>
                    ))}
                  &nbsp;
                  <FontAwesomeIcon icon={faStopwatch} />
                </Box>
              </Box>

              <Box>
                <Box
                  className="table-cell mobile-only"
                  dangerouslySetInnerHTML={{ __html: row.history }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>

      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
          selectedCreator={selectedCreator}
        />
      )}
    </Box>
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
  setHighlightedRooms
};

export default connect(mapStateToProps, mapDispatchToProps)(HistoryTable);