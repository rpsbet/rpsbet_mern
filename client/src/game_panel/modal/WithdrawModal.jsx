import React, { useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import axios from '../../util/Api';
import { convertToCurrency } from '../../util/conversion';
import { getUser, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import Summary from '../CreateGame/Summary';
import {
  Box,
  Modal,
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  IconButton,
  Typography,
  InputAdornment,
  Divider,
  ButtonGroup,
  CircularProgress,
} from '@mui/material';
import { getRank } from '../../util/getRank';
import {
  Warning,
  Info,
  Close as CloseIcon,
  AccountBalanceWallet,
} from '@mui/icons-material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faGasPump } from '@fortawesome/free-solid-svg-icons';
import {
  errorMsgBar,
  successMsgBar,
} from '../../redux/Notification/notification.actions';

function WithdrawModal(props) {
  const {
    userInfo,
    isDarkMode,
    gasfee,
    solPrice,
    balance,
    account,
    modalIsOpen,
    closeModal,
    setGasfee,
    getUser,
    addNewTransaction,
    connectedAccount,
  } = props;

  // --------------------- Local State ---------------------
  const [amountToWithdraw, setAmountToWithdraw] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  // --------------------- Debounce Logic for Gas Fee ---------------------
  const debounceTimer = useRef(null);
  useEffect(() => {
    // If no connected wallet or invalid amount => skip
    if (!connectedAccount) return;
    const parsed = parseFloat(amountToWithdraw);
    if (!parsed || parsed <= 0) return;

    // Debounce to avoid rapid calls
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(async () => {
      const params = {
        amount: parsed,
        addressTo: connectedAccount,
      };
      try {
        await setGasfee(params);
      } catch (err) {
        console.error('Error fetching gas fee:', err);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [account, amountToWithdraw, setGasfee]);

  // --------------------- Handlers ---------------------
  const handleAmountChange = (e) => {
    setAmountToWithdraw(e.target.value);
  };

  // Button group quick-set
  const handleMultiplier = (multiplier) => {
    const currentVal = parseFloat(amountToWithdraw) || 0;
    const newVal = currentVal * multiplier;
    setAmountToWithdraw(String(newVal.toFixed(2)));
  };

  const handleMax = () => {
    // Use the entire in-game balance
    setAmountToWithdraw(String(balance.toFixed(2)));
  };

  const send = async () => {
    const parsed = parseFloat(amountToWithdraw);
    if (isNaN(parsed) || parsed <= 0) {
      dispatch(errorMsgBar('ENTER A VALID NUMBER!'));
      return;
    }
    if (parsed > balance) {
      dispatch(errorMsgBar('NOT ENUFF FUNDS'));
      return;
    }
    if (userInfo.dailyWithdrawals > 4.269) {
      dispatch(errorMsgBar('EXCEEDED DAILY WITHDRAWAL LIMIT! (LAUNCH PHASE)'));
      return;
    }
    if (parsed >= 4.269) {
      dispatch(errorMsgBar('MAX PER DAY IS 4.269 SOL DURING LAUNCH PHASE'));
      return;
    }

    try {
      setIsLoading(true);
      const result = await axios.post('/stripe/withdraw_request/', {
        amount: parsed,
        addressTo: connectedAccount,
      });

      if (result.data.success) {
        dispatch(successMsgBar(result.data.message));
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        getUser();
        closeModal();
      } else {
        setIsLoading(false);
        dispatch(errorMsgBar(result.data.message));
      }
    } catch (error) {
      setIsLoading(false);
      dispatch(errorMsgBar('FAILED TRANSACTION'));
      console.error(error);
    }
  };

  const isConnected = !userInfo._id || !connectedAccount;

  return (
    <ThemeProvider theme={getCustomTheme(isDarkMode ? 'dark' : 'light')}>
      <LoadingOverlay
        active={isLoading}
        spinner
        text="Processing..."
        styles={{
          wrapper: {
            position: 'fixed',
            width: '100%',
            height: '100vh',
            zIndex: isLoading ? 3000 : 0,
          },
        }}
      />

      <Modal
        open={modalIsOpen || false}
        onClose={closeModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' },
        }}
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
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <AccountBalanceWallet sx={{ mr: 1 }} />
              WITHDRAW SOL
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

          {isConnected && (
            <Box
              sx={{
                display: 'flex',
                textAlign: 'center',
                alignItems: 'center',
                gap: 1,
                color: 'yellow',
              }}
            >
              CONNECT WALLET FIRST <Warning />
            </Box>
          )}
          <Box
          >
            {/* Step 1: Enter Amount */}
            <Divider sx={{ mb: 2 }}>
              <Typography>WITHDRAWAL AMOUNT</Typography>
            </Divider>

            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <ButtonGroup
                variant="outlined"
                color="error"
                sx={{
                  gap: 1,
                  '& .MuiButton-root': {
                    borderColor: 'error.main', // Ensure consistent border color
                    borderRadius: 0, // Reset border-radius for grouped buttons
                    '&:not(:last-child)': {
                      borderRightColor: 'error.main', // Prevent transparent right border
                    },
                    '&:first-of-type': {
                      borderTopLeftRadius: 8, // Match theme's borderRadius
                      borderBottomLeftRadius: 8,
                    },
                    '&:last-of-type': {
                      borderTopRightRadius: 8,
                      borderBottomRightRadius: 8,
                    },
                  },
                }}
              >
                <Button onClick={() => handleMultiplier(0.5)}>1/2x</Button>
                <Button onClick={() => handleMultiplier(2)}>2x</Button>
                <Button onClick={handleMax}>MAX</Button>
              </ButtonGroup>
            </Box>

            <TextField
              color="error"
              variant="filled"
              type="number"
              value={amountToWithdraw}
              onChange={handleAmountChange}
              error={parseFloat(amountToWithdraw) > balance}
              helperText={
                parseFloat(amountToWithdraw) > balance
                  ? 'You do not have enough SOL in your wallet.'
                  : ''
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">SOL</InputAdornment>
                ),
              }}
              sx={{ width: '100%', mb: 3 }}
            />

            {/* Step 2: Send to Address */}
            <Divider sx={{ mb: 2 }}>
              <Typography>SEND TO ADDRESS</Typography>
            </Divider>
            <Summary />

            {/* Balance & Gas Fee Table */}
            <Box sx={{ mt: 3 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>IN-GAME BALANCE:</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {balance} SOL ({convertToCurrency(balance, solPrice)})
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Your in-game wallet's balance" arrow>
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>
                      <FontAwesomeIcon icon={faGasPump} />
                      &nbsp;GAS FEE:
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {gasfee} SOL
                    </TableCell>
                    <TableCell>
                      <Tooltip
                        title="Network processing & validation fee"
                        arrow
                      >
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {/* Disclaimer */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography
                  color="warning"
                  sx={{ fontSize: '0.8em', mb: 2, fontWeight: 600 }}
                >
                  RECEIVE WITHIN SECONDS&nbsp;
                  <FontAwesomeIcon icon={faBolt} />
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="outlined"
              color="error"
              onClick={send}
              disabled={isConnected || isLoading || getRank(userInfo.totalWagered) <= 1}
              fullWidth
            >
              {getRank(userInfo.totalWagered) < 1 ? (
                'LVL 1 REQUIRED'
              ) : isLoading ? (
                <CircularProgress color="inherit" size={24} />
              ) : (
                'WITHDRAW'
              )}
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

// -------------------- REDUX --------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  gasfee: state.auth.gasfee,
  solPrice: state.logic.solPrice,
  userInfo: state.auth.user, // user => { _id, ... }
  balance: state.auth.user.balance,
  account: state.auth.user.account,
  connectedAccount: state.auth.connectedAccount,
});

const mapDispatchToProps = {
  setGasfee,
  addNewTransaction,
  getUser,
};

export default connect(mapStateToProps, mapDispatchToProps)(WithdrawModal);
