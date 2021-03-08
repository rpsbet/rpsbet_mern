import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import { styleColor } from '../../../../Styles/styleThem';
import Elevation from '../../../../Styles/Elevation';
import { updateDigitToPoint2, addCurrencySignal } from '../../../../util/helper';
import moment from 'moment';
import './style.css';

function generateData(gameLogList) {
  const series = [];
  let totalProfit = 0;
  for (let i = 0; i < gameLogList.length; i++) {
	const x = (i + 1).toString();
	totalProfit += gameLogList[i].profit;
	series.push({
	  x: x,
	  y: totalProfit
	});
  }
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
	})
  }

  render() {
	const gameLogList = this.props.gameLogList;
	const options = {
		chart: {
			background: '#424242',
			type: 'bar',
			stacked: false,
			zoom: {
				type: 'x',
				enabled: true,
				autoScaleYaxis: true,
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
		title: {
			text: 'Cumulative Net Profit',
			style: {
				color: 'white'
			}
		},
		xaxis: {
			labels: {
				show: true,
				rotate: 0,
				hideOverlappingLabels: false,
			},
		},
		yaxis: {
			labels: {
				formatter: function (value) {
					return addCurrencySignal(value);
				}
			}
		},
		tooltip: {
			custom: function ({series, seriesIndex, dataPointIndex, w}) {
				return '<div class="chart-tooltip">' +
						'<div>Game Id: ' + gameLogList[dataPointIndex].game_id + '</div>' +
						'<div>Played: ' + moment(gameLogList[dataPointIndex].played).fromNow() + '</div>' +
						'<div>Bet: £' + gameLogList[dataPointIndex].bet + '</div>' +
						'<div>Opponent:' + gameLogList[dataPointIndex].opponent.username + '</div>' +
						'<div>Profit:' + addCurrencySignal(updateDigitToPoint2(gameLogList[dataPointIndex].profit)) + '</div>' +
						'<div>Net Profit:' + gameLogList[dataPointIndex].net_profit + '</div>' +
						'</div>'
			}
		},
	};
	const series = [
		{name: 'Jan', data: generateData(gameLogList)},
	]

	return (
	  <ChartDivEl>
			<H2>{this.props.username}<Span>Joined: {this.props.joined_date}</Span></H2>
			<div className="statistics-container">
				<div>
					<div className="statistics-panel">
						<h5>BREAKDOWN</h5>
						<div>Deposits: {addCurrencySignal(updateDigitToPoint2(this.props.deposit))}</div>
						<div>Withdrawals: {addCurrencySignal(updateDigitToPoint2(this.props.withdraw))}</div>
						<div>Game Profit: {addCurrencySignal(updateDigitToPoint2(this.props.gameProfit))}</div>
						<div>Balance: {addCurrencySignal(updateDigitToPoint2(this.props.balance))}</div>
					</div>
					<div className="statistics-panel">
						<h5>PERFORMANCE</h5>
						<div>Game Played: {this.props.gamePlayed}</div>
						<div>Total Wagered: {addCurrencySignal(updateDigitToPoint2(this.props.totalWagered))}</div>
						<div>Net Profit: {addCurrencySignal(updateDigitToPoint2(this.props.netProfit))}</div>
						<div>Profit All Time High: {addCurrencySignal(updateDigitToPoint2(this.props.profitAllTimeHigh))}</div>
						<div>Profit All Time Low: {addCurrencySignal(updateDigitToPoint2(this.props.profitAllTimeLow))}</div>
					</div>
				</div>
				<div>
					{this.state.room_info && <div className="statistics-panel">
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
					</div>}
				</div>
			</div>
			<ChartEl
				options={options}
				series={series}
				className={series[0].data.length > 100 ? 'step-10' : (series[0].data.length > 20 ? 'step-5' : 'step-1')}
				type="bar"
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
