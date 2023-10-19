import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
// import { BigNumber } from 'ethers';
import { Button, TextField } from '@material-ui/core';

import { tokenAddr, adminWallet } from '../../config/index.js';
// import abi from '../../config/abi_token.json';
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
    const params = {addressTo: this.state.account}
    this.props.setGasfee(params);
  }

  handleAmountChange = e => {
    e.preventDefault();
    this.setState({
      amount: e.target.value
    });
  };

  send = async () => {
    if (this.state.amount <= 0) {
      alertModal(this.props.isDarkMode, `ENTER AN AMOUNT DUMBASS!`);
      return;
    }

    if (this.state.amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `TRY LATER, BROKIE!`);
      return;
    }
    try {
      const web3 = this.state.web3;
      const amountInWei = web3.utils.toWei(this.state.amount, 'ether');

      this.setState({ isLoading: true })


      // transaction initiate
      web3.eth.sendTransaction({
        from: this.state.account,
        to: adminWallet, // Replace with the recipient address
        value: amountInWei
      })
      .then(async (tx) => {
        // Proceed with the rest of logic.
        const result = await axios.post('/stripe/deposit_successed/', {
          amount: this.state.amount,
          txtHash: tx.transactionHash,
        });

        if (result.data.success) {
          alertModal(this.props.isDarkMode, result.data.message);
          this.props.setBalance(result.data.balance);
          this.props.addNewTransaction(result.data.newTransaction);
          this.setState({ isLoading: false })
          this.props.closeModal();

        } else {
          alertModal(
            this.props.isDarkMode,
            this.setState({ isLoading: false }),

            `Something went wrong. Please try again later or contact support.`
          );
        }
      })
    } catch (e) {
      console.log(e);
      this.setState({ isLoading: false })
      alertModal(this.props.isDarkMode, `Failed transaction.`);
      return;
    }
  };

  render() {
    
    return (
      <><LoadingOverlay
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
        }} /><Modal
          isOpen={this.props.modalIsOpen}
          onRequestClose={this.props.closeModal}
          style={customStyles}
          contentLabel="Deposit Modal"
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">DEPOSIT</h2>
              <Button className="btn-close" onClick={this.props.closeModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body deposit-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className="balance">
                    <h6>ENTER AMOUNT & DEPOSIT</h6>
                  </div>
                  <div>
                    <div className="input-amount">
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
                        }} />
                      <br />
                    </div>
                    <label className="availabletag">
                      <span>WALLET BALANCE</span>:&nbsp;&nbsp;{' '}
                      {convertToCurrency(this.props.balance)}&nbsp;ETH&nbsp;<br/>
                      <span>GAS FEE</span>:&nbsp;&nbsp;{' '}
                      {convertToCurrency(this.props.gasfee)}
                    </label>

                    {/* <button className={styles.join('')} onClick={() => {
      this.toggleBtnHandler();
      this.copy();
  }}><FaClipboard />&nbsp;{text}</button> */}
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
        </Modal></>
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
