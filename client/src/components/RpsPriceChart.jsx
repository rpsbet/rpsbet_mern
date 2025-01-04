import React, { Component } from 'react';
import { Typography, Card, Button, CardContent, Grid, Box } from '@material-ui/core';
import MonetizationOnIcon from '@material-ui/icons/MonetizationOn';
import TrendingUpIcon from '@material-ui/icons/TrendingUp';
import TrendingDownIcon from '@material-ui/icons/TrendingDown';
import axios from '../util/Api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine } from '@fortawesome/free-solid-svg-icons'; // Import the chart line icon


class RpsPriceChart extends Component {
  constructor(props) {
    super(props);
    this.state = {
      conversionRate: null,
      liquidityUsd: null,
      marketCap: null,
      priceChanges: {
        m5: 0,
        h1: 0,
        h6: 0,
        h24: 0,
      },
      volume: {
        m5: 0,
        h1: 0,
        h6: 0,
        h24: 0,
      },
      loading: true,
    };
  }

  async componentDidMount() {
    this.fetchTokenDetails();
  }

  async fetchTokenDetails() {
    const { tokenMintAddress } = this.props;
    try {
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${tokenMintAddress}`);
      const priceData = response.data.pairs?.[0];
      if (priceData) {
        this.setState({
          conversionRate: priceData.priceUsd,
          liquidityUsd: priceData.liquidity?.usd || 0,
          marketCap: priceData.marketCap || 0,
          priceChanges: priceData.priceChange,
          volume: priceData.volume,
          loading: false,
        });
      } else {
        console.error("No pair data available for this token.");
        this.setState({ loading: false });
      }
    } catch (error) {
      console.error("Error fetching token details:", error);
      this.setState({ loading: false });
    }
  }

  render() {
    const { conversionRate, liquidityUsd, marketCap, priceChanges, volume, loading } = this.state;

    if (loading) return <p>Loading token data...</p>;

    return (
      <>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <Card style={{ width: '100%', 
                filter: !this.props.isDarkMode ? 'invert(1)' : 'none', borderRadius: '0.3em', boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.15)', backgroundColor: 'unset', background: 'linear-gradient(-45deg, #3f51b5,  #6c0066)' }}>
            <CardContent
              style={{
                textAlign: 'center',
              }}
            >
              <Box display="flex" justifyContent="space-around" style={{ marginBottom: '20px' }}>
                <Typography variant="h6" color="textSecondary">Price (USD):</Typography>
                <Typography variant="h6" style={{ fontWeight: 'bold', color: '#4CAF50' }}>${conversionRate}</Typography>
              </Box>
              <Grid container spacing={3}>
                {/* Liquidity */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <MonetizationOnIcon style={{ color: '#FFC107' }} />
                    <Typography variant="h6" style={{ marginLeft: '5px' }}>Liquidity:</Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 'bold', color: '#FF9800' }}>${liquidityUsd}</Typography>
                </Grid>

                {/* Market Cap */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <MonetizationOnIcon style={{ color: '#03A9F4' }} />
                    <Typography variant="h6" style={{ marginLeft: '5px' }}>MC:</Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 'bold', color: '#0288D1' }}>${marketCap}</Typography>
                </Grid>

                {/* 24h Price Change */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <TrendingUpIcon style={{ color: '#4CAF50' }} />
                    <Typography variant="h6" style={{ marginLeft: '5px' }}>24h Price:</Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 'bold', color: priceChanges.h24 >= 0 ? '#4CAF50' : '#F44336' }}>
                    {priceChanges.h24}%
                  </Typography>
                </Grid>

                {/* Volume 24h */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box display="flex" alignItems="center" justifyContent="center">
                    <TrendingDownIcon style={{ color: '#E91E63' }} />
                    <Typography variant="h6" style={{ marginLeft: '5px' }}>Volume 24h:</Typography>
                  </Box>
                  <Typography variant="h6" style={{ fontWeight: 'bold', color: '#FF4081' }}>${volume.h24}</Typography>
                </Grid>
              </Grid>
            </CardContent>

          </Card>
        </div>
        <div style={{ margin: '-45px auto 0', width: '100%', display: 'flex', justifyContent: 'center' }}>
          <Button
            style={{
              background: "#ffd000",
              color: "#000",
              border: "none",
              borderRadius: "5px",
              padding: "0px 20px",
              fontSize: "xx-small",
              cursor: "pointer",
              transition: "background 0.3s ease",
            }}
            onClick={() => window.open("https://dexscreener.com/solana/x0-COMING-SOON-xxxxxx000000000pump", "_blank")}
            onMouseOver={(e) => e.currentTarget.style.background = "#fbc02d"}
            onMouseOut={(e) => e.currentTarget.style.background = "#ffd000"}
          >
            Live Chart&nbsp;      <FontAwesomeIcon icon={faChartLine} style={{ fontSize: "18px", color: "#000" }} />

          </Button>
        </div>
      </>
    );
  }
}

export default RpsPriceChart;