import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// MUI v5
import {
  Modal,
  Box,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Skeleton,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Sort as SortIcon } from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

// Custom components
import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';

// Actions & Selectors
import {
  fetchLeaderboardsData,
  fetchReceiptStatistics,
  fetchEquityDistribution,
} from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';

function LeaderboardsModal({
  // Modal props (only keep parent-passed props)
  modalIsOpen,
  closeModal,
}) {
  const dispatch = useDispatch();

  // Replace mapStateToProps with useSelector
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const equityChart = useSelector((state) => state.customerReducer.equityChart);
  const receiptChart = useSelector((state) => state.customerReducer.receiptChart);
  const leaderboards = useSelector((state) => state.customerReducer.leaderboards);
  const loading = useSelector((state) => state.customerReducer.loading);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const loadingEquityChart = useSelector((state) => state.customerReducer.loadingEquityChart);
  const loadingReceiptChart = useSelector((state) => state.customerReducer.loadingReceiptChart);

  // -------------------- Local State --------------------
  const [sortField, setSortField] = useState('gameProfit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // Chart data states
  const [equityChartData, setEquityChartData] = useState([]);
  const [receiptChartData, setReceiptChartData] = useState([]);

  // Loading states for charts
  const [loadingEquityChartData, setLoadingEquityChartData] = useState(true);
  const [loadingReceiptChartData, setLoadingReceiptChartData] = useState(true);

  // Responsive checks
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // -------------------- 1) Fetch Once When Modal Opens --------------------
  useEffect(() => {
    if (!modalIsOpen) return;

    (async () => {
      try {
        // Fetch everything only once per open
        await dispatch(fetchLeaderboardsData()); // Dispatch directly
        // await dispatch(fetchEquityDistribution());
        // await dispatch(fetchReceiptStatistics());
      } catch (error) {
        console.error('Error fetching leaderboards data:', error);
      }
    })();
  }, [modalIsOpen, dispatch]); // Add dispatch to dependencies

  // -------------------- 2) Sync Equity Chart State From Redux --------------------
  // useEffect(() => {
  //   setEquityChartData(Array.isArray(equityChart) ? equityChart : []);
  //   setLoadingEquityChartData(loadingEquityChart || false);
  // }, [equityChart, loadingEquityChart]);

  // -------------------- 3) Sync Receipt Chart State From Redux --------------------
  // useEffect(() => {
  //   setReceiptChartData(receiptChart || {});
  //   setLoadingReceiptChartData(loadingReceiptChart || false);
  // }, [receiptChart, loadingReceiptChart]);

  // -------------------- Sorting & Player Modal Handlers --------------------
  const handleOpenPlayerModal = useCallback((creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
  }, []);

  const handleSort = useCallback((field) => {
    setSortField((prevField) => {
      if (prevField === field) {
        setSortOrder((prevOrder) => (prevOrder === 'asc' ? 'desc' : 'asc'));
        return prevField;
      } else {
        setSortOrder('asc');
        return field;
      }
    });
  }, []);

  // -------------------- Chart Config / Colors --------------------
  const baseColor = '#c734ff';
  const chartColors = [
    `${baseColor}BF`,
    `${baseColor}99`,
    `${baseColor}80`,
    `${baseColor}66`,
    `${baseColor}33`,
    `${baseColor}1A`,
  ];
  const chartWidth = isMobile ? '250px' : '350px';

  // **Equity Chart**: safe array map
  const equityChartSeries =
    equityChartData.map((u) => u.equityPercentage) || [];
  const equityChartOptions = {
    chart: {
      type: equityChartSeries.length > 0 ? 'pie' : 'donut',
    },
    labels: equityChartData.map((user) => user.username.toUpperCase()) || [],
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { width: chartWidth } },
      },
    ],
    colors: chartColors,
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(2)}%`,
      style: {
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    tooltip: {
      custom: ({ seriesIndex, w }) => {
        const user = equityChartData[seriesIndex];
        if (!user) return '';
        return `
          <div style="display: flex; align-items: center;">
            <img src="${user.avatar}" alt="${user.username}" style="width:24px; height:24px; border-radius:50%; margin-right:8px;" />
            <span style="color:${baseColor};">
              ${user.username}: ${w.globals.series[seriesIndex].toFixed(2)}%
            </span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false },
        },
      },
    },
  };

  // **Receipt Chart**: destructure safely from receiptChartData
  const {
    overTenMillion = 0,
    betweenOneAndTenMillion = 0,
    betweenZeroAndOneMillion = 0,
    lessThanZero = 0,
  } = receiptChartData;

  const receiptChartSeries = [
    overTenMillion,
    betweenOneAndTenMillion,
    betweenZeroAndOneMillion,
    lessThanZero,
  ];
  const receiptChartOptions = {
    chart: {
      type: receiptChartSeries.length > 0 ? 'pie' : 'donut',
    },
    labels: ['Made over 10M', 'Made over 1M', 'Made over 0', 'Not profitable'],
    responsive: [
      {
        breakpoint: 480,
        options: { chart: { width: chartWidth } },
      },
    ],
    colors: chartColors,
    legend: { show: false },
    dataLabels: {
      enabled: true,
      formatter: (value) => `${value.toFixed(2)}%`,
      style: {
        colors: ['#ffffff'],
        fontSize: '14px',
        fontWeight: 600,
      },
    },
    tooltip: {
      custom: ({ seriesIndex, w }) => {
        const labels = [
          'Made over 10M',
          'Made over 1M',
          'Made over 0',
          'Not profitable',
        ];
        return `
          <div style="display: flex; align-items: center;">
            <span style="color:${baseColor};">
              ${labels[seriesIndex]}: ${w.globals.series[seriesIndex].toFixed(2)}%
            </span>
          </div>
        `;
      },
      theme: isDarkMode ? 'dark' : 'light',
      useHTML: true,
    },
    plotOptions: {
      pie: {
        donut: {
          size: '70%',
          labels: { show: false },
        },
      },
    },
  };

  // -------------------- Sort Leaderboards --------------------
  const sortedLeaderboards = leaderboards
    ? [...leaderboards].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      })
    : [];

  // -------------------- Render --------------------
  return (
    <>
      <Modal
        open={modalIsOpen || false}
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
            bgcolor: isDarkMode ? '#0a0a0a' : '#fff',
            color: isDarkMode ? '#fff' : '#000',
            width: isMobile ? '95vw' : '80vw',
            height: isMobile ? '95vh' : '80vh',
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: 24,
            p: 3,
          }}
        >
          {/* HEADER */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <FontAwesomeIcon icon={faList} />
              LEADERBOARDS
            </Typography>
            <Button
              variant="text"
              color="error"
              onClick={closeModal}
              sx={{ fontSize: '1.25rem' }}
            >
              ×
            </Button>
          </Box>
          <Box
            sx={{
              background: '#080808',
              borderRadius: '0.3em',
              p: '20px',
            }}
          >
            {/* CHARTS SECTION */}
            {/* <Box
              sx={{
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 4,
                p: 2,
                mb: 3
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography  className='roll-tag title' variant="h5">Capital Distribution</Typography>
                {loadingEquityChartData ? (
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="circular" width={200} height={200} />
                    <Skeleton variant="text" sx={{ width: '60%', margin: '10px auto' }} />
                  </Box>
                ) : equityChartSeries.length > 0 ? (
                  <Chart
                    options={equityChartOptions}
                    series={equityChartSeries}
                    type="pie"
                    width={isMobile ? 200 : 350}
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    No data available
                  </Typography>
                )}
              </Box>

              <Box sx={{ textAlign: 'center' }}>
                <Typography className='roll-tag title' variant="h5">Profit Distribution</Typography>
                {loadingReceiptChartData ? (
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="circular" width={200} height={200} />
                    <Skeleton variant="text" sx={{ width: '60%', margin: '10px auto' }} />
                  </Box>
                ) : receiptChartSeries.reduce((a, b) => a + b, 0) > 0 ? (
                  <Chart
                    options={receiptChartOptions}
                    series={receiptChartSeries}
                    type="pie"
                    width={isMobile ? 200 : 350}
                  />
                ) : (
                  <Typography variant="body2" sx={{ mt: 2 }}>
                    No data available
                  </Typography>
                )}
              </Box>
            </Box> */}

            {/* LEADERBOARDS TABLE */}
            <Typography variant="h6" sx={{ mb: 2 }}>
              ALL-TIME LEADERBOARDS
            </Typography>
            {!loading ? (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: '588px' }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('username')}
                      >
                        PLAYER {sortField === 'username' && <SortIcon />}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('totalWagered')}
                      >
                        TOTAL WAGERED{' '}
                        {sortField === 'totalWagered' && <SortIcon />}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('totalTraded')}
                      >
                        TOTAL TRADED{' '}
                        {sortField === 'totalTraded' && <SortIcon />}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('gameProfit')}
                      >
                        GAME PROFIT {sortField === 'gameProfit' && <SortIcon />}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('tradingProfit')} // Fixed typo: 'gameProfit' -> 'tradingProfit'
                      >
                        TRADING PROFIT{' '}
                        {sortField === 'tradingProfit' && <SortIcon />}
                      </TableCell>
                      <TableCell
                        sx={{
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleSort('gamePlayed')}
                      >
                        GAMES PLAYED{' '}
                        {sortField === 'gamePlayed' && <SortIcon />}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedLeaderboards.map((entry, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: '#fff' }}>
                          <Box
                            className="player"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleOpenPlayerModal(entry._id)}
                          >
                            <Avatar
                              className="avatar"
                              src={entry.avatar}
                              rank={entry.totalWagered}
                              user_id={entry._id}
                              accessory={entry.accessory}
                              username={entry.username}
                              alt={entry.username}
                              darkMode={isDarkMode}
                            />
                            <Typography sx={{ ml: 1 }}>
                              {entry.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {convertToCurrency(entry.totalWagered, solPrice)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {convertToCurrency(entry.totalTraded, solPrice)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {convertToCurrency(entry.gameProfit, solPrice)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {convertToCurrency(entry.tradingProfit, solPrice)}
                        </TableCell>
                        <TableCell sx={{ color: '#fff' }}>
                          {entry.gamePlayed}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              // Loading Skeletons for the table
              <Box sx={{ mt: 2 }}>
                {[...Array(5)].map((_, index) => (
                  <Box
                    key={index}
                    sx={{ display: 'flex', alignItems: 'center', mb: 2 }}
                  >
                    <Skeleton
                      variant="circular"
                      width={40}
                      height={40}
                      sx={{ mr: 2 }}
                    />
                    <Skeleton variant="text" width="20%" sx={{ mr: 2 }} />
                    <Skeleton variant="text" width="15%" sx={{ mr: 2 }} />
                    <Skeleton variant="text" width="15%" sx={{ ml: 'auto' }} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
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

export default LeaderboardsModal;