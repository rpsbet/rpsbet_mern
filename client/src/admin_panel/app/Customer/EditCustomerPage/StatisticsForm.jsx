import React from 'react';
import ReactApexChart from 'react-apexcharts';
import moment from 'moment';
import { 
  FormControl, 
  MenuItem, 
  Select, 
  Button, 
  Tooltip, 
  Table, 
  TableBody, 
  TableCell, 
  TableRow 
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import LinkIcon from '@mui/icons-material/Link';
import { convertToCurrency } from '../../../../util/conversion';

function generateData(gameLogList) {
  const series = [];
  let totalProfit = 0;
  gameLogList &&
    gameLogList.forEach((log, index) => {
      totalProfit += log.net_profit;
      series.push({ x: `${Number(index) + 1}`, y: totalProfit });
    });
  return series;
}

class StatisticsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      room_info: null,
      loaded: true,
      showButton: false,
      creditScore: props.creditScore || 0,
      hexagon: null,
      url: '',
      roomName: '',
      roomId: '',
      rank: ''
    };
  }

  async componentDidMount() {
    const { creditScore } = this.props;
    if (creditScore !== undefined) {
      await this.updateHexagon(creditScore);
    }
  }

  async componentDidUpdate(prevProps) {
    const { creditScore } = this.props;
    if (creditScore !== prevProps.creditScore) {
      await this.updateHexagon(creditScore);
    }
  }

  async updateHexagon(creditScore) {
    if (typeof creditScore === 'number') {
      const hexagon = await this.renderProgressHexagon(creditScore);
      this.setState({ creditScore, hexagon });
    }
  }

  calculateDashOffset(creditScore) {
    if (typeof creditScore !== 'number') return NaN;
    const scalingFactor = 390 / (2000 - 900);
    const invertedScore = 2000 - creditScore;
    return invertedScore * scalingFactor;
  }

  getHexagonColor(creditScore) {
    if (creditScore < 1000) {
      return 'red';
    } else if (creditScore === 1000) {
      return 'white';
    } else {
      return 'green';
    }
  }

  renderProgressHexagon(creditScore) {
    if (typeof creditScore !== 'number') return null;
    const dashOffset = this.calculateDashOffset(creditScore);
    return (
      <polygon
        points="60,15 105,40 105,80 60,105 15,80 15,40"
        className={`progress-hexagon ${this.getHexagonColor(creditScore)}`}
        style={{ strokeDashoffset: dashOffset }}
      />
    );
  }

  handleActorTypeChange = event => {
    this.props.onDropdownChange('actorType', event.target.value);
  };

  handleGameTypeChange = event => {
    this.setState({ gameType: event.target.value });
    this.props.onDropdownChange('gameType', event.target.value);
  };

  handleTimeTypeChange = event => {
    this.setState({ timeType: event.target.value });
    this.props.onDropdownChange('timeType', event.target.value);
  };

  getRank(totalWagered) {
    const level = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
    const nextLevelWager = Math.pow(2, 1.2 * (level)) - 1;
    const progress = totalWagered / nextLevelWager;
    const progressBarWidth = 100;
    const roundedProgress = (progress * progressBarWidth).toFixed(2);
    const remainingProgress = progressBarWidth - roundedProgress;
    const rank = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
    const rankPlusOne = rank + 1;

    return (
      <div>
        <div className="progress-bar-outer" style={{ width: `${progressBarWidth}px`, position: 'relative' }}>
          <div className="progress-bar-filled" style={{ width: `${roundedProgress}%` }}>
            <div className="progress-label progress-label-left">{`${roundedProgress}%`}</div>
          </div>
          <div className="progress-bar-remaining" style={{ width: `${remainingProgress}%` }}>
            <div className="progress-label progress-label-right">{`${remainingProgress}%`}</div>
          </div>
        </div>
        <div className="rank-indicators">
          <div className="rank-minus-one">{`${rank}`}</div>
          <div className="rank-plus-one">{`${rankPlusOne}`}</div>
        </div>
      </div>
    );
  }


  getRoomLink(dataPointIndex) {
    const gameLog = this.props.gameLogList[dataPointIndex];
    const roomId = gameLog.room_id;
    const roomName = gameLog.game_id;
    if (roomId === this.state.roomId) {
      return;
    }

    setTimeout(() => {
      this.setState({
        roomId,
        url: `/join/${roomId}`,
        roomName: roomName
      });
    }, 1000);

    this.handleTooltipToggle();
  }

  handleTooltipToggle = () => {
    this.setState({ showButton: true });
  };


  render() {
    const gameLogList = this.props.gameLogList;
    const options = {
      chart: {
        background: '#424242',
        type: 'area',
        stacked: false,
        toolbar: {
          show: true,
          tools: {
            download: false
          }
        },

        pan: {
          enabled: true,
          type: 'x'
        },
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        events: {
          dataPointSelection: this.dataPointSelection
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: true,
          opacityFrom: 0.7,
          opacityTo: 0.9,
          colorStops: [
            {
              offset: 0,
              color: '#ff8500',
              opacity: 1
            },
            {
              offset: 20,
              color: '#ff550a',
              opacity: 1
            },
            {
              offset: 60,
              color: '#dd1e30',
              opacity: 1
            },
            {
              offset: 100,
              color: '#ef38d0',
              opacity: 1
            }
          ]
        }
      },
      stroke: {
        width: 5,
        curve: 'smooth'
      },
      theme: {
        mode: 'dark'
      },
      dataLabels: {
        enabled: false
      },
      animations: {
        enabled: false
      },
      yaxis: {
        labels: {
          formatter: function (value) {
            const convertToCurrency = (input, solPrice) => {
              let number = Number(input * solPrice);
              if (!isNaN(number)) {
                let [whole, decimal] = number
                  .toFixed(2)
                  .toString()
                  .split('.');
                whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return `${whole}.${decimal}`;
              } else {
                return input;
              }
            };

            return convertToCurrency(value);
          }
        }
      },
      xaxis: {
        forceNiceScale: true,
        labels: {
          show: false,
          rotate: 0,
          hideOverlappingLabels: true
        }
      },

      tooltip: {
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
          const convertToCurrency = (input, solPrice) => {
            let number = Number(input * solPrice);
            if (!isNaN(number)) {
              number = Math.floor(number * 100000) / 100000;
              let [whole, decimal] = number.toString().split('.');
              whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
              if (decimal) {
                decimal = decimal.replace(/0+$/, '');
              }

              const formattedNumber = decimal ? `${whole}.${decimal}` : whole;
              return `<svg id="rps" width="14" height="16" viewBox="0 0 14 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.68369 1.51631L2.54025 0.0329233C2.40347 -0.0157117 2.25215 -0.0102836 2.11954 0.0480146C1.98692 0.106313 1.88386 0.212714 1.83298 0.343847L0.536309 3.67243C-0.0137925 5.07969 -0.140706 6.30001 0.155562 7.33341C0.451831 8.36681 1.21922 9.45975 2.45773 10.6122L4.36737 8.98074C3.6153 8.24206 3.14379 7.60703 2.95283 7.07563C2.76177 6.54097 2.75434 5.96166 2.93161 5.42265L4.89075 6.12364C5.02754 6.17227 5.17885 6.16684 5.31147 6.10855C5.44408 6.05025 5.54715 5.94385 5.59803 5.81271L7.00668 2.19469C7.05712 2.06362 7.05148 1.91874 6.99097 1.79165C6.93046 1.66456 6.82 1.56558 6.68369 1.51631V1.51631Z" fill="#505AC8"/>
              <path d="M7.43667 6.01953L11.4597 5.11465C11.5256 5.09988 11.5938 5.09807 11.6604 5.10935C11.727 5.12062 11.7907 5.14475 11.8479 5.18036C11.9051 5.21597 11.9546 5.26236 11.9936 5.31688C12.0327 5.3714 12.0604 5.43299 12.0754 5.49811L12.845 8.8265C13.1697 10.2343 13.129 11.4122 12.723 12.3602C12.3169 13.3082 11.4659 14.2561 10.17 15.2041L8.61311 13.4161C9.40474 12.8056 9.92296 12.2588 10.1678 11.7758C10.4151 11.2904 10.4983 10.7395 10.4053 10.2039L8.50426 10.6319C8.3713 10.6618 8.23177 10.6383 8.11633 10.5666C8.00088 10.4949 7.91896 10.3809 7.88855 10.2495L7.05405 6.62785C7.02368 6.49709 7.04686 6.35977 7.11853 6.24582C7.1902 6.13187 7.30455 6.05053 7.43667 6.01953V6.01953Z" fill="#8189DB"/>
              </svg>
              
              &thinsp;${formattedNumber}`;
            } else {
              return input;
            }
          };

          this.getRoomLink(dataPointIndex);

          return `<table class="chart-tooltip">
              <tr>
              <td>GAME ID: </td>
              <td>&nbsp;${gameLogList[dataPointIndex].game_id}</td>
              </tr>
              <tr>
              <tr>
              <td>PLAYED: </td>
              <td>&nbsp;${moment(
            gameLogList[dataPointIndex].played
          ).fromNow()}</td>
              </tr>
              <tr>
              <td>BET: </td>
              <td>&nbsp;${convertToCurrency(
            gameLogList[dataPointIndex].bet, solPrice
          )}</td>
              </tr>
              <tr>
              <td>AGAINST: </td>
              <td>&nbsp;${gameLogList[dataPointIndex].opponent.username}</td>
              </tr>
              <tr>
              <td>PROFIT: </td>
              <td>&nbsp;${convertToCurrency(
            gameLogList[dataPointIndex].profit, solPrice
          )}</td>
              </tr>
              <tr>
              <td>NET PROFIT: </td>
              <td>&nbsp;${convertToCurrency(
            gameLogList[dataPointIndex].net_profit, solPrice
          )}</td>
              </tr>
              
                </table>`;
        }.bind(this)
      }
    };
    const series = [
      {
        name: 'Jan',
        data: generateData(gameLogList),

        fill: {
          type: 'gradient',
          gradient: {
            shadeIntensity: 1,
            opacityFrom: 0.7,
            opacityTo: 0.9,
            stops: [0, 90, 100]
          }
        }
      }
    ];

    const {
      gamePlayed,
      gameHosted,
      gameJoined,
      totalWagered,
      dateJoined,
      last_seen,
      netProfit,
      gameProfit,
      averageWager,
      averageGamesPlayedPerRoom,
      averageProfit,
      profitAllTimeHigh,
      profitAllTimeLow,
      message,
      title,
      barStyle,
      color,
      solPrice
    } = this.props;
    const { creditScore, hexagon } = this.state;

    const date_joined = moment(dateJoined);
    const lastSeen = moment(this.props.last_seen);
    const joinedAgo = date_joined.fromNow();
    const lastSeenAgo = lastSeen.fromNow();
    const roundedCreditScore = Math.ceil(this.props.creditScore);

    return (
        <Box
          sx={{
            gridArea: 'Charts',
            justifySelf: 'center',
            width: '100%',
            borderRadius: '5px',
            backgroundColor: '#424242',
            padding: '25px',
            alignItems: 'center',
            boxShadow: 2, // Equivalent to Elevation[2]
          }}
        >
          {/* Rank Badge */}
          <Box className="rank-badge" sx={{ marginBottom: '20px' }}>
            <Typography variant="h5" sx={{ marginBottom: '10px' }}>
              BREAKDOWN
            </Typography>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <Typography sx={{ opacity: 0.6, fontSize: '0.9em', fontWeight: 500 }}>
                      LAST SEEN
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ color: '#ff8500', textAlign: 'center' }}>
                    {lastSeenAgo}
                  </TableCell>
                </TableRow>
                {/* Repeat for other TableRows */}
                <TableRow>
                  <TableCell>
                    <Typography sx={{ opacity: 0.6, fontSize: '0.9em', fontWeight: 500 }}>
                      SPENDING
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box className="hexagon">
                      <Box className="hex-content">
                        <Typography variant="h6" sx={{ color }}>
                          {title}
                        </Typography>
                        <Box className="payout-bar">
                          <Box className="value" sx={barStyle}></Box>
                        </Box>
                        <Box className="message" sx={{ display: 'flex', alignItems: 'center' }}>
                          {message}
                          <Tooltip title="Calculated using your average wager and All-Time-High" placement="top">
                            <IconButton sx={{ padding: '5px', cursor: 'pointer' }}>
                              <InfoIcon sx={{ width: '12px' }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
                {/* Continue for CREDIT SCORE and other rows */}
              </TableBody>
            </Table>
          </Box>
      
          {/* Statistics Container */}
          <Box className="statistics-container" sx={{ marginBottom: '20px' }}>
            <Box>
              <Box className="statistics-panel">
                <Typography variant="h5" sx={{ marginBottom: '10px' }}>
                  PERFORMANCE
                </Typography>
                <Box className='filters' sx={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  <FormControl fullWidth>
                    <Select
                      value={actorType}
                      onChange={handleActorTypeChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="Both">Both</MenuItem>
                      <MenuItem value="As Host">As Host</MenuItem>
                      <MenuItem value="As Player">As Player</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <Select
                      value={gameType}
                      onChange={handleGameTypeChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="62a25d2a723b9f15709d1ae7">RPS</MenuItem>
                      <MenuItem value="62a25d2a723b9f15709d1aeb">Quick Shoot</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <Select
                      value={timeType}
                      onChange={handleTimeTypeChange}
                      displayEmpty
                      variant="outlined"
                    >
                      <MenuItem value="1">Last Hour</MenuItem>
                      <MenuItem value="24">Last 24 Hours</MenuItem>
                      <MenuItem value="7">Last 7 Days</MenuItem>
                      <MenuItem value="30">Last 30 Days</MenuItem>
                      <MenuItem value="allTime">All-time</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                {!loaded ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', color: '#fff' }}>
                    LOADING...
                  </Typography>
                ) : (
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="label">
                          <Typography sx={{ fontWeight: 500 }}>Games Played</Typography>
                        </TableCell>
                        <TableCell className="value" align="center">
                          <Typography>{gamePlayed}</Typography>
                          <Box className="bar" sx={{ display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '5px' }}>
                            <Box
                              className="vs-bar host"
                              sx={{
                                width: `${(gameHosted / gamePlayed) * 100}%`,
                                height: '10px',
                                backgroundColor: '#3f51b5',
                                borderRadius: '5px',
                              }}
                              title={`As Host: ${gameHosted}`}
                            ></Box>
                            <Box
                              className="vs-bar player"
                              sx={{
                                width: `${(gameJoined / gamePlayed) * 100}%`,
                                height: '10px',
                                backgroundColor: '#ff8500',
                                borderRadius: '5px',
                              }}
                              title={`As Player: ${gameJoined}`}
                            ></Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                      {/* Repeat for other TableRows */}
                      <TableRow>
                        <TableCell className="label">
                          <Typography sx={{ fontWeight: 500 }}>Total Wagered</Typography>
                        </TableCell>
                        <TableCell className="value" align="center">
                          {convertToCurrency(totalWagered)}
                        </TableCell>
                      </TableRow>
                      {/* Continue for Net Profit, Ave. Wager, etc. */}
                    </TableBody>
                  </Table>
                )}
              </Box>
            </Box>
          </Box>
      
          {/* Chart Section */}
          <Typography variant="h5" sx={{ marginBottom: '20px' }}>
            CHART
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '350px',
            }}
          >
            <ReactApexChart
              options={options}
              series={series}
              type="line"
              height={350}
              width="100%"
              className={
                series[0].data.length > 100
                  ? 'step-10'
                  : series[0].data.length > 20
                    ? 'step-5'
                    : 'step-1'
              }
            />
          </Box>
          {showButton && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<LinkIcon />}
              onClick={() => (window.location.href = url)}
              sx={{ marginTop: '20px' }}
            >
              {roomName}
            </Button>
          )}
        </Box>
      );
  }
}

export default StatisticsForm;