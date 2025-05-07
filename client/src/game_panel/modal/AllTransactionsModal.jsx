import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  Modal,
  Box,
  Button,
  Typography,
  TableContainer,
  Paper,
  Table,
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
} from '@mui/icons-material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard } from '@fortawesome/free-solid-svg-icons';

import { convertToCurrency } from '../../util/conversion';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

// Example Redux action to fetch transactions (adjust to your actual code)
import { getTransactions } from '../../redux/Auth/user.actions';
import moment from 'moment';

function AllTransactionsModal({
  modalIsOpen,
  close,
  transactions,
  isDarkMode,
  solPrice,
}) {
  const dispatch = useDispatch();

  // State from Redux
  const { all_transactions, page, hasMore, transactions_loading, totalCount } =
    useSelector((state) => state.auth);

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);
  const [copiedTxHash, setCopiedTxHash] = useState(false);

  // The actual filter, sort, and search values we're using
  const [filterType, setFilterType] = useState(null); // e.g. 'showTrades', 'showTips', etc.
  const [sortType, setSortType] = useState('date'); // e.g. 'date', 'amount'
  const [searchQuery, setSearchQuery] = useState(''); // e.g. a string to search in description

  useEffect(() => {
    // On mount, load initial page if needed
    // Only call this if all_transactions is null or length = 0
    if (!all_transactions) {
      dispatch(getTransactions(1, filterType, sortType, searchQuery));
    }
  }, [dispatch, all_transactions]);

  // Handlers for Filter Menu
  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = (selectedFilter) => {
    setFilterAnchorEl(null);

    if (selectedFilter !== null) {
      // This is the filter type, e.g. 'showTrades' or 'showDeposits'
      setFilterType(selectedFilter);
      // Re-fetch page 1 with new filter
      dispatch(getTransactions(1, selectedFilter, sortType, searchQuery));
    } else {
      // null means "Show All"
      setFilterType(null);
      dispatch(getTransactions(1, '', sortType, searchQuery));
    }
  };

  // Handlers for Sort Menu
  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = (selectedSort) => {
    setSortAnchorEl(null);

    if (selectedSort !== null) {
      setSortType(selectedSort);
      // Re-fetch page 1 with new sort
      dispatch(getTransactions(1, filterType || '', selectedSort, searchQuery));
    }
  };

  // Handlers for Search Menu
  const handleSearchClick = (event) => {
    setSearchAnchorEl(event.currentTarget);
  };

  const handleSearchClose = () => {
    setSearchAnchorEl(null);
  };

  const onSearchQueryChange = (value) => {
    setSearchQuery(value);
    // Optionally trigger immediate fetch as user types, or wait until they close the menu.
    // Here, let's do immediate fetch:
    dispatch(getTransactions(1, filterType || '', sortType || 'date', value));
  };
  
  // Copy transaction hash to clipboard
  const copyTxHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedTxHash(true);
    setTimeout(() => setCopiedTxHash(false), 2000);
  };

  /**
   * Load more if scrolled to the bottom, if more pages are available
   */
  const handleLoadMore = () => {
    if (!transactions_loading && hasMore) {
      dispatch(getTransactions(page + 1, filterType, sortType, searchQuery));
    }
  };

  /**
   * Called on scroll, checks if at bottom, triggers loadMore
   */
  const handleScroll = (e) => {
    const { scrollHeight, scrollTop, clientHeight } = e.target;
    if (scrollHeight - scrollTop === clientHeight) {
      handleLoadMore();
    }
  };

  // Decide which array to render:
  let dataToRender = [];
  if (all_transactions && all_transactions.length > 0) {
    dataToRender = all_transactions;
  } else if (transactions && transactions.length > 0) {
    dataToRender = transactions;
  }

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    mb: 2,
  };

  const filtersContainerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    gap: 2,
    mb: 2,
    flexDirection: { xs: 'column', sm: 'row' },
  };

  const tableContainerStyle = {
    height: 480,
    overflowY: 'auto',
    background: '#080808',
  };

  // New styles for action buttons
  const actionButtonStyle = {
    minWidth: 'fit-content',
    borderRadius: '8px',
    fontWeight: 'medium',
    transition: 'all 0.2s',
    py: 0.5,
    px: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    fontSize: '0.75rem',
  };

  const viewButtonStyle = {
    ...actionButtonStyle,
    bgcolor: 'rgba(255, 236, 179, 0.15)',
    color: '#ffecb3',
    '&:hover': {
      bgcolor: 'rgba(255, 236, 179, 0.25)',
      transform: 'translateY(-2px)',
    },
  };

  const joinButtonStyle = {
    ...actionButtonStyle,
    bgcolor: 'rgba(52, 152, 219, 0.15)',
    color: '#5daefd',
    '&:hover': {
      bgcolor: 'rgba(52, 152, 219, 0.25)',
      transform: 'translateY(-2px)',
    },
  };

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // Function to truncate transaction hash for display
  const truncateHash = (hash) => {
    if (!hash) return '';
    return `${hash.substring(0, 6)}...${hash.substring(hash.length - 4)}`;
  };

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={close}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90vw', sm: '80vw', md: '70vw', lg: '65vw' },
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 3,
            p: { xs: 2, sm: 3, md: 4 },
            // Glassmorphism
            background: 'rgba(30, 30, 30, 0.3)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            // Fallback
            '@supports not (backdrop-filter: blur(15px))': {
              background: 'rgba(30, 30, 30, 0.6)',
            },
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
          {/* HEADER */}
          <Box sx={headerStyle}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 8 }} />
              ALL TRANSACTIONS
            </Typography>
            <Button
              onClick={close}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
          </Box>

          {/* BODY */}
          <Box>
            {/**
             * 1) If we're still loading the very first batch => show Skeleton
             *    - i.e. all_transactions is null (hasn't been set yet) and transactions_loading is true
             */}
            {all_transactions === null && transactions_loading ? (
              <Box sx={{ mt: 2 }}>
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  sx={{ mb: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  sx={{ mb: 1 }}
                />
              </Box>
            ) : (
              /**
               * 2) If all_transactions is not null (or we have fallback transactions)
               *    then show the table and possible spinner if loading more
               */
              <Box>
                <Box>
                  {/* FILTER / SORT / SEARCH */}
                  <Box sx={filtersContainerStyle} className="filters">
                    {/* Filter Button */}
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleFilterClick}
                    >
                      Filter <FilterListIcon sx={{ ml: 1 }} />
                    </Button>
                    <Menu
                      anchorEl={filterAnchorEl}
                      open={Boolean(filterAnchorEl)}
                      onClose={() => handleFilterClose(null)}
                    >
                      <MenuItem
                        onClick={() => handleFilterClose(null)}
                        selected={filterType === null}
                      >
                        Show All
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showDeposits')}
                        selected={filterType === 'showDeposits'}
                      >
                        <ArrowUpwardIcon sx={{ mr: 1 }} />
                        Show Deposits
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showWithdrawals')}
                        selected={filterType === 'showWithdrawals'}
                      >
                        <ArrowDownwardIcon sx={{ mr: 1 }} />
                        Show Withdrawals
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showTrades')}
                        selected={filterType === 'showTrades'}
                      >
                        <SwapHorizIcon sx={{ mr: 1 }} />
                        Show Trades
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showTips')}
                        selected={filterType === 'showTips'}
                      >
                        <CardGiftcardIcon sx={{ mr: 1 }} />
                        Show Tips
                      </MenuItem>
                    </Menu>

                    {/* Sort Button */}
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleSortClick}
                    >
                      Sort By <SortIcon sx={{ ml: 1 }} />
                    </Button>
                    <Menu
                      anchorEl={sortAnchorEl}
                      open={Boolean(sortAnchorEl)}
                      onClose={() => handleSortClose(null)}
                    >
                      <MenuItem
                        onClick={() => handleSortClose('date')}
                        selected={sortType === 'date'}
                      >
                        Sort by Date
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleSortClose('amount')}
                        selected={sortType === 'amount'}
                      >
                        Sort by Amount
                      </MenuItem>
                    </Menu>

                    {/* Search Button */}
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleSearchClick}
                    >
                      Search <SearchIcon sx={{ ml: 1 }} />
                    </Button>
                    <Menu
                      anchorEl={searchAnchorEl}
                      open={Boolean(searchAnchorEl)}
                      onClose={() => handleSearchClose(null)}
                    >
                      <MenuItem>
                        <TextField
                          color="error"
                          name="search"
                          margin="normal"
                          value={searchQuery}
                          onChange={(e) => onSearchQueryChange(e.target.value)}
                          fullWidth
                          placeholder="Search all..."
                        />
                      </MenuItem>
                    </Menu>
                  </Box>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
                    Total: {totalCount}
                  </Typography>
                  {/* TABLE AREA */}
                  <TableContainer
                    component={Paper}
                    sx={tableContainerStyle}
                    onScroll={handleScroll}
                  >
                    <Table stickyHeader aria-label="all transactions table">
                      <TableBody>
                        {dataToRender.length === 0 ? (
                          // If array is empty but not loading => "No transactions"
                          <TableRow>
                            <TableCell colSpan={5} align="center">
                              No transactions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          // Otherwise, map through the transactions
                          dataToRender.map((transaction) => (
                            <TableRow key={transaction._id}>
                              <TableCell
                                sx={{
                                  color:
                                    transaction.status === 'waiting' ||
                                    transaction.status === 'pending' ||
                                    transaction.status === 'processing' ||
                                    transaction.status === 'in_process'
                                      ? '#888'
                                      : transaction.amount > 0
                                      ? '#00ff3a' // greenish
                                      : '#FF0000', // reddish
                                }}
                              >
                                {transaction.amount > 0 ? (
                                  <>
                                    + {parseFloat(transaction.amount).toFixed(3)} SOL (
                                    {convertToCurrency(transaction.amount, solPrice)})
                                  </>
                                ) : (
                                  <>
                                    - {parseFloat(Math.abs(transaction.amount)).toFixed(3)} SOL (
                                    {convertToCurrency(Math.abs(transaction.amount), solPrice)})
                                  </>
                                )}
                              </TableCell>
                              <TableCell>
                                {moment(transaction.created_at).fromNow()}
                              </TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>
                                <Chip 
                                  label={transaction.status}
                                  size="small"
                                  sx={{
                                    bgcolor: 
                                      transaction.status === 'completed' ? 'rgba(0, 255, 58, 0.15)' :
                                      transaction.status === 'failed' ? 'rgba(255, 0, 0, 0.15)' :
                                      'rgba(255, 255, 255, 0.15)',
                                    color:
                                      transaction.status === 'completed' ? '#00ff3a' :
                                      transaction.status === 'failed' ? '#ff0000' :
                                      '#ffffff',
                                    borderRadius: '4px',
                                    fontWeight: 500,
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                {transaction.hash ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Tooltip title={transaction.hash} placement="top">
                                      <Typography variant="body2" sx={{ color: '#888', fontSize: '0.75rem' }}>
                                        {truncateHash(transaction.hash)}
                                      </Typography>
                                    </Tooltip>
                                    
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                      <Tooltip title="Copy Transaction Hash">
                                        <IconButton 
                                          size="small" 
                                          onClick={() => copyTxHash(transaction.hash)}
                                          sx={{ color: '#888', p: 0.5 }}
                                        >
                                          <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                      
                                      <Tooltip title="View on Solscan">
                                        <Button
                                          component={Link}
                                          href={`https://solscan.io/tx/${transaction.hash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          sx={viewButtonStyle}
                                        >
                                          <LaunchIcon fontSize="small" />
                                          View
                                        </Button>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" sx={{ color: '#555', fontStyle: 'italic' }}>
                                    No hash
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {transaction.room ? (
                                  <Button
                                    component={Link}
                                    href={`/join/${transaction.room}`}
                                    sx={joinButtonStyle}
                                    startIcon={<MeetingRoomIcon />}
                                  >
                                    Join
                                  </Button>
                                ) : (
                                  <Typography variant="body2" sx={{ color: '#555', fontStyle: 'italic' }}>
                                    No room
                                  </Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}

                        {/**
                         * 3) If we are loading more (subsequent fetch), show spinner row
                         *    - i.e., we already have some data, but transactions_loading is true
                         */}
                        {dataToRender.length > 0 && transactions_loading && (
                          <TableRow>
                            <TableCell colSpan={6} align="center">
                              <CircularProgress color="error" />
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              </Box>
            )}
            
            {/* Copied notification */}
            <Snackbar
              open={copiedTxHash}
              autoHideDuration={2000}
              onClose={() => setCopiedTxHash(false)}
              message="Transaction hash copied to clipboard"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            />
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

// Add Snackbar for copy notification
const Snackbar = ({ open, autoHideDuration, onClose, message, anchorOrigin }) => {
  return open ? (
    <Box
      sx={{
        position: 'fixed',
        bottom: anchorOrigin.vertical === 'bottom' ? 20 : 'auto',
        top: anchorOrigin.vertical === 'top' ? 20 : 'auto',
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
      {message}
    </Box>
  ) : null;
};

export default AllTransactionsModal;