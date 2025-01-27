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
  Tooltip,
  Link
} from '@mui/material';

import {
  FileCopy as FileCopyIcon,
  FilterList as FilterListIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  SwapHoriz as SwapHorizIcon,
  CardGiftcard as CardGiftcardIcon,
  Sort as SortIcon,
  Search as SearchIcon
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
  const {
    all_transactions,
    page,
    hasMore,
    transactions_loading,
    totalCount
  } = useSelector(state => state.auth);

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [searchAnchorEl, setSearchAnchorEl] = useState(null);

  // The actual filter, sort, and search values we’re using
  const [filterType, setFilterType] = useState(null);   // e.g. 'showTrades', 'showTips', etc.
  const [sortType, setSortType] = useState('date');     // e.g. 'date', 'amount'
  const [searchQuery, setSearchQuery] = useState('');   // e.g. a string to search in description

  const [copiedRowId, setCopiedRowId] = useState(null);

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


  /**
   * Copy transaction ID to clipboard
   */
  const copyToClipboard = (id) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopiedRowId(id);
      setTimeout(() => setCopiedRowId(null), 1500);
    });
  };

  // Decide which array to render:
  let dataToRender = [];
  if (all_transactions && all_transactions.length > 0) {
    dataToRender = all_transactions;
  } else if (transactions && transactions.length > 0) {
    dataToRender = transactions;
  }

  // MUI sx styles
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25', // Purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 700,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

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
  };

  const tableContainerStyle = {
    height: 280,
    overflowY: 'auto',
  };

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen}
        onClose={close}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={headerStyle}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <FontAwesomeIcon icon={faCreditCard} style={{ marginRight: 8 }} />
              ALL TRANSACTIONS
            </Typography>
            <Button variant="text" color="error" onClick={close}>
              ×
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
                <Box
                  sx={{
                    background: 'rgba(170, 170, 170, 0.06)',
                    borderRadius: '0.3em',
                    p: '20px',
                  }}
                >
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
                        <ArrowUpwardIcon />
                        &nbsp;Show Deposits
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showWithdrawals')}
                        selected={filterType === 'showWithdrawals'}
                      >
                        <ArrowDownwardIcon />
                        &nbsp;Show Withdrawals
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showTrades')}
                        selected={filterType === 'showTrades'}
                      >
                        <SwapHorizIcon />
                        &nbsp;Show Trades
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showLoans')}
                        selected={filterType === 'showLoans'}
                      >
                        <SwapHorizIcon />
                        &nbsp;Show Loans
                      </MenuItem>
                      <MenuItem
                        onClick={() => handleFilterClose('showTips')}
                        selected={filterType === 'showTips'}
                      >
                        <CardGiftcardIcon />
                        &nbsp;Show Tips
                      </MenuItem>
                    </Menu>

                    {/* Sort Button */}
                    <Button variant="outlined" color="error" onClick={handleSortClick}>
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
                    <Button variant="outlined" color="error" onClick={handleSearchClick}>
                      SEARCH <SearchIcon sx={{ ml: 1 }} />
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
                          placeholder="Search all transactions..."
                        />
                      </MenuItem>
                    </Menu>
                  </Box>
                  <Typography variant="subtitle1" sx={{ mt: 2 }}>
                    Total Transactions: {totalCount}
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
                            <TableCell colSpan={6} align="center">
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
                                        : '#ff0000', // reddish
                                }}
                              >
                                {transaction.amount > 0 ? (
                                  <>
                                    +{' '}
                                    {convertToCurrency(transaction.amount, solPrice)}
                                  </>
                                ) : (
                                  <>
                                    -{' '}
                                    {convertToCurrency(
                                      Math.abs(transaction.amount),
                                      solPrice
                                    )}
                                  </>
                                )}
                              </TableCell>
                              <TableCell> {moment(transaction.created_at).fromNow()}</TableCell>
                              <TableCell>{transaction.description}</TableCell>
                              <TableCell>{transaction.status}</TableCell>
                              <TableCell>
                                {transaction.hash ? (
                                  <Link
                                    href={`https://solscan.io/tx/${transaction.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    sx={{
                                      textDecoration: 'none',
                                      color: '#ffecb3',
                                      '&:hover': { color: '#fff' },
                                    }}
                                  >
                                    View
                                  </Link>
                                ) : (
                                  ''
                                )}
                              </TableCell>
                              <TableCell>
                                <Tooltip
                                  title={
                                    copiedRowId === transaction._id
                                      ? 'Copied!'
                                      : 'Copy ID'
                                  }
                                  placement="top"
                                >
                                  <IconButton
                                    onClick={() => copyToClipboard(transaction._id)}
                                  >
                                    <FileCopyIcon />
                                  </IconButton>
                                </Tooltip>
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
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default AllTransactionsModal;