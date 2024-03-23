import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import Elevation from '../../../../Styles/Elevation';
import moment from 'moment';
import './style.css';
// import Lottie from 'react-lottie';

import rankIcon from '../../../../game_panel/LottieAnimations/rankIcon.json';
import { Button, Table, TableBody, TableCell, TableRow } from '@material-ui/core';

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

      url: '',
      roomName: '',
      roomId: '',
      rank: ''
    };
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

  calculateDashOffset(creditScore) {
    // Adjust the scaling factor based on the credit score range
    const scalingFactor = 390 / (2000 - 900);
    const invertedScore = 2000 - creditScore; // Invert the score so that lower scores result in more incomplete hexagons
    return invertedScore * scalingFactor;
  }

  renderProgressHexagon(creditScore) {
    const dashOffset = this.calculateDashOffset(creditScore);
    return (
      <polygon
        points="60,15 105,40 105,80 60,105 15,80 15,40"
        className={`progress-hexagon ${this.getHexagonColor(creditScore)}`}
        style={{ strokeDashoffset: dashOffset }}
      />
    );
  }

  getHexagonColor(creditScore) {
    if (creditScore >= 950 && creditScore < 1150) {
      return 'red';
    } else if (creditScore >= 1150 && creditScore < 1400) {
      return 'white';
    } else {
      return 'green';
    }
  }
  getRank(totalWagered) {
    const level = Math.floor(Math.log2(totalWagered + 1) / 1.2) + 1;
    // console.log("totalWagered: ", totalWagered);
    // console.log("level: ", level);

    // const stars = Array.from({ length: level }, (_, index) => (
    //   <Lottie
    //     key={index}
    //     options={{
    //       loop: true,
    //       autoplay: true,
    //       animationData: rankIcon,
    //     }}
    //     style={{
    //       width: '32px',
    //     }}
    //   />
    // ));

    const nextLevelWager = Math.pow(2, 1.2 * (level)) - 1;
    const progress = totalWagered / nextLevelWager;
    const progressBarWidth = 100;
    const roundedProgress = (progress * progressBarWidth).toFixed(2);
    const remainingProgress = progressBarWidth - roundedProgress;

    // Calculate rank - 1 and rank + 1
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
          {/* <div className="stars">{stars}</div> */}
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
          formatter: function (value) {
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
        custom: function ({ series, seriesIndex, dataPointIndex, w }) {
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

    const {
      gamePlayed,
      gameHosted,
      gameJoined,
      totalWagered,
      dateJoined,
      last_seen,
      creditScore,
      netProfit,
      gameProfit,
      averageWager,
      averageGamesPlayedPerRoom,
      averageProfit,
      profitAllTimeHigh,
      profitAllTimeLow
    } = this.props;

    // Determine the color based on the credit score
    const dialColor = creditScore < 900 ? 'red' : creditScore > 1000 ? 'green' : 'orange';

    // Define the inline styles for the dial
    const dialStyles = {
      width: '100px', // Adjust the width of the dial as needed
      height: '100px', // Adjust the height of the dial as needed
      borderRadius: '50%',
      backgroundColor: dialColor,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white', // Adjust the text color based on the background color
      fontSize: 'larger',
    };

    const date_joined = moment(dateJoined);
    const lastSeen = moment(last_seen);
    const joinedAgo = date_joined.fromNow();
    const lastSeenAgo = lastSeen.fromNow();
    const roundedCreditScore = Math.ceil(this.props.creditScore);

    return (
      <ChartDivEl>
        <div className="rank-badge">
          <h2>{this.props.username}</h2>
         <br />
          <h5>BREAKDOWN</h5>
          <Table>
        <TableBody>
          {/* <TableRow>
            <TableCell><b style={{opacity: "0.6",  fontSize: '0.9em', fontWeight: '500' }}>LAST SEEN</b></TableCell>
            <TableCell style={{ color: "#ffb000",textAlign: 'center' }}>{lastSeenAgo}</TableCell>
          </TableRow> */}
        <TableRow>
            <TableCell><b style={{opacity: "0.6",  fontSize: '0.9em', fontWeight: '500' }}>JOINED</b></TableCell>
            <TableCell  style={{ color: "#ffb000", textAlign: 'center' }}>{joinedAgo}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell><b style={{opacity: "0.6",  fontSize: '0.9em', fontWeight: '500' }}>RANK</b></TableCell>
            <TableCell> <div className="stars" style={{display:"flex", justifyContent: "center"}}>{this.getRank(this.props.rank)}</div></TableCell>
          </TableRow>
        <TableRow>
          <TableCell><b style={{ opacity: "0.6", fontSize: '0.9em', fontWeight: '500' }}>CREDIT SCORE</b></TableCell>
          <TableCell>
          <div className="creditScore">
          <svg className="dial" width="120" height="120">
  {this.renderProgressHexagon(this.props.creditScore)}
  <text x="50%" y="40%" textAnchor="middle" alignmentBaseline="middle" className="creditScoreStatus" style={{ fill: '#ffb000' }}>
    {roundedCreditScore >= 1000 && roundedCreditScore <= 1500 && 'OK'}
    {roundedCreditScore > 1500 && roundedCreditScore <= 2000 && 'HIGH'}
    {roundedCreditScore < 1000 && 'BAD'}
  </text>
  <text x="50%" y="60%" textAnchor="middle" alignmentBaseline="middle" className="creditScoreValue" style={{ fill: '#ffb000' }}>
    {roundedCreditScore} / 2000
  </text>
</svg>

        </div>
        </TableCell>
          </TableRow>
        </TableBody>
      </Table>
        </div>
        

        <div className="statistics-container">
          <div>
            <div className="statistics-panel">
              <h5>PERFORMANCE</h5>
              <div className='filters'>

                <FormControl>
                  <Select
                    value={this.props.actorType}
                    onChange={this.handleActorTypeChange}
                  >
                    <MenuItem value="Both">Both</MenuItem>
                    <MenuItem value="As Host">As Host</MenuItem>
                    <MenuItem value="As Player">As Player</MenuItem>
                  </Select>
                </FormControl>

                <FormControl>
                  <Select
                    value={this.props.gameType}
                    onChange={this.handleGameTypeChange}
                  >
                    <MenuItem value="All">All</MenuItem>
                    <MenuItem value="62a25d2a723b9f15709d1ae7">RPS</MenuItem>
                    <MenuItem value="62a25d2a723b9f15709d1aeb">Quick Shoot</MenuItem>
                    {/* <MenuItem value="62a25d2a723b9f15709d1ae9">Brain Game</MenuItem>
                    <MenuItem value="62a25d2a723b9f15709d1aea">Mystery Box</MenuItem>
                    <MenuItem value="63dac60ba1316a1e70a468ab">Drop Game</MenuItem>
                    <MenuItem value="62a25d2a723b9f15709d1ae8">Spleesh</MenuItem>
                    <MenuItem value="6536a82933e70418b45fbe32">Bang!</MenuItem>
                    <MenuItem value="6536946933e70418b45fbe2f">Roll</MenuItem> */}

                  </Select>
                </FormControl>
                <FormControl>
                  <Select
                    value={this.props.timeType}
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
                <Table>
        <TableBody>
          <TableRow>
            <TableCell className="label">Games Played</TableCell>
            <TableCell className="value" align="center">
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
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Total Wagered</TableCell>
            <TableCell className="value" align="center">
              {convertToCurrency(totalWagered)}
            </TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Net Profit</TableCell>
            <TableCell className="value" align="center">{convertToCurrency(gameProfit)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Ave. Wager</TableCell>
            <TableCell className="value" align="center">{convertToCurrency(averageWager)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Ave. Games Played Per Room</TableCell>
            <TableCell className="value" align="center">{updateDigitToPoint2(averageGamesPlayedPerRoom)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Ave. Profit Per Game</TableCell>
            <TableCell className="value" align="center">{convertToCurrency(averageProfit)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Profit ATH</TableCell>
            <TableCell className="value" align="center">{convertToCurrency(profitAllTimeHigh)}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell className="label">Profit ATL</TableCell>
            <TableCell className="value" align="center">{convertToCurrency(profitAllTimeLow)}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
              )}
            </div>
          </div>
        </div>
        <h5>CHART</h5>
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
