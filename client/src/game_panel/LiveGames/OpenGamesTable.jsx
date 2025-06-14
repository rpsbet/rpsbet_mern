import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getRoomList,
  actionRoom,
  setRoomList, // <--- Consider if this is truly needed for local manipulation
  getTopGameTypes,
} from '../../redux/Logic/logic.actions';
import isEqual from 'lodash/isEqual';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  LockOutlined,
} from '@mui/icons-material';
import {
  AvatarGroup,
  Grid,
  Pagination,
  Tooltip,
  Typography,
  Skeleton,
  Box,
  TextField,
  Card,
  Chip,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Avatar from '../../components/Avatar';
import { convertToCurrency } from '../../util/conversion';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFistRaised } from '@fortawesome/free-solid-svg-icons';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import PlayerModal from '../modal/PlayerModal';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import { LikeDislikeView } from '../../components/LikeDislikeView';

function OpenGamesTable(props) {
  const {
    loading: propLoading,
    isDarkMode: propIsDarkMode,
    showPlayerModal,
    selectedCreator,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    connectedAccount: propConnectedAccount,
    solPrice: propSolPrice,
  } = props;

  const dispatch = useDispatch();

  const topGameTypes = useSelector(state => state.logic.topGameTypes || [], isEqual);
  const user = useSelector(state => state.auth.user, isEqual);
  const highlightedRooms = useSelector(state => state.logic.highlightedRooms, isEqual);
  const loading = useSelector(state => state.logic.isActiveLoadingOverlay);
  const solPrice = useSelector(state => state.logic.solPrice);
  const roomList = useSelector(state => state.logic.roomList || [], isEqual);
  const isDarkMode = useSelector(state => state.auth.isDarkMode)

  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  const [selectedGameType, setSelectedGameType] = useState('All');
  const [page, setPage] = useState(1);
  const [gameTypeSearch, setGameTypeSearch] = useState('');

  const theme = getCustomTheme(effectiveIsDarkMode);

  const pageSize = 30;

  // `processedRoomList` will be the source of truth for display, derived from Redux `roomList`
  const processedRoomList = useMemo(() => {
    let currentRooms = [...roomList]; // Start with a copy of Redux roomList

    // Apply highlighting logic
    const highlightId = Array.from(highlightedRooms)[0];
    if (highlightId) {
      const index = currentRooms.findIndex((r) => r._id === highlightId);
      if (index !== -1 && index !== 0) {
        const [highlighted] = currentRooms.splice(index, 1);
        currentRooms.unshift(highlighted);
      }
    }
    return currentRooms;
  }, [roomList, highlightedRooms]);


  // Use useMemo for displayedRooms to apply game type filtering
  const displayedRooms = useMemo(() => {
    let filtered = processedRoomList; // Start with the processed list (potentially highlighted)

    if (selectedGameType !== 'All') {
      filtered = filtered.filter(room =>
        Array.isArray(room.game_type)
          ? room.game_type.some(type => type.toLowerCase() === selectedGameType.toLowerCase())
          : room.game_type && room.game_type.toLowerCase() === selectedGameType.toLowerCase()
      );
    }
    // Apply search filter if gameTypeSearch is not empty
    if (gameTypeSearch) {
      const lowerCaseSearch = gameTypeSearch.toLowerCase();
      filtered = filtered.filter(room => {
        const roomGameTypes = Array.isArray(room.game_type) ? room.game_type : [room.game_type];
        return roomGameTypes.some(type => type.toLowerCase().includes(lowerCaseSearch)) ||
          room.name.toLowerCase().includes(lowerCaseSearch) ||
          room.description.toLowerCase().includes(lowerCaseSearch);
      });
    }

    return filtered;
  }, [processedRoomList, selectedGameType, gameTypeSearch]); // Depend on processedRoomList and filters

  const paginatedRooms = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return displayedRooms.slice(startIndex, endIndex);
  }, [displayedRooms, page, pageSize]);

  // Removed prevRoomListRef as localRoomList is no longer the primary state

  useEffect(() => {
    // Initial fetch of all rooms
    dispatch(getRoomList({ game_type: 'All' }));
    // Fetch top game types on component mount
    dispatch(getTopGameTypes());
  }, [dispatch]);

  const handleRoomActionUpdated = (data) => {
    console.log('Room action updated:', data);
    dispatch({
      type: 'UPDATE_SINGLE_ROOM',
      payload: {
        _id: data.roomId,
        likes: data.likes,
        dislikes: data.dislikes,
        views: data.views
      }
    });
  };

  if (window.socketClient && window.socketClient.socket) {
      // Add the event listener
      window.socketClient.socket.on('ROOM_ACTION_UPDATED', handleRoomActionUpdated);
    }

  const handleChangePage = useCallback((event, newPage) => {
    setPage(newPage);
  }, []);

  const handleGameTypeChange = useCallback((gameType) => {
    setSelectedGameType(gameType);
    setPage(1); // Reset pagination when changing filter
    setGameTypeSearch(''); // Clear search when changing main game type filter
    dispatch(getRoomList({ game_type: gameType }));
  }, [dispatch]);

  const customFromNow = useCallback((date) => {
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
  }, []);

  const handleGameTypeSearchChange = useCallback((event) => {
    const value = event.target.value;
    setGameTypeSearch(value);
    setPage(1); // Reset pagination on search change
    // Filtering based on search happens in `displayedRooms` useMemo
  }, []);

  const handleGameTypeChipClick = useCallback((tag) => {
    setSelectedGameType(tag); // Set the selected game type for the main filter
    setGameTypeSearch(''); // Clear the search input if a chip is clicked
    setPage(1); // Reset pagination on chip click
    dispatch(getRoomList({ game_type: tag })); // Fetch rooms for the selected game type
  }, [dispatch]);

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

  const getColorClass = useCallback((value) => {
    if (value > 0) return { color: '#FF0000' }; // Red for deposit
    if (value === 0) return { color: '#808080' }; // Grey for zero
    return { color: '#03ff3b' }; // Green for withdrawal
  }, []);


  return (
    <ThemeProvider theme={theme}>
      <>
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
          {/* All Games chip */}
          <Chip
            label="All Games"
            onClick={() => handleGameTypeChange('All')}
            color={selectedGameType === 'All' ? 'error' : 'default'}
            variant={selectedGameType === 'All' ? 'filled' : 'outlined'}
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

          {/* Top game type chips */}
          {topGameTypes.map((gameType) => (
            <Chip
              key={gameType}
              label={gameType.toUpperCase()}
              onClick={() => handleGameTypeChipClick(gameType)} // Use handleGameTypeChipClick
              color={selectedGameType.toLowerCase() === gameType.toLowerCase() ? 'error' : 'default'}
              variant={selectedGameType.toLowerCase() === gameType.toLowerCase() ? 'filled' : 'outlined'}
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
          ))}

          {/* Search Input */}
          <TextField
            value={gameTypeSearch}
            onChange={handleGameTypeSearchChange}
            placeholder="Search rooms..."
            variant="outlined"
            size="small"
            sx={{
              ml: { xs: 0, sm: 2 },
              minWidth: { xs: '150px', sm: '200px' },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                backgroundColor: effectiveIsDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
                '& fieldset': {
                  borderColor: effectiveIsDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                },
                '&:hover fieldset': {
                  borderColor: effectiveIsDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.error.main,
                },
              },
              '& .MuiInputBase-input': {
                color: effectiveIsDarkMode ? '#fff' : '#000',
              },
              '& .MuiInputAdornment-root .MuiSvgIcon-root': {
                color: effectiveIsDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Games Display */}
        <div className="table main-game-table open-games">
          {effectiveLoading ? (
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
                      {/* Skeleton structure */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                        <Skeleton variant="rounded" width={52} height={52} sx={{ borderRadius: '12px', mr: 2 }} />
                        <Box sx={{ flexGrow: 1 }}>
                          <Skeleton variant="text" width="75%" height={24} sx={{ mb: 1 }} />
                          <Skeleton variant="text" width="55%" height={16} />
                        </Box>
                        <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: '12px' }} />
                      </Box>
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
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                        <Skeleton variant="rounded" width="30%" height={70} sx={{ borderRadius: '16px' }} />
                      </Box>
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
                variant="h6"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  letterSpacing: '0.5px',
                }}
              > GO TO 'BE THE HOUSE' TO CREATE ONE!
              </Typography>
            </Box>
          ) : (
            <Box sx={{ px: 3 }}>
              <Grid container spacing={3}>
                {paginatedRooms.map((row, index) => {
                  const progressPercentage = row.endgame_amount
                    ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                    : 0;

                  // Apply highlighting only if it's explicitly set by Redux
                  // This is handled by processedRoomList now, so no need for `isFirstItem` here for styling
                  // unless you want a visual highlight that's independent of the Redux reordering.
                  // For the sake of matching your original output and assuming `highlightedRooms` is for a visual cue,
                  // I'll keep the `isFirstItem` logic.
                  const isFirstItem = index === 0 && Array.from(highlightedRooms).includes(row._id);


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
                              background: ' #ff0000',
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
                            height: '100%',
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
                                p: '4px 8px',
                                borderRadius: '8px',
                                backgroundColor: effectiveIsDarkMode
                                  ? 'rgba(255,255,255,0.05)'
                                  : 'rgba(0,0,0,0.03)',
                                border: effectiveIsDarkMode
                                  ? '1px solid rgba(255,255,255,0.08)'
                                  : '1px solid rgba(0,0,0,0.05)',
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: '0.5px' }}>
                                {Array.isArray(row.game_type)
                                  ? row.game_type.map(type => type.toUpperCase()).join(', ')
                                  : (row.game_type ? String(row.game_type).toUpperCase() : 'N/A')}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Battle visualization */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-around',
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
                                mx: 2,
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
                              <FontAwesomeIcon icon={faFistRaised} style={{ fontSize: 20, color: effectiveIsDarkMode ? '#ff0000' : '#000' }} />
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
                                  ...getColorClass(row.user_bet - row.bet_amount),
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
              count={Math.ceil(displayedRooms.length / pageSize)}
              page={page}
              onChange={handleChangePage}
            />
          </Box>
        </div>
      </>
    </ThemeProvider>
  );
}

export default OpenGamesTable;