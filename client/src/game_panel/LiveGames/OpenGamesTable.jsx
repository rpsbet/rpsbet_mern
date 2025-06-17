import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getRoomIds,
  loadIndividualRoom,
  actionRoom,
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
  Tooltip,
  Typography,
  Skeleton,
  Box,
  TextField,
  Chip,
  InputAdornment,
  Alert,
  Fade,
  IconButton,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
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

  // Redux selectors for YouTube-style loading
  const topGameTypes = useSelector(state => state.logic.topGameTypes || [], isEqual);
  const user = useSelector(state => state.auth.user, isEqual);
  const highlightedRooms = useSelector(state => state.logic.highlightedRooms, isEqual);
  const loading = useSelector(state => state.logic.isActiveLoadingOverlay);
  const solPrice = useSelector(state => state.logic.solPrice);
  const isDarkMode = useSelector(state => state.auth.isDarkMode);

  // YouTube-style loading selectors
  const roomIds = useSelector(state => state.logic.roomIds || []);
  const roomsById = useSelector(state => state.logic.roomsById || {});
  const roomLoadingStates = useSelector(state => state.logic.roomLoadingStates || {});
  const roomErrors = useSelector(state => state.logic.roomErrors || {});
  const currentGameType = useSelector(state => state.logic.currentGameType || 'All');

  // Existing props with fallbacks
  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  // Local state
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [gameTypeSearch, setGameTypeSearch] = useState('');

  const theme = getCustomTheme(effectiveIsDarkMode);

  // Create ordered array of rooms (loaded + skeletons)
  const orderedRoomData = useMemo(() => {
    return roomIds.map(roomId => {
      const loadingState = roomLoadingStates[roomId];
      const room = roomsById[roomId];
      const error = roomErrors[roomId];

      return {
        id: roomId,
        isLoading: loadingState === 'loading',
        isLoaded: loadingState === 'loaded',
        isError: loadingState === 'error',
        room: room || null,
        error: error || null
      };
    });
  }, [roomIds, roomsById, roomLoadingStates, roomErrors]);

  // Apply highlighting to loaded rooms
  const processedRoomData = useMemo(() => {
    const highlightId = Array.from(highlightedRooms)[0];

    if (!highlightId) return orderedRoomData;

    // Find the highlighted room and move it to the front if it's loaded
    const highlightedIndex = orderedRoomData.findIndex(
      item => item.id === highlightId && item.isLoaded
    );

    if (highlightedIndex > 0) {
      const reordered = [...orderedRoomData];
      const [highlightedItem] = reordered.splice(highlightedIndex, 1);
      reordered.unshift(highlightedItem);
      return reordered;
    }

    return orderedRoomData;
  }, [orderedRoomData, highlightedRooms]);

  // Apply client-side filtering
  const filteredRoomData = useMemo(() => {
    return processedRoomData.filter(item => {
      // Always show loading skeletons
      if (item.isLoading || item.isError) return true;

      // Only filter loaded rooms
      if (!item.isLoaded || !item.room) return false;

      const room = item.room;

      // Game type filter
      if (selectedGameType !== 'All') {
        if (!room.game_type) return false;

        const matchesGameType = Array.isArray(room.game_type)
          ? room.game_type.some(type =>
            type && typeof type === 'string' &&
            type.toLowerCase() === selectedGameType.toLowerCase()
          )
          : typeof room.game_type === 'string' &&
          room.game_type.toLowerCase() === selectedGameType.toLowerCase();

        if (!matchesGameType) return false;
      }

      // Search filter
      if (gameTypeSearch) {
        const lowerCaseSearch = gameTypeSearch.toLowerCase();

        const roomGameTypes = Array.isArray(room.game_type)
          ? room.game_type.filter(type => type && typeof type === 'string')
          : (room.game_type && typeof room.game_type === 'string') ? [room.game_type] : [];

        const gameTypeMatch = roomGameTypes.some(type =>
          type.toLowerCase().includes(lowerCaseSearch)
        );
        const nameMatch = room.name &&
          typeof room.name === 'string' &&
          room.name.toLowerCase().includes(lowerCaseSearch);
        const descriptionMatch = room.description &&
          typeof room.description === 'string' &&
          room.description.toLowerCase().includes(lowerCaseSearch);

        if (!gameTypeMatch && !nameMatch && !descriptionMatch) return false;
      }

      return true;
    });
  }, [processedRoomData, selectedGameType, gameTypeSearch]);

  // Initial fetch
  useEffect(() => {
    // Add error handling for initial fetch
    dispatch(getRoomIds({ game_type: 'All' }))
      .catch(error => {
        console.error('Failed to load rooms:', error);
        // You might want to show an error message to users
      });
    dispatch(getTopGameTypes());
  }, [dispatch]);

  // Handle room action updates via socket
  const handleRoomActionUpdated = useCallback((data) => {
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
  }, [dispatch]);

  // Setup socket listener
  useEffect(() => {
    if (window.socketClient && window.socketClient.socket) {
      window.socketClient.socket.on('ROOM_ACTION_UPDATED', handleRoomActionUpdated);

      return () => {
        if (window.socketClient && window.socketClient.socket) {
          window.socketClient.socket.off('ROOM_ACTION_UPDATED', handleRoomActionUpdated);
        }
      };
    }
  }, [handleRoomActionUpdated]);

  // Handle game type change
  const handleGameTypeChange = useCallback((gameType) => {
    setSelectedGameType(gameType);
    setGameTypeSearch('');
    dispatch(getRoomIds({ game_type: gameType }));
  }, [dispatch]);

  const handleGameTypeSearchChange = useCallback((event) => {
    const value = event.target.value;
    setGameTypeSearch(value);
  }, []);

  const handleGameTypeChipClick = useCallback((tag) => {
    setSelectedGameType(tag);
    setGameTypeSearch('');
    dispatch(getRoomIds({ game_type: tag }));
  }, [dispatch]);

  // Retry loading a failed room
  const handleRetryRoom = useCallback((roomId) => {
    dispatch(loadIndividualRoom(roomId));
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
    if (value > 0) return { color: '#FF0000' };
    if (value === 0) return { color: '#808080' };
    return { color: '#03ff3b' };
  }, []);

  // Skeleton component for loading rooms
  const RoomSkeleton = ({ isError, error, onRetry }) => (
    <Box
      sx={{
        padding: '12px 16px',
        borderRadius: '8px',
        background: isError ? 'rgba(255, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
        border: isError ? '1px solid rgba(255, 0, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
        position: 'relative',
      }}
    >
      {isError ? (
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 3
        }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 0, 0, 0.7)', mb: 1 }}>
            Failed to load room
          </Typography>
          <IconButton
            size="small"
            onClick={onRetry}
            sx={{
              color: 'rgba(255, 0, 0, 0.7)',
              '&:hover': { color: '#ff0000' }
            }}
          >
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, height: 96 }}>
            <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: '6px', mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton variant="text" width="70%" height={18} sx={{ mb: 0.5 }} />
              <Skeleton variant="text" width="50%" height={14} />
            </Box>
            <Skeleton variant="rounded" width={60} height={20} sx={{ borderRadius: '4px' }} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="text" width="25%" height={16} />
            <Skeleton variant="text" width="20%" height={16} />
            <Skeleton variant="text" width="15%" height={16} />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ width: '60%' }}>
              <Skeleton variant="rounded" width="100%" height={6} sx={{ borderRadius: '3px' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
              <Skeleton variant="circular" width={24} height={24} />
            </Box>
          </Box>
        </>
      )}
    </Box>
  );

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

        {/* Filter chips section */}
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
              onClick={() => handleGameTypeChipClick(gameType)}
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
          {effectiveLoading && roomIds.length === 0 ? (
            // Initial loading state
            <Box sx={{ px: 3 }}>
              <Grid container spacing={2}>
                {Array.from({ length: 12 }).map((_, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={4}
                    xl={4}
                    key={`initial-skeleton-${index}`}
                  >
                    <RoomSkeleton />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : filteredRoomData.length === 0 && !effectiveLoading ? (
            // No rooms found
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
              >
                GO TO 'BE THE HOUSE' TO CREATE ONE!
              </Typography>
            </Box>
          ) : (
            // YouTube-style loading: show rooms as they load
            <Box sx={{ px: 3 }}>
              <Grid container spacing={2}>
                {filteredRoomData.map((item, index) => {
                  // Show skeleton for loading or error states
                  if (item.isLoading || item.isError) {
                    return (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={4}
                        lg={4}
                        xl={4}
                        key={`room-${item.id}`}
                      >
                        <RoomSkeleton
                          isError={item.isError}
                          error={item.error}
                          onRetry={() => handleRetryRoom(item.id)}
                        />
                      </Grid>
                    );
                  }

                  // Show loaded room
                  if (!item.isLoaded || !item.room) return null;

                  const row = item.room;
                  const progressPercentage = row.endgame_amount
                    ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                    : 0;

                  const isFirstItem = index === 0 && Array.from(highlightedRooms).includes(row._id);

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      lg={4}
                      xl={4}
                      key={`room-${item.id}`}
                    >
                      <Fade in={true} timeout={500}>
                        <Box
                          onClick={(event) => {
                            if (!event.defaultPrevented) {
                              joinRoom({
                                id: row._id,
                                roomStatus: row.status,
                              });
                            }
                          }}
                          sx={{
                            padding: '12px 16px',
                            borderRadius: '8px',
                            background: isFirstItem
                              ? 'linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 0, 0.03))'
                              : 'rgba(255, 255, 255, 0.02)',
                            border: isFirstItem
                              ? '1px solid rgba(255, 0, 0, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            position: 'relative',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 0, 0, 0.2)',
                            },
                            ...(isFirstItem && {
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '2px',
                                background: 'linear-gradient(90deg, transparent, #ff0000, transparent)',
                                animation: 'shimmer 2s ease-in-out infinite'
                              }
                            })
                          }}
                        >
                          {/* Header Row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '6px',
                                overflow: 'hidden',
                                mr: 2,
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <img
                                src={row.image}
                                alt={row.name}
                                style={{ width: 28, height: 28, objectFit: 'cover' }}
                              />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.875rem',
                                  lineHeight: 1.2,
                                  mb: 0.25,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  color: '#fff',
                                }}
                              >
                                {row.name}
                                <Typography
                                  component="span"
                                  sx={{
                                    ml: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'rgba(255, 255, 255, 0.6)',
                                  }}
                                >
                                  ({row.ticker})
                                </Typography>
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.7rem',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                              >
                                {row.description && row.description.length > 40
                                  ? `${row.description.slice(0, 40)}...`
                                  : row.description || 'No description'}
                              </Typography>
                            </Box>

                            <Chip
                              label={Array.isArray(row.game_type)
                                ? row.game_type[0]?.toUpperCase() || 'N/A'
                                : (row.game_type ? String(row.game_type).toUpperCase() : 'N/A')}
                              size="small"
                              sx={{
                                height: '20px',
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                color: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                '& .MuiChip-label': {
                                  padding: '0 6px',
                                },
                              }}
                            />
                          </Box>

                          {/* Players and Battle Icon */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 2,
                            }}
                          >
                            {/* Hosts */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {row.hosts?.length > 0 ? (
                                <AvatarGroup
                                  max={2}
                                  sx={{
                                    '& .MuiAvatar-root': {
                                      width: 24,
                                      height: 24,
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontSize: '0.7rem',
                                    },
                                    '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                      marginLeft: '-8px',
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
                              ) : (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                                  No hosts
                                </Typography>
                              )}
                            </Box>

                            {/* Battle Icon */}
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                border: '1px solid rgba(255, 0, 0, 0.2)',
                              }}
                            >
                              <FontAwesomeIcon icon={faFistRaised} style={{ fontSize: 12, color: '#ff0000' }} />
                            </Box>

                            {/* Joiners */}
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {row.joiners?.length > 0 ? (
                                <AvatarGroup
                                  max={2}
                                  sx={{
                                    '& .MuiAvatar-root': {
                                      width: 24,
                                      height: 24,
                                      borderRadius: '6px',
                                      border: 'none',
                                      fontSize: '0.7rem',
                                    },
                                    '& .MuiAvatarGroup-avatar:not(:first-of-type)': {
                                      marginLeft: '-8px',
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
                              ) : (
                                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.7rem' }}>
                                  No joiners
                                </Typography>
                              )}
                            </Box>
                          </Box>

                          {/* Stats Row */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: 'block',
                                  mb: 0.25,
                                }}
                              >
                                Liquidity
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  ...getColorClass(row.user_bet - row.bet_amount),
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  lineHeight: 1.2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.25,
                                }}
                              >
                                {convertToCurrency(row.user_bet, effectiveSolPrice)}
                                {row.user_bet !== row.bet_amount && (
                                  <>
                                    {row.user_bet > row.bet_amount ? (
                                      <TrendingUpOutlined sx={{ fontSize: 10 }} />
                                    ) : (
                                      <TrendingDownOutlined sx={{ fontSize: 10 }} />
                                    )}
                                  </>
                                )}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: 'block',
                                  mb: 0.25,
                                }}
                              >
                                Battles
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  color: '#fff',
                                }}
                              >
                                {row.battles || 0}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'right' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.65rem',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  display: 'block',
                                  mb: 0.25,
                                }}
                              >
                                Age
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.8rem',
                                  color: '#fff',
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
                            }}
                          >
                            <Box sx={{ flex: 1, mr: 2 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${100 - progressPercentage}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, rgba(227, 255, 0, 0.8), rgba(253, 181, 0, 0.9))',
                                    borderRadius: '3px',
                                    transition: 'width 0.3s ease',
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: '0.6rem',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  mt: 0.25,
                                  display: 'block',
                                }}
                              >
                                Health: {(100 - progressPercentage).toFixed(0)}%
                              </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 0.5 }}>
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
                                  top: 8,
                                  right: 8,
                                  width: 24,
                                  height: 24,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                  backdropFilter: 'blur(4px)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                <LockOutlined
                                  sx={{
                                    fontSize: 12,
                                    color: 'rgba(255, 255, 255, 0.8)',
                                  }}
                                />
                              </Box>
                            </Tooltip>
                          )}
                        </Box>
                      </Fade>
                    </Grid>
                  );
                })}
              </Grid>

              {/* Loading status info */}
              {roomIds.length > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2,
                  mb: 2,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
                    {(() => {
                      const loadedCount = Object.values(roomLoadingStates).filter(state => state === 'loaded').length;
                      const totalCount = roomIds.length;
                      const loadingCount = Object.values(roomLoadingStates).filter(state => state === 'loading').length;

                      if (loadingCount > 0) {
                        return `Loading rooms... (${loadedCount}/${totalCount} loaded)`;
                      } else {
                        return `Showing ${filteredRoomData.filter(item => item.isLoaded).length} rooms`;
                      }
                    })()}
                    {selectedGameType !== 'All' && ` for ${selectedGameType}`}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </div>
      </>
    </ThemeProvider>
  );
}

export default OpenGamesTable;