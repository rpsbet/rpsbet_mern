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
			
		};
  }

  render() {
	const gameLogList = this.props.gameLogList;
	const options = {
		chart: {
			background: '#424242',
			stacked: false,
			zoom: {
				type: 'x',
				enabled: true,
				autoScaleYaxis: true,
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
		}
	};
	const series = [
		{name: 'Jan', data: generateData(gameLogList)},
	]

	return (
	  <ChartDivEl>
			<H2>{this.props.username}<Span>Joined: {this.props.joined_date}</Span></H2>
			<div className="statistics-panel">
				<h5>BREAKDOWN</h5>
				<div>Deposits: {addCurrencySignal(this.props.deposit)}</div>
				<div>Withdrawals: {addCurrencySignal(this.props.withdraw)}</div>
				<div>Game Profit: {addCurrencySignal(this.props.gameProfit)}</div>
				<div>Balance: {addCurrencySignal(this.props.balance)}</div>
			</div>
			<div className="statistics-panel">
				<h5>PERFORMANCE</h5>
				<div>Game Played: {this.props.gamePlayed}</div>
				<div>Total Wagered: {this.props.totalWagered}</div>
				<div>Net Profit: {addCurrencySignal(this.props.netProfit)}</div>
				<div>Profit All Time High: {addCurrencySignal(this.props.profitAllTimeHigh)}</div>
				<div>Profit All Time Low: {addCurrencySignal(this.props.profitAllTimeLow)}</div>
			</div>
			<ChartEl
				options={options}
				series={series}
				type="area"
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
