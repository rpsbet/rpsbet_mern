import React, { Component } from 'react';
import Modal from 'react-modal';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  faSort,
  faSearch,
  faFilter,
  faArrowAltCircleDown,
  faArrowAltCircleUp
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  TextField,
  TableBody,
  TableHead,
  Table,
  TableCell,
  TableRow,
  Radio,
  Checkbox,
  RadioGroup,
  FormControlLabel
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
      showAllGameLogs: false
    };
  }

  render() {
    const {
      showAllGameLogs,
      showSearch,
      transactions,
      searchQuery,
      sortBy,
      showWithdrawals,
      oneDayProfit,
      toggleShowWithdrawals,
      toggleShowDeposits,
      handleSortBy,
      toggleFilter,
      toggleSort,
      toggleSearch,
      sevenDayProfit,
      allTimeProfit,
      handleLoadMore,
      isDarkMode,
      showFilter,
      showSort,
      showDeposits,
      modalIsOpen,
      close
    } = this.props;

    return (
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={close}
        style={customStyles}
        contentLabel="All Transactions Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">ALL HISTORY</h2>
              <Button className="btn-close" onClick={close}>×</Button>

            </div>
          <div className="game-logs-modal-container">
            <div className="summary">
              <div className="summary-flex">
                <div>
                  <Button onClick={toggleSort}>
                    <FontAwesomeIcon icon={faSort} />
                    &nbsp;&nbsp;Sort by
                  </Button>
                  {showSort && (
                    <div className="popup">
                      <div className="popup-content">
                        <RadioGroup
                          aria-label="sort-options"
                          name="sort-options"
                          value={sortBy}
                          onChange={event =>
                            handleSortBy(event.target.value)
                          }
                        >
                          <FormControlLabel
                            value="date"
                            control={<Radio color="primary" />}
                            label="Newest"
                          />
                          <FormControlLabel
                            value="amount"
                            control={<Radio color="primary" />}
                            label="Biggest"
                          />
                        </RadioGroup>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <Button onClick={toggleFilter}>
                    <FontAwesomeIcon icon={faFilter} />
                    &nbsp;&nbsp;Filter
                  </Button>
                  {showFilter && (
                    <div className="filter">
                      <div className="filter-content">
                        <label>
                          <FontAwesomeIcon icon={faArrowAltCircleUp} />{' '}
                          Withdrawals:
                          <Checkbox
                            checked={showWithdrawals}
                            onChange={toggleShowWithdrawals}
                          />
                        </label>
                        <label>
                          <FontAwesomeIcon icon={faArrowAltCircleDown} />{' '}
                          Deposits:
                          <Checkbox
                            checked={showDeposits}
                            onChange={toggleShowDeposits}
                          />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <Button onClick={toggleSearch}>
                    <FontAwesomeIcon icon={faSearch} />
                    &nbsp;&nbsp;Search
                  </Button>

                  {showSearch && (
                    <div className="search">
                      <div className="search-content">
                        <TextField
                          name="search"
                          margin="normal"
                          value={searchQuery}
                          onChange={this.handleSearch}
                        ></TextField>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="summary-flex">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>1-Day</span>
                  <span
                    style={{
                      color: oneDayProfit > 0 ? '#57ca22' : 'red'
                    }}
                  >
                    {oneDayProfit > 0 ? <ArrowUpward /> : <ArrowDownward />}
                    {convertToCurrency(oneDayProfit)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>7-Day</span>
                  <span
                    style={{
                      color: sevenDayProfit > 0 ? '#57ca22' : 'red'
                    }}
                  >
                    {sevenDayProfit > 0 ? <ArrowUpward /> : <ArrowDownward />}
                    {convertToCurrency(sevenDayProfit)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span>All-time</span>
                  <span
                    style={{
                      color: allTimeProfit > 0 ? '#57ca22' : 'red'
                    }}
                  >
                    {allTimeProfit > 0 ? <ArrowUpward /> : <ArrowDownward />}
                    {convertToCurrency(allTimeProfit)}
                  </span>
                </div>
              </div>
            </div>
            <div className="game-logs-container">
              <Table className="game-logs-table">
                <TableHead>
                  <TableRow>
                    <TableCell>Amount</TableCell>
                    <TableCell>From Now</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Link</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan="4">...</TableCell>
                    </TableRow>
                  ) : (
                    transactions.map((row, key) => (
                      <TableRow key={key}>
                        <TableCell
                          className={
                            'amount ' + (row.amount > 0 ? 'green' : 'red')
                          }
                        >
                          {row.amount > 0 ? (
                            <>
                              {'+ '}
                              {convertToCurrency(row.amount, true)}
                            </>
                          ) : (
                            <>
                              {'- '}
                              {convertToCurrency(Math.abs(row.amount), true)}
                            </>
                          )}
                        </TableCell>
                        <TableCell className="fromNow">
                          {row.from_now}
                        </TableCell>
                        <TableCell className="description">
                          {row.description}
                        </TableCell>
                        <TableCell className="hash">
                          {row.hash ? (
                            <a
                              href={`https://etherscan.io/tx/${row.hash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Link />
                            </a>
                          ) : row.room ? (
                            <a
                              href={`/join/${row.room}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Link />
                            </a>
                          ) : (
                            // If there's no room value, don't display a link
                            ''
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="load-more-button">
              <Button onClick={handleLoadMore}>LOAD MORE</Button>
            </div>
          </div>
        </div>
      </Modal>
    );
  }
}

export default AllTransactionsModal;
