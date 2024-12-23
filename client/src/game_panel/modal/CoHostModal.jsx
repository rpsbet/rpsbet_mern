import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
import { getTransactionCandles, unstake, addNewTransaction, addNewCandle, getMyGames } from '../../redux/Logic/logic.actions';
import { setBalance } from '../../redux/Auth/user.actions'
import Chart from "react-apexcharts";
import { Box, Tooltip, Typography, Button, TextField, TableHead, Table, TableBody, TableCell, TableRow, ButtonGroup } from "@material-ui/core";
import { ShowChartOutlined, TrendingUpOutlined, TrendingDownOutlined } from "@material-ui/icons";
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import { Warning, Info, CheckCircle } from '@material-ui/icons';


function CoHostModal({
  isDarkMode,
  coHostAmount,
  selectedRow,
  balance,
  user,
  handleClose,
  handleSendCoHost,
  has_joined,
  handleCoHostAmountChange,
}) {
  const dispatch = useDispatch();
  const [closingRooms, setClosingRooms] = useState({});
  const [timeFrame, setTimeFrame] = useState('4h');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [selectedTab, setSelectedTab] = useState("PUMP");
  const [isFocused, setIsFocused] = useState(false);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState(false);
  const handleTabChange = (tab) => setSelectedTab(tab);
  const transactionCandles = useSelector(state => state.logic.candles);
  const transactions = useSelector(state => state.auth.transactions);
  const socket = useSelector(state => state.auth.socket);

  const convertToChartCurrency = (input) => {
    let number = Number(input);

    if (!isNaN(number)) {
      number = Math.floor(number * 100) / 100;

      let formattedNumber = '';
      if (number >= 1000000 || number <= -1000000) {
        formattedNumber = (number / 1000000).toFixed(1) + 'M';
      } else if (number >= 1000 || number <= -1000) {
        formattedNumber = (number / 1000).toFixed(1) + 'K';
      } else {
        let [whole, decimal] = number.toFixed(2).split('.');
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        if (decimal) {
          decimal = decimal.replace(/0+$/, '');
        }

        formattedNumber = decimal ? `${whole}.${decimal}` : whole;
      }

      return formattedNumber;
    } else {
      return input.toString();
    }
  };

  useEffect(() => {
    if (selectedRow?._id) {
      dispatch(getTransactionCandles({ roomId: selectedRow._id, timeFrame }));
    }
  }, [dispatch, selectedRow?._id, timeFrame]);

  useEffect(() => {
    if (selectedRow && selectedRow._id && socket) {
      const roomId = selectedRow._id;
      const candleEvent = `NEW_CANDLE_${roomId}`;

      const handleNewCandle = (data) => {
        console.log(`New candle received for room ${roomId}:`, data.newCandle);

        dispatch(addNewCandle(data.newCandle));
      };

      socket.on(candleEvent, handleNewCandle);

      return () => {
        socket.off(candleEvent, handleNewCandle);
      };
    }
  }, [selectedRow?._id, socket, dispatch]);

  let chartData = [];
  const chartOptions = {
    chart: {
      type: 'candlestick',
      height: 350,
      zoom: {
        enabled: true,
        type: 'x',
        resetIcon: {
          size: 30,
          offsetX: 0,
          offsetY: 0,
          fillColor: '#fff',
          shape: 'circle',
        },
      },
      toolbar: {
        autoSelected: 'zoom',
        show: false,
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        rotate: -45,
        format: 'HH:mm',
        style: {
          colors: '#fff',
          fontSize: '12px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 400,
        },
      },
      tickAmount: 10,
      axisBorder: {
        show: true,
        color: '#fff',
        height: 1,
      },
      axisTicks: {
        show: true,
        color: '#fff',
      },

    },
    yaxis: {
      labels: {
        style: {
          colors: '#fff',
          fontSize: '12px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 400,
        },
        formatter: (value) => convertToChartCurrency(value),
      },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        const candle = chartData[dataPointIndex];

        if (!candle || !candle.y || candle.y.length !== 4) {
          console.error("Invalid candle data:", candle);
          return '';
        }

        const [open, high, low, close] = candle.y;
        return `
        <div class="chart-tooltip">
          <div><strong>Time:</strong> ${Moment(candle.x).format('HH:mm')}</div>
          <div><strong>Open:</strong> ${convertToChartCurrency(open)}</div>
          <div><strong>High:</strong> ${convertToChartCurrency(high)}</div>
          <div><strong>Low:</strong> ${convertToChartCurrency(low)}</div>
          <div><strong>Close:</strong> ${convertToChartCurrency(close)}</div>
        </div>`;
      },
    },
    plotOptions: {
      candlestick: {
        wick: {
          useFillColor: true,
          width: 1
        },
        colors: {
          upward: '#00b140',
          downward: '#ff4b4b',
        },
        bodyWidth: 1,
      },
    },
    grid: {
      borderColor: '#444',
      strokeDashArray: 9,
    },
    theme: {
      mode: isDarkMode ? 'dark' : 'light',
    },
  };

  if (transactionCandles && transactionCandles.length > 0) {
    const now = new Date().getTime();
    const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
    let lastCandle = transactionCandles[0];
  
    if (new Date(lastCandle.startTime).getTime() >= fourHoursAgo) {
      chartData.push({
        x: new Date(lastCandle.startTime).getTime(),
        y: [lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close],
      });
    }
  
    for (let i = 1; i < transactionCandles.length; i++) {
      const currentCandle = transactionCandles[i];
      const lastCandleTime = new Date(lastCandle.startTime).getTime();
      const currentCandleTime = new Date(currentCandle.startTime).getTime();

      const timeDiff = currentCandleTime - lastCandleTime;
  
      if (timeDiff > 60000) {
        
        const missingCandlesCount = Math.floor(timeDiff / 60000);
        for (let j = 1; j < missingCandlesCount; j++) {
          const missingTime = lastCandleTime + j * 60000;
          if (missingTime >= fourHoursAgo) {
            chartData.push({
              x: missingTime,
              y: [
                lastCandle.close,
                lastCandle.close,
                lastCandle.close,
                lastCandle.close,
              ],
            });
          }
        }
      }
  
      if (timeDiff <= 60000 && Math.floor(lastCandleTime / 60000) === Math.floor(currentCandleTime / 60000)) {
        lastCandle.high = Math.max(lastCandle.high, currentCandle.high);
        lastCandle.low = Math.min(lastCandle.low, currentCandle.low);
        lastCandle.close = currentCandle.close;
        lastCandle.volume += currentCandle.volume;
      
        const lastChartIndex = chartData.length - 1;
        if (currentCandleTime >= fourHoursAgo && lastChartIndex >= 0) {
          chartData[lastChartIndex] = {
            x: lastCandleTime,
            y: [lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close],
          };
        }
      } else {
        if (currentCandleTime >= fourHoursAgo) {
          chartData.push({
            x: currentCandleTime,
            y: [currentCandle.open, currentCandle.high, currentCandle.low, currentCandle.close],
          });
        }
      
        lastCandle = currentCandle;
      }
    }
  
    const lastCandleTime = new Date(lastCandle.startTime).getTime();
    const timeDiff = Math.floor((now - lastCandleTime) / 60000);
  
    for (let j = 1; j <= timeDiff; j++) {
      const missingTime = lastCandleTime + j * 60000;
  
      if (missingTime >= fourHoursAgo) {
        chartData.push({
          x: missingTime,
          y: [
            lastCandle.close,
            lastCandle.close,
            lastCandle.close,
            lastCandle.close,
          ],
        });
      }
    }
  
    chartData.sort((a, b) => a.x - b.x);

    chartData.forEach((candle) => {
      if (!candle.y || candle.y.length !== 4) {
        console.error("Invalid candle:", candle);
        throw new Error("Invalid candle structure detected.");
      }
    });
  }

  useEffect(() => {
    if (isFocused) {
      setIsButtonGroupVisible(true);
    } else {
      const timeoutId = setTimeout(() => {
        setIsButtonGroupVisible(false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isFocused]);


  const handleOpenPlayerModal = (creator_id) => {
    setSelectedCreator(creator_id);
    setShowPlayerModal(true);
  };

  const handleClosePlayerModal = () => {
    setShowPlayerModal(false);
  };

  const calculatePercentageChange = (current, original) => {
    if (original === 0) return 'N/A';
    return (((current - original) / original) * 100).toFixed(2);
  };

  const liquidityPercentageChange = calculatePercentageChange(
    selectedRow.winnings ? selectedRow.winnings : parseFloat(selectedRow.user_bet),
    selectedRow.bet_amount
  );


  const totalShare = Array.isArray(selectedRow.hosts)
    ? selectedRow.hosts.reduce((acc, host) => acc + host.share, 0)
    : 0;

  const formatRelativeTime = (date) => {
    const now = Moment();
    const created = Moment(date);
    const diff = Moment.duration(now.diff(created));

    const days = diff.days();
    const hours = diff.hours();
    const minutes = diff.minutes();
    const seconds = diff.seconds();

    if (days > 1) {
      return `${days}d ${hours}h ago`;
    }

    if (days === 1) {
      return hours > 0 ? `${days}d ${hours}h ago` : `${days}d ago`;
    }

    if (hours > 1) {
      return `${hours}h ${minutes}m ago`;
    }

    if (hours === 1) {
      return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
    }

    if (minutes > 1) {
      return `${minutes}m ago`;
    }

    if (minutes === 1) {
      return `${minutes}m ${seconds}s ago`;
    }

    return `${seconds}s ago`;
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (event) => {
    event.stopPropagation();
    setIsFocused(false);
  };

  const handle2xButtonClick = () => {
    const simulatedEvent = { target: { value: coHostAmount * 2 } };
    handleCoHostAmountChange(simulatedEvent);
  };

  const handleHalfXButtonClick = () => {
    const simulatedEvent = { target: { value: coHostAmount * 0.5 } };
    handleCoHostAmountChange(simulatedEvent);
  };

  const handleMaxButtonClick = () => {
    let maxValue;

    if (selectedTab === "PUMP") {
      maxValue = balance; // Use balance for PUMP
    } else if (selectedTab === "JEET") {
      const userHost = selectedRow?.hosts?.find((host) => host.host === user?._id);
      maxValue =
        userHost?.share / 100 * parseFloat(selectedRow?.user_bet || 0) || 0; // Use JEET logic
    }

    const simulatedEvent = { target: { value: maxValue } };
    handleCoHostAmountChange(simulatedEvent);
  };

  const handleUnstake = async (winnings, room_id, stakeAmount) => {
    setClosingRooms(prevState => ({
      ...prevState,
      [room_id]: true
    }));

    try {

      // Ensure winnings is a valid number
      const parsedWinnings = parseFloat(winnings);
      if (isNaN(parsedWinnings)) {
        console.error("Invalid winnings value", winnings);
        return; // Exit if winnings are invalid
      }

      // Ensure balance is a valid number (assuming 'balance' comes from Redux or props)
      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) {
        console.error("Invalid balance value", balance);
        return; // Exit if balance is invalid
      }

      // Perform unstake and update state
      await dispatch(unstake(room_id, stakeAmount));

      // Fetch updated games
      await dispatch(getMyGames({ game_type: 'All', status: 'open', sort: 'desc' }));

      // Add new transaction
      await dispatch(addNewTransaction({ amount: parsedWinnings, room_id }));

      const jim = parsedBalance + parsedWinnings;
      await dispatch(setBalance(jim));

    } catch (error) {
      console.error('Error unstaking from room:', error);
    } finally {
      setClosingRooms(prevState => ({
        ...prevState,
        [room_id]: false
      }));
    }
  };

  return (
    <div className={`${isDarkMode && !has_joined ? "dark_mode" : ""} ${!has_joined ? "big-modal" : "trade-container"}`}>
      {!has_joined && (
        <div className="modal-header">
          <h2 className="modal-title title">
            <ShowChartOutlined className="mr-2" />
            Trade
          </h2>
          <Button className="btn-close title" onClick={handleClose}>
            ×
          </Button>
        </div>
      )}
      <div className={` ${!has_joined ? "modal-body" : ""}`}>
        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          // {...this.state.selectedRow}
          />
        )}
        <div className="modal-content-wrapper"
        >
          {/* Timeframe Buttons */}
          {!has_joined && (
            <div className="glass-container" style={{ marginBottom: "15px", paddingBottom: "10px" }}>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)', // Default 1x4 on desktop
                  gap: 3,
                  marginBottom: '20px',
                  alignItems: 'center',
                  '@media (max-width: 600px)': {
                    gridTemplateColumns: 'repeat(2, 1fr)', // Change to 2x2 on mobile
                  },
                }}
              >
                {/* Liquidity Column */}
                <Box sx={{ textAlign: 'center' }}>
                  <Tooltip title={`Change: ${liquidityPercentageChange}%`} arrow>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        LIQUIDITY
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              liquidityPercentageChange > 0
                                ? '#fff'
                                : liquidityPercentageChange < 0
                                  ? 'red'
                                  : 'text.primary',
                            display: 'inline-flex',
                            alignItems: 'center',
                          }}
                        >
                          {liquidityPercentageChange === 0 && null}
                          {' '}{!selectedRow.winnings
                            ? parseFloat(selectedRow.user_bet)
                            : convertToCurrency(selectedRow.winnings)}
                          {liquidityPercentageChange > 0 && (
                            <TrendingUpOutlined sx={{ marginRight: 1, color: 'green' }} />
                          )}
                          {liquidityPercentageChange < 0 && (
                            <TrendingDownOutlined sx={{ marginRight: 1, color: 'red' }} />
                          )}
                        </Typography>
                      </Box>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Holders Column */}
                <Box sx={{ textAlign: 'center' }}>
                  <Tooltip
                    title={
                      <Box>
                        {selectedRow.hosts.map((host, index) => {
                          const percentage = totalShare > 0 ? ((host.share / totalShare) * 100).toFixed(2) : 0;
                          return (
                            <Typography key={index} variant="body2">
                              {index === 0 ? 'Dev' : `Co-Host ${index + 1}`}: {percentage}%
                            </Typography>
                          );
                        })}
                      </Box>
                    }
                    arrow
                  >
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        HOLDERS
                      </Typography>
                      <Typography variant="h6">{selectedRow.hosts.length}</Typography>
                    </Box>
                  </Tooltip>
                </Box>

                {/* Battles Column */}
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    BATTLES
                  </Typography>
                  <Typography variant="h6">
                    {selectedRow.battles ? selectedRow.battles : (selectedRow.game_log_list?.length || 0)}
                  </Typography>
                </Box>

                {/* Created By Column */}
                <Box sx={{ textAlign: 'center', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    CREATED BY
                  </Typography>
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
            </div>
          )}
          <div className="modal-content-panel" style={{ background: "rgba(170, 170, 170, 0.06)", borderRadius: "0.6em", marginBottom: "30px" }}>
            {/* Tabs */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <Button
                onClick={() => handleTabChange("PUMP")}
                variant={selectedTab === "PUMP" ? "contained" : "outlined"}
                color="secondary"
                style={{
                  marginRight: "15px",
                  minWidth: "120px",
                  padding: "10px 15px",
                  borderRadius: "8px",
                  textTransform: "none",
                  backgroundColor: selectedTab === "PUMP" ? "#28a745" : "transparent", // Green background when selected
                  color: selectedTab === "PUMP" ? "#fff" : "#28a745", // White text when selected
                  // boxShadow: selectedTab === "PUMP" ? "0px 4px 12px rgba(0, 255, 0, 0.2)" : "none",
                }}
              >
                PUMP
                <TrendingUpOutlined
                  style={{
                    color: "#fff",
                    marginLeft: "8px",
                    background: "linear-gradient(357deg, #00ff17, #28a745)",
                    padding: "2px",
                    borderRadius: "50%",
                    fontSize: "18px",
                  }}
                />
              </Button>

              <Button
                onClick={() => handleTabChange("JEET")}
                variant={selectedTab === "JEET" ? "contained" : "outlined"}
                color="secondary"
                style={{
                  minWidth: "120px",
                  padding: "10px 15px",
                  borderRadius: "8px",
                  textTransform: "none",
                  backgroundColor: selectedTab === "JEET" ? "#ff0000" : "transparent", // Red background when selected
                  color: selectedTab === "JEET" ? "#fff" : "#ff0000", // White text when selected
                  // boxShadow: selectedTab === "JEET" ? "0px 4px 12px rgba(255, 0, 0, 0.2)" : "none",
                }}
              >
                JEET
                <TrendingDownOutlined
                  style={{
                    color: "#fff",
                    marginLeft: "4px",
                    background: "linear-gradient(357deg, #ff0000, rgb(244 38 38))",
                    padding: "2px",
                    borderRadius: "50%",
                    fontSize: "18px",
                  }}
                />
              </Button>
            </div>
            <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
              <div className="input-amount" >
                <TextField
                  label="Amount"
                  value={coHostAmount || 0}
                  onChange={handleCoHostAmountChange}
                  pattern="^\\d*\\.?\\d*$"
                  variant="filled"
                  type="number"
                  autoComplete="off"
                  id="payout"
                  className="form-control"
                  InputProps={{
                    onFocus: handleFocus,
                    // onBlur: handleBlur,
                    endAdornment: (
                      <ButtonGroup
                        className={isButtonGroupVisible ? 'fade-in' : 'fade-out'}
                      // style={{ visibility: isButtonGroupVisible ? 'visible' : 'hidden' }}
                      >
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handle2xButtonClick}
                          style={{ marginRight: "5px", padding: "7.5px" }}
                        >
                          2x
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleHalfXButtonClick}
                          style={{ marginRight: "5px", padding: "7.5px" }}
                        >
                          1/2x
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleMaxButtonClick}
                          style={{ padding: "7.5px" }}

                        >
                          Max
                        </Button>
                      </ButtonGroup>
                    ),
                  }}
                />

                {has_joined && (
                  <>
                    {selectedTab === "PUMP" && (
                      <div
                        className="desktop-only"
                        style={{
                          paddingTop: "20px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          style={{ padding: "0 10px" }}
                          className="button-submit"
                          onClick={handleSendCoHost}
                        >
                          PUMP

                        </Button>
                      </div>
                    )}
                    {selectedTab === "JEET" && (
                      <div
                        className="desktop-only"
                        style={{
                          paddingTop: "20px",
                          display: "flex",
                          justifyContent: "center",
                        }}
                      >
                        <Button
                          style={{
                            padding: "0 10px",
                            background: "linear-gradient(357deg, #00ff17, #28a745)",
                          }}
                          className="btn-back"
                          onClick={() =>
                            handleUnstake(
                              selectedRow?.winnings ??
                              parseFloat(selectedRow?.user_bet || 0),
                              selectedRow?._id,
                              coHostAmount
                            )
                          }
                        >
                          JEET

                        </Button>
                      </div>
                    )}
                  </>

                )}
              </div>

            </div>


            {/* Balance Table Section */}
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>BALANCE:</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>{convertToCurrency(balance)}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CURRENT BANKROLL:</TableCell>
                  <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                    {selectedRow ? convertToCurrency(selectedRow.user_bet) : null}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>CURRENT SHARE:</TableCell>
                  <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                    {Array.isArray(selectedRow.hosts) &&
                      selectedRow.hosts.length > 0 &&
                      selectedRow.hosts.some((host) => host.host === user?._id) ? (
                      <>
                        {
                          (() => {
                            const userHost = selectedRow.hosts.find((host) => host.host === user._id);
                            if (userHost) {
                              return <>{userHost.share.toFixed(2)}% ({convertToCurrency(userHost.share / 100 * parseFloat(selectedRow.user_bet))})</>;
                            } else {
                              return convertToCurrency(0); // In case the host is not found, fallback to 0
                            }
                          })()
                        }
                      </>
                    ) : convertToCurrency(0)}
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>NEW SHARE:</TableCell>
                  <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                    {(() => {
                      if (!selectedRow || !Array.isArray(selectedRow.hosts)) return "0%";

                      const userHost = user && selectedRow?.hosts?.find((host) => host.host === user._id);
                      const userStake = userHost ? parseFloat(userHost.stake) : 0; // User's current stake

                      const coHostAmountFloat = parseFloat(coHostAmount || 0);
                      const currentBankroll = parseFloat(selectedRow.user_bet || 0);

                      // Deduct 2.5% fee (same logic as backend)
                      const fee = coHostAmountFloat * 0.025;
                      const amountAfterFee = coHostAmountFloat - fee;

                      // Total bankroll before adding new contribution
                      const totalBankroll = currentBankroll;

                      if (totalBankroll === 0) return "0%"; // Prevent division by zero

                      // Calculate total stake including new user's stake (after fee)
                      const totalStakeIncludingUser = selectedRow.hosts.reduce((total, host) => {
                        return total + parseFloat(host.stake);
                      }, 0) + amountAfterFee; // Total stake + user's amountAfterFee

                      // Calculate the user's new stake (including the co-host amount)
                      const newUserStake = userStake + amountAfterFee;

                      // Calculate new share for the user if they were to buy
                      const newUserShareBuy = (newUserStake / totalStakeIncludingUser) * 100;

                      // Calculate the amount user currently owns in the bankroll
                      const userCurrentShareAmount = userHost && !isNaN(userHost.share) && !isNaN(selectedRow.user_bet)
                        ? (userHost.share / 100) * parseFloat(selectedRow.user_bet)
                        : 0;
                      // Calculate the user's new stake after selling (they will lose `amountAfterFee`)
                      const newUserStakeAfterSell = userCurrentShareAmount - amountAfterFee;

                      // Calculate the new share for the user after selling the co-host amount
                      const newUserShareSell = (newUserStakeAfterSell / totalBankroll) * 100;

                      // Fix for minor discrepancies (to ensure the share doesn't go slightly over 100% due to rounding)
                      const buyShare = `${Math.min(newUserShareBuy.toFixed(2), 100).toString()}%`;
                      const sellShare = newUserStakeAfterSell > 0
                        ? `${Math.min(newUserShareSell.toFixed(2), 100).toString()}%`
                        : "0%"; // Prevent division by zero in sell calculation

                      // Return share based on selected tab
                      return selectedTab === "PUMP" ? `~${buyShare}` : `~${sellShare}`;
                    })()}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Chart
              options={chartOptions}
              series={[{ data: chartData }]}
              type="candlestick"
              height={350}
            />
          </div>
          {!has_joined && (
            <div style={{ background: "rgba(170, 170, 170, 0.06)", borderRadius: "20px", marginBottom: "30px" }}>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell
                      style={{
                        textAlign: 'left',
                        paddingLeft: '40px',
                        textTransform: 'uppercase',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        fontSize: '14px',  // Smaller font for mobile
                        minWidth: '120px'   // Ensure it fits well on small screens
                      }}
                    >
                      Description
                    </TableCell>
                    <TableCell
                      style={{
                        textAlign: 'center',
                        textTransform: 'uppercase',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        fontSize: '14px',
                        minWidth: '100px'
                      }}
                    >
                      Amount
                    </TableCell>
                    <TableCell
                      style={{
                        textAlign: 'right',
                        textTransform: 'uppercase',
                        paddingRight: '40px',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                        fontSize: '14px',
                        minWidth: '120px'
                      }}
                    >
                      Date
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction, index) => {
                      // Check if description contains any of the keywords
                      let descriptionText = transaction.description || '';
                      if (descriptionText.toLowerCase().includes('joined')) {
                        descriptionText = 'Bet';
                      } else if (descriptionText.toLowerCase().includes('created')) {
                        descriptionText = 'Created';
                      } else if (descriptionText.toLowerCase().includes('pumped')) {
                        descriptionText = 'Pumped';
                      } else if (descriptionText.toLowerCase().includes('jeeted')) {
                        descriptionText = 'Jeeted';
                      } else {
                        // Skip transaction if no keyword is found
                        return null; // Skip rendering this row
                      }

                      return (
                        <TableRow key={index}>
                          <TableCell style={{ textAlign: 'left', paddingLeft: '40px' }}>{descriptionText}</TableCell>
                          <TableCell style={{ textAlign: 'center' }}>{convertToCurrency(transaction.amount)}</TableCell>
                          <TableCell style={{ textAlign: 'right', paddingRight: '40px' }}>
                            {formatRelativeTime(transaction.created_at)} {/* Format time */}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} align="center">No transactions available</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className={`modal-footer ${has_joined ? 'mobile-only' : ''}`}>
        <Button className="btn-submit" onClick={handleSendCoHost}>
          PUMP
          <TrendingUpOutlined style={{ color: "#fff", marginLeft: "8px" }} />
        </Button>
        <Button
          className="btn-submit"
          onClick={() =>
            handleUnstake(
              selectedRow?.winnings ?? parseFloat(selectedRow?.user_bet || 0), // Use winnings if available, otherwise fallback
              selectedRow?._id,
              coHostAmount
            )
          }
          style={{ marginLeft: "10px", border: "unset", background: "linear-gradient(357deg, #00ff17, #28a745)", boxShadow: "rgb(37 184 65) 0px -0.5px 0px, rgb(34, 117, 52) 0px -3px inset, rgb(80, 191, 98) 0px 2px inset" }}
        >
          JEET
          <TrendingDownOutlined style={{ color: "#fff", marginLeft: "4px" }} />
        </Button>
      </div>

    </div >


  );

}



export default CoHostModal;