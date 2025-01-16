import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBolt,
  faGasPump,
  faTachometerAlt,
  faClock
} from '@fortawesome/free-solid-svg-icons';

import Modal from 'react-modal';
import {
  Button,
  TextField,
  Table,
  TableBody,
  TableRow,
  TableCell,
  IconButton,
  RadioGroup,
  Radio,
  InputAdornment,
  FormControlLabel,
  Icon,
  Tooltip,
  Typography
} from '@material-ui/core';
import { Warning, Info, Link, FiberManualRecord, AccountBalanceWallet } from '@material-ui/icons';
import QRCodeIcon from '@material-ui/icons/CropFreeOutlined';
import WalletIcon from '@material-ui/icons/AccountBalanceWallet';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { convertToCurrency } from '../../util/conversion';
import { withStyles } from '@material-ui/core/styles';
import { token } from '../../config/index.js';

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
  width: 'calc(80% - 2px)', // Adjusting width to match the text field
};

const suggestionStyle = {
  padding: '8px 12px',
  cursor: 'pointer',
  borderBottom: '1px solid #ccc',
};

const styles = (theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: theme.spacing(2),
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  },
  paymentMethodContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  radioLabel: {
    marginRight: theme.spacing(2),
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    color: (props) => (props.isDarkMode ? '#f9f9f9' : '#333'),
  },
  radioGroup: {
    flexDirection: 'row',
  },
  customButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    cursor: 'pointer',
    height: '100% !important',
    width: '100% !important',
    borderRadius: '0.3em',
    padding: '10px',
    marginLeft: '-15px !important',
    background: '#0076ff',
    '&:hover': {
      outline: '2px solid white',
    },
  },
  description: {
    marginTop: theme.spacing(2),
    textAlign: 'center',
    color: '#666',
  },
  price: {
    margin: theme.spacing(0.5),
    color: '#dfeeff',
    background: '#2e3fa1',
    padding: '2.5px 5px',
    border: '2px solid #c2e0ff',
    borderRadius: '30px',
    whiteSpace: 'nowrap',
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
    color: '#333',
  },
  radioInputChecked: {
    '&$radioInput': {
      outline: '2px solid white',
    },
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  radioInput: {
    display: 'none',
  },
  additionalText: {
    color: '#f9f9f9',
  },
});

function WithdrawModal(props) {
  const {
    classes,
    userInfo,
    isDarkMode,
    gasfee,
    solPrice,
    balance,       // from props, user's in-game token balance
    account,       // from props, user's connected wallet account
    modalIsOpen,
    closeModal,
    setBalance,
    setGasfee,
    addNewTransaction,
    getCustomerStatisticsData,
  } = props;

  // --------------------- Local States ---------------------
  const [userId, setUserId] = useState(userInfo._id);
  const [web2Amount, setWeb2Amount] = useState(balance);
  const [localBalance, setLocalBalance] = useState(balance);
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedAmount, setEstimatedAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('web3');
  const [extraId, setExtraId] = useState('');
  const [validAddress, setValidAddress] = useState(true);
  const [currencies, setCurrencies] = useState([]);
  const [currencyTo, setCurrencyTo] = useState('ltc');
  const [isValidCurrency, setIsValidCurrency] = useState(true);
  const [sendAddress, setSendAddress] = useState('');
  const [hoveredSuggestion, setHoveredSuggestion] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [amountToWithdraw, setAmountToWithdraw] = useState(0);

  // --------------------- Lifecycle: componentDidMount ---------------------
  useEffect(() => {
    const init = async () => {
      // Fetch user stats
      await getCustomerStatisticsData(userId);
      // Fetch supported currencies
      await handleGetPaymentMethods();
    };
    init();
    // eslint-disable-next-line
  }, []);

  // --------------------- Handlers & API Calls ---------------------
  const handleGetPaymentMethods = async () => {
    try {
      const response = await axios.get('/stripe/get_currencies');
      const fetchedCurrencies = response.data.currencies.map((c) => c.currency.toLowerCase());
      setCurrencies(fetchedCurrencies);
    } catch (error) {
      console.error('Error fetching deposit address:', error);
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
  };

  const handleSendAddress = (event) => {
    const value = event.target.value;
    setSendAddress(value);
    // Validate if currency is selected
    if (currencyTo) {
      validateAddress(value, currencyTo);
    }
  };

  const validateAddress = async (address, currency) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/stripe/validate_address', {
        sendAddress: address,
        currencyTo: currency,
      });
      setValidAddress(response.status === 200);
    } catch (error) {
      setValidAddress(false);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentMethodChange = (e) => {
    const selectedPaymentMethod = e.target.value;
    setPaymentMethod(selectedPaymentMethod);

    if (selectedPaymentMethod === 'web3') {
      // For demonstration, you might override currency to 'sol'
      setCurrencyTo('sol');
    }
  };

  const handleAmountChange = (e) => {
    e.preventDefault();
    const newAmount = Math.floor(e.target.value * 100) / 100;
    setAmountToWithdraw(newAmount);
    setWeb2Amount(newAmount - newAmount * 0.0088);

    // Prepare params for setting gas fee
    const params = {
      addressTo: account,
      amount: newAmount,
    };
    setGasfee(params);
    handleEstimateAmount(newAmount);
  };

  const handleExtraId = (e) => {
    setExtraId(e.target.value);
  };

  const setCurrency = (event) => {
    const value = event.target.value;
    const valid = currencies.includes(value.toLowerCase());
    const filteredSuggestions = currencies.filter((c) =>
      c.toLowerCase().startsWith(value.toLowerCase())
    );
    setCurrencyTo(value);
    setIsValidCurrency(valid);
    setSuggestions(filteredSuggestions);
  };

  const handleEstimateAmount = async (newAmount) => {
    try {
      if (!newAmount) return;

      let amountToSend = 0;
      if (paymentMethod === 'web2') {
        amountToSend = web2Amount;
      } else if (paymentMethod === 'web3') {
        amountToSend = newAmount;
      }

      if (amountToSend === 0) return;

      const response = await axios.get('/stripe/estimate_amount', {
        params: {
          web2Amount: amountToSend,
          currencyTo,
          token,
        },
      });
      const estAmt = response.data.estimated_amount - gasfee; 
      setEstimatedAmount(estAmt);
    } catch (error) {
      // console.error('Error in estimating amount:', error);
    }
  };

  const createPayoutAndClose = async () => {
    // Web2 Withdraw
    if (userInfo.dailyWithdrawals > 4.269) {
      alertModal(
        isDarkMode,
        `EXCEEDED DAILY WITHDRAWAL LIMIT, TRY AGAIN TOMORROW! (WITHDRAWAL LIMITS DURING LAUNCH PHASE ONLY)`
      );
      return;
    }
    if (amountToWithdraw <= 0) {
      alertModal(isDarkMode, `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`);
      return;
    }
    if (amountToWithdraw >= 4.269) {
      alertModal(isDarkMode, `MAXIMUM PER DAY IS 4.269 SOL DURING LAUNCH PHASE`);
      return;
    }
    if (amountToWithdraw > balance) {
      alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return;
    }

    try {
      setIsLoading(true);
      const response = await axios.post('/stripe/create_payout', {
        amount: amountToWithdraw,
        currency: currencyTo,
        address: sendAddress,
        extra_id: extraId,
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
      alertModal(isDarkMode, 'Something went wrong, try again later.');
      console.error(error);
    }
  };

  const send = async () => {
    // Web3 Withdraw
    if (userInfo.dailyWithdrawals > 4.269) {
      alertModal(
        isDarkMode,
        `EXCEEDED DAILY WITHDRAWAL LIMIT, TRY AGAIN TOMORROW! (WITHDRAWAL LIMITS DURING LAUNCH PHASE ONLY)`
      );
      return;
    }
    if (amountToWithdraw <= 0) {
      alertModal(isDarkMode, `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`);
      return;
    }
    if (amountToWithdraw >= 4.269) {
      alertModal(isDarkMode, `MAXIMUM PER DAY IS 4.269 SOL DURING LAUNCH PHASE`);
      return;
    }
    if (amountToWithdraw > balance) {
      alertModal(isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return;
    }

    try {
      setIsLoading(true);
      const result = await axios.post('/stripe/withdraw_request/', {
        amount: amountToWithdraw,
        addressTo: account,
      });

      if (result.data.success) {
        alertModal(isDarkMode, result.data.message, '-cat');
        setBalance(result.data.balance);
        addNewTransaction(result.data.newTransaction);
        setIsLoading(false);
        // Optionally close modal after success
        // closeModal();
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

  // --------------------- Rendering ---------------------
  const isConnected = !!account;
  let description = '';

  switch (paymentMethod) {
    case 'web2':
      description = 'Via Manual Transfer (50+ Cryptocurrencies supported)';
      break;
    case 'web3':
      description = 'Via Connect Wallet (Phantom Wallet recommended), SOL only, lowest fees';
      break;
    default:
      description = '';
  }

  const disclaimerClass = paymentMethod === 'web2' ? 'disclaimer-web2' : 'disclaimer-web3';

  // Decide which icon to show in the disclaimer (web2 => 12 hours, web3 => 30 seconds)
  let icon = paymentMethod === 'web2' ? (
    <FontAwesomeIcon icon={faClock} />
  ) : (
    <FontAwesomeIcon icon={faTachometerAlt} />
  );

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
        contentLabel="Withdrawal Modal"
      >
        <div className={isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-header">
            <h2 className="modal-title title">
              <Icon component={AccountBalanceWallet} className="mr-2" />
              WITHDRAW
            </h2>
            <Button className="btn-close title" onClick={closeModal}>
              ×
            </Button>
          </div>
          <div className="modal-body edit-modal-body deposit-modal-body">
            <div className="modal-content-wrapper">
              <div className="modal-content-panel">
                {/* Payment Method Selection */}
                <div className={classes.root}>
                  <h4 className={classes.radioLabel}>Select Withdrawal Method:</h4>
                  <div className={classes.paymentMethodContainer}>
                    <RadioGroup
                      aria-label="payment-method"
                      name="payment-method"
                      value={paymentMethod}
                      onChange={handlePaymentMethodChange}
                      className={classes.radioGroup}
                    >
                      <FormControlLabel
                        value="web3"
                        control={<Radio color="primary" />}
                        label={
                          <div
                            className={classes.labelContainer}
                            style={{ position: 'relative' }}
                          >
                            <WalletIcon className={classes.icon} />
                            <span>SOL</span>
                            {paymentMethod === 'web3' && (
                              <span
                                className="roll-tag"
                                style={{
                                  position: 'absolute',
                                  transform: 'translateY(30px)',
                                  filter: 'invert(1)',
                                  letterSpacing: '0.1em',
                                }}
                              >
                                INSTANT&nbsp;
                                <FontAwesomeIcon
                                  icon={faBolt}
                                  style={{ marginLeft: '0.2em' }}
                                />
                              </span>
                            )}
                          </div>
                        }
                        className={classes.radioLabel}
                      />
                      <FormControlLabel
                        value="web2"
                        control={<Radio color="primary" />}
                        label={
                          <div className={classes.labelContainer}>
                            <QRCodeIcon className={classes.icon} />
                            <span>Web2</span>
                          </div>
                        }
                        className={classes.radioLabel}
                      />
                    </RadioGroup>
                  </div>
                  <Typography variant="body2" className={classes.description}>
                    {description}
                  </Typography>
                </div>
                {/* Payment Method-Specific Fields */}
                {paymentMethod === 'web3' ? (
                  <>
                    <p className="step-tag">Step 1 out of 2</p>
                    <div className="input-amount">
                      <Typography>WITHDRAWAL AMOUNT</Typography>
                      <TextField
                        pattern="^\\d*\\.?\\d*$"
                        variant="filled"
                        autoComplete="off"
                        value={amountToWithdraw}
                        onChange={handleAmountChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">&nbsp;RPS</InputAdornment>
                          ),
                        }}
                        className="form-control"
                      />
                    </div>
                    <div className="account">
                      <p className="step-tag">Step 2 out of 2</p>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2">SEND TO ADDRESS</Typography>
                        {isConnected ? (
                          <TextField
                            label="Account"
                            variant="filled"
                            style={{ width: '100%' }}
                            value={account}
                            InputProps={{
                              readOnly: true,
                            }}
                            className="form-control"
                          />
                        ) : (
                          <TextField
                            label="Account"
                            variant="filled"
                            style={{ width: '100%' }}
                            value="Connect Wallet"
                            InputProps={{
                              readOnly: true,
                            }}
                            className="form-control"
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
                            <Info />
                          </Tooltip>
                        ) : (
                          <Tooltip title="How do I connect?" arrow>
                            <a
                              href="your_connect_wallet_link_here"
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                textDecoration: 'none',
                              }}
                            >
                              <Info />
                              <Link fontSize="small" style={{ marginLeft: '4px' }} />
                            </a>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="step-tag">Step 1 out of 3</p>
                    <div
                      className="account"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <Typography style={{ whiteSpace: 'nowrap' }}>
                        CURRENCY TYPE
                      </Typography>
                      <TextField
                        type="text"
                        variant="filled"
                        autoComplete="off"
                        value={currencyTo.toUpperCase()}
                        onChange={setCurrency}
                        error={!isValidCurrency}
                        helperText={!isValidCurrency ? 'Invalid currency' : ''}
                        className="form-control"
                      />
                      <Tooltip title="Choose currency you want to receive in.">
                        <IconButton color="inherit" size="small">
                          <Info />
                        </IconButton>
                      </Tooltip>
                    </div>
                    {suggestions.length > 0 && (
                      <ul style={suggestionsListStyle}>
                        {suggestions.map((suggestion) => (
                          <a key={suggestion}>
                            <li
                              onMouseEnter={() => handleSuggestionMouseEnter(suggestion)}
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
                    <p className="step-tag">Step 2 out of 3</p>
                    <div className="input-amount">
                      <Typography>WITHDRAWAL AMOUNT</Typography>
                      <TextField
                        pattern="^\\d*\\.?\\d*$"
                        variant="filled"
                        autoComplete="off"
                        value={amountToWithdraw}
                        onChange={handleAmountChange}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">&nbsp;RPS</InputAdornment>
                          ),
                        }}
                        className="form-control"
                      />
                    </div>
                    <div className="input-amount">
                      <Typography>RECEIVE AMOUNT</Typography>
                      <TextField
                        variant="outlined"
                        value={estimatedAmount}
                        InputProps={{
                          readOnly: true,
                          endAdornment: isValidCurrency && (
                            <InputAdornment position="end">
                              <Typography variant="body2" component="span">
                                {currencyTo.toUpperCase()}
                              </Typography>
                            </InputAdornment>
                          ),
                        }}
                        className="form-control"
                      />
                    </div>
                    <p className="step-tag">Step 3 out of 3</p>
                    <div style={{ marginTop: '20px' }}>
                      <Typography variant="body2">SEND TO ADDRESS</Typography>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          variant="filled"
                          fullWidth
                          error={!validAddress}
                          onChange={handleSendAddress}
                          value={sendAddress}
                          helperText={
                            sendAddress
                              ? !validAddress
                                ? 'Invalid address'
                                : (
                                  <p style={{ color: '#28a745' }}>
                                    Valid address!
                                    <CheckCircleOutlineIcon style={{ width: '12px' }} />
                                  </p>
                                )
                              : ''
                          }
                        />
                        <Tooltip title="Address to send to" arrow>
                          <IconButton size="small">
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </div>
                      <div style={{ marginTop: '20px' }}>
                        <Typography variant="body2">
                          MEMO / DESTINATION TAG ETC. (OPTIONAL)
                        </Typography>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <TextField
                            variant="filled"
                            fullWidth
                            value={extraId}
                            onChange={handleExtraId}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <hr />
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <span>IN-GAME BALANCE:</span>
                      </TableCell>
                      <TableCell>{convertToCurrency(balance, solPrice)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <span>WITHDRAWAL AMOUNT:</span>
                      </TableCell>
                      <TableCell style={{ color: 'red' }}>
                        {convertToCurrency(amountToWithdraw * -1, solPrice)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <span>NEW BALANCE:</span>
                      </TableCell>
                      <TableCell>
                        {convertToCurrency(balance - amountToWithdraw, solPrice)}&nbsp;
                        {balance - amountToWithdraw < 0 && <Warning width="15pt" />}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                {paymentMethod === 'web3' && (
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <FontAwesomeIcon icon={faGasPump} />
                          &nbsp;&nbsp;<span>GAS FEE:</span>
                        </TableCell>
                        <TableCell>{gasfee} SOL</TableCell>
                        <TableCell>
                          <Tooltip
                            title="Real-time Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
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
                <div className={'disclaimer'}>
                  {paymentMethod === 'web2' ? (
                    <Typography className={disclaimerClass}>
                      Receive within <i style={{ fontWeight: 800 }}>12</i> hours&nbsp;{icon}
                    </Typography>
                  ) : (
                    <Typography className={disclaimerClass}>
                      Receive within <i style={{ fontWeight: 800 }}>30</i> seconds&nbsp;{icon}
                    </Typography>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Modal Footer */}
          <div className="modal-footer">
            <Button
              className="btn-submit"
              onClick={paymentMethod === 'web3' ? send : createPayoutAndClose}
            >
              {/* COMING SOON! (INVITE ONLY) or 'Withdraw' */}
              COMING SOON! (INVITE ONLY)
            </Button>
            {/* <Button className="btn-back" onClick={closeModal}>
              CANCEL
            </Button> */}
          </div>
        </div>
      </Modal>
    </>
  );
}

// --------------------- Redux Connections ---------------------
const mapStateToProps = (state) => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  gasfee: state.auth.gasfee,
  solPrice: state.logic.solPrice,
  balance: state.auth.user.balance,
  account: state.auth.user.account, // Make sure your store provides this if needed
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction,
  getCustomerStatisticsData,
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(withStyles(styles)(WithdrawModal));