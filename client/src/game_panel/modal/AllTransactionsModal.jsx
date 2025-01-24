import React, { useState } from 'react';
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
  LinearProgress,
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

function AllTransactionsModal({
  modalIsOpen,
  close,
  transactions,
  searchQuery,
  sortType,
  filterType,
  handleSearchClose,
  onSearchQueryChange,
  isDarkMode,
  tnxComplete,
  handleLoadMore,
  sortAnchorEl,
  filterAnchorEl,
  searchAnchorEl,
  handleSortClick,
  handleSortClose,
  handleSearchClick,
  handleFilterClick,
  handleFilterClose,
  solPrice
}) {
  const [copiedRowId, setCopiedRowId] = useState(null);

  /**
   * Handle scrolling to trigger "load more" when scrolled to the bottom.
   */
  const handleScroll = (event) => {
    const { scrollHeight, scrollTop, clientHeight } = event.target;
    const isAtBottom = scrollHeight - scrollTop === clientHeight;
    if (isAtBottom) {
      handleLoadMore();
    }
  };

  /**
   * Copy transaction ID to clipboard
   */
  const copyToClipboard = (rowId) => {
    navigator.clipboard
      .writeText(rowId)
      .then(() => {
        setCopiedRowId(rowId);
        setTimeout(() => {
          setCopiedRowId(null);
        }, 1500);
      })
      .catch((err) => {
        console.error('Failed to copy: ', err);
      });
  };

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
    overflowY: 'auto'
  };

  const headerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    mb: 2
  };

  const filtersContainerStyle = {
    display: 'flex',
    gap: 2,
    mb: 2
  };

  const tableContainerStyle = {
    maxHeight: 380,
    overflowY: 'auto'
  };

  return (
    <Modal
      open={modalIsOpen}
      onClose={close}
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
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
            X
          </Button>
        </Box>

        {/* BODY */}
        <Box>
          {transactions !== null ? (
            <>
              {/* FILTER / SORT / SEARCH */}
              <Box sx={filtersContainerStyle}>
                {/* Filter Button */}
                <Button
                  variant="contained"
                  onClick={handleFilterClick}
                  sx={{ bgcolor: '#5c6bc0' }}
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
                <Button
                  variant="contained"
                  onClick={handleSortClick}
                  sx={{ bgcolor: '#5c6bc0' }}
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
                  variant="contained"
                  onClick={handleSearchClick}
                  sx={{ bgcolor: '#5c6bc0' }}
                >
                  SEARCH <SearchIcon sx={{ ml: 1 }} />
                </Button>
                <Menu
                  anchorEl={searchAnchorEl}
                  open={Boolean(searchAnchorEl)}
                  onClose={() => handleSearchClose(null)}
                >
                  <MenuItem>
                    <TextField
                      color='error'
                      name="search"
                      margin="normal"
                      value={searchQuery}
                      onChange={(e) => onSearchQueryChange(e.target.value)}
                      fullWidth
                      placeholder="Search Transactions..."
                    />
                  </MenuItem>
                </Menu>
              </Box>

              {/* TRANSACTIONS TABLE */}
              <TableContainer
                component={Paper}
                sx={tableContainerStyle}
                onScroll={handleScroll}
              >
                <Table stickyHeader aria-label="transactions table">
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No transactions found
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((transaction) => (
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
                                  ? '#1de9b6' // greenish
                                  : '#ff1744' // reddish
                            }}
                          >
                            {transaction.amount > 0 ? (
                              <>+ {convertToCurrency(transaction.amount, solPrice)}</>
                            ) : (
                              <>- {convertToCurrency(Math.abs(transaction.amount), solPrice)}</>
                            )}
                          </TableCell>
                          <TableCell>{transaction.from_now}</TableCell>
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
                                  '&:hover': { color: '#fff' }
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
                              <IconButton onClick={() => copyToClipboard(transaction._id)}>
                                <FileCopyIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                    {/* Display a loading spinner if tnxComplete is true */}
                    {tnxComplete && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress color='error' />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Box sx={{ mt: 2 }}>
              <LinearProgress color='error' />
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
}

export default AllTransactionsModal;