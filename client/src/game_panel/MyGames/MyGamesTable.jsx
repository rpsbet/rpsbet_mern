import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
  Paper,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  Divider,
  Grid,
  TableContainer,
  TableHead,
  useTheme,
  useMediaQuery,
  Stack,
  Badge,
  Avatar,
} from '@mui/material';
import Lottie from 'react-lottie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyCheckAlt,
  faThumbsUp,
  faThumbsDown,
  faSearch,
  faFilter,
  faSortAmountDown,
  faSortAmountUp,
  faArrowRight,
  faLock,
} from '@fortawesome/free-solid-svg-icons';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Info, Close, Settings, Refresh, Tune, MonetizationOn } from '@mui/icons-material';

import {
  getMyGames,
  updateRoomStrategy,
  editPayout,
  setGameMode,
  addNewTransaction,
  getRoomList,
  endGame,
  pumpGame,
  updateUserPrompt,
} from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';
import { confirmModalCreate } from '../modal/ConfirmAlerts';

import CoHostModal from '../modal/CoHostModal';
import SettingsRef from '../../components/SettingsRef';
import Battle from '../icons/Battle';
import pressHold from '../LottieAnimations/pressHold.json';
import animationData from '../LottieAnimations/add';

function MyGamesTable() {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    connectedAccount: state.auth.connectedAccount,
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
        await dispatch(getRoomList({ game_type: 'All' }));
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
    getRoomList,
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
        updateUserStrategy={updateRoomStrategy}
        updateUserPrompt={updateUserPrompt}
        gameCode={gameCode}
        proxiedAssets={proxiedAssets}
        rowName={selectedRow.name}
        onClose={() => setSettingsPanelOpened(false)}
        user_id={user?._id}
        user_credits={user.credits}
        user_balance={balance}
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
    updateRoomStrategy,
    updateUserPrompt,
    gameCode,
    proxiedAssets,
    balance,
  ]);

  // ---------- Lottie config ----------
  const defaultOptions = {
    loop: !isLowGraphics,
    autoplay: !isLowGraphics,
    animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
  };
  const pressHoldOptions = {
    loop: !isLowGraphics,
    autoplay: !isLowGraphics,
    animationData: pressHold,
  };

  // ---------- Render ----------
  return (
    <Paper
      elevation={3}
      sx={{
        borderRadius: 0,
        overflow: 'hidden',
        background: isDarkMode
          ? 'rgba(18, 18, 20, 0.95)'
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          p: 2,
          background: isDarkMode
            ? 'linear-gradient(90deg, rgba(32, 32, 36, 0.95) 0%, rgba(24, 24, 28, 0.95) 100%)'
            : 'linear-gradient(90deg, rgba(245, 245, 247, 0.95) 0%, rgba(235, 235, 240, 0.95) 100%)',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>
              Portfolio
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
              <Chip
                label="Open"
                variant={selectedFilter === 'open' ? 'filled' : 'outlined'}
                color={selectedFilter === 'open' ? 'error' : 'default'}
                onClick={() => handleFilterChange('open')}
              />
              <Chip
                label="Finished"
                variant={selectedFilter === 'finished' ? 'filled' : 'outlined'}
                color={selectedFilter === 'finished' ? 'error' : 'default'}
                onClick={() => handleFilterChange('finished')}
              />
              <Chip
                label={selectedSort === 'desc' ? 'Newest First' : 'Oldest First'}
                variant="outlined"
                icon={selectedSort === 'desc' ? <FontAwesomeIcon icon={faSortAmountDown} /> : <FontAwesomeIcon icon={faSortAmountUp} />}
                onClick={handleSortChange}
              />
              {Object.keys(theme.gameTypes || {}).length > 0 && (
                <Chip
                  label={selectedGameType || 'All Games'}
                  variant="outlined"
                  icon={<FontAwesomeIcon icon={faFilter} />}
                  onClick={() => { /* Implement game type filter dropdown */ }}
                />
              )}
            </Stack>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search games..."
              size="small"
              value={searchTerm}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FontAwesomeIcon icon={faSearch} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
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
          <Box sx={{ p: 3 }}>
            {[...Array(5)].map((_, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Skeleton variant="circular" width={40} height={40} />
                <Skeleton variant="rounded" sx={{ width: '95%', height: 60, borderRadius: 2 }} />
              </Box>
            ))}
          </Box>
        ) : (
          <Box sx={{ p: 2 }}>
            {/* Empty State */}
            {filteredGames.length === 0 ? (
              <Card
                variant="outlined"
                sx={{
                  textAlign: 'center',
                  p: 4,
                  borderRadius: 2,
                  backgroundColor: isDarkMode ? 'rgba(30, 30, 35, 0.5)' : 'rgba(250, 250, 255, 0.5)',
                }}
              >
                <Lottie options={defaultOptions} height={100} width={100} />
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>
                  No Games Found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You haven't created any games yet. Start by creating a new game.
                </Typography>
                <Button
                  variant="contained"
                  color="error"
                  sx={{ mt: 2 }}
                  onClick={() => { /* Navigate to create game */ }}
                >
                  Create New Game
                </Button>
              </Card>
            ) : (
              /* Game Cards List */
              <Grid container spacing={2}>
                {filteredGames.map((row, idx) => {
                  const rowPress = pressState[row._id] || {};
                  const isClosing = rowPress.closing || false;
                  const isHolding = rowPress.holding || false;
                  const timeLeft = rowPress.timeLeft || 0;

                  const bet = row.user_bet;
                  const endgameAmount = row.endgame_amount;
                  const bondingProgress = endgameAmount !== 0 ? (bet / endgameAmount) * 100 : 0;

                  return (
                    <Grid item xs={12} key={row._id}>
                      <Card
                        sx={{
                          borderRadius: 2,
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          animation: `fadeIn 0.5s ${idx * 0.1}s both`,
                          cursor: 'pointer',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: 6,
                          },
                          backgroundColor: isDarkMode
                            ? 'rgba(28, 28, 32, 0.8)'
                            : 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(8px)',
                          border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                        }}
                        onClick={() => (window.location.href = `/join/${row._id}`)}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Grid container spacing={2} alignItems="center">
                            {/* Game Info */}
                            <Grid item xs={12} sm={4}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Avatar
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    backgroundColor: isDarkMode ? 'rgba(60, 60, 70, 0.5)' : 'rgba(240, 240, 250, 0.5)',
                                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                                  }}
                                  alt={row.name}
                                  src={row.image}
                                >
                                  <img
                                    src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                                    alt=""
                                    style={{ width: 20, height: 20 }}
                                  />
                                </Avatar>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight="bold" noWrap>
                                    {row.name}
                                    {row.is_private && (
                                      <FontAwesomeIcon
                                        icon={faLock}
                                        style={{ marginLeft: 8, fontSize: 14, opacity: 0.7 }}
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {row.ticker}
                                  </Typography>
                                </Box>
                              </Box>
                            </Grid>

                            {/* Liquidity & Progress */}
                            <Grid item xs={6} sm={3}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Liquidity / Hardcap
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="body2" fontWeight="medium">
                                  {convertToCurrency(row.user_bet, solPrice)}
                                  {row.endgame_type && (
                                    <Typography component="span" variant="caption" color="text.secondary">
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
                                  height: 5,
                                  borderRadius: 5,
                                  mt: 0.5,
                                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                }}
                              />
                            </Grid>

                            {/* Equity */}
                            <Grid item xs={6} sm={2}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  Equity
                                </Typography>
                                <Tooltip title="Ownership percentage of room">
                                  <Info sx={{ width: 14, height: 14, opacity: 0.7 }} />
                                </Tooltip>
                              </Box>
                              <Chip
                                label={`${row.share?.toFixed(2)}%`}
                                color="success"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 'medium' }}
                              />
                            </Grid>

                            {/* Social Stats */}
                            <Grid item xs={6} sm={2}>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                Engagement
                              </Typography>
                              <Stack direction="row" spacing={1}>
                                <Tooltip title="Likes">
                                  <Chip
                                    size="small"
                                    icon={<FontAwesomeIcon icon={faThumbsUp} style={{ fontSize: 12 }} />}
                                    label={Array.isArray(row.likes) ? row.likes.length : 0}
                                    variant="outlined"
                                  />
                                </Tooltip>
                                <Tooltip title="Battles">
                                  <Chip
                                    size="small"
                                    icon={<Battle width="12px" />}
                                    label={row.battles || 0}
                                    variant="outlined"
                                  />
                                </Tooltip>
                              </Stack>
                            </Grid>

                            {/* Actions */}
                            <Grid item xs={6} sm={1}>
                              <Stack direction="row" justifyContent="flex-end" spacing={1}>
                                {row.game_type.short_name === 'Custom' && (
                                  <Tooltip title="Game Settings">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => handleSettingsIconClick(e, row)}
                                      sx={{
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        '&:hover': {
                                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        },
                                      }}
                                    >
                                      <AutoAwesomeIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {row.status === 'finished' ? (
                                  <>
                                  </>
                                  // <Button
                                  //   variant="outlined"
                                  //   size="small"
                                  //   startIcon={<Refresh />}
                                  //   onClick={(e) => {
                                  //     e.preventDefault();
                                  //     e.stopPropagation();
                                  //     // implement recreate
                                  //   }}
                                  // >
                                  //   {isMobile ? '' : 'Recreate'}
                                  // </Button>
                                ) : (
                                  row.coHost && (
                                    <Button
                                      variant="outlined"
                                      color="error"
                                      size="small"
                                      disabled={isClosing}
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
                                        minWidth: isHolding ? 60 : 'auto',
                                        transition: 'all 0.2s',
                                        ...(isHolding && {
                                          filter: 'hue-rotate(-10deg)',
                                          transform: 'scale(1.05)',
                                        }),
                                        bgcolor: isDarkMode ? 'rgba(255, 0, 0, 0.1)' : 'rgba(255, 0, 0, 0.05)',
                                        borderColor: isDarkMode ? 'rgba(255, 0, 0, 0.5)' : 'rgba(255, 0, 0, 0.3)',
                                        '&:hover': {
                                          bgcolor: isDarkMode ? 'rgba(255, 0, 0, 0.2)' : 'rgba(255, 0, 0, 0.1)',
                                          borderColor: isDarkMode ? 'rgba(255, 0, 0, 0.7)' : 'rgba(255, 0, 0, 0.5)',
                                        },
                                      }}
                                    >
                                      {isHolding ? (
                                        <>
                                          <Box
                                            component="span"
                                            sx={{
                                              position: 'absolute',
                                              zIndex: 2,
                                              fontWeight: 'bold',
                                            }}
                                          >
                                            {(timeLeft / 100).toFixed(1)}
                                            <Box component="span" sx={{ fontSize: 'xx-small', ml: 0.5 }}>
                                              s
                                            </Box>
                                          </Box>
                                          <Lottie options={pressHoldOptions} height={40} width={40} />
                                        </>
                                      ) : (
                                        'RUG'
                                      )}
                                    </Button>
                                  )
                                )}
                                {/* {row.coHost && selectedFilter === 'open' && (
                                  <Tooltip title="Adjust Hard Cap">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handlePayout(row);
                                      }}
                                      sx={{
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        '&:hover': {
                                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        },
                                      }}
                                    >
                                      <MonetizationOn fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                                {row.coHost && selectedFilter === 'open' && (
                                  <Tooltip title="Add Liquidity">
                                    <IconButton
                                      size="small"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleCoHost(row);
                                      }}
                                      sx={{
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                        '&:hover': {
                                          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                                        },
                                      }}
                                    >
                                      <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 14 }} />
                                    </IconButton>
                                  </Tooltip>
                                )} */}
                              </Stack>
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
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
            borderRadius: 2,
            background: isDarkMode ? 'rgba(18, 18, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
        }}
      >
        <CoHostModal
          isDarkMode={isDarkMode}
          coHostAmount={coHostAmount}
          selectedRow={selectedRow}
          balance={balance}
          user={user}
          togglePopup={() => {}}
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
            borderRadius: 2,
            background: isDarkMode ? 'rgba(18, 18, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
            <FontAwesomeIcon icon={faMoneyCheckAlt} />
            Adjust Hard Cap
          </Box>
          <IconButton
            onClick={handleClosePayoutModal}
            sx={{ color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 2 }}>
            <Table size="small">
              <TableBody>
                <TableRow>
                  <TableCell sx={{ borderBottom: 'none', color: 'text.secondary' }}>
                    Current Payout:
                  </TableCell>
                  <TableCell sx={{ borderBottom: 'none', color: 'warning.main' }}>
                    {selectedRow && selectedRow.endgame_type
                      ? convertToCurrency(selectedRow.endgame_amount, solPrice)
                      : 'MANUAL'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Payout Method
          </Typography>
          <RadioGroup
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            sx={{ mb: 2 }}
          >
            <FormControlLabel
              value="manual"
              control={<Radio color="error" />}
              label="Manual"
              sx={{ '& .MuiFormControlLabel-label': { fontWeight: 'medium' } }}
            />
            <FormControlLabel
              value="automatic"
              control={<Radio color="error" />}
              label="Automatic"
              sx={{ '& .MuiFormControlLabel-label': { fontWeight: 'medium' } }}
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
                borderRadius: 2,
                backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}` }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleSendPayout}
            disabled={payoutAmount <= 0 && paymentMethod === 'automatic'}
            sx={{ borderRadius: 2 }}
          >
            Update
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleClosePayoutModal}
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default MyGamesTable;