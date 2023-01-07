import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import Elevation from '../../../Styles/Elevation';
import { addCurrencySignal } from '../../../util/helper'

const xLabels = ['0 RPS - 1 RPS', '1 RPS - 10 RPS', '10 RPS - 20 RPS', '20 RPS - 30 RPS', '30 RPS - 40 RPS', '40 RPS - 50 RPS', '50 RPS - 60 RPS', '60 RPS - 70 RPS', '70 RPS - 80 RPS', '80 RPS - 90 RPS', '90 RPS - 100 RPS', '100 RPS -', ]

class HeatmapChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      options: {
        chart: {
          background: '#424242',
          stacked: false,
          zoom: {
            enabled: false,
          }
        },
        theme: {
          mode: 'dark'
        },
        dataLabels: {
          enabled: false
        },
        title: {
          text: 'Volume of Bets',
        },
        xaxis: {
          categories: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
          tickAmount: 11,
          range: 7,
          tickPlacement: 'between',
          axiesTicks: {
            show: true
          },
          labels: {
            formatter: function (value) {
              return xLabels[parseInt(value)];
            }
          }
        },
        yaxis: {
          labels: {
            formatter: function (value) {
              return addCurrencySignal(value);
            }
          }
        },
        animations: {
          enabled: false
        },
        legend: {
          itemMargin: {
            vertical: 30,
            horizontal: 20
          }
        }
      },
    };
  }

  render() {
    return (
      <ChartDivEl>
        <ChartEl
          options={this.state.options}
          series={this.props.series}
          type="numeric"
          height="400"
          width="100%"
        />
      </ChartDivEl>
    );
  }
}

export default HeatmapChart;

const ChartDivEl = styled.div`
  grid-area: Charts;
  justify-self: center;
  width: 100%;
  border-radius: 5px;
  background-color: #424242;
  padding: 5px;
  align-items: center;
  ${Elevation[2]}
`;

const ChartEl = styled(ReactApexChart)``;
