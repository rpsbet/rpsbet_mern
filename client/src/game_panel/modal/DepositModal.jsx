import React, { Component } from 'react';
import { connect } from 'react-redux';
import LoadingOverlay from 'react-loading-overlay';
import Modal from 'react-modal';
import axios from '../../util/Api';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance, setGasfee } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { ethers } from 'ethers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import QRCodeIcon from '@material-ui/icons/CropFreeOutlined';
import WalletIcon from '@material-ui/icons/AccountBalanceWallet';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import QRCode from 'qrcode.react';
import {
  faGasPump
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
  RadioGroup,
  Grid,
  Radio,
  FormControlLabel,
  ButtonBase
} from '@material-ui/core';
import { Info, Warning, AccountBalanceWallet, Link, FiberManualRecord } from '@material-ui/icons';
import { convertToCurrency } from '../../util/conversion';
import { convertToEth } from '../../util/eth_conversion.js';
import { tokenAddr, adminWallet } from '../../config/index.js';
import { withStyles } from '@material-ui/core/styles';


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

class DepositModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      amount: 0,
      web2Amount: 10,
      sendAmount: 0,
      sendAddress: '',
      selectedOption: 0,
      currencyTo: 'ltc',
      web3: props.web3,
      balance: props.balance,
      account: props.account,
      isLoading: false,
      estimatedPrice: null,
      paymentMethod: 'web2',
      currencies: [],
      isValidCurrency: true,
      suggestions: [],
      payinExtraId: '',
      loading: true,
      hoveredSuggestion: null,
      currencyValue: 0.7,
      copied: false,
      paymentId: ''
    };

    this.options = [10, 25, 50, 100, 250];
    this.images = [
      '/img/icons/coins-xs.svg',
      '/img/icons/coins-s.svg',
      '/img/icons/coins-m.svg',
      '/img/icons/coins-l.svg',
      '/img/icons/coins-xl.svg',
    ];
    this.additionalTexts = ['shy guy', 'casual', 'flipper', 'baller', 'investor'];

  }

  async componentDidMount() {
    const params = { addressTo: this.state.account };
    await this.handleGetPaymentMethods();
    this.props.setGasfee(params);
    this.getAddress();
  }

  handleAmountChange = e => {
    e.preventDefault();
    this.setState({
      amount: e.target.value
    });
  };

  handlePaymentMethodChange = event => {
    this.setState({ paymentMethod: event.target.value });
  };

  handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    this.setState({ copied: true });
    setTimeout(() => this.setState({ copied: false }), 1500); // Reset copied state after 1.5 seconds
  };

  setCurrencyTo = event => {
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
      if (isValidCurrency) {
        this.getAddress();
      }
    });
  };

  handleOptionChange = index => {
    this.setState({
      selectedOption: index,
      web2Amount: this.options[index],
      sendAddress: ''
    }, () => {
      this.getAddress();
    });
  };


  async sendTransaction(amount) {
    try {


      // Convert amount from ether to wei
      const ethAmountInWei = ethers.utils.parseEther(amount.toString());

      const transaction = await signer.sendTransaction({
        to: adminWallet,
        value: ethAmountInWei
      });

      await transaction.wait();
      // console.log('Transaction sent successfully!');
      // You can perform additional actions after sending the transaction
    } catch (error) {
      console.error('Error sending transaction:', error);
    }
  }

  send = async () => {
    if (this.state.amount <= 0) {
      alertModal(this.props.isDarkMode, `IM-PAW-SIBBLEEE, ENTER A VALID NUMBER!`);
      return;
    }

    if (this.state.amount > this.state.balance) {
      alertModal(this.props.isDarkMode, `NOT ENUFF FUNDS AT THIS MEOWMENT`);
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const amountInWei = ethers.utils.parseEther(this.state.amount.toString());

      this.setState({ isLoading: true });

      // Send transaction
      const transaction = await signer.sendTransaction({
        to: adminWallet,
        value: amountInWei
      });
      await transaction.wait();

      const result = await axios.post('/stripe/deposit_successed/', {
        amount: this.state.amount,
        txtHash: transaction.hash
      });

      if (result.data.success) {
        alertModal(this.props.isDarkMode, result.data.message, '-cat');
        this.props.setBalance(result.data.balance);
        this.props.addNewTransaction(result.data.newTransaction);
        this.setState({ isLoading: false });
        this.props.closeModal();
      } else {
        this.setState({ isLoading: false });
        alertModal(
          this.props.isDarkMode,
          `Something went wrong. Please try again later or contact support.`
        );
      }
    } catch (e) {
      console.error(e);
      this.setState({ isLoading: false });
      alertModal(this.props.isDarkMode, `Failed transaction.`);
    }
  };


  handleSuggestionMouseEnter = suggestion => {
    this.setState({
      hoveredSuggestion: suggestion,
    });
  };

  handleSuggestionMouseLeave = () => {
    this.setState({
      hoveredSuggestion: null,
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

  handleSuggestionClick = suggestion => {
    this.setState({
      currencyTo: suggestion,
      suggestions: [],
      isValidCurrency: true
    }, () => {
      this.getAddress();
    });
  };

  getAddress = async () => {
    const { web2Amount, currencyTo } = this.state;
    // Set loading state to true
    this.setState({ loading: true });

    try {
      const response = await axios.post('/stripe/generate_address', { web2Amount, currencyTo });
      console.log('response:', response.data);

      this.setState({
        sendAmount: response.data.pay_amount,
        sendAddress: response.data.pay_address,
        paymentId: response.data.payment_id,
        payinExtraId: response.data.payin_extra_id
      });

    } catch (error) {
      console.error(error);
      // Handle error
    } finally {
      // Reset loading state to false whether the request succeeds or fails
      this.setState({ loading: false });
    }
  };

  createPaymentAndClose = async () => {
    const { web2Amount, paymentId } = this.state;
    const { user_id } = this.props;
    try {
      const response = await axios.post('/stripe/create_payment', { price_amount: web2Amount, payment_id: paymentId, user_id });
      alertModal(this.props.isDarkMode, response.data.message, "-cat");
      this.props.closeModal();
    } catch (error) {
      console.error(error);
      // Handle error
    }
  };


  render() {
    const { account, paymentMethod, paymentId, payinExtraId, amount, sendAddress, sendAmount, copied, currencyTo, isValidCurrency, suggestions, hoveredSuggestion, selectedOption, currencyValue } = this.state;
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
        >
          <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
            <div className="modal-header">
              <h2 className="modal-title">    <Icon component={AccountBalanceWallet} className="mr-2" /> {/* Use Material-UI Icon component */}

                DEPOSIT</h2>
              <Button className="btn-close" onClick={this.props.closeModal}>
                ×
              </Button>
            </div>
            <div className="modal-body edit-modal-body deposit-modal-body">
              <div className="modal-content-wrapper">
                <div className="modal-content-panel">
                  <div className={classes.root}>
                    <h4 className={classes.radioLabel}>Select Payment Method:</h4>
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
                  <hr />
                  <p className='step-tag'>{paymentMethod === 'web2' ? 'Step 1 out of 4' : paymentMethod === 'web3' ? 'Step 1 out of 3' : ''}</p>
                  <Typography>
                    CHOOSE PACK
                  </Typography>                  <Grid container style={{ margin: '0 auto 15px auto' }} spacing={3}>
                    {this.options.map((price, index) => (
                      <Grid item xs={12} sm={6} md={6} lg={6} key={index}>
                        <ButtonBase
                          // className={classes.radioInput}
                          className={`${classes.customButton} ${selectedOption === index ? "selected" : ""}`}

                          onClick={() => this.handleOptionChange(index)}
                          value={price}
                        >

                          <Typography variant="heading1" className={classes.additionalText}>{this.additionalTexts[index].toUpperCase()}</Typography> {/* Add additional text */}
                          <img style={{ width: '50px', display: 'block', margin: 'auto' }} src={this.images[index]} alt={`option-${index}`} />
                          <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignContent: 'center', flexDirection: 'row' }} >

                            <Typography variant="heading2" className={classes.price}>{convertToCurrency((price / currencyValue) + (7 * index))}&nbsp;</Typography>
                            <Typography variant="heading2" className={classes.price}>{`($${price})`}</Typography>
                          </div>
                        </ButtonBase>

                      </Grid>
                    ))}
                  </Grid>
                  {paymentMethod === 'web3' ? (
                    <>
                      <div className="account">
                        <div className="account" >
                          <p className='step-tag'>Step 2 out of 3</p>
                          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography style={{ whiteSpace: 'nowrap' }}>CONNECT ACCOUNT</Typography>

                            {isConnected ? (
                              <TextField
                                label="Account"
                                variant="filled"
                                value={account}
                                InputProps={{
                                  readOnly: true
                                }}
                                style={{ width: '100%' }}
                              />
                            ) : (
                              <TextField
                                label="Account"
                                variant="filled"
                                value="Connect Wallet"
                                InputProps={{
                                  readOnly: true
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
                                  <IconButton size="small">

                                    <Info />
                                    <Link
                                      fontSize="small"
                                      style={{ marginLeft: '4px' }}
                                    />
                                  </IconButton>
                                </a>
                              </Tooltip>
                            )}
                          </div>
                        </div>


                      </div>
                      <div>
                        <p className='step-tag'>Step 3 out of 3</p>
                        <div className="account" style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: '20px' }}>
                          <Typography>CLICK 'DEPOSIT' TO COMPLETE PAYMENT VIA YOUR WALLET PROVIDER</Typography>
                        </div>
                        <div className="account" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                          <Typography style={{ whiteSpace: 'nowrap' }}>DEPOSIT AMOUNT</Typography>
                          <TextField
                            pattern="^\\d*\\.?\\d*$"
                            type="text"
                            variant="outlined"
                            autoComplete="off"
                            value={amount}
                            style={{ pointerEvents: 'none' }}
                            className="form-control"
                            InputProps={{
                              readOnly: true,
                              endAdornment: 'ETH'
                            }}
                          />
                          <Tooltip title="Amount is automatically calculated based on selected pack." arrow>
                            <IconButton size="small">
                              <Info />
                            </IconButton>
                          </Tooltip>
                        </div>
                        <Table>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                <Typography style={{ whiteSpace: 'nowrap' }}>WALLET BALANCE:</Typography>
                              </TableCell>
                              <TableCell style={{ textAlign: 'center' }}>
                                {convertToEth(this.props.balance)}
                                &nbsp;
                              </TableCell>
                              <Tooltip title="Your connected wallet's account balance" arrow>
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </TableRow>
                            <TableRow>
                              <TableCell>
                                <Typography style={{ whiteSpace: 'nowrap' }}> <FontAwesomeIcon icon={faGasPump} />&nbsp;&nbsp;GAS FEE:</Typography>
                              </TableCell>
                              <TableCell style={{ textAlign: 'center' }}>
                                {convertToEth(this.props.gasfee)}
                              </TableCell>
                              <Tooltip
                                title="Gas fee is the cost associated with performing a transaction. It covers network processing and validation."
                                arrow
                              >
                                <IconButton size="small">
                                  <Info />
                                </IconButton>
                              </Tooltip>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </>

                  ) : (
                    <div>
                      <p className='step-tag'>Step 2 out of 4</p>
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
                        <Tooltip title="Enter the cryptocurrency to transfer">
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
                      {sendAddress && isValidCurrency ? (
                        <>
                          <p className='step-tag'>Step 3 out of 4</p>
                          <div className="account" style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                            <Typography style={{ whiteSpace: 'nowrap' }}>DEPOSIT AMOUNT</Typography>
                            <TextField
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
                                  <Typography variant="heading1">{currencyTo.toUpperCase()}</Typography>
                                )
                              }}
                            />
                            <Tooltip title="Send this exact amount to the address below to receive your RPS within a few minutes.">
                              <IconButton size="small">
                                <Info />
                              </IconButton>
                            </Tooltip>
                          </div>

                          <div style={{ marginTop: '20px' }}>
                            <Typography variant="body2">PAYMENT ADDRESS</Typography>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                              <TextField
                                variant="outlined"
                                fullWidth
                                value={sendAddress}
                                InputProps={{
                                  readOnly: true,
                                  endAdornment: (
                                    <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
                                      <IconButton onClick={() => this.handleCopyToClipboard(sendAddress)}>
                                        <FileCopyIcon />
                                      </IconButton>
                                    </Tooltip>
                                  )
                                }}
                              />
                            </div>
                            {payinExtraId && (
                              <><div style={{ marginTop: '20px' }}>
                                <Typography variant="body2">MEMO / DESTINATION TAG ETC.</Typography>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    variant="outlined"
                                    fullWidth
                                    value={payinExtraId}
                                    InputProps={{
                                      readOnly: true,
                                      endAdornment: (
                                        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
                                          <IconButton onClick={() => this.handleCopyToClipboard(payinExtraId)}>
                                            <FileCopyIcon />
                                          </IconButton>
                                        </Tooltip>
                                      )
                                    }}
                                  />
                                </div>
                              </div>
                              </>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'center', background: '#f9f9f9', width: 'min-content', margin: '20px auto', padding: '20px', borderRadius: '0.3em' }}>
                              <QRCode value={sendAddress} />
                            </div>
                            <Typography style={{ color: '#ff0000', textAlign: 'center' }}>DO NOT SEND ANY OTHER CRYPTOCURRENCY TYPE EXCEPT {currencyTo.toUpperCase()}</Typography>

                            <p className='step-tag'>Step 4 out of 4</p>
                            <div className="account" style={{ display: 'flex', flexDirection: 'column', width: '100%', marginTop: '20px' }}>
                              <Typography>CLICK 'CONFIRM' ONCE YOU HAVE SENT PAYMENT.</Typography>
                              <div style={{ marginTop: '20px' }}>
                                <Typography variant="body2">PAYMENT ID (FOR YOUR REFERENCE ONLY)</Typography>
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                  <TextField
                                    variant="outlined"
                                    fullWidth
                                    value={paymentId}
                                    InputProps={{
                                      readOnly: true,
                                      endAdornment: (
                                        <Tooltip title={copied ? "Copied!" : "Copy to clipboard"} placement="top">
                                          <IconButton onClick={() => this.handleCopyToClipboard(paymentId)}>
                                            <FileCopyIcon />
                                          </IconButton>
                                        </Tooltip>
                                      )
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
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', margin: '30px auto' }}>
                          <CircularProgress color="secondary" />
                        </div>
                      )}
                    </div>
                  )}
                  <div className="disclaimer">
                    <Typography>RECEIVE WITHIN 1 - 3 MINUTES</Typography>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Button className="btn-submit" onClick={paymentMethod === 'web3' ? this.send : this.createPaymentAndClose}>
                {paymentMethod === 'web3' ? 'Deposit' : 'Confirm'}
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
  gasfee: state.auth.gasfee,
  user_id: state.auth.user._id
});

const mapDispatchToProps = {
  setBalance,
  setGasfee,
  addNewTransaction
};

export default connect(mapStateToProps, mapDispatchToProps)(withStyles(styles)(DepositModal));
