import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ThemeProvider } from '@mui/material/styles';
import { getCustomTheme } from '../../config/theme';

import {
  Connection,
  Transaction,
  PublicKey
} from '@solana/web3.js';
import {
  getMint,
  getAssociatedTokenAddress,
  createTransferInstruction
} from '@solana/spl-token';

import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

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
  RadioGroup,
  Grid,
  Radio,
  FormControlLabel,
  Card,
  CardActionArea,
  CardContent,
  CardMedia
} from '@mui/material';

import { styled } from '@mui/material/styles';
import {
  Warning,
  Info,
  AccountBalanceWallet,
  Link,
  FiberManualRecord,
  FileCopy as FileCopyIcon
} from '@mui/icons-material';
import QRCode from 'qrcode.react';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import QRCodeIcon from '@mui/icons-material/CropFreeOutlined';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

import { convertToCurrency } from '../../util/conversion';

// Your token mint address
const token = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

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
  gap: 2
};

const SectionBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

// Suggestions dropdown style
const suggestionsListStyle = {
  listStyleType: 'none',
  padding: '0',
  margin: '4px 0',
  border: '1px solid #ccc',
  borderRadius: 1,
  backgroundColor: '#e5e5e5',
  position: 'absolute',
  maxHeight: '100px',
  overflowY: 'auto',
  zIndex: 9999,
  width: '80%'
};

const suggestionStyle = {
  padding: '8px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #ccc'
};

function DepositModal(props) {
  const {
    isDarkMode,
    gasfee,
    solPrice,
    user_id,
    modalIsOpen,
    closeModal,
    tokenBalance,
    account,
    setGasfee,
    setBalance,
    addNewTransaction,
    loadSolanaWallet
  } = props;

  // -------------------- Local State --------------------
  const [amount, setAmount] = useState(0);
  const [web2Amount, setWeb2Amount] = useState(25);
  const [sendAmount, setSendAmount] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  const [selectedOption, setSelectedOption] = useState(0);
  const [currencyTo, setCurrencyTo] = useState('ltc');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('web3');
  const [currencies, setCurrencies] = useState([]);
  const [isValidCurrency, setIsValidCurrency] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [payinExtraId, setPayinExtraId] = useState('');
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  // Pack options and images
  const options = [0.25, 0.5, 1, 2.5, 10];
  const images = [
    '/img/icons/coins-xs.svg',
    '/img/icons/coins-s.svg',
    '/img/icons/coins-m.svg',
    '/img/icons/coins-l.svg',
    '/img/icons/coins-xl.svg',
    '/img/icons/coins-xxl.svg'
  ];
  const additionalTexts = ['shy guy', 'casual', 'flipper', 'baller', 'investor', 'jew'];

  // -------------------- EFFECTS --------------------
  useEffect(() => {
    (async function init() {
      if (account) {
        const params = { addressTo: account.publicKey?.toString() };
        await handleGetPaymentMethods();
        setGasfee(params);

        if (params.addressTo) {
          // For web2 flow, fetch an address
          getAddress();
        }
      }
      await getPrice();
    })();
    // eslint-disable-next-line
  }, []);

  // -------------------- HANDLERS --------------------
  const handlePaymentMethodChange = (e) => {
    const chosenMethod = e.target.value;
    setPaymentMethod(chosenMethod);

    // If user picks "web2", we fetch a deposit address
    // If "web3", we compute token amounts
    if (chosenMethod === 'web2') getAddress();
    else getPrice();
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleOptionChange = (index) => {
    setSelectedOption(index);
    setWeb2Amount(options[index]);
    setSendAddress('');

    if (paymentMethod === 'web2') getAddress();
    else getPrice();
  };

  const handleCurrencyChange = (e) => {
    const value = e.target.value;
    const valid = currencies.includes(value.toLowerCase());
    const filteredSuggestions = currencies.filter((c) =>
      c.toLowerCase().startsWith(value.toLowerCase())
    );

    setCurrencyTo(value);
    setIsValidCurrency(valid);
    setSuggestions(filteredSuggestions);

    if (valid) getAddress();
  };

  const handleSuggestionMouseEnter = (suggestion) => setHoveredSuggestion(suggestion);
  const handleSuggestionMouseLeave = () => setHoveredSuggestion(null);
  const handleSuggestionClick = (suggestion) => {
    setCurrencyTo(suggestion);
    setSuggestions([]);
    setIsValidCurrency(true);
    getAddress();
  };

  // -------------------- API: Payment Methods --------------------
  const handleGetPaymentMethods = async () => {
    try {
      const response = await axios.get('/stripe/get_currencies');
      const fetchedCurrencies = response.data.currencies.map((c) =>
        c.currency.toLowerCase()
      );
      setCurrencies(fetchedCurrencies);
    } catch (error) {
      console.error('Error fetching deposit methods:', error);
    }
  };

  // -------------------- API: Generate Address (web2) --------------------
  const getAddress = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/stripe/generate_address', {
        web2Amount,
        currencyTo
      });
      setSendAmount(response.data.pay_amount);
      setSendAddress(response.data.pay_address);
      setPaymentId(response.data.payment_id);
      setPayinExtraId(response.data.payin_extra_id);
    } catch (error) {
      console.error('Error generating address:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------- API: Price Calculation (web3) --------------------
  const getPrice = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post('/stripe/get_token_price', {
        tokenMintAddress: token,
        web2Amount
      });
      const { tokenPrice: fetchedTokenPrice, numberOfTokens } = response.data;
      setTokenPrice(fetchedTokenPrice);
      setAmount(numberOfTokens);
    } catch (error) {
      console.error('Error in getPrice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------- Web3: Send Transaction --------------------
  const send = async () => {
    if (amount > tokenBalance) {
      alertModal(isDarkMode, 'NOT ENUFF FUNDS AT THIS MEOWMENT');
      return;
    }

    try {
      const getProviderUrl = await axios.get('/stripe/get_provider_url');
      const providerUrl = getProviderUrl.data.providerUrl;
      const connection = new Connection(providerUrl, 'confirmed');

      const fromWallet = account;
      if (!fromWallet?.publicKey) {
        console.error('From wallet is not initialized properly.');
        return;
      }

      const tokenMintAddress = new PublicKey(token);
      const mintInfo = await getMint(connection, tokenMintAddress);
      const decimals = mintInfo.decimals;
      const amountInSmallestUnit = Math.floor(amount * 10 ** decimals);

      // Admin wallet
      const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
      const adminWallet = getAdminWallet.data.adminWallet;

      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        fromWallet.publicKey
      );
      const toTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        new PublicKey(adminWallet)
      );

      setIsLoading(true);

      // Create the transaction
      const transaction = new Transaction().add(
        createTransferInstruction(
          fromTokenAccount,
          toTokenAccount,
          fromWallet.publicKey,
          amountInSmallestUnit
        )
      );

      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet.publicKey;

      // Sign and send
      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);

      // Notify server
      const result = await axios.post('/stripe/deposit_successed/', {
        account,
        amount,
        price_amount: web2Amount,
        tokenMintAddress,
        txtHash: signature
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        setBalance(result.data.balance);
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        alertModal(isDarkMode, 'Something went wrong. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending web3 transaction:', error);
      setIsLoading(false);
      alertModal(isDarkMode, 'FAILED TRANSACTION');
    }
  };

  // -------------------- Web2 Payment: create payment then close modal --------------------
  const createPaymentAndClose = async () => {
    try {
      const response = await axios.post('/stripe/create_payment', {
        price_amount: web2Amount,
        payment_id: paymentId,
        user_id,
        tokenMintAddress: token
      });
      alertModal(isDarkMode, response.data.message, '-cat');
      closeModal();
    } catch (error) {
      console.error('Error creating web2 payment:', error);
    }
  };

  // -------------------- RENDERING --------------------
  const isBlurred = !user_id;
  const isConnected = !!account;

  // Payment method description
  let description = '';
  if (paymentMethod === 'web2') {
    description = 'Via Manual Transfer (50+ Cryptocurrencies supported)';
  } else if (paymentMethod === 'web3') {
    description = 'Via Connect Wallet (Phantom recommended), SOL only, lowest fees.';
  }

  // Create a custom theme instance based on dark mode
  const theme = getCustomTheme(isDarkMode ? 'dark' : 'light');

  return (
    <ThemeProvider theme={theme}>
      <LoadingOverlay
        active={isLoading}
        spinner
        text="Creating Block..."
        styles={{
          wrapper: {
            position: 'fixed',
            width: '100%',
            height: '100vh',
            zIndex: isLoading ? 999 : 0
          }
        }}
      />

      <Modal
        open={modalIsOpen}
        onClose={closeModal}
        sx={{ zIndex: 1300 }}
        BackdropProps={{
          style: { backgroundColor: 'rgba(0, 0, 0, 0.8)' }
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
              DEPOSIT
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
            ×
            </Button>
          </Box>

          {/* If user not logged in */}
          {isBlurred && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'yellow' }}>
              LOGIN FURRST <Warning />
            </Box>
          )}

          {/* BODY */}
          <SectionBox sx={{ opacity: isBlurred ? 0.5 : 1 }}>
            {/* Payment Method */}
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Select Deposit Method:
              </Typography>
              <RadioGroup
                row
                name="payment-method"
                value={paymentMethod}
                onChange={handlePaymentMethodChange}
              >
                <FormControlLabel
                  value="web3"
                  control={<Radio color="error" />}
                  label={
                    <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <WalletIcon sx={{ mr: 1 }} />
                      <Typography component="span">SOL</Typography>
                      {paymentMethod === 'web3' && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#fff'
                          }}
                        >
                          FASTEST&nbsp;
                          <FontAwesomeIcon icon={faBolt} />
                        </Box>
                      )}
                    </Box>
                  }
                />
                <FormControlLabel
                  value="web2"
                  control={<Radio color="error" />}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <QRCodeIcon sx={{ mr: 1 }} />
                      <Typography component="span">Other currencies</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
              <Typography variant="body2" sx={{ mt: 1, color: '#ccc' }}>
                {description}
              </Typography>
            </Box>

            {/* Step 1: Choose Pack */}
            <Typography sx={{ fontStyle: 'italic' }}>
              {paymentMethod === 'web2' ? 'Step 1 of 4' : 'Step 1 of 3'}
            </Typography>
            <Typography variant="subtitle2">CHOOSE PACK</Typography>

            <Grid container spacing={2}>
              {options.map((price, idx) => {
                const tokenAmt = tokenPrice ? price / tokenPrice : 0;
                const isSelected = selectedOption === idx;

                return (
                  <Grid item xs={6} sm={6} md={6} lg={6} key={idx}>
                    <Card
                      sx={{
                        backgroundColor: isSelected ? '#ff9900' : '#0076ff',
                        color: '#fff'
                      }}
                    >
                      <CardActionArea onClick={() => handleOptionChange(idx)}>
                        <CardMedia
                          component="img"
                          height="60"
                          image={images[idx]}
                          alt={`pack-${idx}`}
                          sx={{ objectFit: 'contain', p: 1 }}
                        />
                        <CardContent sx={{ textAlign: 'center' }}>
                          <Typography variant="button" sx={{ fontWeight: 'bold' }}>
                            {additionalTexts[idx].toUpperCase()}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
                            <Typography
                              sx={{
                                backgroundColor: '#2e3fa1',
                                color: '#dfeeff',
                                border: '2px solid #c2e0ff',
                                borderRadius: 1,
                                px: 1,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {/* If it's web2, show a slightly smaller tokenAmt */}
                              {paymentMethod === 'web2'
                                ? convertToCurrency(tokenAmt - tokenAmt * 0.008, solPrice)
                                : convertToCurrency(tokenAmt, solPrice)}
                            </Typography>
                            <Typography
                              sx={{
                                backgroundColor: '#2e3fa1',
                                color: '#dfeeff',
                                border: '2px solid #c2e0ff',
                                borderRadius: 1,
                                px: 1,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {`($${price})`}
                            </Typography>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>

            {/* WEB3 Flow */}
            {paymentMethod === 'web3' ? (
              <>
                {/* Step 2: Connect Wallet */}
                <Typography sx={{ fontStyle: 'italic', mt: 2 }}>Step 2 of 3</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>
                    CONNECT ACCOUNT
                  </Typography>
                  <TextField
                    color='error'
                    variant="filled"
                    fullWidth
                    value={
                      isConnected
                        ? account?.publicKey?.toString() || ''
                        : 'NO WALLET CONNECTED'
                    }
                    InputProps={{ readOnly: true }}
                  />
                  <FiberManualRecord
                    sx={{
                      color: isConnected ? 'green' : 'red',
                      fontSize: '1rem'
                    }}
                  />
                  <Tooltip title={isConnected ? 'Connected' : 'Connect Wallet?'} arrow>
                    <IconButton
                      size="small"
                      onClick={!isConnected ? loadSolanaWallet : undefined}
                    >
                      <Info />
                      {!isConnected && <Link sx={{ ml: 0.5 }} />}
                    </IconButton>
                  </Tooltip>
                </Box>

                {/* Step 3: Deposit */}
                <Typography sx={{ fontStyle: 'italic', mt: 2 }}>Step 3 of 3</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Typography>CLICK 'DEPOSIT' TO COMPLETE PAYMENT VIA YOUR WALLET</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>DEPOSIT AMOUNT</Typography>
                    <TextField
                      color='error'
                      variant="outlined"
                      type="number"
                      value={amount}
                      InputProps={{
                        readOnly: true,
                        endAdornment: <InputAdornment position="end">SOL</InputAdornment>
                      }}
                      sx={{ width: '100%' }}
                    />
                    <Tooltip
                      title="Amount is auto-calculated based on selected pack."
                      arrow
                    >
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  </Box>

                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>WALLET BALANCE:</TableCell>
                        <TableCell sx={{ textAlign: 'center' }}>
                          {convertToCurrency(tokenBalance, solPrice)}
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title="Your connected wallet's balance"
                            arrow
                          >
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
                          {gasfee.toFixed(6)} SOL
                        </TableCell>
                        <TableCell>
                          <Tooltip
                            title="Gas fee covers network processing & validation."
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
              </>
            ) : (
              // WEB2 Flow
              <>
                <Typography sx={{ fontStyle: 'italic', mt: 2 }}>Step 2 of 4</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>
                    CURRENCY TYPE
                  </Typography>
                  <TextField
                    color='error'
                    variant="filled"
                    value={currencyTo.toUpperCase()}
                    onChange={handleCurrencyChange}
                    error={!isValidCurrency}
                    helperText={!isValidCurrency ? 'Invalid currency' : ''}
                  />
                  <Tooltip title="Enter the cryptocurrency to transfer" arrow>
                    <IconButton size="small">
                      <Info />
                    </IconButton>
                  </Tooltip>
                </Box>
                {suggestions.length > 0 && (
                  <Box component="ul" sx={suggestionsListStyle}>
                    {suggestions.map((suggestion) => (
                      <Box
                        key={suggestion}
                        component="li"
                        sx={{
                          ...suggestionStyle,
                          backgroundColor:
                            hoveredSuggestion === suggestion ? '#ffc107' : 'transparent',
                          color: hoveredSuggestion === suggestion ? '#060607' : '#212529'
                        }}
                        onMouseEnter={() => handleSuggestionMouseEnter(suggestion)}
                        onMouseLeave={handleSuggestionMouseLeave}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <Typography>{suggestion.toUpperCase()}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                {sendAddress && isValidCurrency ? (
                  <>
                    <Typography sx={{ fontStyle: 'italic', mt: 2 }}>Step 3 of 4</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography sx={{ whiteSpace: 'nowrap' }}>
                        DEPOSIT AMOUNT
                      </Typography>
                      <TextField
                        color='error'
                        variant="outlined"
                        value={sendAmount}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <Typography variant="body2">
                              {currencyTo.toUpperCase()}
                            </Typography>
                          )
                        }}
                        sx={{ width: '100%' }}
                      />
                      <Tooltip
                        title="Send this exact amount. Funds arrive in a few minutes."
                        arrow
                      >
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    <Typography variant="body2" sx={{ mt: 2 }}>
                      PAYMENT ADDRESS
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TextField
                        color='error'
                        variant="outlined"
                        fullWidth
                        value={sendAddress}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <Tooltip
                              title={copied ? 'Copied!' : 'Copy to clipboard'}
                              arrow
                            >
                              <IconButton onClick={() => handleCopyToClipboard(sendAddress)}>
                                <FileCopyIcon />
                              </IconButton>
                            </Tooltip>
                          )
                        }}
                      />
                    </Box>

                    {/* MEMO / DEST TAG */}
                    {payinExtraId && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2">
                          MEMO / DESTINATION TAG ETC.
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TextField
                            color='error'
                            variant="outlined"
                            fullWidth
                            value={payinExtraId}
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <Tooltip
                                  title={copied ? 'Copied!' : 'Copy to clipboard'}
                                  arrow
                                >
                                  <IconButton onClick={() => handleCopyToClipboard(payinExtraId)}>
                                    <FileCopyIcon />
                                  </IconButton>
                                </Tooltip>
                              )
                            }}
                          />
                        </Box>
                      </Box>
                    )}

                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        backgroundColor: '#f9f9f9',
                        borderRadius: 1,
                        p: 2,
                        mt: 2
                      }}
                    >
                      <QRCode value={sendAddress} />
                    </Box>
                    <Typography sx={{ color: '#ff0000', textAlign: 'center', mt: 1 }}>
                      DO NOT SEND ANY OTHER CRYPTOCURRENCY TYPE EXCEPT{' '}
                      {currencyTo.toUpperCase()}
                    </Typography>

                    <Typography sx={{ fontStyle: 'italic', mt: 2 }}>Step 4 of 4</Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography>
                        CLICK 'I HAVE PAID' ONCE YOU HAVE SENT PAYMENT
                      </Typography>
                      <Typography variant="body2">
                        PAYMENT ID (FOR YOUR REFERENCE ONLY)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          color='error'
                          variant="outlined"
                          fullWidth
                          value={paymentId}
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <Tooltip
                                title={copied ? 'Copied!' : 'Copy to clipboard'}
                                arrow
                              >
                                <IconButton onClick={() => handleCopyToClipboard(paymentId)}>
                                  <FileCopyIcon />
                                </IconButton>
                              </Tooltip>
                            )
                          }}
                        />
                        <Tooltip title="This is your payment reference ID" arrow>
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                    <CircularProgress color='error' />
                  </Box>
                )}
              </>
            )}

            {/* Disclaimer */}
            <Box>
              <Typography sx={{ color: '#ffcb05' }}>
                {paymentMethod === 'web3'
                  ? 'RECEIVE WITHIN < 30 SECONDS'
                  : 'RECEIVE WITHIN 3 - 6 MINUTES'}
              </Typography>
            </Box>
          </SectionBox>

          {/* FOOTER */}
          {!isBlurred && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                color="error"
                onClick={paymentMethod === 'web3' ? send : createPaymentAndClose}
              >
                {paymentMethod === 'web3' ? 'Deposit' : 'I HAVE PAID'}

              </Button>
              
                If you want a cancel button, uncomment below:
                <Button variant="contained" color='error' onClick={closeModal} sx={{ ml: 2 }}>
                  CANCEL
                </Button> 
             
            </Box>
          )}
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
  user_id: state.auth.user._id
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(DepositModal);