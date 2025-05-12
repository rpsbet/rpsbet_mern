import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  setHighlightedRooms,
  clearHighlightedRooms,
} from '../../redux/Logic/logic.actions';
import { getSettings } from '../../redux/Setting/setting.action';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';

import {
  Tooltip,
  Skeleton,
  Box,
  Typography,
  useTheme,
  alpha
} from '@mui/material';
import PlayerModal from '../modal/PlayerModal';
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

/**
 * Formats a timestamp into a human-readable "time ago" string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted time string (e.g. "5m ago")
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

const updateTimestamps = (history) => {
  if (!history || !Array.isArray(history)) return [];

  return history.map((item) => ({
    ...item,
    from_now: formatTimeAgo(item.created_at),
  }));
};


/**
 * Updates the "from now" property for all history items
 * @param {Array} history - History items array
 * @returns {Array} Updated history items with refreshed timestamps
 */


/**
 * HistoryTable component displays a real-time transaction history
 * with filtering and interactive elements
 */
function HistoryTable({
  socket: propSocket,
  history: propHistory,
  userId: propUserId,
  solPrice: propSolPrice,
}) {
  const dispatch = useDispatch();
  const theme = useTheme();

  // Get values from Redux store
  const {
    socket: reduxSocket,
    history: reduxHistory,
    userId: reduxUserId,
    solPrice: reduxSolPrice
  } = useSelector((state) => ({
    socket: state.auth.socket,
    history: state.logic.history,
    userId: state.auth.user?._id,
    solPrice: state.logic.solPrice,
  }));

  // Use prop values if provided, otherwise use Redux state
  const socket = propSocket ?? reduxSocket;
  const initialHistory = propHistory ?? reduxHistory;
  const userId = propUserId ?? reduxUserId;
  const solPrice = propSolPrice ?? reduxSolPrice;

  // Local state
  const [rawLogs, setRawLogs] = useState(initialHistory || []);
  const [historyState, setHistoryState] = useState([]);
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState(null);
  const [copiedRowId, setCopiedRowId] = useState(null);

  // Fetch settings once on component mount
  const fetchSettings = useCallback(async () => {
    try {
      await dispatch(getSettings());
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [dispatch]);

  /**
   * Renders avatar with player information
   * @param {Object} userObj - User data object
   * @returns {JSX.Element|null} Avatar component or null if no user
   */
  const renderAvatar = useCallback((userObj) => {
    if (!userObj?._id) return null;

    return (
      <Box
        component="a"
        onClick={() => handleOpenPlayerModal(userObj._id)}
        sx={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center'
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
          className="avatar"
          style={{
            display: 'inline-block',
            marginRight: 8,
            verticalAlign: 'middle',
          }}
        />
      </Box>
    );
  }, []);

  /**
   * Renders room information with ticker and image
   * @param {Object} roomObj - Room data object
   * @returns {JSX.Element|null} Room info component or null
   */
  const renderRoomInfo = useCallback((roomObj) => {
    if (!roomObj?._id) return null;

    const displayRoom = `(${roomObj.ticker})`;

    return (
      <Box
        component="a"
        href={`/join/${roomObj._id}`}
        sx={{
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          }
        }}
        className="room"
      >
        <img
          src={roomObj.image}
          alt={roomObj.ticker || 'room'}
          className="game-type-icon"
          loading="lazy"
          style={{
            display: 'inline-block',
            marginLeft: 6,
            marginRight: 4,
            width: 16,
            height: 16
          }}
        />
        <Typography
          variant="body2"
          sx={{
            mr: 0.5,
            color: '#fff'
          }}
        >
          {displayRoom}
        </Typography>
      </Box>
    );
  }, [theme.palette.text.primary]);

  /**
   * Builds message content based on log action type
   * @param {Object} logItem - Log data object
   * @returns {JSX.Element} Formatted message content
   */
  const buildFinalMessage = useCallback((logItem) => {
    if (!solPrice) {
      return 'Loading price...';
    }

    const betAmt = convertToCurrency(logItem.bet_amount, solPrice);
    const winnings = convertToCurrency(logItem.winnings, solPrice);
    const joinedUser = logItem.joined_user || {};
    const creator = logItem.creator || {};

    // Common style for all messages
    const messageStyles = {
      fontSize: '0.8rem',
      fontWeight: 500,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 1,
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    };

    // Highlight amounts with different colors based on action
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
          return theme.palette.info.main;
      }
    };

    const AmountText = ({ children, action }) => (

        <Typography
          component="span"
          sx={{
            color: getAmountColor(action),
            fontWeight: 700
          }}
        >
          {children}
        </Typography>


    );

  switch (logItem.action) {
    case 'won': {
      const totalWin = convertToCurrency(logItem.winnings, solPrice);
      return (
        <Box sx={messageStyles}>
          {renderAvatar(joinedUser)} won <AmountText action="won">{totalWin}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    }
    case 'receivedAutoPayout':
      return (
        <Box sx={messageStyles}>
          Raydium Pool seeded for {renderRoomInfo(logItem.room)}
        </Box>
      );
    case 'created':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(creator)} created {renderRoomInfo(logItem.room)} with <AmountText action="created">{betAmt}</AmountText>
        </Box>
      );
    case 'rugged':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(creator)} rugged <AmountText action="rugged">{winnings}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    case 'split': {
      const splitAmt = convertToCurrency(logItem.bet_amount * 2, solPrice);
      return (
        <Box sx={messageStyles}>
          {renderAvatar(joinedUser)} split <AmountText action="split">{splitAmt}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    }
    case 'lost':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(joinedUser)} lost <AmountText action="lost">{betAmt}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    case 'jeet':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(creator)} Jeeted <AmountText action="jeet">{betAmt}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    case 'pumped':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(creator)} Pumped <AmountText action="pumped">{betAmt}</AmountText> in {renderRoomInfo(logItem.room)}
        </Box>
      );
    case 'withdrew':
      return (
        <Box sx={messageStyles}>
          {renderAvatar(creator)} withdrew <AmountText action="withdrew">{betAmt}</AmountText>
        </Box>
      );
    default:
      return (
        <Box sx={messageStyles}>
          Action: {logItem.action || 'None'}, Amount: {renderRoomInfo(logItem.room)}
        </Box>
      );
  }
}, [renderAvatar, renderRoomInfo, solPrice, theme.palette]);

// Socket event handler for new logs
const handleNewLog = useCallback((data) => {
  const newLogArray = data?.newLog;
  if (!newLogArray || !Array.isArray(newLogArray)) return;

  const [firstLog] = newLogArray;
  if (firstLog?.room?._id) {
    dispatch(setHighlightedRooms([firstLog.room._id]));

    // Clear highlighted rooms after a short delay
    setTimeout(() => {
      dispatch(clearHighlightedRooms());
    }, 200);
  }

  setRawLogs(newLogArray);
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

// Initial setup
useEffect(() => {
  fetchSettings();
}, [fetchSettings]);

// Update history when initialHistory changes
useEffect(() => {
  setRawLogs(initialHistory || []);
}, [initialHistory]);

useEffect(() => {
  if (!rawLogs || rawLogs.length === 0) {
    setHistoryState([]);
    return;
  }

  const updated = rawLogs.map((item) => ({
    ...item,
    finalMsg: buildFinalMessage(item),
    from_now: formatTimeAgo(item.created_at),
  }));

  setHistoryState(updated);
}, [rawLogs, buildFinalMessage]);

// Filter out duplicate entries by ID
const uniqueHistory = useMemo(() => {
  if (!historyState.length) return [];

  return historyState.filter(
    (row, index, self) => index === self.findIndex((t) => t._id === row._id)
  );
}, [historyState]);

// Player modal handlers
const handleOpenPlayerModal = useCallback((creatorId) => {
  setShowPlayerModal(true);
  setSelectedCreator(creatorId);
}, []);

const handleClosePlayerModal = useCallback(() => {
  setShowPlayerModal(false);
  setSelectedCreator(null);
}, []);

// Copy ID to clipboard
const copyToClipboard = useCallback((rowId) => {
  navigator.clipboard.writeText(rowId).then(() => {
    setCopiedRowId(rowId);
    setTimeout(() => setCopiedRowId(null), 1500);
  });
}, []);

// Row styles based on user involvement and theme
const getRowStyles = useCallback((rowIndex, status) => {
  return {
    padding: '10px 12px',
    animationDelay: `${rowIndex * 0.05}s`,
    opacity: status !== 'open' ? 0.75 : 1,
    background: alpha(theme.palette.error.main, 0.08),
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    borderRadius: '8px',
    border: `1px solid ${alpha(theme.palette.error.main, 0.2)}`,
    transition: 'all 0.2s ease',
    boxShadow: `0 2px 8px ${alpha(theme.palette.error.main, 0.15)}`,
    '@supports not (backdrop-filter: blur(10px))': {
      background: alpha(theme.palette.error.main, 0.15)
    },
    '&:hover': {
      background: alpha(theme.palette.error.main, 0.12),
      boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.25)}`,
      transform: 'translateY(-1px)'
    },
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };
}, [theme]);
// Styles for time display
const timeDisplayStyles = useMemo(() => ({
  display: 'flex',
  alignItems: 'center',
  fontSize: '0.7rem',
  color: alpha(theme.palette.text.secondary, 0.8),
  whiteSpace: 'nowrap',
  marginLeft: '8px',
  '& svg': {
    fontSize: '0.7rem',
    marginRight: '4px'
  }
}), [theme]);

// Loading skeleton
const renderSkeleton = useMemo(() => (
  <Box >
    {[].map((i) => (
      <Box key={i}>
        <Skeleton variant="rectangular" sx={{ borderRadius: '8px' }} />
      </Box>
    ))}
  </Box>
), []);

return (
  <ThemeProvider theme={getCustomTheme()}>
    <Box
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {(!uniqueHistory || uniqueHistory.length === 0) && renderSkeleton}

        {uniqueHistory.map((row, index) => {
          const isUserInvolved =
            row.creator?._id === userId || row.joined_user?._id === userId;

          return (
            <Box
              key={row._id}
              className={`history-row ${index < 50 ? 'slide-in' : ''}`}
              sx={getRowStyles(isUserInvolved, index, row.status)}
            >
              <Box sx={{ flexGrow: 1 }}>
                {row.finalMsg || (
                  <Skeleton variant="text" sx={{ width: '80%', }} />
                )}
              </Box>

              {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Tooltip
                    title={copiedRowId === row._id ? 'Copied!' : 'Copy ID'}
                    placement="top"
                  >
                    <Box
                      component="button"
                      sx={{
                        border: 'none',
                        background: 'transparent',
                        padding: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        color: theme.palette.text.secondary,
                        opacity: 0.6,
                        transition: 'opacity 0.2s',
                        '&:hover': {
                          opacity: 1
                        }
                      }}
                      onClick={() => copyToClipboard(row._id)}
                    >
                      <FileCopyIcon sx={{ width: 14, height: 14 }} />
                    </Box>
                  </Tooltip>

                  <Box sx={timeDisplayStyles}>
                    <FontAwesomeIcon icon={faStopwatch} />
                    <Typography variant="caption">
                      {row.from_now || ''}
                    </Typography>
                  </Box>
                </Box> */}
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
  </ThemeProvider>
);
}

export default React.memo(HistoryTable);