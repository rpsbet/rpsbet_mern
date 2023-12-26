import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeDeListLoanModal
} from '../../redux/Notification/notification.actions';
import { acQueryMyLoan, acQueryLoan} from '../../redux/Loan/loan.action';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from './ConfirmAlerts';
import { setBalance } from '../../redux/Auth/user.actions';
import { addNewTransaction, deListLoan } from '../../redux/Logic/logic.actions';

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

class DeListLoanModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loan: '',
    };
  }
  onBtnOkClicked = async e => {
    const { loan, closeDeListLoanModal, isDarkMode, deListLoan, acQueryMyLoan, acQueryLoan } = this.props;
    const response = await deListLoan({ loan_id: loan });
    if (response.success) {
      const { balance, newTransaction, message } = response;
      closeDeListLoanModal();
      alertModal(isDarkMode, message);
      setBalance(balance);
      addNewTransaction(newTransaction);
      await acQueryMyLoan(30, 1, 'loan_amount', 'standard');
      await acQueryLoan(30, 1, 'loan_amount', 'standard');
    } else {
      alertModal(isDarkMode, response.message);
    }
  };
  

  onBtnCancelClicked = e => {
    this.props.closeDeListLoanModal();
  };

  render() {
    return (
      <Modal
        isOpen={this.props.isOpen}
        style={customStyles}
      >
        <div className={this.props.isDarkMode ? 'dark_mode' : ''}>
          <div className="modal-body alert-body password-modal-body">
            <div className={`modal-icon result-icon-prize`}></div>
            <h5>WITHDRAW FUNDS?</h5>
            <br />
            <h6>Delete this loan and return funds to your wallet?</h6><br />
          </div>
          <div className="modal-footer">
            <Button className="btn-submit" onClick={this.onBtnOkClicked}>
              CONFIRM
            </Button>
            <Button
              className="btn-back"
              onClick={this.props.closeDeListLoanModal}
            >
              CANCEL
            </Button>
          </div>
        </div>
      </Modal>
    );
  }
}

const mapStateToProps = state => ({
  isDarkMode: state.auth.isDarkMode,
  isOpen: state.snackbar.showDeListLoanModal,
  title: state.snackbar.title,
  loan: state.loanReducer._id,
  loan_amount: state.loanReducer.loan_amount,
  // loan_amount: state.loanReducer.data.loan_amount,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeDeListLoanModal,
  deListLoan,
  setBalance,
  addNewTransaction,
  acQueryMyLoan,
  acQueryLoan
};

export default connect(mapStateToProps, mapDispatchToProps)(DeListLoanModal);
