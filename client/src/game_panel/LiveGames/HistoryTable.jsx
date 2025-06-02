import React, { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setHighlightedRooms, clearHighlightedRooms } from '../../redux/Logic/logic.actions';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, isValid } from 'date-fns';
import { Box, Typography, useTheme, alpha } from '@mui/material';
import PlayerModal from '../modal/PlayerModal';
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import { transform } from 'lodash';

/**
 * Formats a timestamp into a human-readable "time ago" string
 */
const formatTimeAgo = (date) => {
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

/**
 * SingleHistoryItem - Displays the most recent transaction with real-time updates
 */
function SingleHistoryItem({ socket: propSocket, history: propHistory, solPrice: propSolPrice }) {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Get values from Redux store
  const {
    socket: reduxSocket,
    history: reduxHistory,
    userId,
    solPrice: reduxSolPrice
  } = useSelector((state) => ({
    socket: state.auth.socket,
    history: state.logic.history,
    userId: state.auth.user?._id,
    solPrice: state.logic.solPrice,
  }));

  // Use prop values if provided, otherwise use Redux state
  const socket = propSocket ?? reduxSocket;
  const history = propHistory ?? reduxHistory;
  const solPrice = propSolPrice ?? reduxSolPrice;

  // Local state - only need the latest item
  const [latestItem, setLatestItem] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);

  // Get the most recent history item
  useEffect(() => {
    if (history && Array.isArray(history) && history.length > 0) {
      setLatestItem(history[0]); // Get the first (most recent) item
    }
  }, [history]);

  // Socket event handler for new logs
  const handleNewLog = useCallback((data) => {
    const newLogArray = data?.newLog;
    if (!newLogArray || !Array.isArray(newLogArray) || newLogArray.length === 0) return;

    const [firstLog] = newLogArray;
    
    // Highlight room briefly
    if (firstLog?.room?._id) {
      dispatch(setHighlightedRooms([firstLog.room._id]));
      setTimeout(() => dispatch(clearHighlightedRooms()), 200);
    }

    // Update to show the newest item
    setLatestItem(firstLog);
  }, [dispatch]);

  // Set up socket connection
  useEffect(() => {
    if (socket) {
      socket.on('NEW_LOG', handleNewLog);
    }
    return () => {
      if (socket) {
        socket.off('NEW_LOG', handleNewLog);
      }
    };
  }, [socket, handleNewLog]);

  // Render avatar with click handler
  const renderAvatar = useCallback((userObj) => {
    if (!userObj?._id) return null;

    return (
      <Box
        component="span"
        onClick={() => {
          setShowPlayerModal(true);
          setSelectedCreator(userObj._id);
        }}
        sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
      >
        <Avatar
          user_id={userObj._id}
          src={userObj.avatar}
          username={userObj.username}
          rank={userObj.totalWagered}
          accessory={userObj.accessory}
          elite={userObj.elite}
          alt={userObj.username || ''}
          style={{
            display: 'inline-block',
            marginRight: 8,
            verticalAlign: 'middle',
          }}
        />
      </Box>
    );
  }, []);

  // Render room info with link
  const renderRoomInfo = useCallback((roomObj) => {
    if (!roomObj?._id) return null;

    return (
      <Box
        component="a"
        href={`/join/${roomObj._id}`}
        sx={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          '&:hover': { textDecoration: 'underline' }
        }}
      >
        <img
          src={roomObj.image}
          alt={roomObj.ticker || 'room'}
          loading="lazy"
          style={{
            display: 'inline-block',
            marginLeft: 6,
            marginRight: 4,
            width: 16,
            height: 16
          }}
        />
        <Typography variant="body2" sx={{ mr: 0.5, color: '#fff' }}>
          ({roomObj.ticker})
        </Typography>
      </Box>
    );
  }, []);

  // Build compact message content
  const buildMessage = useCallback((logItem) => {
    if (!solPrice || !logItem) return 'Loading...';

    const betAmt = convertToCurrency(logItem.bet_amount, solPrice);
    const winnings = convertToCurrency(logItem.winnings, solPrice);
    const joinedUser = logItem.joined_user || {};
    const creator = logItem.creator || {};

    const getAmountColor = (action) => {
      switch (action) {
        case 'won':
        case 'split':
          return '#00ff3a';
        case 'lost':
        case 'rugged':
        case 'jeet':
          return theme.palette.error.main;
        default:
          return theme.palette.success.light;
      }
    };

    const AmountText = ({ children, action }) => (
      <Typography component="span" sx={{ color: getAmountColor(action), fontWeight: 600, fontSize: '0.7rem' }}>
        {children}
      </Typography>
    );

    const messageStyles = {
      fontSize: '0.7rem',
      fontWeight: 400,
      display: 'flex',
      alignItems: 'center',
      gap: 0.5,
      color: '#fff',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    };

    // Compact avatar (smaller)
    const CompactAvatar = ({ userObj }) => {
      if (!userObj?._id) return null;
      return (
        <Box
          component="span"
          onClick={() => {
            setShowPlayerModal(true);
            setSelectedCreator(userObj._id);
          }}
          sx={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        >
          <Avatar
            user_id={userObj._id}
            src={userObj.avatar}
            username={userObj.username}
            rank={userObj.totalWagered}
            accessory={userObj.accessory}
            elite={userObj.elite}
            alt={userObj.username || ''}
            style={{
              display: 'inline-block',
              marginRight: 4,
              verticalAlign: 'middle',
              width: 16,
              height: 16
            }}
          />
        </Box>
      );
    };

    // Compact room info (just ticker)
    const CompactRoom = ({ roomObj }) => {
      if (!roomObj?._id) return null;
      return (
        <Typography
          component="a"
          href={`/join/${roomObj._id}`}
          sx={{
            cursor: 'pointer',
            textDecoration: 'none',
            color: alpha('#fff', 0.8),
            fontSize: '0.7rem',
            '&:hover': { textDecoration: 'underline' }
          }}
        >
          {roomObj.ticker}
        </Typography>
      );
    };

    switch (logItem.action) {
      case 'won':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} />
            won <AmountText action="won">{winnings}</AmountText> in <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'created':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} />
            created <CompactRoom roomObj={logItem.room} /> • <AmountText action="created">{betAmt}</AmountText>
          </Box>
        );
      case 'rugged':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} />
            rugged <AmountText action="rugged">{winnings}</AmountText> • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'split':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} />
            split <AmountText action="split">{convertToCurrency(logItem.bet_amount * 2, solPrice)}</AmountText> • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'lost':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} />
            lost <AmountText action="lost">{betAmt}</AmountText> • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'jeet':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} />
            jeeted <AmountText action="jeet">{betAmt}</AmountText> • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'pumped':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} />
            pumped <AmountText action="pumped">{betAmt}</AmountText> • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'withdrew':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} />
            withdrew <AmountText action="withdrew">{betAmt}</AmountText>
          </Box>
        );
      case 'receivedAutoPayout':
        return (
          <Box sx={messageStyles}>
            Pool seeded • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      default:
        return (
          <Box sx={messageStyles}>
            {logItem.action || 'Activity'} • <CompactRoom roomObj={logItem.room} />
          </Box>
        );
    }
  }, [solPrice, theme.palette]);

  // Don't render anything if no item
  if (!latestItem) {
    return (
      <Box
        sx={{
          padding: '6px 8px',
          background: alpha(theme.palette.error.main, 0.08),
          backdropFilter: 'blur(10px)',
          borderRadius: '6px',
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          display: 'flex',
          alignItems: 'center',
          minHeight: '32px'
        }}
      >
        <Typography variant="caption" sx={{ color: alpha('#fff', 0.5), fontSize: '0.7rem' }}>
          No activity
        </Typography>
      </Box>
    );
  }

  const isUserInvolved = latestItem.creator?._id === userId || latestItem.joined_user?._id === userId;

  return (
    <Box>
      <Box
        sx={{
          padding: '6px 8px',
          background: alpha(theme.palette.error.main, 0.08),
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: '6px',
          border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
          transition: 'all 0.2s ease',
          boxShadow: `0 1px 4px ${alpha(theme.palette.error.main, 0.1)}`,
          '@supports not (backdrop-filter: blur(10px))': {
            background: alpha(theme.palette.error.main, 0.15)
          },
          '&:hover': {
            background: alpha(theme.palette.error.main, 0.12),
            boxShadow: `0 2px 6px ${alpha(theme.palette.error.main, 0.2)}`,
          },
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: isUserInvolved ? 1 : 0.9,
          animation: 'slideIn 0.3s ease-out',
          minHeight: '32px',
          maxWidth: '100%',
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {buildMessage(latestItem)}
        </Box>
        
        <Typography 
          variant="caption" 
          sx={{ 
            color: alpha('#fff', 0.4),
            fontSize: '0.6rem',
            whiteSpace: 'nowrap',
            marginLeft: 1,
            flexShrink: 0
          }}
        >
          {formatTimeAgo(latestItem.created_at)}
        </Typography>
      </Box>

      {showPlayerModal && (
        <PlayerModal
          modalIsOpen={showPlayerModal}
          closeModal={() => {
            setShowPlayerModal(false);
            setSelectedCreator(null);
          }}
          selectedCreator={selectedCreator}
        />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Box>
  );
}

export default React.memo(SingleHistoryItem);