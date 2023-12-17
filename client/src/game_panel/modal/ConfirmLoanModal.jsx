import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeConfirmLoanModal
} from '../../redux/Notification/notification.actions';
import { confirmLoan } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from '../modal/ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction } from '../../redux/Logic/logic.actions';
import { convertToCurrency } from '../../util/conversion';

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
    const { item, lender, closeConfirmLoanModal, loan_amount, setBalance, addNewTransaction, isDarkMode, confirmLoan } = this.props;
    const { responseText } = this.state;
    if (responseText > loan_amount) {
      alertModal(isDarkMode, "Entered loan amount exceeds the allowed amount.");

    }
    const response = await confirmLoan({
      loan_id: item,
      lender: lender,
      responseText: responseText,
    });
    // console.log(item, lender, response);
    if (response.success) {
      const { balance, newTransaction, message } = response;

      closeConfirmLoanModal();
      alertModal(isDarkMode, message);
      setBalance(balance);
      addNewTransaction(newTransaction);
    } else {
      alertModal(isDarkMode, response.message);
    }
  };


  onBtnCancelClicked = e => {
    this.props.closeConfirmLoanModal();
  };

  render() {
    const { expanded, responseText } = this.state;

    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>ACCEPT DEBT</h5>

            <TextField
          label="Loan"
          variant="outlined"
          value={responseText}
          onChange={this.handleResponseTextChange}
          style={{ margin: "10px 0" }}
          InputProps={{
            endAdornment: 'ETH'
          }}
        />
            <h6 style={{ marginTop: "30px", marginBottom: "10px"}}>
        By clicking 'accept', you agree to the following <span onClick={this.toggleExpand} style={{ color: "#ff0000", textDecoration: "underline", cursor: "pointer" }}>terms and conditions:
          </span>
      </h6>

      {expanded && (
        <>
            <table className="terms-and-conditions-table">
              <tbody>
                <tr>
                  <td className="list-number">1.</td>
                  <td>The loan amount is <span style={{color: "#ff0000"}}>[{convertToCurrency(this.props.loan_amount)}]</span>.</td>
                </tr>
                <tr>
                  <td className="list-number">2.</td>
                  <td>The loan period is <span style={{color: "#ff0000"}}>[{this.props.loan_period}]</span> days.</td>
                </tr>
                <tr>
                  <td className="list-number">3.</td>
                  <td>You are responsible for repaying the loan within the specified period.</td>
                </tr>
                <tr>
                  <td className="list-number">4.</td>
                  <td>Interest may be applicable on the loan amount as per the agreed Winnings Percentage Rate (WPR) <span style={{color: "#ff0000"}}>[{this.props.apy * 100}%]</span>.</td>
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
  addNewTransaction,
};

export default connect(mapStateToProps, mapDispatchToProps)(ConfirmLoanModal);
