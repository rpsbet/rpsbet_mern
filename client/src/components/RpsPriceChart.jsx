// src/components/RpsPriceChart.js

import React, { Component } from 'react';
import { TextField, Grid, Typography } from '@material-ui/core';
import ReactApexChart from 'react-apexcharts';

class RpsPriceChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
        usdValue: '',
        rpsValue: '',
        conversionRate: 0.01666,
        pricesData: [],
        datesData: [],
        futurePriceIndex: null,
    };
  }

  componentDidMount() {
    this.fetchPricesData();
  }

  fetchPricesData = async () => {
    try {
      const prices = await this.props.getNativePrices();
      const mergedPricesData = [];
      const datesData = [];
      let futurePriceIndex = null;

      const currentDate = new Date();
      prices.forEach((price, index) => {
        const priceDate = new Date(price.createdAt);
        datesData.push(
          priceDate.toLocaleDateString('en-US', {
            month: 'short',
            year: 'numeric',
          })
        );

        if (priceDate <= currentDate) {
          mergedPricesData.push(price.rate);
        } else {
          if (futurePriceIndex === null) {
            futurePriceIndex = mergedPricesData.length; // The future price will start from here
          }
          mergedPricesData.push(price.rate); // Add the future price
        }
      });

      this.setState({
        pricesData: mergedPricesData,
        datesData,
        futurePriceIndex,
      });
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  handleUSDChange = (event) => {
    const usdValue = parseFloat(event.target.value) || 0; // Ensure it's a number
    this.setState({ usdValue }, this.updateRPSValue);
  };
  
  handleRPSChange = (event) => {
    const rpsValue = parseFloat(event.target.value) || 0; // Ensure it's a number
    this.setState({ rpsValue }, this.updateUSDValue);
  };

  updateRPSValue = () => {
    const { usdValue, conversionRate } = this.state;
    const rpsValue = (parseFloat(usdValue) / conversionRate).toFixed(4);
    this.setState({ rpsValue });
  };
  
  updateUSDValue = () => {
    const { rpsValue, conversionRate } = this.state;
    const usdValue = (parseFloat(rpsValue) * conversionRate).toFixed(4);
    this.setState({ usdValue });
  };

  render() {
    const { isDarkMode } = this.props;
    const { usdValue, rpsValue, conversionRate, pricesData, datesData, futurePriceIndex } = this.state;

    const chartData = {
        options: {
          chart: {
            animations: { enabled: true },
            toolbar: { show: false },
            zoom: { enabled: false },
            background: 'transparent',
          },
          grid: {
            borderColor: '#e7e7e7',
          },
          stroke: {
            curve: 'smooth',
            width: 9,
            dashArray: futurePriceIndex !== null ? [0, futurePriceIndex, 5] : 0, // Dashed line for future price if available
          },
          colors: ['#FF0000', '#FFD800'], // Two colors: past/present and future
          xaxis: {
            categories: datesData,
            labels: {
              style: {
                colors: '#fff',
                fontSize: '12px',
              },
            },
          },
          yaxis: {
            labels: {
              style: {
                colors: '#fff',
                fontSize: '12px',
              },
            },
          },
          dataLabels: { enabled: false },
          tooltip: {
            enabled: true,
            theme: 'dark', // Set tooltip theme to dark
            style: {
              fontSize: '12px',
              fontFamily: 'Helvetica, Arial, sans-serif',
            },
            marker: {
              show: true,
            },
            onDatasetHover: {
              highlightDataSeries: true,
            },
            x: {
              show: true,
            },
            y: {
              formatter: (value) => value.toFixed(4), // Format y-axis values if needed
            },
            background: '#333', // Dark background color for tooltip
            borderColor: '#666', // Optional: Darker border color for tooltip
            borderWidth: 1, // Optional: Border width for tooltip
          },
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'dark',
              gradientToColors: ['#ffd000', '#FF0000'],
              shadeIntensity: 1,
              opacityFrom: 0.9,
              opacityTo: 0.4,
              stops: [0, 100],
            },
          },
          theme: {
            mode: isDarkMode ? 'dark' : 'light',
          },
        },
        series: [
          {
            name: 'RPS Prices',
            data: pricesData,
          },
        ],
      };
    return (
      <div style={{ display: 'flex', flexDirection: "column", justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="modal-title title">RPS PRICE</h1>
        <div
          style={{
            width: '100%',
            background: 'linear-gradient(45deg, #ab69ff, #dc3545)',
            borderRadius: '15px',
            padding: '20px',
            boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.15)',
            margin: '20px 0 45px',
          }}
        >
          <div style={{ padding: '20px' }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="USD"
                  variant="outlined"
                  fullWidth
                  value={usdValue}
                  onChange={this.handleUSDChange}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="RPS"
                  variant="outlined"
                  fullWidth
                  value={rpsValue}
                  onChange={this.handleRPSChange}
                  type="number"
                />
              </Grid>
            </Grid>
            <Typography variant="body2" color="textSecondary" style={{ marginTop: '10px' }}>
              Current Conversion Rate: 1 USD = {conversionRate} RPS
            </Typography>
          </div>
          {pricesData.length > 0 && datesData.length > 0 ? (
            <ReactApexChart
              options={chartData.options}
              series={chartData.series}
              type="line"
              height={200} // Increased height for better visibility
              width="100%" // Full width of the container
            />
          ) : (
            <p>Loading chart data...</p>
          )}
        </div>
      </div>
    );
  }
}

export default RpsPriceChart;