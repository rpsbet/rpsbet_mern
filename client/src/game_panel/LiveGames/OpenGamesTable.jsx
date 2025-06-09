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
          marginBottom: '24px',
          gap: '12px',
          // Enable horizontal scrolling on mobile
          overflowX: { xs: 'auto', sm: 'visible' },
          flexWrap: { xs: 'nowrap', sm: 'wrap' },
          whiteSpace: { xs: 'nowrap', sm: 'normal' },
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: { xs: 'thin', sm: 'none' },
          '&::-webkit-scrollbar': {
            height: { xs: '6px', sm: '0px' },
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: { xs: 'rgba(0, 0, 0, 0.15)', sm: 'transparent' },
            borderRadius: '3px',
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
          sx={{
            fontWeight: 600,
            letterSpacing: '0.5px',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
            },
          }}
        />
        <Chip
          icon={<SchoolIcon sx={{ p: 0.5 }} />}
          label="RECENTLY MINTED"
          onClick={() => handleFilterChange('RECENTLY MINTED')}
          color={filter === 'RECENTLY MINTED' ? 'error' : 'default'}
          variant={filter === 'RECENTLY MINTED' ? 'filled' : 'outlined'}
          clickable
          sx={{
            fontWeight: 600,
            letterSpacing: '0.5px',
            '&:hover': {
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.12)',
            },
          }}
        />
      </Box>

      {filter === 'RECENTLY WD / DP' ? (
        <Box sx={{ px: 3 }}>
          <Grid container spacing={3}>
            {loadingTransactions ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={index}>
                  <Card
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                      borderRadius: '16px',
                      border: effectiveIsDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.08)' 
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: effectiveIsDarkMode
                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                      height: '220px',
                    }}
                  >
                    <Skeleton
                      variant="circular"
                      width={56}
                      height={56}
                      sx={{
                        mb: 2,
                        backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Skeleton
                      variant="text"
                      width="85%"
                      height={24}
                      sx={{
                        mb: 1,
                        backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Skeleton
                      variant="text"
                      width="50%"
                      height={16}
                      sx={{
                        mb: 3,
                        backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Skeleton
                      variant="rounded"
                      width="90%"
                      height={40}
                      sx={{
                        borderRadius: '12px',
                        backgroundColor: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </Card>
                </Grid>
              ))
            ) : recentTransactions.length === 0 ? (
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 8,
                    px: 3,
                  }}
                >
                  <Typography 
                    variant="h6" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 500,
                      letterSpacing: '0.5px',
                    }}
                  >
                    NO RECENT TRANSACTIONS
                  </Typography>
                </Box>
              </Grid>
            ) : (
              recentTransactions.map((transaction) => (
                <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={transaction._id}>
                  <Card
                    sx={{
                      p: 3,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                      borderRadius: '16px',
                      border: effectiveIsDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.08)' 
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: effectiveIsDarkMode
                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                      height: '220px',
                      transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                      cursor: 'pointer',
                      '&:hover': {
                        boxShadow: effectiveIsDarkMode
                          ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                          : '0 8px 32px rgba(0, 0, 0, 0.12)',
                        borderColor: getColorClass(transaction.amount).border,
                      },
                    }}
                  >
                    <Box
                      sx={{ cursor: 'pointer' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenPlayerModal(transaction.user?._id);
                      }}
                    >
                      <Avatar
                        alt={transaction.user?.username}
                        username={transaction.user?.username}
                        elite={transaction.user?.elite}
                        src={transaction.user?.avatar}
                        sx={{
                          width: 56,
                          height: 56,
                          mb: 2,
                          border: `2px solid ${getColorClass(transaction.amount).border}`,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: `0 0 20px ${getColorClass(transaction.amount).border}`,
                          },
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: getColorClass(transaction.amount).text,
                        textAlign: 'center',
                        mb: 1,
                        letterSpacing: '0.3px',
                      }}
                    >
                      {transaction.amount > 0
                        ? `DEPOSITED ${convertToCurrency(transaction.amount, effectiveSolPrice)}`
                        : `WITHDREW ${convertToCurrency(Math.abs(transaction.amount), effectiveSolPrice)}`}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        fontSize: '0.85rem',
                        mb: 3,
                        opacity: 0.8,
                      }}
                    >
                      {customFromNow(transaction.created_at)}
                    </Typography>

                    <Link
                      href={`https://solscan.io/tx/${transaction.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        textDecoration: 'none',
                        width: '100%',
                        mt: 'auto',
                      }}
                    >
                      <Box
                        sx={{
                          width: '100%',
                          py: 1.5,
                          px: 2,
                          borderRadius: '12px',
                          backgroundColor: getColorClass(transaction.amount).bg,
                          border: `1px solid ${getColorClass(transaction.amount).border}`,
                          color: '#ffffff',
                          textAlign: 'center',
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          letterSpacing: '0.3px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: getColorClass(transaction.amount).text,
                            transform: 'scale(1.02)',
                            boxShadow: `0 4px 16px ${getColorClass(transaction.amount).border}`,
                          },
                        }}
                      >
                        View on Solscan
                      </Box>
                    </Link>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </Box>
      ) : isLiveGames ? (
        <div className="table main-game-table open-games">
          {displayedRooms.length === 0 || effectiveLoading ? (
            <Box sx={{ px: 3 }}>
              <Grid container spacing={3}>
                {Array.from({ length: 9 }).map((_, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={4}
                    xl={4}
                    key={index}
                  >
                    <Card
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                        border: effectiveIsDarkMode 
                          ? '1px solid rgba(255, 255, 255, 0.08)' 
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: effectiveIsDarkMode
                          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.08)',
                      }}
                    >
                      {/* Header section */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: '12px', mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="75%" height={24} sx={{ mb: 1 }} />
                          <Skeleton variant="text" width="55%" height={16} />
                        </Box>
                        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
                      </Box>

                      {/* Battle section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box sx={{ display: 'flex' }}>
                          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px' }} />
                          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px', ml: -1 }} />
                        </Box>
                        <Skeleton variant="circular" width={44} height={44} />
                        <Box sx={{ display: 'flex' }}>
                          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px', mr: -1 }} />
                          <Skeleton variant="rounded" width={40} height={40} sx={{ borderRadius: '12px' }} />
                        </Box>
                      </Box>

                      {/* Stats section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                      </Box>

                      {/* Health bar section */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ width: '60%' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Skeleton variant="text" width="25%" height={14} />
                            <Skeleton variant="text" width="20%" height={14} />
                          </Box>
                          <Skeleton variant="rounded" width="100%" height={10} sx={{ borderRadius: '20px' }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                          <Skeleton variant="circular" width={28} height={28} />
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : displayedRooms.length === 0 ? (
            <Box
              sx={{
                textAlign: 'center',
                py: 12,
                px: 3,
              }}
            >
              <Typography 
                variant="h5" 
                color="text.secondary"
                sx={{ 
                  fontWeight: 600,
                  letterSpacing: '0.5px',
                }}
              >
                NO LIVE GAMES, GO TO 'BE THE HOUSE' TO CREATE ONE
              </Typography>
            </Box>
          ) : (
            <Box sx={{ px: 3 }}>
              <Grid container spacing={3}>
                {displayedRooms.map((row, index) => {
                  const progressPercentage = row.endgame_amount
                    ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                    : 0;

                  const isFirstItem = index === 0;

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={4}
                      xl={4}
                      key={row._id}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          ...(isFirstItem && {
                            '&::before': {
                              content: '""',
                              position: 'absolute',
                              top: '-3px',
                              left: '-3px',
                              right: '-3px',
                              bottom: '-3px',
                              borderRadius: '23px',
                              background: '#ff0000',
                              backgroundSize: '300% 300%',
                              zIndex: 0,
                              animation: 'gradientBorder 3s ease-in-out infinite',
                              boxShadow: '0 0 20px rgba(255, 0, 0, 0.4)',
                            },
                            '@keyframes gradientBorder': {
                              '0%, 100%': { backgroundPosition: '0% 0%' },
                              '50%': { backgroundPosition: '100% 100%' },
                            },
                          }),
                        }}
                      >
                        <Card
                          onClick={(event) => {
                            if (!event.defaultPrevented) {
                              joinRoom({
                                id: row._id,
                                roomStatus: row.status,
                              });
                            }
                          }}
                          sx={{
                            p: 3,
                            borderRadius: '20px',
                            backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                            border: effectiveIsDarkMode 
                              ? '1px solid rgba(255, 255, 255, 0.08)' 
                              : '1px solid rgba(0, 0, 0, 0.06)',
                            boxShadow: effectiveIsDarkMode
                              ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                              : '0 4px 20px rgba(0, 0, 0, 0.08)',
                            transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            '&:hover': {
                              boxShadow: effectiveIsDarkMode
                                ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                                : '0 8px 32px rgba(0, 0, 0, 0.12)',
                            },
                          }}
                        >
                          {/* Header */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <Box
                              sx={{
                                borderRadius: '12px',
                                overflow: 'hidden',
                                mr: 2,
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.1)' 
                                  : '1px solid rgba(0,0,0,0.08)',
                                width: 52,
                                height: 52,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(0,0,0,0.02)',
                              }}
                            >
                              <img
                                src={row.image}
                                alt={row.name}
                                style={{ width: 44, height: 44, objectFit: 'cover' }}
                              />
                            </Box>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '1.1rem',
                                  lineHeight: 1.2,
                                  mb: 0.5,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.name}
                                <Typography
                                  component="span"
                                  color="text.secondary"
                                  sx={{
                                    ml: 1,
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    opacity: 0.7,
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
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {row.description.length > 30 ? `${row.description.slice(0, 30)}...` : row.description}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                ml: 2,
                                p: 1.5,
                                borderRadius: '12px',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(0,0,0,0.03)',
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.08)' 
                                  : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <img
                                src={`/img/gametype/icons/${row.game_type?.short_name}.svg`}
                                alt={row.game_type?.short_name}
                                style={{ width: 20, height: 20 }}
                              />
                            </Box>
                          </Box>

                          {/* Battle visualization */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              mb: 3,
                              position: 'relative',
                            }}
                          >
                            {row.hosts?.length > 0 && (
                              <AvatarGroup
                                max={2}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 40,
                                    height: 40,
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                    marginLeft: '-12px',
                                  },
                                }}
                              >
                                {row.hosts.map((host, hostIndex) => (
                                  <Avatar
                                    key={hostIndex}
                                    alt={host.username}
                                    username={host.username}
                                    elite={host.elite}
                                    src={host.avatar}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPlayerModal(row.hosts[hostIndex]);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                        zIndex: 10,
                                      },
                                    }}
                                  />
                                ))}
                              </AvatarGroup>
                            )}

                            <Box
                              sx={{
                                mx: 4,
                                width: 44,
                                height: 44,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.08)' 
                                  : 'rgba(0,0,0,0.06)',
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.1)' 
                                  : '1px solid rgba(0,0,0,0.08)',
                              }}
                            >
                              <Battle sx={{ fontSize: 20, opacity: 0.8 }} />
                            </Box>

                            {row.joiners?.length > 0 && (
                              <AvatarGroup
                                max={2}
                                sx={{
                                  '& .MuiAvatar-root': {
                                    width: 40,
                                    height: 40,
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                  },
                                  '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                    marginLeft: '-12px',
                                  },
                                }}
                              >
                                {row.joiners.map((joiner, joinerIndex) => (
                                  <Avatar
                                    key={joinerIndex}
                                    alt={joiner.username}
                                    username={joiner.username}
                                    elite={joiner.elite}
                                    src={joiner.avatar}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenPlayerModal(row.joiners[joinerIndex]);
                                    }}
                                    sx={{
                                      cursor: 'pointer',
                                      transition: 'transform 0.2s',
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                        zIndex: 10,
                                      },
                                    }}
                                  />
                                ))}
                              </AvatarGroup>
                            )}
                          </Box>

                          {/* Stats */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, gap: 2 }}>
                            <Box
                              sx={{
                                flex: 1,
                                textAlign: 'center',
                                p: 2,
                                borderRadius: '16px',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(0,0,0,0.03)',
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.08)' 
                                  : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.5,
                                }}
                              >
                                Liquidity
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  color: getColorClass(row.user_bet - row.bet_amount),
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                  lineHeight: 1.2,
                                }}
                              >
                                {convertToCurrency(row.user_bet, effectiveSolPrice)}
                                {row.user_bet !== row.bet_amount && (
                                  <Box
                                    component="span"
                                    sx={{
                                      fontSize: '0.75rem',
                                      ml: 0.5,
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.25,
                                    }}
                                  >
                                    {row.user_bet > row.bet_amount ? (
                                      <TrendingUpOutlined sx={{ fontSize: 12 }} />
                                    ) : (
                                      <TrendingDownOutlined sx={{ fontSize: 12 }} />
                                    )}
                                    {`${(((row.user_bet - row.bet_amount) / row.bet_amount) * 100).toFixed(1)}%`}
                                  </Box>
                                )}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                flex: 1,
                                textAlign: 'center',
                                p: 2,
                                borderRadius: '16px',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(0,0,0,0.03)',
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.08)' 
                                  : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.5,
                                }}
                              >
                                Battles
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                }}
                              >
                                {row.battles}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                flex: 1,
                                textAlign: 'center',
                                p: 2,
                                borderRadius: '16px',
                                backgroundColor: effectiveIsDarkMode 
                                  ? 'rgba(255,255,255,0.05)' 
                                  : 'rgba(0,0,0,0.03)',
                                border: effectiveIsDarkMode 
                                  ? '1px solid rgba(255,255,255,0.08)' 
                                  : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  fontSize: '0.75rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px',
                                  fontWeight: 600,
                                  display: 'block',
                                  mb: 0.5,
                                }}
                              >
                                Age
                              </Typography>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '0.95rem',
                                }}
                              >
                                {customFromNow(row.created_at)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Health bar and actions */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mt: 'auto',
                            }}
                          >
                            <Box sx={{ flex: 1, mr: 3 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  Health
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                  }}
                                >
                                  {(100 - progressPercentage).toFixed(0)}%
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '10px',
                                  backgroundColor: effectiveIsDarkMode 
                                    ? 'rgba(255, 255, 255, 0.1)' 
                                    : 'rgba(0, 0, 0, 0.08)',
                                  borderRadius: '20px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${100 - progressPercentage}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, rgba(227, 255, 0, 0.9), rgba(253, 181, 0, 1))',
                                    borderRadius: '20px',
                                    boxShadow: '0 0 10px rgba(227, 255, 0, 0.3)',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <LikeDislikeView
                                row={row}
                                user={user}
                                handleLike={() => dispatch(actionRoom({ roomId: row._id, type: 'like' }))}
                                handleDislike={() => dispatch(actionRoom({ roomId: row._id, type: 'dislike' }))}
                                handleView={() => dispatch(actionRoom({ roomId: row._id, type: 'view' }))}
                              />
                            </Box>
                          </Box>

                          {/* Private room indicator */}
                          {row.is_private && (
                            <Tooltip title="A password is required to battle this room." arrow>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 16,
                                  right: 16,
                                  width: 36,
                                  height: 36,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: effectiveIsDarkMode 
                                    ? 'rgba(0, 0, 0, 0.3)' 
                                    : 'rgba(255, 255, 255, 0.9)',
                                  backdropFilter: 'blur(8px)',
                                  border: effectiveIsDarkMode 
                                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                }}
                              >
                                <LockOutlined
                                  sx={{
                                    fontSize: 18,
                                    color: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
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
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 2 }}>
            <Pagination
              color="error"
              variant="outlined"
              sx={{
                '& .MuiPaginationItem-root': {
                  borderRadius: '12px',
                  fontWeight: 600,
                  border: effectiveIsDarkMode 
                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                    : '1px solid rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    backgroundColor: effectiveIsDarkMode 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                },
              }}
              count={Math.ceil(roomList.length / pageSize)}
              page={page}
              onChange={handleChangePage}
            />
          </Box>
        </div>
      ) : (
        <Box sx={{ px: 3 }}>
          <Grid container spacing={3}>
            {loadingRecent ? (
              Array.from({ length: 8 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={index}>
                  <Card
                    sx={{
                      p: 3,
                      borderRadius: '20px',
                      backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                      border: effectiveIsDarkMode 
                        ? '1px solid rgba(255, 255, 255, 0.08)' 
                        : '1px solid rgba(0, 0, 0, 0.06)',
                      boxShadow: effectiveIsDarkMode
                        ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                        : '0 4px 20px rgba(0, 0, 0, 0.08)',
                      height: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                    }}
                  >
                    {/* Header skeleton */}
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="rounded" width={36} height={36} sx={{ mr: 2, borderRadius: '8px' }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 0.5 }} />
                        <Skeleton variant="text" width="60%" height={14} />
                      </Box>
                    </Box>

                    {/* Icons row skeleton */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Skeleton variant="circular" width={16} height={16} />
                      <Skeleton variant="text" width={40} height={16} />
                      <Skeleton variant="circular" width={16} height={16} />
                    </Box>

                    {/* Amount skeleton */}
                    <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                      <Skeleton variant="text" width="70%" height={24} sx={{ mx: 'auto' }} />
                    </Box>
                  </Card>
                </Grid>
              ))
            ) : recent.length === 0 ? (
              <Grid item xs={12}>
                <Box
                  sx={{
                    textAlign: 'center',
                    py: 12,
                    px: 3,
                  }}
                >
                  <Typography 
                    variant="h5" 
                    color="text.secondary"
                    sx={{ 
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                    }}
                  >
                    NO RECENT GRADS
                  </Typography>
                </Box>
              </Grid>
            ) : (
              recent.map((row) => {
                const hostPrizeMinusBetAmount = row.host_pr - row.bet_amount;
                return (
                  <Grid item xs={12} sm={6} md={4} lg={4} xl={3} key={row._id}>
                    <Card
                      onClick={() => (window.location.href = `/join/${row._id}`)}
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        backgroundColor: effectiveIsDarkMode ? '#1a1a1a' : '#ffffff',
                        border: effectiveIsDarkMode 
                          ? '1px solid rgba(255, 255, 255, 0.08)' 
                          : '1px solid rgba(0, 0, 0, 0.06)',
                        boxShadow: effectiveIsDarkMode
                          ? '0 4px 20px rgba(0, 0, 0, 0.3)'
                          : '0 4px 20px rgba(0, 0, 0, 0.08)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                        height: '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        '&:hover': {
                          boxShadow: effectiveIsDarkMode
                            ? '0 8px 32px rgba(0, 0, 0, 0.4)'
                            : '0 8px 32px rgba(0, 0, 0, 0.12)',
                        },
                      }}
                    >
                      {/* Header */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {row.image && (
                          <Box
                            sx={{
                              mr: 2,
                              borderRadius: '8px',
                              overflow: 'hidden',
                              border: effectiveIsDarkMode 
                                ? '1px solid rgba(255,255,255,0.1)' 
                                : '1px solid rgba(0,0,0,0.08)',
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: effectiveIsDarkMode 
                                ? 'rgba(255,255,255,0.05)' 
                                : 'rgba(0,0,0,0.02)',
                            }}
                          >
                            <img
                              src={row.image}
                              alt=""
                              style={{ width: 32, height: 32, objectFit: 'cover' }}
                            />
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              fontSize: '1rem',
                              mb: 0.25,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.name}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              fontSize: '0.8rem',
                              opacity: 0.8,
                            }}
                          >
                            {`${row.game_type.short_name}-${row.room_number}`}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Meta info */}
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mb: 3,
                          color: 'text.secondary',
                          fontSize: '0.85rem',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <FontAwesomeIcon icon={faStopwatch} style={{ fontSize: '14px' }} />
                          <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                            {customFromNow(row.created_at)}
                          </Typography>
                        </Box>
                        <FontAwesomeIcon icon={faHeartBroken} style={{ fontSize: '14px' }} />
                      </Box>

                      {/* Amount */}
                      <Box sx={{ mt: 'auto', textAlign: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: getColorClass(hostPrizeMinusBetAmount),
                            letterSpacing: '0.3px',
                          }}
                        >
                          {convertToCurrency(hostPrizeMinusBetAmount, effectiveSolPrice)}
                        </Typography>
                      </Box>
                    </Card>
                  </Grid>
                );
              })
            )}
          </Grid>
        </Box>
      )}
    </ThemeProvider>
  );
}

export default OpenGamesTable;