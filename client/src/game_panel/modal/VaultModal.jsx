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
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import MoneyOffIcon from '@mui/icons-material/MoneyOff';
import { faLock } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import CountUp from 'react-countup';
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
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '90vw', sm: '80vw', md: '60vw', lg: '50vw' },
            maxHeight: '90vh',
            overflowY: 'auto',
            borderRadius: 3,
            p: { xs: 2, sm: 3, md: 4 },
            // Glassmorphism
            background: 'rgba(30, 30, 30, 0.3)',
            backdropFilter: 'blur(15px)',
            WebkitBackdropFilter: 'blur(15px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            // Fallback
            '@supports not (backdrop-filter: blur(15px))': {
              background: 'rgba(30, 30, 30, 0.6)',
            },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255,255,255,0.2) transparent',
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '4px',
            },
          }}
        >
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
              <FontAwesomeIcon icon={faLock} style={{ marginRight: 8 }} />
              VAULT
            </Typography>
            <Button
              onClick={closeModal}
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                minWidth: 'auto',
                p: 1,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
                borderRadius: '50%',
              }}
            >
              <CloseIcon />
            </Button>
          </Box>

          {/* BODY */}
          <Box
            sx={{
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
                      {/* <CountUp
                        start={0}
                        end={vaultBal}
                        duration={1.5}
                        separator=","
                        decimals={2}
                        useEasing
                        useGrouping
                      />{' '} */}
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
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#FF0000' }}>
                            {isWithdrawal ? '-' : '+'}
                          </TableCell>
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#FF0000' }}>
                            {convertToCurrency(transaction?.amount, solPrice)}
                          </TableCell>
                          <TableCell sx={{ color: isWithdrawal ? '#00ff3a' : '#FF0000' }}>
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
              variant="outlined"
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
              variant="outlined"
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