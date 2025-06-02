import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Modal,
  Box,
  Button,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TextField,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  Skeleton,
  Link,
  Tooltip,
  Chip,
  InputAdornment,
  Divider,
  Badge,
} from '@mui/material';
import {
  Close as CloseIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon,
  CardGiftcard as CardGiftcardIcon,
  Sort as SortIcon,
  Search as SearchIcon,
  Launch as LaunchIcon,
  MeetingRoom as MeetingRoomIcon,
  ContentCopy as ContentCopyIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../util/conversion';
import { getTransactions } from '../../redux/Auth/user.actions';
import { formatDistanceToNow } from 'date-fns';

// Transaction type configurations
const TRANSACTION_TYPES = {
  deposits: {
    key: 'showDeposits',
    label: 'Deposits',
    icon: ArrowUpwardIcon,
    color: '#00ff3a',
  },
  withdrawals: {
    key: 'showWithdrawals',
    label: 'Withdrawals',
    icon: ArrowDownwardIcon,
    color: '#ff4444',
  },
  trades: {
    key: 'showTrades',
    label: 'Trades',
    icon: SwapHorizIcon,
    color: '#5daefd',
  },
  tips: {
    key: 'showTips',
    label: 'Tips',
    icon: CardGiftcardIcon,
    color: '#ffd700',
  },
};

const SORT_OPTIONS = [
  { key: 'date', label: 'Date', icon: AccessTimeIcon },
  { key: 'amount', label: 'Amount', icon: TrendingUpIcon },
];

// Status color mapping
const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return { bg: 'rgba(0, 255, 58, 0.15)', color: '#00ff3a' };
    case 'failed':
    case 'cancelled':
      return { bg: 'rgba(255, 0, 0, 0.15)', color: '#ff0000' };
    case 'pending':
    case 'processing':
    case 'waiting':
      return { bg: 'rgba(255, 193, 7, 0.15)', color: '#ffc107' };
    default:
      return { bg: 'rgba(255, 255, 255, 0.15)', color: '#ffffff' };
  }
};

// Transaction amount formatter
const formatAmount = (amount, solPrice, isDarkMode) => {
  const isPositive = amount > 0;
  const absAmount = Math.abs(amount);
  const color = isPositive ? '#00ff3a' : '#ff4444';
  
  return {
    display: `${isPositive ? '+' : '-'} ${absAmount.toFixed(3)} SOL`,
    usd: convertToCurrency(absAmount, solPrice),
    color,
  };
};

// Transaction hash utilities
const truncateHash = (hash) => {
  if (!hash) return '';
  return `${hash.substring(0, 8)}...${hash.substring(hash.length - 6)}`;
};

function AllTransactionsModal({ modalIsOpen, close, transactions, isDarkMode, solPrice }) {
  const dispatch = useDispatch();

  // Redux state
  const { all_transactions, page, hasMore, transactions_loading, totalCount } = useSelector(
    (state) => state.auth
  );

  // Local state
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [sortType, setSortType] = useState('date');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // Fetch initial data
  useEffect(() => {
    if (modalIsOpen && !all_transactions) {
      dispatch(getTransactions(1, filterType, sortType, searchQuery));
    }
  }, [modalIsOpen, dispatch, all_transactions]);

  // Determine data to render
  const dataToRender = useMemo(() => {
    return all_transactions?.length > 0 ? all_transactions : transactions || [];
  }, [all_transactions, transactions]);

  // Filtered transaction count by type
  const getFilteredCount = useCallback((type) => {
    if (!dataToRender.length) return 0;
    // This would need to be implemented based on your data structure
    return dataToRender.filter(tx => {
      switch (type) {
        case 'showDeposits': return tx.amount > 0;
        case 'showWithdrawals': return tx.amount < 0;
        // Add other filters based on your transaction structure
        default: return true;
      }
    }).length;
  }, [dataToRender]);

  // Handlers
  const handleFilterSelect = useCallback((selectedFilter) => {
    setFilterAnchorEl(null);
    setFilterType(selectedFilter);
    dispatch(getTransactions(1, selectedFilter || '', sortType, searchQuery));
  }, [dispatch, sortType, searchQuery]);

  const handleSortSelect = useCallback((selectedSort) => {
    setSortAnchorEl(null);
    setSortType(selectedSort);
    dispatch(getTransactions(1, filterType || '', selectedSort, searchQuery));
  }, [dispatch, filterType, searchQuery]);

  const handleSearchChange = useCallback((value) => {
    setSearchQuery(value);
    // Debounced search would be better here
    dispatch(getTransactions(1, filterType || '', sortType, value));
  }, [dispatch, filterType, sortType]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    dispatch(getTransactions(1, filterType || '', sortType, ''));
  }, [dispatch, filterType, sortType]);

  const copyTxHash = useCallback((hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(true);
    setTimeout(() => setCopiedTxHash(false), 2000);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!transactions_loading && hasMore) {
      dispatch(getTransactions(page + 1, filterType, sortType, searchQuery));
    }
  }, [dispatch, transactions_loading, hasMore, page, filterType, sortType, searchQuery]);

  const handleScroll = useCallback((e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight) {
      handleLoadMore();
    }
  }, [handleLoadMore]);

  // Render loading skeleton
  const renderLoadingSkeleton = () => (
    <Box sx={{ mt: 2 }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
          <Skeleton variant="text" width="120px" height={24} />
          <Skeleton variant="text" width="100px" height={24} />
          <Skeleton variant="text" width="200px" height={24} />
          <Skeleton variant="text" width="80px" height={24} />
          <Skeleton variant="text" width="120px" height={24} />
          <Skeleton variant="text" width="80px" height={24} />
        </Box>
      ))}
    </Box>
  );

  // Render table header
  const renderTableHeader = () => (
    <TableHead>
      <TableRow sx={{ 
        backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'
      }}>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          AMOUNT
        </TableCell>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          TIME
        </TableCell>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          DESCRIPTION
        </TableCell>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          STATUS
        </TableCell>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          TRANSACTION
        </TableCell>
        <TableCell sx={{ 
          color: isDarkMode ? '#ccc' : '#666', 
          fontWeight: 600,
          backgroundColor: 'transparent'
        }}>
          ACTION
        </TableCell>
      </TableRow>
    </TableHead>
  );

  // Render transaction row
  const renderTransactionRow = (transaction) => {
    const amountData = formatAmount(transaction.amount, solPrice, isDarkMode);
    const statusColors = getStatusColor(transaction.status);

    return (
      <TableRow 
        key={transaction._id}
        sx={{
          backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)',
          '&:hover': { 
            backgroundColor: isDarkMode ? 'rgba(50, 50, 50, 0.8)' : 'rgba(240, 240, 240, 0.8)' 
          },
          opacity: ['waiting', 'pending', 'processing'].includes(transaction.status) ? 0.7 : 1,
          transition: 'background-color 0.2s ease',
        }}
      >
        {/* Amount */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          <Box>
            <Typography sx={{ color: amountData.color, fontWeight: 600, fontSize: '0.9rem' }}>
              {amountData.display}
            </Typography>
            <Typography sx={{ color: isDarkMode ? '#ccc' : '#666', fontSize: '0.75rem' }}>
              {amountData.usd}
            </Typography>
          </Box>
        </TableCell>

        {/* Time */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          <Typography sx={{ color: isDarkMode ? '#fff' : '#333', fontSize: '0.8rem' }}>
            {formatDistanceToNow(new Date(transaction.created_at), { addSuffix: true })}
          </Typography>
        </TableCell>

        {/* Description */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          <Typography sx={{ 
            color: isDarkMode ? '#fff' : '#333', 
            fontSize: '0.8rem',
            maxWidth: '200px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {transaction.description}
          </Typography>
        </TableCell>

        {/* Status */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          <Chip 
            label={transaction.status?.toUpperCase() || 'UNKNOWN'}
            size="small"
            sx={{
              bgcolor: statusColors.bg,
              color: statusColors.color,
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '24px',
            }}
          />
        </TableCell>

        {/* Transaction Hash */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          {transaction.hash ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={transaction.hash} placement="top">
                <Typography sx={{ 
                  color: isDarkMode ? '#ccc' : '#666', 
                  fontSize: '0.75rem',
                  fontFamily: 'monospace'
                }}>
                  {truncateHash(transaction.hash)}
                </Typography>
              </Tooltip>
              
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Tooltip title="Copy Hash">
                  <IconButton 
                    size="small" 
                    onClick={() => copyTxHash(transaction.hash)}
                    sx={{ 
                      color: '#ff0000', 
                      p: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                    }}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="View on Solscan">
                  <IconButton
                    component={Link}
                    href={`https://solscan.io/tx/${transaction.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ 
                      color: '#ff0000', 
                      p: 0.5,
                      '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
                    }}
                  >
                    <LaunchIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ) : (
            <Typography sx={{ color: isDarkMode ? '#666' : '#999', fontSize: '0.75rem', fontStyle: 'italic' }}>
              No hash
            </Typography>
          )}
        </TableCell>

        {/* Action */}
        <TableCell sx={{ backgroundColor: 'transparent' }}>
          {transaction.room ? (
            <Button
              component={Link}
              href={`/join/${transaction.room}`}
              size="small"
              variant="outlined"
              color="error"
              startIcon={<MeetingRoomIcon />}
              sx={{
                fontSize: '0.7rem',
                py: 0.5,
                px: 1,
                minWidth: 'auto',
                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
              }}
            >
              Join
            </Button>
          ) : (
            <Typography sx={{ color: isDarkMode ? '#666' : '#999', fontSize: '0.75rem', fontStyle: 'italic' }}>
              —
            </Typography>
          )}
        </TableCell>
      </TableRow>
    );
  };

  return (
    <>
      <Modal
        open={modalIsOpen || false}
        onClose={close}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
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
            maxWidth: '1400px',
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
            color: isDarkMode ? '#fff' : '#333',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FontAwesomeIcon icon={faCreditCard} style={{ color: '#ff0000' }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ALL TRANSACTIONS
              </Typography>
              {totalCount > 0 && (
                <Chip 
                  label={`${totalCount} Total`} 
                  size="small" 
                  sx={{ 
                    backgroundColor: '#ff0000',
                    color: '#fff',
                    fontWeight: 600
                  }} 
                />
              )}
            </Box>
            <IconButton
              onClick={close}
              sx={{
                color: isDarkMode ? '#fff' : '#333',
                '&:hover': { backgroundColor: 'rgba(255, 0, 0, 0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Filters and Search */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              {/* Filter Button */}
              <Button
                variant="outlined"
                color="error"
                onClick={(e) => setFilterAnchorEl(e.currentTarget)}
                endIcon={<FilterListIcon />}
                sx={{ minWidth: 'auto' }}
              >
                {filterType ? TRANSACTION_TYPES[Object.keys(TRANSACTION_TYPES).find(k => TRANSACTION_TYPES[k].key === filterType)]?.label || 'Filter' : 'Filter'}
              </Button>

              {/* Sort Button */}
              <Button
                variant="outlined"
                color="error"
                onClick={(e) => setSortAnchorEl(e.currentTarget)}
                endIcon={<SortIcon />}
                sx={{ minWidth: 'auto' }}
              >
                Sort: {SORT_OPTIONS.find(opt => opt.key === sortType)?.label || 'Date'}
              </Button>

              {/* Search Field */}
              <TextField
                size="small"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                sx={{ 
                  minWidth: '250px',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                    color: isDarkMode ? '#fff' : '#333',
                    '& fieldset': { borderColor: '#ff0000' },
                    '&:hover fieldset': { borderColor: '#ff0000' },
                    '&.Mui-focused fieldset': { borderColor: '#ff0000' },
                  },
                  '& .MuiInputBase-input': {
                    color: isDarkMode ? '#fff' : '#333',
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: isDarkMode ? '#ccc' : '#666',
                    opacity: 1,
                  }
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ color: '#ff0000' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={clearSearch} sx={{ color: isDarkMode ? '#fff' : '#333' }}>
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          {/* Content */}
          {all_transactions === null && transactions_loading ? (
            renderLoadingSkeleton()
          ) : (
            <TableContainer
              component={Paper}
              sx={{
                height: 500,
                overflowY: 'auto',
                border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                borderRadius: 2,
                backgroundColor: isDarkMode ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.9)',
              }}
              onScroll={handleScroll}
            >
              <Table stickyHeader>
                {renderTableHeader()}
                <TableBody>
                  {dataToRender.length === 0 ? (
                    <TableRow sx={{ backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, backgroundColor: 'transparent' }}>
                        <Typography sx={{ color: isDarkMode ? '#ccc' : '#666' }}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dataToRender.map(renderTransactionRow)
                  )}

                  {/* Loading more indicator */}
                  {dataToRender.length > 0 && transactions_loading && (
                    <TableRow sx={{ backgroundColor: isDarkMode ? 'rgba(30, 30, 30, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
                      <TableCell colSpan={6} align="center" sx={{ py: 2, backgroundColor: 'transparent' }}>
                        <CircularProgress color="error" size={24} />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* Filter Menu */}
          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
          >
            <MenuItem onClick={() => handleFilterSelect(null)} selected={!filterType}>
              Show All
            </MenuItem>
            <Divider />
            {Object.entries(TRANSACTION_TYPES).map(([key, config]) => {
              const IconComponent = config.icon;
              const count = getFilteredCount(config.key);
              return (
                <MenuItem 
                  key={key}
                  onClick={() => handleFilterSelect(config.key)}
                  selected={filterType === config.key}
                >
                  <IconComponent sx={{ mr: 1, color: config.color }} />
                  {config.label}
                  <Badge badgeContent={count} color="primary" sx={{ ml: 'auto' }} />
                </MenuItem>
              );
            })}
          </Menu>

          {/* Sort Menu */}
          <Menu
            anchorEl={sortAnchorEl}
            open={Boolean(sortAnchorEl)}
            onClose={() => setSortAnchorEl(null)}
          >
            {SORT_OPTIONS.map((option) => {
              const IconComponent = option.icon;
              return (
                <MenuItem 
                  key={option.key}
                  onClick={() => handleSortSelect(option.key)}
                  selected={sortType === option.key}
                >
                  <IconComponent sx={{ mr: 1 }} />
                  {option.label}
                </MenuItem>
              );
            })}
          </Menu>
        </Paper>
      </Modal>

      {/* Copy notification */}
      {copiedTxHash && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            px: 3,
            py: 1.5,
            borderRadius: 1,
            zIndex: 9999,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}
        >
          ✅ Transaction hash copied to clipboard
        </Box>
      )}
    </>
  );
}

export default AllTransactionsModal;