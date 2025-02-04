import React, { useState, useEffect, useRef, useCallback } from 'react';
import { connect, useDispatch } from 'react-redux';
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
  Chip
} from '@mui/material';
import Joyride from 'react-joyride';
import Lottie from 'react-lottie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoneyCheckAlt } from '@fortawesome/free-solid-svg-icons';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import EditOutline from '@mui/icons-material/EditOutlined';
import { Info } from '@mui/icons-material';

import {
  getMyGames,
  unstake,
  createRoom,
  reCreateRoom,
  getStrategies,
  updateRoomStrategy,
  editPayout,
  setGameMode,
  addNewTransaction,
  getRoomList,
  endGame,
  coHost,
  updateUserPrompt
} from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { updateTutorialCompleted } from '../../redux/Auth/user.actions';
import { getRank } from '../../util/getRank';
import { convertToCurrency } from '../../util/conversion';
import { confirmModalCreate } from '../modal/ConfirmAlerts';
import { tutorialStepsCreate } from '../../util/tutorialStepsCreate';

import CoHostModal from '../modal/CoHostModal';
import SettingsRef from '../../components/SettingsRef';
import Battle from '../icons/Battle';
import pressHold from '../LottieAnimations/pressHold.json';
import animationData from '../LottieAnimations/add';
import history from '../../redux/history'; // or useNavigate

function MyGamesTable(props) {
  const {
    balance,
    user,
    myGames: propsMyGames,
    getMyGames,
    getStrategies,
    isDarkMode,
    isLowGraphics,
    solPrice,
    updateTutorialCompleted,
    // Redux dispatch actions:
    unstake,
    createRoom,
    endGame,
    addNewTransaction,
    getRoomList,
    coHost,
    editPayout,
    updateUserPrompt,
    updateRoomStrategy,
    reCreateRoom,
    loading
  } = props;

  // ---------- State ----------
  const [selectedGameType, setSelectedGameType] = useState('All');
  const [selectedFilter, setSelectedFilter] = useState('open');
  const [selectedSort, setSelectedSort] = useState('desc');

  const [myGames, setMyGames] = useState(propsMyGames || []);
  const [isLoading, setIsLoading] = useState(true);

  const [runTutorial, setRunTutorial] = useState(
    !(user?.completedTutorials?.includes(3))
  );
  const currentTutorial = 3;

  // Co-host
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

  // Press-and-Hold (RUG) logic
  const [pressState, setPressState] = useState({});
  const dispatch = useDispatch();

  // ---------- Effects ----------
  // On mount => fetch
  useEffect(() => {
    async function fetchInitialData() {
      await fetchData();
      document.addEventListener('mousedown', handleClickOutside);
    }
    fetchInitialData();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line
  }, []);

  // If filter/sort changes => re-fetch
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [selectedFilter, selectedSort]);

  // If myGames from props changes => set local + stop loading
  useEffect(() => {
    setMyGames(propsMyGames || []);
    setIsLoading(false);
  }, [propsMyGames]);

  // ---------- Data fetching ----------
  const fetchData = useCallback(() => {
    setMyGames(propsMyGames || []);
    getStrategies();

    setIsLoading(true);
    getMyGames(
      {
        game_type: selectedGameType,
        status: selectedFilter === 'open' ? 'open' : 'finished',
        sort: selectedSort
      },
      (updated) => {
        setMyGames(updated);
        setIsLoading(false);
      }
    );
  }, [getMyGames, getStrategies, propsMyGames, selectedGameType, selectedFilter, selectedSort]);

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
      const result = await coHost(coHostAmount, selectedRow._id);
      if (result.success) {
        addNewTransaction(result.newTransaction);
        await getRoomList({ game_type: 'All' });
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (e) {
      dispatch(errorMsgBar('ROOM TOO BUSY, TRY AGAIN LATER'));
    }
  }, [coHostAmount, balance, isDarkMode, coHost, selectedRow, addNewTransaction, getRoomList]);

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
      dispatch(errorMsgBar('R U FURR-REAL? HARD CAP AMOUNT MUST BE MORE THAN 0!'));
      return;
    }
    if (!selectedRow) return;

    try {
      setIsLoading(true);
      const result = await editPayout(payoutAmount, selectedRow._id);
      if (result.success) {
        await fetchData();
        dispatch(errorMsgBar(result.message));
        handleClosePayoutModal();
      } else {
        dispatch(errorMsgBar(result.message));
      }
    } catch (error) {
      dispatch(errorMsgBar('Failed to adjust hard cap.'));
    } finally {
      setIsLoading(false);
    }
  }, [payoutAmount, selectedRow, isDarkMode, editPayout, fetchData]);

  // ---------- RUG logic ----------
  const endRoom = useCallback(
    async (winnings, room_id) => {
      setPressState((prev) => ({
        ...prev,
        [room_id]: { ...prev[room_id], closing: true }
      }));
      try {
        await endGame(room_id);
        await addNewTransaction({ amount: winnings, room_id });
      } catch (error) {
        console.error('Error ending room:', error);
      } finally {
        setPressState((prev) => ({
          ...prev,
          [room_id]: { ...prev[room_id], closing: false }
        }));
      }
    },
    [endGame, addNewTransaction]
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
              timeLeft: 0
            }
          }));
        } else {
          setPressState((prev) => ({
            ...prev,
            [room_id]: {
              ...prev[room_id],
              holding: true,
              timeLeft: countdown,
              timer
            }
          }));
        }
      }, updateInterval);

      setPressState((prev) => ({
        ...prev,
        [room_id]: {
          ...prev[room_id],
          holding: true,
          timeLeft: startTime,
          timer
        }
      }));
    },
    [endRoom]
  );

  const handleButtonRelease = useCallback((room_id) => {
    setPressState((prev) => {
      const current = prev[room_id];
      if (current && current.timer) clearInterval(current.timer);
      return {
        ...prev,
        [room_id]: { ...current, holding: false }
      };
    });
  }, []);

  // ---------- CREATE/RE-CREATE ----------
  const openRecreateModal = useCallback(
    (row) => {
      dispatch(errorMsgBar(`YOU DO NOT OWN A GAME RESTORER. GO TO MARKETPLACE TO PURCHASE`));
    },
    [isDarkMode]
  );

  const onCreateRoom = useCallback(
    async (row) => {
      if (localStorage.getItem('hideConfirmModal') === 'true') {
        await createRoom({
          game_type: row.game_type,
          bet_amount: row.bet_amount,
          endgame_amount: row.endgame_amount
        });
      } else {
        confirmModalCreate(isDarkMode, 'CONFIRM GAME SETTINGS?', 'LFG', 'Cancel', async () => {
          await createRoom({
            game_type: row.game_type,
            bet_amount: row.bet_amount,
            endgame_amount: row.endgame_amount
          });
        });
      }
    },
    [createRoom, isDarkMode]
  );

  // ---------- TUTORIAL ----------
  const handleJoyrideCallback = useCallback(
    (data) => {
      const { status } = data;
      if (status === 'finished' || status === 'skipped') {
        updateTutorialCompleted(currentTutorial);
        setRunTutorial(false);
      }
    },
    [currentTutorial, updateTutorialCompleted]
  );

  // ---------- SETTINGS ----------
  const handleSettingsIconClick = (event, row) => {
    event.preventDefault();
    event.stopPropagation();
    if (row.coHost) {
      setSelectedRow(row);
      setSettingsPanelOpened(!settingsPanelOpened);
    } else {
      dispatch(errorMsgBar('YOU MUST OWN 100% TO CHANGE MODEL.'));
    }
  };

  const handleClickOutside = (e) => {
    if (settingsRef.current && !settingsRef.current.contains(e.target)) {
      setSettingsPanelOpened(false);
    }
  };

  // ---------- Lottie config ----------
  const defaultOptions = {
    loop: !isLowGraphics,
    autoplay: !isLowGraphics,
    animationData,
    rendererSettings: { preserveAspectRatio: 'xMidYMid slice' }
  };
  const pressHoldOptions = {
    loop: !isLowGraphics,
    autoplay: !isLowGraphics,
    animationData: pressHold
  };

  // ---------- Render ----------
  return (
    <Box className="my-open-games">
      {/* Filter/Tutorial Container */}
      <Box className="filter-container overflowX">
        <Joyride
          steps={tutorialStepsCreate}
          run={runTutorial}
          callback={handleJoyrideCallback}
          continuous
          showProgress
          showSkipButton
          styles={{
            options: {
              zIndex: 1500,
              backgroundColor: isDarkMode
                ? 'rgba(33, 33, 33, 0.95)'   // Dark gray background for dark mode
                : 'rgba(255, 255, 255, 0.95)', // White background for light mode
              primaryColor: isDarkMode ? '#ff0000' : '#6200ea', // Vibrant green for dark, deep purple for light
              arrowColor: isDarkMode
                ? 'rgba(33, 33, 33, 0.95)'
                : 'rgba(255, 255, 255, 0.95)',
              textColor: isDarkMode ? '#eeeeee' : '#212121', // Light text for dark mode, dark text for light mode
              width: 320,
              padding: 24,
              borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            buttonClose: {
              borderRadius: 4,
              color: isDarkMode ? '#eeeeee' : '#212121',
            },
            buttonBack: {
              borderRadius: 4,
              backgroundColor: isDarkMode
                ? 'rgba(255, 255, 255, 0.1)'
                : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? '#eeeeee' : '#212121',
              marginRight: 8,
            },
            buttonNext: {
              borderRadius: 4,
              backgroundColor: isDarkMode ? '#ff0000' : '#6200ea',
              color: '#fff',
            },
            buttonSkip: {
              borderRadius: 4,
              color: isDarkMode ? '#eeeeee' : '#212121',
            },
          }}
        />
        {selectedRow && (
          <SettingsRef
            ref={settingsRef}
            strategies={props.strategies}
            ai_mode={selectedRow.selectedStrategy}
            user_id={selectedRow._id}
            prompt={user.prompt}
            rank={getRank(user.totalWagered)}
            settings_panel_opened={settingsPanelOpened}
            setSelectedStrategy={setSelectedStrategy}
            selectedStrategy={selectedStrategy}
            updateUserStrategy={updateRoomStrategy}
            updateUserPrompt={updateUserPrompt}
          />
        )}
      </Box>

      {/* Loading Skeleton if either local isLoading or Redux's loading */}
      {(isLoading || loading) ? (
        <Box sx={{ p: 2 }}>
          {[...Array(5)].map((_, i) => (
            <Box
              key={i}
              sx={{
                display: 'flex',
                gap: 2,
                alignItems: 'center',
                mb: 1
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
          {/* No games => show message */}
          {(!myGames || myGames.length === 0) ? (
            <Box className="dont-have-game-msg" sx={{ textAlign: 'center', mt: 2 }}>
              <Lottie options={defaultOptions} width={50} />
              <Typography variant="body1" sx={{ mt: 1 }}>
                You Have No Games
              </Typography>
            </Box>
          ) : (
            <>
              {/* Table Header */}
              <Box
                className="table-header"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 2fr 1fr 2fr 2fr',
                  gap: '10px',
                  alignItems: 'center',
                  p: '10px 20px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}
              >
                <Box className="table-cell mobile-only" />
                <Box className="table-cell room-id">ROOM</Box>
                <Box className="table-cell" />
                <Box className="table-cell winnings">LIQUIDITY / SHARE</Box>
                <Box className="table-cell payout">HARD CAP</Box>
                <Box className="table-cell bet-info">
                  PROGRESS&nbsp;
                  <Tooltip title="TO REACH RAYDIUM">
                    <Info sx={{ width: 18, cursor: 'pointer' }} />
                  </Tooltip>
                </Box>
                <Box className="table-cell winnings">BATTLES</Box>
                {/* <Box className="table-cell action desktop-only">EDIT</Box> */}
              </Box>

              {/* Games Rows */}
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
                      mb: 1
                    }}
                    onClick={() => history.push(`/join/${row._id}`)}
                  >
                    <Box>
                      {/* Room ID */}
                      <Box className="table-cell room-id">
                        <img
                          src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                          // src={row.image}
                          alt=""
                          className="game-type-icon"
                        />
                        <img
                          // src={`/img/gametype/icons/${row.game_type.short_name}.svg`}
                          src={row.image}
                          alt=""
                          className="game-type-icon"
                        />
                        {/* {row.game_type.short_name + '-' + row.index} */}
                        {row.name + ' (' + row.ticker + ')'}
                        {row.is_private && (
                          <img src="/img/icon-lock.png" alt="" className="lock-icon" />
                        )}
                      </Box>
                      {/* LQY / SHARE */}
                      <Box className="table-cell bet-info">
                        <Chip
                          label={
                            <Typography variant="body2" component="span" >
                              {convertToCurrency(row.user_bet, solPrice)}
                              <br className="mobile-only" />
                              <Box component="span" sx={{ fontSize: '10px' }}>
                                &nbsp;/ {row.share?.toFixed(2)}%
                              </Box>
                            </Typography>
                          }
                          color="warning"
                          className="end-amount"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      {/* Hard Cap (endgame_amount) */}
                      <Box className="table-cell endgame">
                        <Chip
                          label={!row.endgame_type
                            ? 'M'
                            : convertToCurrency(row.endgame_amount, solPrice)}
                          color="error"
                          className="end-amount"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                        {row.coHost && selectedFilter === 'open' && (
                          <Box
                            component="a"
                            className="ml-1"
                            sx={{
                              color: '#ff0000',
                              cursor: 'pointer',
                              borderRadius: '30px',
                              display: 'inline-flex',
                              verticalAlign: 'middle',
                              mb: '4px'
                            }}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handlePayout(row);
                            }}
                          >
                            {/* <EditOutline sx={{ p: '2.5px', width: 22 }} /> */}
                          </Box>
                        )}
                      </Box>
                      {/* Net Profit Chip */}
                      <Box className="table-cell winnings">
                        <Chip
                          label={`${(bondingProgress).toFixed(2)}%`}
                          color="success"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 'bold' }}
                        />
                      </Box>
                      {/* Battles */}
                      <Box
                        className="table-cell bets"
                        sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}
                      >
                        <Battle width="24px" />
                        &nbsp;
                        <span>{row.battles}</span>
                      </Box>
                      {/* AI Model */}
                      <Box className="table-cell winnings desktop-only">
                        <Tooltip title="AI MODEL">
                          <Typography
                           id="ai_mode"
                           sx={{p: 4, fontSize: 1}}
                          >{row.selectedStrategy}
                            <AutoAwesomeIcon sx={{ p: "6px"}}/>
                          </Typography>
                        </Tooltip>
                      </Box>
                      {/* Action (Desktop) */}
                      <Box className="table-cell action desktop-only">
                        {row.status === 'finished' ? (
                          <Button
                            className="btn_recreate"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openRecreateModal(row);
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
                                  // <Button
                                  //   className="btn_withdraw btn_end"
                                  //   onClick={(e) => {
                                  //     e.preventDefault();
                                  //     e.stopPropagation();
                                  //     handleCoHost(row);
                                  //   }}
                                  // >
                                  //   TRADE
                                  // </Button>
<></>
                                ) : (
                                  <Button
                                    className="btn_end"
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
                                    style={isHolding ? { filter: 'hue-rotate(-10deg)' } : {}}
                                  >
                                    {isHolding ? (
                                      <>
                                        <Box
                                          component="span"
                                          sx={{ position: 'absolute', zIndex: 2 }}
                                        >
                                          {(timeLeft / 100).toFixed(1)}
                                          <Box
                                            component="span"
                                            sx={{ pt: '5px', fontSize: 'xx-small' }}
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

                    {/* Mobile-only Actions */}
                    <Box className="mobile-only" sx={{ display: 'table' }}>
                      <Box
                        className="table-cell action"
                        sx={{
                          width: 'auto',
                          float: 'right',
                          display: 'flex',
                          flexDirection: 'row',
                          justifyContent: 'space-between'
                        }}
                      >
                        <Tooltip title="CHANGE AI MODEL">
                          <Box
                            component="a"
                            sx={{
                              borderRadius: '200px',
                              cursor: 'pointer',
                              p: '1px',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center'
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
                              openRecreateModal(row);
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
                                  <Button
                                    className="btn_withdraw btn_end"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleCoHost(row);
                                    }}
                                  >
                                    TRADE
                                  </Button>
                                ) : (
                                  <Button
                                    className="btn_end"
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
                                    style={isHolding ? { filter: 'hue-rotate(-10deg)' } : {}}
                                  >
                                    {isHolding ? (
                                      <>
                                        <Box
                                          component="span"
                                          sx={{ position: 'absolute', zIndex: 2 }}
                                        >
                                          {(timeLeft / 100).toFixed(1)}
                                          <Box
                                            component="span"
                                            sx={{ pt: '5px', fontSize: 'xx-small' }}
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

      {/* Co-Host Dialog */}
      <Dialog open={isCoHostModalOpen} onClose={handleCloseCoHostModal}>
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

      {/* Payout Dialog */}
      <Dialog open={isPayoutModalOpen} onClose={handleClosePayoutModal} fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            <FormControlLabel value="manual" control={<Radio />} label="MANUAL" />
            <FormControlLabel value="automatic" control={<Radio />} label="AUTOMATIC" />
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
                endAdornment: <InputAdornment position="end">RPS</InputAdornment>
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="error" onClick={handleSendPayout}>
            Update
          </Button>
          <Button variant="contained" color="error" onClick={handleClosePayoutModal}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------- Redux Connection ----------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  isLowGraphics: state.auth.isLowGraphics,
  myGames: state.logic.myGames,
  pageNumber: state.logic.myGamesPageNumber,
  game_mode: state.logic.game_mode,
  balance: state.auth.balance,
  user: state.auth.user,
  strategies: state.logic.strategies,
  solPrice: state.logic.solPrice,
  loading: state.logic.isActiveLoadingOverlay,
});

const mapDispatchToProps = {
  unstake,
  createRoom,
  getMyGames,
  getStrategies,
  coHost,
  addNewTransaction,
  setGameMode,
  updateRoomStrategy,
  reCreateRoom,
  editPayout,
  updateUserPrompt,
  endGame,
  getRoomList,
  updateTutorialCompleted
};

export default connect(mapStateToProps, mapDispatchToProps)(MyGamesTable);