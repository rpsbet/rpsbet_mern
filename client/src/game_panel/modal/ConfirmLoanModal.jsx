import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { Table, TableBody, Button, TextField, TableCell, TableContainer, TableHead, TableRow, Tooltip } from '@material-ui/core';
import { acQueryLoan, acCalculateRemainingLoans } from '../../redux/Loan/loan.action';
import Lottie from 'react-lottie';
import { convertToCurrency } from '../../util/conversion';
import { getRank } from '../../util/getRank';
import rankIcon from '../LottieAnimations/rankIcon.json';
import {
  closeConfirmLoanModal
} from '../../redux/Notification/notification.actions';
import { confirmLoan } from '../../redux/Logic/logic.actions';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
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

const categories = [
  { creditScoreThreshold: 1000, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.001 },
  { creditScoreThreshold: 1000, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
  { creditScoreThreshold: 1000, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.015 },
  { creditScoreThreshold: 1000, rankThreshold: 4, accountAgeThresholdInDays: 60, maxAllowance: 0.025 },
  { creditScoreThreshold: 1000, rankThreshold: 5, accountAgeThresholdInDays: 60, maxAllowance: 0.05 },
  { creditScoreThreshold: 1000, rankThreshold: 6, accountAgeThresholdInDays: 90, maxAllowance: 0.1 },
  { creditScoreThreshold: 950, rankThreshold: 7, accountAgeThresholdInDays: 90, maxAllowance: 0.25 },
  { creditScoreThreshold: 950, rankThreshold: 8, accountAgeThresholdInDays: 120, maxAllowance: 0.5 },
  { creditScoreThreshold: 950, rankThreshold: 9, accountAgeThresholdInDays: 120, maxAllowance: 1 },
  { creditScoreThreshold: 950, rankThreshold: 10, accountAgeThresholdInDays: 120, maxAllowance: 2 }
];


class ConfirmLoanModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      responseText: 0,
    };
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



  onBtnOkClicked = async e => {
    const { item, lender, closeConfirmLoanModal, acCalculateRemainingLoans, loan_amount, acQueryLoan, setBalance, addNewTransaction, isDarkMode, confirmLoan } = this.props;
    const { responseText } = this.state;
    if (parseFloat(responseText) > loan_amount) {
      alertModal(isDarkMode, "Entered loan amount exceeds the allowed amount.");
      return; // Do not proceed further
    }
    if (parseFloat(responseText) < 0.0005) {
      alertModal(isDarkMode, "Meownimum is 0.0005 RPS");
      return; // Do not proceed further
    }
    const response = await confirmLoan({
      loan_id: item,
      loanAmount: loan_amount,
      lender: lender,
      responseText: responseText,
    });

    if (response.success) {
      const { balance, newTransaction, message } = response;

      closeConfirmLoanModal();
      alertModal(isDarkMode, message, '-cat');
      setBalance(balance);
      addNewTransaction(newTransaction);
      acQueryLoan();
      acCalculateRemainingLoans();
    } else {
      closeConfirmLoanModal();
      alertModal(isDarkMode, response.message);
    }
  };


  onBtnCancelClicked = e => {
    this.props.closeConfirmLoanModal();
  };

  render() {
    const { expanded, responseText } = this.state;
    const { loan_amount, loan_period, apy, rank } = this.props;

    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>ACCEPT DEBT</h5>

            <div className='thresholds' style={{ padding: '20px', overflow: 'auto' }}>
              <h6 style={{ color: '#28a745' }} >ELIGIBILITY THRESHOLDS</h6>
              <TableContainer style={{ maxHeight: 150, overflow: 'auto' }}>
                <Table aria-label="nice-table">
                  <TableHead style={{ textTransform: "uppercase", position: 'sticky', top: 0, zIndex: 1, backgroundColor: this.props.isDarkMode ? 'black' : 'white' }}>
                    <TableRow>
                      <TableCell style={{ textAlign: 'center' }}>Rank</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>Account Age (Days)</TableCell>
                      <TableCell style={{ textAlign: 'center' }}>Max Allowance</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category, index) => (
                      <TableRow key={index} style={{
                        background: getRank(rank) === category.rankThreshold ? '#28a745' : ''
                      }}>
                        <TableCell style={{ padding: '0', textAlign: 'center', }}>
                          <Lottie
                            options={{
                              loop: true,
                              autoplay: true,
                              animationData: rankIcon
                            }}
                            style={{
                              height: '22px',
                              width: '22px',
                              display: 'inline-block',
                            }}
                          />&nbsp;<span style={{ transform: 'translateY(4px)' }}>{category.rankThreshold}</span>
                        </TableCell>
                        <TableCell style={{ textAlign: 'center', padding: '0' }}>
                          <span>{category.accountAgeThresholdInDays}</span>
                        </TableCell>
                        <TableCell style={{ textAlign: 'center', padding: '0' }}>
                          <span>{convertToCurrency(category.maxAllowance)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>

                </Table>
              </TableContainer>


            </div>
            <TableContainer>
              <Table>
                <TableRow>
                  <TableCell style={{ width: "20%", textAlign: "right", borderBottom: "none" }}>
                    <span style={{ whiteSpace: "nowrap" }}>AVAILABLE FUNDS:</span>
                  </TableCell>
                  <TableCell style={{ borderBottom: "none", textAlign: "right", color: 'red' }}>
                    {convertToCurrency(loan_amount)}
                  </TableCell>
                  <TextField
                    label="Loan"
                    variant="filled"
                    value={responseText}
                    onChange={this.handleResponseTextChange}
                    style={{ margin: "10px 0", width: "80%" }}
                    InputProps={{
                      endAdornment: 'RPS'
                    }}

                  />
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
                      <td>Clicking 'accept' confirms your understanding and agreement to these terms.</td>
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
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              ACCEPT
            </Button>
            <Button
              className="btn-back"
              onClick={this.props.closeConfirmLoanModal}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  rank: state.auth.totalWagered,
  isOpen: state.snackbar.showConfirmLoanModal,
  title: state.snackbar.title,
  item: state.loanReducer._id,
  lender: state.loanReducer.data.lender,
  loan_amount: state.loanReducer.data.loan_amount,
  loan_period: state.loanReducer.data.loan_period,
  apy: state.loanReducer.data.apy,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
});

const mapDispatchToProps = {
  closeConfirmLoanModal,
  confirmLoan,
  setBalance,
  acCalculateRemainingLoans,
  addNewTransaction,
  acQueryLoan
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmLoanModal);
