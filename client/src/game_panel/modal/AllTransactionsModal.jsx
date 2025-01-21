import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { convertToCurrency } from '../../util/conversion';
import {
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import FilterListIcon from '@mui/icons-material/FilterList';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import SortIcon from '@mui/icons-material/Sort';
import SearchIcon from '@mui/icons-material/Search';
import {
  Button,
  LinearProgress,
  TableContainer,
  Paper,
  TableHead,
  TextField,
  TableBody,
  IconButton,
  Tooltip,
  Table,
  TableCell,
  TableRow,
  Menu,
  CircularProgress,
  MenuItem,
} from '@mui/material';
import { Link } from '@mui/icons-material';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0,
    border: 'none',
  },
};

const AllTransactionsModal = ({
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
  solPrice,
}) => {
  const [copiedRowId, setCopiedRowId] = useState(null);

  const handleScroll = (event) => {
    const { target } = event;
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    if (isAtBottom) {
      handleLoadMore();
    }
  };

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

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={close}
      style={customStyles}
      contentLabel="All Transactions Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faCreditCard} className="mr-2" />
            ALL TRANSACTIONS
          </h2>
          <Button
            className="btn-close" variant='text' color='error'
            onClick={close}
          >
            ×
          </Button>
        </div>
        <div className="modal-body" style={{ padding: 0 }}>
          <div className="game-logs-modal-container">
            {transactions !== null ? (
              <>
                <div className="overflowX">
                  <div className="summary">
                    <div className="summary-flex">
                      <div className="filters">
                        <Button onClick={handleFilterClick}>
                          Filter <FilterListIcon />
                        </Button>
                        <Menu
                          anchorEl={filterAnchorEl}
                          open={Boolean(filterAnchorEl)}
                          onClose={() => handleFilterClose(null)}
                        >
                          <MenuItem onClick={() => handleFilterClose(null)} selected={filterType === null}>
                            Show All
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterClose('showDeposits')} selected={filterType === 'showDeposits'}>
                            <ArrowUpwardIcon />&nbsp;Show Deposits
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterClose('showWithdrawals')} selected={filterType === 'showWithdrawals'}>
                            <ArrowDownwardIcon />&nbsp;Show Withdrawals
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterClose('showTrades')} selected={filterType === 'showTrades'}>
                            <SwapHorizIcon />&nbsp;Show Trades
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterClose('showLoans')} selected={filterType === 'showLoans'}>
                            <SwapHorizIcon />&nbsp;Show Loans
                          </MenuItem>
                          <MenuItem onClick={() => handleFilterClose('showTips')} selected={filterType === 'showTips'}>
                            <CardGiftcardIcon />&nbsp;Show Tips
                          </MenuItem>
                        </Menu>
                      </div>

                      <div className="filters">
                        <Button onClick={handleSortClick}>
                          Sort By <SortIcon />
                        </Button>
                        <Menu
                          anchorEl={sortAnchorEl}
                          open={Boolean(sortAnchorEl)}
                          onClose={() => handleSortClose(null)}
                        >
                          <MenuItem onClick={() => handleSortClose('date')} selected={sortType === 'date'}>
                            Sort by Date
                          </MenuItem>
                          <MenuItem onClick={() => handleSortClose('amount')} selected={sortType === 'amount'}>
                            Sort by Amount
                          </MenuItem>
                        </Menu>
                      </div>

                      <div className="filters">
                        <Button onClick={handleSearchClick}>
                          SEARCH <SearchIcon />
                        </Button>
                        <Menu
                          anchorEl={searchAnchorEl}
                          open={Boolean(searchAnchorEl)}
                          onClose={() => handleSearchClose(null)}
                        >
                          <MenuItem>
                            <TextField
                              color="secondary"
                              name="search"
                              margin="normal"
                              value={searchQuery}
                              onChange={(e) => onSearchQueryChange(e.target.value)}
                              fullWidth
                            />
                          </MenuItem>
                        </Menu>
                      </div>
                    </div>
                  </div>
                </div>

                <TableContainer onScroll={handleScroll}  style={{ maxHeight: 380, overflowY: 'auto' }}>
                  <Table stickyHeader aria-label="transactions table">
                   
                    <TableBody onScroll={handleScroll}>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} align="center">No transactions found</TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction._id}>
                            <TableCell
                              className={`amount ${transaction.status === 'waiting' ||
                                transaction.status === 'pending' ||
                                transaction.status === 'processing' ||
                                transaction.status === 'in_process'
                                ? 'grey'
                                : transaction.amount > 0
                                  ? 'green'
                                  : 'red'
                                }`}
                            >
                              {transaction.amount > 0 ? (
                                <> + ({convertToCurrency(transaction.amount, solPrice)})</>
                              ) : (
                                <> - ({convertToCurrency(Math.abs(transaction.amount), solPrice)})</>
                              )}
                            </TableCell>
                            <TableCell>{transaction.from_now}</TableCell>
                            <TableCell>{transaction.description}</TableCell>
                            <TableCell>{transaction.status}</TableCell>
                            <TableCell>
                              {transaction.hash ? (
                                <Link href={`https://solscan.io/tx/${transaction.hash}`} target="_blank">
                                  View
                                </Link>
                              ) : ''}
                            </TableCell>
                            <TableCell>
                              <Tooltip title={copiedRowId === transaction._id ? 'Copied!' : 'Copy ID'} placement="top">
                                <IconButton onClick={() => copyToClipboard(transaction._id)}>
                                  <FileCopyIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {tnxComplete && (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            <CircularProgress color="secondary" />
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </>
            ) : (
              <div>
                <LinearProgress color="secondary" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AllTransactionsModal;