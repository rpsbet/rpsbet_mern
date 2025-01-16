import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { Button, TextField } from '@material-ui/core';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CountUp from 'react-countup';
import {
  vaultDeposit,
  vaultWithdraw,
  fetchVaultBalance,
  fetchRecentVaultTransactions,
  setBalance,
} from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';
import { alertModal } from './ConfirmAlerts';

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

function VaultModal(props) {
  const {
    vaultBal: initialVaultBal,
    modalIsOpen,
    closeModal,
    fetchRecentVaultTransactions,
    vaultTransactions: propVaultTransactions,
    vaultDeposit,
    vaultWithdraw,
    user,
    solPrice,
    isDarkMode,
    setBalance,
    addNewTransaction,
  } = props;

  // Local state
  const [vaultBal, setVaultBal] = useState(initialVaultBal);
  const [amount, setAmount] = useState('');
  const [animate, setAnimate] = useState(false);
  const [lastUpdatedBalance, setLastUpdatedBalance] = useState(0);
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [vaultTransactions, setVaultTransactions] = useState([]); // local copy

  useEffect(() => {
    setAnimate(true);
    fetchRecentVaultTransactions(); // Fetch recent transactions on mount
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setAnimate(true);
  }, [vaultBal]);

  useEffect(() => {
    setVaultTransactions(propVaultTransactions);
  }, [propVaultTransactions]);

  const handleChange = (event) => {
    setAmount(event.target.value);
  };

  const handleDeposit = async () => {
    if (amount) {
      const amountParsed = parseFloat(amount);

      if (
        isNaN(amountParsed) ||
        amountParsed <= 0 ||
        amountParsed > user.balance
      ) {
        alertModal(isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
        return;
      }

      const result = await vaultDeposit(amount);
      const newTransaction = result.newTransaction;

      setVaultTransactions([newTransaction, ...vaultTransactions]);
      setVaultBal(result.vaultBalance);
      setLastUpdatedBalance(vaultBal);
      setAmount('');
      setIsWithdraw(false);
      setLoaded(true);

      setBalance(result.newBalance);
      addNewTransaction(result.newTransaction);
    }
  };

  const handleWithdraw = async () => {
    if (amount) {
      const amountParsed = parseFloat(amount);

      if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > vaultBal) {
        alertModal(isDarkMode, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
        return;
      }

      const result = await vaultWithdraw(amount);
      const newTransaction = result.newTransaction;

      setVaultTransactions([newTransaction, ...vaultTransactions]);
      setVaultBal(result.vaultBalance);
      setLastUpdatedBalance(vaultBal);
      setAmount('');
      setIsWithdraw(true);
      setLoaded(true);

      setBalance(result.newBalance);
      addNewTransaction(result.newTransaction);
    }
  };

  let balanceClass = '';
  if (isWithdraw && loaded) {
    balanceClass = 'red';
  } else if (!isWithdraw && loaded) {
    balanceClass = 'green';
  }

  return (
    <Modal
      isOpen={modalIsOpen}
      onRequestClose={closeModal}
      style={customStyles}
      contentLabel="Vault Modal"
    >
      <div className={isDarkMode ? 'dark_mode' : ''}>
        <div className="modal-header">
          <h2 className="modal-title title">
            <FontAwesomeIcon icon={faLock} className="mr-2" />
            &nbsp;Vault
          </h2>
          <Button className="btn-close title" onClick={closeModal}>
            ×
          </Button>
        </div>
        <div className="modal-body edit-modal-body vault-modal-body">
          <div className="modal-content-wrapper">
            <div className="modal-content-panel" style={modalContentStyles}>
              <p style={labelStyle}>Your Vault Balance</p>
              <p id="vault-bal" style={valueStyle} className={balanceClass}>
                <CountUp
                  start={animate ? lastUpdatedBalance : null}
                  end={vaultBal}
                  duration={1.5}
                  separator=","
                  decimals={2}
                  useEasing={true}
                  useGrouping={true}
                />{' '}
                SOL (${(vaultBal * solPrice).toFixed(2)})
              </p>
              <TextField
                label="Enter Amount"
                variant="outlined"
                type="number"
                value={amount}
                onChange={handleChange}
                fullWidth
              />
            </div>
            <div className="recent-transactions">
              <h4>Recent Transactions</h4>
              <table
                className="transaction-table"
                style={{ borderRadius: '0.4em', overflow: 'hidden' }}
              >
                <tbody>
                  {vaultTransactions.map((transaction) => (
                    <tr
                      key={transaction?._id}
                      className={
                        transaction?.description.includes('withdrawal')
                          ? 'withdrawal'
                          : 'deposit'
                      }
                    >
                      <td>
                        {transaction?.description.includes('withdrawal')
                          ? '-'
                          : '+'}
                      </td>
                      <td>{convertToCurrency(transaction?.amount, solPrice)}</td>
                      <td>
                        {new Date(transaction?.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <Button
            className="btn-back"
            style={{ minWidth: '100px' }}
            onClick={handleDeposit}
          >
            Deposit &nbsp; <AttachMoneyIcon />
          </Button>
          <Button
            className="btn-back"
            style={{ minWidth: '100px' }}
            onClick={handleWithdraw}
          >
            Withdraw &nbsp; <MoneyOffIcon />
          </Button>
        </div>
      </div>
    </Modal>
  );
}

const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  user: state.auth.user,
  vaultTransactions: state.auth.vaultTransactions,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  vaultDeposit,
  vaultWithdraw,
  fetchVaultBalance,
  setBalance,
  addNewTransaction,
  fetchRecentVaultTransactions,
};

export default connect(mapStateToProps, mapDispatchToProps)(VaultModal);