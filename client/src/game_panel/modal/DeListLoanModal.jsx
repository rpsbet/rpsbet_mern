import React, { Component } from 'react';
import Modal from 'react-modal';
import { connect } from 'react-redux';
import {
  closeDeListLoanModal
} from '../../redux/Notification/notification.actions';
import { deListLoan } from '../../redux/Logic/logic.actions';
import { Button, TextField } from '@material-ui/core';
import { alertModal } from './ConfirmAlerts';

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
    const { loan, closeDeListLoanModal, isDarkMode, deListLoan } = this.props;
    console.log("loan", loan);
    const response = await deListLoan({ loan_id: loan });
    if (response.success) {
      const { message } = response;
  
      closeDeListLoanModal();
      alertModal(isDarkMode, message);
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
            <div className={`modal-icon result-icon-trade`}></div>
            <h5>CONFIRM DE-LISTING</h5>
            <h6>{this.props.loan}</h6>
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
  price: state.loanReducer.data.price,
  loan_amount: state.loanReducer.data.loan_amount,
  alertMessage: state.snackbar.alertMessage,
  alertType: state.snackbar.alertType
});

const mapDispatchToProps = {
  closeDeListLoanModal,
  deListLoan,
};

export default connect(mapStateToProps, mapDispatchToProps)(DeListLoanModal);
