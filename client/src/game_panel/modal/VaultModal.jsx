import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import Modal from 'react-modal';
import { Box, Typography, Table, TableBody, TableRow, TableCell, Paper, Button, TextField } from '@mui/material';
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
  padding: 2,
  textAlign: 'center',
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
          <Button className="btn-close" variant='text' color='error' onClick={closeModal}>
            ×
          </Button>
        </div>
        <Box className="modal-body edit-modal-body">
          <Box className="modal-content-wrapper">
            <Box className="modal-content-panel" component={Paper} sx={modalContentStyles}>
              <Typography className='title' variant="h5">Your Vault Balance</Typography>
              <Typography variant="h4" id="vault-bal">
                <CountUp
                  start={0}
                  end={vaultBal}
                  duration={1.5}
                  separator=","
                  decimals={2}
                  useEasing={true}
                  useGrouping={true}
                />{' '}
                SOL (${(vaultBal * solPrice).toFixed(2)})
              </Typography>
              <TextField
                color="secondary"
                label="Enter Amount"
                variant="outlined"
                type="number"
                value={amount}
                onChange={handleChange}
                fullWidth
                sx={{ marginTop: 2, input: { color: '#3949ab' } }}  // Assuming original TextField color style
              />
            </Box>
            <Box 
            component={Paper}
            >
              <Typography className='title' variant="h5" sx={{ marginTop: 2 }}>Recent Transactions</Typography>
              <Table
               size="small" aria-label="a dense table"
                sx={{
                  borderRadius: '0.4em',
                  overflow: 'hidden',
                  marginTop: 1,
                }}
              >
                <TableBody>
                  {vaultTransactions.map((transaction, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: transaction.description.includes('withdrawal') ? '#ffebee' : '#e8f5e9',  // Specific background color styling
                      }}
                    >
                      <TableCell>{transaction.description.includes('withdrawal') ? '-' : '+'}</TableCell>
                      <TableCell>{convertToCurrency(transaction.amount, solPrice)}</TableCell>
                      <TableCell>{new Date(transaction.created_at).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Box>
        <div className="modal-footer">
          <Button
            variant='contained' color='success'
            style={{ minWidth: '100px' }}
            onClick={handleDeposit}
          >
            Deposit &nbsp; <AttachMoneyIcon />
          </Button>
          <Button
            variant='contained' color='error'
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