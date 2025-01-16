import React, { useState } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { convertToCurrency } from '../../util/conversion';
import {
  faSort,
  faSearch,
  faFilter,
  faArrowAltCircleDown,
  faArrowAltCircleUp,
  faExchangeAlt,
  faGift,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  LinearProgress,
  TextField,
  TableBody,
  IconButton,
  Tooltip,
  Table,
  TableCell,
  TableRow,
  Menu,
  MenuItem,
} from '@material-ui/core';
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
          <Button className="btn-close title" onClick={close}>
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
                          Filter&nbsp;
                          <FontAwesomeIcon icon={faFilter} />
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
                            &nbsp;Show All
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleFilterClose('showDeposits')}
                            selected={filterType === 'showDeposits'}
                          >
                            <FontAwesomeIcon icon={faArrowAltCircleUp} />
                            &nbsp;Show Deposits
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleFilterClose('showWithdrawals')}
                            selected={filterType === 'showWithdrawals'}
                          >
                            <FontAwesomeIcon icon={faArrowAltCircleDown} />
                            &nbsp;Show Withdrawals
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleFilterClose('showTrades')}
                            selected={filterType === 'showTrades'}
                          >
                            <FontAwesomeIcon icon={faExchangeAlt} />
                            &nbsp;Show Trades
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleFilterClose('showLoans')}
                            selected={filterType === 'showLoans'}
                          >
                            <FontAwesomeIcon icon={faExchangeAlt} />
                            &nbsp;Show Loans
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleFilterClose('showTips')}
                            selected={filterType === 'showTips'}
                          >
                            <FontAwesomeIcon icon={faGift} />
                            &nbsp;Show Tips
                          </MenuItem>
                        </Menu>
                      </div>
                      <div className="filters">
                        <Button onClick={handleSortClick}>
                          Sort By&nbsp;
                          <FontAwesomeIcon icon={faSort} />
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
                      </div>
                      <div className="filters">
                        <Button onClick={handleSearchClick}>
                          SEARCH&nbsp;
                          <FontAwesomeIcon icon={faSearch} />
                        </Button>
                        <Menu
                          anchorEl={searchAnchorEl}
                          open={Boolean(searchAnchorEl)}
                          onClose={() => handleSearchClose(null)}
                        >
                          <MenuItem>
                            <div className="search">
                              <div className="search-content">
                                <TextField
                                  name="search"
                                  margin="normal"
                                  value={searchQuery}
                                  onChange={(e) => onSearchQueryChange(e.target.value)}
                                />
                              </div>
                            </div>
                          </MenuItem>
                        </Menu>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="game-logs-container"
                  onScroll={handleScroll}
                  style={{ maxHeight: '380px', overflowY: 'scroll' }}
                >
                  <Table className="game-logs-table">
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5}>NO TRANSACTIONS FOUND</TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction._id}>
                            <TableCell
                              className={`amount ${
                                transaction.status === 'waiting' ||
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
                            <TableCell className="fromNow">{transaction.from_now}</TableCell>
                            <TableCell className="description">{transaction.description}</TableCell>
                            <TableCell className="description">
                              {transaction.status && <>{transaction.status}</>}
                            </TableCell>
                            <TableCell className="hash">
                              {transaction.hash ? (
                                transaction.hash.startsWith('0x') ? (
                                  <a
                                    href={`https://solscan.io/tx/${transaction.hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Link />
                                  </a>
                                ) : (
                                  ''
                                )
                              ) : transaction.room ? (
                                <a
                                  href={`/join/${transaction.room}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <Link />
                                </a>
                              ) : (
                                ''
                              )}
                            </TableCell>
                            <TableCell>
                              <Tooltip
                                title={
                                  copiedRowId ===
                                  (transaction.hash && transaction.hash.length === 10
                                    ? transaction.hash
                                    : transaction._id)
                                    ? 'Copied!'
                                    : 'Copy ID'
                                }
                                placement="top"
                              >
                                <IconButton
                                  color="inherit"
                                  onClick={() =>
                                    copyToClipboard(
                                      transaction.hash && transaction.hash.length === 10
                                        ? transaction.hash
                                        : transaction._id
                                    )
                                  }
                                >
                                  <FileCopyIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      {tnxComplete && (
                        <TableRow>
                          <TableCell colSpan={5}>
                            <div className="loading-spinner"></div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
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