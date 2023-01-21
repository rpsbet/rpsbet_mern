import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import Elevation from '../../../../Styles/Elevation';
import moment from 'moment';
import './style.css';
import { convertToCurrency } from '../../../../util/conversion';

function generateData(gameLogList) {
  const series = [];
  let totalProfit = 0;
  gameLogList && gameLogList.forEach((log, index) => {
    totalProfit += log.profit;
    series.push({ x: `${Number(index) + 1}`, y: totalProfit })
  })
  return series;
}



class StatisticsForm extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      room_info: null
    };
  }

  dataPointSelection = async (event, chartContext, config) => {
    console.log(this.props.gameLogList[config.dataPointIndex]);
    const gameLogList = this.props.gameLogList;
    const room_id = gameLogList[config.dataPointIndex].room_id;
    const actionList = await this.props.getRoomStatisticsData(room_id);
    this.setState({
      room_info: {
        room_name: gameLogList[config.dataPointIndex].game_id,
        actionList: actionList
      }
    });
  };

  render() {
   
    const gameLogList = this.props.gameLogList;
    const options = {
      chart: {
        background: '#424242',
        type: 'numeric',
        stacked: false,
        zoom: {
          type: 'x',
          enabled: true,
          autoScaleYaxis: true
        },
        events: {
          dataPointSelection: this.dataPointSelection
        }
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
      title: {
        text: 'CUMULATIVE PROFIT',
        style: {
          color: 'white'
        }
      },
      xaxis: {
        labels: {
          show: false,
          rotate: 0,
          hideOverlappingLabels: true
        }
      },
      yaxis: {
        labels: {
          formatter: function(value) {
            const convertToCurrency = input => {
              let number = Number(input);
              if(!isNaN(number)){
                  let [whole, decimal] = number.toFixed(2).toString().split('.');
                  whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  return `${whole}.${decimal}`;
              }else{
                  return input;
              }
          };
          
            return convertToCurrency(value);
          }
        }
      },
      tooltip: {
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          const convertToCurrency = input => {
            let number = Number(input);
            if(!isNaN(number)){
                let [whole, decimal] = number.toFixed(2).toString().split('.');
                whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                return `<svg id='busd' width="0.7em" height="0.7em" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 336.41 337.42"><defs><style>.cls-1{fill:#f0b90b;stroke:#f0b90b;}</style></defs><title>BUSD Icon</title><g id="Layer_2" data-name="Layer 2"><g id="Layer_1-2" data-name="Layer 1"><path class="cls-1" d="M168.2.71l41.5,42.5L105.2,147.71l-41.5-41.5Z"/><path class="cls-1" d="M231.2,63.71l41.5,42.5L105.2,273.71l-41.5-41.5Z"/><path class="cls-1" d="M42.2,126.71l41.5,42.5-41.5,41.5L.7,169.21Z"/><path class="cls-1" d="M294.2,126.71l41.5,42.5L168.2,336.71l-41.5-41.5Z"/></g></g></svg>&thinsp;${whole}.${decimal}`;
            }else{
                return input;
            }
            };
            return (
            '<div class="chart-tooltip">' +
                '<div>GAME ID: ' +
                gameLogList[dataPointIndex].game_id +
                '</div>' +
                '<div>PLAYED: ' +
                moment(gameLogList[dataPointIndex].played).fromNow() +
                '</div>' +
                '<div>BET: ' +
                convertToCurrency(gameLogList[dataPointIndex].bet
                  ) +
                '</div>' +
                '<div>OPPONENT: ' +
                gameLogList[dataPointIndex].opponent.username +
                '</div>' +
                '<div>PROFIT: ' +
                convertToCurrency(gameLogList[dataPointIndex].profit
                ) +
                '</div>' +
            // '<div>Net Profit:' +
            // gameLogList[dataPointIndex].net_profit +
            // '</div>' +
            '</div>'
          );
        }
      }
    };
    const series = [{ name: 'Jan', data: generateData(gameLogList) }];

    return (
      <ChartDivEl>
        <H2>
          {this.props.username}
        </H2>
        <div className="statistics-container">
          <div>
            {/* <div className="statistics-panel">
              <h5>BREAKDOWN</h5>
              <div>
                Deposits:{' '}
                {addCurrencySignal(updateDigitToPoint2(this.props.deposit))}
              </div>
              <div>
                Withdrawals:{' '}
                {addCurrencySignal(updateDigitToPoint2(this.props.withdraw))}
              </div>
              <div>
                Game Profit:{' '}
                {addCurrencySignal(updateDigitToPoint2(this.props.gameProfit))}
              </div>
              <div>
                Balance:{' '}
                {addCurrencySignal(updateDigitToPoint2(this.props.balance))}
              </div>
            </div> */}
            <div className="statistics-panel">
              <h5>PERFORMANCE</h5>
              <div>Game Played: {this.props.gamePlayed}</div>
              <div>
                Total Wagered:{' '}
                {convertToCurrency(this.props.totalWagered
                )}
              </div>
              <div>
                Net Profit:{' '}
                {convertToCurrency(this.props.gameProfit)}
                {/* {addCurrencySignal(updateDigitToPoint2(this.props.netProfit))} */}
              </div>
              <div>
                Profit All Time High:{' '}
                {convertToCurrency(this.props.profitAllTimeHigh
                )}
              </div>
              <div>
                Profit All Time Low:{' '}
                {convertToCurrency(
                  this.props.profitAllTimeLow
                )}
              </div>
            </div>
          </div>
          <div>
            {this.state.room_info && (
              <div className="statistics-panel">
                <h5>ROOM INFO ({this.state.room_info.room_name})</h5>
                <table>
                  <thead>
                    <tr>
                      <th>Date/Time</th>
                      <th>Actor</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.state.room_info.actionList.map((action, key) => (
                      <tr key={action._id}>
                        <td>{moment(action.created_at).format('LLL')}</td>
                        <td>{action.actor}</td>
                        <td>{action.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
