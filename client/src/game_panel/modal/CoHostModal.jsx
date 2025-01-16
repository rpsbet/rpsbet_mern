import React, { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Moment from 'moment';
import { getTransactionCandles, unstake, addNewTransaction, addNewCandle, getMyGames } from '../../redux/Logic/logic.actions';
import { setBalance } from '../../redux/Auth/user.actions'
import Chart from "react-apexcharts";
import { Box, Tooltip, Typography, Button, TextField, TableHead, Table, TableBody, TableCell, TableRow, ButtonGroup } from "@material-ui/core";
import { ShowChartOutlined, TrendingUpOutlined, TrendingDownOutlined } from "@mui/icons-material";
import { convertToCurrency } from '../../util/conversion';
import Avatar from '../../components/Avatar';
import PlayerModal from '../modal/PlayerModal';
import { debounce } from 'lodash';

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
  const [localCoHostAmount, setLocalCoHostAmount] = useState(0.01);
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
    if (selectedRow?._id && has_joined && !input_only) {
      console.log(selectedRow?._id, has_joined, !input_only)
      dispatch(getTransactionCandles({ roomId: selectedRow._id, timeFrame }));
    }
  }, [dispatch, selectedRow?._id, timeFrame]);

  useEffect(() => {
    if (selectedRow && selectedRow._id && socket) {
      const roomId = selectedRow._id;
      const candleEvent = `NEW_CANDLE_${roomId}`;

      const handleNewCandle = (data) => {
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
      animations: {
        enabled: false, // Disable animations
      },
    },
    xaxis: {
      type: 'datetime',
      labels: {
        datetimeUTC: false,
        rotate: -45,
        formatter: (value, timestamp) => {
          if (value === chartData[0]?.x) {
            return Moment(chartData[0]?.startTime).format('HH:mm'); // Oldest candle
          }
          if (value === chartData[chartData.length - 1]?.x) {
            return Moment(chartData[chartData.length - 1]?.startTime).format('HH:mm'); // Most recent candle
          }
          return ''; // Empty labels for other ticks
        },
        style: {
          colors: '#fff',
          fontSize: '12px',
          fontFamily: 'Arial, Helvetica, sans-serif',
          fontWeight: 400,
        },
      },
      tickAmount: 2, // Only two ticks: oldest and most recent candles
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
          <div><strong>Time:</strong> ${Moment(candle.startTime).format('HH:mm')}</div>
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
  
  // Populate chart data and remove gaps between candles
  if (transactionCandles && transactionCandles.length > 0) {
    transactionCandles.forEach((candle, index) => {
      chartData.push({
        x: index, // Sequential index to remove gaps
        y: [candle.open, candle.high, candle.low, candle.close],
        startTime: candle.startTime, // Keep startTime for tooltip and reference
      });
    });
  
    // Validate the candles for debugging
    chartData.forEach((candle, index) => {
      if (!candle.y || candle.y.length !== 4) {
        console.error(`Invalid candle structure at index ${index}:`, candle);
      }
    });
  } else {
    console.warn("No candles available to display.");
  }
  
  // X-axis labelling logic
  chartOptions.xaxis.labels.formatter = (value, timestamp) => {
    if (value === 0) {
      return Moment(chartData[0]?.startTime).format('HH:mm'); // Oldest candle
    }
    if (value === chartData.length - 1) {
      return Moment(chartData[chartData.length - 1]?.startTime).format('HH:mm'); // Most recent candle
    }
    return ''; // Empty labels for other ticks
  };

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


  const debouncedHandleChange = useCallback(
    debounce((value) => {
      handleCoHostAmountChange({ target: { value } });
    }, 300), // Adjust the delay in milliseconds (e.g., 300ms)
    []
  );

  const handleInputChange = (event) => {
    const value = event.target.value;
    setLocalCoHostAmount(value); // Update local state immediately for UX
    debouncedHandleChange(value); // Trigger the debounced handler
  };

  const debouncedHandleButtonClick = useCallback(
    debounce((value) => {
      handleCoHostAmountChange({ target: { value } });
    }, 300), // Adjust delay as needed
    []
  );

  const handleButtonClick = (value) => {
    setLocalCoHostAmount(value); // Update local state immediately for visual feedback
    debouncedHandleButtonClick(value); // Trigger the debounced handler
  };

  const handleUnstake = async (winnings, room_id, stakeAmount) => {
    setClosingRooms(prevState => ({
      ...prevState,
      [room_id]: true
    }));

    try {

      const parsedWinnings = parseFloat(winnings);
      if (isNaN(parsedWinnings)) {
        console.error("Invalid winnings value", winnings);
        return; // Exit if winnings are invalid
      }

      const parsedBalance = parseFloat(balance);
      if (isNaN(parsedBalance)) {
        console.error("Invalid balance value", balance);
        return; // Exit if balance is invalid
      }

      await dispatch(unstake(room_id, stakeAmount));
      await dispatch(getMyGames({ game_type: 'All', status: 'open', sort: 'desc' }));
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
    <div className={`${isDarkMode && !has_joined ? "dark_mode" : ""} ${(!has_joined && !input_only) ? "big-modal" : "trade-container"}`}>
      {!input_only && !has_joined && (
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
      <div className={` ${!has_joined && !input_only ? "modal-body" : ""}`}>
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
          {!input_only && !has_joined && (
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
                            : convertToCurrency(selectedRow.winnings, solPrice)}
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

                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                    BATTLES
                  </Typography>
                  <Typography variant="h6">
                    {selectedRow.battles ? selectedRow.battles : (selectedRow.game_log_list?.length || 0)}
                  </Typography>
                </Box>

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
          <div className="modal-content-panel" style={{ background: "rgba(170, 170, 170, 0.06)", borderRadius: "0.3em", marginBottom: "15px" }}>
            {/* Tabs */}
            {!has_joined && (
              <>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "5px" }}>
                  <Button
                    onClick={() => handleTabChange("PUMP")}
                    variant={selectedTab === "PUMP" ? "contained" : "outlined"}
                    color="secondary"
                    style={{
                      marginRight: "10px",
                      width: "100%",
                      padding: "10px 15px",
                      textTransform: "none",
                      backgroundColor: selectedTab === "PUMP" ? "#28a745" : "transparent",
                      color: selectedTab === "PUMP" ? "#fff" : "#28a745",
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
                      width: "100%",
                      padding: "10px 15px",
                      borderRadius: "0.3em",
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
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div className="bet-amount" style={{ width: "100%" }}>
                    {/* Button Group Positioned Above */}
                    <div
                      style={{
                        display: "flex",
                        marginBottom: "5px",
                        width: "100%",
                        gap: "5px", // Add spacing between buttons
                      }}
                    >
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleButtonClick(0.01)} // Set coHostAmount to 0.01
                        style={{ flex: 1, padding: "7.5px" }}
                      >
                        0.01
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleButtonClick(0.1)} // Set coHostAmount to 0.1
                        style={{ flex: 1, padding: "7.5px" }}
                      >
                        0.1
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleButtonClick(1)} // Set coHostAmount to 1
                        style={{ flex: 1, padding: "7.5px" }}
                      >
                        1
                      </Button>

                    </div>

                    {/* TextField Positioned Below */}
                    <TextField
                      value={localCoHostAmount}
                      onChange={handleInputChange}
                      variant="filled"
                      pattern="^\\d*\\.?\\d*$"
                      type="number"
                      autoComplete="off"
                      id="betamount"
                      style={{ width: '100%' }}
                    />
                    {/* Pump/Jeet Buttons Positioned Below TextField */}
                    {input_only && (
                      <>
                        {selectedTab === "PUMP" && (
                          <div
                            style={{
                              marginTop: "10px",
                              width: "100%",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              style={{
                                width: "100%",
                                padding: "10px",
                                border: "2px solid rgb(0, 255, 58)", // Green border
                                backgroundColor: "rgba(0, 255, 58, 0.1)", // Green background with opacity
                                color: "rgb(0, 255, 58)", // Green font color
                                fontWeight: "bold", // Optional for emphasis
                              }}
                              className="button-submit"
                              onClick={handleSendCoHost}
                            >
                              PUMP
                            </Button>
                          </div>
                        )}
                        {selectedTab === "JEET" && (
                          <div
                            style={{
                              marginTop: "10px",
                              width: "100%",
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <Button
                              style={{
                                width: "100%",
                                padding: "10px",
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
                    {!input_only && (
                      <>
                        <TableRow>
                          <TableCell>BALANCE:</TableCell>
                          <TableCell style={{ textAlign: 'right' }}>{convertToCurrency(balance, solPrice)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>CURRENT BANKROLL:</TableCell>
                          <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                            {selectedRow ? convertToCurrency(selectedRow.user_bet, solPrice) : null}
                          </TableCell>
                        </TableRow>
                      </>

                    )}

                    <TableRow>
                      <TableCell>BEFORE:</TableCell>
                      <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                        {Array.isArray(selectedRow.hosts) &&
                          selectedRow.hosts.length > 0 &&
                          selectedRow.hosts.some((host) => host.host === user?._id) ? (
                          <>
                            {
                              (() => {
                                const userHost = selectedRow.hosts.find((host) => host.host === user._id);
                                if (userHost) {
                                  return <>{userHost.share.toFixed(2)}% ({convertToCurrency(userHost.share / 100 * parseFloat(selectedRow.user_bet), solPrice)})</>;
                                } else {
                                  return convertToCurrency(0, solPrice); // In case the host is not found, fallback to 0
                                }
                              })()
                            }
                          </>
                        ) : convertToCurrency(0, solPrice)}
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>AFTER:</TableCell>
                      <TableCell style={{ color: "#ff8500", textAlign: 'right' }}>
                        {(() => {
                          if (!selectedRow || !Array.isArray(selectedRow.hosts)) return "0%";

                          const userHost = user && selectedRow?.hosts?.find((host) => host.host === user._id);
                          const userStake = userHost ? parseFloat(userHost.stake) : 0;
                          const coHostAmountFloat = parseFloat(coHostAmount || 0);
                          const currentBankroll = parseFloat(selectedRow.user_bet || 0);
                          const fee = coHostAmountFloat * 0.025;
                          const amountAfterFee = coHostAmountFloat - fee;
                          const totalBankroll = currentBankroll;

                          if (totalBankroll === 0) return "0%";

                          const totalStakeIncludingUser = selectedRow.hosts.reduce((total, host) => {
                            return total + parseFloat(host.stake);
                          }, 0) + amountAfterFee;

                          const newUserStake = userStake + amountAfterFee;
                          const newUserShareBuy = (newUserStake / totalStakeIncludingUser) * 100;
                          const userCurrentShareAmount = userHost && !isNaN(userHost.share) && !isNaN(selectedRow.user_bet)
                            ? (userHost.share / 100) * parseFloat(selectedRow.user_bet)
                            : 0;
                          const newUserStakeAfterSell = userCurrentShareAmount - amountAfterFee;
                          const newUserShareSell = (newUserStakeAfterSell / totalBankroll) * 100;
                          const buyShare = `${Math.min(newUserShareBuy.toFixed(2), 100).toString()}%`;
                          const sellShare = newUserStakeAfterSell > 0
                            ? `${Math.min(newUserShareSell.toFixed(2), 100).toString()}%`
                            : "0%";
                          return selectedTab === "PUMP" ? `~${buyShare}` : `~${sellShare}`;
                        })()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </>

            )}
            {!input_only && (

              <Chart
                options={chartOptions}
                series={[{ data: chartData }]}
                type="candlestick"
                height={350}
              />
            )}

          </div>
          {!has_joined && !input_only && (
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
                        fontSize: '14px',
                        minWidth: '120px'
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
                          <TableCell style={{ textAlign: 'center' }}>{convertToCurrency(transaction.amount, solPrice)}</TableCell>
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
      {!input_only && (

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
      )}

    </div >


  );

}



export default CoHostModal;