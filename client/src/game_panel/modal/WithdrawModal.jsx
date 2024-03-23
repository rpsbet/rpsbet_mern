import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faGasPump
} from '@fortawesome/free-solid-svg-icons';
import { getCustomerStatisticsData } from '../../redux/Customer/customer.action';
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
import { convertToEth } from '../../util/eth_conversion';
import { convertToCurrency } from '../../util/conversion';
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({
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
      outline: '2px solid white', // Add a white solid outline on hover
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
    whiteSpace: 'nowrap'
  },
  labelContainer: {
    display: 'flex',
    alignItems: 'center',
  },
  radioInputChecked: {
    '&$radioInput': {
      outline: '2px solid white', // Add a white solid outline when radio is checked
    },
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  radioInput: {
    display: 'none', // Hide the actual radio buttons
  },
  additionalText: {
    color: '#f9f9f9',
  },
});

Modal.setAppElement('#root');

const customStyles = {
  overlay: {
    zIndex: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent'
  }
};

class WithdrawModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      _id: this.props.userInfo._id,
      amount: 0,
      web2Amount: 0,
      web3Amount: 0,
      web3: props.web3,
      balance: props.balance,
      account: props.account,
      isLoading: false,
      estimatedAmount: 0,
      totalWagered: 0,
      deposit: 0,
      paymentMethod: 'web2',
      extraId: '',
      validAddress: true,
      currencies: [],
      currencyTo: 'ltc',
      isValidCurrency: true,
      sendAddress: '',
      hoveredSuggestion: null,
      suggestions: [],
      amount: 0,
      balance: 0,
    };
  }

  async componentDidMount() {
    const result = await this.props.getCustomerStatisticsData(this.state._id);
    await this.handleGetPaymentMethods();
    this.setState({
      ...result
    });

    const params = { addressTo: this.state.account };
    this.props.setGasfee(params);
  }

  handleSuggestionMouseEnter = suggestion => {
    this.setState({
      hoveredSuggestion: suggestion,
    });
  };
  handleSendAddress = (event) => {

    this.setState({
      sendAddress: event.target.value
    }, () => {
      this.validateAddress();
    });
  };

  validateAddress = async () => {
    const { sendAddress, currencyTo } = this.state;

    this.setState({ loading: true });

    try {
      const response = await axios.post('/stripe/validate_address', { sendAddress, currencyTo });

      console.log('response:', response.status);

      this.setState({
        validAddress: response.status === 200 ? true : false,
      });

    } catch (error) {
      this.setState({
        validAddress: false,
      });
      console.error(error);
      // Handle error
    } finally {
      // Reset loading state to false whether the request succeeds or fails
      this.setState({ loading: false });
    }
  };


  handleSuggestionMouseLeave = () => {
    this.setState({
      hoveredSuggestion: null,
    });
  };

  handleSuggestionClick = suggestion => {
    this.setState({
      currencyTo: suggestion,
      suggestions: [],
      isValidCurrency: true
    });
  };

  setCurrencyTo = event => {
    const { sendAddress } = this.state;
    const { value } = event.target;
    const isValidCurrency = this.state.currencies.includes(value.toLowerCase());
    const suggestions = this.state.currencies.filter(currency =>
      currency.toLowerCase().startsWith(value.toLowerCase())
    );
    this.setState({
      currencyTo: value,
      isValidCurrency,
      suggestions,
      loading: true
    }, () => {
      if (isValidCurrency && sendAddress !== '') {
        this.validateAddress();
      }
    });
  };

  handlePaymentMethodChange = event => {
    const selectedPaymentMethod = event.target.value;
    const isWeb3Payment = selectedPaymentMethod === "web3";
  
    // If the payment method is switching to Web3, set currencyTo state to 'eth'
    if (isWeb3Payment) {
      this.setState({
        paymentMethod: selectedPaymentMethod,
        currencyTo: 'eth'
      });
    } else {
      // Otherwise, set only the paymentMethod state
      this.setState({
        paymentMethod: selectedPaymentMethod
      });
    }

    this.handleEstimateAmount();
  };
  

  handleAmountChange = e => {
    e.preventDefault();
    const amount = e.target.value;
    this.setState({
      amount: amount,
      web2Amount: amount * 0.59,
      web3Amount: amount * 0.5
    }, () => {
      this.handleEstimateAmount();
    });
  };

  handleExtraId = e => {
    e.preventDefault();
    const _id = e.target.value;
    this.setState({
      extraId: _id,
    });
  };

  handleGetPaymentMethods = async () => {
    try {
      const response = await axios.get('/stripe/get_currencies');
      const currencies = response.data.currencies.map(currency => currency.currency.toLowerCase());
      this.setState({ currencies });
    } catch (error) {
      console.error('Error in generating deposit address:', error);
      // Handle error
    }
  };

  handleEstimateAmount = async () => {
    try {
      const { paymentMethod, web2Amount, web3Amount, currencyTo } = this.state;
      let amountToSend;
  
      // Determine which amount to use based on the payment method
      if (paymentMethod === 'web2') {
        amountToSend = web2Amount;
      } else if (paymentMethod === 'web3') {
        amountToSend = web3Amount - this.props.gasfee;
      } else {
        // Handle unexpected payment methods
        throw new Error('Unsupported payment method');
      }
  
      if (amountToSend === 0) {
        return;
      }
      // Make GET request to estimate the amount
      const response = await axios.get('/stripe/estimate_amount', {
        params: {
          web2Amount: amountToSend,
          currencyTo: currencyTo,
        },
      });
  
      // Extract the estimated amount from the response data
      const estimatedAmount = response.data.estimated_amount;
  
      // Update the component state with the estimated amount
      this.setState({ estimatedAmount });
    } catch (error) {
      console.error('Error in estimating amount:', error);
      // Handle error
    }
  };
  
  createPayoutAndClose = async () => {
    const { amount, currencyTo, sendAddress, extraId} = this.state;
    const { user_id } = this.props;
    try {
      const response = await axios.post('/stripe/create_payout', { amount, currency: currencyTo, address: sendAddress, extra_id: extraId });
      alertModal(this.props.isDarkMode, response.data.message, "-cat");
      this.props.closeModal();
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };


  send = async () => {
    try {
      if (this.props.userInfo.dailyWithdrawals > 0.02) {
        alertModal(
          this.props.isDarkMode,
          `EXCEEDED DAILY WITHDRAWAL LIMIT, TRY AGAIN TOMORROW! (WITHDRAWAL LIMITS DURING LAUNCH PHASE ONLY)`
        );
        return;
      }
      if (this.state.amount <= 0) {
        alertModal(
          this.props.isDarkMode,
          `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`
        );
        return;
      }
      if (this.state.amount >= 0.02) {
        alertModal(
          this.props.isDarkMode,
          `MAXIMUM PER TRANSACTION IS 0.02 RPS DURING LAUNCH PHASE`
        );
        return;
      }

      if (this.state.amount > this.props.balance) {
        alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
        return;
      }

      this.setState({ isLoading: true });
      const result = await axios.post('/stripe/withdraw_request/', {
        amount: this.state.amount,
        addressTo: this.state.account
      });

      if (result.data.success) {
        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        this.setState({ isLoading: false });
        this.props.closeModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(this.props.isDarkMode, result.data.message);
      }
    } catch (e) {
      this.setState({ isLoading: false });
      if (this.state.amount <= 0) {
        alertModal(this.props.isDarkMode, `Failed transaction.`);
        return;
      }
    }
  };

  render() {
    const { account, currencyTo, isValidCurrency, extraId, amount, validAddress, estimatedAmount, sendAddress, suggestions, hoveredSuggestion, paymentMethod } = this.state;
    const { classes } = this.props;
    const isConnected = !!account;

    let description = '';

    switch (paymentMethod) {
      case 'web2':
        description = 'Via Manual Transfer (50+ Cryptocurrencies supported)';
        break;
      case 'web3':
        description = 'Via Connect Wallet (Metamask recommended), ETH MAINNET only, lowest fees';
        break;
      default:
        description = '';
    }


    return (
      <>
        <LoadingOverlay
          active={true}
          spinner
          text="Creating Block..."
          styles={{
            wrapper: {
              position: 'fixed',
              width: '100%',
              height: '100vh',
              zIndex: this.state.isLoading ? 999 : 0
            }
          }}
        />
        <Modal
          isOpen={this.props.modalIsOpen}
          onRequestClose={this.props.closeModal}
          style={customStyles}
          contentLabel="Deposit Modal"
          account={this.state.web3account}
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">  <Icon component={AccountBalanceWallet} className="mr-2" /> {/* Withdraw icon */}
                WITHDRAW</h2>
              <Button className="btn-close" onClick={this.props.closeModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body deposit-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className={classes.root}>
                    <h4 className={classes.radioLabel}>Select Withdrawal Method:</h4>
                    <div className={classes.paymentMethodContainer}>

                      <RadioGroup
                        aria-label="payment-method"
                        name="payment-method"
                        value={paymentMethod}
                        onChange={this.handlePaymentMethodChange}
                        className={classes.radioGroup}
                      >
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
                        <FormControlLabel
                          value="web3"
                          control={<Radio color="primary" />}
                          label={
                            <div className={classes.labelContainer}>
                              <WalletIcon className={classes.icon} />
                              <span>Web3</span>
                            </div>
                          }
                          className={classes.radioLabel}
                        />

                      </RadioGroup>
                    </div>
                    <Typography variant="body2" className={classes.description}>{description}</Typography>
                  </div>
                  {paymentMethod === 'web3' ? (
                    <>
                    <p className='step-tag'>Step 1 out of 2</p>
                      <div className="input-amount">
                        <Typography>WITHDRAWAL AMOUNT</Typography>
                        <TextField
                          pattern="^\\d*\\.?\\d*$"
                          variant="filled"
                          autoComplete="off"
                          value={amount}
                          onChange={this.handleAmountChange}
                          InputProps={{
                            endAdornment: 'RPS'
                          }}
                          className="form-control"
                        />
                      </div>
                      <div className="input-amount">
                        <Typography>RECEIVE AMOUNT</Typography>
                        <TextField
                          pattern="^\\d*\\.?\\d*$"
                          variant="outlined"
                          value={estimatedAmount}
                          InputProps={{
                            readOnly: 'true',
                            endAdornment: 'ETH'
                          }}
                          className="form-control"
                        />
                      </div>
                      <div className="account">
                        <p className='step-tag'>Step 2 out of 2</p> 
                        <div style={{ display: 'flex', alignItems: 'center' }}>

                          <Typography variant="body2">SEND TO ADDRESS</Typography>
                          {isConnected ? (
                            <TextField
                              label="Account"
                              variant="filled"
                              style={{width:"100%"}}
                              value={account}
                              InputProps={{
                                readOnly: true
                              }}
                              className="form-control"
                            />
                          ) : (
                            <TextField
                              label="Account"
                              variant="filled"
                              value="Connect Wallet"
                              style={{width:"100%"}}
                              InputProps={{
                                readOnly: true
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
                                  textDecoration: 'none'
                                }}
                              >
                                <Info />
                                <Link
                                  fontSize="small"
                                  style={{ marginLeft: '4px' }}
                                />
                              </a>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div>
                      <div>
                          
                        <p className='step-tag'>Step 1 out of 3</p>
                        <div className="account" style={{ display: "flex", alignItems: "center" }}>
                          <Typography style={{ whiteSpace: 'nowrap' }}>CURRENCY TYPE</Typography>
                          <TextField
                            type="text"
                            variant="filled"
                            autoComplete="off"
                            value={currencyTo.toUpperCase()}
                            onChange={this.setCurrencyTo}
                            error={!isValidCurrency}
                            helperText={!isValidCurrency ? 'Invalid currency' : ''}
                            className="form-control"
                          />
                          <Tooltip title="Choose currency you want to receive in.">
                            <IconButton size="small">
                              <Info />
                            </IconButton>
                          </Tooltip>
                        </div>
                        {suggestions.length > 0 && (
                          <ul style={suggestionsListStyle}>
                            {suggestions.map(suggestion => (
                              <a>

                                <li onMouseEnter={() => this.handleSuggestionMouseEnter(suggestion)}
                                  onMouseLeave={this.handleSuggestionMouseLeave}
                                  style={{
                                    ...suggestionStyle,
                                    backgroundColor: hoveredSuggestion === suggestion ? '#f0f0f0' : 'transparent',
                                    color: hoveredSuggestion === suggestion ? '#666' : 'inherit',
                                  }} key={suggestion} onClick={() => this.handleSuggestionClick(suggestion)}>
                                  <Typography>{suggestion.toUpperCase()}</Typography>
                                </li></a>
                            ))}
                          </ul>
                        )}
                        

                        <p className='step-tag'>Step 2 out of 3</p>
                        <div className="input-amount">
                          <Typography>WITHDRAWAL AMOUNT</Typography>
                          <TextField
                            pattern="^\\d*\\.?\\d*$"
                            variant="filled"
                            autoComplete="off"
                            value={amount}
                            onChange={this.handleAmountChange}
                            InputProps={{
                              endAdornment: 'RPS'
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
                                <Typography variant="heading1">{currencyTo.toUpperCase()}</Typography>
                              )
                            }}
                            className="form-control"
                          />
                        </div>
                        <p className='step-tag'>Step 3 out of 3</p>

                        <div style={{ marginTop: '20px' }}>
                          <Typography variant="body2">SEND TO ADDRESS</Typography>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <TextField
                              variant="filled"
                              fullWidth
                              error={!validAddress}
                              onChange={this.handleSendAddress}
                              value={sendAddress}
                              helperText={sendAddress ? (!validAddress ? 'Invalid address' : <p style={{color:"#28a745"}}> Valid address!<CheckCircleOutlineIcon style={{width: '12px'}}/></p>) : ''}
                              />



                            <Tooltip title="Address to send to" arrow>

                              <IconButton size="small">

                                <Info />

                              </IconButton>

                            </Tooltip>
                          </div>
                              <><div style={{ marginTop: '20px' }}>
                                <Typography variant="body2">MEMO / DESTINATION TAG ETC. (OPTIONAL)</Typography>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    variant="filled"
                                    fullWidth
                                    value={extraId}
                                    onChange={this.handleExtraId}

                                  />
                                </div>
                              </div>
                              </>
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
                            <TableCell>
                              {convertToCurrency(this.props.balance)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <span>WITHDRAWAL AMOUNT:</span>
                            </TableCell>
                            <TableCell style={{ color: 'red' }}>
                              {convertToEth(this.state.amount * -1)}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell>
                              <span>NEW BALANCE:</span>
                            </TableCell>
                            <TableCell>
                              {convertToCurrency(
                                this.props.balance - this.state.amount
                              )}
                              &nbsp;
                              {this.props.balance - this.state.amount < 0 && (
                                <Warning width="15pt" />
                              )}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                      { paymentMethod === 'web3' && (

                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell>
                              <FontAwesomeIcon icon={faGasPump} />&nbsp;&nbsp;<span>GAS FEE:</span>
                            </TableCell>
                            <TableCell>
                              {convertToEth(this.props.gasfee)}
                            </TableCell>
                            <Tooltip
                              title="Real-time Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
                              arrow
                            >
                              <IconButton size="small">
                                <Info />
                              </IconButton>
                            </Tooltip>
                          </TableRow>
                        </TableBody>
                      </Table>
                      )}
                  <div className="disclaimer">
                    <Typography>Receive within 1 - 3 minutes</Typography>
                  </div>

                </div>
              </div>
            </div>

            <div className="modal-footer">
              <Button className="btn-submit" onClick={paymentMethod === 'web3' ? this.send : this.createPayoutAndClose}>
                Withdraw
              </Button>
              <Button className="btn-back" onClick={this.props.closeModal}>
                CANCEL
              </Button>
            </div>
          </div>
        </Modal>
      </>
    );
  }
}


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

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  userInfo: state.auth.user,
  gasfee: state.auth.gasfee
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction,
  getCustomerStatisticsData
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(WithdrawModal));
