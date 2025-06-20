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
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { 
  Sort as SortIcon, 
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';

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
      <TableRow>
        <TableCell sx={{ 
          color: 'rgba(255, 255, 255, 0.6)', 
          fontWeight: 600, 
          width: '60px',
          fontSize: '0.75rem',
        }}>
          RANK
        </TableCell>
        {COLUMNS.map((column) => (
          <TableCell
            key={column.key}
            sx={{
              color: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 600,
              cursor: column.sortable ? 'pointer' : 'default',
              width: column.width,
              textAlign: column.align || 'left',
              fontSize: '0.75rem',
              '&:hover': column.sortable ? { 
                backgroundColor: 'rgba(255, 255, 255, 0.02)' 
              } : {},
              transition: 'background-color 0.2s',
            }}
            onClick={column.sortable ? () => handleSort(column.key) : undefined}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {column.label}
              {column.sortable && sortField === column.key && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {sortOrder === 'asc' ? (
                    <TrendingUpIcon sx={{ fontSize: 14, color: '#ff0000' }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14, color: '#ff0000' }} />
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
            style={{ marginRight: 12, width: 32, height: 32 }}
          />
          <Box>
            <Typography sx={{ 
              fontSize: '0.875rem', 
              fontWeight: 500,
              color: '#fff'
            }}>
              {entry.username}
            </Typography>
            {entry.elite && (
              <Chip 
                label="ELITE" 
                size="small" 
                sx={{ 
                  height: 14, 
                  fontSize: '0.6rem',
                  backgroundColor: '#ffd700',
                  color: '#000',
                  fontWeight: 600,
                  mt: 0.25,
                  '& .MuiChip-label': {
                    padding: '0 4px',
                  },
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
            textAlign: column.align || 'left',
            fontSize: '0.875rem',
          }}
        >
          {column.isProfit && !isNegative && '+'}
          {currencyValue}
        </Typography>
      );
    }

    return (
      <Typography sx={{ 
        textAlign: column.align || 'left',
        color: '#fff',
        fontSize: '0.875rem',
      }}>
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
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
            },
            transition: 'background-color 0.2s',
          }}
        >
          <TableCell sx={{ color: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                {getMedalIcon(index)}
              </Typography>
              {index < 3 && <TrophyIcon sx={{ fontSize: 14, color: '#ffd700' }} />}
            </Box>
          </TableCell>
          {COLUMNS.map((column) => (
            <TableCell key={column.key} sx={{ color: '#fff' }}>
              {renderCellValue(entry, column)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <Box sx={{ p: 2, width: "100%" }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 2, width: "100%" }}>
          <Skeleton variant="text" width="40px" height={20} />
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width="100px" height={20} />
          <Skeleton variant="text" width="50%" height={20} />
          <Skeleton variant="text" width="80px" height={20} />
          <Skeleton variant="text" width="30%" height={20} />
          <Skeleton variant="text" width="80px" height={20} />
          <Skeleton variant="text" width="20%" height={20} />
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
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '95vw', sm: '90vw', md: '85vw', lg: '80vw' },
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: '8px',
            p: { xs: 2, sm: 3 },
            background: '#262626',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            color: '#fff',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '3px',
            },
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
              pb: 2,
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <TrophyIcon sx={{ fontSize: 24, color: '#ffd700' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#fff', fontSize: '1.25rem' }}>
                LEADERBOARDS
              </Typography>
              <Chip 
                label="ALL-TIME" 
                size="small" 
                sx={{ 
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: 20,
                  '& .MuiChip-label': {
                    padding: '0 6px',
                  },
                }} 
              />
            </Box>
            <IconButton
              onClick={closeModal}
              sx={{
                color: '#fff',
                width: 32,
                height: 32,
                '&:hover': { 
                  backgroundColor: 'rgba(255, 255, 255, 0.1)' 
                },
              }}
            >
              <CloseIcon sx={{ fontSize: '18px' }} />
            </IconButton>
          </Box>

          {/* Stats Summary */}
          {!loading && sortedLeaderboards.length > 0 && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={`${sortedLeaderboards.length} Players`} 
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: 'rgba(255, 0, 0, 0.3)', 
                  color: '#fff',
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
              <Chip 
                label={`Total Wagered: ${convertToCurrency(
                  sortedLeaderboards.reduce((sum, p) => sum + (p.totalWagered || 0), 0), 
                  solPrice
                )}`}
                variant="outlined"
                size="small"
                sx={{ 
                  borderColor: 'rgba(255, 0, 0, 0.3)', 
                  color: '#fff',
                  fontSize: '0.75rem',
                  height: 24,
                }}
              />
            </Box>
          )}

          {/* Table */}
          {!loading ? (
            <Box
              sx={{ 
                overflowX: 'auto',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                background: 'rgba(255, 255, 255, 0.02)',
              }}
            >
              <Table sx={{ minWidth: 800 }}>
                {renderTableHeader()}
                {renderTableBody()}
              </Table>
            </Box>
          ) : (
            renderLoadingSkeleton()
          )}

          {/* Empty state */}
          {!loading && sortedLeaderboards.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <TrophyIcon sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem' }}>
                No leaderboard data available
              </Typography>
            </Box>
          )}
        </Box>
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