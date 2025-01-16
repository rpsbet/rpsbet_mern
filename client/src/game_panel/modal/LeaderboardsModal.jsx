import React, { useState, useEffect, useCallback } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';
import Chart from 'react-apexcharts';
import { Skeleton } from '@material-ui/lab';

import {
  Button,
  Table,
  TableHead,
  Paper,
  TableRow,
  TableCell,
  TableBody
} from '@material-ui/core';

import { Sort } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import {
  fetchLeaderboardsData,
  fetchReceiptStatistics,
  fetchEquityDistribution
} from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';
import happyCat from '../../util/happyCat.svg'; // Not referenced but preserved if needed

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

const styles = (theme) => ({
  root: {
    width: '150px',
    padding: '8px 15px',
    fontSize: '16px',
    background: '#191a1d'
  },
  dropdownStyle: {}
});

function LeaderboardsModal(props) {
  const {
    modalIsOpen,
    closeModal,
    isDarkMode,
    equityChart,
    receiptChart,
    leaderboards,
    loading,
    solPrice,
    loadingEquityChart,
    loadingReceiptChart,
    fetchLeaderboardsData,
    fetchEquityDistribution,
    fetchReceiptStatistics,
    classes
  } = props;

  // ---------------------------
  // Local State
  // ---------------------------
  const [sortField, setSortField] = useState('totalProfit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');
  const [equityChartData, setEquityChartData] = useState([]);
  const [receiptChartData, setReceiptChartData] = useState([]);
  const [loadingEquityChartData, setLoadingEquityChartData] = useState(true);
  const [loadingReceiptChartData, setLoadingReceiptChartData] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    let isMounted = true; // To replicate _isMounted check

    async function loadData() {
      try {
        await fetchLeaderboardsData();
        await fetchEquityDistribution();
        await fetchReceiptStatistics();

        if (isMounted) {
          setEquityChartData(equityChart || []);
          setReceiptChartData(receiptChart || []);
          setLoadingEquityChartData(loadingEquityChart || false);
          setLoadingReceiptChartData(loadingReceiptChart || false);
        }
      } catch (error) {
        console.error('Error fetching leaderboard data:', error);
      }
    }

    loadData();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [
    fetchLeaderboardsData,
    fetchEquityDistribution,
    fetchReceiptStatistics,
    equityChart,
    receiptChart,
    loadingEquityChart,
    loadingReceiptChart
  ]);

  // ---------------------------
  // Handlers
  // ---------------------------
  const handleOpenPlayerModal = useCallback((creator_id) => {
    setShowPlayerModal(true);
    setSelectedCreator(creator_id);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleSort = useCallback(
    (field) => {
      setSortField((prevField) => {
        if (prevField === field) {
          // Toggle asc / desc if the same field
          setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          return prevField;
        } else {
          // Set a new field and default to 'asc'
          setSortOrder('asc');
          return field;
        }
      });
    },
    [setSortField, setSortOrder]
  );

  // ---------------------------
  // Chart Config
  // ---------------------------
  const baseColor = '#c734ff'; // Base color
  const chartColors = [
    `${baseColor}BF`, // 75% opacity
    `${baseColor}99`, // 60% opacity
    `${baseColor}80`, // 50% opacity
    `${baseColor}66`, // 40% opacity
    `${baseColor}33`, // 20% opacity
    `${baseColor}1A`  // 10% opacity
  ];
  const chartWidth = isMobile ? '320px' : '400px';

  // Equity Chart
  const chartSeries = equityChartData?.map((user) => user.equityPercentage) || [];
  const chartOptions = {
    chart: {
      type: chartSeries.length > 0 ? 'pie' : 'donut',
      background: isDarkMode ? '#121212' : '#ffffff'
    },
    labels:
      equityChartData && equityChartData.length > 0
        ? equityChartData.map((user) => user.username.toUpperCase())
        : [],
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: { width: chartWidth }
        }
      }
    ],
    colors: chartColors,
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value, { seriesIndex }) => {
        const user = equityChartData[seriesIndex];
        return `${value.toFixed(2)}%`;
      },
      style: {
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 600
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
      useHTML: true
    }
  };

  // Receipt Chart
  const receiptChartSeries = receiptChartData
    ? [
        receiptChartData.overTenMillion,
        receiptChartData.betweenOneAndTenMillion,
        receiptChartData.betweenZeroAndOneMillion,
        receiptChartData.lessThanZero
      ]
    : [];
  const receiptChartOptions = {
    chart: {
      type: receiptChartSeries.length > 0 ? 'pie' : 'donut',
      background: isDarkMode ? '#121212' : '#ffffff'
    },
    labels: ['Made over 10M', 'Made over 1M', 'Made over 0', 'Not profitable'],
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { width: chartWidth } }
      }
    ],
    colors: chartColors,
    legend: { show: false },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false }
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(2)}%`,
      style: {
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 600
      }
    },
    tooltip: {
      custom: function ({ seriesIndex, w }) {
        const labels = [
          'Made over 10M',
          'Made over 1M',
          'Made over 0',
          'Not profitable'
        ];
        return `
          <div style="display: flex; align-items: center;">
            <span style="color: ${baseColor};">${labels[seriesIndex]}: ${w.globals.series[seriesIndex].toFixed(2)}%</span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true
    }
  };

  // ---------------------------
  // Sorting
  // ---------------------------
  const sortedLeaderboards = leaderboards
    ? [...leaderboards].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      })
    : [];

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Leaderboards Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faList} className="mr-2" />
            Leaderboards
          </h2>
          <Button className="btn-close title" onClick={closeModal}>
            ×
          </Button>
        </div>

        {showPlayerModal && (
          <PlayerModal
            selectedCreator={selectedCreator}
            modalIsOpen={showPlayerModal}
            closeModal={handleClosePlayerModal}
          />
        )}

        <div className="modal-body leaderboards-modal edit-modal-body">
          <div className="modal-content-wrapper">
            <div className="modal-content-panel">
              {/* Capital Distribution + Profit Distribution */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'rgba(170, 170, 170, 0.06)',
                  borderRadius: '0.3em',
                  padding: '30px 10px',
                  marginBottom: '30px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: window.innerWidth > 768 ? 'row' : 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '2rem'
                  }}
                >
                  {/* Capital Distribution */}
                  <div style={{ textAlign: 'center' }}>
                    <h5 className="title">Capital Distribution</h5>
                    {loadingEquityChartData ? (
                      <div style={{ marginTop: '20px' }}>
                        <Skeleton variant="circle" width={350} height={350} />
                        <Skeleton
                          variant="text"
                          width="60%"
                          style={{ margin: '10px auto' }}
                        />
                      </div>
                    ) : (
                      chartSeries.length > 0 && (
                        <Chart
                          options={chartOptions}
                          series={chartSeries}
                          type="pie"
                          width="350"
                        />
                      )
                    )}
                  </div>

                  {/* Profit Distribution */}
                  <div style={{ textAlign: 'center' }}>
                    <h5 className="title">Profit Distribution</h5>
                    {loadingReceiptChartData ? (
                      <div style={{ marginTop: '20px' }}>
                        <Skeleton variant="circle" width={350} height={350} />
                        <Skeleton
                          variant="text"
                          width="60%"
                          style={{ margin: '10px auto' }}
                        />
                      </div>
                    ) : (
                      receiptChartSeries.length > 0 && (
                        <Chart
                          options={receiptChartOptions}
                          series={receiptChartSeries}
                          type="pie"
                          width="350"
                        />
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Leaderboards Table */}
              <div className="table">
                <h4 className="title">All-time Leaderboards</h4>
                <br />
                {!loading ? (
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell onClick={() => handleSort('username')}>
                          PLAYER {sortField === 'username' && <Sort />}
                        </TableCell>
                        <TableCell onClick={() => handleSort('totalWagered')}>
                          TOTAL WAGERED {sortField === 'totalWagered' && <Sort />}
                        </TableCell>
                        <TableCell onClick={() => handleSort('totalProfit')}>
                          NET PROFIT {sortField === 'totalProfit' && <Sort />}
                        </TableCell>
                        <TableCell onClick={() => handleSort('profitAllTimeHigh')}>
                          ALL-TIME-HIGH (ATH){' '}
                          {sortField === 'profitAllTimeHigh' && <Sort />}
                        </TableCell>
                        <TableCell onClick={() => handleSort('profitAllTimeLow')}>
                          ALL-TIME-LOW (ATL){' '}
                          {sortField === 'profitAllTimeLow' && <Sort />}
                        </TableCell>
                        <TableCell onClick={() => handleSort('gamePlayed')}>
                          GAMES PLAYED {sortField === 'gamePlayed' && <Sort />}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedLeaderboards.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <a
                              className="player"
                              onClick={() => handleOpenPlayerModal(entry._id)}
                            >
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
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(entry.totalWagered, solPrice)}
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(entry.totalProfit, solPrice)}
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(entry.profitAllTimeHigh, solPrice)}
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(entry.profitAllTimeLow, solPrice)}
                          </TableCell>
                          <TableCell>{entry.gamePlayed}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div style={{ margin: '20px 0' }}>
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}
                      >
                        <Skeleton
                          variant="circle"
                          width={40}
                          height={40}
                          style={{ marginRight: '15px' }}
                        />
                        <Skeleton
                          variant="text"
                          width="20%"
                          style={{ marginRight: '10px' }}
                        />
                        <Skeleton variant="text" width="15%" />
                        <Skeleton
                          variant="text"
                          width="15%"
                          style={{ marginLeft: 'auto', marginRight: '10px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ----------------------
// Redux & HOC Wrapping
// ----------------------
const mapStateToProps = (state) => ({
  auth: state.auth.isAuthenticated,
  user_id: state.auth.user._id,
  isDarkMode: state.auth.isDarkMode,
  equityChart: state.customerReducer.equityChart,
  receiptChart: state.customerReducer.receiptChart,
  leaderboards: state.customerReducer.leaderboards,
  loading: state.customerReducer.loading,
  solPrice: state.logic.solPrice,
  loadingEquityChart: state.customerReducer.loadingEquityChart,
  loadingReceiptChart: state.customerReducer.loadingReceiptChart
});

const mapDispatchToProps = {
  fetchLeaderboardsData,
  fetchEquityDistribution,
  fetchReceiptStatistics
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(LeaderboardsModal));