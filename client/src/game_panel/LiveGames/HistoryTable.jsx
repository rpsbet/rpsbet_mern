import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setHighlightedRooms, clearHighlightedRooms, moveRoomToFront, loadIndividualRoom } from '../../redux/Logic/logic.actions';
import { differenceInSeconds, differenceInMinutes, differenceInHours, differenceInDays, isValid } from 'date-fns';
import { Box, Typography, useTheme, alpha, Fade, Chip } from '@mui/material';
import PlayerModal from '../modal/PlayerModal';
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import { loggedSocketOn } from '../../utils/socketEventLogger';
import {
  TrendingUp,
  TrendingDown,
  Add as CreateIcon,
  RemoveCircle as RugIcon,
  CallSplit as SplitIcon,
  GetApp as WithdrawIcon,
  Bolt as PumpIcon,
  MonetizationOn as SeedIcon
} from '@mui/icons-material';

/**
 * Formats a timestamp into a human-readable "time ago" string
 */
const formatTimeAgo = (date) => {
  const now = new Date();
  const dateObj = new Date(date);
  if (!isValid(dateObj)) return 'Invalid Date';

  const seconds = differenceInSeconds(now, dateObj);
  if (seconds < 60) return `${Math.round(seconds)}s`;

  const minutes = differenceInMinutes(now, dateObj);
  if (minutes < 60) return `${Math.round(minutes)}m`;

  const hours = differenceInHours(now, dateObj);
  if (hours < 24) return `${Math.round(hours)}h`;

  const days = differenceInDays(now, dateObj);
  return `${Math.round(days)}d`;
};

/**
 * Get action icon and styling
 */
const getActionIcon = (action) => {
  const iconProps = { fontSize: 'small', sx: { fontSize: '14px' } };

  switch (action) {
    case 'won':
      return <TrendingUp {...iconProps} sx={{ ...iconProps.sx, color: '#00ff3a' }} />;
    case 'lost':
      return <TrendingDown {...iconProps} sx={{ ...iconProps.sx, color: '#ff4444' }} />;
    case 'created':
      return <CreateIcon {...iconProps} sx={{ ...iconProps.sx, color: '#03ff3b' }} />;
    case 'rugged':
      return <RugIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ff1744' }} />;
    case 'split':
      return <SplitIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ffa726' }} />;
    case 'withdrew':
      return <WithdrawIcon {...iconProps} sx={{ ...iconProps.sx, color: '#ab47bc' }} />;
    case 'pumped':
      return <PumpIcon {...iconProps} sx={{ ...iconProps.sx, color: '#66bb6a' }} />;
    case 'receivedAutoPayout':
      return <SeedIcon {...iconProps} sx={{ ...iconProps.sx, color: '#42a5f5' }} />;
    case 'jeet':
      return <TrendingDown {...iconProps} sx={{ ...iconProps.sx, color: '#ff7043' }} />;
    default:
      return <CreateIcon {...iconProps} sx={{ ...iconProps.sx, color: '#90a4ae' }} />;
  }
};

/**
 * Get action color based on type
 */
const getActionColor = (action) => {
  switch (action) {
    case 'won':
    case 'split':
    case 'pumped':
      return '#00ff3a';
    case 'lost':
    case 'rugged':
    case 'jeet':
      return '#ff4444';
    case 'created':
      return '#03ff3b';
    case 'withdrew':
      return '#ab47bc';
    case 'receivedAutoPayout':
      return '#42a5f5';
    default:
      return '#90a4ae';
  }
};

/**
 * Enhanced HistoryTable - Displays the most recent transaction with improved design
 */
function HistoryTable({ socket: propSocket, history: propHistory, solPrice: propSolPrice }) {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Get values from Redux store
  const reduxSocket = useSelector((state) => state.auth.socket);
  const reduxHistory = useSelector((state) => state.logic.history);
  const userId = useSelector((state) => state.auth.user?._id);
  const reduxSolPrice = useSelector((state) => state.logic.solPrice);

  // Use prop values if provided, otherwise use Redux state
  const socket = propSocket ?? reduxSocket;
  const history = propHistory ?? reduxHistory;
  const solPrice = propSolPrice ?? reduxSolPrice;

  // Local state
  const [latestItem, setLatestItem] = useState(null);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [isNewItem, setIsNewItem] = useState(false);
  
  // Add ref to track if we have a socket update that should take priority
  const socketUpdateRef = useRef(null);

  // Get the most recent history item
  useEffect(() => {
    // If we have a pending socket update, don't override it with history data
    if (socketUpdateRef.current) {
      return;
    }

    let historyArray = [];

    if (history) {
      if (Array.isArray(history)) {
        historyArray = history;
      } else if (typeof history === 'object' && history._id) {
        historyArray = [history];
      } else if (history.history && Array.isArray(history.history)) {
        historyArray = history.history;
      }
    }

    if (historyArray.length > 0) {
      const newLatest = historyArray[0];
      // Only update if this is actually a different item
      if (!latestItem || newLatest._id !== latestItem._id) {
        setLatestItem(newLatest);
      }
    } else {
      setLatestItem(null);
    }
  }, [history]); // Removed latestItem from dependency array

  // Socket event handler for new logs
  const handleNewLog = useCallback((data) => {
    console.log("🔔 NEW_LOG received in HistoryTable:", data);
    const newLogArray = data?.newLog;
    if (!newLogArray || !Array.isArray(newLogArray) || newLogArray.length === 0) return;

    const [firstLog] = newLogArray;

    // Highlight room briefly
    if (firstLog?.room?._id) {
      dispatch(setHighlightedRooms([firstLog.room._id]));
      setTimeout(() => dispatch(clearHighlightedRooms()), 200);
    }

    // Mark that we have a socket update and set the new item
    socketUpdateRef.current = firstLog;
    setIsNewItem(true);
    setLatestItem(firstLog);
    
    // Clear the socket update flag after animation and allow history updates again
    setTimeout(() => {
      setIsNewItem(false);
      socketUpdateRef.current = null;
    }, 2000);
  }, [dispatch]);

  // Socket event handler for highlighting first room
  const handleHighlightFirstRoom = useCallback((data) => {
    console.log('🎯 HIGHLIGHT_FIRST_ROOM received in HistoryTable:', data);
    
    // Apply room highlighting effects if utilities are available
    if (window.roomHighlightEffects && data?.roomId) {
      console.log('🎯 HistoryTable: Applying visual highlight to room:', data.roomId);
      window.roomHighlightEffects.highlightRoom(data.roomId, {
        result: data.result,
        username: data.username,
        betAmount: data.betAmount,
        intensity: data.intensity || 'violent',
        duration: data.duration || 8000 // Keep original duration for big wins
      });
    }
    
    // Also trigger Redux highlighting for the room
    if (data?.roomId) {
      // Don't load fresh data - we already received updated data via socket
      // Just move the room to front and highlight it
      console.log('🎯 HistoryTable: Moving room to front of Redux roomIds:', data.roomId);
      dispatch(moveRoomToFront(data.roomId));
      
      dispatch(setHighlightedRooms([data.roomId]));
      setTimeout(() => dispatch(clearHighlightedRooms()), data.duration || 8000); // Keep original duration
    }
  }, [dispatch]);

  // Socket event handler for room activity burst
  const handleRoomActivityBurst = useCallback((data) => {
    console.log('💥 ROOM_ACTIVITY_BURST received in HistoryTable:', data);
    
    // Apply room activity burst effects if utilities are available
    if (window.roomHighlightEffects && data?.roomId) {
      window.roomHighlightEffects.highlightRoom(data.roomId, {
        result: data.result,
        username: data.user,
        betAmount: data.amount,
        intensity: 'violent',
        duration: 6000
      });
    }
  }, [dispatch]);

  // Set up socket connection
  useEffect(() => {
    if (!socket || typeof socket.on !== 'function') return;

    // Use logged socket event handlers
    loggedSocketOn(socket, 'NEW_LOG', handleNewLog, 'HistoryTable');
    loggedSocketOn(socket, 'HIGHLIGHT_FIRST_ROOM', handleHighlightFirstRoom, 'HistoryTable');
    loggedSocketOn(socket, 'ROOM_ACTIVITY_BURST', handleRoomActivityBurst, 'HistoryTable');

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('NEW_LOG', handleNewLog);
        socket.off('HIGHLIGHT_FIRST_ROOM', handleHighlightFirstRoom);
        socket.off('ROOM_ACTIVITY_BURST', handleRoomActivityBurst);
      }
    };
  }, [socket, handleNewLog, handleHighlightFirstRoom, handleRoomActivityBurst]);

  const CompactAvatar = ({ userObj, onClick }) => {
    if (!userObj?._id) return null;
    return (
      <Box
        component="span"
        onClick={onClick}
        sx={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'transform 0.2s ease',

        }}
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
            marginRight: 6,
            verticalAlign: 'middle',
            width: 20,
            height: 20,
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '50%'
          }}
        />
      </Box>
    );
  };

  // Enhanced room chip
  const CompactRoom = ({ roomObj }) => {
    if (!roomObj?._id) return null;
    return (
      <Chip
        component="a"
        href={`/join/${roomObj._id}`}
        label={roomObj.ticker}
        size="small"
        sx={{
          cursor: 'pointer',
          textDecoration: 'none',
          height: '18px',
          fontSize: '0.65rem',
          fontWeight: 700,
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          color: '#ff0000',
          border: '1px solid rgba(255, 0, 0, 0.3)',
          '& .MuiChip-label': {
            padding: '0 6px'
          }
        }}
      />
    );
  };

  // Enhanced amount display with icons
  const AmountDisplay = ({ amount, action, showIcon = true }) => (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
      {showIcon && getActionIcon(action)}
      <Typography
        component="span"
        sx={{
          color: getActionColor(action),
          fontWeight: 700,
          fontSize: '0.75rem',
          textShadow: `0 0 8px ${alpha(getActionColor(action), 0.3)}`
        }}
      >
        {amount}
      </Typography>
    </Box>
  );

  // Build enhanced message content
  const buildMessage = useCallback((logItem) => {
    if (!solPrice || !logItem) return '';

    const betAmt = convertToCurrency(logItem.bet_amount, solPrice);
    const winnings = convertToCurrency(logItem.winnings, solPrice);
    const joinedUser = logItem.joined_user || {};
    const creator = logItem.creator || {};

    const messageStyles = {
      fontSize: '0.75rem',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 0.75,
      color: '#fff',
      flexWrap: 'wrap'
    };

    const handleUserClick = (userObj) => {
      if (userObj?._id) {
        setShowPlayerModal(true);
        setSelectedCreator(userObj._id);
      }
    };

    switch (logItem.action) {
      case 'won':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} onClick={() => handleUserClick(joinedUser)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>won</Typography>
            <AmountDisplay amount={winnings} action="won" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>in</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'created':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} onClick={() => handleUserClick(creator)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>created</Typography>
            <CompactRoom roomObj={logItem.room} />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <AmountDisplay amount={betAmt} action="created" />
          </Box>
        );
      case 'rugged':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} onClick={() => handleUserClick(creator)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>rugged</Typography>
            <AmountDisplay amount={winnings} action="rugged" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'split':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} onClick={() => handleUserClick(joinedUser)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>split</Typography>
            <AmountDisplay amount={convertToCurrency(logItem.bet_amount * 2, solPrice)} action="split" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'lost':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={joinedUser} onClick={() => handleUserClick(joinedUser)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>lost</Typography>
            <AmountDisplay amount={betAmt} action="lost" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'jeet':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} onClick={() => handleUserClick(creator)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>jeeted</Typography>
            <AmountDisplay amount={betAmt} action="jeet" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'pumped':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} onClick={() => handleUserClick(creator)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>pumped</Typography>
            <AmountDisplay amount={betAmt} action="pumped" />
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      case 'withdrew':
        return (
          <Box sx={messageStyles}>
            <CompactAvatar userObj={creator} onClick={() => handleUserClick(creator)} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>withdrew</Typography>
            <AmountDisplay amount={betAmt} action="withdrew" />
          </Box>
        );
      case 'receivedAutoPayout':
        return (
          <Box sx={messageStyles}>
            <SeedIcon sx={{ fontSize: '14px', color: '#42a5f5' }} />
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>Pool seeded</Typography>
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
      default:
        return (
          <Box sx={messageStyles}>
            <Typography component="span" sx={{ fontSize: '0.75rem', color: '#e0e0e0' }}>{logItem.action || 'Activity'}</Typography>
            <Typography component="span" sx={{ fontSize: '0.7rem', color: '#999' }}>•</Typography>
            <CompactRoom roomObj={logItem.room} />
          </Box>
        );
    }
  }, [solPrice]);

  // Don't render anything if no item
  if (!latestItem) {
    return (
      <Box
        sx={{
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          minHeight: '40px',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              backgroundColor: '#666',
              animation: 'pulse 1.5s infinite'
            }}
          />
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', fontWeight: 500 }}>
            Loading activity...
          </Typography>
        </Box>
      </Box>
    );
  }

  const isUserInvolved = latestItem.creator?._id === userId || latestItem.joined_user?._id === userId;

  return (
    <Box>
      <Box
        sx={{
          padding: '8px 16px',
          borderRadius: '8px',
          background: isNewItem
            ? 'linear-gradient(90deg, rgba(255, 0, 0, 0.15), rgba(255, 0, 0, 0.05))'
            : 'rgba(255, 255, 255, 0.02)',
          border: isNewItem
            ? '1px solid rgba(255, 0, 0, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s ease',
          position: 'relative',
          overflow: 'hidden',
      
          '&::before': isNewItem ? {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: 'linear-gradient(90deg, transparent, #ff0000, transparent)',
            animation: 'shimmer 2s ease-in-out'
          } : {},
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          opacity: isUserInvolved ? 1 : 0.95,
          minHeight: '40px',
          maxWidth: '100%'
        }}
      >
        <Box sx={{ flexGrow: 1, minWidth: 0,}}>
          {buildMessage(latestItem)}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, ml: 2 }}>
          {isUserInvolved && (
            <Chip
              label="YOU"
              size="small"
              sx={{
                height: '16px',
                fontSize: '0.6rem',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 0, 0, 0.2)',
                color: '#ff0000',
                border: '1px solid rgba(255, 0, 0, 0.4)',
                '& .MuiChip-label': { padding: '0 4px' }
              }}
            />
          )}
          <Typography
            variant="caption"
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: '0.65rem',
              fontWeight: 500,
              whiteSpace: 'nowrap'
            }}
          >
            {formatTimeAgo(latestItem.created_at)}
          </Typography>
        </Box>
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

    </Box>
  );
}

export default React.memo(HistoryTable);