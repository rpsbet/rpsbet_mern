import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendSolDeposit } from '../../util/solana';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableRow,
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
import { getCustomTheme } from '../../config/theme';
import {
  jeetGame,
  someActionToAppendCandle,
  getMyGames
} from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';
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
}) {
  const dispatch = useDispatch();
  const socket = useSelector((state) => state.auth.socket);
  const trade_loading = useSelector((state) => state.logic.trade_loading);

  const storeCandles = useSelector((state) => state.logic.candles);
  const account = useSelector(state => state.auth.account);
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
        height: 300,
        layout: {
          background: { type: 'solid', color: 'rgba(0, 0, 0, 0.1)' },
          textColor: '#ffffff',
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.2)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.2)' },
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

  function simulatePump({
    currentLiquidity,
    hosts,
    userId,
    deposit,
    commissionPct = 1,
    bonusFraction = 0.12,
  }) {
    const fee = (deposit * commissionPct) / 100;
    const netDeposit = deposit - fee;
    let totalShareSupply = currentLiquidity;

    const oldHosts = hosts.map((h) => {
      const oldAbsoluteShares = (h.share / 100) * totalShareSupply;
      return {
        ...h,
        oldAbsoluteShares,
        newAbsoluteShares: 0,
      };
    });

    const mintedShares = netDeposit;
    const bonusForOld = mintedShares * bonusFraction;
    const buyerShares = mintedShares - bonusForOld;

    const totalOldAbs = oldHosts.reduce((sum, x) => sum + x.oldAbsoluteShares, 0) || 1;
    oldHosts.forEach((h) => {
      const fraction = h.oldAbsoluteShares / totalOldAbs;
      h.newAbsoluteShares = h.oldAbsoluteShares + bonusForOld * fraction;
    });

    const buyerIndex = oldHosts.findIndex((h) => h.host === userId);
    if (buyerIndex === -1) {
      oldHosts.push({
        host: userId,
        share: 0,
        oldAbsoluteShares: 0,
        newAbsoluteShares: buyerShares,
      });
    } else {
      oldHosts[buyerIndex].newAbsoluteShares += buyerShares;
    }

    const newTotalShareSupply = totalShareSupply + mintedShares;

    oldHosts.forEach((h) => {
      h.share =
        newTotalShareSupply > 0
          ? (h.newAbsoluteShares / newTotalShareSupply) * 100
          : 0;
    });

    const sumPct = oldHosts.reduce((acc, x) => acc + x.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => {
        h.share *= factor;
      });
    }

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
    commissionPct = 1,
    shockRatio = 0.10,
  }) {
    let totalShareSupply = currentLiquidity;

    const oldHosts = hosts.map((h) => {
      const absShares = (h.share / 100) * totalShareSupply;
      return {
        ...h,
        absShares,
        newAbsShares: absShares,
      };
    });

    const sellerIndex = oldHosts.findIndex((h) => h.host === userId);
    if (sellerIndex === -1) {
      return {
        error: `You are not a host; cannot sell shares.`,
      };
    }

    const seller = oldHosts[sellerIndex];
    if (sharesToSell > seller.absShares + 1e-9) {
      return {
        error: `Cannot sell ${sharesToSell.toFixed(2)} shares; you only have ${seller.absShares.toFixed(
          2
        )} shares.`,
      };
    }

    const valueBeforeFee = sharesToSell * (currentLiquidity / totalShareSupply);
    const fee = (valueBeforeFee * commissionPct) / 100;
    const amountAfterFee = valueBeforeFee - fee;

    seller.newAbsShares = seller.absShares - sharesToSell;

    oldHosts.forEach((h, idx) => {
      if (idx !== sellerIndex) {
        h.newAbsShares = h.newAbsShares * (1 - shockRatio);
        if (h.newAbsShares < 1e-9) h.newAbsShares = 0;
      }
    });

    let newTotalShareSupply = oldHosts.reduce((acc, h) => acc + h.newAbsShares, 0);
    const newLiquidity = currentLiquidity - amountAfterFee;

    oldHosts.forEach((h) => {
      h.share =
        newTotalShareSupply > 0
          ? (h.newAbsShares / newTotalShareSupply) * 100
          : 0;
    });

    const sumPct = oldHosts.reduce((acc, x) => acc + x.share, 0);
    if (sumPct > 0) {
      const factor = 100 / sumPct;
      oldHosts.forEach((h) => {
        h.share *= factor;
      });
    }

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
        const depositResult = await sendSolDeposit(
          dispatch,
          amount,
          selectedRow._id,
          selectedRow.name,
          'pump',
          account,
          balance,
          () => { },
          () => {
            setIsProcessing(false);
          }
        );

        if (!depositResult.success) {
          setIsProcessing(false);
          return;
        }

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

  const handleUnstake = useCallback(
    async (winnings, room_id, stakeAmount) => {
      if (isProcessing || trade_loading) {
        dispatch(errorMsgBar('Trade is already in progress.'));
        return;
      }

      setIsProcessing(true);

      try {
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

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          width: '100%',
          borderRadius: '8px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
        }}
      >
        {/* Trading Interface */}
        {((!input_only && !has_joined) || input_only || isSmallScreen) && (
          <Box
            sx={{
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Trade Type Selection */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                onClick={() => setSelectedTab('PUMP')}
                variant={selectedTab === 'PUMP' ? 'contained' : 'outlined'}
                color="success"
                size="small"
                sx={{
                  flex: 1,
                  height: 36,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: selectedTab === 'PUMP' ? '#4caf50' : 'transparent',
                  borderColor: '#4caf50',
                  color: selectedTab === 'PUMP' ? '#ffffff' : '#4caf50',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: selectedTab === 'PUMP' ? '#45a049' : 'rgba(76, 175, 80, 0.1)',
                  },
                }}
              >
                <TrendingUpOutlined sx={{ mr: 0.5, fontSize: 16 }} />
                Pump
              </Button>
              <Button
                onClick={() => setSelectedTab('JEET')}
                variant={selectedTab === 'JEET' ? 'contained' : 'outlined'}
                color="error"
                size="small"
                sx={{
                  flex: 1,
                  height: 36,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: selectedTab === 'JEET' ? '#f44336' : 'transparent',
                  borderColor: '#f44336',
                  color: selectedTab === 'JEET' ? '#ffffff' : '#f44336',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: selectedTab === 'JEET' ? '#e53935' : 'rgba(244, 67, 54, 0.1)',
                  },
                }}
              >
                <TrendingDownOutlined sx={{ mr: 0.5, fontSize: 16 }} />
                Jeet
              </Button>
            </Box>

            {/* Amount Input Section */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  mb: 1,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                }}
              >
                {selectedTab === 'PUMP' ? 'Amount to invest' : 'Amount to withdraw'}
              </Typography>

              {/* Quick Amount Buttons */}
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                {[0.01, 0.1, 1].map((amt) => (
                  <Button
                    key={amt}
                    variant="outlined"
                    onClick={() => handleButtonClick(amt)}
                    size="small"
                    sx={{
                      flex: 1,
                      height: 28,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      borderColor: selectedTab === 'PUMP' ? '#4caf50' : '#f44336',
                      color: selectedTab === 'PUMP' ? '#4caf50' : '#f44336',
                      backgroundColor: 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        backgroundColor: selectedTab === 'PUMP'
                          ? 'rgba(76, 175, 80, 0.1)'
                          : 'rgba(244, 67, 54, 0.1)',
                      },
                    }}
                  >
                    {amt}
                  </Button>
                ))}
              </Box>

              {/* Amount Input Field */}
              <TextField
                value={localCoHostAmount}
                onChange={handleInputChange}
                variant="outlined"
                type="number"
                fullWidth
                placeholder="Enter amount"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.6)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        SOL
                      </Typography>
                    </InputAdornment>
                  ),
                  sx: {
                    height: 40,
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedTab === 'PUMP' ? 'rgba(76, 175, 80, 0.3)' : 'rgba(244, 67, 54, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedTab === 'PUMP' ? '#4caf50' : '#f44336',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: selectedTab === 'PUMP' ? '#4caf50' : '#f44336',
                    },
                  }
                }}
              />

              {/* Action Button */}
              <Button
                variant="contained"
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
                  mt: 2,
                  height: 40,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  backgroundColor: selectedTab === 'PUMP' ? '#4caf50' : '#f44336',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    backgroundColor: selectedTab === 'PUMP' ? '#45a049' : '#e53935',
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              >
                {isProcessing || trade_loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  selectedTab === 'PUMP' ? "Pump It" : "Jeet Out"
                )}
              </Button>
            </Box>

            {/* Trade Information Table */}
            <Box
              sx={{
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
              }}
            >
              <Table size="small">
                <TableBody>
                  {!input_only && (
                    <>
                      <TableRow>
                        <TableCell
                          sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            py: 1,
                          }}
                        >
                          Your Balance:
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            py: 1,
                          }}
                        >
                          {convertToCurrency(balance, solPrice)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell
                          sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            color: 'rgba(255, 255, 255, 0.6)',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            py: 1,
                          }}
                        >
                          Current Bankroll:
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                            color: '#ff8500',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                            py: 1,
                          }}
                        >
                          {selectedRow
                            ? convertToCurrency(parseFloat(selectedRow.user_bet || 0), solPrice)
                            : "N/A"}
                        </TableCell>
                      </TableRow>
                    </>
                  )}

                  <TableRow>
                    <TableCell
                      sx={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        py: 1,
                      }}
                    >
                      Current Position:
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        py: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 600,
                          color: '#ffa726',
                          fontSize: '0.7rem',
                        }}
                      >
                        {(() => {
                          if (!Array.isArray(hosts) || !selectedRow) {
                            return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                          }

                          const existingHost = hosts.find((h) => h.host === user?._id);
                          if (!existingHost) {
                            return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                          }

                          const currentBankroll = parseFloat(selectedRow.user_bet) || 0;
                          const pct = existingHost.share.toFixed(2);
                          const absStake = (existingHost.share / 100) * currentBankroll;

                          return `${pct}% / ${absStake.toFixed(6)} SOL (${convertToCurrency(absStake, solPrice)})`;
                        })()}
                      </Typography>
                    </TableCell>
                  </TableRow>

                  <TableRow
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    }}
                  >
                    <TableCell
                      sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        py: 1,
                        borderBottom: 'none',
                      }}
                    >
                      Projected Position:
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: '#ff8500',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        py: 1,
                        borderBottom: 'none',
                      }}
                    >
                      {(() => {
                        if (!selectedRow || !Array.isArray(hosts)) {
                          return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                        }

                        const currentBankroll = parseFloat(selectedRow.user_bet || 0);
                        if (!currentBankroll) {
                          return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                        }

                        const inputValue = parseFloat(coHostAmount || '0');
                        if (inputValue <= 0) {
                          return `0% / 0.000000 SOL (${convertToCurrency(0, solPrice)})`;
                        }

                        if (selectedTab === 'PUMP') {
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
                          return `~${finalPctStr} / ${displaySol} SOL (${displayCurrency})`;
                        } else {
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
                          return `~${finalPctStr} / ${displaySol} SOL (${displayCurrency})`;
                        }
                      })()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Fee Information */}
              <Box sx={{ p: 1, textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.6)',
                  }}
                >
                  {selectedTab === 'PUMP' ? 'Trading fee: 5%' : 'Trading fee: 5%'}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Chart Container */}
        {!input_only && (
          <Box
            sx={{
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
              background: 'rgba(255, 255, 255, 0.01)',
            }}
          >
            <div
              ref={chartContainerRef}
              style={{
                width: '100%',
                height: 'auto',
              }}
            />
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default CoHostModal;