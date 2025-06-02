import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  IconButton,
  Chip,
  Paper,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Sort as SortIcon, 
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList } from '@fortawesome/free-solid-svg-icons';

import PlayerModal from '../modal/PlayerModal';
import Avatar from '../../components/Avatar';
import { fetchLeaderboardsData } from '../../redux/Customer/customer.action';
import { convertToCurrency } from '../../util/conversion';

// Leaderboard column configuration
const COLUMNS = [
  { 
    key: 'username', 
    label: 'PLAYER', 
    sortable: true, 
    width: '20%',
    align: 'left'
  },
  { 
    key: 'totalWagered', 
    label: 'TOTAL WAGERED', 
    sortable: true, 
    width: '16%',
    isCurrency: true
  },
  { 
    key: 'totalTraded', 
    label: 'TOTAL TRADED', 
    sortable: true, 
    width: '16%',
    isCurrency: true
  },
  { 
    key: 'gameProfit', 
    label: 'GAME PROFIT', 
    sortable: true, 
    width: '16%',
    isCurrency: true,
    isProfit: true
  },
  { 
    key: 'tradingProfit', 
    label: 'TRADING PROFIT', 
    sortable: true, 
    width: '16%',
    isCurrency: true,
    isProfit: true
  },
  { 
    key: 'gamePlayed', 
    label: 'GAMES', 
    sortable: true, 
    width: '16%',
    align: 'center'
  },
];

// Medal icons for top 3 positions
const getMedalIcon = (position) => {
  switch (position) {
    case 0: return '🥇';
    case 1: return '🥈';
    case 2: return '🥉';
    default: return `#${position + 1}`;
  }
};

function LeaderboardsModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Redux selectors
  const { leaderboards, loading, solPrice, isDarkMode } = useSelector((state) => ({
    leaderboards: state.customerReducer.leaderboards,
    loading: state.customerReducer.loading,
    solPrice: state.logic.solPrice,
    isDarkMode: state.auth.isDarkMode,
  }));

  // Local state
  const [sortField, setSortField] = useState('gameProfit');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [selectedCreator, setSelectedCreator] = useState('');

  // Fetch data when modal opens
  useEffect(() => {
    if (modalIsOpen) {
      dispatch(fetchLeaderboardsData());
    }
  }, [modalIsOpen, dispatch]);

  // Sort handler
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc'); // Default to descending for new fields
    }
  }, [sortField]);

  // Player modal handlers
  const handleOpenPlayerModal = useCallback((creatorId) => {
    setSelectedCreator(creatorId);
    setShowPlayerModal(true);
  }, []);

  const handleClosePlayerModal = useCallback(() => {
    setShowPlayerModal(false);
    setSelectedCreator('');
  }, []);

  // Sorted leaderboards with memoization
  const sortedLeaderboards = useMemo(() => {
    if (!leaderboards?.length) return [];

    return [...leaderboards].sort((a, b) => {
      const aValue = a[sortField] || 0;
      const bValue = b[sortField] || 0;
      
      if (sortField === 'username') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [leaderboards, sortField, sortOrder]);

  // Render table header
  const renderTableHeader = () => (
    <TableHead>
      <TableRow sx={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600, 
          width: '60px',
          backgroundColor: 'transparent'
        }}>
          RANK
        </TableCell>
        {COLUMNS.map((column) => (
          <TableCell
            key={column.key}
            sx={{
              color: isDarkMode ? '#ccc' : '#666',
              fontWeight: 600,
              cursor: column.sortable ? 'pointer' : 'default',
              width: column.width,
              textAlign: column.align || 'left',
              backgroundColor: 'transparent',
              '&:hover': column.sortable ? { 
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' 
              } : {},
              transition: 'background-color 0.2s',
            }}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {column.label}
              {column.sortable && sortField === column.key && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {sortOrder === 'asc' ? (
                    <TrendingUpIcon sx={{ fontSize: 16, color: '#ff0000' }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 16, color: '#ff0000' }} />
                  )}
                </Box>
              )}
            </Box>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );

  // Render table cell value
  const renderCellValue = (entry, column) => {
    const value = entry[column.key];

    if (column.key === 'username') {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => handleOpenPlayerModal(entry._id)}
        >
          <Avatar
            src={entry.avatar}
            rank={entry.totalWagered}
            user_id={entry._id}
            accessory={entry.accessory}
            elite={entry.elite}
            username={entry.username}
            alt={entry.username}
            darkMode={isDarkMode}
            style={{ marginRight: 12 }}
          />
          <Box>
            <Typography sx={{ 
              fontSize: '0.9rem', 
              fontWeight: 500,
              color: isDarkMode ? '#fff' : '#333'
            }}>
              {entry.username}
            </Typography>
            {entry.elite && (
              <Chip 
                label="ELITE" 
                size="small" 
                sx={{ 
                  height: 16, 
                  fontSize: '0.6rem',
                  backgroundColor: '#ffd700',
                  color: '#000',
                  fontWeight: 600,
                  mt: 0.5
                }} 
              />
            )}
          </Box>
        </Box>
      );
    }

    if (column.isCurrency) {
      const currencyValue = convertToCurrency(value || 0, solPrice);
      const isNegative = (value || 0) < 0;
      
      return (
        <Typography 
          sx={{ 
            color: column.isProfit 
              ? (isNegative ? '#ff4444' : '#00ff3a')
              : '#fff',
            fontWeight: column.isProfit ? 600 : 400,
            textAlign: column.align || 'left'
          }}
        >
          {column.isProfit && !isNegative && '+'}
          {currencyValue}
        </Typography>
      );
    }

    return (
      <Typography sx={{ textAlign: column.align || 'left' }}>
        {value?.toLocaleString() || '0'}
      </Typography>
    );
  };

  // Render table body
  const renderTableBody = () => (
    <TableBody>
      {sortedLeaderboards.map((entry, index) => (
        <TableRow 
          key={entry._id} 
          sx={{
            '&:hover': { 
              backgroundColor: 'rgba(255,255,255,0.05)',
            },
            transition: 'background-color 0.2s',
          }}
        >
          <TableCell sx={{ color: isDarkMode ? '#fff' : '#333' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {getMedalIcon(index)}
              </Typography>
              {index < 3 && <TrophyIcon sx={{ fontSize: 16, color: '#ffd700' }} />}
            </Box>
          </TableCell>
          {COLUMNS.map((column) => (
            <TableCell key={column.key} sx={{ color: isDarkMode ? '#fff' : '#333' }}>
              {renderCellValue(entry, column)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <Box sx={{ mt: 2 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2 }}>
          <Skeleton variant="text" width="40px" height={24} />
          <Skeleton variant="circular" width={40} height={40} />
          <Skeleton variant="text" width="120px" height={24} />
          <Skeleton variant="text" width="100px" height={24} />
          <Skeleton variant="text" width="100px" height={24} />
          <Skeleton variant="text" width="100px" height={24} />
          <Skeleton variant="text" width="100px" height={24} />
          <Skeleton variant="text" width="60px" height={24} />
        </Box>
      ))}
    </Box>
  );

  return (
    <>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        BackdropProps={{ 
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } 
        }}
      >
        <Paper
          elevation={24}
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95vw', sm: '90vw', md: '85vw', lg: '80vw' },
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 3,
            p: { xs: 2, sm: 3, md: 4 },
            background: isDarkMode 
              ? 'rgba(30, 30, 30, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: `0 8px 32px ${isDarkMode ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)'}`,
            color: isDarkMode ? '#fff' : '#333',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 3,
              pb: 2,
              borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <TrophyIcon sx={{ fontSize: 28, color: '#ffd700' }} />
              <Typography variant="h5" sx={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#333' }}>
                LEADERBOARDS
              </Typography>
              <Chip 
                label="ALL-TIME" 
                size="small" 
                sx={{ 
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  fontWeight: 600
                }} 
              />
            </Box>
            <IconButton
              onClick={closeModal}
              sx={{
                color: isDarkMode ? '#fff' : '#333',
                bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '&:hover': { 
                  bgcolor: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' 
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Stats Summary */}
          {!loading && sortedLeaderboards.length > 0 && (
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${sortedLeaderboards.length} Players`} 
                variant="outlined"
                sx={{ borderColor: '#ff0000', color: isDarkMode ? '#fff' : '#333' }}
              />
              <Chip 
                label={`Total Wagered: ${convertToCurrency(
                  sortedLeaderboards.reduce((sum, p) => sum + (p.totalWagered || 0), 0), 
                  solPrice
                )}`}
                variant="outlined"
                sx={{ borderColor: '#ff0000', color: isDarkMode ? '#fff' : '#333' }}
              />
            </Box>
          )}

          {/* Table */}
          {!loading ? (
            <TableContainer 
              sx={{ 
                overflowX: 'auto',
                borderRadius: 2,
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <Table sx={{ minWidth: 800 }} stickyHeader>
                {renderTableHeader()}
                {renderTableBody()}
              </Table>
            </TableContainer>
          ) : (
            renderLoadingSkeleton()
          )}

          {/* Empty state */}
          {!loading && sortedLeaderboards.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrophyIcon sx={{ fontSize: 48, color: 'rgba(255,255,255,0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                No leaderboard data available
              </Typography>
            </Box>
          )}
        </Paper>
      </Modal>

      {/* Player Modal */}
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