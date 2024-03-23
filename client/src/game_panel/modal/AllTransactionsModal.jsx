import React, { Component } from 'react';
import Modal from 'react-modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { FaClipboard } from 'react-icons/fa';
import { convertToCurrency } from '../../util/conversion';
import {
  faSort,
  faSearch,
  faFilter,
  faArrowAltCircleDown,
  faArrowAltCircleUp,
  faExchangeAlt,
  faGift,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  LinearProgress,
  TextField,
  TableBody,
  TableHead,
  Table,
  TableCell,
  TableRow,
  Menu,
  MenuItem
} from '@material-ui/core';
import { Link, ArrowUpward, ArrowDownward } from '@material-ui/icons';

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    background: 'transparent',
    padding: 0
  }
};

class AllTransactionsModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      showAllGameLogs: false,
      copiedRowId: null
    };
  }
  handleScroll = event => {
    const { target } = event;

    // Check if the scroll is at the bottom of the modal
    const isAtBottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    if (isAtBottom) {
      this.props.handleLoadMore();
    }
  };

  copyToClipboard = (rowId) => {
    navigator.clipboard.writeText(rowId)
      .then(() => {
        this.setState({ copiedRowId: rowId });
        setTimeout(() => {
          this.setState({ copiedRowId: null });
        }, 1500); // Reset the copied row after 1.5 seconds
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };



  render() {
    const {
      showAllGameLogs,
      transactions,
      searchQuery,
      sortType,
      filterType,
      oneDayProfit,
      handleSearchClose,
      onSearchQueryChange,
      sevenDayProfit,
      allTimeProfit,
      isDarkMode,
      tnxComplete,
      modalIsOpen,
      sortAnchorEl,
      filterAnchorEl,
      searchAnchorEl,
      close,
      handleSortClick,
      handleSortClose,
      handleSearchClick,
      handleFilterClick,
      handleFilterClose
    } = this.props;
    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={close}
        style={customStyles}
        contentLabel="All Transactions Modal"
      >
        <div
          className={isDarkMode ? 'dark_mode' : ''}


        >
          <div className="modal-header">
            <h2 className="modal-title">
              <FontAwesomeIcon icon={faCreditCard} className="mr-2" />

              ALL TRANSACTIONS</h2>
            <Button className="btn-close" onClick={close}>
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
                              onClick={() =>
                                handleFilterClose('showWithdrawals')
                              }
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
                                    onChange={e =>
                                      onSearchQueryChange(e.target.value)
                                    }
                                  ></TextField>
                                </div>
                              </div>
                            </MenuItem>
                          </Menu>
                        </div>
                      </div>

                      <div style={{ marginLeft: '45px' }} className="summary-flex">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>1-DAY</span>
                          <span
                            style={{
                              color: oneDayProfit > 0 ? '#57ca22' : 'red'
                            }}
                          >
                            {oneDayProfit > 0 ? (
                              <ArrowUpward />
                            ) : (
                              <ArrowDownward />
                            )}
                            {convertToCurrency(oneDayProfit)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span>7-DAY</span>
                          <span
                            style={{
                              color: sevenDayProfit > 0 ? '#57ca22' : 'red'
                            }}
                          >
                            {sevenDayProfit > 0 ? (
                              <ArrowUpward />
                            ) : (
                              <ArrowDownward />
                            )}
                            {convertToCurrency(sevenDayProfit)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginRight: '20px' }}>
                          <span>ALL-TIME</span>
                          <span
                            style={{
                              color: allTimeProfit > 0 ? '#57ca22' : 'red'
                            }}
                          >
                            {allTimeProfit > 0 ? (
                              <ArrowUpward />
                            ) : (
                              <ArrowDownward />
                            )}
                            {convertToCurrency(allTimeProfit)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Table style={{ width: '100%' }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>AMOUNT</TableCell>
                          <TableCell>FROM NOW</TableCell>
                          <TableCell>DESCRIPTION</TableCell>
                          <TableCell>LINK</TableCell>
                          <TableCell>ID</TableCell>
                        </TableRow>
                      </TableHead>
                    </Table>
                  </div>
                  <div className="game-logs-container" onScroll={this.handleScroll}
                    style={{ maxHeight: '280px', overflowY: 'scroll' }}>
                    <Table className="game-logs-table">
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5}>No transactions found.</TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((transaction, index) => (
                            <TableRow key={transaction._id}>
                              <TableCell className={'amount ' + (transaction.amount > 0 ? 'green' : 'red')}>
                                {transaction.amount > 0 ? <> + {convertToCurrency(transaction.amount)}</> : <> + {convertToCurrency(Math.abs(transaction.amount))}</>}
                              </TableCell>
                              <TableCell className="fromNow">
                                {transaction.from_now}
                              </TableCell>
                              <TableCell className="description">
                                {transaction.description}
                              </TableCell>
                              <TableCell className="hash">
                                {transaction.hash ? (
                                  transaction.hash.startsWith('0x') ? (
                                    <a href={`https://etherscan.io/tx/${transaction.hash}`} target="_blank" rel="noopener noreferrer">
                                      <Link />
                                    </a>
                                  ) : (
                                    // If the hash doesn't start with '0x', don't display any link
                                    ''
                                  )
                                ) : transaction.room ? (
                                  <a href={`/join/${transaction.room}`} target="_blank" rel="noopener noreferrer">
                                    <Link />
                                  </a>
                                ) : (
                                  // If there's no room value, don't display a link
                                  ''
                                )}
                              </TableCell>

                              <TableCell>
                                <a style={{ padding: '2.5px', cursor: 'pointer' }}>
                                  <FaClipboard
                                    className="clipboard-icon"
                                    onClick={() => this.copyToClipboard(transaction.hash && transaction.hash.length === 10 ? transaction.hash : transaction._id)}
                                  />
                                  {this.state.copiedRowId === (transaction.hash && transaction.hash.length === 10 ? transaction.hash : transaction._id) && <span style={{ marginLeft: '5px' }}>Copied!</span>}
                                </a>
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
  }
}

export default AllTransactionsModal;
