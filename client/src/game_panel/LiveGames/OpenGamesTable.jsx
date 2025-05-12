import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getRoomList,
  actionRoom,
  setRoomList,
  getRecentlyClosed,
} from '../../redux/Logic/logic.actions';
import isEqual from 'lodash/isEqual';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  LockOutlined,
  Add,
  Remove,
} from '@mui/icons-material';
import {
  AvatarGroup,
  Grid,
  Pagination,
  Tooltip,
  Typography,
  Skeleton,
  Box,
  Button,
  Card,
  Chip,
  Link,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';

import {
  faHeart,
  faHeartBroken,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Avatar from '../../components/Avatar';
import { convertToCurrency } from '../../util/conversion';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';
import Battle from '../icons/Battle';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import PlayerModal from '../modal/PlayerModal';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import { LikeDislikeView } from '../../components/LikeDislikeView';

function OpenGamesTable(props) {
  const {
    selectedGameType,
    loading: propLoading,
    isDarkMode: propIsDarkMode,
    showPlayerModal,
    selectedCreator,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    onlineUserList,
    balance: propBalance,
    connectedAccount: propConnectedAccount,
    solPrice: propSolPrice,
  } = props;

  const dispatch = useDispatch();

  const recentlyClosed = useSelector(state => state.logic.recentlyClosed, isEqual);
  const user = useSelector(state => state.auth.user, isEqual);
  const highlightedRooms = useSelector(state => state.logic.highlightedRooms, isEqual);
  const loading = useSelector(state => state.logic.isActiveLoadingOverlay);
  const solPrice = useSelector(state => state.logic.solPrice);
  const roomList = useSelector(state => state.logic.roomList, isEqual);
  const connectedAccount = useSelector(state => state.auth.connectedAccount);

  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  const [localRoomList, setLocalRoomList] = useState(roomList);
  const [filter, setFilter] = useState('BEAT THE HOUSE');
  const [page, setPage] = useState(1);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const theme = getCustomTheme(effectiveIsDarkMode);

  const pageSize = 30;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedRooms = roomList.slice(startIndex, endIndex);
  const prevRoomListRef = useRef(roomList);

  useEffect(() => {
    dispatch(getRoomList());
  }, [dispatch]);

  useEffect(() => {
    if (!isEqual(prevRoomListRef.current, roomList)) {
      prevRoomListRef.current = roomList;
    }
    const mergedRooms = [
      ...roomList,
      ...localRoomList.filter(
        (room) => !roomList.some((newRoom) => newRoom._id === room._id),
      ),
    ];

    const extraRoomsInState = localRoomList.some(
      (stateRoom) =>
        !roomList.some((propRoom) => propRoom._id === stateRoom._id),
    );
    if (extraRoomsInState) {
      setLocalRoomList([...roomList]);
      return;
    }

    const highlightId = Array.from(highlightedRooms)[0];
    if (highlightId) {
      const index = mergedRooms.findIndex((r) => r._id === highlightId);
      if (index !== -1 && index !== 0) {
        const [highlighted] = mergedRooms.splice(index, 1);
        mergedRooms.unshift(highlighted);
        dispatch(setRoomList(mergedRooms));
      }
    }
    setLocalRoomList(mergedRooms);
  }, [roomList, highlightedRooms, dispatch]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const customFromNow = (date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const style = { fontSize: 'xx-small' };
  
    if (!isValid(dateObj)) return 'Invalid Date';
  
    const seconds = differenceInSeconds(now, dateObj);
    if (seconds < 60) {
      return (
        <>
          {Math.round(seconds)}
          <span style={style}>s</span>
        </>
      );
    }
  
    const minutes = differenceInMinutes(now, dateObj);
    if (minutes < 60) {
      return (
        <>
          {Math.round(minutes)}
          <span style={style}>m</span>
        </>
      );
    }
  
    const hours = differenceInHours(now, dateObj);
    if (hours < 24) {
      return (
        <>
          {Math.round(hours)}
          <span style={style}>h</span>
        </>
      );
    }
  
    const days = differenceInDays(now, dateObj);
    return (
      <>
        {Math.round(days)}
        <span style={style}>d</span>
      </>
    );
  };
  
  const updateFromNow = (historyArr) => {
    const result = JSON.parse(JSON.stringify(historyArr));
    for (let i = 0; i < result.length; i++) {
      result[i]['from_now'] = customFromNow(result[i]['updated_at']);
    }
    return result;
  };

  const handleFilterChange = useCallback(
    async (option) => {
      setFilter(option);
      if (option === 'RECENTLY MINTED') {
        setLoadingRecent(true);
        await dispatch(getRecentlyClosed());
        setLoadingRecent(false);
      }
    },
    [dispatch],
  );

  const joinRoom = useCallback(
    (roomDetails) => {
      const { roomStatus, id } = roomDetails;
      if (roomStatus === 'finished') {
        dispatch(errorMsgBar('THIS GAME HAS NOW ENDED'));
        return;
      }
      window.location.href = `/join/${id}`;
    },
    [dispatch],
  );

  const getColorClass = (value) => {
    if (value > 0) return { bg: 'rgba(211, 47, 47, 0.15)', border: 'rgba(211, 47, 47, 0.4)', text: '#FF0000' }; // Red for deposit
    if (value === 0) return { bg: 'rgba(128, 128, 128, 0.15)', border: 'rgba(128, 128, 128, 0.4)', text: '#808080' }; // Grey for zero
    return { bg: 'rgba(3, 255, 59, 0.15)', border: 'rgba(3, 255, 59, 0.4)', text: '#03ff3b' }; // Green for withdrawal
  };

  const isLiveGames = filter === 'BEAT THE HOUSE';
  const recent = recentlyClosed ? updateFromNow(recentlyClosed) : [];

  return (

    <ThemeProvider theme={theme}>
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}

      <Box
        sx={{
          ml: 3,
          mr: 3,
          display: 'flex',
          justifyContent: 'flex-start',
          marginBottom: '10px',
          gap: '8px',
          // Enable horizontal scrolling on mobile
          overflowX: { xs: 'auto', sm: 'visible' }, // Scroll on xs, no scroll on sm+
          flexWrap: { xs: 'nowrap', sm: 'wrap' }, // No wrap on xs, wrap on sm+
          whiteSpace: { xs: 'nowrap', sm: 'normal' }, // Prevent text wrapping on xs
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          scrollbarWidth: { xs: 'thin', sm: 'none' }, // Optional: Thin scrollbar on Firefox
          '&::-webkit-scrollbar': {
            height: { xs: '8px', sm: '0px' }, // Optional: Custom scrollbar height
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: { xs: 'rgba(0, 0, 0, 0.2)', sm: 'transparent' }, // Optional: Scrollbar color
            borderRadius: '4px',
          },
        }}
      >
        <Chip
          icon={<TrendingUpIcon sx={{ p: 0.5 }} />}
          label="BEAT THE HOUSE"
          onClick={() => handleFilterChange('BEAT THE HOUSE')}
          color={filter === 'BEAT THE HOUSE' ? 'error' : 'default'}
          variant={filter === 'BEAT THE HOUSE' ? 'filled' : 'outlined'}
          clickable
        />
        <Chip
          icon={<SchoolIcon sx={{ p: 0.5 }} />}
          label="RECENTLY MINTED"
          onClick={() => handleFilterChange('RECENTLY MINTED')}
          color={filter === 'RECENTLY MINTED' ? 'error' : 'default'}
          variant={filter === 'RECENTLY MINTED' ? 'filled' : 'outlined'}
          clickable
        />
        {/* <Chip
          icon={<ExitToAppIcon sx={{ p: 0.5 }} />}
          label="RECENTLY WD / DP"
          onClick={() => handleFilterChange('RECENTLY WD / DP')}
          color={filter === 'RECENTLY WD / DP' ? 'error' : 'default'}
          variant={filter === 'RECENTLY WD / DP' ? 'filled' : 'outlined'}
          clickable
        /> */}
      </Box>

      {filter === 'RECENTLY WD / DP' ? (
        <Grid container spacing={2} sx={{ p: 2 }}>
          {loadingTransactions ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    backgroundColor: effectiveIsDarkMode ? '#121212' : 'rgba(0, 0, 0, 0.05)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    height: '100%',
                  }}
                >
                  {/* Avatar */}
                  <Skeleton
                    variant="circular"
                    width={48}
                    height={48}
                    sx={{
                      mb: 2,
                      backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}
                  />

                  {/* Deposit/Withdraw amount */}
                  <Skeleton
                    variant="text"
                    width="80%"
                    height={24}
                    sx={{
                      mb: 1,
                      backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}
                  />

                  {/* Time */}
                  <Skeleton
                    variant="text"
                    width="40%"
                    height={16}
                    sx={{
                      mb: 2,
                      backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}
                  />

                  {/* View on Solscan button */}
                  <Skeleton
                    variant="rounded"
                    width="80%"
                    height={36}
                    sx={{
                      borderRadius: '8px',
                      backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                    }}
                  />
                </Card>
              </Grid>
            ))
          ) : recentTransactions.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                NO RECENT TRANSACTIONS
              </Typography>
            </Grid>
          ) : (
            recentTransactions.map((transaction) => (
              <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={transaction._id}>
                <Box
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    background: getColorClass(transaction.amount).bg, // Colored background
                    backdropFilter: 'blur(12px) saturate(120%)',
                    borderRadius: '16px',
                    border: `1px solid ${getColorClass(transaction.amount).border}`, // Colored border
                    boxShadow: `0 8px 32px rgba(0, 0, 0, 0.2), 0 0 10px ${getColorClass(transaction.amount).border}`, // Colored shadow
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: `linear-gradient(135deg, ${getColorClass(transaction.amount).bg}, rgba(255,255,255,0.05))`,
                      pointerEvents: 'none',
                    },
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: `0 12px 40px rgba(0, 0, 0, 0.3), 0 0 15px ${getColorClass(transaction.amount).border}`,
                      background: `${getColorClass(transaction.amount).bg.replace('0.15', '0.2')}`, // Slightly stronger on hover
                    },
                  }}
                >
                  <a style={{ cursor: 'pointer', }} onClick={(e) => {
                    e.stopPropagation();
                    handleOpenPlayerModal(transaction.user?._id);
                  }}>

                    <Avatar
                      alt={transaction.user?.username}
                      username={transaction.user?.username}
                      elite={transaction.user?.elite}
                      src={transaction.user?.avatar}

                      sx={{
                        cursor: 'pointer',
                        width: 48,
                        height: 48,
                        border: `2px solid ${getColorClass(transaction.amount).border}`, // Colored avatar border
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.15) rotate(5deg)',
                          borderColor: getColorClass(transaction.amount).text,
                          boxShadow: `0 0 15px ${getColorClass(transaction.amount).border}`,
                        },
                      }}
                    />
                  </a>

                  <Typography
                    component="span"
                    sx={{
                      mt: 1.5,
                      fontWeight: 'bold',
                      fontSize: '1.1rem',
                      color: '#ffffff', // White for readability
                      textShadow: `0 2px 4px rgba(0,0,0,0.3), 0 0 8px ${getColorClass(transaction.amount).text}`, // Colored glow
                    }}
                  >
                    {transaction.amount > 0
                      ? `DEPOSITED ${convertToCurrency(transaction.amount, effectiveSolPrice)}`
                      : `WITHDREW ${convertToCurrency(Math.abs(transaction.amount), effectiveSolPrice)}`}
                  </Typography>
                  <Typography
                    component="span"
                    sx={{
                      fontSize: '0.75rem',
                      color: 'rgba(255, 255, 255, 0.8)', // Slightly off-white for contrast
                      mt: 0.5,
                    }}
                  >
                    {customFromNow(transaction.created_at)}
                  </Typography>
                  <Link
                    href={`https://solscan.io/tx/${transaction.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={{
                      mt: 1.5,
                      fontSize: '0.85rem',
                      color: '#ffffff', // White for readability
                      textDecoration: 'none',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      background: `${getColorClass(transaction.amount).bg.replace('0.15', '0.25')}`, // Slightly stronger bg
                      border: `1px solid ${getColorClass(transaction.amount).border}`,
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: getColorClass(transaction.amount).text,
                        color: '#ffffff',
                        transform: 'scale(1.05)',
                        boxShadow: `0 0 10px ${getColorClass(transaction.amount).text}`,
                      },
                    }}
                  >
                    View on Solscan
                  </Link>
                </Box>
              </Grid>
            ))
          )}
        </Grid>
      ) : isLiveGames ? (
        <div className="table main-game-table open-games">
          {displayedRooms.length === 0 || effectiveLoading ? (
              <Grid container className="grid-container" spacing={1} style={{ padding: '20px' }}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={index}
                    sx={{
                      flexBasis: { xs: '100%' },
                      maxWidth: { xs: '100%' },
                      flexGrow: 1,
                    }}
                  >
                    <Card
                      sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '16px',
                        borderRadius: '16px',
                        backgroundColor: effectiveIsDarkMode ? '#121212' : '#FFFFFF',
                        boxShadow: effectiveIsDarkMode
                          ? '0 2px 8px rgba(0, 0, 0, 0.5)'
                          : '0 2px 8px rgba(0, 0, 0, 0.1)',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Header section with image and title */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: '8px', mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="70%" height={24} sx={{ mb: 0.5 }} />
                          <Skeleton variant="text" width="50%" height={16} />
                        </Box>
                        <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '8px' }} />
                      </Box>

                      {/* Battle section with avatars and center icon */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 1 }}>
                        <Box sx={{ display: 'flex' }}>
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px', ml: -1 }} />
                        </Box>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ display: 'flex' }}>
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px', mr: -1 }} />
                          <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: '10px' }} />
                        </Box>
                      </Box>

                      {/* Stats section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Skeleton
                          variant="rounded"
                          width="30%"
                          height={60}
                          sx={{ borderRadius: '12px' }}
                        />
                        <Skeleton
                          variant="rounded"
                          width="30%"
                          height={60}
                          sx={{ borderRadius: '12px' }}
                        />
                        <Skeleton
                          variant="rounded"
                          width="30%"
                          height={60}
                          sx={{ borderRadius: '12px' }}
                        />
                      </Box>

                      {/* Health bar and likes section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ width: '60%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Skeleton variant="text" width="20%" height={14} />
                            <Skeleton variant="text" width="15%" height={14} />
                          </Box>
                          <Skeleton variant="rounded" width="100%" height={8} sx={{ borderRadius: '20px' }} />
                        </Box>
                        <Box sx={{ width: '35%', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Skeleton variant="circular" width={24} height={24} />
                          <Skeleton variant="circular" width={24} height={24} />
                          <Skeleton variant="circular" width={24} height={24} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
          ) : displayedRooms.length === 0 ? (
            <div className="dont-have-game-msg">
              <div>NO LIVE GAMES, GO TO 'BE THE HOUSE' TO CREATE ONE</div>
            </div>
          ) : (
            <Grid
              container
              className="grid-container"
              spacing={1}
              style={{}}
            >
              {displayedRooms.map((row, index) => {
                const progressPercentage = row.endgame_amount
                  ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                  : 0;

                const isFirstItem = index === 0;

                return (
                  <Grid
                    item
                    xs={12}
                    key={row._id}
                    sx={{
                      flexBasis: '100% !important',
                      maxWidth: '100% !important',
                      flexGrow: 1,
                      padding: '8px',
                      position: 'relative',
                    }}
                  >
                    {isFirstItem && (
                      <>
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '-15px',
                            left: '20px',
                            width: '50px',
                            height: '50px',
                            zIndex: 10,
                            transform: 'rotate(-35deg)',
                            filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))',
                          }}
                        >

                        </Box>
                      </>
                    )}

                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: '16px',
                        ...(isFirstItem && {
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: '-4px',
                            left: '-4px',
                            right: '-4px',
                            bottom: '-4px',
                            borderRadius: '18px',
                            background: 'linear-gradient(45deg, #ff0000, #ff7300,rgb(255, 0, 93), #ff7300, #ff0000)',
                            backgroundSize: '300% 300%',
                            zIndex: 0,
                            boxShadow: '0 0 2px rgba(255, 115, 0, 0.7)',
                          },
                          '&:hover::before': {
                            boxShadow: '0 0 4px rgba(255, 115, 0, 0.9)',
                          },
                          '@keyframes gradientBorder': {
                            '0%': {
                              backgroundPosition: '0% 0%',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                            },
                            '25%': {
                              backgroundPosition: '100% 0%',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                            },
                            '50%': {
                              backgroundPosition: '100% 100%',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                            },
                            '75%': {
                              backgroundPosition: '0% 100%',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                            },
                            '100%': {
                              backgroundPosition: '0% 0%',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                            },
                          },
                        }),
                      }}
                    >
                      <Card
                        className={`table-row ${highlightedRooms.includes(row._id) ? 'highlighted-row' : ''}`}
                        onClick={(event) => {
                          if (!event.defaultPrevented) {
                            joinRoom({
                              id: row._id,
                              roomStatus: row.status,
                            });
                          }
                        }}
                        sx={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          padding: '20px',
                          borderRadius: '16px',
                          background: 'rgba(0, 0, 0, 0.2)',
                          backdropFilter: 'blur(10px)',
                          WebkitBackdropFilter: 'blur(10px)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          transition: 'all 0.3s ease',
                          position: 'relative',
                          overflow: 'hidden',
                          zIndex: 1,
                          '@supports not (backdrop-filter: blur(10px))': {
                            background: 'rgba(0, 0, 0, 0.4)',
                          },
                          '&:hover': {
                            background: 'rgba(0, 0, 0, 0.3)',
                            boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                            cursor: 'pointer',
                          },
                          '&.highlighted-row': {
                            background: 'rgba(0, 0, 0, 0.25)',
                            '@supports not (backdrop-filter: blur(10px))': {
                              background: 'rgba(0, 0, 0, 0.45)',
                            },
                          },
                          '&:before': {
                            content: '""',
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            transform: 'rotate(30deg)',
                            pointerEvents: 'none',
                          },
                          '&:hover:before': {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2.5 }}>
                          <Box
                            sx={{
                              borderRadius: '8px',
                              overflow: 'hidden',
                              marginRight: '16px',
                              border: effectiveIsDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                              width: 48,
                              height: 48,
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              background: effectiveIsDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)',
                            }}
                          >
                            <img
                              src={row.image}
                              alt={row.name}
                              style={{ width: 40, height: 40, objectFit: 'cover' }}
                            />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                lineHeight: 1.2,
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              {row.name}{' '}
                              <Typography
                                component="span"
                                color="text.secondary"
                                variant="body2"
                                sx={{
                                  ml: 0.75,
                                  fontWeight: 500,
                                  opacity: 0.7,
                                  letterSpacing: '0.5px'
                                }}
                              >
                                ({row.ticker})
                              </Typography>
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.85rem',
                                opacity: 0.8,
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {row.description.length > 24 ? `${row.description.slice(0, 24)}...` : row.description}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              ml: 'auto',
                              display: 'flex',
                              alignItems: 'center',
                              background: effectiveIsDarkMode ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.05)',
                              backdropFilter: 'blur(5px)',
                              padding: '6px 10px',
                              borderRadius: '8px',
                              border: effectiveIsDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.03)',
                            }}
                          >
                            <img
                              src={`/img/gametype/icons/${row.game_type?.short_name}.svg`}
                              alt={row.game_type?.short_name}
                              style={{ width: 20, height: 20 }}
                            />
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            mb: 3,
                            mt: 1,
                            position: 'relative',
                            '&:before': {
                              content: '""',
                              position: 'absolute',
                              left: '0',
                              right: '0',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              height: '3px',
                              background: row.joiners?.length === 0
                                ? 'rgba(255, 50, 50, 0.9)'
                                : `linear-gradient(90deg, rgba(255, 50, 50, 0.9) 0%, rgba(255, 50, 50, 0.9) ${row.hosts?.length > row.joiners?.length
                                  ? Math.max(0, 50 - (row.hosts?.length - row.joiners?.length) * 15)
                                  : row.joiners?.length > row.hosts?.length
                                    ? Math.min(100, 50 + (row.joiners?.length - row.hosts?.length) * 15)
                                    : 50
                                }%, rgba(253, 181, 0, 0.9) ${row.hosts?.length > row.joiners?.length
                                  ? Math.max(0, 50 - (row.hosts?.length - row.joiners?.length) * 15) + 1
                                  : row.joiners?.length > row.hosts?.length
                                    ? Math.min(100, 50 + (row.joiners?.length - row.hosts?.length) * 15) + 1
                                    : 51
                                }%, rgba(253, 181, 0, 0.9) 100%)`,
                              zIndex: 0,
                            },
                          }}
                        >
                          {row.hosts?.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
                              <AvatarGroup
                                max={2}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    border: 'none',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                    background: effectiveIsDarkMode ? '#ffffffe6' : '#f0f0f0',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                    marginLeft: '-10px',
                                  },
                                }}
                              >
                                {row.hosts.map((host, index) => (
                                  <Avatar
                                    key={index}
                                    alt={host.username}
                                    username={host.username}
                                    elite={host.elite}
                                    src={host.avatar}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPlayerModal(row.hosts[index]);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                      transition: 'transform 0.1s',
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                        zIndex: 10,
                                      },
                                    }}
                                  />
                                ))}
                              </AvatarGroup>
                            </Box>
                          )}

                          <Box
                            sx={{
                              mx: 3,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: effectiveIsDarkMode
                                ? 'linear-gradient(135deg, rgba(40, 52, 66, 0.8), rgba(32, 42, 56, 0.9))'
                                : 'linear-gradient(135deg, rgba(245, 245, 245, 0.8), rgba(255, 255, 255, 0.9))',
                              backdropFilter: 'blur(5px)',
                              boxShadow: effectiveIsDarkMode
                                ? '0 4px 15px rgba(0, 0, 0, 0.2)'
                                : '0 4px 15px rgba(0, 0, 0, 0.05)',
                              border: effectiveIsDarkMode
                                ? '1px solid rgba(255, 255, 255, 0.05)'
                                : '1px solid rgba(255, 255, 255, 0.7)',
                              zIndex: 2,
                              position: 'relative',
                              left: `${row.hosts?.length > row.joiners?.length
                                ? Math.max(-40, (50 - Math.min(50, (row.hosts?.length - row.joiners?.length) * 10)) * -1)
                                : row.joiners?.length > row.hosts?.length
                                  ? Math.min(40, Math.min(50, (row.joiners?.length - row.hosts?.length) * 10) - 50)
                                  : 0
                                }%`,
                            }}
                          >
                            <Battle
                              sx={{
                                fontSize: 22,
                                color: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.85)' : 'rgba(0, 0, 0, 0.7)',
                              }}
                            />
                          </Box>

                          {row.joiners?.length > 0 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
                              <AvatarGroup
                                max={2}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 36,
                                    height: 36,
                                    borderRadius: '10px',
                                    border: 'none',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
                                    background: effectiveIsDarkMode ? '#ffffffe6' : '#f0f0f0',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                    marginLeft: '-10px',
                                  },
                                }}
                              >
                                {row.joiners.map((joiner, index) => (
                                  <Avatar
                                    key={index}
                                    alt={joiner.username}
                                    elite={joiner.elite}
                                    username={joiner.username}
                                    src={joiner.avatar}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPlayerModal(row.joiners[index]);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                      transition: 'transform 0.1s',
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                        zIndex: 10,
                                      },
                                    }}
                                  />
                                ))}
                              </AvatarGroup>
                            </Box>
                          )}
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mb: 3,
                            px: 1
                          }}
                        >
                          <Box
                            sx={{
                              textAlign: 'center',
                              padding: '10px 16px',
                              borderRadius: '12px',
                              background: effectiveIsDarkMode
                                ? 'rgba(0, 0, 0, 0.15)'
                                : 'rgba(0, 0, 0, 0.03)',
                              backdropFilter: 'blur(5px)',
                              border: effectiveIsDarkMode
                                ? '1px solid rgba(255, 255, 255, 0.05)'
                                : '1px solid rgba(0, 0, 0, 0.03)',
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 500,
                                opacity: 0.7
                              }}
                            >
                              Liquidity
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                color: getColorClass(row.user_bet - row.bet_amount),
                                fontWeight: 700,
                                fontSize: '0.95rem'
                              }}
                            >
                              {convertToCurrency(row.user_bet, effectiveSolPrice)}
                              {row.user_bet !== row.bet_amount && (
                                <span style={{
                                  fontSize: '0.75rem',
                                  marginLeft: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}>
                                  {row.user_bet > row.bet_amount ? (
                                    <TrendingUpOutlined sx={{ fontSize: 14 }} />
                                  ) : (
                                    <TrendingDownOutlined sx={{ fontSize: 14 }} />
                                  )}
                                  {` (${(((row.user_bet - row.bet_amount) / row.bet_amount) * 100).toFixed(1)}%)`}
                                </span>
                              )}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              textAlign: 'center',
                              padding: '10px 16px',
                              borderRadius: '12px',
                              background: effectiveIsDarkMode
                                ? 'rgba(0, 0, 0, 0.15)'
                                : 'rgba(0, 0, 0, 0.03)',
                              backdropFilter: 'blur(5px)',
                              border: effectiveIsDarkMode
                                ? '1px solid rgba(255, 255, 255, 0.05)'
                                : '1px solid rgba(0, 0, 0, 0.03)',
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 500,
                                opacity: 0.7
                              }}
                            >
                              Battles
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.95rem'
                              }}
                            >
                              {row.battles}
                            </Typography>
                          </Box>

                          <Box
                            sx={{
                              textAlign: 'center',
                              padding: '10px 16px',
                              borderRadius: '12px',
                              background: effectiveIsDarkMode
                                ? 'rgba(0, 0, 0, 0.15)'
                                : 'rgba(0, 0, 0, 0.03)',
                              backdropFilter: 'blur(5px)',
                              border: effectiveIsDarkMode
                                ? '1px solid rgba(255, 255, 255, 0.05)'
                                : '1px solid rgba(0, 0, 0, 0.03)',
                            }}
                          >
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                fontSize: '0.7rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                fontWeight: 500,
                                opacity: 0.7
                              }}
                            >
                              Age
                            </Typography>
                            <Typography
                              variant="body1"
                              sx={{
                                fontWeight: 700,
                                fontSize: '0.95rem'
                              }}
                            >
                              {customFromNow(row.created_at)}
                            </Typography>
                          </Box>
                        </Box>

                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 0.5,
                          }}
                        >
                          <Box sx={{ position: 'relative', width: '60%' }}>
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                top: '-20px',
                                left: '0',
                                fontSize: '0.7rem',
                                opacity: 0.7,
                              }}
                            >
                              Health
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                position: 'absolute',
                                top: '-20px',
                                right: '0',
                                fontSize: '0.7rem',
                                opacity: 0.7,
                              }}
                            >
                              {(100 - progressPercentage).toFixed(0)}%
                            </Typography>
                            <Box
                              sx={{
                                width: '100%',
                                height: '8px',
                                background: effectiveIsDarkMode
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : 'rgba(0, 0, 0, 0.08)',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                position: 'relative',
                              }}
                            >
                              <Box
                                className="progress-bar-filled"
                                sx={{
                                  width: `${100 - progressPercentage}%`,
                                  height: '100%',
                                  background:
                                    'linear-gradient(90deg, rgba(227, 255, 0, 0.8), rgba(253, 181, 0, 0.9))',
                                  borderRadius: '20px',
                                  position: 'relative',
                                  zIndex: 2,
                                  boxShadow: '0 0 10px rgba(227, 255, 0, 0.4)',
                                  '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    background:
                                      'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%)',
                                    zIndex: 3,
                                  },
                                  '@keyframes shimmer': {
                                    '0%': { transform: 'translateX(-100%)' },
                                    '100%': { transform: 'translateX(100%)' },
                                  },
                                }}
                              />
                            </Box>
                          </Box>

                          <Box
                            sx={{
                              width: '35%',
                              display: 'flex',
                              justifyContent: 'flex-end',
                            }}
                          >
                            <LikeDislikeView
                              row={row}
                              user={user}
                              handleLike={() => dispatch(actionRoom({ roomId: row._id, type: 'like' }))}
                              handleDislike={() =>
                                dispatch(actionRoom({ roomId: row._id, type: 'dislike' }))
                              }
                              handleView={() => dispatch(actionRoom({ roomId: row._id, type: 'view' }))}
                            />
                          </Box>
                        </Box>
                        {row.is_private && (
                          <Tooltip title="A password is required to battle this room." arrow>
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 10,
                                right: 10,
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: effectiveIsDarkMode
                                  ? 'rgba(0, 0, 0, 0.3)'
                                  : 'rgba(255, 255, 255, 0.7)',
                                backdropFilter: 'blur(5px)',
                                border: effectiveIsDarkMode
                                  ? '1px solid rgba(255, 255, 255, 0.1)'
                                  : '1px solid rgba(0, 0, 0, 0.05)',
                              }}
                            >
                              <LockOutlined
                                sx={{
                                  fontSize: 16,
                                  color: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                                }}
                              />
                            </Box>
                          </Tooltip>
                        )}
                      </Card>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
          <Pagination
            color="error"
            variant='outlined'
            sx={{
              display: 'flex',
              justifyContent: 'center',
              '& .MuiPaginationItem-root': {
                borderRadius: '4px',
              },
            }}
            count={Math.ceil(roomList.length / pageSize)}
            page={page}
            onChange={handleChangePage}
          />
        </div>
      ) : (
        <Grid container spacing={2} sx={{ p: 2 }}>
          {loadingRecent ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    borderRadius: '16px',
                    backgroundColor: effectiveIsDarkMode ? '#121212' : '#FFFFFF',
                    boxShadow: effectiveIsDarkMode
                      ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                      : '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Header with icon and name */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Skeleton variant="rounded" width={32} height={32} sx={{ mr: 1.25 }} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
                      <Skeleton variant="text" width="60%" height={12} />
                    </Box>
                  </Box>

                  {/* Icons and timestamp row */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Skeleton variant="circular" width={16} height={16} />
                    <Skeleton variant="text" width={30} height={16} />
                    <Skeleton variant="circular" width={16} height={16} />
                  </Box>

                  {/* Currency amount */}
                  <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
                    <Skeleton variant="text" width="70%" height={24} />
                  </Box>
                </Card>
              </Grid>
            ))
          ) : recent.length === 0 ? (
            <Grid item xs={12}>
              <Typography variant="body1" align="center">
                NO RECENT GRADS
              </Typography>
            </Grid>
          ) : (
            recent.map((row) => {
              const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;
              return (
                <Grid item xs={6} sm={4} md={3} lg={3} xl={3} key={row._id}>
                  <Card
                    onClick={() => (window.location.href = `/join/${row._id}`)}
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      background: '#121212',
                      cursor: 'pointer',
                      transition: 'box-shadow 0.1s ease',
                      '&:hover': {
                        boxShadow: 4,
                      },
                    }}
                    className="carousel-content table-row slide-in"
                  >
                    <Box sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                      {row.image && (
                        <Box sx={{ mr: 1.25, display: 'block' }}>
                          <img
                            src={row.image}
                            alt=""
                            className="game-type-icon"
                            width={32}
                            style={{ display: 'block' }}
                          />
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Typography
                          component="span"
                          sx={{ fontWeight: 'bold', paddingRight: 0.625 }}
                        >
                          {row.name}
                        </Typography>
                        <Typography
                          component="span"
                          sx={{ fontSize: 'xx-small', paddingRight: 0.625 }}
                        >
                          {`${row.game_type.short_name}-${row.room_number}`}
                        </Typography>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        mb: 1,
                        typography: 'body2',
                        color: 'text.secondary',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <FontAwesomeIcon icon={faStopwatch} />
                        {customFromNow(row.created_at)}
                      </Box>
                      <FontAwesomeIcon icon={faHeartBroken} />
                    </Box>

                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 'bold',
                        color: getColorClass(hostPrizeMinusBetAmount),
                      }}
                    >
                      {convertToCurrency(hostPrizeMinusBetAmount, effectiveSolPrice)}
                    </Typography>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}
    </ThemeProvider>
  );
}

export default OpenGamesTable;