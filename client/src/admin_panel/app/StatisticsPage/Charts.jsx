import React from 'react';
import ReactApexChart from 'react-apexcharts';
import styled from 'styled-components';
import { styleColor } from '../../../Styles/styleThem';
import Elevation from '../../../Styles/Elevation';
import { addCurrencySignal } from '../../../util/helper'

const xLabels = ['£0 - £1', '£1 - £10', '£10 - £20', '£20 - £30', '£30 - £40', '£40 - £50', '£50 - £60', '£60 - £70', '£70 - £80', '£80 - £90', '£90 - £100', '£100 -', ]

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
          range: 11,
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
          type="scatter"
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
