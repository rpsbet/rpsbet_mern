import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Modal,
  Box,
  Typography,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Button,
  TextField
} from '@mui/material';
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
import history from '../../redux/history';

// Remove react-modal usage and .setAppElement()
// MUI handles that internally.
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
    setBalance,
    addNewTransaction
  } = props;

  // ------------------ LOCAL STATE ------------------
  const [vaultBal, setVaultBal] = useState(initialVaultBal);
  const [amount, setAmount] = useState('');
  const [animate, setAnimate] = useState(false);
  const [lastUpdatedBalance, setLastUpdatedBalance] = useState(0);
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [vaultTransactions, setVaultTransactions] = useState([]);

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    // Fetch recent transactions right away
    fetchRecentVaultTransactions();
    setAnimate(true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setAnimate(true);
  }, [vaultBal]);

  useEffect(() => {
    setVaultTransactions(propVaultTransactions);
  }, [propVaultTransactions]);

  // ------------------ HANDLERS ------------------
  const handleChange = (event) => {
    setAmount(event.target.value);
  };

  const handleDeposit = async () => {
    if (!amount) return;
    const amountParsed = parseFloat(amount);

    // Basic validation
    if (
      isNaN(amountParsed) ||
      amountParsed <= 0 ||
      amountParsed > user.balance
    ) {
      alertModal(false, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
      return;
    }

    const result = await vaultDeposit(amount);
    const newTransaction = result.newTransaction;

    // Update local state
    setVaultTransactions([newTransaction, ...vaultTransactions]);
    setVaultBal(result.vaultBalance);
    setLastUpdatedBalance(vaultBal);
    setAmount('');
    setIsWithdraw(false);
    setLoaded(true);

    // Redux updates
    setBalance(result.newBalance);
    addNewTransaction(result.newTransaction);
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    const amountParsed = parseFloat(amount);

    // Basic validation
    if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > vaultBal) {
      alertModal(false, 'IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!');
      return;
    }

    const result = await vaultWithdraw(amount);
    const newTransaction = result.newTransaction;

    // Update local state
    setVaultTransactions([newTransaction, ...vaultTransactions]);
    setVaultBal(result.vaultBalance);
    setLastUpdatedBalance(vaultBal);
    setAmount('');
    setIsWithdraw(true);
    setLoaded(true);

    // Redux updates
    setBalance(result.newBalance);
    addNewTransaction(result.newTransaction);
  };

  // ------------------ STYLES (MUI) ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25',  // same background color as your login modal
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  // ------------------ RENDER ------------------
  return (
    <Modal
      open={modalIsOpen}
      onClose={closeModal}
      closeAfterTransition
      sx={{ zIndex: 1300 }}
      BackdropProps={{
        style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
      }}
    >
      <Box sx={modalBoxStyle}>
        {/* HEADER */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
            <FontAwesomeIcon icon={faLock} style={{ marginRight: 8 }} />
            Vault
          </Typography>
          <Button variant="text" color="error" onClick={closeModal}>
            X
          </Button>
        </Box>

        {/* BODY */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Balance Section */}
          <Box>
            <Typography variant="h5" textAlign="center">
              Your Vault Balance
            </Typography>
            <Typography variant="h4" textAlign="center">
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
              color='error'
              label="Enter Amount"
              variant="outlined"
              type="number"
              value={amount}
              onChange={handleChange}
              fullWidth
              sx={{ mt: 2 }}
            />
          </Box>

          {/* Recent Transactions */}
          <Box>
            <Typography variant="h5" textAlign="center">
              Recent Transactions
            </Typography>
            <Table size="small" sx={{ mt: 1 }}>
              <TableBody>
                {vaultTransactions.map((transaction, index) => {
                  const isWithdrawal =
                    transaction.description.includes('withdrawal');
                  return (
                    <TableRow
                      key={index}
                      sx={{
                        backgroundColor: isWithdrawal ? '#ffebee' : '#e8f5e9'
                      }}
                    >
                      <TableCell>{isWithdrawal ? '-' : '+'}</TableCell>
                      <TableCell>
                        {convertToCurrency(transaction.amount, solPrice)}
                      </TableCell>
                      <TableCell>
                        {new Date(transaction.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        </Box>

        {/* FOOTER (Deposit / Withdraw Buttons) */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
          <Button
            variant="contained"
            color="success"
            onClick={handleDeposit}
            startIcon={<AttachMoneyIcon />}
            sx={{ minWidth: 120 }}
          >
            Deposit
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleWithdraw}
            startIcon={<MoneyOffIcon />}
            sx={{ minWidth: 120 }}
          >
            Withdraw
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}

// ------------------ REDUX CONNECT ------------------
const mapStateToProps = (state) => ({
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