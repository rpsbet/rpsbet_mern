import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Moment from 'moment';
import { getTransactionCandles } from '../../redux/Logic/logic.actions';
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
  getTransactionCandles,
  transactionCandles,
  transactions
}) {
  const [timeFrame, setTimeFrame] = useState('1m'); // Default to 1 minute
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  const [isFocused, setIsFocused] = useState(false);
  const [isButtonGroupVisible, setIsButtonGroupVisible] = useState(false);
  
  useEffect(() => {
    if (isFocused) {
      setIsButtonGroupVisible(true);
    } else {
      const timeoutId = setTimeout(() => {
        setIsButtonGroupVisible(false);
      }, 0); // Adjust the timeout value as needed
      return () => clearTimeout(timeoutId);
    }
  }, [isFocused]);

  const convertToChartCurrency = (input) => {
    let number = Number(input);

    if (!isNaN(number)) {
      // Round the number down
      number = Math.floor(number * 100) / 100;

      // Format number for K (thousands) and M (millions)
      let formattedNumber = '';
      if (number >= 1000000 || number <= -1000000) {
        // For millions
        formattedNumber = (number / 1000000).toFixed(1) + 'M';
      } else if (number >= 1000 || number <= -1000) {
        // For thousands
        formattedNumber = (number / 1000).toFixed(1) + 'K';
      } else {
        // For numbers less than 1000
        let [whole, decimal] = number.toFixed(2).split('.');
        whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        if (decimal) {
          decimal = decimal.replace(/0+$/, '');
        }

        formattedNumber = decimal ? `${whole}.${decimal}` : whole;
      }

      return formattedNumber; // Return just the string without SVG
    } else {
      return input.toString(); // Return the original input if not a valid number
    }
  };

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

  useEffect(() => {
    if (selectedRow?._id) {
      getTransactionCandles({ roomId: selectedRow?._id, timeFrame: timeFrame });
    }
  }, [getTransactionCandles, selectedRow?._id, timeFrame]);
  let chartData = [];
  if (transactionCandles.length > 0) {
    let lastCandle = transactionCandles[0];

    chartData.push({
      x: new Date(lastCandle.startTime).getTime(), // Convert to timestamp
      y: [lastCandle.open, lastCandle.high, lastCandle.low, lastCandle.close],
    });

    for (let i = 1; i < transactionCandles.length; i++) {
      const currentCandle = transactionCandles[i];

      const timeDiff = currentCandle.startTime - lastCandle.startTime;

      if (timeDiff > 60000) {  // More than 1 minute gap
        const missingCandlesCount = timeDiff / 60000; // Number of missing minutes

        for (let j = 1; j < missingCandlesCount; j++) {
          const missingTime = new Date(lastCandle.startTime).getTime() + j * 60000;

          const gapCandle = {
            x: missingTime, // Timestamp for missing candle
            y: [
              lastCandle.close,
              lastCandle.close,
              lastCandle.close,
              lastCandle.close,
            ]
          };
          chartData.push(gapCandle);  // Add the gap candle to chart data
        }
      }

      chartData.push({
        x: new Date(currentCandle.startTime).getTime(), // Convert to timestamp
        y: [currentCandle.open, currentCandle.high, currentCandle.low, currentCandle.close],
      });

      lastCandle = currentCandle;
    }

    const now = new Date();
    const lastTime = new Date(lastCandle.startTime);
    const timeDiff = Math.floor((now - lastTime) / 60000); // Calculate minutes remaining
    for (let j = 1; j <= timeDiff; j++) {
      const missingTime = new Date(lastCandle.startTime).getTime() + j * 60000;
      const gapCandle = {
        x: missingTime,
        y: [
          lastCandle.close,
          lastCandle.close,
          lastCandle.close,
          lastCandle.close,
        ]
      };
      chartData.push(gapCandle);
    }
  }

  let text = "";
  if (selectedRow.index) {
    text = `${selectedRow.game_type.short_name}-${selectedRow.index}`
  } else {
    text = `${selectedRow.room_name}`
  }
  // Chart options
  const chartOptions = {
    chart: {
      type: 'candlestick', // Candlestick chart type
      height: 350,
      zoom: {
        enabled: true,
        type: 'x',
        resetIcon: {
          size: 30,
          offsetX: 0,
          offsetY: 0,
          fillColor: '#fff', // Reset icon color
          shape: 'circle',
        },
      },
      toolbar: {
        autoSelected: 'zoom', // Auto select zoom tool
        show: false, // Hide the toolbar for a cleaner look
      },
    },
    title: {
      text: text,
      align: 'center',
      style: {
        fontSize: '18px',
        color: '#fff', // Title color set to white
        fontWeight: 600,
        fontFamily: 'Arial, Helvetica, sans-serif', // Set professional font family
      },
    },
    xaxis: {
      type: 'datetime', // Treat x-axis as datetime
      labels: {
        datetimeUTC: false, // Use local time
        rotate: -45,
        format: 'HH:mm',
        style: {
          colors: '#fff', // Axis label text color set to white
          fontSize: '12px', // Axis label font size
          fontFamily: 'Arial, Helvetica, sans-serif', // Axis label font family
          fontWeight: 400,
        },

      },
      tickAmount: 10,
      axisBorder: {
        show: true,
        color: '#fff', // Axis border color set to white
        height: 1, // Thin border for a cleaner look
      },
      axisTicks: {
        show: true,
        color: '#fff', // Tick marks color set to white
      },
    },
    yaxis: {
      tooltip: {
        enabled: false,
      },
      labels: {
        style: {
          colors: '#fff', // Y-axis label text color set to white
          fontSize: '12px', // Y-axis label font size
          fontFamily: 'Arial, Helvetica, sans-serif', // Y-axis label font family
          fontWeight: 400,
        },
        formatter: function (value) {
          const result = convertToChartCurrency(value); // Get result from convertToCurrency

          // Check if it's a string (for cases like "$123")
          if (typeof result === 'string') {
            return result; // Return the string directly if it's a string
          }

          // If it's an SVG or other object, handle it differently:
          return ''; // You could potentially use a placeholder or empty string here
        },
      },
    },
    tooltip: {
      custom: function ({ series, seriesIndex, dataPointIndex, w }) {
        // Get the data from the chartData
        const candle = chartData[dataPointIndex]; // Retrieve the candle for the given index
        if (!candle || !candle.y || candle.y.length !== 4) {
          console.error("Invalid candle data:", candle);
          return '';
        }

        const timestamp = candle.x; // Get the timestamp (x-value)
        const [open, high, low, close] = candle.y; // Destructure the open, high, low, and close values

        // Format the time (timestamp) and the price values
        const formattedTime = Moment(timestamp).format('HH:mm'); // Format timestamp to 'HH:mm' format
        const formattedOpen = convertToChartCurrency(open); // Format the open value
        const formattedHigh = convertToChartCurrency(high); // Format the high value
        const formattedLow = convertToChartCurrency(low); // Format the low value
        const formattedClose = convertToChartCurrency(close); // Format the close value

        // Return the custom tooltip HTML
        return (
          `<div class="chart-tooltip">
            <div><strong>Time:</strong> ${formattedTime}</div>
            <div><strong>Open:</strong> ${formattedOpen}</div>
            <div><strong>High:</strong> ${formattedHigh}</div>
            <div><strong>Low:</strong> ${formattedLow}</div>
            <div><strong>Close:</strong> ${formattedClose}</div>
          </div>`
        );
      }
    },
    scrollbar: {
      enabled: true, // Enable scrollbar for better navigation
      height: 8, // Set height of scrollbar
      trackColor: '#444', // Darker track for scrollbar
      handleColor: '#fff', // Scrollbar handle color set to white
    },
    plotOptions: {
      candlestick: {
        colors: {
          upward: '#00b140', // Color for upward candles
          downward: '#ff4b4b', // Color for downward candles
        },
        wick: {
          useFillColor: true, // Use the fill color for the wicks as well
          color: '#fff', // Wick color set to white for consistency
        },
      },
    },
    stroke: {
      width: 1,
      curve: 'smooth',
      colors: ['#008FFB'], // Stroke color for line/graph elements
    },
    grid: {
      borderColor: '#444', // Grid line color set to a darker shade for contrast
      strokeDashArray: 4, // Dashed grid lines for a more elegant look
    },
    colors: ['#008FFB', '#00b140', '#ff4b4b'], // Color palette for various chart elements
    theme: {
      mode: isDarkMode ? 'dark' : 'light', // Dynamic theme based on the mode
      palette: 'palette1', // Default palette for the chart
    },
  };
const totalShare = Array.isArray(selectedRow.hosts)
          ? selectedRow.hosts.reduce((acc, host) => acc + host.share, 0)
          : 0;

  const formatRelativeTime = (date) => {
    const now = Moment();
    const created = Moment(date);
    const diff = Moment.duration(now.diff(created));

    const days = diff.days();
    const hours = diff.hours();
    return `${days}d ${hours}h ago`;
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
    const simulatedEvent = { target: { value: balance } };
    handleCoHostAmountChange(simulatedEvent);
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
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 3,
                  marginBottom: '20px',
                  alignItems: 'center',
                }}
              >
                {/* Liquidity Column */}
                <Box sx={{ textAlign: 'center' }}>
                  <Tooltip title={`Change: ${liquidityPercentageChange}%`} arrow>
                    <Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                        LIQUIDITY
                      </Typography>
                      <Typography variant="h6">{!selectedRow.winnings ? parseFloat(selectedRow.user_bet) : convertToCurrency(selectedRow.winnings)}</Typography>
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
                              Host {index + 1}: {percentage}%
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
                  <Typography variant="h6">{selectedRow.battles ? selectedRow.battles : selectedRow.game_log_list.length}</Typography>
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
          <div className="modal-content-panel" style={{ background: "rgba(170, 170, 170, 0.06)", borderRadius: "20px", marginBottom: "30px" }}>
            <Chart
              options={chartOptions}
              series={[{ data: chartData }]}
              type="candlestick"
              height={350}
            />
            <div className="input-amount">
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
            </div>

            {/* Balance Table Section */}
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>BALANCE:</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>{convertToCurrency(balance)}</TableCell>
                </TableRow>
                {/* <TableRow>
                  <TableCell>NEW BALANCE:</TableCell>
                  <TableCell style={{ textAlign: 'right' }}>
                    {convertToCurrency((balance || 0) - (coHostAmount || 0))}
                    &nbsp;
                    {((balance || 0) - (coHostAmount || 0)) < 0 && <Warning width="15pt" />}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>CURRENT BANKROLL:</TableCell>
                  <TableCell style={{ color: "#ffb000", textAlign: 'right' }}>
                    {selectedRow ? convertToCurrency(selectedRow.user_bet) : null}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>NEW BANKROLL:</TableCell>
                  <TableCell style={{ color: "#ffb000", textAlign: 'right' }}>
                    {selectedRow
                      ? convertToCurrency(parseFloat(selectedRow.user_bet) + parseFloat(coHostAmount || 0))
                      : null}
                  </TableCell>
                </TableRow>*/}
                <TableRow>
                <TableCell>CURRENT SHARE:</TableCell>
                <TableCell style={{ color: "red", textAlign: 'right' }}>
                  {Array.isArray(selectedRow.hosts) && selectedRow.hosts.some((host) => host.host === user._id)
                    ? `${selectedRow.hosts.find((host) => host.host === user._id).share.toFixed(2)}%`
                    : convertToCurrency("0")}
                </TableCell>
              </TableRow>

              <TableRow>
                <TableCell>NEW SHARE:</TableCell>
                <TableCell style={{ color: "red", textAlign: 'right' }}>
                  {(() => {
                    const host = Array.isArray(selectedRow.hosts) ? selectedRow.hosts.find((host) => host.host === user._id) : null;
                    const currentShare = host ? host.share : 0;
                    const currentBankroll = parseFloat(selectedRow?.user_bet || 0);
                    const newShare =
                      (((currentShare / 100) * currentBankroll + coHostAmount) / (currentBankroll + coHostAmount)) *
                      100;
                    return `${newShare.toFixed(2)}%`;
                  })()}
                </TableCell>
              </TableRow>
              </TableBody>
            </Table>
          </div>

          {!has_joined && (
            <div style={{ background: "rgba(170, 170, 170, 0.06)", borderRadius: "20px", marginBottom: "30px" }}>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell style={{ textAlign: 'left', paddingLeft: '40px', textTransform: 'uppercase' }}>Description</TableCell>
                    <TableCell style={{ textAlign: 'center', textTransform: 'uppercase' }}>Amount</TableCell>
                    <TableCell style={{ textAlign: 'right', textTransform: 'uppercase', paddingRight: '40px' }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length > 0 ? (
                    transactions.map((transaction, index) => {
                      // Check if description contains any of the keywords
                      let descriptionText = transaction.description;
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
      <div className="modal-footer">
        <Button className="btn-submit" onClick={handleSendCoHost}>
          PUMP
          <TrendingUpOutlined style={{ color: "#fff", marginLeft: "8px" }} />
        </Button>
        <Button className="btn-back" onClick={handleClose} style={{ border: "unset", background: "linear-gradient(357deg, #00ff17, #28a745)" }}>
          JEET
          <TrendingDownOutlined style={{ color: "#fff", marginLeft: "4px" }} />
        </Button>
      </div>
    </div >
  );
}

const mapStateToProps = state => ({
  transactionCandles: state.logic.candles,
  transactions: state.logic.transactions,
});

export default connect(mapStateToProps, { getTransactionCandles })(CoHostModal);