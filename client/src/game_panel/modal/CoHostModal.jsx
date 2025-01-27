import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
import Chart from 'react-apexcharts';
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
  TableRow
} from '@mui/material';
import {
  ShowChartOutlined,
  TrendingUpOutlined,
  TrendingDownOutlined
} from '@mui/icons-material';
import { debounce } from 'lodash';
import { ThemeProvider } from '@mui/material/styles';

import { getCustomTheme } from '../../config/theme';

import {
  getTransactionCandles,
  unstake,
  addNewTransaction,
  addNewCandle,
  getMyGames
} from '../../redux/Logic/logic.actions';
import { setBalance } from '../../redux/Auth/user.actions';
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';

function CoHostModal({
  isDarkMode,
  coHostAmount,
  selectedRow,
  balance,
  user,
  handleClose,
  handleSendCoHost,
  has_joined,
  solPrice,
  input_only,
  handleCoHostAmountChange
}) {
  const dispatch = useDispatch();
  const socket = useSelector((state) => state.auth.socket);
  const transactionCandles = useSelector((state) => state.logic.candles);
  const transactions = useSelector((state) => state.auth.transactions);
  // ---- LOCAL STATE ----
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedTab, setSelectedTab] = useState('PUMP');
  const [timeFrame, setTimeFrame] = useState('4h');
  const [localCoHostAmount, setLocalCoHostAmount] = useState(0.01);

  // ---- EFFECTS ----
  useEffect(() => {
    // Fetch candlestick data if user has joined and it's not just an input-only view
    // if (selectedRow?._id && has_joined && !input_only) {
      dispatch(getTransactionCandles({ roomId: selectedRow._id, timeFrame }));
    // }
  }, [dispatch, selectedRow?._id, timeFrame, has_joined, input_only]);

  useEffect(() => {
    // Listen for real-time candle updates via socket
    if (selectedRow?._id && socket) {
      const candleEvent = `NEW_CANDLE_${selectedRow._id}`;
      const handleNewCandle = (data) => {
        dispatch(addNewCandle(data.newCandle));
      };
      socket.on(candleEvent, handleNewCandle);

      return () => {
        socket.off(candleEvent, handleNewCandle);
      };
    }
  }, [dispatch, selectedRow?._id, socket]);

  // ---- CHART LOGIC ----
  let chartData = [];
  const convertToChartCurrency = (input) => {
    let number = Number(input);
    if (isNaN(number)) return input.toString();

    // Round to 2 decimals
    number = Math.floor(number * 100) / 100;

    // Convert large numbers to K, M, etc.
    if (number >= 1_000_000 || number <= -1_000_000) {
      return (number / 1_000_000).toFixed(1) + 'M';
    } else if (number >= 1000 || number <= -1000) {
      return (number / 1000).toFixed(1) + 'K';
    } else {
      let [whole, decimal] = number.toFixed(2).split('.');
      whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      if (decimal) decimal = decimal.replace(/0+$/, '');
      return decimal ? `${whole}.${decimal}` : whole;
    }
  };

  // Build chartData
  if (transactionCandles && transactionCandles.length > 0) {
    transactionCandles.forEach((candle, index) => {
      chartData.push({
        x: index, // sequential index to remove large time gaps
        y: [candle.open, candle.high, candle.low, candle.close],
        startTime: candle.startTime
      });
    });
  }

  // Chart options
  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: 350,
      zoom: { enabled: true, type: 'x' },
      toolbar: { show: false },
      animations: { enabled: false },
      background: '#2d2331', // Set the chart background color to purple
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        rotate: -45,
        style: { colors: '#fff', fontSize: '12px' },
        formatter: (value) => {
          if (value === 0 && chartData[0]) {
            return Moment(chartData[0].startTime).format('HH:mm');
          }
          if (value === chartData.length - 1 && chartData.length > 1) {
            return Moment(chartData[chartData.length - 1].startTime).format('HH:mm');
          }
          return '';
        },
      },
      tickAmount: 2,
      axisBorder: { show: true, color: '#fff' },
      axisTicks: { show: true, color: '#fff' },
    },
    yaxis: {
      labels: {
        style: { colors: '#fff', fontSize: '12px' },
        formatter: (value) => convertToChartCurrency(value),
      },
    },
    tooltip: {
      custom: ({ dataPointIndex }) => {
        const candle = chartData[dataPointIndex];
        if (!candle || !candle.y || candle.y.length !== 4) return '';
        const [open, high, low, close] = candle.y;
        return `
          <div class="chart-tooltip">
            <div><strong>Time:</strong> ${Moment(candle.startTime).format('HH:mm')}</div>
            <div><strong>Open:</strong> ${convertToChartCurrency(open)}</div>
            <div><strong>High:</strong> ${convertToChartCurrency(high)}</div>
            <div><strong>Low:</strong> ${convertToChartCurrency(low)}</div>
            <div><strong>Close:</strong> ${convertToChartCurrency(close)}</div>
          </div>
        `;
      },
    },
    plotOptions: {
      candlestick: {
        wick: { useFillColor: true },
        colors: { upward: '#00b140', downward: '#ff4b4b' },
        bodyWidth: 1,
      },
    },
    grid: {
      borderColor: '#fff6',
      strokeDashArray: 9,
      
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  };
  // ---- LIQUIDITY + SHARE LOGIC ----
  const calculatePercentageChange = (current, original) => {
    if (!original) return 'N/A';
    return (((current - original) / original) * 100).toFixed(2);
  };

  const liquidityPercentageChange = calculatePercentageChange(
    selectedRow.winnings ? selectedRow.winnings : parseFloat(selectedRow.user_bet),
    selectedRow.bet_amount
  );

  const totalShare = Array.isArray(selectedRow.hosts)
    ? selectedRow.hosts.reduce((acc, host) => acc + host.share, 0)
    : 0;

  // ---- RELATIVE TIME HELPER ----
  const formatRelativeTime = (date) => {
    const now = Moment();
    const created = Moment(date);
    const diff = Moment.duration(now.diff(created));

    const days = diff.days();
    const hours = diff.hours();
    const minutes = diff.minutes();
    const seconds = diff.seconds();

    if (days >= 1) return days > 1 ? `${days}d ${hours}h ago` : `${days}d ${hours > 0 ? hours + 'h' : ''} ago`;
    if (hours >= 1) return hours > 1 ? `${hours}h ${minutes}m ago` : `${hours}h ${minutes > 0 ? minutes + 'm' : ''} ago`;
    if (minutes >= 1) return minutes > 1 ? `${minutes}m ago` : `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  // ---- INPUT (coHostAmount) DEBOUNCING ----
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

  // ---- UNSTAKE HANDLER (JEET) ----
  const handleUnstake = async (winnings, room_id, stakeAmount) => {
    try {
      const parsedWinnings = parseFloat(winnings);
      if (isNaN(parsedWinnings)) return console.error("Invalid winnings value");

      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) return console.error("Invalid balance value");

      await dispatch(unstake(room_id, stakeAmount));
      await dispatch(getMyGames({ game_type: 'All', status: 'open', sort: 'desc' }));
      await dispatch(addNewTransaction({ amount: parsedWinnings, room_id }));

      const newBalance = parsedBalance + parsedWinnings;
      await dispatch(setBalance(newBalance));
    } catch (error) {
      console.error('Error unstaking from room:', error);
    }
  };

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');


  // ---- PLAYER MODAL HELPERS ----
  const handleOpenPlayerModal = (creator_id) => {
    setSelectedCreator(creator_id);
    setShowPlayerModal(true);
  };
  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  // ---- RENDER ----
  return (
    <ThemeProvider theme={theme}>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
        {/* Header (show only if not joined and not input_only) */}
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

        {/* Player Modal (if open) */}
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        {/* Top Info (if not joined/input_only) */}
        {!input_only && !has_joined && (
          <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', p: 2, borderRadius: 1 }}>
            {/* Liquidity / Holders / Battles / Created-By stats */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 3,
                mb: 2,
                '@media (max-width: 600px)': {
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
                          ? parseFloat(selectedRow.user_bet)
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
                      {Array.isArray(selectedRow.hosts) &&
                        selectedRow.hosts.map((host, i) => {
                          const pct = totalShare > 0 ? ((host.share / totalShare) * 100).toFixed(2) : 0;
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
                      {Array.isArray(selectedRow.hosts) ? selectedRow.hosts.length : 0}
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

        {/* TABs + Betting/PUMP/JEET area (if not joined) */}
        {!has_joined && (
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
            {/* PUMP / JEET Tabs */}
            {input_only && (
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
                <TrendingDownOutlined
                  sx={{ ml: 1, color: selectedTab === 'JEET' ? '#fff' : '#f44336' }}
                />
              </Button>
            </Box>
            )}
            {/* Co-Host Amount Input */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                {[0.01, 0.1, 1].map((amt) => (
                  <Button
                    key={amt}
                    variant="outlined"
                    color='error'
                    onClick={() => handleButtonClick(amt)}
                    sx={{ flex: 1 }}
                  >
                    {amt}
                  </Button>
                ))}
              </Box>

              <TextField
                color='error'
                value={localCoHostAmount}
                onChange={handleInputChange}
                variant="filled"
                type="number"
                fullWidth
              />

              {/* If input_only => show PUMP/JEET buttons under the textfield */}
              {input_only && (
                <Box sx={{ mt: 2 }}>
                  {selectedTab === 'PUMP' ? (
                    <Button
                      variant="contained"
                      color='error'
                      onClick={handleSendCoHost}
                      fullWidth
                    >
                      PUMP
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color='error'
                      onClick={() =>
                        handleUnstake(
                          selectedRow?.winnings ?? parseFloat(selectedRow?.user_bet || 0),
                          selectedRow?._id,
                          coHostAmount
                        )
                      }
                      fullWidth
                    >
                      JEET
                    </Button>
                  )}
                </Box>
              )}
            </Box>

            {/* BALANCE / AFTER-BEFORE Table */}
            <Table>
              <TableBody>
                {!input_only && (
                  <>
                    <TableRow>
                      <TableCell>BALANCE:</TableCell>
                      <TableCell align="right">
                        {convertToCurrency(balance, solPrice)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>CURRENT BANKROLL:</TableCell>
                      <TableCell align="right" sx={{ color: '#ff8500' }}>
                        {selectedRow
                          ? convertToCurrency(selectedRow.user_bet, solPrice)
                          : null}
                      </TableCell>
                    </TableRow>
                  </>
                )}

                {/* BEFORE */}
                <TableRow>
                  <TableCell>BEFORE:</TableCell>
                  <TableCell align="right" sx={{ color: '#ff8500' }}>
                    {(() => {
                      if (
                        Array.isArray(selectedRow.hosts) &&
                        selectedRow.hosts.some((host) => host.host === user?._id)
                      ) {
                        const userHost = selectedRow.hosts.find(
                          (host) => host.host === user._id
                        );
                        if (userHost) {
                          const sharePct = userHost.share.toFixed(2);
                          const shareValue = convertToCurrency(
                            (userHost.share / 100) * parseFloat(selectedRow.user_bet),
                            solPrice
                          );
                          return `${sharePct}% (${shareValue})`;
                        }
                      }
                      return convertToCurrency(0, solPrice);
                    })()}
                  </TableCell>
                </TableRow>

                {/* AFTER */}
                <TableRow>
                  <TableCell>AFTER:</TableCell>
                  <TableCell align="right" sx={{ color: '#ff8500' }}>
                    {(() => {
                      // If no hosts or no user
                      if (!selectedRow || !Array.isArray(selectedRow.hosts)) return '0%';

                      const userHost = selectedRow.hosts.find((host) => host.host === user?._id);
                      const userStake = userHost ? parseFloat(userHost.stake) : 0;
                      const coHostAmountFloat = parseFloat(coHostAmount || 0);
                      const fee = coHostAmountFloat * 0.025;
                      const amountAfterFee = coHostAmountFloat - fee;

                      const currentBankroll = parseFloat(selectedRow.user_bet || 0);
                      if (!currentBankroll) return '0%';

                      const totalStake = selectedRow.hosts.reduce(
                        (acc, host) => acc + parseFloat(host.stake),
                        0
                      );
                      const totalStakeIncludingUser = totalStake + amountAfterFee;

                      // BUY scenario
                      const newUserStake = userStake + amountAfterFee;
                      const newUserShareBuy = (newUserStake / totalStakeIncludingUser) * 100;

                      // SELL scenario
                      const userCurrentShareVal =
                        userHost && !isNaN(userHost.share)
                          ? (userHost.share / 100) * currentBankroll
                          : 0;
                      const newUserStakeAfterSell = userCurrentShareVal - amountAfterFee;
                      const newUserShareSell =
                        (newUserStakeAfterSell / currentBankroll) * 100;

                      const buyShare = `${Math.min(newUserShareBuy, 100).toFixed(2)}%`;
                      const sellShare =
                        newUserStakeAfterSell > 0
                          ? `${Math.min(newUserShareSell, 100).toFixed(2)}%`
                          : '0%';

                      return selectedTab === 'PUMP' ? `~${buyShare}` : `~${sellShare}`;
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        )}

        {/* Chart (if not input_only and user joined) */}
        {!input_only && (
          <Box sx={{ my: 2, borderRadius: '0.3em', overflow:'hidden' }}>
            <Chart
              options={chartOptions}
              series={[{ data: chartData }]}
              type="candlestick"
              height={350}
            />
          </Box>
        )}

        {/* Transaction Table (if not joined + not input_only) */}
        {!has_joined && !input_only && (
          <Box sx={{ background: 'rgba(170, 170, 170, 0.06)', p: 2, borderRadius: 1 }}>
            <Table>
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
                    // Identify relevant keywords
                    let desc = tx.description?.toLowerCase() || '';
                    let label = null;
                    if (desc.includes('joined')) label = 'Bet';
                    else if (desc.includes('created')) label = 'Created';
                    else if (desc.includes('pumped')) label = 'Pumped';
                    else if (desc.includes('jeeted')) label = 'Jeeted';
                    // Skip if no recognized keyword
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
          </Box>
        )}

        {/* Footer Buttons (PUMP / JEET) if not input_only */}
        {!input_only && !has_joined && (
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button variant="contained" color="error" onClick={handleSendCoHost}>
              PUMP
              <TrendingUpOutlined sx={{ ml: 1 }} />
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() =>
                handleUnstake(
                  selectedRow?.winnings ?? parseFloat(selectedRow?.user_bet || 0),
                  selectedRow?._id,
                  coHostAmount
                )
              }
              sx={{
                background: 'linear-gradient(357deg, #00ff17, #28a745)',
                boxShadow:
                  'rgb(37 184 65) 0px -0.5px 0px, rgb(34, 117, 52) 0px -3px inset, rgb(80, 191, 98) 0px 2px inset'
              }}
            >
              JEET
              <TrendingDownOutlined sx={{ ml: 1 }} />
            </Button>
          </Box>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default CoHostModal;