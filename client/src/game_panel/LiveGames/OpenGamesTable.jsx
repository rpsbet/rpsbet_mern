import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  actionRoom,
  getRoomList,
  setCurRoomInfo,
  setRoomList,
  getRecentlyClosed,
  addNewTransaction,
  pumpGame,
  endLoading,
  startLoading,
} from '../../redux/Logic/logic.actions';
import isEqual from 'lodash/isEqual';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  ShowChartOutlined,
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
  Modal,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import Moment from 'moment';
import {
  faHeart,
  faHeartBroken,
  faStopwatch,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CoHostModal from '../modal/CoHostModal';
import Avatar from '../../components/Avatar';
import { convertToCurrency } from '../../util/conversion';
import { getRoomStatisticsData } from '../../redux/Customer/customer.action';
import Battle from '../icons/Battle';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import PlayerModal from '../modal/PlayerModal';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

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

  // Map state from Redux using useSelector
  const {
    creator,
    joiners,
    isAuthenticated,
    userName,
    recentlyClosed,
    user,
    highlightedRooms,
    isLowGraphics,
    loading,
    solPrice,
    roomList,
    connectedAccount,
  } = useSelector((state) => ({
    creator: state.logic.curRoomInfo.creator_name,
    joiners: state.logic.curRoomInfo.joiners,
    isAuthenticated: state.auth.isAuthenticated,
    userName: state.auth.userName,
    recentlyClosed: state.logic.recentlyClosed,
    user: state.auth.user,
    highlightedRooms: state.logic.highlightedRooms,
    isLowGraphics: state.auth.isLowGraphics,
    loading: state.logic.isActiveLoadingOverlay,
    solPrice: state.logic.solPrice,
    roomList: state.logic.roomList,
    connectedAccount: state.auth.connectedAccount,
  }));

  // Use prop values if provided, otherwise fall back to Redux state
  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveBalance = propBalance !== undefined ? propBalance : balance;
  const effectiveConnectedAccount = propConnectedAccount !== undefined ? propConnectedAccount : connectedAccount;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  // Local State
  const [localRoomList, setLocalRoomList] = useState(roomList);
  const [filter, setFilter] = useState('Live Games');
  const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
  const [coHostAmount, setCoHostAmount] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const [page, setPage] = useState(1);
  const [loadingRecent, setLoadingRecent] = useState(true);

  const theme = getCustomTheme(effectiveIsDarkMode);

  const pageSize = 30;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const displayedRooms = roomList.slice(startIndex, endIndex);
  const prevRoomListRef = useRef(roomList);

  // Effects
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

  // Handlers
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleCoHost = (row) => {
    setSelectedRow(row);
    setIsCoHostModalOpen(true);
  };

  const handleCloseCoHostModal = () => {
    setIsCoHostModalOpen(false);
  };

  const handleCoHostAmountChange = (event) => {
    setCoHostAmount(event.target.value);
  };

  const handleSendCoHost = async () => {
    if (coHostAmount <= 0) {
      dispatch(errorMsgBar('R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!'));
      return;
    }
    if (coHostAmount > effectiveBalance) {
      dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
      return;
    }
    try {
      const result = await dispatch(
        pumpGame(coHostAmount, selectedRow._id, effectiveConnectedAccount),
      );
      if (result.success) {
        dispatch(addNewTransaction(result.newTransaction));
        await dispatch(getRoomList({ game_type: selectedGameType }));
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (e) {
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
    }
  };

  const customFromNow = (date) => {
    const now = Moment();
    const duration = Moment.duration(now.diff(date));
    const style = { fontSize: 'xx-small' };

    if (duration.asSeconds() < 60) {
      return (
        <>
          {Math.round(duration.asSeconds())}
          <span style={style}>s</span>
        </>
      );
    } else if (duration.asMinutes() < 60) {
      return (
        <>
          {Math.round(duration.asMinutes())}
          <span style={style}>m</span>
        </>
      );
    } else if (duration.asHours() < 24) {
      return (
        <>
          {Math.round(duration.asHours())}
          <span style={style}>h</span>
        </>
      );
    } else {
      return (
        <>
          {Math.round(duration.asDays())}
          <span style={style}>d</span>
        </>
      );
    }
  };

  const updateFromNow = (historyArr) => {
    const result = JSON.parse(JSON.stringify(historyArr));
    for (let i = 0; i < result.length; i++) {
      result[i]['from_now'] = customFromNow(Moment(result[i]['updated_at']));
    }
    return result;
  };

  const handleFilterChange = useCallback(
    async (option) => {
      setFilter(option);
      if (option === 'Recently Graduated') {
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
    if (value > 0) return '#03ff3b';
    if (value === 0) return 'grey';
    return '#D32F2F';
  };

  const isLiveGames = filter === 'Live Games';
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

      <div
        style={{
          marginLeft: '10px',
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
        }}
      >
        <div
          className="filter-container"
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() =>
            handleFilterChange(isLiveGames ? 'Recently Graduated' : 'Live Games')
          }
        >
          <FilterListIcon style={{ marginRight: '5px' }} />
          <span>{filter}</span>
        </div>
      </div>

      {isLiveGames ? (
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
                      borderRadius: '8px',
                      backgroundColor: effectiveIsDarkMode ? '#1E2A38' : '#FFFFFF',
                      boxShadow: effectiveIsDarkMode
                        ? '0 2px 8px rgba(0, 0, 0, 0.3)'
                        : '0 2px 8px rgba(0, 0, 0, 0.1)',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Skeleton variant="rectangular" width={40} height={40} sx={{ borderRadius: '4px', mr: 2 }} />
                      <Box sx={{ flexGrow: 1 }}>
                        <Skeleton variant="text" width="60%" />
                        <Skeleton variant="text" width="40%" />
                      </Box>
                      <Skeleton variant="circular" width={24} height={24} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                      <Skeleton variant="circular" width={32} height={32} sx={{ mr: 2 }} />
                      <Skeleton variant="rectangular" width={24} height={24} sx={{ mx: 2 }} />
                      <Skeleton variant="circular" width={32} height={32} sx={{ ml: 2 }} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Skeleton variant="text" width="30%" />
                      <Skeleton variant="text" width="20%" />
                      <Skeleton variant="text" width="20%" />
                    </Box>
                    <Skeleton variant="rectangular" width="100%" height={10} sx={{ borderRadius: '4px' }} />
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : displayedRooms.length === 0 ? (
            <div className="dont-have-game-msg">
              <div>NO LIVE GAMES, GO TO 'CREATE A GAME' TO CREATE ONE</div>
            </div>
          ) : (
            <Grid
              container
              className="grid-container"
              spacing={1}
              style={{ padding: '20px' }}
            >
              {displayedRooms.map((row) => {
                const progressPercentage = row.endgame_amount
                  ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                  : 0;

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
                        background: effectiveIsDarkMode
                          ? 'linear-gradient(135deg, rgba(30, 42, 56, 0.8), rgba(22, 32, 46, 0.9))'
                          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.5))',
                        backdropFilter: 'blur(12px)',
                        border: effectiveIsDarkMode
                          ? '1px solid rgba(255, 255, 255, 0.1)'
                          : '1px solid rgba(255, 255, 255, 0.7)',
                        boxShadow: effectiveIsDarkMode
                          ? '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(255, 255, 255, 0.07)'
                          : '0 8px 32px rgba(31, 38, 135, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: effectiveIsDarkMode
                            ? '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                            : '0 12px 40px rgba(31, 38, 135, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.6)',
                          cursor: 'pointer',
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
                      {/* Top section with image and name */}
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

                      {/* Players section */}
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
                            left: '50%',
                            top: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '40%',
                            height: '1px',
                            background: effectiveIsDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                            zIndex: 0
                          }
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
                                  background: effectiveIsDarkMode ? '#2A3A4D' : '#f0f0f0',
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
                                  src={host.avatar}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPlayerModal(row.hosts[index]);
                                  }}
                                  sx={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      zIndex: 10
                                    }
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
                            zIndex: 2
                          }}
                        >
                          <Battle sx={{
                            fontSize: 22,
                            color: effectiveIsDarkMode
                              ? 'rgba(255, 255, 255, 0.85)'
                              : 'rgba(0, 0, 0, 0.7)'
                          }} />
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
                                  background: effectiveIsDarkMode ? '#2A3A4D' : '#f0f0f0',
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
                                  src={joiner.avatar}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenPlayerModal(row.joiners[index]);
                                  }}
                                  sx={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      zIndex: 10
                                    }
                                  }}
                                />
                              ))}
                            </AvatarGroup>
                          </Box>
                        )}
                      </Box>

                      {/* Stats section */}
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
                            {customFromNow(Moment(row.created_at))}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Progress bar */}
                      <Box sx={{ position: 'relative', mb: 0.5 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            top: '-20px',
                            right: '0',
                            fontSize: '0.7rem',
                            opacity: 0.7
                          }}
                        >
                          {progressPercentage.toFixed(0)}%
                        </Typography>
                        <Box
                          sx={{
                            width: '100%',
                            height: '8px',
                            background: effectiveIsDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Box
                            className="progress-bar-filled"
                            sx={{
                              width: `${progressPercentage}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, rgba(227, 255, 0, 0.8), rgba(253, 181, 0, 0.9))',
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
                                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.4) 50%, rgba(255, 255, 255, 0) 100%)',
                                animation: 'shimmer 2s infinite',
                                zIndex: 3,
                              },
                              '@keyframes shimmer': {
                                '0%': { transform: 'translateX(-100%)' },
                                '100%': { transform: 'translateX(100%)' }
                              }
                            }}
                          />
                        </Box>
                      </Box>

                      {/* Private room lock icon */}
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
                  </Grid>
                );
              })}
            </Grid>
          )}
          <Pagination
            color="error"
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
                <Box
                  className="carousel-content table-row slide-in"
                  sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
                >
                  <Skeleton variant="rectangular" width="100%" height={200} />
                  <Skeleton width="60%" />
                  <Skeleton width="40%" />
                  <Skeleton width="80%" />
                </Box>
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
                      background: '#3a2d41',
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      '&:hover': {
                        transform: 'translateY(-4px)',
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
                        {customFromNow(Moment(row.created_at))}
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

      <Modal
        open={isCoHostModalOpen}
        onClose={handleCloseCoHostModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        closeAfterTransition
      >
        <Box
          sx={{
            width: '95%',
            maxWidth: 1000,
            maxHeight: '90vh',
            overflowY: 'auto',
            bgcolor: '#2D3A4B',
            borderRadius: 1,
            p: 3,
            color: '#fff',
          }}
        >
          <CoHostModal
            isDarkMode={effectiveIsDarkMode}
            coHostAmount={coHostAmount}
            connectedAccount={effectiveConnectedAccount}
            selectedRow={selectedRow}
            balance={effectiveBalance}
            user={user}
            togglePopup={() => { }}
            handleClose={handleCloseCoHostModal}
            handleSendCoHost={handleSendCoHost}
            handleCoHostAmountChange={handleCoHostAmountChange}
            has_joined={false}
            input_only={false}
            solPrice={effectiveSolPrice}
          />
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default OpenGamesTable;