import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import Elevation from '../../../../Styles/Elevation';
import moment from 'moment';
import './style.css';
import { Button } from '@material-ui/core';
import { FormControl, MenuItem, Select } from '@material-ui/core';

import { Link as LinkIcon } from '@material-ui/icons';
import { convertToCurrency } from '../../../../util/conversion';
import { updateDigitToPoint2 } from '../../../../util/helper';
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
      actorType: 'Both',
      gameType: 'All',
      timeType: '7',
      url: '',
      roomName: '',
      roomId: ''
    };
  }

  handleActorTypeChange = event => {
    this.setState({ actorType: event.target.value });
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

  // componentDidUpdate(prevProps) {
  //   if (
  //     prevProps.gamePlayed !== this.props.gamePlayed ||
  //     prevProps.totalWagered !== this.props.totalWagered
  //     // prevProps.gameProfit !== this.props.gameProfit ||
  //     // prevProps.profitAllTimeHigh !== this.props.profitAllTimeHigh ||
  //     // prevProps.profitAllTimeLow !== this.props.profitAllTimeLow
  //   ) {
  //     this.setState({ loaded: true });
  //   }
  // }

  handleTooltipToggle = () => {
    this.setState({ showButton: true });
  };

  getRank(totalWagered) {
    // Calculate the level using a logarithmic function with base 2.
    const level = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
    const stars = '★'.repeat(level);

    const nextLevelWager = Math.pow(3, level * 5) - 1;
    const progress = totalWagered / nextLevelWager;
    const progressBarWidth = 100;
    const progressBarFilled = progress * progressBarWidth;

    return (
      <div>
        <div className="level-number">{level.toLocaleString()}</div>
        <div className="stars">{stars}</div>
        <div
          className="progress-bar-outer"
          style={{ width: `${progressBarWidth}px` }}
        >
          <div
            className="progress-bar-filled"
            style={{ width: `${progressBarFilled}px` }}
          ></div>
        </div>
      </div>
    );
  }

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
            download: false // <== line to add
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
              color: '#ffb000',
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
          formatter: function(value) {
            const convertToCurrency = input => {
              let number = Number(input);
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
        // range: 1500,
        // min: 0,
        // max: 1500,
        forceNiceScale: true,
        labels: {
          show: false,
          rotate: 0,
          hideOverlappingLabels: true
        }
      },

      tooltip: {
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const convertToCurrency = input => {
            let number = Number(input);
            if (!isNaN(number)) {
              // Round the number down
              number = Math.floor(number * 100000) / 100000;

              let [whole, decimal] = number.toString().split('.');
              whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

              // Remove trailing zeros after the decimal point
              if (decimal) {
                decimal = decimal.replace(/0+$/, '');
              }

              const formattedNumber = decimal ? `${whole}.${decimal}` : whole;
              return `<svg id='busd' width="0.7em" height="0.7em" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
              viewBox="0 0 1920 1920" enable-background="new 0 0 1920 1920" xml:space="preserve">
           <g>
             <polygon fill="#8A92B2" points="959.8,80.7 420.1,976.3 959.8,731 	"/>
             <polygon fill="#62688F" points="959.8,731 420.1,976.3 959.8,1295.4 	"/>
             <polygon fill="#62688F" points="1499.6,976.3 959.8,80.7 959.8,731 	"/>
             <polygon fill="#454A75" points="959.8,1295.4 1499.6,976.3 959.8,731 	"/>
             <polygon fill="#8A92B2" points="420.1,1078.7 959.8,1839.3 959.8,1397.6 	"/>
             <polygon fill="#62688F" points="959.8,1397.6 959.8,1839.3 1499.9,1078.7 	"/>
           </g>
           </svg>&thinsp;${formattedNumber}`;
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
                gameLogList[dataPointIndex].bet
              )}</td>
              </tr>
              <tr>
              <td>AGAINST: </td>
              <td>&nbsp;${gameLogList[dataPointIndex].opponent.username}</td>
              </tr>
              <tr>
              <td>PROFIT: </td>
              <td>&nbsp;${convertToCurrency(
                gameLogList[dataPointIndex].profit
              )}</td>
              </tr>
              <tr>
              <td>NET PROFIT: </td>
              <td>&nbsp;${convertToCurrency(
                gameLogList[dataPointIndex].net_profit
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
    // console.log('Series Data:', series);

    const {
      gamePlayed,
      gameHosted,
      gameJoined,
      totalWagered,
      netProfit,
      gameProfit,
      averageWager,
      averageGamesPlayedPerRoom,
      averageProfit,
      profitAllTimeHigh,
      profitAllTimeLow
    } = this.props;

    return (
      <ChartDivEl>
        <div className="rank-badge">
          <h2>{this.props.username}</h2>
          <div className="stars">{this.getRank(totalWagered)}</div>
        </div>

        <div className="statistics-container">
          <div>
            <div className="statistics-panel">
              <h5>PERFORMANCE</h5>
              <div className='filters'>

              <FormControl>
                <Select
                  value={this.state.actorType}
                  onChange={this.handleActorTypeChange}
                  >
                  <MenuItem value="Both">Both</MenuItem>
                  <MenuItem value="As Host">As Host</MenuItem>
                  <MenuItem value="As Player">As Player</MenuItem>
                </Select>
              </FormControl>

              <FormControl>
                <Select
                  value={this.state.gameType}
                  onChange={this.handleGameTypeChange}
                >
                  <MenuItem value="All">All</MenuItem>
                  <MenuItem value="62a25d2a723b9f15709d1ae7">RPS</MenuItem>
                  <MenuItem value="62a25d2a723b9f15709d1aeb">Quick Shoot</MenuItem>
                  <MenuItem value="62a25d2a723b9f15709d1ae9">Brain Game</MenuItem>
                  <MenuItem value="62a25d2a723b9f15709d1aea">Mystery Box</MenuItem>
                  <MenuItem value="63dac60ba1316a1e70a468ab">Drop Game</MenuItem>
                  <MenuItem value="62a25d2a723b9f15709d1ae8">Spleesh</MenuItem>
                  <MenuItem value="6536a82933e70418b45fbe32">Bang!</MenuItem>
                  <MenuItem value="6536946933e70418b45fbe2f">Roll</MenuItem>

                </Select>
              </FormControl>
              <FormControl>
                <Select
                  value={this.state.timeType}
                  onChange={this.handleTimeTypeChange}
                  >
                  <MenuItem value="1">Last Hour</MenuItem>
                  <MenuItem value="24">Last 24 Hours</MenuItem>
                  <MenuItem value="7">Last 7 Days</MenuItem>
                  <MenuItem value="30">Last 30 Days</MenuItem>
                  <MenuItem value="allTime">All-time</MenuItem>
                </Select>
              </FormControl>
                </div>
              {!this.state.loaded ? (
                <div className="loading">LOADING...</div>
              ) : (
                <table>
                  <tbody>
                    <tr>
                      <td className="label">Games Played</td>
                      <td className="value played">
                        <span>{gamePlayed}</span>
                        <span className="bar">
                          <div
                            className="vs-bar host"
                            style={{
                              width: `${(gameHosted / gamePlayed) * 100}%`
                            }}
                            title={`As Host: ${gameHosted}`}
                          ></div>
                          <div
                            className="vs-bar player"
                            style={{
                              width: `${(gameJoined / gamePlayed) * 100}%`
                            }}
                            title={`As Player: ${gameJoined}`}
                          ></div>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Total Wagered</td>
                      <td className="value">
                        {convertToCurrency(totalWagered)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Net Profit</td>
                      <td className="value">{convertToCurrency(gameProfit)}</td>
                    </tr>
                    <tr>
                      <td className="label">Ave. Wager</td>
                      <td className="value">
                        {convertToCurrency(averageWager)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Ave. Games Played Per Room</td>
                      <td className="value">
                        {updateDigitToPoint2(averageGamesPlayedPerRoom)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Ave. Profit Per Game</td>
                      <td className="value">
                        {convertToCurrency(averageProfit)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Profit ATH</td>
                      <td className="value">
                        {convertToCurrency(profitAllTimeHigh)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Profit ATL</td>
                      <td className="value">
                        {convertToCurrency(profitAllTimeLow)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <ChartEl
          options={options}
          series={series}
          className={
            series[0].data.length > 100
              ? 'step-10'
              : series[0].data.length > 20
              ? 'step-5'
              : 'step-1'
          }
          type="line"
          height="350"
          width="100%"
        />
        {this.state.showButton && (
          <Button
            className="room-link"
            onClick={() => (window.location.href = this.state.url)}
          >
            {this.state.roomName}
            <LinkIcon />
          </Button>
        )}
      </ChartDivEl>
    );
  }
}

export default StatisticsForm;

const ChartDivEl = styled.div`
  grid-area: Charts;
  justify-self: center;
  width: 100%;
  border-radius: 5px;
  background-color: #424242;
  padding: 25px;
  align-items: center;
  ${Elevation[2]}
`;

const H2 = styled.h2`
  border-bottom: 3px solid white;
`;

const Span = styled.span`
  font-size: 14px;
  float: right;
  margin-top: 18px;
`;

const ChartEl = styled(ReactApexChart)``;
