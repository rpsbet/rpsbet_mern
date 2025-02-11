import React, { useState, useEffect, useRef } from 'react';
import { connect, useDispatch } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import axios from '../../util/Api';
import { setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import Summary from '../CreateGame/Summary';
import {
  errorMsgBar,
  successMsgBar,
} from '../../redux/Notification/notification.actions';

// FIX #1: Import and set Buffer for browser usage
import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

import {
  Connection,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';

import {
  Box,
  Modal,
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  CircularProgress,
  Tooltip,
  Typography,
  InputAdornment,
  ButtonGroup,
  Divider,
} from '@mui/material';

import { Warning, Info, AccountBalanceWallet } from '@mui/icons-material';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBolt, faGasPump } from '@fortawesome/free-solid-svg-icons';
import { convertToCurrency } from '../../util/conversion';

// -------------------- STYLES (MUI) --------------------
const modalBoxStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#1f1a25', // Purple background
  color: '#fff',
  boxShadow: 24,
  borderRadius: 1,
  p: 3,
  width: 600,
  maxWidth: '90vw',
  maxHeight: '90vh',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

function DepositModal(props) {
  const {
    isDarkMode,
    gasfee,
    solPrice,
    user_id,
    modalIsOpen,
    closeModal,
    balance, // User's SOL balance
    account, // { publicKey: ... }
    setGasfee, // Redux action to fetch and store gas fee
    addNewTransaction,
    connectedAccount,
  } = props;

  // -------------------- Local State --------------------
  const [amount, setAmount] = useState(''); // user-entered SOL amount (string for easy input)
  const [isLoading, setIsLoading] = useState(false);

  // Preset SOL amounts for quick selection
  const presetSolAmounts = [0.1, 0.2, 0.5, 1, 2, 5, 10];

  const dispatch = useDispatch();

  // -------------------- Debounce Logic for Gas Fee --------------------
  const debounceTimer = useRef(null);
  useEffect(() => {
    // If no connected wallet or no amount, skip
    if (!account?.publicKey) return;
    if (!amount || parseFloat(amount) <= 0) return;

    // Clear any existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Start a new debounce
    debounceTimer.current = setTimeout(async () => {
      const params = {
        amount: parseFloat(amount), // ensure numeric
        addressTo: account.publicKey.toString(),
      };
      try {
        await setGasfee(params);
      } catch (err) {
        console.error('Error fetching gas fee:', err);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [account, amount, setGasfee]);

  // -------------------- Handlers --------------------
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handlePresetClick = (val) => {
    setAmount(String(val));
  };

  // -------------------- Solana Transfer --------------------
  const sendSOL = async () => {
    // 1) Basic validation
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      dispatch(errorMsgBar('Please enter a valid SOL amount.'));
      return;
    }
    if (numAmount > balance) {
      dispatch(errorMsgBar('Not enough SOL in your wallet.'));
      return;
    }

    try {
      // 2) Fetch RPC provider
      const getProviderUrl = await axios.get('/stripe/get_provider_url');
      const providerUrl = getProviderUrl.data.providerUrl;
      const connection = new Connection(providerUrl, 'confirmed');

      // 3) Build a SystemProgram transfer from user's wallet => admin wallet
      const fromWallet = account;
      if (!fromWallet?.publicKey) {
        console.error('No fromWallet publicKey found.');
        return;
      }

      // We'll need the admin's public key
      const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
      const adminWalletPubkey = new PublicKey(getAdminWallet.data.adminWallet);

      setIsLoading(true);

      // 4) Construct the transaction
      const lamports = Math.floor(numAmount * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: adminWalletPubkey,
          lamports,
        }),
      );

      // 5) Get blockhash & set feePayer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet.publicKey;

      // 6) Sign & Send via Phantom
      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);

      // 7) Notify your backend
      const result = await axios.post('/stripe/deposit_successed', {
        account,
        amount: numAmount,
        txtHash: signature,
      });

      if (result.data.success) {
        dispatch(successMsgBar(result.data.message));
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        dispatch(errorMsgBar('Something went wrong. Please try again later.'));
      }
    } catch (error) {
      console.error('Error sending SOL transaction:', error);
      setIsLoading(false);
      dispatch(errorMsgBar('FAILED TRANSACTION'));
    }
  };

  // -------------------- Render --------------------
  const isConnected = !user_id || !connectedAccount; // If user not logged in, blur everything

  return (
    <ThemeProvider theme={getCustomTheme(isDarkMode ? 'dark' : 'light')}>
      <LoadingOverlay
        active={isLoading}
        spinner
        text="Processing Transaction..."
        styles={{
          wrapper: {
            position: 'fixed',
            width: '100%',
            height: '100vh',
            zIndex: isLoading ? 999 : 0,
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
        <Box sx={modalBoxStyle}>
          {/* HEADER */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <AccountBalanceWallet sx={{ mr: 1 }} />
              DEPOSIT (SOL)
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
              ×
            </Button>
          </Box>

          {/* If user not logged in */}
          {isConnected && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'yellow',
              }}
            >
              CONNECT WALLET FIRST <Warning />
            </Box>
          )}

          {/* BODY */}
          <Box
            sx={{
              background: 'rgba(170, 170, 170, 0.06)',
              p: 2,
              borderRadius: 1,
            }}
          >
            <Summary />

            <Box sx={{ p: 2 }}>
              <Divider>
                <Typography>ENTER DEPOSIT AMOUNT (SOL)</Typography>
              </Divider>

              {/* Preset Buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <ButtonGroup variant="outlined" color="error" sx={{ mb: 1 }}>
                  {presetSolAmounts.map((preset) => (
                    <Button
                      key={preset}
                      onClick={() => handlePresetClick(preset)}
                    >
                      {preset}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              {/* Amount TextField */}
              <TextField
                color="error"
                variant="filled"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                error={parseFloat(amount) > balance} // Mark red if user typed > balance
                helperText={
                  parseFloat(amount) > balance
                    ? 'You do not have enough SOL in your wallet.'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">SOL</InputAdornment>
                  ),
                }}
                sx={{ width: '100%' }}
              />

              {/* Stats Table */}
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>WALLET BALANCE:</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      {balance} SOL ({convertToCurrency(balance, solPrice)})
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Your connected wallet's balance" arrow>
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
            </Box>

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

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              color="error"
              fullWidth
              onClick={sendSOL}
              disabled={isConnected || isLoading}
            >
              {isLoading ? (
                // Show MUI spinner in the button
                <CircularProgress color="inherit" size={24} />
              ) : (
                'DEPOSIT'
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
  gasfee: state.auth.gasfee, // Numeric gas fee in SOL
  solPrice: state.logic.solPrice,
  user_id: state.auth.user._id,
  connectedAccount: state.auth.connectedAccount,
});

const mapDispatchToProps = {
  setGasfee,
  addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(DepositModal);
