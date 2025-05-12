import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendSolDeposit } from '../../util/solana';
import { useSelector, useDispatch } from 'react-redux';
import {
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  isValid,
} from 'date-fns';
import {
  Box,
  Tooltip,
  Typography,
  Button,
  TextField,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  useMediaQuery,
  InputAdornment
} from '@mui/material';
import {
  ShowChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { ThemeProvider } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';
import { createChart } from 'lightweight-charts';
import Summary from '../CreateGame/Summary';
import { getCustomTheme } from '../../config/theme';
import {
  getTransactionCandles,
  jeetGame,
  someActionToAppendCandle,
  getMyGames
} from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import { errorMsgBar } from '../../redux/Notification/notification.actions';

function CoHostModal({
  isDarkMode,
  coHostAmount,
  selectedRow,
  balance,
  user,
  hosts,
  handleClose,
  handleSendCoHost,
  has_joined,
  solPrice,
  input_only,
  handleCoHostAmountChange,
  account
}) {
  const dispatch = useDispatch();
  const socket = useSelector((state) => state.auth.socket);
  const trade_loading = useSelector((state) => state.logic.trade_loading);

  const storeCandles = useSelector((state) => state.logic.candles);
  const transactions = useSelector((state) => state.logic.transactions);

  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedTab, setSelectedTab] = useState('PUMP');
  const [localCoHostAmount, setLocalCoHostAmount] = useState(0.01);

  // For the chart
  const [localChartData, setLocalChartData] = useState([]);
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isSmallScreen = useMediaQuery('(max-width:1024px)');

  // ------------------ WATCH storeCandles from Redux ------------------
  useEffect(() => {
    if (storeCandles?.length) {
      const sorted = sortAndDeduplicate(storeCandles);
      setLocalChartData(sorted);
    }
  }, [storeCandles]);

  // Helper: sort & deduplicate
  const sortAndDeduplicate = (candles) => {
    const sorted = [...candles].sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
    const deduped = [];
    let prevTimeSec = null;
    for (let i = 0; i < sorted.length; i++) {
      const cur = sorted[i];
      const curTimeSec = Math.floor(new Date(cur.startTime).getTime() / 1000);
      if (prevTimeSec === null || curTimeSec > prevTimeSec) {
        deduped.push(cur);
        prevTimeSec = curTimeSec;
      } else {
        console.warn('Skipping duplicate/out-of-order candle at', cur.startTime);
      }
    }
    return deduped;
  };

  // ------------------ CREATE CHART ONCE ------------------
  useEffect(() => {
    if (chartContainerRef.current && !chartInstanceRef.current) {
      // Dynamically set width to container's clientWidth
      const container = chartContainerRef.current;

      chartInstanceRef.current = createChart(container, {
        width: container.clientWidth,
        height: 350,
        layout: {
          background: { type: 'solid', color: 'rgba(0, 0, 0, 0.2)' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.3)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.3)' },
        },
        timeScale: { timeVisible: true, secondsVisible: true },
      });

      candlestickSeriesRef.current = chartInstanceRef.current.addCandlestickSeries({
        upColor: '#00b140',
        downColor: '#ff4b4b',
        borderDownColor: '#ff4b4b',
        borderUpColor: '#00b140',
        wickDownColor: '#ff4b4b',
        wickUpColor: '#00b140',
      });
    }
  }, [isDarkMode]);

  // ------------------ APPLY localChartData TO CHART ------------------
  useEffect(() => {
    if (!candlestickSeriesRef.current) return;
    const sorted = sortAndDeduplicate(localChartData);
    const chartData = sorted.map((c) => ({
      time: Math.floor(new Date(c.startTime).getTime() / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));
    candlestickSeriesRef.current.setData(chartData);
  }, [localChartData]);

  // ------------------ SOCKET FOR REAL-TIME CANDLE? (Optional) ------------------

  useEffect(() => {
    if (!selectedRow?._id || !socket) return;
    const candleEvent = `NEW_CANDLE_${selectedRow._id}`;
    const handleNewCandle = (data) => {
      // console.log("NEW CANDLE——————data", data)
      dispatch(someActionToAppendCandle(data.newCandle));
    };
    socket.on(candleEvent, handleNewCandle);
    return () => {
      socket.off(candleEvent, handleNewCandle);
    };
  }, [selectedRow?._id, socket]);

  // ------------------ REMAINING LOGIC (Pump/Jeet, Table, etc.) ------------------
  const calculatePercentageChange = (current, original) => {
    if (!original) return 'N/A';
    return (((current - original) / original) * 100).toFixed(2);
  };
  const liquidityPercentageChange = calculatePercentageChange(
    selectedRow.winnings ? selectedRow.winnings : parseFloat(selectedRow.user_bet),
    selectedRow.bet_amount
  );

  function simulatePump({
    currentLiquidity,
    hosts,
    userId,
    deposit,
    commissionPct = 1,   // e.g. 2.5 = 2.5%
    bonusFraction = 0.12,  // 12% bonus to old holders
  }) {
    // 1) Commission & net deposit
    const fee = (deposit * commissionPct) / 100;
    const netDeposit = deposit - fee;

    // 2) “Total share supply” is often set to currentLiquidity by your back-end
    let totalShareSupply = currentLiquidity;

    // 3) Convert each host’s percentage into absolute shares
    const oldHosts = hosts.map((h) => {
      const oldAbsoluteShares = (h.share / 100) * totalShareSupply;
      return {
        ...h,
        oldAbsoluteShares,
        newAbsoluteShares: 0,
      };
    });

    // 4) Minted shares = netDeposit
    const mintedShares = netDeposit;

    // 5) Bonus portion for old holders
    const bonusForOld = mintedShares * bonusFraction;
    const buyerShares = mintedShares - bonusForOld;

    // 6) Distribute bonus among old holders proportionally
    const totalOldAbs = oldHosts.reduce((sum, x) => sum + x.oldAbsoluteShares, 0) || 1;
    oldHosts.forEach((h) => {
      const fraction = h.oldAbsoluteShares / totalOldAbs;
      h.newAbsoluteShares = h.oldAbsoluteShares + bonusForOld * fraction;
    });

    // 7) Add the buyer’s new shares
    const buyerIndex = oldHosts.findIndex((h) => h.host === userId);
    if (buyerIndex === -1) {
      // Buyer is new
      oldHosts.push({
        host: userId,
        share: 0,
        oldAbsoluteShares: 0,
        newAbsoluteShares: buyerShares,
      });
    } else {
      oldHosts[buyerIndex].newAbsoluteShares += buyerShares;
    }

    // 8) New total share supply = old + minted
    const newTotalShareSupply = totalShareSupply + mintedShares;

    // 9) Recompute share %
    oldHosts.forEach((h) => {
      h.share =
        newTotalShareSupply > 0
          ? (h.newAbsoluteShares / newTotalShareSupply) * 100
          : 0;
    });

    // 10) Normalize so sum of shares is 100
    const sumPct = oldHosts.reduce((acc, x) => acc + x.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => {
        h.share *= factor;
      });
    }

    // 11) The user’s final share in absolute + percent
    const newLiquidity = currentLiquidity + netDeposit;
    const updatedHosts = oldHosts;
    const userHost = updatedHosts.find((h) => h.host === userId);
    const userFinalSharePct = userHost ? userHost.share : 0;
    const userFinalAbsolute = (userFinalSharePct / 100) * newLiquidity;

    return {
      updatedHosts,
      newTotalShareSupply,
      newLiquidity,
      userFinalSharePct,
      userFinalAbsolute,
    };
  }

  function simulateJeet({
    currentLiquidity,
    hosts,
    userId,
    sharesToSell,
    commissionPct = 1, // e.g. 2.5 = 2.5%
    shockRatio = 0.10,   // 10% shock to other hosts
  }) {
    // 1) "Total share supply" equals currentLiquidity or a dedicated field if you store it separately
    let totalShareSupply = currentLiquidity;

    // 2) Convert each host’s % into absolute shares
    const oldHosts = hosts.map((h) => {
      const absShares = (h.share / 100) * totalShareSupply;
      return {
        ...h,
        absShares,
        newAbsShares: absShares,
      };
    });

    // 3) Find the seller
    const sellerIndex = oldHosts.findIndex((h) => h.host === userId);
    if (sellerIndex === -1) {
      return {
        error: `You are not a host; cannot sell shares.`,
      };
    }

    // 4) Check if user has enough shares
    const seller = oldHosts[sellerIndex];
    if (sharesToSell > seller.absShares + 1e-9) {
      return {
        error: `Cannot sell ${sharesToSell.toFixed(2)} shares; you only have ${seller.absShares.toFixed(
          2
        )} shares.`,
      };
    }

    // 5) Convert shares to currency
    //    1 share => (currentLiquidity / totalShareSupply) currency
    const valueBeforeFee = sharesToSell * (currentLiquidity / totalShareSupply);

    // 6) Commission
    const fee = (valueBeforeFee * commissionPct) / 100;
    const amountAfterFee = valueBeforeFee - fee;

    // 7) Update the seller’s absolute shares
    seller.newAbsShares = seller.absShares - sharesToSell;

    // 8) Apply shock ratio to other hosts
    oldHosts.forEach((h, idx) => {
      if (idx !== sellerIndex) {
        h.newAbsShares = h.newAbsShares * (1 - shockRatio);
        if (h.newAbsShares < 1e-9) h.newAbsShares = 0;
      }
    });

    // 9) New total share supply
    let newTotalShareSupply = oldHosts.reduce((acc, h) => acc + h.newAbsShares, 0);

    // 10) New liquidity => minus the amount the user withdrew
    const newLiquidity = currentLiquidity - amountAfterFee;

    // 11) Recompute share percentages
    oldHosts.forEach((h) => {
      h.share =
        newTotalShareSupply > 0
          ? (h.newAbsShares / newTotalShareSupply) * 100
          : 0;
    });

    // 12) Normalize to 100
    const sumPct = oldHosts.reduce((acc, x) => acc + x.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => {
        h.share *= factor;
      });
    }

    // 13) Final user data
    const userFinalSharePct = oldHosts[sellerIndex].share;
    const userFinalAbsolute = (userFinalSharePct / 100) * newLiquidity;

    return {
      updatedHosts: oldHosts,
      newTotalShareSupply,
      newLiquidity,
      userFinalSharePct,
      userFinalAbsolute,
      valueBeforeFee,
      amountAfterFee,
      error: null,
    };
  }

  const totalShare = Array.isArray(hosts)
    ? hosts.reduce((acc, host) => acc + host.share, 0)
    : 0;

  const formatRelativeTime = (date) => {
    const now = new Date();
    const created = new Date(date);

    if (!isValid(created)) return 'Invalid Date';

    const diffSeconds = differenceInSeconds(now, created);
    const days = Math.floor(diffSeconds / (24 * 60 * 60));
    const hours = Math.floor((diffSeconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((diffSeconds % (60 * 60)) / 60);
    const seconds = diffSeconds % 60;

    if (days >= 1) {
      return days > 1 ? `${days}d ${hours}h ago` : `${days}d ${hours > 0 ? hours + 'h' : ''} ago`;
    }
    if (hours >= 1) {
      return hours > 1
        ? `${hours}h ${minutes}m ago`
        : `${hours}h ${minutes > 0 ? minutes + 'm' : ''} ago`;
    }
    if (minutes >= 1) {
      return minutes > 1 ? `${minutes}m ago` : `${minutes}m ${seconds}s ago`;
    }
    return `${seconds}s ago`;
  };

  const debouncedHandleChange = useCallback(
    debounce((value) => {
      handleCoHostAmountChange({ target: { value } });
    }, 300),
    []
  );
  const handleInputChange = (event) => {
    const value = event.target.value;
    setLocalCoHostAmount(value);
    debouncedHandleChange(value);
  };

  const debouncedHandleButtonClick = useCallback(
    debounce((value) => {
      handleCoHostAmountChange({ target: { value } });
    }, 300),
    []
  );
  const handleButtonClick = (value) => {
    setLocalCoHostAmount(value);
    debouncedHandleButtonClick(value);
  };

  const handleSendCoHostWithDeposit = useCallback(
    async () => {
      if (isProcessing || trade_loading) {
        dispatch(errorMsgBar('Trade is already in progress.'));
        return;
      }

      const amount = parseFloat(coHostAmount);
      if (isNaN(amount) || amount <= 0) {
        dispatch(errorMsgBar('Invalid amount to invest.'));
        return;
      }

      setIsProcessing(true);

      try {
        // Call sendSolDeposit for non-Custom games
        const depositResult = await sendSolDeposit(
          dispatch,
          amount,
          selectedRow._id,
          selectedRow.name,
          'pump',
          account,
          balance,
          () => { }, // Success callback (empty for now)
          () => {
            setIsProcessing(false);
          } // Failure callback
        );

        if (!depositResult.success) {
          setIsProcessing(false);
          return;
        }

        // Proceed with original handleSendCoHost
        await handleSendCoHost();
      } catch (error) {
        console.error('Error in handleSendCoHostWithDeposit:', error);
        dispatch(errorMsgBar('Error processing trade.'));
      } finally {
        setIsProcessing(false);
      }
    },
    [
      dispatch,
      coHostAmount,
      selectedRow.game_type,
      selectedRow._id,
      selectedRow.name,
      account,
      balance,
      handleSendCoHost,
      isProcessing,
      trade_loading,
    ]
  );

  // Handle JEET OUT (no sendSolDeposit)
  const handleUnstake = useCallback(
    async (winnings, room_id, stakeAmount) => {
      if (isProcessing || trade_loading) {
        dispatch(errorMsgBar('Trade is already in progress.'));
        return;
      }

      setIsProcessing(true);

      try {
        // Validate inputs
        const parsedStake = parseFloat(stakeAmount);
        if (isNaN(parsedStake) || parsedStake <= 0) {
          dispatch(errorMsgBar('Invalid amount to withdraw.'));
          return;
        }

        const parsedWinnings = parseFloat(winnings);
        if (isNaN(parsedWinnings)) {
          dispatch(errorMsgBar('Invalid winnings value.'));
          return;
        }

        const parsedBalance = parseFloat(balance);
        if (parsedStake >= parsedWinnings) {
          dispatch(errorMsgBar('Not enough equity to withdraw.'));
          return;
        }

        // Dispatch jeetGame
        await dispatch(jeetGame(room_id, parsedStake));
        await dispatch(getMyGames({ game_type: 'All', status: 'open', sort: 'desc' }));
      } catch (error) {
        console.error('Error unstaking from room:', error);
        dispatch(errorMsgBar('Error processing withdrawal.'));
      } finally {
        setIsProcessing(false);
      }
    },
    [dispatch, balance, isProcessing, trade_loading]
  );

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  const handleOpenPlayerModal = (creator_id) => {
    setSelectedCreator(creator_id);
    setShowPlayerModal(true);
  };
  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // ------------------ Render ------------------
  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          background: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '0 0 16px 16px',
          '@supports not (backdrop-filter: blur(10px))': {
            background: 'rgba(0, 0, 0, 0.4)',
          },
        }}
      >
        {/* Header */}
        {!input_only && !has_joined && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <ShowChartOutlined sx={{ mr: 1 }} />
              TRADE
            </Typography>
            <Button variant="text" color="error" onClick={handleClose}>
              ×
            </Button>
          </Box>
        )}

        {/* Player Modal */}
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {/* Info Box */}
        {!input_only && !has_joined && (
          <Box sx={{ p: 2, }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 3,
                '@media (max-width: 100%)': {
                  gridTemplateColumns: 'repeat(2, 1fr)'
                }
              }}
            >
              {/* LIQUIDITY */}
              <Box sx={{ textAlign: 'center' }}>
                <Tooltip title={`Change: ${liquidityPercentageChange}%`} arrow>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      LIQUIDITY
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          color:
                            liquidityPercentageChange > 0
                              ? '#fff'
                              : liquidityPercentageChange < 0
                                ? '#FF0000'
                                : 'text.primary'
                        }}
                      >
                        {!selectedRow.winnings
                          ? convertToCurrency(selectedRow.user_bet, solPrice)
                          : convertToCurrency(selectedRow.winnings, solPrice)}
                        {liquidityPercentageChange > 0 && (
                          <TrendingUpOutlined sx={{ ml: 1, color: 'green' }} />
                        )}
                        {liquidityPercentageChange < 0 && (
                          <TrendingDownOutlined sx={{ ml: 1, color: '#FF0000' }} />
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Box>

              {/* HOLDERS */}
              <Box sx={{ textAlign: 'center' }}>
                <Tooltip
                  arrow
                  title={
                    <Box>
                      {Array.isArray(hosts) &&
                        hosts.map((host, i) => {
                          const pct =
                            totalShare > 0 ? ((host.share / totalShare) * 100).toFixed(2) : 0;
                          return (
                            <Typography key={i} variant="body2">
                              {i === 0 ? 'Dev' : `Co-Host ${i + 1}`}: {pct}%
                            </Typography>
                          );
                        })}
                    </Box>
                  }
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                      HOLDERS
                    </Typography>
                    <Typography variant="h6">
                      {Array.isArray(hosts) ? hosts.length : 0}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>

              {/* BATTLES */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  BATTLES
                </Typography>
                <Typography variant="h6">
                  {selectedRow.battles
                    ? selectedRow.battles
                    : selectedRow.game_log_list?.length || 0}
                </Typography>
              </Box>

              {/* CREATED BY */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  CREATED BY
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                  <a className="player" onClick={() => handleOpenPlayerModal(selectedRow.creator_id)}>
                    <Avatar
                      className="avatar desktop-only"
                      src={selectedRow.creator_avatar}
                      user_id={selectedRow.creator_id}
                      username={selectedRow.username}
                      rank={selectedRow.rank}
                      accessory={selectedRow.accessory}
                      elite={selectedRow.elite}
                      alt="Player Avatar"
                      sx={{ width: 40, height: 40, margin: '0 auto' }}
                    />
                  </a>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* PUMP / JEET inputs */}
        {((!input_only && !has_joined) || input_only || isSmallScreen) && (
          <Box
            sx={{
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              position: 'relative'
            }}
          >
            <Summary shortVersion={!has_joined ? false : true} />

            {/* Trade type selection with improved visuals */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                onClick={() => setSelectedTab('PUMP')}
                variant={selectedTab === 'PUMP' ? 'contained' : 'outlined'}
                color={selectedTab === 'PUMP' ? 'success' : 'inherit'}
                sx={{
                  flexGrow: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  height: 48,
                  borderColor: selectedTab !== 'PUMP' ? '#4caf50' : '',
                  color: selectedTab !== 'PUMP' ? '#4caf50' : '',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                PUMP
                <TrendingUpOutlined
                  sx={{
                    ml: 1,
                    color: selectedTab === 'PUMP' ? '#fff' : '#4caf50'
                  }}
                />
              </Button>
              <Button
                onClick={() => setSelectedTab('JEET')}
                variant={selectedTab === 'JEET' ? 'contained' : 'outlined'}
                color="error"
                sx={{
                  flexGrow: 1,
                  textTransform: 'none',
                  borderRadius: 2,
                  height: 48,
                  borderColor: selectedTab !== 'JEET' ? '#FF0000' : '',
                  color: selectedTab !== 'JEET' ? '#FF0000' : '',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                JEET
                <TrendingDownOutlined sx={{ ml: 1, color: selectedTab === 'JEET' ? '#fff' : '#FF0000' }} />
              </Button>
            </Box>

            {/* Amount selection area with improved visuals */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {selectedTab === 'PUMP' ? 'Amount to invest' : 'Amount to withdraw'}
              </Typography>

              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[0.01, 0.1, 1].map((amt) => (
                  <Button
                    key={amt}
                    variant="outlined"
                    color={selectedTab === 'PUMP' ? 'success' : 'error'}
                    onClick={() => handleButtonClick(amt)}
                    sx={{
                      flex: 1,
                      height: 40,
                      borderRadius: 1.5,
                      fontWeight: 'bold'
                    }}
                  >
                    {amt}
                  </Button>
                ))}
              </Box>

              <TextField
                color={selectedTab === 'PUMP' ? 'success' : 'error'}
                value={localCoHostAmount}
                onChange={handleInputChange}
                variant="outlined"
                type="number"
                fullWidth
                placeholder="Enter amount"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box component="span" sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>SOL</Box>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 1.5, height: 56 }
                }}
              />

              {/* Action button with loading state */}
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  color={selectedTab === 'PUMP' ? 'success' : 'error'}
                  onClick={() => {
                    if (isProcessing || trade_loading) {
                      dispatch(errorMsgBar("Trade is already in progress."));
                      return;
                    }
                    if (selectedTab === 'PUMP') {
                      handleSendCoHostWithDeposit();
                    } else {
                      handleUnstake(
                        selectedRow?.winnings ?? parseFloat(selectedRow?.user_bet || 0),
                        selectedRow?._id,
                        coHostAmount
                      );
                    }
                  }}
                  disabled={isProcessing || trade_loading}
                  fullWidth
                  sx={{
                    height: 48,
                    borderRadius: 2,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    boxShadow: 3
                  }}
                >
                  {isProcessing || trade_loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    selectedTab === 'PUMP' ? "PUMP IT" : "JEET OUT"
                  )}
                </Button>
              </Box>
            </Box>

            {/* Trade information table with improved visuals */}
            <Paper elevation={0} sx={{ backgroundColor: 'rgba(0, 0, 0, 0.15)', borderRadius: 0, mt: 1, overflow: 'hidden' }}>
              <Table>
                <TableBody>
                  {!input_only && (
                    <>
                      <TableRow>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'text.secondary' }}>
                          YOUR BALANCE:
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {convertToCurrency(balance, solPrice)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'text.secondary' }}>
                          CURRENT BANKROLL:
                        </TableCell>
                        <TableCell align="right" sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#ff8500' }}>
                          {selectedRow
                            ? convertToCurrency(parseFloat(selectedRow.user_bet || 0), solPrice)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  {/* BEFORE */}
                  <TableRow>
                    <TableCell sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: 'text.secondary' }}>
                      CURRENT POSITION:
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ borderBottom: 'none', whiteSpace: 'pre-wrap' }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color="warning"
                      >
                        {(() => {
                          if (!Array.isArray(hosts) || !selectedRow) {
                            return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                          }

                          // Check if current user is a host
                          const existingHost = hosts.find((h) => h.host === user?._id);
                          if (!existingHost) {
                            return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                          }

                          // Show % and absolute stake
                          const currentBankroll = parseFloat(selectedRow.user_bet) || 0;
                          const pct = existingHost.share.toFixed(2);
                          const absStake = (existingHost.share / 100) * currentBankroll;

                          return `${pct}% / ${absStake.toFixed(6)} SOL (${convertToCurrency(absStake, solPrice)})`;
                        })()}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  {/* AFTER - with visual distinction */}
                  <TableRow sx={{ backgroundColor: 'rgba(114, 114, 114, 0.1)' }}>
                    <TableCell sx={{ color: 'text.secondary' }}>
                      PROJECTED POSITION:
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: '#ff8500', whiteSpace: 'pre-line', fontWeight: 700, fontSize: '0.875rem' }}
                    >
                      {(() => {
                        // Guard checks
                        if (!selectedRow || !Array.isArray(hosts)) {
                          return (
                            <>
                              0% / 0.000000 SOL (<span style={{ color: 'grey' }}>{convertToCurrency(0, solPrice)}</span>)
                            </>
                          );
                        }

                        const currentBankroll = parseFloat(selectedRow.user_bet || 0);
                        if (!currentBankroll) {
                          return (
                            <>
                              0% / 0.000000 SOL (<span style={{ color: 'grey' }}>{convertToCurrency(0, solPrice)}</span>)
                            </>
                          );
                        }

                        // Convert user input to a float
                        const inputValue = parseFloat(coHostAmount || '0');
                        if (inputValue <= 0) {
                          return (
                            <>
                              0% / 0.000000 SOL (<span style={{ color: 'grey' }}>{convertToCurrency(0, solPrice)}</span>)
                            </>
                          );
                        }

                        // Decide which "simulate" to run
                        if (selectedTab === 'PUMP') {
                          // Simulate Pump
                          const { userFinalSharePct, userFinalAbsolute } = simulatePump({
                            currentLiquidity: currentBankroll,
                            hosts,
                            userId: user?._id,
                            deposit: inputValue,
                            commissionPct: 2.5,
                            bonusFraction: 0.12,
                          });

                          const finalPctStr = `${userFinalSharePct.toFixed(2)}%`;
                          const displayCurrency = convertToCurrency(userFinalAbsolute, solPrice);
                          const displaySol = userFinalAbsolute.toFixed(6);
                          return (
                            <>
                              ~{finalPctStr} <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '400', fontSize: '0.75rem' }}> / {displaySol} SOL ({displayCurrency})</span>
                            </>
                          );
                        } else {
                          // Simulate Jeet
                          const sharesToSell = inputValue;

                          const { userFinalSharePct, userFinalAbsolute, error } = simulateJeet({
                            currentLiquidity: currentBankroll,
                            hosts,
                            userId: user?._id,
                            sharesToSell,
                            commissionPct: 2.5,
                            shockRatio: 0.10,
                          });

                          if (error) {
                            return error;
                          }

                          const finalPctStr = `${userFinalSharePct.toFixed(2)}%`;
                          const displayCurrency = convertToCurrency(userFinalAbsolute, solPrice);
                          const displaySol = userFinalAbsolute.toFixed(6);
                          return (
                            <>
                              ~{finalPctStr} <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '400', fontSize: '0.75rem' }}>/ {displaySol} SOL ({displayCurrency})</span>
                            </>
                          );
                        }
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Paper>

            {/* Fee information */}
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
              {selectedTab === 'PUMP' ? 'Trading fee: 5%' : 'Trading fee: 5%'}
            </Typography>
          </Box>
        )}

        {/* Chart Container */}
        {!input_only && (
          <Box sx={{ borderRadius: '16px', overflow: 'hidden', width: '100%' }}>
            <div
              ref={chartContainerRef}
              style={{
                width: '100%',
                height: 'auto',
              }}
            />
          </Box>
        )}

        {/* Transactions Table */}
        {!has_joined && !input_only && (
          <Box sx={{ background: '#080808', p: 2, borderRadius: 1 }}>
            <TableContainer component={Paper} sx={{ maxHeight: 300, mt: 1 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Amount</TableCell>
                    <TableCell align="right">Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((tx, i) => {
                      let desc = tx.description?.toLowerCase() || '';
                      let label = null;
                      if (desc.includes('joined')) label = 'Bet';
                      else if (desc.includes('created')) label = 'Created';
                      else if (desc.includes('pumped')) label = 'Pumped';
                      else if (desc.includes('jeeted')) label = 'Jeeted';
                      if (!label) return null;

                      return (
                        <TableRow key={i}>
                          <TableCell>{label}</TableCell>
                          <TableCell align="center">
                            {convertToCurrency(tx.amount, solPrice)}
                          </TableCell>
                          <TableCell align="right">
                            {formatRelativeTime(tx.created_at)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        No transactions available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

      </Box>
    </ThemeProvider>
  );
}

export default CoHostModal;