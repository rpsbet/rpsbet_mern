import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { Typography, Table, TableBody, Button, TextField, TableCell, TableContainer, TableHead, TableRow, Tooltip, InputAdornment } from '@material-ui/core';
import { acQueryLoan, acCalculateRemainingLoans, emitLoanOffer, cancelledOffer, reconsiderOffer, offerLoan, createAndLend } from '../../redux/Loan/loan.action';
import { getUser } from '../../redux/Auth/user.actions';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import Lottie from 'react-lottie';
import spinningIcon from '../LottieAnimations/spinningIcon';
import { convertToCurrency } from '../../util/conversion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { faDollarSign, faCalendarAlt, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';
import { Info } from '@material-ui/icons';
import styled from 'styled-components';
import {
  closeOfferLoanModal
} from '../../redux/Notification/notification.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import Avatar from '../../components/Avatar';

Modal.setAppElement('#root');

const cellStyles = {
  borderBottom: "none",
  padding: '5px',
};

const customStyles = {
  overlay: {
    zIndex: 99,
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  content: {
    top: '50%',
    left: '50%',
    right: 'auto',
    bottom: 'auto',
    transform: 'translate(-50%, -50%)',
    padding: 0,
    background: 'transparent',
    border: 'none'
  }
};

const CalculationField = styled.div`
  margin-top: 0px;
`;

const WarningContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  border-radius: 5px;
  margin-top: 10px;
`;


class OfferLoanModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      responseText: 0,
      showPlayerModal: false,
      socket: props.socket,
      cancelled: false,
      waiting: true,
      isComplete: false
    };
    this.rejected = new Audio('/sounds/rejected.mp3');
    this.rejected.load();
  }

  componentDidMount() {
    this.setupSocketListener();
  }

  setupSocketListener = (attempt = 1) => {

    const { og } = this.state;
    const { socket, offerInfo, userInfo } = this.props;

    if (!socket || !offerInfo) {
      if (attempt < 5) {
        // Retry after 1 second if the attempt count is less than 5
        setTimeout(() => this.setupSocketListener(attempt + 1), 1000);
      }
      return;
    }

    socket.off(`CANCEL_OFFER_${offerInfo._id}`); // Remove any previous listeners to avoid duplication
    socket.on(`CANCEL_OFFER_${offerInfo._id}`, (data) => {
      this.setState({
        cancelled: data.cancelled,
        waiting: true,
      }, () => {
        if (this.props.isOpen && data.cancelled && !this.props.isMuted && this.props.offerInfo.isLender && !this.state.isComplete) {
          this.rejected.play();
        }
        if (data.cancelled && !this.props.offerInfo.isLender) {
          this.props.closeOfferLoanModal();
        }
      });

    });

    socket.off(`OFFER_LOAN_${offerInfo._id}`); // Remove any previous listeners to avoid duplication
    socket.on(`OFFER_LOAN_${offerInfo._id}`, (data) => {
      this.setState({
        responseText: data.loanAmount,
        loanPeriodText: data.loanPeriod,
        interestRateText: data.interestRate,
        waiting: false,
        cancelled: false,
        og: data.og,
        isComplete: data.isComplete ? true : false
      });

    });

    socket.off(`OFFER_LOAN_${userInfo._id}`); // Remove any previous listeners to avoid duplication
    socket.on(`OFFER_LOAN_${userInfo._id}`, (data) => {
      this.setState({
        responseText: data.loanAmount,
        loanPeriodText: data.loanPeriod,
        interestRateText: data.interestRate,
        waiting: false,
        cancelled: false,
        og: data.og,
        isComplete: data.isComplete ? true : false
      });

    });
  }


  async componentDidUpdate(prevProps, prevState) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen && this.props.offerInfo.isLender) {
      this.nudge();
      this.setState({ cancelled: false, waiting: true });
      this.setupSocketListener();
    } else if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen && !this.props.offerInfo.isLender) {
      this.props.reconsiderOffer({
        _id: this.props.userInfo._id,
        username: '',
      });
      this.setupSocketListener();
    }
    if (prevState.isComplete !== this.state.isComplete && this.state.isComplete) {
      await this.props.getUser(true, 5);
      // await this.props.acCalculateRemainingLoans();
      this.props.closeOfferLoanModal();
    }
  }

  nudge = () => {
    this.props.emitLoanOffer({
      _id: this.props.offerInfo._id,
      lender: this.props.userInfo._id,
      avatar: this.props.userInfo.avatar,
      totalWagered: this.props.userInfo.totalWagered,
      accessory: this.props.userInfo.accessory,
      username: this.props.userInfo.username
    });
  }

  calculateNewBalance = (user_balance, loan_amount) => {
    const newBalance = user_balance - parseFloat(loan_amount);
    return isNaN(newBalance) ? user_balance : newBalance;
  };

  calculateInterest = (loan_amount, interestRateText) => {
    const amount = parseFloat(loan_amount);
    const interestRate = parseFloat(interestRateText);
    const interestAmount = (amount * interestRate) / 100;
    return isNaN(interestAmount) ? 0 : interestAmount;
  };

  determineLoanType = (user_balance, loan_amount) => {
    const newBalance = this.calculateNewBalance(user_balance, loan_amount);
    return newBalance < 0 ? 'FRACTIONAL' : 'FULL';
  };

  createAndLend = async () => {
    const { responseText, loanPeriodText, interestRateText, og } = this.state;
    const { isDarkMode, getUser, closeOfferLoanModal, offerLoan, userInfo, offerInfo } = this.props;

    this.setState({ waiting: true });
    const result = await this.props.createAndLend({
      loan_amount: responseText,
      loan_period: loanPeriodText,
      apy: interestRateText,
      lender: og,
    });
    this.onBtnCancelClicked();
    if (result.success) {
      await getUser(true, 5);
      alertModal(isDarkMode, result.message, '-cat');
      closeOfferLoanModal();
      offerLoan({
        loanAmount: '',
        loanPeriod: '',
        interestRate: '',
        lender: userInfo._id,
        complete: true
      });
    }
  }

  toggleExpand = () => {
    this.setState((prevState) => ({
      expanded: !prevState.expanded,
    }));
  };

  handleResponseTextChange = (e) => {
    const inputValue = e.target.value;
    // Use a regular expression to allow decimals
    const parsedValue = inputValue.match(/^\d*\.?\d*$/);
    // Update the state with the parsed value or an empty string
    this.setState({ responseText: parsedValue ? parsedValue[0] : "" });
  };

  handleLoanPeriodTextChange = (e) => {
    const inputValue = e.target.value;
    const parsedValue = inputValue.match(/^\d*\.?\d*$/);
    this.setState({ loanPeriodText: parsedValue ? parsedValue[0] : "" });
  };

  handleInterestRateTextChange = (e) => {
    const inputValue = e.target.value;
    const parsedValue = inputValue.match(/^\d*\.?\d*$/);
    this.setState({ interestRateText: parsedValue ? parsedValue[0] : "" });
  };

  exceedsReservesLimit = (user_balance, loan_amount) => {
    const loanAmount = parseFloat(loan_amount);
    return loanAmount > (user_balance * 10);
  };

  onBtnOkClicked = async e => {
    const { userInfo, closeOfferLoanModal, acQueryLoan, setBalance, addNewTransaction, isDarkMode, offerLoan, offerInfo } = this.props;
    const { responseText, loanPeriodText, interestRateText } = this.state;

    if (parseFloat(responseText) > 10 * userInfo.balance) {
      alertModal(isDarkMode, "PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X YOUR BALANCE");
      return;
    }
    if (parseFloat(responseText) < 0.05) {
      alertModal(isDarkMode, "MEOWNIMUM IS 0.05 RPS");
      return;
    }

    this.setState({ waiting: false });
    offerLoan({
      loanAmount: parseFloat(responseText),
      loanPeriod: parseInt(loanPeriodText),
      interestRate: parseFloat(interestRateText),
      lender: offerInfo._id,
      og: userInfo._id,
    });
  };

  onBtnCancelClicked = () => {
    if (!this.props.isMuted && !this.props.offerInfo.isLender && !this.state.isComplete) {
      this.rejected.play();
    }
    if (!this.state.isComplete) {
      this.props.cancelledOffer({
        avatar: '',
        _id: this.props.offerInfo._id,
        username: '',
        accessory: '',
        totalWagered: '',
        isLender: ''
      });
    }

    this.props.closeOfferLoanModal();
  };

  render() {
    const { expanded, responseText, loanPeriodText, interestRateText, cancelled, waiting } = this.state;
    const { userInfo, solPrice, isLowGraphics } = this.props;
    const tableCellStyle = { textAlign: 'center' };

    const inputCellStyle = {
      flex: 4,
      border: 'none',
      padding: '30px 20px'
    };

    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >

        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            {this.props.offerInfo.isLender ?
              (
                <h5>OFFER LOAN TO {this.props.offerInfo.username}</h5>
              ) : (
                <h5>LOAN OFFER FROM {this.props.offerInfo.username}</h5>

              )}

            <div className='thresholds' style={{ padding: '20px', overflow: 'hidden' }}>
              <TableContainer style={{ borderRadius: "20px", maxHeight: 150, overflow: 'hidden' }}>
                <Table aria-label="nice-table">
                  <TableHead style={{  textTransform: "uppercase", position: 'sticky', top: 0, zIndex: 1, backgroundColor: this.props.isDarkMode ? '#0000006e' : '#e9ecef99' }}>
                    <TableRow>
                      <TableCell style={{textAlign: 'center' }}>
                        <div className={'player'} style={{ display: 'flex' }}>
                          <Avatar
                            className="avatar"
                            src={userInfo.avatar}
                            rank={userInfo.totalWagered}
                            username={userInfo.username}
                            accessory={userInfo.accessory}
                            alt=""
                            darkMode={this.props.isDarkMode}
                          />
                          <i
                            style={{ marginTop: '1px', width: '14px', height: '14px' }}
                            className={`online-status${this.props.onlineUserList.filter(user => user === this.props.offerInfo._id).length > 0
                              ? ' online'
                              : ''
                              }`}
                          ></i>
                        </div>
                        {!cancelled && !waiting ? (
                          <h6 style={{ color: 'rgb(72 255 4)' }}>READY!</h6>
                        ) : (
                          <h6 style={{ color: '#ccc' }}>WAITING!</h6>
                        )}
                      </TableCell>

                      {!cancelled || !this.props.offerInfo.isLender ? (
                        <TableCell style={{ textAlign: 'center' }}>
                          <div className={'player'} style={{ display: 'flex' }}>
                            <Avatar
                              className="avatar"
                              src={this.props.offerInfo.avatar}
                              rank={this.props.offerInfo.totalWagered}
                              accessory={this.props.offerInfo.accessory}
                              username={this.props.offerInfo.username}
                              alt=""
                              darkMode={this.props.isDarkMode}
                            />
                            <i
                              style={{ marginTop: '1px', width: '14px', height: '14px' }}
                              className={`online-status${this.props.onlineUserList.filter(user => user === this.props.offerInfo._id).length > 0
                                ? ' online'
                                : ''
                                }`}
                            ></i>
                          </div>
                          <h6 style={{ color: '#ccc' }}>WAITING!</h6>
                        </TableCell>
                      ) : (
                        <TableCell>
                          <div className={'player'} style={{ display: 'flex' }}>
                            <Avatar
                              className="avatar"
                              src={this.props.offerInfo.avatar}
                              rank={this.props.offerInfo.totalWagered}
                              accessory={this.props.offerInfo.accessory}
                              username={this.props.offerInfo.username}
                              alt=""
                              darkMode={this.props.isDarkMode}
                            />
                            <i
                              style={{ marginTop: '1px', width: '14px', height: '14px' }}
                              className={`online-status${this.props.onlineUserList.filter(user => user === this.props.offerInfo._id).length > 0
                                ? ' online'
                                : ''
                                }`}
                            ></i>
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'end', flexDirection: 'column', padding: '0 20px' }}>
                              <h6 style={{ color: '#ff0000' }}>REJECTED</h6>
                              <Button onClick={this.nudge}>NUDGE</Button>
                            </div>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>

                  </TableHead>


                </Table>
              </TableContainer>


            </div>
            {this.props.offerInfo.isLender && (
              <>
                <TableContainer style={{ padding: '0 20px 10px' }}>
                  <Table style={{ borderCollapse: 'collapse' }}>
                    <TableRow>
                      <TableCell style={inputCellStyle}>
                        <TextField
                          variant="filled"
                          label="Loan Amount"
                          value={responseText}
                          onChange={this.handleResponseTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                &nbsp;RPS
                              </InputAdornment>
                            ),
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }} >
                        <Tooltip title="Enter the amount of loan you are lending in RPS">
                          <Info style={{ cursor: "pointer" }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    {this.exceedsReservesLimit(userInfo.balance, responseText) && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <WarningContainer>
                            <FontAwesomeIcon icon={faExclamationTriangle} style={{ color: '#ff0000', marginRight: '10px' }} />
                            <Typography variant="body1"  style={{ marginTop: '0' }}>
                              PLEASE ENSURE THE LOAN AMOUNT IS NO MORE THAN 10X YOUR BALANCE
                            </Typography>
                          </WarningContainer>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell style={inputCellStyle}>
                        <TextField
                          variant="filled"
                          label="Loan Period"
                          value={loanPeriodText}
                          onChange={this.handleLoanPeriodTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                &nbsp;DAYS
                              </InputAdornment>
                            ),
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell style={{ textAlign: "center" }}>
                        <Tooltip title="Enter the duration for which you want the loan in days">
                          <Info style={{ cursor: "pointer" }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell style={inputCellStyle}>
                        <TextField
                          variant="filled"
                          label="Interest Rate"
                          value={interestRateText}
                          onChange={this.handleInterestRateTextChange}
                          InputProps={{
                            endAdornment: (
                              <InputAdornment position="end">
                                &nbsp;%
                              </InputAdornment>
                            ),
                          }}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell style={{ borderBottom: 'none', textAlign: "center" }}>
                        <Tooltip title="Enter the yielding interest rate for the loan">
                          <Info style={{ cursor: "pointer" }} />
                        </Tooltip>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <CalculationField>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '0' }}>
                            YOUR BALANCE:
                          </Typography>
                        </CalculationField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" style={{ marginTop: '0' }}>
                          {convertToCurrency(userInfo.balance, solPrice)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <CalculationField>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '0' }}>
                            NEW BALANCE:
                          </Typography>
                        </CalculationField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" style={{ marginTop: '0' }}>
                          {this.calculateNewBalance(userInfo.balance, responseText) < 0
                            ? <>{convertToCurrency(0, solPrice)} AND {convertToCurrency(Math.abs(this.calculateNewBalance(userInfo.balance, responseText)), solPrice)} IN DEBT</>
                            : convertToCurrency(this.calculateNewBalance(userInfo.balance, responseText), solPrice)
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <CalculationField>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '0' }}>
                            GROSS PROFIT:
                          </Typography>
                        </CalculationField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" style={{ marginTop: '0' }}>
                          {isNaN(parseFloat(responseText)) || isNaN(parseFloat(interestRateText)) || parseFloat(responseText) <= 0 || parseFloat(interestRateText) <= 0
                            ? convertToCurrency(0, solPrice)
                            : convertToCurrency(this.calculateInterest(responseText, interestRateText) + parseFloat(responseText), solPrice)
                          }
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <CalculationField>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '0' }}>
                            NET PROFIT:
                          </Typography>
                        </CalculationField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" style={{ marginTop: '0' }}>
                          <span id="interest">(+{convertToCurrency(this.calculateInterest(responseText, interestRateText), solPrice)})</span>
                        </Typography>
                      </TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell>
                        <CalculationField>
                          <Typography variant="body1" style={{ fontWeight: 'bold', marginTop: '0' }}>
                            LOAN TYPE:
                          </Typography>
                        </CalculationField>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body1" style={{ marginTop: '0' }}>
                          {this.determineLoanType(userInfo.balance, responseText)}
                        </Typography>
                      </TableCell>
                    </TableRow>

                    {parseFloat(interestRateText) > 6 && (
                      <TableRow>
                        <TableCell colSpan={2}>
                          <Typography variant="body1" style={{ color: '#ff0000', fontWeight: 'bold', textAlign: 'center' }}>
                            Charging an interest rate above 6% may be considered usury and could increase the risk of borrower default. We recommend setting a rate below 6% to mitigate this risk.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}

                  </Table>
                </TableContainer>

              </>
            )}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell style={tableCellStyle}>
                      Loan Amount <FontAwesomeIcon icon={faDollarSign} />
                    </TableCell>
                    <TableCell style={tableCellStyle}>
                      Days Left <FontAwesomeIcon icon={faCalendarAlt} />
                    </TableCell>
                    <TableCell style={tableCellStyle}>
                      Payback Amount <FontAwesomeIcon icon={faMoneyBillWave} />
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ textAlign: "center" }}>
                      {cancelled || waiting ? 'waiting' : convertToCurrency(parseFloat(responseText), solPrice)}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      {cancelled || waiting ? 'waiting' : `${loanPeriodText} days`}
                    </TableCell>
                    <TableCell style={{ textAlign: "center" }}>
                      {cancelled || waiting
                        ? 'waiting'
                        : <> {convertToCurrency(((parseFloat(responseText) / 100) * parseFloat(interestRateText)) + parseFloat(responseText), solPrice)} <span>({parseFloat(interestRateText).toFixed(2)}%)</span>
                        </>
                      }
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>


            <h6 style={{ marginTop: "30px", marginBottom: "10px" }}>
              By clicking 'ACCEPT OR OFFER', you agree to the following <span onClick={this.toggleExpand} style={{ color: "#ff0000", textDecoration: "underline", cursor: "pointer" }}>terms and conditions:
              </span>
            </h6>

            {expanded && (
              <>
                <table className="terms-and-conditions-table">
                  <tbody>
                    <tr>
                      <td className="list-number">1.</td>
                      <td>The loan amount is <span style={{ color: "#ff0000" }}>[{convertToCurrency(parseFloat(responseText), solPrice)}]</span>.</td>
                    </tr>
                    <tr>
                      <td className="list-number">2.</td>
                      <td>The loan period is <span style={{ color: "#ff0000" }}>[{loanPeriodText}]</span> days.</td>
                    </tr>
                    <tr>
                      <td className="list-number">3.</td>
                      <td>You are responsible for repaying the loan within the specified period.</td>
                    </tr>
                    <tr>
                      <td className="list-number">4.</td>
                      <td>Interest may be applicable on the loan amount as per the agreed Interest Rate: <span style={{ color: "#ff0000" }}>[{parseFloat(interestRateText).toFixed(2)}%]</span>.</td>
                    </tr>
                    <tr>
                      <td className="list-number">5.</td>
                      <td>Failure to repay the loan on time may result in user's score credit penalties.</td>
                    </tr>
                    <tr>
                      <td className="list-number">6.</td>
                      <td>Any outstanding balance after the loan period may be automatically deducted from the user's available in-game balance</td>
                    </tr>
                    <tr>
                      <td className="list-number">7.</td>
                      <td>Make sure to review and understand the loan terms and conditions provided by the lender.</td>
                    </tr>
                    <tr>
                      <td className="list-number">8.</td>
                      <td>Clicking 'ACCEPT' offers your understanding and agreement to these terms.</td>
                    </tr>
                    <tr>
                      <td className="list-number">9.</td>
                      <td>No legal action in the case of non-repayment can be taken on un-settled debts, all loans are final and this is strictly peer-to-peer.</td>
                    </tr>
                    <tr>
                      <td className="list-number">10.</td>
                      <td>Ensure that you have sufficient resources to pay back the loan amount. Check your debts by clicking your wallet</td>
                    </tr>
                    <tr>
                      <td className="list-number">11.</td>
                      <td>This agreement is binding and enforceable.</td>
                    </tr>
                    <tr>
                      <td className="list-number">12.</td>
                      <td>Withdrawals & Tipping to be suspended for the loaner whilst in debt.</td>
                    </tr>
                    <tr>
                      <td className="list-number">13.</td>
                      <td>All loans are final.</td>
                    </tr>
                    <tr>
                      <td className="list-number">14.</td>
                      <td>You are required to clean your genitals often.</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </div>

          <div className="modal-footer">
            {this.props.offerInfo.isLender ? (
              <div>
                <Button
                  className={`btn-submit ${!this.state.waiting && !cancelled ? 'isWaiting' : ''}`}
                  disabled={!this.state.waiting && !cancelled}
                  onClick={this.state.waiting && cancelled ? this.nudge : this.onBtnOkClicked}>
                  {this.state.waiting ? (cancelled ? 'NUDGE' : 'OFFER') : 'WAITING'}&nbsp;
                  {!this.state.waiting && !cancelled && (
                    <Lottie
                      options={{
                        loop: isLowGraphics ? false : true,
                        autoplay: isLowGraphics ? false : true,
                        animationData: spinningIcon
                      }}
                      style={{ width: '25px', marginTop: '-2px' }}
                    />
                  )}
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  className={`btn-submit ${this.state.waiting ? 'disabled' : ''}`}
                  disabled={this.state.waiting}
                  onClick={this.createAndLend}>
                  {!this.state.waiting ? 'ACCEPT' : 'WAITING'}&nbsp;
                  {this.state.waiting && (
                    <Lottie
                      options={{
                        loop: isLowGraphics ? false : true,
                        autoplay: isLowGraphics ? false : true,
                        animationData: spinningIcon
                      }}
                      style={{ width: '25px', marginTop: '-4px' }}
                    />
                  )}
                </Button>
              </div>
            )}


            {this.props.offerInfo.isLender ? (
              <Button
                className="btn-back"
                onClick={this.onBtnCancelClicked}
              >
                Cancel
              </Button>
            ) : (
              <Button
                className="btn-back"
                onClick={this.onBtnCancelClicked}
              >
                Reject
              </Button>
            )}
          </div>
        </div>
      </Modal >
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  rank: state.auth.totalWagered,
  isOpen: state.snackbar.showOfferLoanModal,
  title: state.snackbar.title,
  item: state.loanReducer._id,
  isLender: state.loanReducer.isLender,
  offerInfo: state.loanReducer.offerInfo,
  loan_amount: state.loanReducer.data.loan_amount,
  loan_period: state.loanReducer.data.loan_period,
  apy: state.loanReducer.data.apy,
  alertMessage: state.snackbar.alertMessage,
  userInfo: state.auth.user,
  alertType: state.snackbar.alertType,
  onlineUserList: state.logic.onlineUserList,
  isMuted: state.auth.isMuted,
  solPrice: state.auth.solPrice
});

const mapDispatchToProps = {
  closeOfferLoanModal,
  offerLoan,
  setBalance,
  acCalculateRemainingLoans,
  addNewTransaction,
  acQueryLoan,
  emitLoanOffer,
  cancelledOffer,
  reconsiderOffer,
  createAndLend,
  getUser
};

export default connect(mapStateToProps, mapDispatchToProps)(OfferLoanModal);
