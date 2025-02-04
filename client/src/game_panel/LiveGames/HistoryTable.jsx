import React, { useEffect, useState, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
import {
  setHighlightedRooms,
  clearHighlightedRooms
} from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStopwatch } from '@fortawesome/free-solid-svg-icons';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Tooltip, Skeleton, Box, Typography } from '@mui/material';
import PlayerModal from '../modal/PlayerModal';
import { convertToCurrency } from '../../util/conversion';

// Import your Avatar component:
import Avatar from '../../components/Avatar';

// Helper function for "time ago"
const customFromNow = (date) => {
  const now = Moment();
  const duration = Moment.duration(now.diff(date));
  if (duration.asSeconds() < 60) return `${Math.round(duration.asSeconds())}s ago`;
  if (duration.asMinutes() < 60) return `${Math.round(duration.asMinutes())}m ago`;
  if (duration.asHours() < 24) return `${Math.round(duration.asHours())}h ago`;
  return `${Math.round(duration.asDays())}d ago`;
};

// Rebuilds the 'from now' for each log
const updateFromNow = (history) =>
  history.map((item) => ({
    ...item,
    from_now: customFromNow(Moment(item.created_at)),
  }));

function HistoryTable({
  socket,
  getSettings,
  // The initial logs from Redux
  history: initialHistory,
  userId,
  solPrice,
  setHighlightedRooms,
  clearHighlightedRooms, // so we can un-highlight
}) {
  const dispatch = useDispatch();

  // We store the "final" logs (with built messages) in local state
  const [history, setHistory] = useState(updateFromNow(initialHistory));

  // We also keep the "raw" logs as we receive them (socket, Redux, etc.).
  const [rawLogs, setRawLogs] = useState(initialHistory);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);

  // Fetch site settings
  const fetchSettings = useCallback(async () => {
    try {
      await getSettings();
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [getSettings]);

  // This function returns JSX rather than a string.
  // We'll decide whether to show the "creator" or "joined_user" with an <Avatar>,
  // depending on the action. You can customize further as needed.
  const buildFinalMessage = (logItem) => {
    if (!solPrice) {
      return 'Loading price...';
    }

       // Convert numeric fields
    const betAmt = convertToCurrency(logItem.bet_amount, solPrice);
    const winnings = convertToCurrency(logItem.winnings, solPrice);
    const userBet = convertToCurrency(logItem.user_bet, solPrice);

    const displayRoom = `(${logItem.room?.ticker})`;

    // Grab references to joined_user or creator
    const joinedUser = logItem.joined_user || {};
    const creator = logItem.creator || {};

    const renderRoomInfo = (roomObj) => {
      if (!roomObj._id) return null;
      return (
        <Box
          component="a"
          href={`/join/${roomObj._id}`}
          sx={{ cursor: 'pointer', display: 'flex',  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
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
    // Helper to render an <Avatar> for joined_user or creator
    function renderAvatar(userObj) {
      if (!userObj?._id) return null;
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
            accessory={userObj.accessory}
            alt=""
            className="avatar"
            // Add any additional props you want for styling:
            style={{
              display: 'inline-block',
              marginRight: 8,
              verticalAlign: 'middle',
            }}
          />

        </Box>

      );
    }

    switch (logItem.action) {
      case 'won': {
        const totalWin = convertToCurrency(
          logItem.winnings + logItem.bet_amount,
          solPrice
        );
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(joinedUser)} won {totalWin} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      }

      case 'receivedAutoPayout': {
        const payout = convertToCurrency(
          logItem.user_bet - logItem.endgame_amount,
          solPrice
        );
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            Hosts received auto-payout of {payout} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      }

      case 'created':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(creator)} created {renderRoomInfo(logItem.room)} with {userBet}
          </Box>
        );
      case 'rugged':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(creator)} rugged {userBet} in {renderRoomInfo(logItem.room)}
          </Box>
        );

      case 'split': {
        const splitAmt = convertToCurrency(logItem.bet_amount * 2, solPrice);
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(joinedUser)} split {splitAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      }

      case 'lost':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(joinedUser)} lost {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );

      case 'jeet':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(creator)} Jeeted {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );

      case 'pumped':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(creator)} Pumped {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );

      case 'withdrew':
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {renderAvatar(creator)} withdrew {betAmt}
          </Box>
        );

      default:
        // If there's an action that doesn't match the above
        return (
          <Box sx={{ fontSize: '0.7rem', fontWeight: 700, display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            Action: {logItem.action || 'None'}, Amount: {renderRoomInfo(logItem.room)}
          </Box>
        );
    }
  };

  // Whenever rawLogs or solPrice change, rebuild the final history
  useEffect(() => {
    if (!rawLogs || rawLogs.length === 0) {
      setHistory([]);
      return;
    }
    // Build final messages
    const updated = rawLogs.map((item) => ({
      ...item,
      finalMsg: buildFinalMessage(item),
    }));

    // Also update "from now" for times
    setHistory(updateFromNow(updated));
  }, [rawLogs, solPrice]);

  // Socket event handler
  const handleNewLog = (data) => {
    console.log("NEW_LOG", data)
    const newLogArray = data?.newLog;
    if (!newLogArray || !Array.isArray(newLogArray)) return;

    // Replace entire history
    const [firstLog] = newLogArray;
    if (firstLog?.room?._id) {
      dispatch(setHighlightedRooms([firstLog.room._id]));
      setTimeout(() => {
        dispatch(clearHighlightedRooms());
      }, 200);
    }

    setRawLogs(newLogArray);
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
    setupSocketConnection();
    return () => disconnectSocket();
  }, [fetchSettings, setupSocketConnection, disconnectSocket]);

  // If Redux updates `initialHistory`, store it as raw logs
  useEffect(() => {
    setRawLogs(initialHistory);
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
          const isUserInvolved =
            row.creator?._id === userId || row.joined_user?._id === userId;

          return (
            <Box
              key={row._id}
              className={`table-row ${isUserInvolved ? 'history-background' : ''
                } ${key < 50 ? 'slide-in' : ''}`}
              sx={{
                animationDelay: `${key * 0.1}s`,
                filter: row.status !== 'open' ? 'opacity(60%)' : 'none',
              }}
            >
              <Box>
                <Box className="table-cell" sx={{ padding: '10px' }}>
                  {/* Render the finalMsg (which is now JSX) */}
                  <div className="desktop-only">
                    {row.finalMsg || '...'}
                  </div>
                  <div className="mobile-only">
                    {row.finalMsg || '...'}
                  </div>
                </Box>

                {/* Copy to Clipboard + from_now display */}
                <Box className="table-cell row-copy" sx={{ p: '10px' }}>
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
                  {row.from_now && row.from_now.split('').map((char, i) => (
                    <Box
                      component="span"
                      key={i}
                      sx={{ fontSize: isNaN(char) ? '0.5em' : '0.8em' }}
                    >
                      {char}
                    </Box>
                  ))}
                  &nbsp;
                  <FontAwesomeIcon icon={faStopwatch} />
                </Box>
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
}

const mapStateToProps = (state) => ({
  socket: state.auth.socket,
  history: state.logic.history,
  userId: state.auth.user._id,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  getSettings,
  setHighlightedRooms,
  clearHighlightedRooms,
};

export default connect(mapStateToProps, mapDispatchToProps)(HistoryTable);
