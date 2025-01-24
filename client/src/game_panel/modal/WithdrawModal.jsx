import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
import {
  setBalance,
  setGasfee
} from '../../redux/Auth/user.actions';
import {
  addNewTransaction
} from '../../redux/Logic/logic.actions';
import {
  getCustomerStatisticsData
} from '../../redux/Customer/customer.action';

import {
  Box,
  Modal,
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  RadioGroup,
  FormControlLabel,
  Radio,
  InputAdornment,
  Tooltip,
  IconButton,
  Typography
} from '@mui/material';

import {
  Warning,
  Info,
  Link,
  FiberManualRecord,
  AccountBalanceWallet,
  CheckCircleOutline as CheckCircleOutlineIcon
} from '@mui/icons-material';

import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import QRCodeIcon from '@mui/icons-material/CropFreeOutlined';
import WalletIcon from '@mui/icons-material/AccountBalanceWallet';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faGasPump,
  faTachometerAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';

const token = 'BBDULAQQBG1UYBK9ay7hSf1Arfhme4jnugxwzjbipump';

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
    setBalance,
    setGasfee,
    addNewTransaction,
    getCustomerStatisticsData
  } = props;

  // ----------------- LOCAL STATE -----------------
  const [amountToWithdraw, setAmountToWithdraw] = useState(0);
  const [web2Amount, setWeb2Amount] = useState(balance);
  const [paymentMethod, setPaymentMethod] = useState('web3');
  const [extraId, setExtraId] = useState('');
  const [validAddress, setValidAddress] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [currencyTo, setCurrencyTo] = useState('ltc');
  const [isValidCurrency, setIsValidCurrency] = useState(true);
  const [sendAddress, setSendAddress] = useState('');
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // ----------------- EFFECTS -----------------
  useEffect(() => {
    async function init() {
      // Fetch stats and currencies on mount
      await getCustomerStatisticsData(userInfo._id);
      await handleGetPaymentMethods();
    }
    init();
    // eslint-disable-next-line
  }, []);

  // ----------------- HANDLERS & API CALLS -----------------
  const handleGetPaymentMethods = async () => {
    try {
      const response = await axios.get('/stripe/get_currencies');
      const fetchedCurrencies = response.data.currencies.map((c) =>
        c.currency.toLowerCase()
      );
      setCurrencies(fetchedCurrencies);
    } catch (error) {
      console.error('Error fetching currencies:', error);
    }
  };

  const handlePaymentMethodChange = (e) => {
    const selected = e.target.value;
    setPaymentMethod(selected);
    if (selected === 'web3') {
      // Force "sol" if user picks web3
      setCurrencyTo('sol');
    }
  };

  const setCurrency = (e) => {
    const value = e.target.value;
    const valid = currencies.includes(value.toLowerCase());
    const filtered = currencies.filter((c) =>
      c.toLowerCase().startsWith(value.toLowerCase())
    );
    setCurrencyTo(value);
    setIsValidCurrency(valid);
    setSuggestions(filtered);
  };

  const handleSuggestionMouseEnter = (suggestion) => setHoveredSuggestion(suggestion);
  const handleSuggestionMouseLeave = () => setHoveredSuggestion(null);

  const handleSuggestionClick = (suggestion) => {
    setCurrencyTo(suggestion);
    setSuggestions([]);
    setIsValidCurrency(true);
  };

  const handleSendAddress = (e) => {
    const val = e.target.value;
    setSendAddress(val);
    if (currencyTo) {
      validateAddress(val, currencyTo);
    }
  };

  const validateAddress = async (addr, currency) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/stripe/validate_address', {
        sendAddress: addr,
        currencyTo: currency
      });
      setValidAddress(response.status === 200);
    } catch (error) {
      setValidAddress(false);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtraId = (e) => setExtraId(e.target.value);

  const handleAmountChange = (e) => {
    const val = Math.floor(e.target.value * 100) / 100;
    setAmountToWithdraw(val);
    setWeb2Amount(val - val * 0.0088);

    const params = { addressTo: account, amount: val };
    setGasfee(params);

    handleEstimateAmount(val);
  };

  const handleEstimateAmount = async (amt) => {
    try {
      if (!amt) return;
      let amountToSend = 0;
      if (paymentMethod === 'web2') {
        amountToSend = web2Amount;
      } else if (paymentMethod === 'web3') {
        amountToSend = amt;
      }
      if (amountToSend === 0) return;

      const response = await axios.get('/stripe/estimate_amount', {
        params: {
          web2Amount: amountToSend,
          currencyTo,
          token
        }
      });
      const estAmt = response.data.estimated_amount - gasfee;
      setEstimatedAmount(estAmt);
    } catch (error) {
      console.error('Error estimating amount:', error);
    }
  };

  // ----------------- WITHDRAW HANDLERS (WEB2 / WEB3) -----------------
  const createPayoutAndClose = async () => {
    // Daily, max, balance checks
    if (userInfo.dailyWithdrawals > 4.269) {
      alertModal(isDarkMode, 'EXCEEDED DAILY WITHDRAWAL LIMIT! (LAUNCH PHASE)');
      return;
    }
    if (amountToWithdraw <= 0) {
      alertModal(isDarkMode, 'ENTER A VALID NUMBER!');
      return;
    }
    if (amountToWithdraw >= 4.269) {
      alertModal(isDarkMode, 'MAX PER DAY IS 4.269 SOL DURING LAUNCH PHASE');
      return;
    }
    if (amountToWithdraw > balance) {
      alertModal(isDarkMode, 'NOT ENUFF FUNDS');
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/stripe/create_payout', {
        amount: amountToWithdraw,
        currency: currencyTo,
        address: sendAddress,
        extra_id: extraId
      });

      if (response.data.success) {
        setBalance(response.data.balance);
        addNewTransaction(response.data.newTransaction);
        setIsLoading(false);
        closeModal();
        alertModal(isDarkMode, response.data.message, '-cat');
      } else {
        setIsLoading(false);
        alertModal(isDarkMode, response.data.message);
      }
    } catch (error) {
      setIsLoading(false);
      alertModal(isDarkMode, 'Something went wrong.');
      console.error(error);
    }
  };

  const send = async () => {
    // Web3
    if (userInfo.dailyWithdrawals > 4.269) {
      alertModal(isDarkMode, 'EXCEEDED DAILY WITHDRAWAL LIMIT! (LAUNCH PHASE)');
      return;
    }
    if (amountToWithdraw <= 0) {
      alertModal(isDarkMode, 'ENTER A VALID NUMBER!');
      return;
    }
    if (amountToWithdraw >= 4.269) {
      alertModal(isDarkMode, 'MAX PER DAY IS 4.269 SOL DURING LAUNCH PHASE');
      return;
    }
    if (amountToWithdraw > balance) {
      alertModal(isDarkMode, 'NOT ENUFF FUNDS');
      return;
    }

    try {
      setIsLoading(true);
      const result = await axios.post('/stripe/withdraw_request/', {
        amount: amountToWithdraw,
        addressTo: account
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        setBalance(result.data.balance);
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        // closeModal(); // Optional if you want to close after success
      } else {
        setIsLoading(false);
        alertModal(isDarkMode, result.data.message);
      }
    } catch (error) {
      setIsLoading(false);
      alertModal(isDarkMode, 'FAILED TRANSACTION');
      console.error(error);
    }
  };

  // ----------------- RENDERING -----------------
  const isConnected = !!account;
  let description = paymentMethod === 'web2'
    ? 'Via Manual Transfer (50+ Cryptocurrencies supported)'
    : 'Via Connect Wallet (Phantom recommended), SOL only, lowest fees';

  const modalBoxStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    bgcolor: '#1f1a25', // Same purple background
    color: '#fff',
    boxShadow: 24,
    borderRadius: 1,
    p: 3,
    width: 500,
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto'
  };

  // Suggestions style for currency input
  const suggestionsListStyle = {
    position: 'absolute',
    backgroundColor: '#fff',
    zIndex: 9999,
    listStyle: 'none',
    margin: 0,
    padding: '0.5rem',
    border: '1px solid #ddd',
    width: '100%'
  };

  const suggestionStyle = {
    padding: '0.3rem',
    cursor: 'pointer'
  };

  // Icon for disclaimers
  const icon = paymentMethod === 'web2'
    ? <FontAwesomeIcon icon={faClock} />
    : <FontAwesomeIcon icon={faTachometerAlt} />;

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
            zIndex: isLoading ? 3000 : 0
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography
              variant="h6"
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}
            >
              <AccountBalanceWallet sx={{ mr: 1 }} />
              WITHDRAW
            </Typography>
            <Button variant="text" color="error" onClick={closeModal}>
              X
            </Button>
          </Box>

          {/* BODY */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Payment Method Section */}
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                Select Withdrawal Method:
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
                            transform: 'translateY(0.2rem)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#fff'
                          }}
                        >
                          INSTANT&nbsp;
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
                      <Typography component="span">Web2</Typography>
                    </Box>
                  }
                />
              </RadioGroup>
              <Typography variant="body2" sx={{ mt: 1, color: '#ccc' }}>
                {description}
              </Typography>
            </Box>

            {/* Payment Method-Specific Fields */}
            {paymentMethod === 'web3' ? (
              // WEB3
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Step 1 of 2
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography>WITHDRAWAL AMOUNT</Typography>
                  <TextField
                    color="secondary"
                    variant="filled"
                    type="number"
                    value={amountToWithdraw}
                    onChange={handleAmountChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          RPS
                        </InputAdornment>
                      )
                    }}
                    sx={{ mt: 1, width: '100%' }}
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Step 2 of 2
                </Typography>
                <Box>
                  <Typography variant="body2">SEND TO ADDRESS</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField
                      color="secondary"
                      variant="filled"
                      fullWidth
                      value={isConnected ? account : 'Connect Wallet'}
                      InputProps={{
                        readOnly: true
                      }}
                    />
                    <FiberManualRecord
                      sx={{
                        color: isConnected ? 'green' : 'red',
                        fontSize: '1rem'
                      }}
                    />
                    <Tooltip title={isConnected ? 'Connected' : 'How do I connect?'} arrow>
                      <IconButton
                        href={isConnected ? undefined : 'your_connect_wallet_link_here'}
                        target={isConnected ? undefined : '_blank'}
                        rel="noopener noreferrer"
                        size="small"
                      >
                        <Info fontSize="small" />
                        {!isConnected && (
                          <Link fontSize="small" sx={{ ml: 0.5 }} />
                        )}
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </>
            ) : (
              // WEB2
              <>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                  Step 1 of 3
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ whiteSpace: 'nowrap' }}>CURRENCY TYPE</Typography>
                  <TextField
                    color="secondary"
                    variant="filled"
                    value={currencyTo.toUpperCase()}
                    onChange={setCurrency}
                    error={!isValidCurrency}
                    helperText={!isValidCurrency ? 'Invalid currency' : ''}
                  />
                  <Tooltip title="Choose currency you want to receive in.">
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
                        onMouseEnter={() => handleSuggestionMouseEnter(suggestion)}
                        onMouseLeave={handleSuggestionMouseLeave}
                        onClick={() => handleSuggestionClick(suggestion)}
                        sx={{
                          ...suggestionStyle,
                          backgroundColor:
                            hoveredSuggestion === suggestion
                              ? '#ffc107'
                              : 'transparent',
                          color:
                            hoveredSuggestion === suggestion
                              ? '#060607'
                              : '#212529'
                        }}
                      >
                        <Typography>{suggestion.toUpperCase()}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                  Step 2 of 3
                </Typography>
                <Box>
                  <Typography>WITHDRAWAL AMOUNT</Typography>
                  <TextField
                    color="secondary"
                    variant="filled"
                    type="number"
                    value={amountToWithdraw}
                    onChange={handleAmountChange}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          RPS
                        </InputAdornment>
                      )
                    }}
                    sx={{ mt: 1, width: '100%' }}
                  />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography>RECEIVE AMOUNT</Typography>
                  <TextField
                    color="secondary"
                    variant="outlined"
                    value={estimatedAmount}
                    InputProps={{
                      readOnly: true,
                      endAdornment: isValidCurrency && (
                        <InputAdornment position="end">
                          <Typography variant="body2">
                            {currencyTo.toUpperCase()}
                          </Typography>
                        </InputAdornment>
                      )
                    }}
                    sx={{ mt: 1, width: '100%' }}
                  />
                </Box>

                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 2 }}>
                  Step 3 of 3
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">SEND TO ADDRESS</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <TextField
                      color="secondary"
                      variant="filled"
                      fullWidth
                      value={sendAddress}
                      onChange={handleSendAddress}
                      error={!validAddress}
                      helperText={
                        sendAddress
                          ? (!validAddress
                            ? 'Invalid address'
                            : (
                              <Typography
                                component="span"
                                sx={{ color: '#28a745', display: 'flex', alignItems: 'center' }}
                              >
                                Valid address!
                                <CheckCircleOutlineIcon sx={{ ml: 0.5, fontSize: '1rem' }} />
                              </Typography>
                            )
                          )
                          : ''
                      }
                    />
                    <Tooltip title="Address to send to" arrow>
                      <IconButton size="small">
                        <Info />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    MEMO / DESTINATION TAG ETC. (OPTIONAL)
                  </Typography>
                  <TextField
                    color="secondary"
                    variant="filled"
                    fullWidth
                    value={extraId}
                    onChange={handleExtraId}
                    sx={{ mt: 1 }}
                  />
                </Box>
              </>
            )}

            {/* BALANCE / FEE TABLE */}
            <Box sx={{ mt: 2 }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell>IN-GAME BALANCE:</TableCell>
                    <TableCell>{convertToCurrency(balance, solPrice)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>WITHDRAWAL AMOUNT:</TableCell>
                    <TableCell sx={{ color: 'red' }}>
                      {convertToCurrency(amountToWithdraw * -1, solPrice)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>NEW BALANCE:</TableCell>
                    <TableCell>
                      {convertToCurrency(balance - amountToWithdraw, solPrice)}{' '}
                      {balance - amountToWithdraw < 0 && <Warning fontSize="small" />}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              {paymentMethod === 'web3' && (
                <Table size="small" sx={{ mt: 2 }}>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <FontAwesomeIcon icon={faGasPump} />
                        &nbsp;GAS FEE:
                      </TableCell>
                      <TableCell>{gasfee} SOL</TableCell>
                      <TableCell>
                        <Tooltip
                          title="Real-time Gas fee covers network processing & validation."
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
              )}
            </Box>

            {/* DISCLAIMER */}
            <Box sx={{ mt: 2 }}>
              {paymentMethod === 'web2' ? (
                <Typography variant="body2">
                  Receive within <strong>12</strong> hours&nbsp;{icon}
                </Typography>
              ) : (
                <Typography variant="body2">
                  Receive within <strong>30</strong> seconds&nbsp;{icon}
                </Typography>
              )}
            </Box>
          </Box>

          {/* FOOTER */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
            <Button
              variant="contained"
              color="error"
              onClick={paymentMethod === 'web3' ? send : createPayoutAndClose}
            >
              COMING SOON! (INVITE ONLY)
            </Button>
            {/* 
              If you want a cancel button, uncomment below:
              <Button variant="contained" color="secondary" onClick={closeModal} sx={{ ml: 2 }}>
                CANCEL
              </Button> 
            */}
          </Box>
        </Box>
      </Modal>
    </>
  );
}

// ----------------- REDUX CONNECTION -----------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  gasfee: state.auth.gasfee,
  solPrice: state.logic.solPrice,
  balance: state.auth.user.balance,
  account: state.auth.user.account
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction,
  getCustomerStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(WithdrawModal);