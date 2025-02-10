import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
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
import SettingsIcon from '@mui/icons-material/Tune';
import InfoIcon from '@mui/icons-material/Info';


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

  // 1) We read the candles & transactions from Redux:
  const storeCandles = useSelector((state) => state.logic.candles);
  const transactions = useSelector((state) => state.logic.transactions);

  // 2) Local states & references
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedTab, setSelectedTab] = useState('PUMP');
  const [timeFrame, setTimeFrame] = useState('1m');
  const [localCoHostAmount, setLocalCoHostAmount] = useState(0.01);

  // For the chart
  const [localChartData, setLocalChartData] = useState([]);
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);



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
        width: container.clientWidth, // <-- Use container's width
        height: 350,
        layout: {
          background: { type: 'solid', color: isDarkMode ? '#2d2331' : '#ffffff' },
          textColor: isDarkMode ? '#ffffff' : '#000000',
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
  // If your socket also emits new candles, you'd merge them here
  // For brevity, omitted or you can do something like:
  useEffect(() => {
    if (!selectedRow?._id || !socket) return;
    const candleEvent = `NEW_CANDLE_${selectedRow._id}`;
    const handleNewCandle = (data) => {
      // console.log("NEW CANDLE——————data", data)
      // data = { newCandle: { ... } }
      dispatch(someActionToAppendCandle(data.newCandle));
    };
    socket.on(candleEvent, handleNewCandle);
    return () => {
      socket.off(candleEvent, handleNewCandle);
    };
  }, [selectedRow?._id, socket]);

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  // ------------------ REMAINING LOGIC (Pump/Jeet, Table, etc.) ------------------
  const calculatePercentageChange = (current, original) => {
    if (!original) return 'N/A';
    return (((current - original) / original) * 100).toFixed(2);
  };
  const liquidityPercentageChange = calculatePercentageChange(
    selectedRow.winnings ? selectedRow.winnings : parseFloat(selectedRow.user_bet),
    selectedRow.bet_amount
  );

  const totalShare = Array.isArray(hosts)
    ? hosts.reduce((acc, host) => acc + host.share, 0)
    : 0;

  const formatRelativeTime = (date) => {
    const now = Moment();
    const created = Moment(date);
    const diff = Moment.duration(now.diff(created));

    const days = diff.days();
    const hours = diff.hours();
    const minutes = diff.minutes();
    const seconds = diff.seconds();

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

  const handleUnstake = async (winnings, room_id, stakeAmount) => {
    try {
      // 1) Parse and validate stakeAmount
      const parsedStake = parseFloat(stakeAmount);
      if (isNaN(parsedStake) || parsedStake <= 0) {
        dispatch(errorMsgBar('R U FURR-REAL? AMOUNT IS INVALID!'));
        return;
      }

      const parsedWinnings = parseFloat(winnings);
      if (isNaN(parsedWinnings)) {
        dispatch(errorMsgBar('Invalid winnings value'));
        return;
      }

      const parsedBalance = parseFloat(balance);
      if (parsedStake >= parsedWinnings) {
        dispatch(errorMsgBar('NOT ENUFF EQUUITY AT THIS MEOWMENT'));
        return;
      }

      await dispatch(jeetGame(room_id, parsedStake));
      await dispatch(getMyGames({ game_type: 'All', status: 'open', sort: 'desc' }));
    } catch (error) {
      console.error('Error unstaking from room:', error);
    }
  };


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
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
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
          <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', p: 2, borderRadius: 1 }}>
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
                                ? 'red'
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
                          <TrendingDownOutlined sx={{ ml: 1, color: 'red' }} />
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
                      alt="Player Avatar"
                      sx={{ width: 40, height: 40, margin: '0 auto' }}
                    />
                  </a>
                </Box>
              </Box>
            </Box>
          </Box>
        )}
        {/* Dialog that appears when the gear icon is clicked */}
        <Dialog open={dialogOpen} onClose={handleDialogClose}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
            Slippage — coming soon
            <Tooltip
              title="Tired of waiting for rooms to be less busy? Slippage comes soon to RPS.Game allowing you to trade seamlessly"
              arrow
            >
              <IconButton size="small" sx={{ ml: 1 }}>
                <InfoIcon fontSize="inherit" />
              </IconButton>
            </Tooltip>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Stay tuned! Slippage functionality is coming soon to allow you to trade seamlessly even during busy times.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button color="error" onClick={handleDialogClose}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
        {/* PUMP / JEET inputs */}
        {((!input_only && !has_joined) || input_only) && (
          <Box
            sx={{
              background: 'rgba(170, 170, 170, 0.06)',
              p: 2,
              borderRadius: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            <Summary shortVersion={!has_joined ? false : true} />
            <Tooltip
              title="Tired of waiting for rooms to be less busy? Slippage comes soon to RPS.Game allowing you to trade seamlessly"
              arrow
            >
              <IconButton size="small" sx={{ color: 'white', position: 'absolute', right: '35px', }} onClick={handleDialogOpen}>
                <SettingsIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                onClick={() => setSelectedTab('PUMP')}
                variant={selectedTab === 'PUMP' ? 'contained' : 'outlined'}
                color={selectedTab === 'PUMP' ? 'success' : 'inherit'}
                sx={{
                  flexGrow: 1,
                  textTransform: 'none',
                  borderColor: selectedTab !== 'PUMP' ? '#4caf50' : '',
                  color: selectedTab !== 'PUMP' ? '#4caf50' : ''
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
                  borderColor: selectedTab !== 'JEET' ? '#f44336' : '',
                  color: selectedTab !== 'JEET' ? '#f44336' : ''
                }}
              >
                JEET
                <TrendingDownOutlined sx={{ ml: 1, color: selectedTab === 'JEET' ? '#fff' : '#f44336' }} />
              </Button>
            </Box>

            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {[0.01, 0.1, 1].map((amt) => (
                  <Button
                    key={amt}
                    variant="outlined"
                    color="error"
                    onClick={() => handleButtonClick(amt)}
                    sx={{ flex: 1 }}
                  >
                    {amt}
                  </Button>
                ))}
              </Box>

              <TextField
                color="error"
                value={localCoHostAmount}
                onChange={handleInputChange}
                variant="filled"
                type="number"
                fullWidth
              />

              {input_only && (
                <Box sx={{ mt: 2 }}>
                  {selectedTab === 'PUMP' ? (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (trade_loading) {
                          dispatch(errorMsgBar("Trade is already in progress."));
                          return;
                        }
                        handleSendCoHost();
                      }}
                      disabled={trade_loading}
                      fullWidth
                    >
                      {trade_loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "PUMP"
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        if (trade_loading) {
                          dispatch(errorMsgBar("Trade is already in progress."));
                          return;
                        }
                        handleUnstake(
                          selectedRow?.winnings ?? parseFloat(selectedRow?.user_bet || 0),
                          selectedRow?._id,
                          coHostAmount
                        );
                      }}
                      disabled={trade_loading}
                      fullWidth
                    >
                      {trade_loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "JEET"
                      )}
                    </Button>
                  )}
                </Box>
              )}

            </Box>

            {/* Balance / Before / After Table */}
            <Table>
              <TableBody>
                {!input_only && (
                  <>
                    <TableRow>
                      <TableCell>BALANCE:</TableCell>
                      <TableCell align="right">{convertToCurrency(balance, solPrice)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CURRENT BANKROLL:</TableCell>
                      <TableCell align="right" sx={{ color: '#ff8500' }}>
                        {selectedRow ? convertToCurrency(selectedRow.user_bet, solPrice) : null}
                      </TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow>
                  <TableCell>BEFORE:</TableCell>
                  <TableCell align="right" sx={{ color: '#ff8500', whiteSpace: 'pre-wrap' }}>
                    {(() => {
                      if (
                        Array.isArray(hosts) &&
                        hosts.some((host) => host.host === user?._id)
                      ) {
                        const userHost = hosts.find((host) => host.host === user._id);
                        if (userHost) {
                          const sharePct = userHost.share.toFixed(2);
                          const shareValue = (userHost.share / 100) * parseFloat(selectedRow.user_bet);
                          return `${sharePct}%\n(${convertToCurrency(shareValue, solPrice)} / ${shareValue.toFixed(6)} SOL)`;
                        }
                      }
                      return convertToCurrency(0, solPrice);
                    })()}
                  </TableCell>

                </TableRow>
                <TableRow>
                  <TableCell>AFTER:</TableCell>
                  <TableCell align="right" sx={{ color: '#ff8500', whiteSpace: 'pre-line' }}>
                    {(() => {
                      if (!selectedRow || !Array.isArray(hosts)) return '0%';

                      // Find the current user as a host, and read their current share
                      const userHost = hosts.find((host) => host.host === user?._id);
                      const userCurrentShare =
                        userHost && !isNaN(userHost.share) ? userHost.share : 0;

                      // Calculate the user’s current absolute stake from their share
                      const currentBankroll = parseFloat(selectedRow.user_bet || 0);
                      if (!currentBankroll) return '0%';
                      const userAbsoluteStake = (userCurrentShare / 100) * currentBankroll;

                      // Convert input to a float and deduct fees
                      const coHostAmountFloat = parseFloat(coHostAmount || 0);
                      const fee = coHostAmountFloat * 0.025; // 2.5% fee
                      const amountAfterFee = coHostAmountFloat - fee;

                      /**
                       * PUMP (BUY) scenario
                       */
                      const newTotalBuy = currentBankroll + amountAfterFee; // new total bankroll
                      const newUserAbsoluteStakeBuy = userAbsoluteStake + amountAfterFee; // user’s new stake
                      let buySharePercent = 0;
                      if (newTotalBuy > 0 && newUserAbsoluteStakeBuy > 0) {
                        buySharePercent = (newUserAbsoluteStakeBuy / newTotalBuy) * 100;
                      }
                      const buyShare = `${buySharePercent.toFixed(2)}%`;

                      /**
                       * JEET (SELL) scenario
                       */
                      const newTotalSell = currentBankroll - amountAfterFee; // new total bankroll
                      const newUserAbsoluteStakeSell = userAbsoluteStake - amountAfterFee; // user’s new stake
                      let sellSharePercent = 0;
                      if (newTotalSell > 0 && newUserAbsoluteStakeSell > 0) {
                        sellSharePercent = (newUserAbsoluteStakeSell / newTotalSell) * 100;
                      }
                      const sellShare = `${sellSharePercent.toFixed(2)}%`;

                      /**
                       * Helper function to convert SOL to currency (e.g. USD).
                       * If solPrice is in scope, it can be used here. Otherwise, remove or adjust as needed.
                       */
                      const convertCurrency = (amount) => {
                        return solPrice
                          ? '$' + (amount * solPrice).toFixed(2)
                          : amount.toFixed(2);
                      };

                      /**
                       * Decide which scenario to display based on the selectedTab:
                       *  - PUMP → Show "BUY" results
                       *  - Otherwise → Show "SELL" results
                       */
                      if (selectedTab === 'PUMP') {
                        // BUY
                        return `~${buyShare}\n(${convertCurrency(newUserAbsoluteStakeBuy)} / ${newUserAbsoluteStakeBuy.toFixed(
                          6
                        )} SOL)`;
                      } else {
                        // SELL
                        // If user’s new stake is <= 0, display “0%”
                        const finalSellShare = newUserAbsoluteStakeSell > 0 ? sellShare : '0%';
                        const displayCurrency =
                          newUserAbsoluteStakeSell > 0
                            ? convertCurrency(newUserAbsoluteStakeSell)
                            : '$0.00';
                        const displaySol =
                          newUserAbsoluteStakeSell > 0
                            ? newUserAbsoluteStakeSell.toFixed(6)
                            : '0.000000';

                        return `~${finalSellShare}\n(${displayCurrency} / ${displaySol} SOL)`;
                      }
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Chart Container */}
        {!input_only && (
          <Box sx={{ my: 2, borderRadius: '0.3em', overflow: 'hidden', width: '100%' }}>
            <div
              ref={chartContainerRef}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: '0.3em',
                overflow: 'hidden',
              }}
            />
          </Box>
        )}

        {/* Transactions Table */}
        {!has_joined && !input_only && (
          <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', p: 2, borderRadius: 1 }}>
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