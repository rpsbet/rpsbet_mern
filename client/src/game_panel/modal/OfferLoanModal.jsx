import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { Table, TableBody, Button, TextField, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { acQueryLoan, acCalculateRemainingLoans, emitLoanOffer, cancelledOffer } from '../../redux/Loan/loan.action';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';
import rankIcon from '../LottieAnimations/rankIcon.json';
import {
  closeOfferLoanModal
} from '../../redux/Notification/notification.actions';
import { offerLoan } from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import Avatar from '../../components/Avatar';
import { addNewTransaction } from '../../redux/Logic/logic.actions';

Modal.setAppElement('#root');

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
    background: 'transparent'
  }
};


class OfferLoanModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      responseText: 0,
      showPlayerModal: false,
      socket: props.socket,
      cancelled: ''
    };
  }

  componentDidMount() {
    this.setupSocketListener();
  }
  
  setupSocketListener = () => {
    const { socket, offerInfo } = this.props;
    
    if (!socket) {
      // If socket is not available, retry after 1 second
      setTimeout(this.setupSocketListener, 1000);
      return;
    }

    console.log("offerInfo", offerInfo._id);
  
    socket.on(`CANCEL_OFFER_${offerInfo._id}`, () => {
      console.log("data");
        this.setState(
          {
            cancelled: true,
          }
        );
    });
  }
  
  
  componentDidUpdate(prevProps) {
    if (prevProps.isOpen !== this.props.isOpen && this.props.isOpen && this.props.offerInfo.isLender) {
      this.props.emitLoanOffer({
        _id: this.props.offerInfo._id,
        lender: this.props.userInfo._id,
        avatar: this.props.userInfo.avatar,
        totalWagered: this.props.userInfo.totalWagered,
        accessory: this.props.userInfo.accessory,
        username: this.props.userInfo.username
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

  onBtnOkClicked = async e => {
    const { userInfo, closeOfferLoanModal, acQueryLoan, setBalance, addNewTransaction, isDarkMode, offerLoan } = this.props;
    const { responseText, loanPeriodText, interestRateText } = this.state;

    if (parseFloat(responseText) > userInfo.balance) {
      alertModal(isDarkMode, "Entered loan amount exceeds balance.");
      return;
    }
    if (parseFloat(responseText) < 0.05) {
      alertModal(isDarkMode, "MEOWNIMUM IS 0.05 RPS");
      return;
    }

    // const response = await offerLoan({
    //   loanAmount: parseFloat(responseText),
    //   loanPeriod: parseInt(loanPeriodText),
    //   interestRate: parseFloat(interestRateText),
    //   lender: userInfo._id,
    // });

    // if (response.success) {
    //   const { balance, newTransaction, message } = response;

    //   alertModal(isDarkMode, message, '-cat');
    // }
  };

  onBtnCancelClicked = e => {
    this.props.cancelledOffer({
      avatar: '',
      _id: this.props.userInfo._id,
      username: '',
      accessory: '',
      totalWagered: '',
      isLender: ''
    });
    this.props.closeOfferLoanModal();
  };

  render() {
    const { expanded, responseText, loanPeriodText, interestRateText, cancelled } = this.state;
    const { loan_amount, loan_period, apy, rank, userInfo, onlineUserList } = this.props;

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
                <h5>OFFER LOAN TO &nbsp;{this.props.offerInfo.username}</h5>
              ) : (
                <h5>LOAN OFFER FROM &nbsp;{this.props.offerInfo.username}</h5>

              )}

            <div className='thresholds' style={{ padding: '20px', overflow: 'auto' }}>
              <TableContainer style={{ maxHeight: 150, overflow: 'auto' }}>
                <Table aria-label="nice-table">
                  <TableHead style={{ textTransform: "uppercase", position: 'sticky', top: 0, zIndex: 1, backgroundColor: this.props.isDarkMode ? 'black' : 'white' }}>
                    <TableRow>
                      <TableCell style={{ textAlign: 'center' }}>
                        <div className={'player'} style={{ display: 'flex' }}>
                          <Avatar
                            className="avatar"
                            src={userInfo.avatar}
                            rank={userInfo.totalWagered}
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
                        <h6 style={{ color: '#28a745' }}>READY!</h6>
                      </TableCell>

                        {!cancelled ? (
                      <TableCell style={{ textAlign: 'center' }}>
                          <div className={'player'} style={{ display: 'flex' }}>
                            <Avatar
                              className="avatar"
                              src={this.props.offerInfo.avatar}
                              rank={this.props.offerInfo.totalWagered}
                              accessory={this.props.offerInfo.accessory}
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
                        <h6 style={{ color: '#28a745' }}>READY!</h6>
                        </TableCell>
                        ) : (
                          <TableCell>
                          <div className={'player'} style={{ display: 'flex' }}>
                            <Avatar
                              className="avatar"
                              src={this.props.offerInfo.avatar}
                              rank={this.props.offerInfo.totalWagered}
                              accessory={this.props.offerInfo.accessory}
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
                            <Button onClick={this.handleNudge}>NUDGE</Button>
                          </div>
                      </TableCell>
                        )}
                    </TableRow>

                  </TableHead>


                </Table>
              </TableContainer>


            </div>
            <TableContainer>
              <Table  >
                <TableRow style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <TableCell style={{ textAlign: "right", borderBottom: "none" }}>
                    LOAN AMOUNT
                  </TableCell>
                  <TableCell style={{ textAlign: "right", borderBottom: "none", display: 'flex', flexDirection: 'column' }}>
                    <TextField
                      variant="filled"
                      value={responseText}
                      onChange={this.handleResponseTextChange}
                      style={{ margin: "10px 0", }}
                      InputProps={{
                        endAdornment: 'RPS'
                      }}

                    />

                    <span style={{ whiteSpace: "nowrap" }}>AVAILABLE FUNDS: {convertToCurrency(userInfo.balance)}</span>
                  </TableCell>
                </TableRow>
                <TableRow style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <TableCell style={{ textAlign: "right", borderBottom: "none" }}>
                    LOAN PERIOD
                  </TableCell>
                  <TableCell style={{ textAlign: "right", borderBottom: "none" }}>

                    <TextField
                      variant="filled"
                      value={loanPeriodText}
                      onChange={this.handleLoanPeriodTextChange}
                      style={{ margin: "10px 0", }}
                      InputProps={{
                        endAdornment: 'DAYS'
                      }}

                    />
                  </TableCell>
                </TableRow>
                <TableRow style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <TableCell style={{ textAlign: "right", borderBottom: "none" }}>
                    INTEREST RATE (%)
                  </TableCell>
                  <TableCell style={{ textAlign: "right", borderBottom: "none" }}>

                    <TextField
                      variant="filled"
                      value={interestRateText}
                      onChange={this.handleInterestRateTextChange}
                      style={{ margin: "10px 0", }}
                      InputProps={{
                        endAdornment: '%'
                      }}

                    />
                  </TableCell>
                </TableRow>
              </Table>
            </TableContainer>


            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow >
                    <TableCell style={{ textAlign: "center" }}>Loan Amount</TableCell>
                    <TableCell style={{ textAlign: "center" }}>Days Left</TableCell>
                    <TableCell style={{ textAlign: "center" }}>Interest ({apy * 100}%)</TableCell>
                    {/* Add more headers for other details if needed */}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ textAlign: "center" }}>{convertToCurrency(parseFloat(responseText))}</TableCell>
                    <TableCell style={{ textAlign: "center" }}>{loan_period} days</TableCell>
                    <TableCell style={{ textAlign: "center" }}>{convertToCurrency((apy * parseFloat(responseText)) + parseFloat(responseText))}</TableCell>
                    {/* Add more cells for other details if needed */}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <h6 style={{ marginTop: "30px", marginBottom: "10px" }}>
              By clicking 'accept', you agree to the following <span onClick={this.toggleExpand} style={{ color: "#ff0000", textDecoration: "underline", cursor: "pointer" }}>terms and conditions:
              </span>
            </h6>

            {expanded && (
              <>
                <table className="terms-and-conditions-table">
                  <tbody>
                    <tr>
                      <td className="list-number">1.</td>
                      <td>The loan amount is <span style={{ color: "#ff0000" }}>[{convertToCurrency(parseFloat(responseText))}]</span>.</td>
                    </tr>
                    <tr>
                      <td className="list-number">2.</td>
                      <td>The loan period is <span style={{ color: "#ff0000" }}>[{this.props.loan_period}]</span> days.</td>
                    </tr>
                    <tr>
                      <td className="list-number">3.</td>
                      <td>You are responsible for repaying the loan within the specified period.</td>
                    </tr>
                    <tr>
                      <td className="list-number">4.</td>
                      <td>Interest may be applicable on the loan amount as per the agreed Interest Rate: <span style={{ color: "#ff0000" }}>[{this.props.apy * 100}%]</span>.</td>
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
                      <td>Clicking 'accept' offers your understanding and agreement to these terms.</td>
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
              <Button className="btn-submit" onClick={this.onBtnOkClicked}>
                OFFER LOAN
              </Button>
            ) : (
              <Button className="btn-submit" onClick={this.onBtnOkClicked}>
                ACCEPT LOAN
              </Button>
            )}
            <Button
              className="btn-back"
              onClick={this.onBtnCancelClicked}
            >
              Cancel
            </Button>
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
});

const mapDispatchToProps = {
  closeOfferLoanModal,
  offerLoan,
  setBalance,
  acCalculateRemainingLoans,
  addNewTransaction,
  acQueryLoan,
  emitLoanOffer,
  cancelledOffer
};

export default connect(mapStateToProps, mapDispatchToProps)(OfferLoanModal);
