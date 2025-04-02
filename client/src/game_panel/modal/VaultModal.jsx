import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Paper,
  Chip,
  Divider,
  CircularProgress,
} from '@mui/material';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import CountUp from 'react-countup';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import {
  fetchVaultBalance,
  vaultDeposit,
  vaultWithdraw,
  fetchRecentVaultTransactions,
  getUser,
} from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { errorMsgBar } from '../../redux/Notification/notification.actions';
import { convertToCurrency } from '../../util/conversion';

function VaultModal({ modalIsOpen, closeModal }) {
  const dispatch = useDispatch();

  // Redux state
  const user = useSelector((state) => state.auth.user);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const propVaultTransactions = useSelector((state) => state.auth.vaultTransactions);
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);

  // Local state
  const [amount, setAmount] = useState('');
  const [animate, setAnimate] = useState(false);
  const [lastUpdatedBalance, setLastUpdatedBalance] = useState(0);
  const [vaultBal, setVaultBal] = useState(0);
  const [isWithdraw, setIsWithdraw] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [vaultTransactions, setVaultTransactions] = useState([]);
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  // ------------------ EFFECTS ------------------
  useEffect(() => {
    async function loadBalance() {
      try {
        const initialBalance = await dispatch(fetchVaultBalance());
        setVaultBal(initialBalance);
      } catch (err) {
        console.error('Error fetching vault balance:', err);
      }
    }
    loadBalance();
    dispatch(fetchRecentVaultTransactions());
    setAnimate(true);
  }, [dispatch]);

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
    if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > user.balance) {
      dispatch(errorMsgBar('IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!'));
      return;
    }
    setDepositLoading(true);
    try {
      const result = await dispatch(vaultDeposit(amount));
      await dispatch(getUser());
      const newTransaction = result.newTransaction;
      setVaultTransactions([newTransaction, ...vaultTransactions]);
      setLastUpdatedBalance(vaultBal);
      setAmount('');
      setIsWithdraw(false);
      setLoaded(true);
      setVaultBal(result.vaultBalance);
      dispatch(addNewTransaction(result.newTransaction));
    } catch (error) {
      console.error('Error during deposit:', error);
    } finally {
      setDepositLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!amount) return;
    const amountParsed = parseFloat(amount);
    if (isNaN(amountParsed) || amountParsed <= 0 || amountParsed > vaultBal) {
      dispatch(errorMsgBar('IM-PAW-SIBBLEEE, ENTER A VALID AMOUNT!'));
      return;
    }
    setWithdrawLoading(true);
    try {
      const result = await dispatch(vaultWithdraw(amount));
      await dispatch(getUser());
      const newTransaction = result.newTransaction;
      setVaultTransactions([newTransaction, ...vaultTransactions]);
      setLastUpdatedBalance(vaultBal);
      setAmount('');
      setIsWithdraw(true);
      setLoaded(true);
      setVaultBal(result.vaultBalance);
      dispatch(addNewTransaction(result.newTransaction));
    } catch (error) {
      console.error('Error during withdrawal:', error);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // ------------------ STYLES ------------------
  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#2D3A4B',
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  // ------------------ RENDER ------------------
  return (
    <ThemeProvider theme={theme}>
      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        closeAfterTransition
        sx={{ zIndex: 1300 }}
        BackdropProps={{ style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' } }}
      >
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight: 8 }} />
              VAULT
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
              ×
            </Button>
          </Box>

          {/* BODY */}
          <Box
            sx={{
              background: '#2D3A4A',
              borderRadius: '0.3em',
              p: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {/* Balance Section */}
            <Box>
              <Typography variant="subtitle2" textAlign="center" sx={{ mt: 2, mb: 2 }}>
                Your Vault Balance
              </Typography>
              <Divider>
                <Chip
                  label={
                    <Typography variant="h5" component="span" sx={{ fontSize: '1.2rem', p: 2 }}>
                      <CountUp
                        start={0}
                        end={vaultBal}
                        duration={1.5}
                        separator=","
                        decimals={2}
                        useEasing
                        useGrouping
                      />{' '}
                      SOL (${(vaultBal * solPrice).toFixed(2)})
                    </Typography>
                  }
                  sx={{ mb: 2 }}
                />
              </Divider>
              <TextField
                color="error"
                label="Enter Amount"
                variant="filled"
                type="number"
                value={amount}
                onChange={handleChange}
                fullWidth
                sx={{ mt: 2 }}
              />
            </Box>

            {/* Recent Transactions */}
            <Box>
              <Typography variant="subtitle2" textAlign="center" sx={{ mt: 2 }}>
                Recent Transactions
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 1, maxHeight: 100 }}>
                <Table size="small" stickyHeader>
                  <TableBody>
                    {vaultTransactions.map((transaction, index) => {
                      const isWithdrawal = transaction?.description.includes('withdrawal');
                      return (
                        <TableRow key={index}>
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#D32F2F' }}>
                            {isWithdrawal ? '-' : '+'}
                          </TableCell>
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#D32F2F' }}>
                            {convertToCurrency(transaction?.amount, solPrice)}
                          </TableCell>
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#D32F2F' }}>
                            {new Date(transaction?.created_at).toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>

          {/* FOOTER (Deposit / Withdraw Buttons) */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3, gap: 2 }}>
            <Button
              variant="contained"
              color="error"
              onClick={handleDeposit}
              disabled={depositLoading || withdrawLoading}
              startIcon={
                depositLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <AttachMoneyIcon />
                )
              }
              fullWidth
            >
              {depositLoading ? 'processing...' : 'Deposit'}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleWithdraw}
              disabled={depositLoading || withdrawLoading}
              startIcon={
                withdrawLoading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <MoneyOffIcon />
                )
              }
              fullWidth
            >
              {withdrawLoading ? 'processing...' : 'Withdraw'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default VaultModal;