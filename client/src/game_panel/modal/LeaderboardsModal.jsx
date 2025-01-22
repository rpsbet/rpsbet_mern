import React, { useState, useEffect, useCallback } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Skeleton,
  Typography,
  useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { Sort } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import Chart from 'react-apexcharts';
import {
  fetchLeaderboardsData,
  fetchReceiptStatistics,
  fetchEquityDistribution
} from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';

function LeaderboardsModal({
  // Modal props
  modalIsOpen,
  closeModal,

  // Props from Redux
  isDarkMode,
  equityChart,
  receiptChart,
  leaderboards,
  loading,
  solPrice,
  loadingEquityChart,
  loadingReceiptChart,

  // Redux actions
  fetchLeaderboardsData,
  fetchEquityDistribution,
  fetchReceiptStatistics
}) {
  // ---------------------------
  // Local State
  // ---------------------------
  const [sortField, setSortField] = useState('totalProfit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // For charts
  const [equityChartData, setEquityChartData] = useState([]);
  const [receiptChartData, setReceiptChartData] = useState([]);
  const [loadingEquityChartData, setLoadingEquityChartData] = useState(true);
  const [loadingReceiptChartData, setLoadingReceiptChartData] = useState(true);

  // Responsive: use MUI’s breakpoints
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // ---------------------------
  // Effects
  // ---------------------------
  useEffect(() => {
    if (modalIsOpen) {
      // Fetch data only when this modal opens
      (async () => {
        try {
          await fetchLeaderboardsData();
          await fetchEquityDistribution();
          await fetchReceiptStatistics();

          setEquityChartData(equityChart || []);
          setReceiptChartData(receiptChart || []);
          setLoadingEquityChartData(loadingEquityChart || false);
          setLoadingReceiptChartData(loadingReceiptChart || false);
        } catch (error) {
          console.error('Error fetching leaderboard data:', error);
        }
      })();
    }
  }, [
    modalIsOpen,
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
  const handleOpenPlayerModal = useCallback((creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleSort = useCallback(
    (field) => {
      setSortField((prevField) => {
        if (prevField === field) {
          // Toggle asc/desc if same field
          setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
          return prevField;
        } else {
          // Set new field, default to asc
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
  const baseColor = '#c734ff';
  const chartColors = [
    `${baseColor}BF`,
    `${baseColor}99`,
    `${baseColor}80`,
    `${baseColor}66`,
    `${baseColor}33`,
    `${baseColor}1A`
  ];
  const chartWidth = isMobile ? '250px' : '350px';

  // Equity chart
  const chartSeries = equityChartData?.map((u) => u.equityPercentage) || [];
  const chartOptions = {
    chart: {
      type: chartSeries.length > 0 ? 'pie' : 'donut',
      background: isDarkMode ? '#121212' : '#ffffff'
    },
    labels:
      equityChartData?.map((user) => user.username.toUpperCase()) || [],
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { width: chartWidth } }
      }
    ],
    colors: chartColors,
    legend: { show: false },
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
      custom: ({ seriesIndex, w }) => {
        const user = equityChartData[seriesIndex];
        if (!user) return '';
        return `
          <div style="display: flex; align-items: center;">
            <img src="${user.avatar}" alt="${user.username}" style="width: 24px; height: 24px; border-radius: 50%; margin-right: 8px;" />
            <span style="color: ${baseColor};">
              ${user.username}: ${w.globals.series[seriesIndex].toFixed(2)}%
            </span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false }
        }
      }
    }
  };

  // Receipt chart
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
      custom: ({ seriesIndex, w }) => {
        const labels = [
          'Made over 10M',
          'Made over 1M',
          'Made over 0',
          'Not profitable'
        ];
        return `
          <div style="display: flex; align-items: center;">
            <span style="color: ${baseColor};">
              ${labels[seriesIndex]}: ${w.globals.series[seriesIndex].toFixed(2)}%
            </span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false }
        }
      }
    }
  };

  // ---------------------------
  // Sorting Leaderboards
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
    <>
      {/* MAIN MODAL */}
      <Modal
        open={modalIsOpen}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            bgcolor: isDarkMode ? '#400068' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: isMobile ? '95vw' : '80vw',
            height: isMobile ? '95vh' : '80vh',
            overflowY: 'auto',
            borderRadius: 1,
            boxShadow: 24,
            p: 3
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2
            }}
          >
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FontAwesomeIcon icon={faList} />
              Leaderboards
            </Typography>

            <Button variant="text" color="error" onClick={closeModal} sx={{ fontSize: '1.25rem' }}>
              ×
            </Button>
          </Box>

          {/* CHARTS SECTION */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              backgroundColor: isDarkMode ? '#2e2e2e' : '#fafafa',
              p: 2,
              borderRadius: 1,
              mb: 3
            }}
          >
            {/* Equity Chart */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">Capital Distribution</Typography>
              {loadingEquityChartData ? (
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="circular" width={200} height={200} />
                  <Skeleton variant="text" sx={{ width: '60%', margin: '10px auto' }} />
                </Box>
              ) : (
                chartSeries.length > 0 && (
                  <Chart
                    options={chartOptions}
                    series={chartSeries}
                    type="pie"
                    width={isMobile ? 200 : 350}
                  />
                )
              )}
            </Box>

            {/* Receipt Chart */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6">Profit Distribution</Typography>
              {loadingReceiptChartData ? (
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="circular" width={200} height={200} />
                  <Skeleton variant="text" sx={{ width: '60%', margin: '10px auto' }} />
                </Box>
              ) : (
                receiptChartSeries.length > 0 && (
                  <Chart
                    options={receiptChartOptions}
                    series={receiptChartSeries}
                    type="pie"
                    width={isMobile ? 200 : 350}
                  />
                )
              )}
            </Box>
          </Box>

          {/* LEADERBOARDS TABLE */}
          <Typography variant="h6" sx={{ mb: 2 }}>
            All-time Leaderboards
          </Typography>

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
                    ALL-TIME-HIGH {sortField === 'profitAllTimeHigh' && <Sort />}
                  </TableCell>
                  <TableCell onClick={() => handleSort('profitAllTimeLow')}>
                    ALL-TIME-LOW {sortField === 'profitAllTimeLow' && <Sort />}
                  </TableCell>
                  <TableCell onClick={() => handleSort('gamePlayed')}>
                    GAMES PLAYED {sortField === 'gamePlayed' && <Sort />}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedLeaderboards.map((entry, idx) => (
                  <TableRow key={idx}>
                    <TableCell>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        onClick={() => handleOpenPlayerModal(entry._id)}
                      >
                        <Avatar
                          src={entry.avatar}
                          rank={entry.totalWagered}
                          accessory={entry.accessory}
                          username={entry.username}
                          alt={entry.username}
                          darkMode={isDarkMode}
                        />
                        <Typography sx={{ ml: 1 }}>{entry.username}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{convertToCurrency(entry.totalWagered, solPrice)}</TableCell>
                    <TableCell>{convertToCurrency(entry.totalProfit, solPrice)}</TableCell>
                    <TableCell>{convertToCurrency(entry.profitAllTimeHigh, solPrice)}</TableCell>
                    <TableCell>{convertToCurrency(entry.profitAllTimeLow, solPrice)}</TableCell>
                    <TableCell>{entry.gamePlayed}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            // Loading Skeleton for table
            <Box sx={{ mt: 2 }}>
              {[...Array(5)].map((_, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2
                  }}
                >
                  <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />
                  <Skeleton variant="text" width="20%" sx={{ mr: 2 }} />
                  <Skeleton variant="text" width="15%" sx={{ mr: 2 }} />
                  <Skeleton variant="text" width="15%" sx={{ ml: 'auto' }} />
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Modal>

      {/* PLAYER MODAL */}
      {showPlayerModal && (
        <PlayerModal
          selectedCreator={selectedCreator}
          modalIsOpen={showPlayerModal}
          closeModal={handleClosePlayerModal}
        />
      )}
    </>
  );
}

// ----------------------
// REDUX & EXPORT
// ----------------------
const mapStateToProps = (state) => ({
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

export default connect(mapStateToProps, mapDispatchToProps)(LeaderboardsModal);