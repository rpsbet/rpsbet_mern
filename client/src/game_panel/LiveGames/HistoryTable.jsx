import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setHighlightedRooms,
  clearHighlightedRooms,
} from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import Moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStopwatch } from '@fortawesome/free-solid-svg-icons';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { Tooltip, Skeleton, Box, Typography } from '@mui/material';
import PlayerModal from '../modal/PlayerModal';
import { convertToCurrency } from '../../util/conversion';
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
  socket: propSocket,
  history: propHistory,
  userId: propUserId,
  solPrice: propSolPrice,
}) {
  const dispatch = useDispatch();

  // Map state from Redux using useSelector
  const { socket, history, userId, solPrice } = useSelector((state) => ({
    socket: state.auth.socket,
    history: state.logic.history,
    userId: state.auth.user?._id,
    solPrice: state.logic.solPrice,
  }));

  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveSocket = propSocket !== undefined ? propSocket : socket;
  const effectiveHistory = propHistory !== undefined ? propHistory : history;
  const effectiveUserId = propUserId !== undefined ? propUserId : userId;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  // Local State
  const [historyState, setHistory] = useState(updateFromNow(effectiveHistory));
  const [rawLogs, setRawLogs] = useState(effectiveHistory);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);

  // Fetch site settings
  const fetchSettings = useCallback(async () => {
    try {
      await dispatch(getSettings());
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [dispatch]);

  // Build final message with JSX
  const buildFinalMessage = (logItem) => {
    if (!effectiveSolPrice) {
      return 'Loading price...';
    }

    const betAmt = convertToCurrency(logItem.bet_amount, effectiveSolPrice);
    const winnings = convertToCurrency(logItem.winnings, effectiveSolPrice);
    const userBet = convertToCurrency(logItem.user_bet, effectiveSolPrice);
    const displayRoom = `(${logItem.room?.ticker})`;

    const joinedUser = logItem.joined_user || {};
    const creator = logItem.creator || {};

    const renderRoomInfo = (roomObj) => {
      if (!roomObj._id) return null;
      return (
        <Box
          component="a"
          href={`/join/${roomObj._id}`}
          sx={{
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
          className="room"
        >
          <img
            src={roomObj.image}
            alt={roomObj.image}
            className="game-type-icon"
            style={{ display: 'inline-block', marginLeft: 6, marginRight: 4 }}
          />
          <Typography variant="body2" sx={{ mr: 0.5 }}>
            {displayRoom}
          </Typography>
        </Box>
      );
    };

    const renderAvatar = (userObj) => {
      if (!userObj?._id) return null;
      return (
        <Box
          component="a"
          onClick={() => handleOpenPlayerModal(userObj._id)}
          sx={{ cursor: 'pointer' }}
          className=""
        >
          <Avatar
            user_id={userObj._id}
            src={userObj.avatar}
            username={userObj.username}
            rank={userObj.totalWagered}
            accessory={userObj.accessory}
            elite={userObj.elite}
            alt=""
            className="avatar"
            style={{
              display: 'inline-block',
              marginRight: 8,
              verticalAlign: 'middle',
            }}
          />
        </Box>
      );
    };

    switch (logItem.action) {
      case 'won': {
        const totalWin = convertToCurrency(logItem.winnings, effectiveSolPrice);
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(joinedUser)} won {totalWin} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      }
      case 'receivedAutoPayout': {
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Raydium Pool seeded for {renderRoomInfo(logItem.room)}
          </Box>
        );
      }
      case 'created':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(creator)} created {renderRoomInfo(logItem.room)} with {betAmt}
          </Box>
        );
      case 'rugged':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(creator)} rugged {winnings} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      case 'split': {
        const splitAmt = convertToCurrency(logItem.bet_amount * 2, effectiveSolPrice);
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(joinedUser)} split {splitAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      }
      case 'lost':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(joinedUser)} lost {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      case 'jeet':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(creator)} Jeeted {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      case 'pumped':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(creator)} Pumped {betAmt} in {renderRoomInfo(logItem.room)}
          </Box>
        );
      case 'withdrew':
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {renderAvatar(creator)} withdrew {betAmt}
          </Box>
        );
      default:
        return (
          <Box
            sx={{
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            Action: {logItem.action || 'None'}, Amount: {renderRoomInfo(logItem.room)}
          </Box>
        );
    }
  };

  // Update history when rawLogs or solPrice changes
  useEffect(() => {
    if (!rawLogs || rawLogs.length === 0) {
      setHistory([]);
      return;
    }
    const updated = rawLogs.map((item) => ({
      ...item,
      finalMsg: buildFinalMessage(item),
    }));
    setHistory(updateFromNow(updated));
  }, [rawLogs, effectiveSolPrice]);

  // Socket event handler
  const handleNewLog = (data) => {
    const newLogArray = data?.newLog;
    if (!newLogArray || !Array.isArray(newLogArray)) return;

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
    if (effectiveSocket) {
      effectiveSocket.on('NEW_LOG', handleNewLog);
    }
  }, [effectiveSocket]);

  const disconnectSocket = useCallback(() => {
    if (effectiveSocket) {
      effectiveSocket.off('NEW_LOG', handleNewLog);
    }
  }, [effectiveSocket]);

  useEffect(() => {
    fetchSettings();
    setupSocketConnection();
    return () => disconnectSocket();
  }, [fetchSettings, setupSocketConnection, disconnectSocket]);

  // Sync rawLogs with initialHistory from props/Redux
  useEffect(() => {
    setRawLogs(effectiveHistory);
  }, [effectiveHistory]);

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

  const uniqueHistory = historyState.filter(
    (row, index, self) => index === self.findIndex((t) => t._id === row._id)
  );

  return (
    <Box className="overflowX">
      <Box className="table main-history-table">
        {historyState?.length === 0 && (
          <Box className="dont-have-game-msg" sx={{ width: '100%' }}>
            <Skeleton variant="rectangular" sx={{ width: '100%', height: 10 }} />
          </Box>
        )}

        {uniqueHistory.map((row, key) => {
          const isUserInvolved =
            row.creator?._id === effectiveUserId || row.joined_user?._id === effectiveUserId;

          return (
            <Box
            key={row._id}
            className={`table-row ${isUserInvolved ? 'history-background' : ''} ${
              key < 50 ? 'slide-in' : ''
            }`}
            sx={{
              animationDelay: `${key * 0.1}s`,
              filter: row.status !== 'open' ? 'opacity(60%)' : 'none',
              // Glassmorphism styles (default dark mode colors)
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)', // For Safari
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              // Fallback for browsers without backdrop-filter
              '@supports not (backdrop-filter: blur(10px))': {
                background: 'rgba(0, 0, 0, 0.4)',
              },
              // Hover effect for interactivity
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.3)',
                boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
              },
              // Adjust history-background for slight differentiation
              '&.history-background': {
                background: 'rgba(0, 0, 0, 0.25)',
                '@supports not (backdrop-filter: blur(10px))': {
                  background: 'rgba(0, 0, 0, 0.45)',
                },
              },
            }}
          >
              <Box>
                <Box className="table-cell" sx={{ padding: '10px' }}>
                  <div className="desktop-only">{row.finalMsg || '...'}</div>
                  <div className="mobile-only">{row.finalMsg || '...'}</div>
                </Box>

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
                   
                  {/* {row.from_now && row.from_now.split('').map((char, i) => (
                    <Box
                      component="span"
                      key={i}
                      sx={{ fontSize: isNaN(char) ? '0.5em' : '0.8em' }}
                    >
                      {char}
                    </Box>
                  ))}
                   
                  <FontAwesomeIcon icon={faStopwatch} /> */}
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

export default HistoryTable;