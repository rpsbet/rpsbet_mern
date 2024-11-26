import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { fetchLeaderboardsData, fetchReceiptStatistics, fetchEquityDistribution, getMarketingStat } from '../../redux/Customer/customer.action';
import Chart from 'react-apexcharts';
import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import LinearProgress from '@material-ui/core/LinearProgress';
import { withStyles } from '@material-ui/core/styles';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons'; // Example icon, choose appropriate icon
import happyCat from '../../util/happyCat.svg';

import {
  Button,
  Table,
  TableHead,
  Paper,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';
import { Sort } from '@material-ui/icons';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },

  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none'
  }
};

const styles = theme => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
    background: '#191a1d'
  },
  dropdownStyle: {}
});

class LeaderboardsModal extends Component {
  state = {
    sortField: 'totalProfit',
    sortOrder: 'desc',
    showPlayerModal: false,
    selectedCreator: '',
    message: '',
    equityChartData: [], // Added state to store equity chart data
    receiptChartData: [], // Added state to store receipt chart data
    loadingEquityChartData: true, // Flag to check if data is loading
    loadingReceiptChartData: true, // Flag to check if data is loading
    isMobile: window.innerWidth <= 480,
  };

  async componentDidMount() {
    // Fetch all the necessary data
    await this.props.fetchLeaderboardsData();
    await this.props.fetchEquityDistribution();
    await this.props.fetchReceiptStatistics();

    const marketingStat = await this.props.getMarketingStat();
    // Set the fetched data to state
    this.setState({
      message: marketingStat.message,
      equityChartData: this.props.equityChart || [], // Store equity chart data
      receiptChartData: this.props.receiptChart || [], // Store receipt chart data
      loadingEquityChartData: this.props.loadingEquityChart || false, // Set loading flag to false after data is loaded
      loadingReceiptChartData: this.props.loadingReceiptChart || false, // Set loading flag to false after data is loaded
    });
  }

  handleOpenPlayerModal = creator_id => {
    this.setState({ showPlayerModal: true, selectedCreator: creator_id });
  };

  handleClosePlayerModal = () => {
    this.setState({ showPlayerModal: false });
  };

  handleSort = field => {
    this.setState(prevState => ({
      sortField: field,
      sortOrder:
        prevState.sortField === field
          ? prevState.sortOrder === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc'
    }));
  };

  render() {
    const { sortField, sortOrder, showPlayerModal, selectedCreator, message, isMobile } = this.state;
    const { leaderboards, isDarkMode, loading } = this.props;
    const { equityChartData, receiptChartData, loadingEquityChartData, loadingReceiptChartData } = this.state;

    // Define a base color and create shades for it
    const baseColor = '#c734ff'; // Base color (e.g., a shade of purple)
    const chartColors = [
      `${baseColor}BF`, // 75% opacity
      `${baseColor}99`, // 60% opacity
      `${baseColor}80`, // 50% opacity
      `${baseColor}66`, // 40% opacity
      `${baseColor}33`, // 20% opacity
      `${baseColor}1A`, // 10% opacity
    ];
    const chartWidth = isMobile ? '320px' : '400px';
    const receiptChartOptions = {
      chart: {
        type: 'pie',
        background: isDarkMode ? '#121212' : '#ffffff', // Adjust background based on dark mode
      },
      labels: [
        'Made over 10M',
        'Made over 1M',
        'Made over 0',
        'Not profitable',
      ],
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: chartWidth,
            },
          },
        },
      ],
      colors: chartColors,
      legend: {
        show: false, // Hide the legend inside the chart for consistency
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%', // Adjust the size of the donut chart
            labels: {
              show: false, // Hide the center label
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        formatter: (value, { seriesIndex }) => `${value.toFixed(2)}%`, // Show percentage
        style: {
          colors: ['#ffffff'], // Data label color
          fontSize: '14px', // Adjust font size
          fontWeight: 600, // Adjust font weight
        },
      },
      tooltip: {
        custom: function ({ seriesIndex, w }) {
          const labels = [
            'Made over 10M',
            'Made over 1M',
            'Made over 0',
            'Not profitable',
          ];
          return `
            <div style="display: flex; align-items: center;">
              <span style="color: ${baseColor};">${labels[seriesIndex]}: ${w.globals.series[seriesIndex].toFixed(2)}%</span>
            </div>
          `;
        },
        theme: isDarkMode ? 'dark' : 'light', // Adjust theme based on mode
        useHTML: true, // Allow HTML rendering in the tooltip
      },
    };

    // Handle case when equityChartData is undefined or empty
    const chartOptions = {
      chart: {
        type: 'pie',
        background: isDarkMode ? '#121212' : '#ffffff', // Adjust background based on dark mode
      },
      labels: equityChartData && equityChartData.length > 0 ? equityChartData.map(user => user.username.toUpperCase()) : [], // Use username as label
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: chartWidth
          }
        }
      }],
      colors: chartColors,
      legend: {
        show: false // Hide the legend inside the chart
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%', // Adjust the size of the donut chart
            labels: {
              show: false, // Hide the center label
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (value, { seriesIndex }) => {
          const user = equityChartData[seriesIndex];
          return `${value.toFixed(2)}%`; // Show username and percentage
        },
        style: {
          colors: ['#ffffff'], // Color for data labels
          fontSize: '14px', // Adjust font size
          fontWeight: 600, // Adjust font weight
        }
      },
      tooltip: {
        custom: function ({ seriesIndex, w }) {
          const user = equityChartData[seriesIndex];
          return `
            <div style="display: flex; align-items: center;">
              <img src="${user.avatar}" alt="${user.username}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" />
              <span style="color: ${baseColor};">${user.username}: ${w.globals.series[seriesIndex].toFixed(2)}%</span>
            </div>
          `;
        },
        theme: isDarkMode ? 'dark' : 'light',
        useHTML: true, // Allow HTML rendering in the tooltip
      },
    };

    const chartSeries = equityChartData && equityChartData.length > 0 ? equityChartData.map(user => user.equityPercentage) : [];
    const receiptChartSeries = receiptChartData
      ? [
        receiptChartData.overTenMillion,
        receiptChartData.betweenOneAndTenMillion,
        receiptChartData.betweenZeroAndOneMillion,
        receiptChartData.lessThanZero,
      ]
      : [];
    // Sort the leaderboards data based on current sorting options
    const sortedLeaderboards = [...leaderboards].sort((a, b) => {
      const aValue = a[this.state.sortField];
      const bValue = b[this.state.sortField];
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Leaderboards Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <FontAwesomeIcon icon={faList} className="mr-2" />
              Leaderboards
            </h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          {showPlayerModal && (
            <PlayerModal
              selectedCreator={selectedCreator}
              modalIsOpen={showPlayerModal}
              closeModal={this.handleClosePlayerModal}
            />
          )}
          <div className="modal-body leaderboards-modal edit-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <div className="marketing-message">
                  <p dangerouslySetInnerHTML={{ __html: message.replace(/(\d+(\.\d+)?%?)/g, '<strong>$1</strong>') }} />
                  {!loadingEquityChartData && (
                    <img className=" desktop-only" style={{ position: "absolute", bottom: "-50px", right: "50px", filter: "hue-rotate(272deg)" }} src={happyCat} width={"80px"} alt="Caesar the car" />
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(170, 170, 170, 0.06)", borderRadius: "20px", padding: "30px 10px", marginBottom: "30px" }}>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: window.innerWidth > 768 ? "row" : "column", // Row for desktop, column for mobile
                      justifyContent: "center",
                      alignItems: "center",
                      gap: "2rem", // Add some spacing between charts
                    }}
                  >
                    <div style={{ textAlign: "center" }}>
                      <h5 className="title">Equity Distribution (in-game)</h5>
                      {loadingEquityChartData ? (
                        <div style={{ marginTop: "20px" }}>
                          <LinearProgress color="secondary" />
                        </div>
                      ) : (
                        chartSeries.length > 0 && (
                          <Chart
                            options={chartOptions}
                            series={chartSeries ? chartSeries : []}
                            type="pie"
                            width="350"
                          />
                        )
                      )}
                    </div>

                    <div style={{ textAlign: "center" }}>
                      <h5 className="title">Profit Distribution ($RPS)</h5>
                      {loadingReceiptChartData ? (
                        <div style={{ marginTop: "20px" }}>
                          <LinearProgress color="secondary" />
                        </div>
                      ) : (
                        receiptChartSeries.length > 0 && (
                          <Chart
                            options={receiptChartOptions}
                            series={receiptChartSeries ? receiptChartSeries : []}
                            type="pie"
                            width="350"
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className='table'>
                  <h4 className="title">
                    All-time Leaderboards
                  </h4>
                  <br />
                  {!loading ? (
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell onClick={() => this.handleSort('username')}>
                            PLAYER {sortField === 'username' && <Sort />}
                          </TableCell>
                          <TableCell
                            onClick={() => this.handleSort('totalWagered')}
                          >
                            TOTAL WAGERED {sortField === 'totalWagered' && <Sort />}
                          </TableCell>
                          <TableCell onClick={() => this.handleSort('totalProfit')}>
                            NET PROFIT {sortField === 'totalProfit' && <Sort />}
                          </TableCell>
                          <TableCell
                            onClick={() => this.handleSort('profitAllTimeHigh')}
                          >
                            ALL-TIME-HIGH (ATH){' '}
                            {sortField === 'profitAllTimeHigh' && <Sort />}
                          </TableCell>
                          <TableCell
                            onClick={() => this.handleSort('profitAllTimeLow')}
                          >
                            ALL-TIME-LOW (ATL){' '}
                            {sortField === 'profitAllTimeLow' && <Sort />}
                          </TableCell>
                          <TableCell onClick={() => this.handleSort('gamePlayed')}>
                            GAMES PLAYED {sortField === 'gamePlayed' && <Sort />}
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedLeaderboards.map((entry, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <a className="player" onClick={() => this.handleOpenPlayerModal(entry._id)}>
                                <Avatar
                                  className="avatar"
                                  src={entry.avatar}
                                  rank={entry.totalWagered}
                                  accessory={entry.accessory}
                                  username={entry.username}
                                  alt=""
                                  darkMode={isDarkMode}
                                />
                              </a>
                              {/* <i
                        className={`online-status${
                          this.props.onlineUserList.filter(
                            user => user === row.creator_id
                          ).length > 0
                            ? ' online'
                            : ''
                        }`}
                      ></i> */}
                            </TableCell>
                            <TableCell>{convertToCurrency(entry.totalWagered)}</TableCell>
                            <TableCell>{convertToCurrency(entry.totalProfit)}</TableCell>
                            <TableCell>{convertToCurrency(entry.profitAllTimeHigh)}</TableCell>
                            <TableCell>{convertToCurrency(entry.profitAllTimeLow)}</TableCell>
                            <TableCell>{entry.gamePlayed}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>

                    </Table>
                  ) : (
                    <>
                      <div style={{ color: isDarkMode ? "#f9f9f9" : "#ccc" }}>
                        Loading Leaderboards...
                      </div>
                      <LinearProgress color='secondary' />
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal >
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  equityChart: state.customerReducer.equityChart,
  receiptChart: state.customerReducer.receiptChart,
  leaderboards: state.customerReducer.leaderboards,
  loading: state.customerReducer.loading,
  loadingEquityChart: state.customerReducer.loadingEquityChart,
  loadingReceiptChart: state.customerReducer.loadingReceiptChart,

});

const mapDispatchToProps = {
  fetchLeaderboardsData,
  fetchEquityDistribution,
  fetchReceiptStatistics,
  getMarketingStat,
  // getPlatformPercentages
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(LeaderboardsModal));
