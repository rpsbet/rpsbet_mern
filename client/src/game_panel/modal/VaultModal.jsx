import React, { Component } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { Button, TextField } from '@material-ui/core';
import AttachMoneyIcon from '@material-ui/icons/AttachMoney';
import MoneyOffIcon from '@material-ui/icons/MoneyOff';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CountUp from 'react-countup';
import { vaultDeposit, vaultWithdraw, fetchVaultBalance, fetchRecentVaultTransactions } from '../../redux/Auth/user.actions';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from './ConfirmAlerts';
import InlineSVG from 'react-inlinesvg';
import busdSvg from '../JoinGame/busd.svg';

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
    border: 'none'
  },
};

const modalContentStyles = {
  background: 'linear-gradient(to right, #3949ab, #1e88e5)',
  color: '#fff',
  padding: '20px',
  borderRadius: '10px',
  textAlign: 'center',
};

const labelStyle = {
  fontSize: '1rem',
  color: '#ccc',
};

const valueStyle = {
  fontSize: '1.5rem',
  fontWeight: 'bold',
  margin: '10px 0',
};

class VaultModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      vaultBal: this.props.vaultBal,
      amount: '',
      animate: false,
      lastUpdatedBalance: 0,
      isWithdraw: false,
      loaded: false,
      vaultTransactions: [], // State to store the recent transactions
    };
  }

  async componentDidMount() {
    this.setState({ animate: true });
    this.props.fetchRecentVaultTransactions(); // Fetch recent transactions on mount
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.vaultBal !== this.state.vaultBal) {
      this.setState({ animate: true });
    }
    if (prevProps.vaultTransactions !== this.props.vaultTransactions) {
      this.setState({ vaultTransactions: this.props.vaultTransactions });
    }
  }

  handleDeposit = async () => {
    const { amount, vaultBal } = this.state;
    if (amount) {
      const amountParsed = parseFloat(amount);

      if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > this.props.user.balance) {
        alertModal(this.props.isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
        return;
      }

      const result = await this.props.vaultDeposit(amount);
      const newTransaction = result.newTransaction;

      this.setState(prevState => ({
        vaultTransactions: [newTransaction, ...prevState.vaultTransactions],
        vaultBal: result.vaultBalance,
        lastUpdatedBalance: vaultBal,
        amount: '',
        isWithdraw: false,
        loaded: true
      }));


      this.props.setBalance(result.newBalance);
      this.props.addNewTransaction(result.newTransaction);
    }
  };

  handleWithdraw = async () => {
    const { amount, vaultBal } = this.state;
    if (amount) {
      const amountParsed = parseFloat(amount);

      if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > vaultBal) {
        alertModal(this.props.isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
        return;
      }

      const result = await this.props.vaultWithdraw(amount);
      const newTransaction = result.newTransaction;

      this.setState(prevState => ({
        vaultTransactions: [newTransaction, ...prevState.vaultTransactions],
        vaultBal: result.vaultBalance,
        lastUpdatedBalance: vaultBal,
        amount: '',
        isWithdraw: true,
        loaded: true
      }));

      this.props.setBalance(result.newBalance);
      this.props.addNewTransaction(result.newTransaction);
    }
  };


  handleChange = (event) => {
    this.setState({ amount: event.target.value });
  };

  render() {
    const { vaultBal, loaded, animate, amount, lastUpdatedBalance, isWithdraw, vaultTransactions } = this.state;
    let balanceClass = '';
    if (isWithdraw && loaded) {
      balanceClass = 'red';
    } else if (!isWithdraw && loaded) {
      balanceClass = 'green';
    }
    return (
      <Modal
        isOpen={this.props.modalIsOpen}
        onRequestClose={this.props.closeModal}
        style={customStyles}
        contentLabel="Vault Modal"
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <FontAwesomeIcon icon={faLock} className="mr-2" />&nbsp;Vault
            </h2>
            <Button className="btn-close title" onClick={this.props.closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body vault-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel" style={modalContentStyles}>
                <p style={labelStyle}>Your Vault Balance</p>
                <p id="vault-bal" style={valueStyle} className={balanceClass}>
                  <InlineSVG
                    id="busd"
                    src={busdSvg}
                  />
                  <CountUp
                    start={animate ? lastUpdatedBalance : null}
                    end={vaultBal}
                    duration={1.5}
                    separator=","
                    decimals={2}
                    useEasing={true}
                    useGrouping={true}
                  /> (${(vaultBal * 0.119).toFixed(2)})
                </p>
                <TextField
                  label="Enter Amount"
                  variant="outlined"
                  type="number"
                  value={amount}
                  onChange={this.handleChange}
                  fullWidth
                />
              </div>
              <div className="recent-transactions">
                <h4>Recent Transactions</h4>
                <table className="transaction-table" style={{ borderRadius: "0.4em", overflow: "hidden" }}>

                  <tbody>
                    {vaultTransactions.map((transaction) => (
                      <tr key={transaction._id} className={transaction.description.includes('withdrawal') ? 'withdrawal' : 'deposit'}>
                        <td>{transaction.description.includes('withdrawal') ? '-' : '+'}</td>
                        <td>{convertToCurrency(transaction.amount)}</td>
                        <td>{new Date(transaction.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <Button className="btn-back" style={{minWidth:"100px"}} onClick={this.handleDeposit}>
              Deposit &nbsp; <AttachMoneyIcon />
            </Button>
            <Button className="btn-back" style={{minWidth:"100px"}} onClick={this.handleWithdraw}>
              Withdraw &nbsp; <MoneyOffIcon />
            </Button>
          </div>

        </div>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user,
  vaultTransactions: state.auth.vaultTransactions, // Add this line to get recent transactions from state
});

const mapDispatchToProps = {
  vaultDeposit,
  vaultWithdraw,
  fetchVaultBalance,
  setBalance,
  addNewTransaction,
  fetchRecentVaultTransactions, // Add the action here
};

export default connect(mapStateToProps, mapDispatchToProps)(VaultModal);
