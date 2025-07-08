import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  getRoomIds,
  searchRooms,
  loadMoreRooms,
  loadIndividualRoom,
  actionRoom,
  getTopGameTypes,
  setHighlightedRooms,
  clearHighlightedRooms,
  moveRoomToFront,
} from '../../redux/Logic/logic.actions';
import {
  TrendingUpOutlined,
  TrendingDownOutlined,
  LockOutlined,
  ExpandMore as ExpandMoreIcon,
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
  Button,
  Fade,
  IconButton,
  Pagination,
  Collapse,
  Divider,
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
import { loggedSocketOn } from '../../utils/socketEventLogger';
import '../../utils/roomHighlightEffects.js';
import '../../styles/room-highlight-effects.css';

// Mobile-optimized skeleton with reduced complexity
const MobileOptimizedSkeleton = React.memo(({ isError, error, onRetry }) => (
  <Box
    sx={{
      padding: '8px 12px', // Reduced padding for mobile
      borderRadius: '6px', // Smaller border radius
      background: isError ? 'rgba(255, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.02)',
      border: isError ? '1px solid rgba(255, 0, 0, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
      minHeight: '120px', // Fixed height to prevent layout shift
    }}
  >
    {isError ? (
      <Box sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 2
      }}>
        <Typography variant="caption" sx={{ color: 'rgba(255, 0, 0, 0.7)', mb: 1, fontSize: '0.7rem' }}>
          Failed to load
        </Typography>
        <IconButton
          size="small"
          onClick={onRetry}
          sx={{
            color: 'rgba(255, 0, 0, 0.7)',
            '&:hover': { color: '#ff0000' },
            padding: '4px'
          }}
        >
          <RefreshIcon fontSize="small" />
        </IconButton>
      </Box>
    ) : (
      <>
        {/* Simplified skeleton structure */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Skeleton variant="rounded" width={24} height={24} sx={{ borderRadius: '4px', mr: 1 }} />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="60%" height={14} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width="40%" height={12} />
          </Box>
          <Skeleton variant="rounded" width={40} height={16} sx={{ borderRadius: '4px' }} />
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Skeleton variant="text" width="20%" height={12} />
          <Skeleton variant="text" width="15%" height={12} />
          <Skeleton variant="text" width="15%" height={12} />
        </Box>
        <Skeleton variant="rounded" width="100%" height={4} sx={{ borderRadius: '2px' }} />
      </>
    )}
  </Box>
));

// Updated AdvancedSearch component - now only handles expanded content
const AdvancedSearch = React.memo(({
  gameTypeSearch,
  setGameTypeSearch,
  onSearch,
  isSearchMode,
  onClearSearch,
  effectiveIsDarkMode,
  sortBy,
  setSortBy,
  onSortChange,
  isExpanded
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  }, [searchQuery, onSearch]);

  const handleClear = useCallback(() => {
    setSearchQuery('');
    setGameTypeSearch('');
    onClearSearch();
  }, [setGameTypeSearch, onClearSearch]);

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    onSortChange(newSortBy);
  }, [setSortBy, onSortChange]);

  return (
    <Collapse in={isExpanded}>
      <Box sx={{
        mt: 2,
        p: 2,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        backgroundColor: 'rgba(255, 255, 255, 0.02)'
      }}>
        {/* Search Section */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 600 }}>
          Search All Rooms
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap', mb: 2 }}>
          <TextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search names, descriptions, game types..."
            variant="outlined"
            size="small"
            color="error"
            sx={{
              minWidth: '250px',
              flex: 1,
              '& .MuiOutlinedInput-root': {
                fontSize: '0.875rem',
              }
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            variant="contained"
            color="error"
            size="small"
            disabled={!searchQuery.trim()}
            sx={{ fontSize: '0.75rem', px: 2 }}
          >
            Search
          </Button>
          {isSearchMode && (
            <Button
              onClick={handleClear}
              variant="outlined"
              color="error"
              size="small"
              sx={{ fontSize: '0.75rem' }}
            >
              Clear
            </Button>
          )}
        </Box>

        <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.1)' }} />

        {/* Sort Section */}
        <Typography variant="subtitle2" sx={{ mb: 1, fontSize: '0.8rem', fontWeight: 600 }}>
          Sort By
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            onClick={() => handleSortChange('default')}
            variant={sortBy === 'default' ? 'contained' : 'outlined'}
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Default
          </Button>
          <Button
            onClick={() => handleSortChange('bankroll_high')}
            variant={sortBy === 'bankroll_high' ? 'contained' : 'outlined'}
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Bankroll (High to Low)
          </Button>
          <Button
            onClick={() => handleSortChange('bankroll_low')}
            variant={sortBy === 'bankroll_low' ? 'contained' : 'outlined'}
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Bankroll (Low to High)
          </Button>
          <Button
            onClick={() => handleSortChange('battles_high')}
            variant={sortBy === 'battles_high' ? 'contained' : 'outlined'}
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Battles (High to Low)
          </Button>
          <Button
            onClick={() => handleSortChange('battles_low')}
            variant={sortBy === 'battles_low' ? 'contained' : 'outlined'}
            color="error"
            size="small"
            sx={{ fontSize: '0.75rem' }}
          >
            Battles (Low to High)
          </Button>
        </Box>

        {isSearchMode && (
          <Typography variant="caption" sx={{
            display: 'block',
            mt: 2,
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.7rem'
          }}>
            Searching all rooms in database
          </Typography>
        )}
      </Box>
    </Collapse>
  );
});

function OpenGamesTable(props) {
  const {
    loading: propLoading,
    isDarkMode: propIsDarkMode,
    showPlayerModal,
    selectedCreator,
    handleOpenPlayerModal,
    handleClosePlayerModal,
    solPrice: propSolPrice,
  } = props;

  const dispatch = useDispatch();

  // Selectors - optimized for mobile
  const topGameTypesRaw = useSelector(state => state.logic.topGameTypes);
  const user = useSelector(state => state.auth.user);
  const highlightedRoomsRaw = useSelector(state => state.logic.highlightedRooms);
  const loading = useSelector(state => state.logic.isActiveLoadingOverlay);
  const solPrice = useSelector(state => state.logic.solPrice);
  const isDarkMode = useSelector(state => state.auth.isDarkMode);
  const roomIdsRaw = useSelector(state => state.logic.roomIds);
  const roomsByIdRaw = useSelector(state => state.logic.roomsById);
  const roomLoadingStatesRaw = useSelector(state => state.logic.roomLoadingStates);
  const roomErrorsRaw = useSelector(state => state.logic.roomErrors);
  const currentGameTypeRaw = useSelector(state => state.logic.currentGameType);
  const paginationRaw = useSelector(state => state.logic.pagination);
  const isSearchModeRaw = useSelector(state => state.logic.isSearchMode);
  const searchQueryRaw = useSelector(state => state.logic.searchQuery);

  // Memoized fallbacks
  const topGameTypes = useMemo(() => topGameTypesRaw || [], [topGameTypesRaw]);
  const highlightedRooms = useMemo(() => highlightedRoomsRaw || new Set(), [highlightedRoomsRaw]);
  const roomIds = useMemo(() => {
    const ids = roomIdsRaw || [];
    return ids;
  }, [roomIdsRaw]);
  const roomsById = useMemo(() => roomsByIdRaw || {}, [roomsByIdRaw]);
  const roomLoadingStates = useMemo(() => roomLoadingStatesRaw || {}, [roomLoadingStatesRaw]);
  const roomErrors = useMemo(() => roomErrorsRaw || {}, [roomErrorsRaw]);
  const currentGameType = useMemo(() => currentGameTypeRaw || 'All', [currentGameTypeRaw]);
  const pagination = useMemo(() => paginationRaw || null, [paginationRaw]);
  const isSearchMode = useMemo(() => isSearchModeRaw || false, [isSearchModeRaw]);
  const searchQuery = useMemo(() => searchQueryRaw || '', [searchQueryRaw]);

  const effectiveLoading = propLoading !== undefined ? propLoading : loading;
  const effectiveIsDarkMode = propIsDarkMode !== undefined ? propIsDarkMode : isDarkMode;
  const effectiveSolPrice = propSolPrice !== undefined ? propSolPrice : solPrice;

  // Mobile detection
  const isMobile = useMemo(() => window.innerWidth <= 768, []);

  // Local state
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [gameTypeSearch, setGameTypeSearch] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const mountedRef = useRef(false);
  const initialFetchRef = useRef(false);
  const theme = getCustomTheme(effectiveIsDarkMode);

  // Create ordered array of rooms with mobile optimization
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

  // Apply highlighting and move highlighted room to index 0
  const processedRoomData = useMemo(() => {
    const highlightId = Array.from(highlightedRooms)[0];
    if (!highlightId) return orderedRoomData;

 
    const highlightedIndex = orderedRoomData.findIndex(
      item => item.id === highlightId && item.isLoaded
    );


    // If room found and it's not already at index 0, move it to the front
    if (highlightedIndex > 0) {
      const reordered = [...orderedRoomData];
      const [highlightedItem] = reordered.splice(highlightedIndex, 1);
      reordered.unshift(highlightedItem);
      return reordered;
    } else if (highlightedIndex === 0) {
      return orderedRoomData;
    } else {
      // Room doesn't exist at all, just return original order
      return orderedRoomData;
    }
  }, [orderedRoomData, highlightedRooms, roomsById]);


  // Client-side filtering (for local search only)
  const filteredRoomData = useMemo(() => {
    if (isSearchMode) {
      // In search mode, don't apply local filters
      return processedRoomData;
    }

    return processedRoomData.filter(item => {
      if (item.isLoading || item.isError) return true;
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

      // Local search filter
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
  }, [processedRoomData, selectedGameType, gameTypeSearch, isSearchMode]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    if (!initialFetchRef.current) {
      initialFetchRef.current = true;
      dispatch(getRoomIds({ game_type: 'All' }));
      dispatch(getTopGameTypes());
    }
    return () => {
      mountedRef.current = false;
    };
  }, [dispatch]);

  // Socket event handlers
  const handleHighlightFirstRoom = useCallback((data) => {
    
    // Apply room highlighting effects if utilities are available
    if (window.roomHighlightEffects && data?.roomId) {
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
      
      // Move the room to the front of the list permanently in Redux
      dispatch(moveRoomToFront(data.roomId));
      
      dispatch(setHighlightedRooms([data.roomId]));
      
      // Keep the highlighting duration based on bet significance
      const clearDelay = data.duration || 8000; // Original duration for proper big win highlights
      setTimeout(() => {
        dispatch(clearHighlightedRooms());
      }, clearDelay);
    }
  }, [dispatch]);

  const handleRoomActivityBurst = useCallback((data) => {
    
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
  }, []);

  const handleNewLog = useCallback((data) => {
    
    // Trigger room refresh if needed
    if (data?.newLog && Array.isArray(data.newLog) && data.newLog.length > 0) {
      const firstLog = data.newLog[0];
      if (firstLog?.room?._id) {
        // Room data is already updated via ROOM_DATA_UPDATE socket event
      }
    }
  }, [dispatch, roomIds]);

  // Socket event listeners
  useEffect(() => {
    // Get socket from props or Redux state
    const socket = props.socket || user?.socket;
    
    if (!socket || typeof socket.on !== 'function') {
      console.warn('No socket available in OpenGamesTable');
      return;
    }

    // Use logged socket event handlers
    loggedSocketOn(socket, 'HIGHLIGHT_FIRST_ROOM', handleHighlightFirstRoom, 'OpenGamesTable');
    loggedSocketOn(socket, 'ROOM_ACTIVITY_BURST', handleRoomActivityBurst, 'OpenGamesTable');
    loggedSocketOn(socket, 'NEW_LOG', handleNewLog, 'OpenGamesTable');

    return () => {
      if (socket && typeof socket.off === 'function') {
        socket.off('HIGHLIGHT_FIRST_ROOM', handleHighlightFirstRoom);
        socket.off('ROOM_ACTIVITY_BURST', handleRoomActivityBurst);
        socket.off('NEW_LOG', handleNewLog);
      }
    };
  }, [handleHighlightFirstRoom, handleRoomActivityBurst, handleNewLog, props.socket, user?.socket]);

  // Handlers
  const handleGameTypeChange = useCallback((gameType) => {
    if (gameType === selectedGameType) return;

    setSelectedGameType(gameType);
    setGameTypeSearch('');
    dispatch(getRoomIds({
      game_type: gameType,
      page: 1,
      sort_by: sortBy !== 'default' ? sortBy : undefined
    }));
  }, [dispatch, selectedGameType, sortBy]);

  const handleAdvancedSearch = useCallback((query) => {
    dispatch(searchRooms({
      query,
      game_type: selectedGameType !== 'All' ? selectedGameType : undefined,
      page: 1,
      sort_by: sortBy !== 'default' ? sortBy : undefined
    }));
  }, [dispatch, selectedGameType, sortBy]);

  const handleClearSearch = useCallback(() => {
    dispatch(getRoomIds({
      game_type: selectedGameType,
      page: 1,
      sort_by: sortBy !== 'default' ? sortBy : undefined
    }));
  }, [dispatch, selectedGameType, sortBy]);

  const handleSortChange = useCallback((newSortBy) => {
    setSortBy(newSortBy);

    // Trigger new fetch with sorting
    if (isSearchMode) {
      dispatch(searchRooms({
        query: searchQuery,
        game_type: selectedGameType !== 'All' ? selectedGameType : undefined,
        page: 1,
        sort_by: newSortBy !== 'default' ? newSortBy : undefined
      }));
    } else {
      dispatch(getRoomIds({
        game_type: selectedGameType,
        page: 1,
        sort_by: newSortBy !== 'default' ? newSortBy : undefined
      }));
    }
  }, [dispatch, isSearchMode, searchQuery, selectedGameType]);

  const handleRetryRoom = useCallback((roomId) => {
    dispatch(loadIndividualRoom(roomId));
  }, [dispatch]);

  const handleLoadMore = useCallback(() => {
    dispatch(loadMoreRooms());
  }, [dispatch]);

  const handlePageChange = useCallback((event, page) => {
    if (isSearchMode) {
      dispatch(searchRooms({
        query: searchQuery,
        game_type: selectedGameType !== 'All' ? selectedGameType : undefined,
        page,
        sort_by: sortBy !== 'default' ? sortBy : undefined
      }));
    } else {
      dispatch(getRoomIds({
        game_type: selectedGameType,
        page,
        sort_by: sortBy !== 'default' ? sortBy : undefined
      }));
    }
  }, [dispatch, isSearchMode, searchQuery, selectedGameType, sortBy]);

  // Custom time display
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

        {/* Filter and Search Section */}
        <Box sx={{ ml: 3, mr: 3, mb: 3 }}>
          {/* Game Type Chips and Filter Button on Same Row */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
            }}
          >
            {/* Game Type Chips */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '8px',
                overflowX: 'auto', // Enable horizontal scroll for all screen sizes
                flexWrap: 'nowrap', // Prevent wrapping for all screen sizes
                WebkitOverflowScrolling: 'touch',
                flex: 1,
                minWidth: 0,
                // Hide scrollbar for all browsers and screen sizes
                scrollbarWidth: 'none', // Firefox
                '&::-webkit-scrollbar': {
                  height: '0px', // Chrome, Safari, Edge
                  display: 'none',
                },
              }}
            >
              <Chip
                label="ALL GAMES"
                onClick={() => handleGameTypeChange('All')}
                color={selectedGameType === 'All' ? 'error' : 'default'}
                variant={selectedGameType === 'All' ? 'filled' : 'outlined'}
                clickable
                size="small" // Force small size for all screen sizes
                sx={{
                  fontWeight: 600,
                  letterSpacing: '0.3px', // Reduced from 0.5px
                  fontSize: '0.7rem', // Smaller font for all screen sizes
                  height: '24px', // Fixed compact height
                  minWidth: 'auto', // Allow chips to be narrower
                  borderRadius: '12px', // More compact border radius
                  '& .MuiChip-label': {
                    padding: '0 8px', // Reduced horizontal padding
                    lineHeight: 1,
                  },
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                  },
                }}
              />

              {topGameTypes.map((gameType) => (
                <Chip
                  key={gameType}
                  label={gameType.toUpperCase()}
                  onClick={() => handleGameTypeChange(gameType)}
                  color={selectedGameType.toLowerCase() === gameType.toLowerCase() ? 'error' : 'default'}
                  variant={selectedGameType.toLowerCase() === gameType.toLowerCase() ? 'filled' : 'outlined'}
                  clickable
                  size="small" // Force small size for all screen sizes
                  sx={{
                    fontWeight: 600,
                    letterSpacing: '0.3px', // Reduced from 0.5px
                    fontSize: '0.7rem', // Smaller font for all screen sizes
                    height: '24px', // Fixed compact height
                    minWidth: 'auto', // Allow chips to be narrower
                    borderRadius: '12px', // More compact border radius
                    '& .MuiChip-label': {
                      padding: '0 8px', // Reduced horizontal padding
                      lineHeight: 1,
                    },
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.12)',
                    },
                  }}
                />
              ))}
            </Box>

            {/* Filter Button */}
            <Button
              onClick={() => setIsFilterExpanded(!isFilterExpanded)}
              size="small"
              variant="outlined"
              color="error"
              startIcon={<SearchIcon sx={{ fontSize: '1rem' }} />}
              sx={{
                minWidth: 'auto',
                px: 2,
                fontSize: '0.75rem',
                flexShrink: 0,
                '& .MuiSvgIcon-root': {
                  fontSize: '1rem',
                },
                '& .MuiButton-endIcon': {
                  ml: 0.5,
                  '& .MuiSvgIcon-root': {
                    transform: isFilterExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.1s',
                  }
                }
              }}
              endIcon={<ExpandMoreIcon />}
            >
              Filter
            </Button>
          </Box>

          {/* Advanced Search - Now only expanded content */}
          <AdvancedSearch
            gameTypeSearch={gameTypeSearch}
            setGameTypeSearch={setGameTypeSearch}
            onSearch={handleAdvancedSearch}
            isSearchMode={isSearchMode}
            onClearSearch={handleClearSearch}
            effectiveIsDarkMode={effectiveIsDarkMode}
            sortBy={sortBy}
            setSortBy={setSortBy}
            onSortChange={handleSortChange}
            isExpanded={isFilterExpanded}
          />
        </Box>

        {/* Games Display */}
        <div className="table main-game-table open-games">
          {effectiveLoading && roomIds.length === 0 ? (
            // Initial loading
            <Box sx={{ px: 3 }}>
              <Grid container spacing={isMobile ? 1 : 2}>
                {Array.from({ length: isMobile ? 6 : 12 }).map((_, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    lg={4}
                    xl={4}
                    key={`initial-skeleton-${index}`}
                  >
                    <MobileOptimizedSkeleton />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ) : filteredRoomData.length === 0 && !effectiveLoading ? (
            // No rooms found
            <Box
              sx={{
                textAlign: 'center',
                py: isMobile ? 6 : 12,
                px: 3,
              }}
            >
              <Typography
                variant="h6"
                color="text.secondary"
                sx={{
                  fontWeight: 400,
                  letterSpacing: '0.5px',
                  fontSize: isMobile ? '1rem' : '1.25rem',
                }}
              >
                {isSearchMode ? 'NO ROOMS FOUND' : 'GO TO \'BE THE HOUSE\' TO CREATE ONE!'}
              </Typography>
            </Box>
          ) : (
            // Room grid - keeping the existing room display logic
            <Box sx={{ px: 3 }}>
              <Grid container spacing={isMobile ? 1 : 2}>
                {filteredRoomData.map((item, index) => {
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
                        <MobileOptimizedSkeleton
                          isError={item.isError}
                          error={item.error}
                          onRetry={() => handleRetryRoom(item.id)}
                        />
                      </Grid>
                    );
                  }

                  if (!item.isLoaded || !item.room) return null;

                  const row = item.room;
                  const progressPercentage = row.endgame_amount
                    ? Math.min((row.user_bet / row.endgame_amount) * 100, 100)
                    : 0;

                  // Highlight index 0 if there are any highlighted rooms (since highlighted rooms move to index 0)
                  const isHighlighted = index === 0 && highlightedRooms.size > 0;

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
                      <Fade in={true} timeout={100}>
                        <Box
                          data-room-id={row._id}
                          className={`room-card ${isHighlighted ? 'first-room' : ''}`}
                          onClick={(event) => {
                            if (!event.defaultPrevented) {
                              joinRoom({
                                id: row._id,
                                roomStatus: row.status,
                              });
                            }
                          }}
                          sx={{
                            padding: isMobile ? '8px 12px' : '12px 16px',
                            borderRadius: '6px',
                            background: isHighlighted
                              ? 'linear-gradient(90deg, rgba(255, 0, 0, 0.1), rgba(255, 0, 0, 0.03))'
                              : 'rgba(255, 255, 255, 0.02)',
                            border: isHighlighted
                              ? '1px solid rgba(255, 0, 0, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                            position: 'relative',
                            minHeight: isMobile ? '140px' : '160px',
                            '&:hover': {
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 0, 0, 0.2)',
                              transform: isMobile ? 'none' : 'translateY(-2px)',
                            },
                          }}
                        >
                          {/* Rest of the room display code remains the same */}
                          {/* Header Row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
                            <Box
                              sx={{
                                width: isMobile ? 24 : 32,
                                height: isMobile ? 24 : 32,
                                borderRadius: '4px',
                                overflow: 'hidden',
                                mr: isMobile ? 1 : 2,
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
                                style={{
                                  width: isMobile ? 20 : 28,
                                  height: isMobile ? 20 : 28,
                                  objectFit: 'cover'
                                }}
                              />
                            </Box>

                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: isMobile ? '0.75rem' : '0.875rem',
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
                                    ml: 0.5,
                                    fontSize: isMobile ? '0.65rem' : '0.75rem',
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
                                  fontSize: isMobile ? '0.6rem' : '0.7rem',
                                  color: 'rgba(255, 255, 255, 0.5)',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  display: 'block',
                                }}
                              >
                                {row.description && row.description.length > (isMobile ? 25 : 40)
                                  ? `${row.description.slice(0, isMobile ? 25 : 40)}...`
                                  : row.description || 'No description'}
                              </Typography>
                            </Box>

                            <Chip
                              label={Array.isArray(row.game_type)
                                ? row.game_type[0]?.toUpperCase() || 'N/A'
                                : (row.game_type ? String(row.game_type).toUpperCase() : 'N/A')}
                              size="small"
                              sx={{
                                height: isMobile ? '16px' : '20px',
                                fontSize: isMobile ? '0.6rem' : '0.65rem',
                                fontWeight: 600,
                                backgroundColor: 'transparent',
                                color: 'rgba(255, 255, 255, 0.7)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                '& .MuiChip-label': {
                                  padding: isMobile ? '0 4px' : '0 6px',
                                },
                              }}
                            />
                          </Box>

                          {/* Stats Row - Mobile optimized */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isMobile ? 1 : 2 }}>
                            <Box sx={{ textAlign: 'left' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: isMobile ? '0.6rem' : '0.65rem',
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
                                  fontSize: isMobile ? '0.7rem' : '0.8rem',
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
                                      <TrendingUpOutlined sx={{ fontSize: isMobile ? 8 : 10 }} />
                                    ) : (
                                      <TrendingDownOutlined sx={{ fontSize: isMobile ? 8 : 10 }} />
                                    )}
                                  </>
                                )}
                              </Typography>
                            </Box>

                            <Box sx={{ textAlign: 'center' }}>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: isMobile ? '0.6rem' : '0.65rem',
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
                                  fontSize: isMobile ? '0.7rem' : '0.8rem',
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
                                  fontSize: isMobile ? '0.6rem' : '0.65rem',
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
                                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                                  color: '#fff',
                                }}
                              >
                                {customFromNow(row.created_at)}
                              </Typography>
                            </Box>
                          </Box>

                          {/* Health bar and actions */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Box sx={{ flex: 1, mr: isMobile ? 1 : 2 }}>
                              <Box
                                sx={{
                                  width: '100%',
                                  height: isMobile ? '4px' : '6px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  borderRadius: isMobile ? '2px' : '3px',
                                  overflow: 'hidden',
                                  position: 'relative',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${100 - progressPercentage}%`,
                                    height: '100%',
                                    background: 'linear-gradient(90deg, rgba(227, 255, 0, 0.8), rgba(253, 181, 0, 0.9))',
                                    borderRadius: isMobile ? '2px' : '3px',
                                    transition: 'width 0.1s ease',
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                sx={{
                                  fontSize: isMobile ? '0.55rem' : '0.6rem',
                                  color: 'rgba(255, 255, 255, 0.6)',
                                  mt: 0.25,
                                  display: 'block',
                                }}
                              >
                                Health: {(100 - progressPercentage).toFixed(0)}%
                              </Typography>
                            </Box>

                            {!isMobile && (
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <LikeDislikeView
                                  row={row}
                                  user={user}
                                  handleLike={() => dispatch(actionRoom({ roomId: row._id, type: 'like' }))}
                                  handleDislike={() => dispatch(actionRoom({ roomId: row._id, type: 'dislike' }))}
                                  handleView={() => dispatch(actionRoom({ roomId: row._id, type: 'view' }))}
                                />
                              </Box>
                            )}
                          </Box>

                          {/* Private room indicator */}
                          {row.is_private && (
                            <Tooltip title="Password required" arrow>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 6,
                                  right: 6,
                                  width: isMobile ? 16 : 24,
                                  height: isMobile ? 16 : 24,
                                  borderRadius: '50%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                                  backdropFilter: 'blur(4px)',
                                }}
                              >
                                <LockOutlined
                                  sx={{
                                    fontSize: isMobile ? 8 : 12,
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

              {/* Pagination Controls */}
              {pagination && pagination.totalPages > 1 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 4,
                  mb: 2,
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  gap: 2
                }}>
                  {/* Mobile: Load More Button */}
                  {isMobile ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.7rem' }}>
                        Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total rooms)
                      </Typography>
                      {pagination.hasNext && (
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={handleLoadMore}
                          disabled={effectiveLoading}
                          size="small"
                          sx={{
                            fontSize: '0.75rem',
                            px: 3,
                            py: 1
                          }}
                        >
                          {effectiveLoading ? 'Loading...' : 'Load More'}
                        </Button>
                      )}
                    </Box>
                  ) : (
                    /* Desktop: Full Pagination */
                    <>
                      <Pagination
                        count={pagination.totalPages}
                        page={pagination.currentPage}
                        onChange={handlePageChange}
                        color="error"
                        size="small"
                        showFirstButton
                        showLastButton
                        sx={{
                          '& .MuiPaginationItem-root': {
                            color: 'rgba(255, 255, 255, 0.7)',
                            fontSize: '0.875rem',
                          },
                          '& .Mui-selected': {
                            backgroundColor: '#ff0000 !important',
                            color: '#fff',
                          },
                        }}
                      />
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                        {pagination.totalCount} total rooms
                      </Typography>
                    </>
                  )}
                </Box>
              )}

              {/* Loading status */}
              {roomIds.length > 0 && (
                <Box sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  mt: 2,
                  mb: 2,
                  color: 'rgba(255, 255, 255, 0.6)'
                }}>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem', textAlign: 'center' }}>
                    {(() => {
                      const loadedCount = Object.values(roomLoadingStates).filter(state => state === 'loaded').length;
                      const totalCount = roomIds.length;
                      const loadingCount = Object.values(roomLoadingStates).filter(state => state === 'loading').length;

                      if (loadingCount > 0) {
                        return `Loading rooms... (${loadedCount}/${totalCount} loaded)`;
                      } else {
                        const displayCount = filteredRoomData.filter(item => item.isLoaded).length;
                        if (isSearchMode) {
                          return `Found ${displayCount} rooms matching "${searchQuery}"`;
                        } else {
                          return `Showing ${displayCount} rooms${selectedGameType !== 'All' ? ` for ${selectedGameType}` : ''}${sortBy !== 'default' ? ` sorted by ${sortBy.replace('_', ' ')}` : ''}`;
                        }
                      }
                    })()}
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

export default React.memo(OpenGamesTable);