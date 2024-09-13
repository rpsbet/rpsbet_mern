import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { fetchLeaderboardsData, fetchEquityDistribution, getMarketingStat } from '../../redux/Customer/customer.action';
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
    message: ''
  };



  async componentDidMount() {
    await this.props.fetchLeaderboardsData();
    await this.props.fetchEquityDistribution();
    const marketingStat = await this.props.getMarketingStat();
    this.setState({ message: marketingStat.message });
    // const result = await this.props.getPlatformPercentages()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.equityChart !== this.props.equityChart) {
      console.log('Updated equityChart:', this.props.equityChart);
    }
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
    const {
      sortField,
      sortOrder,
      showPlayerModal,
      selectedCreator,
      message
    } = this.state;

    const { leaderboards, isDarkMode, loading, equityChart, loadingEquityChart } = this.props;

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

    // Handle case when equityChart is undefined or empty
    const chartOptions = {
      chart: {
        type: 'pie',
        background: isDarkMode ? '#121212' : '#ffffff', // Adjust background based on dark mode
      },
      labels: equityChart && equityChart.length > 0 ? equityChart.map(user => user.username.toUpperCase()) : [], // Use username as label
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
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
          const user = equityChart[seriesIndex];
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
          const user = equityChart[seriesIndex];
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

    const chartSeries = equityChart && equityChart.length > 0 ? equityChart.map(user => user.equityPercentage) : [];
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
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>

                  <h4 className="title">
                    Top RPS Holders
                  </h4>
                  <br />
                  {loadingEquityChart ? (
                    <>
                      <div>Loading Distribution...</div>
                      <LinearProgress color='secondary' />
                    </>

                  ) : (
                    // Display the pie chart only if equityChart data is available
                    equityChart && equityChart.length > 0 ? (
                      <Chart options={chartOptions} series={chartSeries} type="pie" width="500" />
                    ) : (
                      <div>Calculating Equities</div>
                    )
                  )}
                  <div className="marketing-message">
                    <p dangerouslySetInnerHTML={{ __html: message.replace(/(\d+(\.\d+)?%?)/g, '<strong>$1</strong>') }} />
                    {!loadingEquityChart && (
                      <img className=" desktop-only" style={{ position: "absolute", bottom: "-50px", right: "50px", filter: "hue-rotate(272deg)" }} src={happyCat} width={"80px"} alt="Caesar the car" />
                    )}
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
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  equityChart: state.customerReducer.equityChart,
  leaderboards: state.customerReducer.leaderboards,
  loading: state.customerReducer.loading,
  loadingEquityChart: state.customerReducer.loadingEquityChart,

});

const mapDispatchToProps = {
  fetchLeaderboardsData,
  fetchEquityDistribution,
  getMarketingStat,
  // getPlatformPercentages
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(LeaderboardsModal));
