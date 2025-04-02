import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import axios from '../../util/Api';
import { setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';
import Summary from '../CreateGame/Summary';
import { errorMsgBar, successMsgBar } from '../../redux/Notification/notification.actions';

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

const modalBoxStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: '#2D3A4B', // Purple background
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

function DepositModal({ modalIsOpen, closeModal, balance, account }) {
  const dispatch = useDispatch();

  // Redux state via hooks
  const isDarkMode = useSelector((state) => state.auth.isDarkMode);
  const gasfee = useSelector((state) => state.auth.gasfee);
  const solPrice = useSelector((state) => state.logic.solPrice);
  const user_id = useSelector((state) => state.auth.user._id);
  const connectedAccount = useSelector((state) => state.auth.connectedAccount);

  // Local state
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Preset SOL amounts for quick selection
  const presetSolAmounts = [0.1, 0.2, 0.5, 1, 2, 5, 10];

  // Debounce logic for gas fee updates
  const debounceTimer = useRef(null);
  useEffect(() => {
    if (!account?.publicKey) return;
    if (!amount || parseFloat(amount) <= 0) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      const params = {
        amount: parseFloat(amount),
        addressTo: account.publicKey.toString(),
      };
      try {
        await dispatch(setGasfee(params));
      } catch (err) {
        console.error('Error fetching gas fee:', err);
      }
    }, 500);

    return () => clearTimeout(debounceTimer.current);
  }, [account, amount, dispatch]);

  // Handlers
  const handleAmountChange = (e) => {
    setAmount(e.target.value);
  };

  const handlePresetClick = (val) => {
    setAmount(String(val));
  };

  // Solana Transfer Handler
  const sendSOL = async () => {
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
      // 1) Fetch provider URL
      const getProviderUrl = await axios.get('/stripe/get_provider_url');
      const providerUrl = getProviderUrl.data.providerUrl;
      const connection = new Connection(providerUrl, 'confirmed');

      // 2) Get user's wallet and admin wallet details
      const fromWallet = account;
      if (!fromWallet?.publicKey) {
        console.error('No fromWallet publicKey found.');
        return;
      }
      const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
      const adminWalletPubkey = new PublicKey(getAdminWallet.data.adminWallet);

      setIsLoading(true);

      // 3) Construct transaction
      const lamports = Math.floor(numAmount * LAMPORTS_PER_SOL);
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: fromWallet.publicKey,
          toPubkey: adminWalletPubkey,
          lamports,
        })
      );

      // 4) Set recent blockhash & fee payer
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet.publicKey;

      // 5) Sign and send transaction via Phantom
      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);

      // 6) Notify backend of successful deposit
      const result = await axios.post('/stripe/deposit_successed', {
        account,
        amount: numAmount,
        txtHash: signature,
      });

      if (result.data.success) {
        dispatch(successMsgBar(result.data.message));
        dispatch(addNewTransaction(result.data.newTransaction));
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

  // Determine if user is connected
  const isConnected = !user_id || !connectedAccount;

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

          {/* Connection Warning */}
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
              background: '#2D3A4A',
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
                    <Button key={preset} onClick={() => handlePresetClick(preset)}>
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
                error={parseFloat(amount) > balance}
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
                      <Tooltip title="Network processing & validation fee" arrow>
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
              // disabled={isConnected || isLoading}
              disabled
            >
              {isLoading ? (
                <CircularProgress color="inherit" size={24} />
              ) : (
                'OPEN TO ALL USERS ON 3RD APRIL'
              )}
            </Button>
          </Box>
        </Box>
      </Modal>
    </ThemeProvider>
  );
}

export default DepositModal;