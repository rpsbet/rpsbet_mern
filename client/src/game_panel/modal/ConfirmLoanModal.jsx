import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import { Table, TableBody, Button, TextField, TableCell, TableContainer, TableHead, TableRow, Tooltip, InputAdornment } from '@material-ui/core';
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
import { setBalance, getUser } from '../../redux/Auth/user.actions';
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
    background: 'transparent',
    border: 'none'
  }
};

const categories = [
  { creditScoreThreshold: 700, rankThreshold: 1, accountAgeThresholdInDays: 30, maxAllowance: 0.005 },
  { creditScoreThreshold: 700, rankThreshold: 2, accountAgeThresholdInDays: 30, maxAllowance: 0.01 },
  { creditScoreThreshold: 700, rankThreshold: 3, accountAgeThresholdInDays: 30, maxAllowance: 0.02 },
  { creditScoreThreshold: 700, rankThreshold: 6, accountAgeThresholdInDays: 30, maxAllowance: 0.03 },
  { creditScoreThreshold: 700, rankThreshold: 9, accountAgeThresholdInDays: 30, maxAllowance: 0.04 },
  { creditScoreThreshold: 700, rankThreshold: 10, accountAgeThresholdInDays: 30, maxAllowance: 0.05 },
  { creditScoreThreshold: 700, rankThreshold: 11, accountAgeThresholdInDays: 30, maxAllowance: 0.075 },
  { creditScoreThreshold: 700, rankThreshold: 12, accountAgeThresholdInDays: 30, maxAllowance: 0.1 },
  { creditScoreThreshold: 700, rankThreshold: 13, accountAgeThresholdInDays: 30, maxAllowance: 0.2 },
  { creditScoreThreshold: 700, rankThreshold: 14, accountAgeThresholdInDays: 30, maxAllowance: 0.4 },
  { creditScoreThreshold: 700, rankThreshold: 15, accountAgeThresholdInDays: 30, maxAllowance: 0.8 },
  { creditScoreThreshold: 700, rankThreshold: 16, accountAgeThresholdInDays: 30, maxAllowance: 1.5 },
  { creditScoreThreshold: 700, rankThreshold: 17, accountAgeThresholdInDays: 30, maxAllowance: 1.75 },
  { creditScoreThreshold: 700, rankThreshold: 18, accountAgeThresholdInDays: 30, maxAllowance: 2 },
  { creditScoreThreshold: 700, rankThreshold: 19, accountAgeThresholdInDays: 30, maxAllowance: 2.25 },
  { creditScoreThreshold: 700, rankThreshold: 20, accountAgeThresholdInDays: 30, maxAllowance: 2.5 },
  { creditScoreThreshold: 700, rankThreshold: 21, accountAgeThresholdInDays: 30, maxAllowance: 3 },
  { creditScoreThreshold: 700, rankThreshold: 22, accountAgeThresholdInDays: 30, maxAllowance: 3.3 },
  { creditScoreThreshold: 700, rankThreshold: 23, accountAgeThresholdInDays: 30, maxAllowance: 3.6 },
  { creditScoreThreshold: 700, rankThreshold: 24, accountAgeThresholdInDays: 30, maxAllowance: 3.9 },
  { creditScoreThreshold: 700, rankThreshold: 25, accountAgeThresholdInDays: 30, maxAllowance: 4.2 },
  { creditScoreThreshold: 700, rankThreshold: 26, accountAgeThresholdInDays: 30, maxAllowance: 4.4 },
  { creditScoreThreshold: 700, rankThreshold: 27, accountAgeThresholdInDays: 30, maxAllowance: 4.6 },
  { creditScoreThreshold: 700, rankThreshold: 28, accountAgeThresholdInDays: 30, maxAllowance: 4.8 },
  { creditScoreThreshold: 700, rankThreshold: 29, accountAgeThresholdInDays: 30, maxAllowance: 5 },
  { creditScoreThreshold: 700, rankThreshold: 30, accountAgeThresholdInDays: 30, maxAllowance: 6 },
  { creditScoreThreshold: 700, rankThreshold: 31, accountAgeThresholdInDays: 30, maxAllowance: 7 },
  { creditScoreThreshold: 700, rankThreshold: 32, accountAgeThresholdInDays: 30, maxAllowance: 8 },
  { creditScoreThreshold: 700, rankThreshold: 33, accountAgeThresholdInDays: 30, maxAllowance: 10 },
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

  getAccountAgeInDays = (createdAt) => {
    const accountCreatedAt = new Date(createdAt);
    const currentDate = new Date();
    const accountAgeInMilliseconds = currentDate - accountCreatedAt;
    return Math.floor(accountAgeInMilliseconds / (24 * 60 * 60 * 1000));
  };

  getHighlightedRowIndex = (categories, rank, accountAgeInDays) => {
    const currentRank = getRank(rank);
    let bestCategoryIndex = -1;

    for (let i = 0; i < categories.length; i++) {
      const category = categories[i];
      if (currentRank >= category.rankThreshold && accountAgeInDays >= category.accountAgeThresholdInDays) {
        bestCategoryIndex = i;
      }
    }
    return bestCategoryIndex;
  };

  handleResponseTextChange = (e) => {
    const inputValue = e.target.value;
    const parsedValue = inputValue.match(/^\d*\.?\d*$/);
    this.setState({ responseText: parsedValue ? parsedValue[0] : "" });
  };

  onBtnOkClicked = async () => {
    const { item, lender, closeConfirmLoanModal, acCalculateRemainingLoans, loan_amount, acQueryLoan, addNewTransaction, isDarkMode, confirmLoan } = this.props;
    const { responseText } = this.state;

    if (parseFloat(responseText) > loan_amount) {
      alertModal(isDarkMode, "Entered loan amount exceeds the allowed amount.");
      return;
    }

    if (parseFloat(responseText) < 0.05) {
      alertModal(isDarkMode, "MEOWNIMUM IS 0.05 RPS");
      return;
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
      addNewTransaction(newTransaction);
      getUser(true, 5);
      acQueryLoan();
      // acCalculateRemainingLoans();
    } else {
      closeConfirmLoanModal();
      alertModal(isDarkMode, response.message);
    }
  };

  onBtnCancelClicked = () => {
    this.props.closeConfirmLoanModal();
  };

  render() {
    const { expanded, responseText } = this.state;
    const { loan_amount, loan_period, apy, rank, created_at, solPrice, isDarkMode } = this.props;
    const tableCellStyle = { textAlign: 'center' };
    const accountAgeInDays = this.getAccountAgeInDays(created_at);

    const highlightedRowIndex = this.getHighlightedRowIndex(
      categories,
      rank,
      accountAgeInDays,
    );

    const maxAllowance = highlightedRowIndex >= 0 ? categories[highlightedRowIndex].maxAllowance : 0;

    let errorMessage = '';
    if (parseFloat(responseText) > loan_amount) {
      errorMessage = `The entered amount exceeds the loan limit of ${loan_amount} SOL.`;
    } else if (parseFloat(responseText) > maxAllowance) {
      errorMessage = `The entered amount exceeds the maximum allowance of ${maxAllowance} SOL for your rank.`;
    }

    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>ACCEPT DEBT</h5>
            <div className='thresholds' style={{ overflow: 'auto', margin: "30px 0" }}>
              <TableContainer style={{ maxHeight: 150, overflow: 'auto' }}>
                <Table aria-label="nice-table">
                  <TableHead
                    style={{
                      textTransform: "uppercase",
                      position: "sticky",
                      top: 0,
                      zIndex: 1,
                      background: isDarkMode
                        ? "linear-gradient(45deg, #63077eb5, #f23c3c9c)"
                        : "linear-gradient(45deg, rgba(253, 247, 255, 0.37), rgba(255, 174, 0, 0.56))",
                    }}
                  >
                    <TableRow>
                      <TableCell style={{ textAlign: "center" }}>Rank</TableCell>
                      <TableCell style={{ textAlign: "center" }}>Max Allowance (SOL)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categories.map((category, index) => {
                      if (index < highlightedRowIndex) {
                        return null; // Skip rendering rows before the highlighted one
                      }

                      return (
                        <TableRow
                          key={index}
                          style={{
                            background: highlightedRowIndex === index ? '#28a745' : '',
                          }}
                        >
                          <TableCell style={{ padding: '0', textAlign: 'center' }}>
                            <Lottie
                              options={{
                                loop: true,
                                autoplay: true,
                                animationData: rankIcon,
                              }}
                              style={{
                                height: '22px',
                                width: '22px',
                                display: 'inline-block',
                              }}
                            />
                            &nbsp;<span style={{ transform: 'translateY(4px)' }}>{category.rankThreshold}</span>
                          </TableCell>
                          <TableCell style={{ textAlign: 'center', padding: '0' }}>
                            <span>
                              {category.maxAllowance} ({convertToCurrency(category.maxAllowance, solPrice)})
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Disclaimer Text */}
              <div
                className='roll-tag label'
                style={{
                  marginTop: '10px',
                  fontStyle: 'italic',
                  textAlign: 'center',
                }}
              >
                You must have a credit score above 700 and an account age of at least 30 days to be eligible.
              </div>
            </div>
            <TableContainer>
              <Table>
                <TableBody>
                  {/* Available Funds Row */}
                  <TableRow className='roll-tag'>
                    <TableCell style={{ borderBottom: "none" }}>
                      <span style={{ whiteSpace: "nowrap" }}>AVAILABLE FUNDS:</span>
                    </TableCell>
                    <TableCell
                      className={`label ${responseText > loan_amount ? "red-text" : "green-text"}`}
                      style={{ borderBottom: "none" }}
                    >
                      {loan_amount} SOL ({convertToCurrency(loan_amount, solPrice)})
                    </TableCell>
                  </TableRow>

                  {/* TextField on its own line */}
                  <TableRow>
                    <TableCell colSpan={2} style={{ textAlign: "center", borderBottom: "none" }}>
                      <TextField
                        label="Loan"
                        variant="filled"
                        className="label"
                        value={responseText}
                        onChange={this.handleResponseTextChange}
                        style={{ margin: "10px 0", width: "80%" }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              &nbsp;SOL
                            </InputAdornment>
                          ),
                        }}
                        error={!!errorMessage} // Highlight TextField in red if there's an error
                      />
                      {errorMessage && (
                        <div style={{ color: "red", fontSize: "0.875rem", marginTop: "5px" }}>
                          {errorMessage}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <TableContainer>
              <Table>
                <TableHead
                  style={{
                    textTransform: "uppercase",
                    position: "sticky",
                    top: 0,
                    zIndex: 1,
                    background: isDarkMode
                      ? "linear-gradient(45deg, #63077eb5, #f23c3c9c)"
                      : "linear-gradient(45deg, rgba(253, 247, 255, 0.37), rgba(255, 174, 0, 0.56))"
                  }}
                >
                  <TableRow>
                    <TableCell style={tableCellStyle}>
                      Loan Amount
                    </TableCell>
                    <TableCell style={tableCellStyle}>
                      Days Left
                    </TableCell>
                    <TableCell style={tableCellStyle}>
                      Payback Amount
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell style={{ textAlign: "center" }}>{convertToCurrency(parseFloat(responseText, solPrice))}</TableCell>
                    <TableCell style={{ textAlign: "center" }}>{loan_period} days</TableCell>
                    <TableCell style={{ textAlign: "center" }}>{<>{(apy * parseFloat(responseText)) + parseFloat(responseText)} ({convertToCurrency((apy * parseFloat(responseText)) + parseFloat(responseText), solPrice)}) <span>({apy * 100}%)</span></>}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            <h6 style={{ marginTop: "30px", marginBottom: "10px" }}>
              By clicking 'ACCEPT', you agree to the following <span onClick={this.toggleExpand} style={{ color: "#ff0000", textDecoration: "underline", cursor: "pointer" }}>terms and conditions:
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
                      <td>Clicking 'ACCEPT' confirms your understanding and agreement to these terms.</td>
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
  created_at: state.auth.user.created_at,
  isOpen: state.snackbar.showConfirmLoanModal,
  title: state.snackbar.title,
  item: state.loanReducer._id,
  lender: state.loanReducer.data.lender,
  loan_amount: state.loanReducer.data.loan_amount,
  loan_period: state.loanReducer.data.loan_period,
  remainingLoans: state.loanReducer.remainingLoans,
  apy: state.loanReducer.data.apy,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType,
  solPrice: state.logic.solPrice,
});

const mapDispatchToProps = {
  closeConfirmLoanModal,
  confirmLoan,
  getUser,
  setBalance,
  addNewTransaction,
  acCalculateRemainingLoans,
  acQueryLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmLoanModal);