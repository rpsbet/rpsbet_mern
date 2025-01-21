import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { Connection, Transaction, PublicKey } from '@solana/web3.js';
import { getMint, getAssociatedTokenAddress, createTransferInstruction } from '@solana/spl-token';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCodeIcon from '@mui/icons-material/CropFreeOutlined';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import QRCode from 'qrcode.react';
import { token } from '../../config/index.js';

import {
  faGasPump,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';

import {
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  CircularProgress,
  Tooltip,
  Icon,
  Typography,
  InputAdornment,
  RadioGroup,
  Grid,
  Radio,
  FormControlLabel,
  ButtonBase,
  Box
} from '@mui/material';
import { Info, Warning, AccountBalanceWallet, Link, FiberManualRecord } from '@mui/icons-material';
import { convertToCurrency } from '../../util/conversion';
import { styled } from '@mui/material/styles';
import { Buffer } from 'buffer';
window.Buffer = window.Buffer || Buffer;

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
    padding: 0,
    background: 'transparent',
    border: 'none',
  },
};

// Styled Components
const Root = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  backgroundColor: '#f9f9f9',
  borderRadius: '8px',
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
}));

const PaymentMethodContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
}));

const RadioLabel = styled(Typography)(({ isDarkMode }) => ({
  marginRight: '16px',
  fontWeight: 'bold',
  display: 'flex',
  alignItems: 'center',
  color: isDarkMode ? '#f9f9f9' : '#333',
}));

const CustomButton = styled(ButtonBase)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'pointer',
  height: '100%',
  width: '100%',
  borderRadius: '0.3em',
  padding: '10px',
  marginLeft: '-15px',
  background: '#0076ff',
  '&:hover': {
    outline: '2px solid white',
  },
}));

const Price = styled(Typography)(({ theme }) => ({
  margin: theme.spacing(0.5),
  color: '#dfeeff',
  background: '#2e3fa1',
  padding: '2.5px 5px',
  border: '2px solid #c2e0ff',
  borderRadius: '30px',
  whiteSpace: 'nowrap',
}));


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
    loadSolanaWallet,
  } = props;

  // -------------------- Local State --------------------
  const [amount, setAmount] = useState(0);
  const [web2Amount, setWeb2Amount] = useState(25);
  const [sendAmount, setSendAmount] = useState(0);
  const [sendAddress, setSendAddress] = useState('');
  const [selectedOption, setSelectedOption] = useState(0);
  const [currencyTo, setCurrencyTo] = useState('ltc');
  const [balance, setLocalBalance] = useState(tokenBalance || 0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('web3');
  const [currencies, setCurrencies] = useState([]);
  const [isValidCurrency, setIsValidCurrency] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [payinExtraId, setPayinExtraId] = useState('');
  const [loading, setLoading] = useState(true);
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [tokenPrice, setTokenPrice] = useState(null);
  const [copied, setCopied] = useState(false);
  const [paymentId, setPaymentId] = useState('');

  const options = [0.25, 0.5, 1, 2.5, 10];
  const images = [
    '/img/icons/coins-xs.svg',
    '/img/icons/coins-s.svg',
    '/img/icons/coins-m.svg',
    '/img/icons/coins-l.svg',
    '/img/icons/coins-xl.svg',
    '/img/icons/coins-xxl.svg',
  ];
  const additionalTexts = ['shy guy', 'casual', 'flipper', 'baller', 'investor', 'jew'];

  // -------------------- Lifecycle: componentDidMount Equivalent --------------------
  useEffect(() => {
    (async function init() {
      if (account) {
        // Prepare params for setGasfee
        const params = { addressTo: account.publicKey.toString() };
        await handleGetPaymentMethods();
        setGasfee(params);

        if (!params.addressTo) {
          console.error('Missing or empty parameters, skipping execution.');
          return;
        }
        getAddress(); // For "web2" flow
      } else {
        console.error('Account not initialized, skipping setGasfee');
      }
      await getPrice();
    })();
  }, []);

  // -------------------- Handlers --------------------
  const handlePaymentMethodChange = (event) => {
    const chosenMethod = event.target.value;
    setPaymentMethod(chosenMethod);
    if (chosenMethod === 'web2') {
      getAddress();
    } else {
      getPrice();
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
    setLoading(true);
    if (valid) {
      getAddress(); // If valid currency, fetch updated address
    }
  };

  const handleOptionChange = (index) => {
    setSelectedOption(index);
    setWeb2Amount(options[index]);
    setSendAddress('');
    if (paymentMethod === 'web2') {
      getAddress();
    } else {
      getPrice();
    }
  };

  const handleSuggestionMouseEnter = (suggestion) => {
    setHoveredSuggestion(suggestion);
  };

  const handleSuggestionMouseLeave = () => {
    setHoveredSuggestion(null);
  };

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
      const fetchedCurrencies = response.data.currencies.map((c) => c.currency.toLowerCase());
      setCurrencies(fetchedCurrencies);
    } catch (error) {
      console.error('Error in generating deposit address:', error);
    }
  };

  // -------------------- API: Generate Address --------------------
  const getAddress = async () => {
    setLoading(true);
    try {
      const response = await axios.post('/stripe/generate_address', {
        web2Amount,
        currencyTo,
      });
      setSendAmount(response.data.pay_amount);
      setSendAddress(response.data.pay_address);
      setPaymentId(response.data.payment_id);
      setPayinExtraId(response.data.payin_extra_id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- API: Price Calculation --------------------
  const getPrice = async () => {
    setLoading(true);
    try {
      // server route expects { tokenMintAddress, web2Amount }
      const response = await axios.post('/stripe/get_token_price', {
        tokenMintAddress: token,
        web2Amount,
      });
      // Destructure price results
      const { tokenPrice: fetchedTokenPrice, numberOfTokens } = response.data;

      setTokenPrice(fetchedTokenPrice); // e.g. "0.5" means $1 => 2 tokens
      setAmount(numberOfTokens);        // e.g. total tokens user will receive
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Send Transaction (web3) --------------------
  const send = async () => {
    if (amount > tokenBalance) {
      alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return;
    }

    try {
      const getProviderUrl = await axios.get('/stripe/get_provider_url');
      const providerUrl = getProviderUrl.data.providerUrl;
      const connection = new Connection(providerUrl, 'confirmed');

      // fromWallet should be the "account"
      const fromWallet = account;
      if (!fromWallet || !fromWallet.publicKey) {
        console.error('From wallet is not initialized correctly:', fromWallet);
        return;
      }
      const tokenMintAddress = new PublicKey('BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump');
      const mintInfo = await getMint(connection, tokenMintAddress);
      const decimals = mintInfo.decimals;

      // Convert human-readable token amount to smallest unit
      const amountInSmallestUnit = Math.floor(amount * 10 ** decimals);

      // Associated token addresses
      const fromTokenAccount = await getAssociatedTokenAddress(
        tokenMintAddress,
        fromWallet.publicKey
      );

      // Admin wallet
      const getAdminWallet = await axios.get('/stripe/get_admin_wallet');
      const adminWallet = getAdminWallet.data.adminWallet;
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

      // Fetch the latest blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromWallet.publicKey;

      // Sign & send
      const signature = await window.solana.signAndSendTransaction(transaction);
      await connection.confirmTransaction(signature);

      // Log the deposit success on your server
      const result = await axios.post('/stripe/deposit_successed/', {
        account: account,
        amount: amount,
        price_amount: web2Amount,
        tokenMintAddress: tokenMintAddress,
        txtHash: signature,
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        setBalance(result.data.balance);
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        closeModal();
      } else {
        setIsLoading(false);
        alertModal(
          isDarkMode,
          `Something went wrong. Please try again later or contact support.`
        );
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      setIsLoading(false);
      alertModal(isDarkMode, `FAILED TRANSACTION`);
    }
  };

  // -------------------- Web2 Payment: create payment then close modal --------------------
  const createPaymentAndClose = async () => {
    try {
      const response = await axios.post('/stripe/create_payment', {
        price_amount: web2Amount,
        payment_id: paymentId,
        user_id,
        tokenMintAddress: token,
      });
      alertModal(isDarkMode, response.data.message, '-cat');
      closeModal();
    } catch (error) {
      console.error(error);
    }
  };

  // -------------------- Render --------------------
  const isBlurred = !user_id;
  const isConnected = !!account;
  let description = '';

  switch (paymentMethod) {
    case 'web2':
      description = 'Via Manual Transfer (50+ Cryptocurrencies supported)';
      break;
    case 'web3':
      description = (
        <>
          Via Connect Wallet (Phantom Wallet recommended), SOL only, lowest fees.
        </>
      );
      break;
    default:
      description = '';
  }

  return (
    <>
      <LoadingOverlay
        active={isLoading}
        spinner
        text="Creating Block..."
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
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        style={customStyles}
        contentLabel="Deposit Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <Icon component={AccountBalanceWallet} className="mr-2" />
              DEPOSIT
            </h2>
            <Button className="btn-close" variant='text' color='error'  onClick={closeModal}>
              ×
            </Button>
          </div>

          {isBlurred && (
            <div className="login-first">
              LOGIN FURRST&nbsp;
              <Warning width="20pt" />
            </div>
          )}

          <div
            className={`modal-body edit-modal-body deposit-modal-body ${isBlurred ? 'blur' : ''
              }`}
          >
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                <Root>
                  <RadioLabel isDarkMode={isDarkMode}>Select Deposit Method:</RadioLabel>
                  <PaymentMethodContainer>
                    <RadioGroup
                      aria-label="payment-method"
                      name="payment-method"
                      value={paymentMethod}
                      onChange={handlePaymentMethodChange}
                      sx={{ flexDirection: 'row' }}
                    >
                      <FormControlLabel
                        value="web3"
                        control={<Radio color='error' />}
                        label={
                          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <WalletIcon sx={{ marginRight: 1 }} />
                            <span>SOL</span>
                            {paymentMethod === 'web3' && (
                              <Box
                                className="roll-tag"
                                sx={{
                                  position: 'absolute',
                                  transform: 'translateY(30px)',
                                  filter: 'invert(1)',
                                  letterSpacing: '0.1em',
                                }}
                              >
                                FASTEST&nbsp;
                                <FontAwesomeIcon icon={faBolt} style={{ marginLeft: '0.2em' }} />
                              </Box>
                            )}
                          </Box>
                        }
                      />
                      <FormControlLabel
                        value="web2"
                        control={<Radio color='error' />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <QRCodeIcon sx={{ marginRight: 1 }} />
                            <span>Other currencies</span>
                          </Box>
                        }
                      />
                    </RadioGroup>
                  </PaymentMethodContainer>
                  <Typography variant="body2" sx={{ textAlign: 'center', color: '#666', marginTop: 2 }}>
                    {description}
                  </Typography>
                </Root>
                <hr />
                <p className="step-tag">
                  {paymentMethod === 'web2'
                    ? 'Step 1 out of 4'
                    : paymentMethod === 'web3'
                      ? 'Step 1 out of 3'
                      : ''}
                </p>
                <Typography>CHOOSE PACK</Typography>
                <Grid
                  container
                  style={{ margin: '0 auto 15px auto' }}
                  spacing={3}
                >
                  {options.map((price, index) => {
                    const tokenAmt = tokenPrice ? price / tokenPrice : 0;
                    return (
                      <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                        <CustomButton
                          onClick={() => handleOptionChange(index)}
                          value={price}
                          className={selectedOption === index ? 'selected' : ''}
                        >
                          <Typography sx={{ color: '#f9f9f9' }}>
                            {additionalTexts[index].toUpperCase()}
                          </Typography>
                          <img
                            style={{ width: '50px', display: 'block', margin: 'auto' }}
                            src={images[index]}
                            alt={`option-${index}`}
                          />
                          <Box
                            sx={{
                              width: '100%',
                              display: 'flex',
                              justifyContent: 'center',
                              alignContent: 'center',
                              flexDirection: 'row',
                            }}
                          >
                            <Price>
                              {paymentMethod === 'web2'
                                ? convertToCurrency(tokenAmt - tokenAmt * 0.008, solPrice)
                                : convertToCurrency(tokenAmt, solPrice)}
                            </Price>
                            <Price>{`($${price})`}</Price>
                          </Box>
                        </CustomButton>
                      </Grid>
                    );
                  })}
                </Grid>

                {paymentMethod === 'web3' ? (
                  <>
                    <div className="account">
                      <p className="step-tag">Step 2 out of 3</p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <Typography style={{ whiteSpace: 'nowrap' }}>
                          CONNECT ACCOUNT
                        </Typography>
                        {isConnected ? (
                           <TextField color="secondary" 
                            label="Account"
                            variant="filled"
                            value={
                              account?.publicKey
                                ? account.publicKey.toString()
                                : ''
                            }
                            InputProps={{
                              readOnly: true,
                            }}
                            style={{ width: '100%' }}
                          />
                        ) : (
                           <TextField color="secondary" 
                            label="Account"
                            variant="filled"
                            value="NO WALLET CONNECTED"
                            InputProps={{
                              readOnly: true,
                            }}
                            style={{ width: '100%' }}
                          />
                        )}

                        {isConnected ? (
                          <FiberManualRecord
                            className="light"
                            style={{ background: '#28a745', color: 'green' }}
                          />
                        ) : (
                          <FiberManualRecord
                            className="light"
                            style={{ background: '#ff0000', color: 'red' }}
                          />
                        )}
                        {isConnected ? (
                          <Tooltip title="Connected account" arrow>
                            <IconButton size="small">
                              <Info />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Tooltip title="Connect Web3 Wallet?" arrow>
                            <IconButton onClick={loadSolanaWallet} size="small">
                              <Info />
                              <Link
                                fontSize="small"
                                style={{ marginLeft: '4px' }}
                              />
                            </IconButton>
                          </Tooltip>
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="step-tag">Step 3 out of 3</p>
                      <div
                        className="account"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          marginTop: '20px',
                        }}
                      >
                        <Typography>
                          CLICK 'DEPOSIT' TO COMPLETE PAYMENT VIA YOUR WALLET
                          PROVIDER
                        </Typography>
                      </div>
                      <div
                        className="account"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <Typography style={{ whiteSpace: 'nowrap' }}>
                          DEPOSIT AMOUNT
                        </Typography>
                         <TextField color="secondary" 
                          pattern="^\\d*\\.?\\d*$"
                          type="text"
                          variant="outlined"
                          autoComplete="off"
                          value={amount}
                          style={{ pointerEvents: 'none' }}
                          className="form-control"
                          InputProps={{
                            readOnly: true,
                            endAdornment: (
                              <InputAdornment position="end">&nbsp;SOL</InputAdornment>
                            ),
                          }}
                        />
                        <Tooltip
                          title="Amount is automatically calculated based on selected pack."
                          arrow
                        >
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </div>
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <Typography style={{ whiteSpace: 'nowrap' }}>
                                WALLET BALANCE:
                              </Typography>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              {convertToCurrency(tokenBalance, solPrice)}
                              &nbsp;
                            </TableCell>
                            <TableCell>
                              <Tooltip
                                title="Your connected wallet's account balance"
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
                              <Typography style={{ whiteSpace: 'nowrap' }}>
                                <FontAwesomeIcon icon={faGasPump} />
                                &nbsp;&nbsp;GAS FEE:
                              </Typography>
                            </TableCell>
                            <TableCell style={{ textAlign: 'center' }}>
                              {gasfee.toFixed(6)} SOL
                            </TableCell>
                            <TableCell>
                              <Tooltip
                                title="Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
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
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="step-tag">Step 2 out of 4</p>
                    <div
                      className="account"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Typography style={{ whiteSpace: 'nowrap' }}>
                        CURRENCY TYPE
                      </Typography>
                       <TextField color="secondary" 
                        type="text"
                        variant="filled"
                        autoComplete="off"
                        value={currencyTo.toUpperCase()}
                        onChange={handleCurrencyChange}
                        error={!isValidCurrency}
                        helperText={!isValidCurrency ? 'Invalid currency' : ''}
                        className="form-control"
                      />
                      <Tooltip title="Enter the cryptocurrency to transfer">
                        <IconButton size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </div>

                    {suggestions.length > 0 && (
                      <ul style={suggestionsListStyle}>
                        {suggestions.map((suggestion) => (
                          <a key={suggestion}>
                            <li
                              onMouseEnter={() =>
                                handleSuggestionMouseEnter(suggestion)
                              }
                              onMouseLeave={handleSuggestionMouseLeave}
                              style={{
                                ...suggestionStyle,
                                backgroundColor:
                                  hoveredSuggestion === suggestion
                                    ? '#ffc107'
                                    : 'transparent',
                                color:
                                  hoveredSuggestion === suggestion
                                    ? '#060607'
                                    : '#212529',
                              }}
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              <Typography>{suggestion.toUpperCase()}</Typography>
                            </li>
                          </a>
                        ))}
                      </ul>
                    )}

                    {sendAddress && isValidCurrency ? (
                      <>
                        <p className="step-tag">Step 3 out of 4</p>
                        <div
                          className="account"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                          }}
                        >
                          <Typography style={{ whiteSpace: 'nowrap' }}>
                            DEPOSIT AMOUNT
                          </Typography>
                           <TextField color="secondary" 
                            pattern="^\\d*\\.?\\d*$"
                            type="text"
                            variant="outlined"
                            autoComplete="off"
                            style={{ pointerEvents: 'none' }}
                            value={sendAmount}
                            className="form-control"
                            InputProps={{
                              readOnly: true,
                              endAdornment: isValidCurrency && (
                                <Typography>{currencyTo.toUpperCase()}</Typography>
                              ),
                            }}
                          />
                          <Tooltip
                            title="Send this exact amount to the address below to receive your RPS within a few minutes."
                            arrow
                          >
                            <IconButton size="small">
                              <Info />
                            </IconButton>
                          </Tooltip>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                          <Typography variant="body2">PAYMENT ADDRESS</Typography>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                             <TextField color="secondary" 
                              variant="outlined"
                              fullWidth
                              value={sendAddress}
                              InputProps={{
                                readOnly: true,
                                endAdornment: (
                                  <Tooltip
                                    title={copied ? 'Copied!' : 'Copy to clipboard'}
                                    placement="top"
                                  >
                                    <IconButton
                                      onClick={() =>
                                        handleCopyToClipboard(sendAddress)
                                      }
                                    >
                                      <FileCopyIcon />
                                    </IconButton>
                                  </Tooltip>
                                ),
                              }}
                            />
                          </div>
                          {payinExtraId && (
                            <div style={{ marginTop: '20px' }}>
                              <Typography variant="body2">
                                MEMO / DESTINATION TAG ETC.
                              </Typography>
                              <div
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                 <TextField color="secondary" 
                                  variant="outlined"
                                  fullWidth
                                  value={payinExtraId}
                                  InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                      <Tooltip
                                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                                        placement="top"
                                      >
                                        <IconButton
                                          onClick={() =>
                                            handleCopyToClipboard(payinExtraId)
                                          }
                                        >
                                          <FileCopyIcon />
                                        </IconButton>
                                      </Tooltip>
                                    ),
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              background: '#f9f9f9',
                              width: 'min-content',
                              margin: '20px auto',
                              padding: '20px',
                              borderRadius: '0.3em',
                            }}
                          >
                            <QRCode value={sendAddress} />
                          </div>
                          <Typography
                            style={{ color: '#ff0000', textAlign: 'center' }}
                          >
                            DO NOT SEND ANY OTHER CRYPTOCURRENCY TYPE EXCEPT{' '}
                            {currencyTo.toUpperCase()}
                          </Typography>

                          <p className="step-tag">Step 4 out of 4</p>
                          <div
                            className="account"
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              width: '100%',
                              marginTop: '20px',
                            }}
                          >
                            <Typography>
                              CLICK 'I HAVE PAID' ONCE YOU HAVE SENT PAYMENT.
                            </Typography>
                            <div style={{ marginTop: '20px' }}>
                              <Typography variant="body2">
                                PAYMENT ID (FOR YOUR REFERENCE ONLY)
                              </Typography>
                              <div
                                style={{ display: 'flex', alignItems: 'center' }}
                              >
                                 <TextField color="secondary" 
                                  variant="outlined"
                                  fullWidth
                                  value={paymentId}
                                  InputProps={{
                                    readOnly: true,
                                    endAdornment: (
                                      <Tooltip
                                        title={copied ? 'Copied!' : 'Copy to clipboard'}
                                        placement="top"
                                      >
                                        <IconButton
                                          onClick={() =>
                                            handleCopyToClipboard(paymentId)
                                          }
                                        >
                                          <FileCopyIcon />
                                        </IconButton>
                                      </Tooltip>
                                    ),
                                  }}
                                />
                                <Tooltip title="This is your payment reference ID">
                                  <IconButton size="small">
                                    <Info />
                                  </IconButton>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          margin: '30px auto',
                        }}
                      >
                        <CircularProgress color="secondary" />
                      </div>
                    )}
                  </div>
                )}
                <div className="disclaimer">
                  <Typography>
                    {paymentMethod === 'web3'
                      ? 'RECEIVE WITHIN < 30 SECONDS'
                      : 'RECEIVE WITHIN 3 - 6 MINUTES'}
                  </Typography>
                </div>
              </div>
            </div>
          </div>

          {!isBlurred && (
            <div className="modal-footer">
              <Button
                className="btn-submit disabled"
                onClick={paymentMethod === 'web3' ? send : createPaymentAndClose}
              >
                {/* {paymentMethod === 'web3' ? 'Deposit' : 'I have paid'} */}
                COMING SOON! (INVITE ONLY)
              </Button>
              {/* <Button variant='contained' color='secondary' onClick={closeModal}>
                CANCEL
              </Button> */}
            </div>
          )}
        </div>
      </Modal >
    </>
  );
}

// -------------------- Styles for Suggestions (Dropdown) --------------------
const suggestionsListStyle = {
  listStyleType: 'none',
  padding: '0',
  margin: '4px 0',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#e5e5e5',
  position: 'absolute',
  maxHeight: '100px',
  overflowY: 'auto',
  zIndex: '1',
  width: 'calc(80% - 2px)',
};

const suggestionStyle = {
  padding: '8px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #ccc',
};

// -------------------- Redux --------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  gasfee: state.auth.gasfee,
  solPrice: state.logic.solPrice,
  user_id: state.auth.user._id,
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(DepositModal);