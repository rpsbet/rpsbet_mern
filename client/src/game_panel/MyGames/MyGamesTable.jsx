import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  Box,
  Tooltip,
  Typography,
  Button,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  TextField,
  InputAdornment,
  Chip,
  LinearProgress,
  IconButton,
  Grid,
  useTheme,
  useMediaQuery,
  Stack,
  Avatar,
} from '@mui/material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyCheckAlt,
  faThumbsUp,
  faSearch,
  faFilter,
  faSortAmountDown,
  faSortAmountUp,
  faLock,
  faFistRaised,
} from '@fortawesome/free-solid-svg-icons';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Info, Close, } from '@mui/icons-material';

import {
  getMyGames,
  editPayout,
  addNewTransaction,
  endGame,
  pumpGame,
} from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';

import CoHostModal from '../modal/CoHostModal';
import SettingsRef from '../../components/SettingsRef';

function MyGamesTable() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Map state from Redux using useSelector
  const {
    balance,
    user,
    myGames: propsMyGames,
    socket,
    isDarkMode,
    isLowGraphics,
    solPrice,
    my_games_loading,
    connectedAccount,
    strategies,
  } = useSelector((state) => ({
    isDarkMode: state.auth.isDarkMode,
    isLowGraphics: state.auth.isLowGraphics,
    myGames: state.logic.myGames,
    pageNumber: state.logic.myGamesPageNumber,
    game_mode: state.logic.game_mode,
    my_games_loading: state.logic.my_games_loading,
    socket: state.auth.socket,
    balance: state.auth.balance,
    connectedAccount: state.auth.walletAddress,
    user: state.auth.user,
    strategies: state.logic.strategies,
    solPrice: state.logic.solPrice,
  }));

  // ---------- State ----------
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('open');
  const [selectedSort, setSelectedSort] = useState('desc');
  const [myGames, setMyGames] = useState(propsMyGames);
  const [gameCode, setGameCode] = useState('');
  const [proxiedAssets, setProxiedAssets] = useState({ images: [], audio: [], theme: {}, background: {} });
  const [isCoHostModalOpen, setIsCoHostModalOpen] = useState(false);
  const [coHostAmount, setCoHostAmount] = useState(0);
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Payout
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [payoutAmount, setPayoutAmount] = useState(0);

  // Settings
  const [settingsPanelOpened, setSettingsPanelOpened] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState(null);
  const settingsRef = useRef(null);

  const [pressState, setPressState] = useState({});

  // ---------- Effects ----------

  const fetchData = useCallback(() => {
    dispatch(
      getMyGames(
        {
          game_type: selectedGameType,
          status: selectedFilter === 'open' ? 'open' : 'finished',
          sort: selectedSort,
        },
        (updated) => {
          setMyGames(updated);
        },
      ),
    );
  }, [dispatch, selectedGameType, selectedFilter, selectedSort]);

  useEffect(() => {
    async function fetchInitialData() {
      await fetchData();
      document.addEventListener('mousedown', handleClickOutside);
    }
    fetchInitialData();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [fetchData]);

  const handleBankrollUpdate = useCallback(
    (data) => {
      setMyGames((prevMyGames) =>
        prevMyGames.map((game) => {
          if (game._id === data.room) {
            return {
              ...game,
              user_bet: data.bankroll,
              battles: (game.battles || 0) + 1,
              coHost: data.hosts ? false : game.coHost,
            };
          }
          return game;
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!socket) return;

    myGames.forEach((game) => {
      socket.on(`UPDATED_BANKROLL_${game._id}`, handleBankrollUpdate);
    });

    return () => {
      myGames.forEach((game) => {
        socket.off(`UPDATED_BANKROLL_${game._id}`, handleBankrollUpdate);
      });
    };
  }, [socket, myGames, handleBankrollUpdate]);

  useEffect(() => {
    fetchData();
  }, [selectedFilter, selectedSort, fetchData]);

  useEffect(() => {
    setMyGames(propsMyGames);
  }, [propsMyGames]);

  // Update myGames when gameCode changes to keep selectedRow.gameCode in sync
  useEffect(() => {
    if (selectedRow && gameCode && selectedRow.gameCode !== gameCode) {
      setMyGames((prevMyGames) =>
        prevMyGames.map((game) =>
          game._id === selectedRow._id ? { ...game, gameCode } : game
        )
      );
    }
  }, [gameCode, selectedRow]);

  // ---------- Handlers ----------
  const handleGameTypeChange = (type) => {
    setSelectedGameType(type);
    fetchData();
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const handleSortChange = () => {
    const newSort = selectedSort === 'asc' ? 'desc' : 'asc';
    setSelectedSort(newSort);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ---------- CoHost ----------
  const handleCoHost = (row) => {
    setSelectedRow(row);
    setIsCoHostModalOpen(true);
  };

  const handleCloseCoHostModal = () => {
    setIsCoHostModalOpen(false);
  };

  const handleCoHostAmountChange = (e) => {
    setCoHostAmount(e.target.value);
  };

  const handleSendCoHost = useCallback(async () => {
    if (coHostAmount <= 0) {
      dispatch(errorMsgBar('Invalid amount: Value must be greater than 0'));
      return;
    }
    if (coHostAmount > balance) {
      dispatch(errorMsgBar('Insufficient funds: Amount exceeds available balance'));
      return;
    }
    try {
      const result = await dispatch(pumpGame(coHostAmount, selectedRow._id));
      if (result.success) {
        dispatch(addNewTransaction(result.newTransaction));
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (e) {
      dispatch(errorMsgBar('Room is currently busy, please try again later'));
    }
  }, [
    coHostAmount,
    balance,
    selectedRow,
    dispatch,
    pumpGame,
    addNewTransaction,
  ]);

  // ---------- Payout ----------
  const handlePayout = (row) => {
    setSelectedRow(row);
    const autoPayment = row.endgame_type ? 'automatic' : 'manual';
    const amt = row.endgame_amount || 0;
    setPaymentMethod(autoPayment);
    setPayoutAmount(amt);
    setIsPayoutModalOpen(true);
  };

  const handleClosePayoutModal = () => {
    setIsPayoutModalOpen(false);
  };

  const handlePayoutAmountChange = (e) => {
    setPayoutAmount(e.target.value);
  };

  const handlePaymentMethodChange = (e) => {
    const method = e.target.value;
    setPaymentMethod(method);
    if (method !== 'manual' && selectedRow) {
      setPayoutAmount(selectedRow.endgame_amount);
    } else if (method === 'manual') {
      setPayoutAmount(0);
    }
  };

  const handleSendPayout = useCallback(async () => {
    if (payoutAmount <= 0) {
      dispatch(
        errorMsgBar('Error: Hard cap amount must be greater than 0'),
      );
      return;
    }
    if (!selectedRow) return;

    try {
      const result = await dispatch(editPayout(payoutAmount, selectedRow._id));
      if (result.success) {
        await fetchData();
        dispatch(errorMsgBar(result.message));
        handleClosePayoutModal();
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (error) {
      dispatch(errorMsgBar('Failed to adjust hard cap.'));
    }
  }, [payoutAmount, selectedRow, dispatch, editPayout, fetchData]);

  // ---------- RUG logic ----------
  const endRoom = useCallback(
    async (winnings, room_id, connectedAccount) => {
      setPressState((prev) => ({
        ...prev,
        [room_id]: { ...prev[room_id], closing: true },
      }));

      try {
        await dispatch(endGame(room_id, connectedAccount));
        setMyGames((prevGames) => prevGames.filter((g) => g._id !== room_id));
      } catch (error) {
        console.error('Error ending game:', error);
      } finally {
        setPressState((prev) => ({
          ...prev,
          [room_id]: { ...prev[room_id], closing: false },
        }));
      }
    },
    [dispatch],
  );

  const handleButtonClick = useCallback(
    (winnings, room_id) => {
      const startTime = 400;
      const updateInterval = 10;
      let countdown = startTime;

      const timer = setInterval(() => {
        countdown -= updateInterval;
        if (countdown <= 0) {
          clearInterval(timer);
          endRoom(winnings, room_id, connectedAccount);
          setPressState((prev) => ({
            ...prev,
            [room_id]: {
              ...prev[room_id],
              holding: false,
              timeLeft: 0,
            },
          }));
        } else {
          setPressState((prev) => ({
            ...prev,
            [room_id]: {
              ...prev[room_id],
              holding: true,
              timeLeft: countdown,
              timer,
            },
          }));
        }
      }, updateInterval);

      setPressState((prev) => ({
        ...prev,
        [room_id]: {
          ...prev[room_id],
          holding: true,
          timeLeft: startTime,
          timer,
        },
      }));
    },
    [endRoom, connectedAccount],
  );

  const handleButtonRelease = useCallback((room_id) => {
    setPressState((prev) => {
      const current = prev[room_id];
      if (current && current.timer) clearInterval(current.timer);
      return {
        ...prev,
        [room_id]: { ...current, holding: false },
      };
    });
  }, []);

  // ---------- SETTINGS ----------
  const handleSettingsIconClick = (event, row) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedRow(row);
    setGameCode(row.gameCode || '');
    setProxiedAssets(row.proxiedAssets || {
      audio: [],
      theme: {},
      background: {}
    });
    setSettingsPanelOpened(!settingsPanelOpened);
  };

  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      setSettingsPanelOpened(false);
    }
  };

  // Filter games based on search term
  const filteredGames = useMemo(() => {
    return myGames.filter(game =>
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.ticker.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [myGames, searchTerm]);

  // ---------- Memoized SettingsRef ----------
  const settingsRefComponent = useMemo(() => {
    return selectedRow ? (
      <SettingsRef
        ref={settingsRef}
        my_games={true}
        strategies={strategies}
        ai_mode={selectedRow.selectedStrategy}
        room_id={selectedRow._id}
        prompt={user?.prompt}
        setGameCode={setGameCode}
        setProxiedAssets={setProxiedAssets}
        rank={getRank(user?.totalWagered)}
        settings_panel_opened={settingsPanelOpened}
        setSelectedStrategy={setSelectedStrategy}
        selectedStrategy={selectedStrategy}
        gameCode={gameCode}
        proxiedAssets={proxiedAssets}
        rowName={selectedRow.name}
        onClose={() => setSettingsPanelOpened(false)}
        user_id={user?._id}
        user_credits={user.credits}
        creator_prompt={user?.prompt}
      />
    ) : null;
  }, [
    selectedRow,
    strategies,
    user,
    settingsPanelOpened,
    selectedStrategy,
    setGameCode,
    setProxiedAssets,
    setSelectedStrategy,
    gameCode,
    proxiedAssets,
    balance,
  ]);

  // ---------- Render ----------
  return (
    <Box
      sx={{
        borderRadius: '8px',
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" fontWeight="600" sx={{ mb: 1, color: '#fff', fontSize: '1rem' }}>
              Portfolio
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Open"
                variant={selectedFilter === 'open' ? 'filled' : 'outlined'}
                color="error"
                size="small"
                onClick={() => handleFilterChange('open')}
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  backgroundColor: selectedFilter === 'open' ? '#ff0000' : 'transparent',
                  borderColor: 'rgba(255, 0, 0, 0.3)',
                  color: selectedFilter === 'open' ? '#fff' : '#ff0000',
                  '&:hover': {
                    backgroundColor: selectedFilter === 'open' ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                    borderColor: '#ff0000',
                  },
                }}
              />
              <Chip
                label="Finished"
                variant={selectedFilter === 'finished' ? 'filled' : 'outlined'}
                color="error"
                size="small"
                onClick={() => handleFilterChange('finished')}
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  backgroundColor: selectedFilter === 'finished' ? '#ff0000' : 'transparent',
                  borderColor: 'rgba(255, 0, 0, 0.3)',
                  color: selectedFilter === 'finished' ? '#fff' : '#ff0000',
                  '&:hover': {
                    backgroundColor: selectedFilter === 'finished' ? '#cc0000' : 'rgba(255, 0, 0, 0.1)',
                    borderColor: '#ff0000',
                  },
                }}
              />
              <Chip
                label={selectedSort === 'desc' ? 'Newest First' : 'Oldest First'}
                variant="outlined"
                size="small"
                onClick={handleSortChange}
                sx={{
                  fontSize: '0.75rem',
                  height: 28,
                  borderColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  },
                }}
              />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search games..."
              size="small"
              color='error'
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faSearch} style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.6)' }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(255, 0, 0, 0.5)',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#ff0000',
                  },
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                  },
                },
                '& .MuiInputBase-input': {
                  color: '#fff',
                  fontSize: '0.875rem',
                },
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Content Area */}
      <Box sx={{ position: 'relative' }}>
        {/* Settings Panel */}
        {settingsRefComponent}

        {/* Loading State */}
        {my_games_loading ? (
          <Box sx={{ p: 2 }}>
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  p: 2,
                  mb: 2,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="60%" height={20} sx={{ mb: 0.5 }} />
                    <Skeleton variant="text" width="40%" height={16} />
                  </Box>
                  <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: '4px' }} />
                </Box>
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Empty State */}
            {filteredGames.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#fff', fontSize: '1rem' }}>
                  No Games Found
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 2, fontSize: '0.875rem' }}>
                  You haven't created any games yet. Start by creating a new game.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => { navigate('/create'); }}
                  sx={{
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                  }}
                >
                  Create New Game
                </Button>
              </Box>
            ) : (
              /* Game Cards List */
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filteredGames.map((row, idx) => {
                  const rowPress = pressState[row._id] || {};
                  const isClosing = rowPress.closing || false;
                  const isHolding = rowPress.holding || false;
                  const timeLeft = rowPress.timeLeft || 0;

                  const bet = row.user_bet;
                  const endgameAmount = row.endgame_amount;
                  const bondingProgress = endgameAmount !== 0 ? (bet / endgameAmount) * 100 : 0;

                  return (
                    <Box
                      key={row._id}
                      sx={{
                        p: 2,
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        },
                      }}
                      onClick={(e) => {
                        // Don't redirect if clicking on action buttons
                        if (e.target.closest('button') || e.target.closest('.MuiIconButton-root')) {
                          return;
                        }
                        window.location.href = `/join/${row._id}`;
                      }}
                    >
                      <Grid container spacing={2} alignItems="center">
                        {/* Game Info */}
                        <Grid item xs={12} sm={4}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                              alt={row.name}
                              src={row.image}
                            >
                              <img
                                src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                                alt=""
                                style={{ width: 16, height: 16 }}
                              />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="600" noWrap sx={{ color: '#fff', fontSize: '0.875rem' }}>
                                {row.name}
                                {row.is_private && (
                                  <FontAwesomeIcon
                                    icon={faLock}
                                    style={{ marginLeft: 6, fontSize: 12, opacity: 0.7 }}
                                  />
                                )}
                              </Typography>
                              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                                {row.ticker}
                              </Typography>
                            </Box>
                          </Box>
                        </Grid>

                        {/* Liquidity & Progress */}
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', mb: 0.5 }}>
                            Liquidity / Hardcap
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" fontWeight="500" sx={{ color: '#fff', fontSize: '0.8rem' }}>
                              {convertToCurrency(row.user_bet, solPrice)}
                              {row.endgame_type && (
                                <Typography component="span" variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                                  {' '}/{' '}{convertToCurrency(row.endgame_amount, solPrice)}
                                </Typography>
                              )}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={bondingProgress}
                            color='error'
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              mt: 0.5,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }}
                          />
                        </Grid>

                        {/* Equity */}
                        <Grid item xs={6} sm={2}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', mb: 0.5 }}>
                              Equity
                            </Typography>
                            <Tooltip title="Ownership percentage of room">
                              <Info sx={{ width: 12, height: 12, opacity: 0.7 }} />
                            </Tooltip>
                          </Box>
                          <Chip
                            label={`${row.share?.toFixed(2)}%`}
                            size="small"
                            variant="outlined"
                            sx={{ 
                              fontWeight: 500, 
                              fontSize: '0.7rem',
                              height: 20,
                              borderColor: 'rgba(76, 175, 80, 0.5)',
                              color: '#4caf50',
                            }}
                          />
                        </Grid>

                        {/* Social Stats */}
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem', mb: 0.5 }}>
                            Engagement
                          </Typography>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title="Likes">
                              <Chip
                                size="small"
                                label={Array.isArray(row.likes) ? row.likes.length : 0}
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  minWidth: 20,
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  '& .MuiChip-label': {
                                    padding: '0 4px',
                                  },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title="Battles">
                              <Chip
                                size="small"
                                label={row.battles || 0}
                                variant="outlined"
                                sx={{
                                  fontSize: '0.65rem',
                                  height: 20,
                                  minWidth: 20,
                                  borderColor: 'rgba(255, 255, 255, 0.2)',
                                  color: 'rgba(255, 255, 255, 0.7)',
                                  '& .MuiChip-label': {
                                    padding: '0 4px',
                                  },
                                }}
                              />
                            </Tooltip>
                          </Stack>
                        </Grid>

                        {/* Actions */}
                        <Grid item xs={6} sm={1}>
                          <Stack direction="row" justifyContent="flex-end" spacing={0.5}>
                            <Tooltip title="Game Settings">
                              <IconButton
                                size="small"
                                onClick={(e) => handleSettingsIconClick(e, row)}
                                sx={{
                                  width: 28,
                                  height: 28,
                                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                  },
                                }}
                              >
                                <AutoAwesomeIcon sx={{ fontSize: '14px' }} />
                              </IconButton>
                            </Tooltip>
                            {row.status === 'finished' ? (
                              <></>
                            ) : (
                              row.coHost && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  size="small"
                                  disabled={isClosing}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonClick(row.winnings, row._id);
                                  }}
                                  onMouseUp={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonRelease(row._id);
                                  }}
                                  onMouseLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonRelease(row._id);
                                  }}
                                  onTouchStart={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonClick(row.winnings, row._id);
                                  }}
                                  onTouchEnd={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonRelease(row._id);
                                  }}
                                  onTouchCancel={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleButtonRelease(row._id);
                                  }}
                                  sx={{
                                    minWidth: isHolding ? 50 : 'auto',
                                    height: 28,
                                    fontSize: '0.7rem',
                                    textTransform: 'none',
                                    px: 1,
                                    transition: 'all 0.2s',
                                    ...(isHolding && {
                                      transform: 'scale(1.05)',
                                    }),
                                    borderColor: 'rgba(255, 0, 0, 0.3)',
                                    color: '#ff0000',
                                    '&:hover': {
                                      borderColor: '#ff0000',
                                      backgroundColor: 'rgba(255, 0, 0, 0.1)',
                                    },
                                  }}
                                >
                                  {isHolding ? (
                                    <>
                                      {(timeLeft / 100).toFixed(1)}
                                      <Box component="span" sx={{ fontSize: '0.6rem', ml: 0.5 }}>
                                        s
                                      </Box>
                                    </>
                                  ) : (
                                    'RUG'
                                  )}
                                </Button>
                              )
                            )}
                          </Stack>
                        </Grid>
                      </Grid>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* CoHost Modal */}
      <Dialog
        open={isCoHostModalOpen}
        onClose={handleCloseCoHostModal}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        <CoHostModal
          isDarkMode={isDarkMode}
          coHostAmount={coHostAmount}
          selectedRow={selectedRow}
          balance={balance}
          user={user}
          togglePopup={() => { }}
          handleClose={handleCloseCoHostModal}
          handleSendCoHost={handleSendCoHost}
          handleCoHostAmountChange={handleCoHostAmountChange}
          has_joined={false}
          input_only={false}
          solPrice={solPrice}
        />
      </Dialog>

      {/* Payout Modal */}
      <Dialog
        open={isPayoutModalOpen}
        onClose={handleClosePayoutModal}
        fullWidth
        maxWidth="sm"
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: '8px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faMoneyCheckAlt} style={{ fontSize: '16px' }} />
            Adjust Hard Cap
          </Box>
          <IconButton
            onClick={handleClosePayoutModal}
            sx={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              width: 32,
              height: 32,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <Close sx={{ fontSize: '16px' }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ borderBottom: 'none', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.875rem' }}>
                    Current Payout:
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', color: '#ff9800', fontSize: '0.875rem', fontWeight: 500 }}>
                    {selectedRow && selectedRow.endgame_type
                      ? convertToCurrency(selectedRow.endgame_amount, solPrice)
                      : 'MANUAL'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600, color: '#fff', fontSize: '0.875rem' }}>
            Payout Method
          </Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              value="manual"
              control={<Radio color="error" size="small" />}
              label={<Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#fff' }}>Manual</Typography>}
            />
            <FormControlLabel
              value="automatic"
              control={<Radio color="error" size="small" />}
              label={<Typography sx={{ fontWeight: 500, fontSize: '0.875rem', color: '#fff' }}>Automatic</Typography>}
            />
          </RadioGroup>
          <TextField
            fullWidth
            label="Payout Amount"
            value={payoutAmount}
            type="number"
            onChange={handlePayoutAmountChange}
            variant="outlined"
            disabled={paymentMethod === 'manual'}
            InputProps={{
              endAdornment: <InputAdornment position="end">RPS</InputAdornment>,
              inputProps: { min: 0 },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255, 0, 0, 0.5)',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#ff0000',
                },
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.1)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.6)',
                '&.Mui-focused': {
                  color: '#ff0000',
                },
              },
              '& .MuiInputBase-input': {
                color: '#fff',
              },
              '& .MuiInputAdornment-root': {
                color: 'rgba(255, 255, 255, 0.6)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleSendPayout}
            disabled={payoutAmount <= 0 && paymentMethod === 'automatic'}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            Update
          </Button>
          <Button
            variant="outlined"
            onClick={handleClosePayoutModal}
            sx={{ 
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.875rem',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyGamesTable;