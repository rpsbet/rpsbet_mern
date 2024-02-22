import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump
} from '@fortawesome/free-solid-svg-icons';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import Modal from 'react-modal';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Icon,
  Tooltip,
  Typography
} from '@material-ui/core';
import { Warning, Info, Link, FiberManualRecord, AccountBalanceWallet } from '@material-ui/icons';

import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
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
    padding: 0,
    background: 'transparent'
  }
};

class WithdrawModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      _id: this.props.userInfo._id,
      amount: 0,
      web3: props.web3,
      balance: props.balance,
      account: props.account,
      isLoading: false,
      totalWagered: 0,
      deposit: 0,
      amount: 0,
      balance: 0
    };
  }

  async componentDidMount() {
    const result = await this.props.getCustomerStatisticsData(this.state._id);
    this.setState({
      ...result
    });

    const params = { addressTo: this.state.account };
    this.props.setGasfee(params);
  }

  handleAmountChange = e => {
    e.preventDefault();
    const amount = e.target.value;
    this.setState({
      amount: amount
    });
  };

  send = async () => {
    try {
      if (this.props.userInfo.dailyWithdrawals > 0.02) {
        alertModal(
          this.props.isDarkMode,
          `EXCEEDED DAILY WITHDRAWAL LIMIT, TRY AGAIN TOMORROW! (WITHDRAWAL LIMITS DURING LAUNCH PHASE ONLY)`
        );
        return;
      }
      if (this.state.amount <= 0) {
        alertModal(
          this.props.isDarkMode,
          `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`
        );
        return;
      }
      if (this.state.amount >= 0.02) {
        alertModal(
          this.props.isDarkMode,
          `MAXIMUM PER TRANSACTION IS 0.02 ETH DURING LAUNCH PHASE`
        );
        return;
      }

      if (this.state.amount > this.props.balance) {
        alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
        return;
      }

      this.setState({ isLoading: true });
      const result = await axios.post('/stripe/withdraw_request/', {
        amount: this.state.amount,
        addressTo: this.state.account
      });

      if (result.data.success) {
        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        this.setState({ isLoading: false });
        this.props.closeModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `Failed transaction.`);
        return;
      }
    }
  };

  render() {
    const { account } = this.state;
    const isConnected = !!account;
    return (
      <>
        <LoadingOverlay
          active={true}
          spinner
          text="Creating Block..."
          styles={{
            wrapper: {
              position: 'fixed',
              width: '100%',
              height: '100vh',
              zIndex: this.state.isLoading ? 999 : 0
            }
          }}
        />
        <Modal
          isOpen={this.props.modalIsOpen}
          onRequestClose={this.props.closeModal}
          style={customStyles}
          contentLabel="Deposit Modal"
          account={this.state.web3account}
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">  <Icon component={AccountBalanceWallet} className="mr-2" /> {/* Withdraw icon */}
                WITHDRAW</h2>
              <Button className="btn-close" onClick={this.props.closeModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body deposit-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div id='withdrawal-status' style={{ marginBottom: "30px" }}>
                    <h6>ELIGIBILILITY STATUS</h6>
                    <div><span className="withdrawal-usage">Daily Withdrawal Usage</span>
                      <Tooltip title={"During Launch Phase only, for security purposes. Please note you will NOT be able to participate in any games or other transactional-related features upon exceeding limit."}>
                        <IconButton>
                          <Info />
                        </IconButton>
                      </Tooltip>  <span style={{ color: this.props.userInfo.dailyWithdrawals > 0.02 ? "red" : "rgb(87, 202, 34)" }}>{convertToCurrency(this.props.userInfo.dailyWithdrawals / 0.02 * 100)}%</span></div>
                    {/* <div><span className="eligible-label">WAGERED (MIN {convertToCurrency(25)})</span><span style={{color: this.state.totalWagered < 25 ? "red" : "rgb(87, 202, 34)"}}>{convertToCurrency(this.state.totalWagered)}</span></div>
                                    <div><span className="eligible-label">DEPOSITS (MIN {convertToCurrency(5)})</span><span style={{color: this.state.deposit < 5 ? "red" : "rgb(87, 202, 34)"}}>{convertToCurrency(this.state.deposit)}</span></div>
                                        <div><span className="eligible-label">AMOUNT (MIN {convertToCurrency(5)})</span><span style={{color: this.state.amount < 5 ? "red" : "rgb(87, 202, 34)"}}>{convertToCurrency(this.state.amount)}</span></div> */}
                  </div>

                  <div className="account">
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Send To Address</Typography>

                      {isConnected ? (
                        <TextField
                          label="Account"
                          variant="filled"
                          value={account}
                          InputProps={{
                            readOnly: true
                          }}
                        />
                      ) : (
                        <TextField
                          label="Account"
                          variant="filled"
                          value="Connect Wallet"
                          InputProps={{
                            readOnly: true
                          }}
                        />
                      )}
                      {isConnected ? (
                        <FiberManualRecord
                          className="light"
                          style={{ background: '#28a745', color: 'green' }}
                        />
                      ) : (
                        <FiberManualRecord
                          className="light"
                          style={{ background: '#ff0000', color: 'red' }}
                        />
                      )}
                      {isConnected ? (
                        <Tooltip title="Connected account" arrow>
                          <Info />
                        </Tooltip>
                      ) : (
                        <Tooltip title="How do I connect?" arrow>
                          <a
                            href="your_connect_wallet_link_here"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              textDecoration: 'none'
                            }}
                          >
                            <Info />
                            <Link
                              fontSize="small"
                              style={{ marginLeft: '4px' }}
                            />
                          </a>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  <div className="input-amount">
                    <Typography>Withdrawal Amount</Typography>
                    <TextField
                      pattern="^\\d*\\.?\\d*$"
                      variant="filled"
                      autoComplete="off"
                      value={this.state.amount}
                      onChange={this.handleAmountChange}
                      InputProps={{
                        endAdornment: 'ETH'
                      }}
                      className="form-control"
                    />
                  </div>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <span>IN-GAME BALANCE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(this.props.balance)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>WITHDRAWAL AMOUNT:</span>
                        </TableCell>
                        <TableCell style={{ color: 'red' }}>
                          {convertToCurrency(this.state.amount * -1)}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <span>NEW BALANCE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(
                            this.props.balance - this.state.amount
                          )}
                          &nbsp;
                          {this.props.balance - this.state.amount < 0 && (
                            <Warning width="15pt" />
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <hr />
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faGasPump}/>&nbsp;&nbsp;<span>GAS FEE:</span>
                        </TableCell>
                        <TableCell>
                          {convertToCurrency(this.props.gasfee)}
                        </TableCell>
                        <Tooltip
                          title="Real-time Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
                          arrow
                        >
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </TableRow>
                    </TableBody>
                  </Table>
                  <div className="disclaimer">
                    <Typography>Receive within 1 - 3 minutes</Typography>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.send}>
                Withdraw
              </Button>
              <Button className="btn-back" onClick={this.props.closeModal}>
                CANCEL
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  gasfee: state.auth.gasfee
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction,
  getCustomerStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(WithdrawModal);
