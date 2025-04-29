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
} from '@mui/material';
import Lottie from 'react-lottie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyCheckAlt, faThumbsUp, faThumbsDown } from '@fortawesome/free-solid-svg-icons';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { Info } from '@mui/icons-material';

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
  }, []);

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
    [setMyGames],
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
      dispatch(errorMsgBar('R U FURR-REAL? AMOUNT MUST BE MORE THAN 0!'));
      return;
    }
    if (coHostAmount > balance) {
      dispatch(errorMsgBar('NOT ENUFF FUNDS AT THIS MEOWMENT'));
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
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
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
        errorMsgBar('R U FURR-REAL? HARD CAP AMOUNT MUST BE MORE THAN 0!'),
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
    async (winnings, room_id) => {
      setPressState((prev) => ({
        ...prev,
        [room_id]: { ...prev[room_id], closing: true },
      }));

      try {
        await dispatch(endGame(room_id));
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
          endRoom(winnings, room_id);
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
    [endRoom],
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
    // if (row.coHost) {
      setSelectedRow(row);
      setGameCode(row.gameCode || '');
      setProxiedAssets(row.proxiedAssets || { 
        audio: [],
        theme: {},
        background: {}
      })
      setSettingsPanelOpened(!settingsPanelOpened);
    // } else {
    //   dispatch(errorMsgBar('YOU MUST OWN 100% TO CHANGE MODEL.'));
    // }
  };

  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      setSettingsPanelOpened(false);
    }
  };

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
        user_balance={balance} // Pass user_balance if required
        creator_prompt={user?.prompt} // Pass creator_prompt if required
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
    <Box className="my-open-games">
      <Box className="filter-container overflowX">
        {settingsRefComponent}
      </Box>

      {my_games_loading ? (
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Skeleton variant="rounded" width={40} height={40} />
              <Skeleton variant="text" sx={{ width: '30%' }} />
              <Skeleton variant="text" sx={{ width: '30%' }} />
              <Skeleton variant="text" sx={{ width: '30%' }} />
            </Box>
          ))}
        </Box>
      ) : (
        <Box className="table my-open-game-table" sx={{ p: 2 }}>
          {myGames.length === 0 ? (
            <Box
              className="dont-have-game-msg"
              sx={{ textAlign: 'center', mt: 2 }}
            >
              <Lottie options={defaultOptions} width={50} />
              <Typography variant="body1" sx={{ mt: 1 }}>
                You Have No Games
              </Typography>
            </Box>
          ) : (
            <>
              <Box
                className="table-header"
                sx={{
                  width: '100%',
                  alignItems: 'center',
                  p: '10px 20px',
                  mb: 2,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  // Optional: Apply glassmorphism to header for consistency
                  background: isDarkMode
                    ? 'rgba(0, 0, 0, 0.2)'
                    : 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)', // For Safari
                  border: isDarkMode
                    ? '1px solid rgba(255, 255, 255, 0.2)'
                    : '1px solid rgba(0, 0, 0, 0.2)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                }}
              >
                <Box className="table-cell room-id" sx={{ width: '17%' }}>
                  ROOM
                </Box>
                <Box className="table-cell winnings" sx={{ width: '17%' }}>
                  LIQUIDITY / PROGRESS
                </Box>
                <Box className="table-cell bet-info" sx={{ width: '17%' }}>
                  EQUITY
                  <Tooltip title="TO REACH RAYDIUM">
                    <Info sx={{ width: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Box>
                <Box className="table-cell winnings" sx={{ width: '17%' }}>
                  LIKES / BATTLES
                </Box>
                <Box className="table-cell" sx={{ width: '15%' }} />
              </Box>

              {myGames.map((row, idx) => {
                const rowPress = pressState[row._id] || {};
                const isClosing = rowPress.closing || false;
                const isHolding = rowPress.holding || false;
                const timeLeft = rowPress.timeLeft || 0;

                const bet = row.user_bet;
                const endgameAmount = row.endgame_amount;
                const bondingProgress =
                  endgameAmount !== 0 ? (bet / endgameAmount) * 100 : 0;

                return (
                  <Box
                    key={row._id}
                    className="table-row slide-in"
                    sx={{
                      animationDelay: `${idx * 0.1}s`,
                      cursor: 'pointer',
                      mb: 1,
                      display: 'flex',
                      flexDirection: 'row',
                      // Glassmorphism styles
                      background: isDarkMode
                        ? 'rgba(0, 0, 0, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)', // For Safari
                      border: isDarkMode
                        ? '1px solid rgba(255, 255, 255, 0.2)'
                        : '1px solid rgba(0, 0, 0, 0.2)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                      // Fallback for browsers without backdrop-filter
                      '@supports not (backdrop-filter: blur(10px))': {
                        background: isDarkMode
                          ? 'rgba(0, 0, 0, 0.4)'
                          : 'rgba(255, 255, 255, 0.3)',
                      },
                      // Hover effect for interactivity
                      '&:hover': {
                        background: isDarkMode
                          ? 'rgba(0, 0, 0, 0.3)'
                          : 'rgba(255, 255, 255, 0.2)',
                        boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                      },
                    }}
                    onClick={() => (window.location.href = `/join/${row._id}`)}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box className="table-cell room-id" sx={{ width: '17%' }}>
                        <img
                          src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                          alt=""
                          className="game-type-icon"
                        />
                        <img
                          src={row.image}
                          alt=""
                          className="game-type-icon"
                        />
                        {row.name + ' (' + row.ticker + ')'}
                        {row.is_private && (
                          <img
                            src="/img/icon-lock.png"
                            alt=""
                            className="lock-icon"
                          />
                        )}
                      </Box>
                      <Box
                        className="table-cell bet-info"
                        sx={{ justifyContent: 'center', width: '17%' }}
                      >
                        <Chip
                          label={
                            <Typography variant="body2" component="span">
                              {convertToCurrency(row.user_bet, solPrice)}
                              <br className="mobile-only" />
                              <Box component="span" sx={{ fontSize: '10px' }}>
                                / {
                                  !row.endgame_type
                                    ? 'M'
                                    : convertToCurrency(row.endgame_amount, solPrice)}
                              </Box>
                            </Typography>
                          }
                          color="warning"
                          className="end-amount"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                        <Chip
                          label={`${100 - bondingProgress.toFixed(2)}%`}
                          color="error"
                          className="end-amount"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold', ml: 1 }}
                        />
                        {row.coHost && selectedFilter === 'open' && (
                          <Box
                            component="a"
                            className="ml-1"
                            sx={{
                              color: '#D32F2F',
                              cursor: 'pointer',
                              borderRadius: '30px',
                              display: 'inline-flex',
                              verticalAlign: 'middle',
                              mb: '4px',
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePayout(row);
                            }}
                          />
                        )}
                      </Box>
                      <Box
                        className="table-cell winnings"
                        sx={{ width: '17%' }}
                      >
                        <Chip
                          label={`${row.share?.toFixed(2)}%`}
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      <Box
                        className="table-cell likes-dislikes-battles"
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          gap: 2,
                          width: '17%',
                        }}
                      >
                        <Tooltip title="Likes">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                              {Array.isArray(row.likes) ? row.likes.length : 0}
                            </Typography>
                            <FontAwesomeIcon icon={faThumbsUp} />
                          </Box>
                        </Tooltip>
                        <Tooltip title="Dislikes">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                              {Array.isArray(row.dislikes) ? row.dislikes.length : 0}
                            </Typography>
                            <FontAwesomeIcon icon={faThumbsDown} />
                          </Box>
                        </Tooltip>
                        <Tooltip title="Battles">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#fff' }}>
                              {row.battles || 0}
                            </Typography>
                            <Battle width="20px" />
                          </Box>
                        </Tooltip>
                      </Box>
                      {row.game_type.short_name === 'Custom' && (
                        <Box
                          id='ai_mode'
                          className="table-cell winnings desktop-only">
                          <Tooltip title="UPGRADE GAME">
                            <Box
                              component="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleSettingsIconClick(e, row);
                              }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <AutoAwesomeIcon sx={{ p: '6px' }} />
                            </Box>
                          </Tooltip>
                        </Box>
                      )}
                      <Box className="table-cell action desktop-only">
                        {row.status === 'finished' ? (
                          <Button
                            className="btn_recreate"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Note: openRecreateModal is undefined; implement or remove
                              // openRecreateModal(row);
                            }}
                          >
                            RE-CREATE
                          </Button>
                        ) : (
                          <Box>
                            {isClosing ? (
                              <Typography variant="body2" sx={{ color: 'red' }}>
                                closing...
                              </Typography>
                            ) : (
                              <Box>
                                {!row.coHost ? (
                                  <></>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    disableElevation
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
                                    style={
                                      isHolding
                                        ? { filter: 'hue-rotate(-10deg)' }
                                        : {}
                                    }
                                  >
                                    {isHolding ? (
                                      <>
                                        <Box
                                          component="span"
                                          sx={{
                                            position: 'absolute',
                                            zIndex: 2,
                                          }}
                                        >
                                          {(timeLeft / 100).toFixed(1)}
                                          <Box
                                            component="span"
                                            sx={{
                                              pt: '5px',
                                              fontSize: 'xx-small',
                                            }}
                                          >
                                            s
                                          </Box>
                                        </Box>
                                        <Lottie options={pressHoldOptions} />
                                      </>
                                    ) : (
                                      <>RUG</>
                                    )}
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                    <Box
                      className="mobile-only"
                      sx={{
                        display: 'flex',
                        width: '15% !important',
                      }}
                    >
                      <Box
                        className="table-cell action"
                        sx={{
                          width: 'auto',
                          float: 'right',
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Tooltip title="CHANGE AI MODEL">
                          <Box
                            id="ai_mode"
                            component="a"
                            sx={{
                              borderRadius: '200px',
                              cursor: 'pointer',
                              p: '1px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}
                            onClick={(e) => handleSettingsIconClick(e, row)}
                          >
                            <AutoAwesomeIcon />
                          </Box>
                        </Tooltip>
                        {row.status === 'finished' ? (
                          <Button
                            className="btn_recreate"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Note: openRecreateModal is undefined; implement or remove
                              // openRecreateModal(row);
                            }}
                          >
                            RE-CREATE
                          </Button>
                        ) : (
                          <Box>
                            {isClosing ? (
                              <Typography variant="body2" sx={{ color: 'red' }}>
                                closing...
                              </Typography>
                            ) : (
                              <Box>
                                {!row.coHost ? (
                                  <></>
                                ) : (
                                  <Button
                                    variant="outlined"
                                    color="error"
                                    disableElevation
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
                                    style={
                                      isHolding
                                        ? { filter: 'hue-rotate(-10deg)' }
                                        : {}
                                    }
                                  >
                                    {isHolding ? (
                                      <>
                                        <Box
                                          component="span"
                                          sx={{
                                            position: 'absolute',
                                            zIndex: 2,
                                          }}
                                        >
                                          {(timeLeft / 100).toFixed(1)}
                                          <Box
                                            component="span"
                                            sx={{
                                              pt: '5px',
                                              fontSize: 'xx-small',
                                            }}
                                          >
                                            s
                                          </Box>
                                        </Box>
                                        <Lottie options={pressHoldOptions} />
                                      </>
                                    ) : (
                                      <>RUG</>
                                    )}
                                  </Button>
                                )}
                              </Box>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </>
          )}
        </Box>
      )}
      <Dialog open={isCoHostModalOpen} onClose={handleCloseCoHostModal}>
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
      <Dialog
        open={isPayoutModalOpen}
        onClose={handleClosePayoutModal}
        fullWidth
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faMoneyCheckAlt} className="mr-2" />
            HARD CAP
          </Box>
          <Button variant="text" color="error" onClick={handleClosePayoutModal}>
            ×
          </Button>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <span>CURRENT PAYOUT:</span>
                  </TableCell>
                  <TableCell sx={{ color: '#ff8500' }}>
                    {selectedRow && selectedRow.endgame_type
                      ? convertToCurrency(selectedRow.endgame_amount, solPrice)
                      : 'MANUAL'}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
          <RadioGroup
            aria-label="paymentMethod"
            name="paymentMethod"
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
          >
            <Typography variant="h6" align="center" sx={{ mb: 1 }}>
              Change Auto-Payout
            </Typography>
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="MANUAL"
            />
            <FormControlLabel
              value="automatic"
              control={<Radio />}
              label="AUTOMATIC"
            />
          </RadioGroup>
          <Box sx={{ mt: 2 }}>
            <TextField
              color="error"
              label="Amount"
              value={payoutAmount}
              type="number"
              onChange={handlePayoutAmountChange}
              variant="filled"
              autoComplete="off"
              fullWidth
              disabled={paymentMethod === 'manual'}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">RPS</InputAdornment>
                ),
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" color="error" onClick={handleSendPayout}>
            Update
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={handleClosePayoutModal}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default MyGamesTable;