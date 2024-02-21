import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump
} from '@fortawesome/free-solid-svg-icons';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  Tooltip,
  Icon,
  Typography
} from '@material-ui/core';
import { Info, Warning, AccountBalanceWallet, Link, FiberManualRecord } from '@material-ui/icons';
import { convertToCurrency } from '../../util/conversion';
import { tokenAddr, adminWallet } from '../../config/index.js';

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

class DepositModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      web3: props.web3,
      balance: props.balance,
      account: props.account,
      isLoading: false
    };
  }

  async componentDidMount() {
    const params = { addressTo: this.state.account };
    this.props.setGasfee(params);
  }

  handleAmountChange = e => {
    e.preventDefault();
    this.setState({
      amount: e.target.value
    });
  };

  
  async sendTransaction(amount) {
    try {
      

        // Convert amount from ether to wei
        const ethAmountInWei = ethers.utils.parseEther(amount.toString());

        const transaction = await signer.sendTransaction({
            to: adminWallet,
            value: ethAmountInWei
        });

        await transaction.wait();
        // console.log('Transaction sent successfully!');
        // You can perform additional actions after sending the transaction
    } catch (error) {
        console.error('Error sending transaction:', error);
    }
}

send = async () => {
  if (this.state.amount <= 0) {
      alertModal(this.props.isDarkMode, `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`);
      return;
  }

  if (this.state.amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return;
  }

  try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const amountInWei = ethers.utils.parseEther(this.state.amount.toString());

      this.setState({ isLoading: true });

      // Send transaction
      const transaction = await signer.sendTransaction({
          to: adminWallet,
          value: amountInWei
      });
await transaction.wait();

const result = await axios.post('/stripe/deposit_successed/', {
  amount: this.state.amount,
  txtHash: transaction.hash
});

      if (result.data.success) {
          alertModal(this.props.isDarkMode, result.data.message, '-cat' );
          this.props.setBalance(result.data.balance);
          this.props.addNewTransaction(result.data.newTransaction);
          this.setState({ isLoading: false });
          this.props.closeModal();
      } else {
          this.setState({ isLoading: false });
          alertModal(
              this.props.isDarkMode,
              `Something went wrong. Please try again later or contact support.`
          );
      }
  } catch (e) {
      console.error(e);
      this.setState({ isLoading: false });
      alertModal(this.props.isDarkMode, `Failed transaction.`);
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
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">    <Icon component={AccountBalanceWallet} className="mr-2" /> {/* Use Material-UI Icon component */}

                DEPOSIT</h2>
              <Button className="btn-close" onClick={this.props.closeModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body deposit-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className="account">
                    <div className="account">
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography>Send To Address</Typography>

                        {isConnected ? (
                          <TextField
                            label="Account"
                            variant="outlined"
                            value={account}
                            InputProps={{
                              readOnly: true
                            }}
                          />
                        ) : (
                          <TextField
                            label="Account"
                            variant="outlined"
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
                  </div>
                  <div>
                    <div className="input-amount">
                      <Typography>Deposit Amount</Typography>
                      <TextField
                        pattern="^\\d*\\.?\\d*$"
                        type="text"
                        variant="outlined"
                        autoComplete="off"
                        value={this.state.amount}
                        onChange={this.handleAmountChange}
                        className="form-control"
                        InputProps={{
                          endAdornment: 'ETH'
                        }}
                      />
                    </div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell>
                            <span>WALLET BALANCE:</span>
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(this.props.balance)}
                            &nbsp;ETH
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>
                          <FontAwesomeIcon icon={faGasPump}/>&nbsp;&nbsp;<span>GAS FEE:</span>
                          </TableCell>
                          <TableCell>
                            {convertToCurrency(this.props.gasfee)}
                          </TableCell>
                          <Tooltip
                            title="Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
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
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={this.send}>
                Deposit
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
  gasfee: state.auth.gasfee
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(DepositModal);
